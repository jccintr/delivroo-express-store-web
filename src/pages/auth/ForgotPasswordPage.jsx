import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Alert } from 'flowbite-react';
import { requestPasswordCode, verifyPasswordCode, resetPassword } from '../../api/storeAuth';

const STEPS = {
  EMAIL: 1,
  CODE: 2,
  NEW_PASSWORD: 3,
};

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
    setError('');
    setLoading(true);
    try {
      await verifyPasswordCode(email.trim(), code.trim());
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
      await resetPassword({ email: email.trim(), code: code.trim(), password });
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
            Digite o código de 6 dígitos enviado para <span className="font-medium text-ink">{email}</span>.
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
          <Button type="submit" color="warning" className="bg-orange text-white enabled:hover:bg-orange-dark" isProcessing={loading}>
            Enviar código
          </Button>
        </form>
      )}

      {step === STEPS.CODE && (
        <form className="flex flex-col gap-4" onSubmit={handleVerifyCode}>
          <div>
            <Label htmlFor="code" className="mb-1 block">
              Código de verificação
            </Label>
            <TextInput
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono"
              maxLength={6}
              placeholder="000000"
              required
            />
          </div>
          <Button type="submit" color="warning" className="bg-orange text-white enabled:hover:bg-orange-dark" isProcessing={loading}>
            Confirmar código
          </Button>
          <button
            type="button"
            onClick={() => setStep(STEPS.EMAIL)}
            className="text-center text-sm text-ink-soft hover:underline"
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
            <TextInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="mb-1 block">
              Confirmar nova senha
            </Label>
            <TextInput
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" color="warning" className="bg-orange text-white enabled:hover:bg-orange-dark" isProcessing={loading}>
            Redefinir senha
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
