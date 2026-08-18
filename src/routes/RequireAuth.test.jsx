import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './RequireAuth';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

function renderWithAuth(authValue, initialEntry = '/dashboard') {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Página de login</div>} />
        <Route path="/verificar-conta" element={<div>Verificar conta</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<div>Área autenticada</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra loader enquanto status é loading', () => {
    renderWithAuth({
      status: 'loading',
      isEmailVerified: false,
    });

    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByText('Área autenticada')).not.toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });

  it('redireciona guest para /login', () => {
    renderWithAuth({
      status: 'guest',
      isEmailVerified: false,
    });

    expect(screen.getByText('Página de login')).toBeInTheDocument();
    expect(screen.queryByText('Área autenticada')).not.toBeInTheDocument();
  });

  it('redireciona autenticado sem e-mail verificado para /verificar-conta', () => {
    renderWithAuth({
      status: 'authenticated',
      isEmailVerified: false,
    });

    expect(screen.getByText('Verificar conta')).toBeInTheDocument();
    expect(screen.queryByText('Área autenticada')).not.toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });

  it('renderiza o Outlet quando autenticado e e-mail verificado', () => {
    renderWithAuth({
      status: 'authenticated',
      isEmailVerified: true,
    });

    expect(screen.getByText('Área autenticada')).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Verificar conta')).not.toBeInTheDocument();
  });
});