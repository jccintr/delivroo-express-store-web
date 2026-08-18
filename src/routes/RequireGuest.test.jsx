import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireGuest from './RequireGuest';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

function renderWithAuth(authValue, initialEntry = '/login') {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<div>Página de login</div>} />
          <Route path="/cadastro" element={<div>Página de cadastro</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireGuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra loader enquanto status é loading', () => {
    renderWithAuth({ status: 'loading' });

    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('redireciona autenticado para /dashboard', () => {
    renderWithAuth({ status: 'authenticated' });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });

  it('renderiza o Outlet quando é guest', () => {
    renderWithAuth({ status: 'guest' });

    expect(screen.getByText('Página de login')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('permite acesso a /cadastro quando é guest', () => {
    renderWithAuth({ status: 'guest' }, '/cadastro');

    expect(screen.getByText('Página de cadastro')).toBeInTheDocument();
  });
});