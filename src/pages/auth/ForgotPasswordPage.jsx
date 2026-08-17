import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Alert, Spinner } from 'flowbite-react';
import { requestPasswordCode, verifyPasswordCode, resetPassword } from '../../api/storeAuth';
import CodeInput from '../../components/ui/CodeInput';
import PasswordInput from '../../components/ui/PasswordInput';

const STEPS = {
  EMAIL: 1,
  CODE: 2,
  NEW_PASSWORD: 3,
};

const CODE_LENGTH = 4;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequestCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordCode(email.trim());
      setStep(STEPS.CODE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      await verifyPasswordCode(email.trim(), code);
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), code, password });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-ink">Recuperar senha</h2>
      <p className="mb-6 text-sm text-ink-soft">
        {step === STEPS.EMAIL && 'Informe o e-mail cadastrado da sua loja.'}
        {step === STEPS.CODE && (
          <>
            Digite o código de {CODE_LENGTH} dígitos enviado para{' '}
            <span className="font-medium text-ink">{email}</span>.
          </>
        )}
        {step === STEPS.NEW_PASSWORD && 'Escolha uma nova senha para sua conta.'}
      </p>

      {/* Indicador de progresso */}
      <div className="mb-6 flex items-center gap-2">
        {[STEPS.EMAIL, STEPS.CODE, STEPS.NEW_PASSWORD].map((s) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-orange' : 'bg-line'}`}
          />
        ))}
      </div>

      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}

      {step === STEPS.EMAIL && (
        <form className="flex flex-col gap-4" onSubmit={handleRequestCode}>
          <div>
            <Label htmlFor="email" className="mb-1 block">
              E-mail
            </Label>
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" color="warning" className="bg-orange text-white enabled:hover:bg-orange-dark" disabled={loading} isProcessing={loading}>
            {!loading ? 'Enviar Código' : <Spinner size="sm" />}
          </Button>
        </form>
      )}

      {step === STEPS.CODE && (
        <form className="flex flex-col items-center gap-6" onSubmit={handleVerifyCode}>
          <CodeInput length={CODE_LENGTH} value={code} onChange={setCode} disabled={loading} autoFocus />

          <Button
            type="submit"
            color="warning"
            className="w-full bg-orange text-white enabled:hover:bg-orange-dark"
            isProcessing={loading}
            disabled={code.length !== CODE_LENGTH || loading}
          >
            {!loading ? 'Confirmar Código' : <Spinner size="sm" />}
          </Button>
          <button
            type="button"
            onClick={() => {
              setCode('');
              setStep(STEPS.EMAIL);
            }}
            disabled={loading}
            className="text-center text-sm text-ink-soft hover:underline disabled:opacity-50"
          >
            Usar outro e-mail
          </button>
        </form>
      )}

      {step === STEPS.NEW_PASSWORD && (
        <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
          <div>
            <Label htmlFor="password" className="mb-1 block">
              Nova senha
            </Label>
            <PasswordInput
              id="password"
            
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="mb-1 block">
              Confirmar nova senha
            </Label>
            <PasswordInput
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" color="warning" className="bg-orange text-white enabled:hover:bg-orange-dark" disabled={loading} isProcessing={loading}>
            {!loading ? 'Refefinir Senha' : <Spinner size="sm" />}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Lembrou a senha?{' '}
        <Link to="/login" className="font-medium text-orange-dark hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}