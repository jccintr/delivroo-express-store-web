import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FaturamentoPage from './FaturamentoPage';

vi.mock('../../api/deliveries', () => ({
  getStoreDashboardStats: vi.fn(),
  listStoreDeliveryHistory: vi.fn(),
}));

import { getStoreDashboardStats, listStoreDeliveryHistory } from '../../api/deliveries';

function renderPage() {
  return render(
    <MemoryRouter>
      <FaturamentoPage />
    </MemoryRouter>,
  );
}

const STATS_MOCK = {
  now: { awaitingRider: 0, inProgress: 0 },
  billing: { deliveryFee: 1.5, freeDeliveriesRemaining: 3 },
  today: { completed: 2, totalPlatformFee: 1.5, freeDeliveriesUsedCount: 1 },
  week: { completed: 10, totalPlatformFee: 12, freeDeliveriesUsedCount: 2 },
  month: { completed: 40, totalPlatformFee: 55.5, freeDeliveriesUsedCount: 3 },
  chart: [],
  topRiders: [],
  categoryBreakdown: [],
};

const HISTORY_MOCK = {
  data: [
    {
      _id: 'd1',
      status: 4,
      deliveredAt: '2026-08-20T10:00:00.000Z',
      destino: { nome: 'Maria Souza' },
      platformFee: 1.5,
      platformFeeWaived: false,
    },
    {
      _id: 'd2',
      status: 4,
      deliveredAt: '2026-08-19T10:00:00.000Z',
      destino: { nome: 'João Lima' },
      platformFee: 0,
      platformFeeWaived: true,
    },
  ],
  page: 1,
  limit: 5,
  total: 2,
  totalPages: 1,
};

describe('FaturamentoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o spinner enquanto carrega', () => {
    getStoreDashboardStats.mockReturnValue(new Promise(() => {}));
    listStoreDeliveryHistory.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByLabelText(/carregando faturamento/i)).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando a chamada falha', async () => {
    getStoreDashboardStats.mockRejectedValue(new Error('Conta ainda não verificada.'));
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();

    expect(await screen.findByText('Conta ainda não verificada.')).toBeInTheDocument();
  });

  it('mostra a taxa vigente e o saldo de entregas grátis', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();

    expect(await screen.findByText('Entregas grátis restantes')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*1,50/).length).toBeGreaterThanOrEqual(1);
  });

  it('mostra os totais do período "Hoje" por padrão, e troca ao clicar em outro período', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();

    await screen.findByText('Entregas concluídas');
    // today.completed = 2
    expect(screen.getByText('2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Este mês' }));

    // month.completed = 40
    expect(await screen.findByText('40')).toBeInTheDocument();
  });

  it('lista as cobranças recentes, com valor cobrado ou "Grátis" quando isenta', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('João Lima')).toBeInTheDocument();
    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('busca o histórico já filtrado por entregues (status=delivered)', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();

    await screen.findByText('Maria Souza');
    expect(listStoreDeliveryHistory).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'delivered', limit: 5 }),
    );
  });

  it('mostra estado vazio quando não há cobranças ainda', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue({ ...HISTORY_MOCK, data: [] });

    renderPage();

    expect(await screen.findByText(/nenhuma entrega concluída ainda/i)).toBeInTheDocument();
  });

  it('tem um link para o histórico completo', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();

    const link = await screen.findByRole('link', { name: /ver histórico completo/i });
    expect(link).toHaveAttribute('href', '/entregas/historico');
  });

  it('recarrega ao clicar em "Atualizar"', async () => {
    getStoreDashboardStats.mockResolvedValue(STATS_MOCK);
    listStoreDeliveryHistory.mockResolvedValue(HISTORY_MOCK);

    renderPage();
    await screen.findByText('Maria Souza');
    expect(getStoreDashboardStats).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
    expect(getStoreDashboardStats).toHaveBeenCalledTimes(2);
  });
});
