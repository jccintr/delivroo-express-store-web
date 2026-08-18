import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireUnverified from './RequireUnverified';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

function renderWithAuth(authValue, initialEntry = '/verificar-conta') {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Página de login</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route element={<RequireUnverified />}>
          <Route path="/verificar-conta" element={<div>Verificar conta</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireUnverified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra loader enquanto status é loading', () => {
    renderWithAuth({
      status: 'loading',
      isEmailVerified: false,
    });

    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByText('Verificar conta')).not.toBeInTheDocument();
  });

  it('redireciona guest para /login', () => {
    renderWithAuth({
      status: 'guest',
      isEmailVerified: false,
    });

    expect(screen.getByText('Página de login')).toBeInTheDocument();
    expect(screen.queryByText('Verificar conta')).not.toBeInTheDocument();
  });

  it('redireciona e-mail já verificado para /dashboard', () => {
    renderWithAuth({
      status: 'authenticated',
      isEmailVerified: true,
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Verificar conta')).not.toBeInTheDocument();
  });

  it('libera /verificar-conta quando autenticado e ainda não verificado', () => {
    renderWithAuth({
      status: 'authenticated',
      isEmailVerified: false,
    });

    expect(screen.getByText('Verificar conta')).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});