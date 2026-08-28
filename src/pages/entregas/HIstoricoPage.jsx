import { useCallback, useEffect, useState } from 'react';
import { Alert, Avatar, Badge, Button, Card, Label, Pagination, Select, Spinner } from 'flowbite-react';
import { HiOutlineRefresh } from 'react-icons/hi';
import { listStoreDeliveryHistory } from '../../api/deliveries';
import { formatDateTime, formatCurrency } from '../../utils/format';

// Mesma tabela de status do modelo Delivery no backend (models/delivery.js),
// só que aqui restrita aos 3 estados finais que essa tela mostra.
const STATUS_INFO = {
  4: { label: 'Entregue', badgeColor: 'success' },
  5: { label: 'Devolvida', badgeColor: 'warning' },
  6: { label: 'Cancelada', badgeColor: 'failure' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'returned', label: 'Devolvida' },
  { value: 'cancelled', label: 'Cancelada' },
];

const DEFAULT_FILTERS = { status: '', from: '', to: '' };

export default function HistoricoPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listStoreDeliveryHistory({ ...filters, page });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1); // qualquer mudança de filtro reinicia a paginação
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  const hasActiveFilters = filters.status || filters.from || filters.to;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold">Histórico de entregas</h1>
          <p className="text-sm text-ink-soft">
            Entregas já concluídas, devolvidas ou canceladas.
          </p>
        </div>

        <Button color="light" onClick={loadHistory} disabled={loading}>
          <HiOutlineRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card className="border-line">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-45">
            <Label htmlFor="filtroStatus" className="mb-1 block">
              Status
            </Label>
            <Select
              id="filtroStatus"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="filtroDe" className="mb-1 block">
              De
            </Label>
            <input
              id="filtroDe"
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="block rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-orange focus:ring-orange"
            />
          </div>

          <div>
            <Label htmlFor="filtroAte" className="mb-1 block">
              Até
            </Label>
            <input
              id="filtroAte"
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="block rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-orange focus:ring-orange"
            />
          </div>

          {hasActiveFilters && (
            <Button color="light" onClick={handleClearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando histórico" />
        </div>
      ) : result.data.length === 0 ? (
        <Card className="border-line">
          <p className="text-sm text-ink-soft">
            {hasActiveFilters
              ? 'Nenhuma entrega encontrada para os filtros selecionados.'
              : 'Nenhuma entrega concluída, devolvida ou cancelada ainda.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {result.data.map((delivery) => (
            <HistoryDeliveryCard key={delivery._id} delivery={delivery} />
          ))}
        </div>
      )}

      {!loading && result.totalPages > 1 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-ink-soft">
            Página {result.page} de {result.totalPages} — {result.total} entregas no total
          </p>
          <Pagination
            layout="navigation"
            currentPage={result.page}
            totalPages={result.totalPages}
            onPageChange={setPage}
            previousLabel="Anterior"
            nextLabel="Próxima"
          />
        </div>
      )}
    </div>
  );
}

function HistoryDeliveryCard({ delivery }) {
  const statusInfo = STATUS_INFO[delivery.status] ?? { label: 'Status desconhecido', badgeColor: 'gray' };

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

          {delivery.cancelReason && (
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-medium text-ink">Motivo:</span> {delivery.cancelReason}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <p className="text-sm font-medium text-ink">{delivery.distancia} km</p>
          <p className="text-xs text-ink-soft">Repasse: {formatCurrency(delivery.riderPayout)}</p>
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