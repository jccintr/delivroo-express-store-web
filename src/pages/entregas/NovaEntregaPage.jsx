import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Label, Select, Textarea, TextInput, Spinner } from 'flowbite-react';
import { HiCheckCircle } from 'react-icons/hi';
import { useToast } from '../../context/ToastContext';
import { createDelivery } from '../../api/deliveries';
import PhoneInput from '../../components/ui/PhoneInput';
import AddressAutocompleteInput from '../../components/ui/AddressAutocompleteInput';

const PACKAGE_CATEGORIES = ['Comida', 'Documentos', 'Pacote', 'Medicamentos', 'Peças', 'Outros'];
const PAYMENT_METHODS = ['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Pago', 'Nada a Pagar'];

const INITIAL_FORM = {
  destinoNome: '',
  destinoTelefone: '',
  destinoEndereco: '',
  destinoLat: null,
  destinoLng: null,
  descricao: '',
  categoria: 'Comida',
  quantidade: 1,
  peso: '',
  valorDeclarado: '',
  observacoes: '',
  pagamento: 'Dinheiro',
  valorACobrar: '',
  troco: '',
};

// Converte um valor de input numérico (string, possivelmente vazia) para
// Number ou undefined — undefined faz o backend cair no default do schema.
function toOptionalNumber(value) {
  return value === '' ? undefined : Number(value);
}

export default function NovaEntregaPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPaymentPending = form.pagamento !== 'Pago' && form.pagamento !== 'Nada a Pagar';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleDestinoTextChange(value) {
    setForm((prev) => ({ ...prev, destinoEndereco: value }));
  }

  function handleDestinoSelect(place) {
    setForm((prev) => ({
      ...prev,
      destinoLat: place?.latitude ?? null,
      destinoLng: place?.longitude ?? null,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.destinoLat == null || form.destinoLng == null) {
      setError('Selecione o endereço de entrega a partir das sugestões da busca, não apenas digite.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        destino: {
          nome: form.destinoNome,
          telefone: form.destinoTelefone,
          address: form.destinoEndereco,
          latitude: form.destinoLat,
          longitude: form.destinoLng,
        },
        package: {
          description: form.descricao,
          category: form.categoria,
          quantity: Number(form.quantidade) || 1,
          weight: toOptionalNumber(form.peso),
          declaredvalue: toOptionalNumber(form.valorDeclarado),
          notes: form.observacoes || undefined,
          payment: form.pagamento,
          amountDue: toOptionalNumber(form.valorACobrar),
          cashChange: toOptionalNumber(form.troco),
        },
      };

      await createDelivery(payload);
      showToast('Entrega criada com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Nova entrega</h1>
        <p className="text-sm text-ink-soft">
          Informe os dados do destinatário e do pacote. Um entregador será atribuído depois, não é
          preciso escolher agora.
        </p>
      </div>

      <Card className="border-line">
        {error && (
          <Alert color="failure" className="mb-4" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <section className="flex flex-col gap-4">
            <p className="text-sm font-medium text-ink">Destinatário</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="destinoNome" className="mb-1 block">
                  Nome
                </Label>
                <TextInput
                  id="destinoNome"
                  name="destinoNome"
                  value={form.destinoNome}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="destinoTelefone" className="mb-1 block">
                  Telefone
                </Label>
                <PhoneInput
                  id="destinoTelefone"
                  name="destinoTelefone"
                  value={form.destinoTelefone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="destinoEndereco" className="mb-1 block">
                Endereço de entrega
              </Label>
              <AddressAutocompleteInput
                id="destinoEndereco"
                name="destinoEndereco"
                placeholder="Comece a digitar o endereço..."
                value={form.destinoEndereco}
                onTextChange={handleDestinoTextChange}
                onSelect={handleDestinoSelect}
                required
              />
              {form.destinoLat != null && form.destinoLng != null ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-green">
                  <HiCheckCircle className="h-4 w-4" />
                  Localização confirmada
                </p>
              ) : (
                <p className="mt-1 text-xs text-ink-soft">
                  Digite o endereço e selecione uma das sugestões da lista.
                </p>
              )}
            </div>
          </section>

          <hr className="border-line" />

          <section className="flex flex-col gap-4">
            <p className="text-sm font-medium text-ink">Pacote</p>

            <div>
              <Label htmlFor="descricao" className="mb-1 block">
                Descrição
              </Label>
              <TextInput
                id="descricao"
                name="descricao"
                placeholder="Ex: 2 marmitas + refrigerante"
                value={form.descricao}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="categoria" className="mb-1 block">
                  Categoria
                </Label>
                <Select id="categoria" name="categoria" value={form.categoria} onChange={handleChange}>
                  {PACKAGE_CATEGORIES.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="quantidade" className="mb-1 block">
                  Quantidade
                </Label>
                <TextInput
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantidade}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="peso" className="mb-1 block">
                  Peso (kg)
                </Label>
                <TextInput
                  id="peso"
                  name="peso"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Opcional"
                  value={form.peso}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes" className="mb-1 block">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                placeholder="Instruções para o entregador (opcional)"
                value={form.observacoes}
                onChange={handleChange}
              />
            </div>
          </section>

          <hr className="border-line" />

          <section className="flex flex-col gap-4">
            <p className="text-sm font-medium text-ink">Pagamento</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="pagamento" className="mb-1 block">
                  Forma de pagamento
                </Label>
                <Select id="pagamento" name="pagamento" value={form.pagamento} onChange={handleChange}>
                  {PAYMENT_METHODS.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="valorDeclarado" className="mb-1 block">
                  Valor declarado (R$)
                </Label>
                <TextInput
                  id="valorDeclarado"
                  name="valorDeclarado"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                  value={form.valorDeclarado}
                  onChange={handleChange}
                />
              </div>
              {isPaymentPending && (
                <div>
                  <Label htmlFor="valorACobrar" className="mb-1 block">
                    Valor a cobrar do cliente (R$)
                  </Label>
                  <TextInput
                    id="valorACobrar"
                    name="valorACobrar"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Opcional"
                    value={form.valorACobrar}
                    onChange={handleChange}
                  />
                </div>
              )}
              {form.pagamento === 'Dinheiro' && (
                <div>
                  <Label htmlFor="troco" className="mb-1 block">
                    Troco a levar (R$)
                  </Label>
                  <TextInput
                    id="troco"
                    name="troco"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Opcional"
                    value={form.troco}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-ink-soft">
                    Quanto de troco o entregador precisa levar para o cliente.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="flex gap-3">
            <Button
              type="submit"
              color="warning"
              className="bg-orange text-white enabled:hover:bg-orange-dark"
              isProcessing={loading}
              disabled={loading}
            >
              {!loading ? 'Criar Entrega' : <Spinner size="sm" />}
            </Button>
            <Button type="button" color="light" onClick={() => navigate(-1)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}