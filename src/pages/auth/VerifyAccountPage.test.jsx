import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyAccountPage from './VerifyAccountPage';

const updateStoreMock = vi.fn();
const logoutMock = vi.fn();
const showToastMock = vi.fn();

vi.mock('../../api/storeAuth', () => ({
  verifyAccount: vi.fn(),
  resendAccountVerification: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    store: { email: 'loja@test.com', emailVerifiedAt: null },
    updateStore: updateStoreMock,
    logout: logoutMock,
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => showToastMock,
}));

import { verifyAccount, resendAccountVerification } from '../../api/storeAuth';

function renderVerify() {
  return render(
    <MemoryRouter initialEntries={['/verificar-conta']}>
      <Routes>
        <Route path="/verificar-conta" element={<VerifyAccountPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function typeCode(user, code = '5048') {
  const inputs = screen.getAllByRole('textbox');
  expect(inputs).toHaveLength(4);
  for (let i = 0; i < code.length; i += 1) {
    await user.type(inputs[i], code[i]);
  }
}

describe('VerifyAccountPage (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza título, e-mail e ações', () => {
    renderVerify();

    expect(screen.getByRole('heading', { name: /confirme sua conta/i })).toBeInTheDocument();
    expect(screen.getByText('loja@test.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ativar conta/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reenviar código/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /utilizar outra conta/i })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('código válido verifica conta e redireciona para /dashboard', async () => {
    const user = userEvent.setup();
    verifyAccount.mockResolvedValue({
      emailVerifiedAt: '2026-08-01T12:00:00.000Z',
    });

    renderVerify();
    await typeCode(user, '5048');

    const submit = screen.getByRole('button', { name: /ativar conta/i });
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => {
      expect(verifyAccount).toHaveBeenCalledWith('5048');
    });
    expect(updateStoreMock).toHaveBeenCalledWith({
      emailVerifiedAt: '2026-08-01T12:00:00.000Z',
    });
    expect(showToastMock).toHaveBeenCalledWith('Conta verificada com sucesso!');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('código inválido mostra mensagem de erro', async () => {
    const user = userEvent.setup();
    verifyAccount.mockRejectedValue(new Error('Código de verificação inválido.'));

    renderVerify();
    await typeCode(user, '0000');
    await user.click(screen.getByRole('button', { name: /ativar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Código de verificação inválido.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(updateStoreMock).not.toHaveBeenCalled();
  });

  it('reenviar código mostra aviso de sucesso', async () => {
    const user = userEvent.setup();
    resendAccountVerification.mockResolvedValue({
      message: 'Código de verificação reenviado.',
    });

    renderVerify();
    await user.click(screen.getByRole('button', { name: /reenviar código/i }));

    await waitFor(() => {
      expect(resendAccountVerification).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByText(/um novo código foi enviado para loja@test.com/i),
    ).toBeInTheDocument();
  });

  it('utilizar outra conta faz logout e vai para /login', async () => {
    const user = userEvent.setup();
    renderVerify();

    await user.click(screen.getByRole('button', { name: /utilizar outra conta/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('Página de login')).toBeInTheDocument();
    });
  });
});