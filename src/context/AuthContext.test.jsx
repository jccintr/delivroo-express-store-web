import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/storeAuth', () => ({
  fetchCurrentStore: vi.fn(),
  loginStore: vi.fn(),
}));

vi.mock('../api/client', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
}));

import { fetchCurrentStore, loginStore } from '../api/storeAuth';
import { getToken, setToken } from '../api/client';

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="verified">{String(auth.isEmailVerified)}</span>
      <span data-testid="store-name">{auth.store?.name ?? ''}</span>
      <span data-testid="store-email">{auth.store?.email ?? ''}</span>
      <button type="button" onClick={() => auth.login({ email: 'a@a.com', password: '123' })}>
        login
      </button>
      <button type="button" onClick={() => auth.logout()}>
        logout
      </button>
      <button
        type="button"
        onClick={() =>
          auth.updateStore({ name: 'Nome Atualizado', emailVerifiedAt: '2026-01-01T00:00:00.000Z' })
        }
      >
        update
      </button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sem token define status guest', async () => {
    getToken.mockReturnValue(null);

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });
    expect(fetchCurrentStore).not.toHaveBeenCalled();
    expect(screen.getByTestId('verified')).toHaveTextContent('false');
  });

  it('com token válido carrega a loja e autentica', async () => {
    getToken.mockReturnValue('jwt-valido');
    fetchCurrentStore.mockResolvedValue({
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      emailVerifiedAt: '2026-08-01T12:00:00.000Z',
    });

    renderAuth();

    expect(screen.getByTestId('status')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(screen.getByTestId('store-name')).toHaveTextContent('Pizzaria');
    expect(screen.getByTestId('verified')).toHaveTextContent('true');
    expect(fetchCurrentStore).toHaveBeenCalledTimes(1);
  });

  it('com token inválido limpa sessão e vira guest', async () => {
    getToken.mockReturnValue('jwt-invalido');
    fetchCurrentStore.mockRejectedValue(new Error('Não autorizado'));

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });
    expect(setToken).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('store-name')).toHaveTextContent('');
  });

  it('login grava token, store e status authenticated', async () => {
    getToken.mockReturnValue(null);
    loginStore.mockResolvedValue({
      token: 'novo-jwt',
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      emailVerifiedAt: null,
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('guest');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(setToken).toHaveBeenCalledWith('novo-jwt');
    expect(screen.getByTestId('store-name')).toHaveTextContent('Pizzaria');
    expect(screen.getByTestId('verified')).toHaveTextContent('false');
  });

  it('logout limpa token e volta para guest', async () => {
    getToken.mockReturnValue('jwt-valido');
    fetchCurrentStore.mockResolvedValue({
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      emailVerifiedAt: '2026-08-01T12:00:00.000Z',
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click();
    });

    expect(setToken).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('status')).toHaveTextContent('guest');
    expect(screen.getByTestId('store-name')).toHaveTextContent('');
    expect(screen.getByTestId('verified')).toHaveTextContent('false');
  });

  it('updateStore faz merge no estado da loja', async () => {
    getToken.mockReturnValue('jwt-valido');
    fetchCurrentStore.mockResolvedValue({
      _id: '1',
      name: 'Pizzaria',
      email: 'loja@test.com',
      emailVerifiedAt: null,
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(screen.getByTestId('verified')).toHaveTextContent('false');

    await act(async () => {
      screen.getByRole('button', { name: 'update' }).click();
    });

    expect(screen.getByTestId('store-name')).toHaveTextContent('Nome Atualizado');
    expect(screen.getByTestId('verified')).toHaveTextContent('true');
  });

  it('useAuth fora do provider lança erro', () => {
    // silencia o error boundary do React no console durante este teste
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<AuthProbe />)).toThrow(
      /useAuth precisa ser usado dentro de <AuthProvider>/i,
    );

    spy.mockRestore();
  });
});