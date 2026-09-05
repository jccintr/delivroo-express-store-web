import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Card, Spinner } from 'flowbite-react';
import {
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineRefresh,
  HiOutlineChartBar,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { getStoreDashboardStats, listStoreRecentDeliveries } from '../../api/deliveries';
import { formatCurrency, formatDateTime, formatMinutes } from '../../utils/format';
import { getDeliveryStatusInfo } from '../../utils/deliveryStatus';

const PERIODS = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mês' },
];

const EMPTY_PERIOD = {
  requested: 0,
  completed: 0,
  cancelledOrReturned: 0,
  totalDistance: 0,
  totalRiderPayout: 0,
  avgAcceptMinutes: null,
  avgDeliveryMinutes: null,
};

// Formata a data (AAAA-MM-DD) do gráfico como DD/MM, sem depender de fuso
// horário do navegador — o backend já manda a data "solta" ancorada em
// Brasília, então só reordenamos os pedaços da string.
function formatChartDate(isoDateStr) {
  const [, month, day] = isoDateStr.split('-');
  return `${day}/${month}`;
}

// TODO: nenhuma métrica de faturamento/receita da loja aparece aqui de
// propósito — está fora do escopo da plataforma. Tudo abaixo é sobre a
// operação de entrega em si (ver GET /stores/deliveries/dashboard na API).
export default function DashboardPage() {
  const { store } = useAuth();
  const { lastEvent, clearUnread } = useRealtime();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('today');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, recentData] = await Promise.all([
        getStoreDashboardStats(),
        listStoreRecentDeliveries({ limit: 8 }),
      ]);
      setStats(statsData);
      setRecent(recentData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // A loja está com o dashboard aberto: qualquer notificação já foi vista
  // aqui, não precisa acumular no badge da sidebar (mesmo comportamento de
  // EntregasPage).
  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  // Um entregador aceitou/atualizou/cancelou uma entrega em algum lugar —
  // busca os dados de novo para refletir o estado atual.
  useEffect(() => {
    if (!lastEvent) return;
    loadDashboard();
    clearUnread();
  }, [lastEvent, loadDashboard, clearUnread]);

  const periodStats = stats?.[period] ?? EMPTY_PERIOD;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold">Olá, {store?.name?.split(' ')[0] || 'lojista'} 👋</h1>
          <p className="text-sm text-ink-soft">Aqui está um resumo da operação de entregas da sua loja.</p>
        </div>
        <Button color="light" onClick={loadDashboard} disabled={loading}>
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
          <Spinner color="warning" size="xl" aria-label="Carregando dashboard" />
        </div>
      ) : stats ? (
        <>
          {/* Indicadores "agora" — não são por período, refletem o momento atual */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link to="/entregas">
              <Card className="border-line transition hover:border-orange-dark">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-bg text-amber">
                    <HiOutlineClock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-ink-soft">Aguardando entregador</p>
                    <p className="font-heading text-lg font-bold text-ink">{stats.now.awaitingRider}</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to="/entregas">
              <Card className="border-line transition hover:border-orange-dark">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-bg text-green">
                    <HiOutlineTruck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-ink-soft">Em andamento</p>
                    <p className="font-heading text-lg font-bold text-ink">{stats.now.inProgress}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Seletor de período */}
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

          {/* Cards do período selecionado */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              icon={HiOutlineClipboardList}
              color="bg-orange/10 text-orange-dark"
              label="Solicitadas"
              value={periodStats.requested}
            />
            <StatCard
              icon={HiOutlineCheckCircle}
              color="bg-green-bg text-green"
              label="Concluídas"
              value={periodStats.completed}
            />
            <StatCard
              icon={HiOutlineXCircle}
              color="bg-red-bg text-red"
              label="Canceladas/devolvidas"
              value={periodStats.cancelledOrReturned}
            />
            <StatCard
              icon={HiOutlineClock}
              color="bg-amber-bg text-amber"
              label="Tempo médio até aceite"
              value={formatMinutes(periodStats.avgAcceptMinutes)}
            />
            <StatCard
              icon={HiOutlineTruck}
              color="bg-amber-bg text-amber"
              label="Tempo médio de entrega"
              value={formatMinutes(periodStats.avgDeliveryMinutes)}
            />
            <StatCard
              icon={HiOutlineChartBar}
              color="bg-orange/10 text-orange-dark"
              label="Distância percorrida"
              value={`${periodStats.totalDistance} km`}
            />
            <StatCard
              icon={HiOutlineCurrencyDollar}
              color="bg-green-bg text-green"
              label="Repasse aos entregadores"
              value={formatCurrency(periodStats.totalRiderPayout)}
            />
          </div>

          {/* Gráfico de tendência (últimos 30 dias, rolante) */}
          <Card className="border-line">
            <p className="mb-4 text-sm font-medium text-ink">Entregas nos últimos 30 dias</p>
            {stats.chart.length === 0 ? (
              <p className="text-sm text-ink-soft">Sem dados suficientes ainda.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" />
                    <XAxis dataKey="_id" tickFormatter={formatChartDate} fontSize={12} stroke="#6B655D" />
                    <YAxis allowDecimals={false} fontSize={12} stroke="#6B655D" />
                    <Tooltip labelFormatter={formatChartDate} contentStyle={{ borderRadius: 8, borderColor: '#E8E2D6' }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requested"
                      name="Solicitadas"
                      stroke="#FF6B35"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Concluídas"
                      stroke="#2E9E5B"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top entregadores do mês */}
            <Card className="border-line">
              <p className="mb-3 text-sm font-medium text-ink">Top entregadores do mês</p>
              {stats.topRiders.length === 0 ? (
                <p className="text-sm text-ink-soft">Nenhuma entrega concluída este mês ainda.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {stats.topRiders.map((r, idx) => (
                    <div key={r.riderId} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-medium text-ink-soft">{idx + 1}º</span>
                      <Avatar
                        img={r.avatar || undefined}
                        rounded
                        size="xs"
                        placeholderInitials={r.name?.charAt(0)?.toUpperCase()}
                      />
                      <p className="flex-1 truncate text-sm font-medium text-ink">{r.name}</p>
                      <p className="text-sm text-ink-soft">
                        {r.deliveries} {r.deliveries === 1 ? 'entrega' : 'entregas'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Categorias de pacote do mês */}
            <Card className="border-line">
              <p className="mb-3 text-sm font-medium text-ink">Categorias de pacote este mês</p>
              {stats.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-ink-soft">Nenhuma entrega solicitada este mês ainda.</p>
              ) : (
                <CategoryBreakdown data={stats.categoryBreakdown} />
              )}
            </Card>
          </div>

          {/* Atividade recente — qualquer status, diferente das telas de
              Entregas (só ativas) e Histórico (só finalizadas) */}
          <Card className="border-line">
            <p className="mb-3 text-sm font-medium text-ink">Atividade recente</p>
            {recent.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Nenhuma entrega ainda. Assim que você criar entregas, elas aparecerão aqui em tempo real.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recent.map((delivery) => (
                  <RecentDeliveryRow key={delivery._id} delivery={delivery} />
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <Card className="border-line">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-ink-soft">{label}</p>
          <p className="truncate font-heading text-lg font-bold text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function CategoryBreakdown({ data }) {
  const total = data.reduce((sum, c) => sum + c.count, 0);
  return (
    <div className="flex flex-col gap-2">
      {data.map((c) => {
        const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
        return (
          <div key={c.category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink">{c.category}</span>
              <span className="text-ink-soft">
                {c.count} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
              <div className="h-full rounded-full bg-orange" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentDeliveryRow({ delivery }) {
  const statusInfo = getDeliveryStatusInfo(delivery.status);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge color={statusInfo.badgeColor}>{statusInfo.label}</Badge>
          <span className="text-xs text-ink-soft">{formatDateTime(delivery.updatedAt)}</span>
        </div>
        <p className="truncate text-sm font-medium text-ink">{delivery.destino?.nome}</p>
      </div>
      {delivery.rider && (
        <div className="flex shrink-0 items-center gap-2">
          <Avatar
            img={delivery.rider.avatar || undefined}
            rounded
            size="xs"
            placeholderInitials={delivery.rider.name?.charAt(0)?.toUpperCase()}
          />
          <span className="text-xs text-ink-soft">{delivery.rider.name}</span>
        </div>
      )}
    </div>
  );
}
