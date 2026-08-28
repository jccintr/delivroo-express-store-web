import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Card, Spinner } from 'flowbite-react';
import { HiOutlinePlusCircle, HiOutlineRefresh, HiOutlineXCircle } from 'react-icons/hi';
import { listStoreActiveDeliveries, cancelStoreDelivery } from '../../api/deliveries';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';
import CancelDeliveryModal from '../../components/entregas/CancelDeliveryModal';
import { formatDateTime, formatCurrency } from '../../utils/format';

// Mesma tabela de status do modelo Delivery no backend (models/delivery.js).
// Só 0-3 aparecem aqui: essa tela é só "pendentes ou em andamento" — estados
// finais (4 entregue, 5 devolvida, 6 cancelada) o backend já filtra fora.
const STATUS_INFO = {
  0: { label: 'Aguardando entregador', badgeColor: 'warning' },
  1: { label: 'Aceita pelo entregador', badgeColor: 'purple' },
  2: { label: 'Pacote retirado', badgeColor: 'purple' },
  3: { label: 'A caminho', badgeColor: 'success' },
};

export default function EntregasPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingDelivery, setCancelingDelivery] = useState(null);
  const { lastEvent, clearUnread } = useRealtime();
  const showToast = useToast();

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listStoreActiveDeliveries();
      setDeliveries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // A loja está com esta tela aberta: qualquer notificação já foi vista
  // aqui, não precisa acumular no badge da sidebar.
  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  // Um entregador aceitou/atualizou/cancelou uma entrega em algum lugar —
  // busca a lista de novo para refletir o estado atual. Um refetch
  // completo é mais simples e seguro do que tentar remendar o item certo
  // no estado local, e o endpoint é leve o bastante pra isso ser barato.
  useEffect(() => {
    if (!lastEvent) return;
    loadDeliveries();
    clearUnread();
  }, [lastEvent, loadDeliveries, clearUnread]);

  async function handleConfirmCancel(motivo) {
    await cancelStoreDelivery(cancelingDelivery._id, motivo);
    setCancelingDelivery(null);
    showToast('Entrega cancelada.', 'success');
    await loadDeliveries();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold">Entregas</h1>
          <p className="text-sm text-ink-soft">
            Entregas pendentes ou em andamento, são removidas da lista assim que forem entregues,
            devolvidas ou canceladas.
          </p>
        </div>

        <div className="flex gap-2">
          <Button color="light" onClick={loadDeliveries} disabled={loading}>
            <HiOutlineRefresh className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button
            as={Link}
            to="/entregas/nova"
            color="warning"
            className="bg-orange text-white enabled:hover:bg-orange-dark"
          >
            <HiOutlinePlusCircle className="mr-2 h-4 w-4" />
            Nova entrega
          </Button>
        </div>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando entregas" />
        </div>
      ) : deliveries.length === 0 ? (
        <Card className="border-line">
          <p className="text-sm text-ink-soft">
            Nenhuma entrega pendente ou em andamento no momento.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery._id}
              delivery={delivery}
              onCancel={() => setCancelingDelivery(delivery)}
            />
          ))}
        </div>
      )}

      {cancelingDelivery && (
        <CancelDeliveryModal
          delivery={cancelingDelivery}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelingDelivery(null)}
        />
      )}
    </div>
  );
}

function DeliveryCard({ delivery, onCancel }) {
  const statusInfo = STATUS_INFO[delivery.status] ?? { label: 'Status desconhecido', badgeColor: 'gray' };
  // Espelha a regra do backend (POST /stores/deliveries/:id/cancel): só dá
  // pra cancelar enquanto o pacote ainda não foi retirado pelo entregador.
  const canCancel = delivery.status === 0 || delivery.status === 1;

  return (
    <Card className="border-line">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge color={statusInfo.badgeColor}>{statusInfo.label}</Badge>
            <span className="text-xs text-ink-soft">{formatDateTime(delivery.createdAt)}</span>
          </div>

          <p className="font-medium text-ink">{delivery.destino?.nome}</p>
          <p className="text-sm text-ink-soft">{delivery.destino?.address}</p>
          <p className="mt-1 text-sm text-ink">{delivery.package?.description}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <div>
            <p className="text-sm font-medium text-ink">{delivery.distancia} km</p>
            <p className="text-xs text-ink-soft">Repasse: {formatCurrency(delivery.riderPayout)}</p>
          </div>
          {canCancel && (
            <Button size="xs" color="red"  onClick={onCancel}>
              <HiOutlineXCircle className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {delivery.rider && (
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <Avatar
            img={delivery.rider.avatar || undefined}
            rounded
            size="xs"
            placeholderInitials={delivery.rider.name?.charAt(0)?.toUpperCase()}
          />
          <div>
            <p className="text-sm font-medium text-ink">{delivery.rider.name}</p>
            <p className="text-xs text-ink-soft">
              {delivery.rider.vehicle?.type}
              {delivery.rider.vehicle?.plate ? ` · ${delivery.rider.vehicle.plate}` : ''}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}