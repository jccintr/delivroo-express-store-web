import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Spinner } from 'flowbite-react';
import { HiOutlineRefresh, HiOutlineCurrencyDollar, HiOutlineGift, HiOutlineArrowRight } from 'react-icons/hi';
import { getStoreDashboardStats, listStoreDeliveryHistory } from '../../api/deliveries';
import { formatCurrency, formatDateTime } from '../../utils/format';

const PERIODS = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mês' },
];

const EMPTY_PERIOD = { completed: 0, totalPlatformFee: 0, freeDeliveriesUsedCount: 0 };

// Quantidade de cobranças recentes mostradas aqui — só uma prévia; a lista
// completa (com filtro por status/período) já existe em /entregas/historico,
// que também mostra a taxa de cada entrega desde que a API passou a
// retornar platformFee/platformFeeWaived nela.
const RECENT_LIMIT = 5;

export default function FaturamentoPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, historyData] = await Promise.all([
        getStoreDashboardStats(),
        listStoreDeliveryHistory({ status: 'delivered', limit: RECENT_LIMIT }),
      ]);
      setStats(statsData);
      setRecent(historyData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const periodStats = stats?.[period] ?? EMPTY_PERIOD;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold">Faturamento</h1>
          <p className="text-sm text-ink-soft">
            Taxa cobrada pela plataforma por entrega concluída e seu saldo de entregas grátis.
          </p>
        </div>
        <Button color="light" onClick={load} disabled={loading}>
          <HiOutlineRefresh className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && !stats ? (
        <div className="flex justify-center py-16">
          <Spinner color="warning" size="xl" aria-label="Carregando faturamento" />
        </div>
      ) : stats ? (
        <>
          {/* Estado atual — não é por período, é o que vale agora */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="border-line">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange-dark">
                  <HiOutlineCurrencyDollar className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-ink-soft">Taxa vigente por entrega concluída</p>
                  <p className="font-heading text-lg font-bold text-ink">
                    {formatCurrency(stats.billing.deliveryFee)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-line">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-bg text-green">
                  <HiOutlineGift className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-ink-soft">Entregas grátis restantes</p>
                  <p className="font-heading text-lg font-bold text-ink">{stats.billing.freeDeliveriesRemaining}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Seletor de período — mesmo padrão do Dashboard */}
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  period === p.key
                    ? 'bg-orange text-white'
                    : 'border border-line bg-white text-ink-soft hover:border-orange-dark'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-line">
              <p className="text-xs text-ink-soft">Entregas concluídas</p>
              <p className="font-heading text-lg font-bold text-ink">{periodStats.completed}</p>
            </Card>
            <Card className="border-line">
              <p className="text-xs text-ink-soft">Cobrado no período</p>
              <p className="font-heading text-lg font-bold text-ink">
                {formatCurrency(periodStats.totalPlatformFee)}
              </p>
            </Card>
            <Card className="border-line">
              <p className="text-xs text-ink-soft">Entregas isentas (grátis)</p>
              <p className="font-heading text-lg font-bold text-ink">{periodStats.freeDeliveriesUsedCount}</p>
            </Card>
          </div>

          {/* Prévia das cobranças mais recentes */}
          <Card className="border-line">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Cobranças recentes</p>
              <Link
                to="/entregas/historico"
                className="flex items-center gap-1 text-sm font-medium text-orange-dark hover:underline"
              >
                Ver histórico completo
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-ink-soft">Nenhuma entrega concluída ainda.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recent.map((delivery) => (
                  <RecentChargeRow key={delivery._id} delivery={delivery} />
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function RecentChargeRow({ delivery }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{delivery.destino?.nome}</p>
        <p className="text-xs text-ink-soft">{formatDateTime(delivery.deliveredAt || delivery.createdAt)}</p>
      </div>
      {delivery.platformFeeWaived ? (
        <Badge color="success">Grátis</Badge>
      ) : (
        <span className="shrink-0 text-sm font-medium text-ink">{formatCurrency(delivery.platformFee)}</span>
      )}
    </div>
  );
}
