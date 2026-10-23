import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
} from 'flowbite-react';
import { HiOutlineClipboardCopy } from 'react-icons/hi';
import { useToast } from '../../context/ToastContext';
import { useCredits } from '../../context/CreditsContext';
import {
  cancelRechargeOrder,
  createRechargeOrder,
  informPayment,
  listPackages,
  listRechargeOrders,
} from '../../api/credits';
import { formatCurrency, formatDateTime } from '../../utils/format';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const STATUS_LABELS = {
  pending: { label: 'Aguardando pagamento', color: 'warning' },
  informed: { label: 'Pagamento informado', color: 'info' },
  confirmed: { label: 'Confirmado', color: 'success' },
  rejected: { label: 'Não confirmado', color: 'failure' },
  cancelled: { label: 'Cancelado', color: 'gray' },
};

function BalanceCard({ title, value, hint }) {
  return (
    <Card className="border-line">
      <p className="text-sm text-ink-soft">{title}</p>
      <p className="text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </Card>
  );
}

function InformModal({ order, onClose, onDone }) {
  const showToast = useToast();
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFile(e) {
    const picked = e.target.files?.[0] || null;
    setError('');
    if (picked && !RECEIPT_TYPES.includes(picked.type)) {
      setError('O comprovante deve ser uma imagem (JPG, PNG, WEBP) ou PDF.');
      setFile(null);
      return;
    }
    if (picked && picked.size > MAX_RECEIPT_BYTES) {
      setError('O comprovante deve ter no máximo 5 MB.');
      setFile(null);
      return;
    }
    setFile(picked);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await informPayment(order.id, { payerNote: note.trim(), receipt: file });
      showToast('Pagamento informado! Assim que confirmarmos, suas entregas são liberadas.');
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show onClose={onClose} size="md">
      <ModalHeader>Já paguei</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              Vamos avisar o administrador para conferir o Pix. Suas entregas entram no saldo assim
              que o pagamento for confirmado.
            </p>
            {error && <Alert color="failure">{error}</Alert>}
            <div>
              <Label htmlFor="payerNote" className="mb-1 block">
                Observação (opcional)
              </Label>
              <Textarea
                id="payerNote"
                rows={2}
                maxLength={200}
                placeholder="Ex: paguei pelo banco X às 14h"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="receipt" className="mb-1 block">
                Comprovante (opcional)
              </Label>
              <input
                id="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFile}
                className="block w-full text-sm"
              />
              <p className="mt-1 text-xs text-ink-soft">Imagem ou PDF, até 5 MB.</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="submit"
            className="bg-orange text-white enabled:hover:bg-orange-dark"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Enviar aviso'}
          </Button>
          <Button color="gray" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function OpenOrderPanel({ order, onInform, onCancel, busy }) {
  const showToast = useToast();
  const informed = order.status === 'informed';

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(order.pixPayload);
      showToast('Código Pix copiado!');
    } catch {
      showToast('Não foi possível copiar. Selecione o código e copie manualmente.', 'error');
    }
  }

  return (
    <Card className="border-orange">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Pedido {order.code} · {order.package.name}
        </h2>
        <Badge color={STATUS_LABELS[order.status].color}>{STATUS_LABELS[order.status].label}</Badge>
      </div>

      <p className="text-sm text-ink-soft">
        {order.package.deliveries} entregas por{' '}
        <strong className="text-ink">{formatCurrency(order.package.price)}</strong>. Pague com o Pix
        abaixo — o valor já vai preenchido.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {order.qrCodeDataUrl && (
          <img
            src={order.qrCodeDataUrl}
            alt="QR code do Pix"
            className="h-52 w-52 rounded-lg border border-line"
          />
        )}
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="pixCode">Pix copia e cola</Label>
          <textarea
            id="pixCode"
            readOnly
            rows={4}
            value={order.pixPayload || ''}
            className="w-full rounded-lg border border-line bg-cream p-2 font-mono text-xs"
          />
          <Button color="gray" size="sm" onClick={copyCode}>
            <HiOutlineClipboardCopy className="mr-2 h-4 w-4" />
            Copiar código Pix
          </Button>
        </div>
      </div>

      {informed ? (
        <Alert color="info">
          Recebemos seu aviso{order.informedAt ? ` em ${formatDateTime(order.informedAt)}` : ''}. Estamos
          conferindo o pagamento; você será avisado aqui quando for confirmado.
        </Alert>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-orange text-white enabled:hover:bg-orange-dark"
            onClick={onInform}
            disabled={busy}
          >
            Já paguei
          </Button>
          <Button color="gray" onClick={onCancel} disabled={busy}>
            Cancelar pedido
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function CreditosPage() {
  const showToast = useToast();
  const { credits, openOrder, refresh } = useCredits();
  const [packages, setPackages] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [informing, setInforming] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [pk, od] = await Promise.all([listPackages(), listRechargeOrders()]);
      setPackages(pk.packages);
      setOrders(od.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Quando o saldo/pedido muda (ex.: admin confirmou), atualiza o histórico.
  const orderStatus = openOrder?.status;
  useEffect(() => {
    if (!loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStatus, credits?.available]);

  async function handleBuy(pkg) {
    setBusy(true);
    setError('');
    try {
      await createRechargeOrder(pkg.id);
      await refresh();
    } catch (err) {
      setError(err.message);
      if (err.status === 409) await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError('');
    try {
      await cancelRechargeOrder(openOrder.id);
      showToast('Pedido cancelado.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleInformed() {
    setInforming(false);
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-bold">Comprar entregas</h1>
        <p className="text-sm text-ink-soft">
          Compre um pacote, pague por Pix e use as entregas quando quiser. Elas não vencem.
        </p>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {credits && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BalanceCard
            title="Disponíveis para pedir"
            value={credits.availableToRequest}
            hint="Já descontadas as entregas em andamento"
          />
          <BalanceCard title="Entregas compradas" value={credits.purchased} />
          <BalanceCard title="Entregas grátis" value={credits.free} />
        </div>
      )}

      {openOrder ? (
        <OpenOrderPanel
          order={openOrder}
          busy={busy}
          onInform={() => setInforming(true)}
          onCancel={handleCancel}
        />
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Escolha um pacote</h2>
          {packages && packages.length === 0 && (
            <p className="text-sm text-ink-soft">Nenhum pacote disponível no momento.</p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(packages || []).map((pkg) => (
              <Card key={pkg.id} className="border-line">
                <h3 className="text-base font-semibold">{pkg.name}</h3>
                <p className="text-2xl font-bold">{pkg.deliveries} entregas</p>
                <p className="text-sm text-ink-soft">
                  {formatCurrency(pkg.price)} · {formatCurrency(pkg.unitPrice)} por entrega
                </p>
                <Button
                  className="bg-orange text-white enabled:hover:bg-orange-dark"
                  disabled={busy}
                  onClick={() => handleBuy(pkg)}
                  aria-label={`Comprar ${pkg.name}`}
                >
                  Comprar
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Meus pedidos</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-ink-soft">Você ainda não fez nenhum pedido.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-white">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {o.code} · {o.package.name} ({o.package.deliveries} entregas)
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatDateTime(o.createdAt)} · {formatCurrency(o.package.price)}
                  </p>
                  {o.status === 'rejected' && o.rejectionReason && (
                    <p className="text-xs text-red">Motivo: {o.rejectionReason}</p>
                  )}
                </div>
                <Badge color={STATUS_LABELS[o.status]?.color || 'gray'}>
                  {STATUS_LABELS[o.status]?.label || o.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {informing && openOrder && (
        <InformModal order={openOrder} onClose={() => setInforming(false)} onDone={handleInformed} />
      )}
    </div>
  );
}
