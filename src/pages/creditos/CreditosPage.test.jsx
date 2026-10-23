import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreditosPage from './CreditosPage';

vi.mock('../../api/credits', () => ({
  listPackages: vi.fn(),
  listRechargeOrders: vi.fn(),
  createRechargeOrder: vi.fn(),
  informPayment: vi.fn(),
  cancelRechargeOrder: vi.fn(),
}));
vi.mock('../../context/CreditsContext', () => ({ useCredits: vi.fn() }));
vi.mock('../../context/ToastContext', () => ({ useToast: () => vi.fn() }));

import * as api from '../../api/credits';
import { useCredits } from '../../context/CreditsContext';

const credits = { free: 2, purchased: 8, available: 10, openDeliveries: 1, availableToRequest: 9 };
const pendingOrder = {
  id: 'o1',
  code: 'R4KXY2',
  status: 'pending',
  package: { name: 'Pacote 20', deliveries: 20, price: 28 },
  pixPayload: '000201PIXCODE',
  qrCodeDataUrl: 'data:image/png;base64,AAAA',
};

describe('CreditosPage', () => {
  const refresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.listPackages.mockResolvedValue({
      deliveryFee: 1.5,
      packages: [{ id: 'p1', name: 'Pacote 20', deliveries: 20, price: 28, unitPrice: 1.4 }],
    });
    api.listRechargeOrders.mockResolvedValue({ data: [] });
    refresh.mockResolvedValue();
  });

  it('mostra saldo e pacotes quando não há pedido em aberto', async () => {
    useCredits.mockReturnValue({ credits, openOrder: null, refresh });
    render(<CreditosPage />);

    expect(await screen.findByText('Pacote 20')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Você ainda não fez nenhum pedido.')).toBeInTheDocument();
  });

  it('cria o pedido ao clicar em Comprar', async () => {
    useCredits.mockReturnValue({ credits, openOrder: null, refresh });
    api.createRechargeOrder.mockResolvedValue(pendingOrder);
    render(<CreditosPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Comprar Pacote 20' }));

    await waitFor(() => expect(api.createRechargeOrder).toHaveBeenCalledWith('p1'));
    expect(refresh).toHaveBeenCalled();
  });

  it('mostra QR code e código copia e cola do pedido em aberto', async () => {
    useCredits.mockReturnValue({ credits, openOrder: pendingOrder, refresh });
    render(<CreditosPage />);

    expect(await screen.findByAltText('QR code do Pix')).toHaveAttribute('src', pendingOrder.qrCodeDataUrl);
    expect(screen.getByLabelText('Pix copia e cola')).toHaveValue('000201PIXCODE');
    expect(screen.queryByText('Escolha um pacote')).not.toBeInTheDocument();
  });

  it('envia "Já paguei" com observação', async () => {
    useCredits.mockReturnValue({ credits, openOrder: pendingOrder, refresh });
    api.informPayment.mockResolvedValue({});
    render(<CreditosPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Já paguei' }));
    await userEvent.type(screen.getByLabelText(/Observação/), 'paguei agora');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar aviso' }));

    await waitFor(() =>
      expect(api.informPayment).toHaveBeenCalledWith('o1', { payerNote: 'paguei agora', receipt: null }),
    );
  });

  it('recusa comprovante com tipo inválido', async () => {
    useCredits.mockReturnValue({ credits, openOrder: pendingOrder, refresh });
    render(<CreditosPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Já paguei' }));
    const input = screen.getByLabelText(/Comprovante/);
    const bad = new File(['x'], 'a.txt', { type: 'text/plain' });
    await userEvent.upload(input, bad, { applyAccept: false });

    expect(await screen.findByText(/imagem \(JPG, PNG, WEBP\) ou PDF/)).toBeInTheDocument();
  });

  it('pedido já informado mostra aviso de conferência e esconde os botões', async () => {
    useCredits.mockReturnValue({ credits, openOrder: { ...pendingOrder, status: 'informed' }, refresh });
    render(<CreditosPage />);

    expect(await screen.findByText(/Estamos conferindo o pagamento/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Já paguei' })).not.toBeInTheDocument();
  });

  it('cancela o pedido pendente', async () => {
    useCredits.mockReturnValue({ credits, openOrder: pendingOrder, refresh });
    api.cancelRechargeOrder.mockResolvedValue({});
    render(<CreditosPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));

    await waitFor(() => expect(api.cancelRechargeOrder).toHaveBeenCalledWith('o1'));
  });
});
