import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CancelDeliveryModal from './CancelDeliveryModal';

const baseDelivery = {
  _id: 'd1',
  status: 0,
  destino: { nome: 'Maria Souza' },
};

describe('CancelDeliveryModal', () => {
  let onConfirm;
  let onClose;

  beforeEach(() => {
    onConfirm = vi.fn().mockResolvedValue(undefined);
    onClose = vi.fn();
  });

  it('mostra o nome do destinatário e a mensagem para uma entrega ainda não aceita (status 0)', () => {
    render(<CancelDeliveryModal delivery={baseDelivery} onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getByText(/Maria Souza/)).toBeInTheDocument();
    expect(screen.getByText(/ainda não foi aceita/i)).toBeInTheDocument();
  });

  it('avisa que o entregador será notificado quando a entrega já estava aceita (status 1)', () => {
    render(
      <CancelDeliveryModal
        delivery={{ ...baseDelivery, status: 1 }}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/já tinha aceitado/i)).toBeInTheDocument();
  });

  it('mostra erro de validação e não chama onConfirm quando o motivo é muito curto', async () => {
    render(<CancelDeliveryModal delivery={baseDelivery} onConfirm={onConfirm} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/motivo do cancelamento/i), 'Oi');
    await userEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }));

    expect(await screen.findByText(/descreva o motivo com um pouco mais de detalhe/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('chama onConfirm com o motivo (com espaços nas pontas removidos) quando válido', async () => {
    render(<CancelDeliveryModal delivery={baseDelivery} onConfirm={onConfirm} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/motivo do cancelamento/i), '  Cliente desistiu da compra  ');
    await userEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }));

    expect(onConfirm).toHaveBeenCalledWith('Cliente desistiu da compra');
  });

  it('mostra a mensagem de erro quando onConfirm rejeita (ex: já retirado)', async () => {
    onConfirm.mockRejectedValue(new Error('Não foi possível cancelar esta entrega.'));

    render(<CancelDeliveryModal delivery={baseDelivery} onConfirm={onConfirm} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/motivo do cancelamento/i), 'Motivo válido aqui');
    await userEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }));

    expect(await screen.findByText('Não foi possível cancelar esta entrega.')).toBeInTheDocument();
  });

  it('chama onClose ao clicar em "Voltar" sem chamar onConfirm', async () => {
    render(<CancelDeliveryModal delivery={baseDelivery} onConfirm={onConfirm} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});