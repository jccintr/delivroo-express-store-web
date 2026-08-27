import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EntregasPage from './EntregasPage';

vi.mock('../../api/deliveries', () => ({
  listStoreActiveDeliveries: vi.fn(),
  cancelStoreDelivery: vi.fn(),
}));

vi.mock('../../context/RealtimeContext', () => ({
  useRealtime: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));

import { listStoreActiveDeliveries, cancelStoreDelivery } from '../../api/deliveries';
import { useRealtime } from '../../context/RealtimeContext';
import { useToast } from '../../context/ToastContext';

function renderPage() {
  return render(
    <MemoryRouter>
      <EntregasPage />
    </MemoryRouter>,
  );
}

const ENTREGA_PENDENTE = {
  _id: '1',
  status: 0,
  createdAt: '2026-08-20T10:00:00.000Z',
  destino: { nome: 'Maria Souza', address: 'Rua Altino Rosa, 123' },
  package: { description: '2 marmitas + refrigerante' },
  distancia: 3.4,
  riderPayout: 8.5,
  rider: null,
};

const ENTREGA_A_CAMINHO = {
  _id: '2',
  status: 3,
  createdAt: '2026-08-20T11:00:00.000Z',
  destino: { nome: 'João Lima', address: 'Av. Central, 500' },
  package: { description: 'Documentos' },
  distancia: 1.2,
  riderPayout: 6,
  rider: { name: 'Carlos Rider', avatar: null, vehicle: { type: 'Moto', plate: 'ABC-1234' } },
};

describe('EntregasPage', () => {
  let clearUnread;
  let showToast;

  beforeEach(() => {
    vi.clearAllMocks();
    clearUnread = vi.fn();
    showToast = vi.fn();
    useRealtime.mockReturnValue({ lastEvent: null, unreadCount: 0, clearUnread });
    useToast.mockReturnValue(showToast);
  });

  it('mostra o spinner enquanto carrega', () => {
    listStoreActiveDeliveries.mockReturnValue(new Promise(() => {})); // nunca resolve

    renderPage();

    expect(screen.getByLabelText(/carregando entregas/i)).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há entregas em andamento', async () => {
    listStoreActiveDeliveries.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/nenhuma entrega pendente ou em andamento/i)).toBeInTheDocument();
  });

  it('mostra a mensagem de erro quando a chamada falha', async () => {
    listStoreActiveDeliveries.mockRejectedValue(new Error('Conta ainda não verificada.'));

    renderPage();

    expect(await screen.findByText('Conta ainda não verificada.')).toBeInTheDocument();
  });

  it('lista as entregas retornadas, com status, destino e pacote', async () => {
    listStoreActiveDeliveries.mockResolvedValue([
      {
        _id: '1',
        status: 0,
        createdAt: '2026-08-20T10:00:00.000Z',
        destino: { nome: 'Maria Souza', address: 'Rua Altino Rosa, 123' },
        package: { description: '2 marmitas + refrigerante' },
        distancia: 3.4,
        riderPayout: 8.5,
        rider: null,
      },
      {
        _id: '2',
        status: 3,
        createdAt: '2026-08-20T11:00:00.000Z',
        destino: { nome: 'João Lima', address: 'Av. Central, 500' },
        package: { description: 'Documentos' },
        distancia: 1.2,
        riderPayout: 6,
        rider: { name: 'Carlos Rider', avatar: null, vehicle: { type: 'Moto', plate: 'ABC-1234' } },
      },
    ]);

    renderPage();

    expect(await screen.findByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('João Lima')).toBeInTheDocument();
    expect(screen.getByText('Aguardando entregador')).toBeInTheDocument();
    expect(screen.getByText('A caminho')).toBeInTheDocument();
    expect(screen.getByText('2 marmitas + refrigerante')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rider')).toBeInTheDocument();
    expect(screen.getByText(/ABC-1234/)).toBeInTheDocument();
  });

  it('recarrega a lista ao clicar em "Atualizar"', async () => {
    listStoreActiveDeliveries.mockResolvedValue([]);

    renderPage();
    await screen.findByText(/nenhuma entrega pendente ou em andamento/i);

    expect(listStoreActiveDeliveries).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => expect(listStoreActiveDeliveries).toHaveBeenCalledTimes(2));
  });

  it('limpa o badge de não lidas ao montar a tela', async () => {
    listStoreActiveDeliveries.mockResolvedValue([]);

    renderPage();
    await screen.findByText(/nenhuma entrega pendente ou em andamento/i);

    expect(clearUnread).toHaveBeenCalled();
  });

  it('busca a lista de novo quando chega um evento em tempo real (rider aceitou/atualizou/cancelou)', async () => {
    listStoreActiveDeliveries.mockResolvedValue([]);
    useRealtime.mockReturnValue({ lastEvent: null, unreadCount: 0, clearUnread });

    const { rerender } = render(
      <MemoryRouter>
        <EntregasPage />
      </MemoryRouter>,
    );
    await screen.findByText(/nenhuma entrega pendente ou em andamento/i);
    expect(listStoreActiveDeliveries).toHaveBeenCalledTimes(1);

    // Simula a chegada de um evento "delivery:updated" pelo WebSocket
    useRealtime.mockReturnValue({
      lastEvent: { type: 'delivery:updated', event: 'accepted', delivery: { _id: '1' } },
      unreadCount: 0,
      clearUnread,
    });
    rerender(
      <MemoryRouter>
        <EntregasPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(listStoreActiveDeliveries).toHaveBeenCalledTimes(2));
  });

  it('mostra o botão "Cancelar" só para entregas em status 0 ou 1', async () => {
    listStoreActiveDeliveries.mockResolvedValue([
      ENTREGA_PENDENTE, // status 0 — pode cancelar
      { ...ENTREGA_A_CAMINHO, _id: '3', status: 1, destino: { nome: 'Ana Paula' } }, // status 1 — pode cancelar
      ENTREGA_A_CAMINHO, // status 3 — não pode cancelar
    ]);

    renderPage();

    await screen.findByText('Maria Souza');
    const cancelButtons = screen.getAllByRole('button', { name: /cancelar/i });
    expect(cancelButtons).toHaveLength(2);
  });

  it('abre o modal de cancelamento ao clicar em "Cancelar" e mostra o nome do destinatário', async () => {
    listStoreActiveDeliveries.mockResolvedValue([ENTREGA_PENDENTE]);

    renderPage();
    await screen.findByText('Maria Souza');

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.getByText('Cancelar entrega')).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo do cancelamento/i)).toBeInTheDocument();
  });

  it('confirma o cancelamento: chama a API, mostra toast, fecha o modal e recarrega a lista', async () => {
    listStoreActiveDeliveries.mockResolvedValue([ENTREGA_PENDENTE]);
    cancelStoreDelivery.mockResolvedValue({ _id: '1', status: 6 });

    renderPage();
    await screen.findByText('Maria Souza');

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.type(screen.getByLabelText(/motivo do cancelamento/i), 'Cliente desistiu da compra');
    await userEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }));

    await waitFor(() => expect(cancelStoreDelivery).toHaveBeenCalledWith('1', 'Cliente desistiu da compra'));
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('cancelada'), 'success');
    await waitFor(() => expect(screen.queryByText('Cancelar entrega')).not.toBeInTheDocument());
    expect(listStoreActiveDeliveries).toHaveBeenCalledTimes(2); // carga inicial + refetch pós-cancelamento
  });

  it('fecha o modal sem chamar a API ao clicar em "Voltar"', async () => {
    listStoreActiveDeliveries.mockResolvedValue([ENTREGA_PENDENTE]);

    renderPage();
    await screen.findByText('Maria Souza');

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

    expect(screen.queryByText('Cancelar entrega')).not.toBeInTheDocument();
    expect(cancelStoreDelivery).not.toHaveBeenCalled();
  });
});