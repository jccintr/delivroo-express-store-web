import { useState } from 'react';
import { Button, Label, TextInput, Card, Alert } from 'flowbite-react';
import { useAuth } from '../../context/AuthContext';

export default function PerfilLojaPage() {
  const { store } = useAuth();
  const [form, setForm] = useState({
    name: store?.name || '',
    phone: store?.phone || '',
    street: store?.address?.street || '',
    number: store?.address?.number || '',
    complement: store?.address?.complement || '',
    district: store?.address?.district || '',
    city: store?.address?.city || '',
    state: store?.address?.state || '',
    zipCode: store?.address?.zipCode || '',
  });
  const [saved, setSaved] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: chamar endpoint de atualização de perfil quando disponível na API
    setSaved(true);
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Perfil da loja</h1>
      <p className="mb-6 text-sm text-ink-soft">Dados cadastrais e endereço exibidos para os clientes.</p>

      {saved && (
        <Alert color="success" className="mb-4" onDismiss={() => setSaved(false)}>
          Alterações salvas com sucesso.
        </Alert>
      )}

      <Card className="border-line">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="mb-1 block">
                Nome da loja
              </Label>
              <TextInput id="name" name="name" value={form.name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1 block">
                Telefone
              </Label>
              <TextInput id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <hr className="border-line" />
          <p className="text-sm font-medium text-ink">Endereço</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="street" className="mb-1 block">
                Rua
              </Label>
              <TextInput id="street" name="street" value={form.street} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="number" className="mb-1 block">
                Número
              </Label>
              <TextInput id="number" name="number" value={form.number} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="complement" className="mb-1 block">
                Complemento
              </Label>
              <TextInput id="complement" name="complement" value={form.complement} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="district" className="mb-1 block">
                Bairro
              </Label>
              <TextInput id="district" name="district" value={form.district} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="city" className="mb-1 block">
                Cidade
              </Label>
              <TextInput id="city" name="city" value={form.city} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="state" className="mb-1 block">
                Estado
              </Label>
              <TextInput id="state" name="state" value={form.state} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="zipCode" className="mb-1 block">
                CEP
              </Label>
              <TextInput id="zipCode" name="zipCode" value={form.zipCode} onChange={handleChange} />
            </div>

          </div>

          

          <div>
            <Button type="submit" color="warning" className="bg-orange text-white enabled:hover:bg-orange-dark">
              Salvar alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
