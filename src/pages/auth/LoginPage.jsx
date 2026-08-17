import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Alert } from 'flowbite-react';
import { useAuth } from '../../context/AuthContext';


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      //await login(form);
      const storeData = await login(form);

      if (!storeData?.emailVerifiedAt) {
        navigate('/verificar-conta', { replace: true });
        return;
      }
      
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-ink">Entrar</h2>
      <p className="mb-6 text-sm text-ink-soft">Acesse o painel da sua loja.</p>

      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email" className="mb-1 block">
            E-mail
          </Label>
          <TextInput
            id="email"
            name="email"
            type="email"
            placeholder="voce@sualoja.com.br"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/esqueci-senha" className="text-xs font-medium text-orange-dark hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <TextInput
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" color="warning" className="mt-2 bg-orange text-white enabled:hover:bg-orange-dark" isProcessing={loading}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Ainda não tem uma conta?{' '}
        <Link to="/cadastro" className="font-medium text-orange-dark hover:underline">
          Cadastre sua loja
        </Link>
      </p>
    </div>
  );
}
