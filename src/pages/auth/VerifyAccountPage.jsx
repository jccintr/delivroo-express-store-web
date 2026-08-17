import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Spinner } from 'flowbite-react';
import { HiOutlineMailOpen } from 'react-icons/hi';
import { verifyAccount, resendAccountVerification } from '../../api/storeAuth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CODE_LENGTH = 4;

export default function VerifyAccountPage() {
  const { store, updateStore, logout } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  const email = store?.email ?? '';
  const isComplete = digits.every((d) => d !== '');
  const busy = loading || resending;

  function handleChangeDigit(value, index) {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isComplete || busy) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const data = await verifyAccount(digits.join(''));
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
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
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
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              value={digit}
              onChange={(e) => handleChangeDigit(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              inputMode="numeric"
              maxLength={1}
              disabled={busy}
              className="h-14 w-12 rounded-md border border-line text-center font-mono text-xl text-ink focus:border-orange focus:ring-orange disabled:opacity-50"
            />
          ))}
        </div>

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