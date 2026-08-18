import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';

const loginMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

function renderLogin(initialEntry = '/login') {
  const entries =
    typeof initialEntry === 'string' ? [initialEntry] : [initialEntry];

  return render(
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/verificar-conta" element={<div>Verificar conta</div>} />
        <Route path="/cadastro" element={<div>Cadastro</div>} />
        <Route path="/esqueci-senha" element={<div>Esqueci senha</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage (smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza formulário de login', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /esqueci minha senha/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cadastre sua loja/i })).toBeInTheDocument();
  });

  it('login com e-mail verificado redireciona para /dashboard', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      emailVerifiedAt: '2026-08-01T12:00:00.000Z',
    });

    renderLogin();

    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.type(screen.getByLabelText(/^senha$/i), '123456');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'loja@test.com',
        password: '123456',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('login sem e-mail verificado redireciona para /verificar-conta', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      emailVerifiedAt: null,
    });

    renderLogin();

    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.type(screen.getByLabelText(/^senha$/i), '123456');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Verificar conta')).toBeInTheDocument();
    });
  });

  it('mostra mensagem de erro quando login falha', async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new Error('Email ou senha inválidos.'));

    renderLogin();

    await user.type(screen.getByLabelText(/e-mail/i), 'loja@test.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'errada');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Email ou senha inválidos.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('mostra aviso após cadastro (justRegistered)', () => {
    renderLogin({
      pathname: '/login',
      state: { justRegistered: true },
    });

    expect(
      screen.getByText(/conta criada com sucesso! faça login para continuar/i),
    ).toBeInTheDocument();
  });
});