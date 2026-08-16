import { useState } from 'react';
import { Button, TextInput, Alert } from 'flowbite-react';
import { HiOutlineMail } from 'react-icons/hi';
import { verifyAccount } from '../../api/storeAuth';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailBanner() {
  const { updateStore } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyAccount(code.trim());
      updateStore({ emailVerifiedAt: data.emailVerifiedAt });
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-amber/30 bg-amber-bg px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-ink">
          <HiOutlineMail className="h-5 w-5 shrink-0 text-amber" />
          Confirme seu e-mail para liberar todos os recursos da sua loja.
        </div>

        {!open ? (
          <Button size="xs" color="warning" onClick={() => setOpen(true)}>
            Inserir código
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <TextInput
              sizing="sm"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono"
              maxLength={6}
              required
            />
            <Button size="xs" color="warning" type="submit" isProcessing={loading}>
              Confirmar
            </Button>
          </form>
        )}
      </div>
      {error && (
        <Alert color="failure" className="mx-auto mt-2 max-w-5xl">
          {error}
        </Alert>
      )}
    </div>
  );
}
