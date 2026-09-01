import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Label, TextInput, Select, Alert, Spinner } from 'flowbite-react';
import { registerStore } from '../../api/storeAuth';
import { fetchActiveCities } from '../../api/cities';
import PasswordInput from '../../components/ui/PasswordInput';
import PhoneInput from '../../components/ui/PhoneInput';


export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', cityId: '' });
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCities() {
      try {
        const data = await fetchActiveCities();
        if (active) setCities(data);
      } catch (err) {
        if (active) setCitiesError(err.message);
      } finally {
        if (active) setLoadingCities(false);
      }
    }

    loadCities();
    return () => {
      active = false;
    };
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerStore(form);
      navigate('/login', {
        replace: true,
        state: { justRegistered: true, email: form.email },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-ink">Cadastrar loja</h2>
      <p className="mb-6 text-sm text-ink-soft">Crie sua conta para começar a vender no Delivroo.</p>

      {error && (
        <Alert color="failure" className="mb-4">
          {error}
        </Alert>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name" className="mb-1 block">
            Nome da loja
          </Label>
          <TextInput id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="email" className="mb-1 block">
            E-mail
          </Label>
          <TextInput
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone" className="mb-1 block">
            Telefone
          </Label>
          <PhoneInput
            id="phone"
            name="phone"
            
            placeholder="(35) 99999-9999"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="cityId" className="mb-1 block">
            Cidade
          </Label>
          <Select
            id="cityId"
            name="cityId"
            value={form.cityId}
            onChange={handleChange}
            disabled={loadingCities || !!citiesError}
            required
          >
            <option value="">
              {loadingCities ? 'Carregando cidades...' : 'Selecione'}
            </option>
            {cities.map((city) => (
              <option key={city._id} value={city._id}>
                {city.name} - {city.state}
              </option>
            ))}
          </Select>
          {citiesError && (
            <p className="mt-1 text-sm text-red-600">
              Não foi possível carregar as cidades. Recarregue a página.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="mb-1 block">
            Senha
          </Label>
          <PasswordInput
            id="password"
            name="password"
           
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <Button
          type="submit"
          color="warning"
          className="mt-2 bg-orange text-white enabled:hover:bg-orange-dark"
          isProcessing={loading}
          disabled={loading}
        >
          {!loading ? 'Criar Conta' : <Spinner size="sm" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Já tem uma conta?{' '}
        <Link to="/login" className="font-medium text-orange-dark hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}