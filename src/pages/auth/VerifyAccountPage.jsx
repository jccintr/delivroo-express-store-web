import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Spinner } from 'flowbite-react';
import { HiOutlineMailOpen } from 'react-icons/hi';
import { verifyAccount, resendAccountVerification } from '../../api/storeAuth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CodeInput from '../../components/ui/CodeInput';

const CODE_LENGTH = 4;

export default function VerifyAccountPage() {
  const { store, updateStore, logout } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const codeInputRef = useRef(null);

  const email = store?.email ?? '';
  const isComplete = code.length === CODE_LENGTH;
  const busy = loading || resending;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isComplete || busy) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const data = await verifyAccount(code);
      updateStore({ emailVerifiedAt: data.emailVerifiedAt });
      showToast('Conta verificada com sucesso!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (busy) return;
    setError('');
    setInfo('');
    setResending(true);
    try {
      await resendAccountVerification();
      setCode('');
      codeInputRef.current?.focusFirst();
      setInfo(`Um novo código foi enviado para ${email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  function handleUseAnotherAccount() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-bg">
        <HiOutlineMailOpen className="h-8 w-8 text-green" />
      </div>

      <h2 className="mb-1 text-lg font-semibold text-ink">Confirme sua conta</h2>
      <p className="mb-6 text-sm text-ink-soft">
        Enviamos um código de {CODE_LENGTH} dígitos para
        <br />
        <span className="font-medium text-ink">{email}</span>
      </p>

      {error && (
        <Alert color="failure" className="mb-4 w-full text-left">
          {error}
        </Alert>
      )}

      {info && (
        <Alert color="success" className="mb-4 w-full text-left">
          {info}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-6">
        <CodeInput
          ref={codeInputRef}
          length={CODE_LENGTH}
          value={code}
          onChange={setCode}
          disabled={busy}
          autoFocus
        />

        <Button
          type="submit"
          color="warning"
          className="w-full bg-orange text-white enabled:hover:bg-orange-dark"
          isProcessing={loading}
          disabled={!isComplete || busy}
        >
          Ativar conta
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-dark hover:underline disabled:opacity-50"
      >
        {resending && <Spinner size="sm" />}
        {resending ? 'Enviando…' : 'Reenviar código'}
      </button>

      <button
        type="button"
        onClick={handleUseAnotherAccount}
        disabled={busy}
        className="mt-3 text-sm font-medium text-ink-soft hover:underline disabled:opacity-50"
      >
        Utilizar outra conta
      </button>
    </div>
  );
}