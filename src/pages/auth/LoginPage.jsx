import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Alert,Spinner } from 'flowbite-react';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/ui/PasswordInput';


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: location.state?.email ?? '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

   // Captura os avisos de sucesso do state de navegação uma única vez (no state,
  // não derivado de location.state), pois o histórico é limpo logo em seguida.
  const [justRegistered] = useState(Boolean(location.state?.justRegistered));
  const [passwordReset] = useState(Boolean(location.state?.passwordReset));

  // Evita que o aviso reapareça se o usuário voltar para /login pelo histórico do navegador
  useEffect(() => {
    if (location.state?.justRegistered || location.state?.passwordReset) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

       {!error && justRegistered && (
        <Alert color="success" className="mb-4">
          Conta criada com sucesso! Faça login para continuar.
        </Alert>
      )}

      {!error && passwordReset && (
        <Alert color="success" className="mb-4">
          Senha alterada com sucesso! Faça login com sua nova senha.
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
          <PasswordInput
            id="password"
            name="password"
           // type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" color="warning" className="mt-2 bg-orange text-white enabled:hover:bg-orange-dark" disabled={loading} isProcessing={loading}>
          {!loading ? 'Entrar' : <Spinner size="sm" />}
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
