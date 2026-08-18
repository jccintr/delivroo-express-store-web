import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './RegisterPage';

vi.mock('../../api/storeAuth', () => ({
  registerStore: vi.fn(),
}));

import { registerStore } from '../../api/storeAuth';

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza formulário de cadastro', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: /cadastrar loja/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da loja/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument();
  });

  it('cadastro com sucesso chama registerStore e redireciona para /login', async () => {
    const user = userEvent.setup();
    registerStore.mockResolvedValue({
      message: 'Conta criada com sucesso.',
      store: { _id: '1', name: 'Pizzaria do Centro' },
    });

    renderRegister();

    await user.type(screen.getByLabelText(/nome da loja/i), 'Pizzaria do Centro');
    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.type(screen.getByLabelText(/telefone/i), '35999999999');
    await user.type(screen.getByLabelText(/^senha$/i), '123456');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(registerStore).toHaveBeenCalledWith({
        name: 'Pizzaria do Centro',
        email: 'loja@test.com',
        // PhoneInput aplica máscara brasileira
        phone: '(35) 99999-9999',
        password: '123456',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Página de login')).toBeInTheDocument();
    });
  });

  it('mostra mensagem de erro quando o cadastro falha', async () => {
    const user = userEvent.setup();
    registerStore.mockRejectedValue(new Error('Email já cadastrado.'));

    renderRegister();

    await user.type(screen.getByLabelText(/nome da loja/i), 'Pizzaria do Centro');
    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.type(screen.getByLabelText(/telefone/i), '35999999999');
    await user.type(screen.getByLabelText(/^senha$/i), '123456');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('Email já cadastrado.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });
});