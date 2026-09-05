import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

vi.mock('../../api/deliveries', () => ({
  getStoreDashboardStats: vi.fn(),
  listStoreRecentDeliveries: vi.fn(),
}));

vi.mock('../../context/RealtimeContext', () => ({
  useRealtime: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ store: { name: 'Pizzaria do Centro' } }),
}));

// O recharts usa ResizeObserver/rAF internamente, que trava o encerramento
// do processo do Vitest em jsdom — mockamos os componentes por stubs
// simples, já que o que importa testar aqui é que os DADOS chegam certos
// no gráfico, não o comportamento interno da lib de terceiros.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { getStoreDashboardStats, listStoreRecentDeliveries } from '../../api/deliveries';
import { useRealtime } from '../../context/RealtimeContext';

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

const STATS_MOCK = {
  now: { awaitingRider: 2, inProgress: 3 },
  today: {
    requested: 5,
    completed: 3,
    cancelledOrReturned: 1,
    totalDistance: 12.5,
    totalRiderPayout: 45.9,
    avgAcceptMinutes: 8.2,
    avgDeliveryMinutes: 32.1,
  },
  week: {
    requested: 20,
    completed: 15,
    cancelledOrReturned: 2,
    totalDistance: 80.4,
    totalRiderPayout: 210.5,
    avgAcceptMinutes: 6.5,
    avgDeliveryMinutes: 28.9,
  },
  month: {
    requested: 90,
    completed: 70,
    cancelledOrReturned: 8,
    totalDistance: 400.2,
    totalRiderPayout: 950.75,
    avgAcceptMinutes: 7.1,
    avgDeliveryMinutes: 30.4,
  },
  chart: [
    { _id: '2026-08-01', requested: 3, completed: 2 },
    { _id: '2026-08-02', requested: 5, completed: 4 },
  ],
  topRiders: [
    { riderId: 'r1', name: 'Carlos Rider', avatar: null, deliveries: 12 },
    { riderId: 'r2', name: 'Ana Entregadora', avatar: null, deliveries: 7 },
  ],
  categoryBreakdown: [
    { category: 'Comida', count: 60 },
    { category: 'Documentos', count: 10 },
  ],
};

const RECENT_MOCK = [
  {
    _id: 'd1',
    status: 0,
    updatedAt: '2026-08-20T10:00:00.000Z',
    destino: { nome: 'Maria Souza' },
    rider: null,
  },
  {
    _id: 'd2',
    status: 4,
    updatedAt: '2026-08-20T09:00:00.000Z',
    destino: { nome: 'João Lima' },
    rider: { name: 'Carlos Rider', avatar: null },
  },
];

describe('DashboardPage', () => {
  let clearUnread;

  beforeEach(() => {
    vi.clearAllMocks();
    clearUnread = vi.fn();
    useRealtime.mockReturnValue({ lastEvent: null, unreadCount: 0, clearUnread });
  });

  it('mostra o spinner enquanto carrega', () => {
    getStoreDashboardStats.mockReturnValue(new Promise(() => {}));
    listStoreRecentDeliveries.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByLabelText(/carregando dashboard/i)).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando a chamada falha', async () => {
    getStoreDashboardStats.mockRejectedValue(new Error('Conta ainda não verificada.'));
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Conta ainda não verificada.')).toBeInTheDocument();
  });

  it('cumprimenta a loja pelo primeiro nome', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/olá, pizzaria/i)).toBeInTheDocument();
  });

  it('mostra os indicadores "agora" (aguardando entregador / em andamento)', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    await screen.findByText('Aguardando entregador');
    expect(screen.getByText('2')).toBeInTheDocument(); // awaitingRider (único "2" na tela)
    // "3" também aparece em Concluídas (today.completed) — checa que existe
    // pelo menos uma ocorrência em vez de exigir unicidade.
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2);
  });

  it('mostra os cards do período "Hoje" por padrão, e troca ao clicar em outro período', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    await screen.findByText('Solicitadas');
    // "today.requested" = 5
    expect(screen.getByText('5')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Este mês' }));

    // "month.requested" = 90
    expect(await screen.findByText('90')).toBeInTheDocument();
  });

  it('mostra o repasse aos entregadores formatado como moeda', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('R$ 45,90')).toBeInTheDocument();
  });

  it('mostra o top de entregadores do mês', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Carlos Rider')).toBeInTheDocument();
    expect(screen.getByText('Ana Entregadora')).toBeInTheDocument();
    expect(screen.getByText('12 entregas')).toBeInTheDocument();
  });

  it('mostra a distribuição por categoria de pacote', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Comida')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
  });

  it('mostra a atividade recente, incluindo entregas de qualquer status', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue(RECENT_MOCK);

    renderPage();

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('João Lima')).toBeInTheDocument();
    // "Aguardando entregador" também aparece no card indicador "agora" —
    // aqui só confirmamos que o badge da atividade recente também existe.
    expect(screen.getAllByText('Aguardando entregador').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Entregue')).toBeInTheDocument();
  });

  it('mostra estado vazio na atividade recente quando não há nenhuma entrega', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/nenhuma entrega ainda/i)).toBeInTheDocument();
  });

  it('nunca renderiza nada relacionado a "faturamento" ou "receita" da loja', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();
    await screen.findByText('Solicitadas');

    expect(screen.queryByText(/faturamento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/receita/i)).not.toBeInTheDocument();
  });

  it('limpa o badge de não lidas ao montar a tela', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();
    await screen.findByText('Solicitadas');

    expect(clearUnread).toHaveBeenCalled();
  });

  it('busca os dados de novo quando chega um evento em tempo real', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);
    useRealtime.mockReturnValue({ lastEvent: null, unreadCount: 0, clearUnread });

    const { rerender } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await screen.findByText('Solicitadas');
    expect(getStoreDashboardStats).toHaveBeenCalledTimes(1);

    useRealtime.mockReturnValue({
      lastEvent: { type: 'delivery:updated', event: 'accepted', delivery: { _id: 'd1' } },
      unreadCount: 0,
      clearUnread,
    });
    rerender(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getStoreDashboardStats).toHaveBeenCalledTimes(2));
  });

  it('recarrega ao clicar em "Atualizar"', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreRecentDeliveries.mockResolvedValue([]);

    renderPage();
    await screen.findByText('Solicitadas');
    expect(getStoreDashboardStats).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => expect(getStoreDashboardStats).toHaveBeenCalledTimes(2));
  });
});
