import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';

vi.mock('../../api/storeAuth', () => ({
  requestPasswordCode: vi.fn(),
  verifyPasswordCode: vi.fn(),
  resetPassword: vi.fn(),
}));

import {
  requestPasswordCode,
  verifyPasswordCode,
  resetPassword,
} from '../../api/storeAuth';

function renderForgot() {
  return render(
    <MemoryRouter initialEntries={['/esqueci-senha']}>
      <Routes>
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function typeCode(user, code = '5048') {
  const inputs = document.querySelectorAll('input[inputmode="numeric"]');
  expect(inputs.length).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < code.length; i += 1) {
    await user.type(inputs[i], code[i]);
  }
}

describe('ForgotPasswordPage (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o passo de e-mail', () => {
    renderForgot();

    expect(screen.getByRole('heading', { name: /recuperar senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para o login/i })).toBeInTheDocument();
  });

  it('fluxo completo: e-mail → código → nova senha → login', async () => {
    const user = userEvent.setup();
    requestPasswordCode.mockResolvedValue({ message: 'ok' });
    verifyPasswordCode.mockResolvedValue({ message: 'ok' });
    resetPassword.mockResolvedValue({ message: 'ok' });

    renderForgot();

    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.click(screen.getByRole('button', { name: /enviar código/i }));

    await waitFor(() => {
      expect(requestPasswordCode).toHaveBeenCalledWith('loja@test.com');
    });

    expect(screen.getByText(/loja@test.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar código/i })).toBeDisabled();

    await typeCode(user, '5048');
    await user.click(screen.getByRole('button', { name: /confirmar código/i }));

    await waitFor(() => {
      expect(verifyPasswordCode).toHaveBeenCalledWith('loja@test.com', '5048');
    });

    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    expect(passwordInput).toBeTruthy();
    expect(confirmInput).toBeTruthy();

    await user.type(passwordInput, 'novaSenha123');
    await user.type(confirmInput, 'novaSenha123');
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        email: 'loja@test.com',
        code: '5048',
        password: 'novaSenha123',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Página de login')).toBeInTheDocument();
    });
  });

  it('mostra erro quando as senhas não coincidem', async () => {
    const user = userEvent.setup();
    requestPasswordCode.mockResolvedValue({ message: 'ok' });
    verifyPasswordCode.mockResolvedValue({ message: 'ok' });

    renderForgot();

    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.click(screen.getByRole('button', { name: /enviar código/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmar código/i })).toBeInTheDocument();
    });

    await typeCode(user, '5048');
    await user.click(screen.getByRole('button', { name: /confirmar código/i }));

    await waitFor(() => {
      expect(document.getElementById('password')).toBeTruthy();
    });

    await user.type(document.getElementById('password'), 'senhaA');
    await user.type(document.getElementById('confirmPassword'), 'senhaB');
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('mostra erro quando o código é inválido', async () => {
    const user = userEvent.setup();
    requestPasswordCode.mockResolvedValue({ message: 'ok' });
    verifyPasswordCode.mockRejectedValue(new Error('Código inválido ou expirado.'));

    renderForgot();

    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.click(screen.getByRole('button', { name: /enviar código/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmar código/i })).toBeInTheDocument();
    });

    await typeCode(user, '0000');
    await user.click(screen.getByRole('button', { name: /confirmar código/i }));

    await waitFor(() => {
      expect(screen.getByText('Código inválido ou expirado.')).toBeInTheDocument();
    });
    expect(document.getElementById('password')).toBeNull();
  });
});