import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoricoPage from './HistoricoPage';

vi.mock('../../api/deliveries', () => ({
  listStoreDeliveryHistory: vi.fn(),
}));

import { listStoreDeliveryHistory } from '../../api/deliveries';

function emptyResult(overrides = {}) {
  return { data: [], page: 1, limit: 20, total: 0, totalPages: 1, ...overrides };
}

const ENTREGA_ENTREGUE = {
  _id: '1',
  status: 4,
  createdAt: '2026-08-20T10:00:00.000Z',
  destino: { nome: 'Maria Souza', address: 'Rua Altino Rosa, 123' },
  package: { description: '2 marmitas' },
  distancia: 3.4,
  riderPayout: 8.5,
  rider: { name: 'Carlos Rider', avatar: null, vehicle: { type: 'Moto', plate: 'ABC-1234' } },
};

const ENTREGA_CANCELADA = {
  _id: '2',
  status: 6,
  createdAt: '2026-08-19T09:00:00.000Z',
  destino: { nome: 'João Lima', address: 'Av. Central, 500' },
  package: { description: 'Documentos' },
  distancia: 1.2,
  riderPayout: 6,
  rider: null,
  cancelReason: 'Cliente desistiu da compra',
};

describe('HistoricoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o spinner enquanto carrega', () => {
    listStoreDeliveryHistory.mockReturnValue(new Promise(() => {}));

    render(<HistoricoPage />);

    expect(screen.getByLabelText(/carregando histórico/i)).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há histórico', async () => {
    listStoreDeliveryHistory.mockResolvedValue(emptyResult());

    render(<HistoricoPage />);

    expect(
      await screen.findByText(/nenhuma entrega concluída, devolvida ou cancelada ainda/i),
    ).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando a chamada falha', async () => {
    listStoreDeliveryHistory.mockRejectedValue(new Error('Conta ainda não verificada.'));

    render(<HistoricoPage />);

    expect(await screen.findByText('Conta ainda não verificada.')).toBeInTheDocument();
  });

  it('lista as entregas do histórico com status, destino, pacote e motivo de cancelamento', async () => {
    listStoreDeliveryHistory.mockResolvedValue(
      emptyResult({ data: [ENTREGA_ENTREGUE, ENTREGA_CANCELADA], total: 2 }),
    );

    render(<HistoricoPage />);

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('João Lima')).toBeInTheDocument();
    // 'Entregue'/'Cancelada' também aparecem como opção do filtro de status
    // (elemento <option>), então checamos especificamente o badge do card.
    const badgeEntregue = screen.getAllByText('Entregue').find((el) => el.closest('[data-testid="flowbite-badge"]'));
    const badgeCancelada = screen.getAllByText('Cancelada').find((el) => el.closest('[data-testid="flowbite-badge"]'));
    expect(badgeEntregue).toBeInTheDocument();
    expect(badgeCancelada).toBeInTheDocument();
    expect(screen.getByText('Carlos Rider')).toBeInTheDocument();
    expect(screen.getByText(/Cliente desistiu da compra/)).toBeInTheDocument();
  });

  it('busca a primeira página automaticamente ao montar', async () => {
    listStoreDeliveryHistory.mockResolvedValue(emptyResult());

    render(<HistoricoPage />);

    await waitFor(() =>
      expect(listStoreDeliveryHistory).toHaveBeenCalledWith(
        expect.objectContaining({ status: '', from: '', to: '', page: 1 }),
      ),
    );
  });

  it('refaz a busca com o filtro de status e reinicia a página', async () => {
    listStoreDeliveryHistory.mockResolvedValue(emptyResult());

    render(<HistoricoPage />);
    await waitFor(() => expect(listStoreDeliveryHistory).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'delivered');

    await waitFor(() =>
      expect(listStoreDeliveryHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'delivered', page: 1 }),
      ),
    );
  });

  it('refaz a busca com o filtro de período', async () => {
    listStoreDeliveryHistory.mockResolvedValue(emptyResult());

    render(<HistoricoPage />);
    await waitFor(() => expect(listStoreDeliveryHistory).toHaveBeenCalledTimes(1));

    const fromInput = screen.getByLabelText(/^de$/i);
    await userEvent.type(fromInput, '2026-01-01');

    await waitFor(() =>
      expect(listStoreDeliveryHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ from: '2026-01-01', page: 1 }),
      ),
    );
  });

  it('mostra "Limpar filtros" só quando algum filtro está ativo, e ele reseta tudo', async () => {
    listStoreDeliveryHistory.mockResolvedValue(emptyResult());

    render(<HistoricoPage />);
    await waitFor(() => expect(listStoreDeliveryHistory).toHaveBeenCalledTimes(1));

    expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'cancelled');
    expect(await screen.findByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /limpar filtros/i }));

    expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(listStoreDeliveryHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: '', from: '', to: '', page: 1 }),
      ),
    );
  });

  it('mostra a paginação e navega para a próxima página', async () => {
    listStoreDeliveryHistory.mockResolvedValue(
      emptyResult({ data: [ENTREGA_ENTREGUE], total: 25, totalPages: 2, page: 1 }),
    );

    render(<HistoricoPage />);
    await screen.findByText('Maria Souza');

    expect(screen.getByText(/página 1 de 2/i)).toBeInTheDocument();

    listStoreDeliveryHistory.mockResolvedValue(
      emptyResult({ data: [ENTREGA_CANCELADA], total: 25, totalPages: 2, page: 2 }),
    );

    await userEvent.click(screen.getByRole('button', { name: /próxima/i }));

    await waitFor(() =>
      expect(listStoreDeliveryHistory).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );
    expect(await screen.findByText('João Lima')).toBeInTheDocument();
  });

  it('não mostra paginação quando há só uma página', async () => {
    listStoreDeliveryHistory.mockResolvedValue(
      emptyResult({ data: [ENTREGA_ENTREGUE], total: 1, totalPages: 1 }),
    );

    render(<HistoricoPage />);
    await screen.findByText('Maria Souza');

    expect(screen.queryByText(/página 1 de/i)).not.toBeInTheDocument();
  });
});