import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from './AppSidebar';

vi.mock('../../context/RealtimeContext', () => ({
  useRealtime: vi.fn(),
}));

import { useRealtime } from '../../context/RealtimeContext';

function renderSidebar() {
  return render(
    <MemoryRouter>
      <AppSidebar />
    </MemoryRouter>,
  );
}

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não mostra badge quando não há notificações não lidas', () => {
    useRealtime.mockReturnValue({ unreadCount: 0 });

    renderSidebar();

    expect(screen.getByText('Entregas')).toBeInTheDocument();
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('mostra a contagem de não lidas junto do link "Entregas"', () => {
    useRealtime.mockReturnValue({ unreadCount: 3 });

    renderSidebar();

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('mostra "9+" quando há mais de 9 notificações não lidas', () => {
    useRealtime.mockReturnValue({ unreadCount: 12 });

    renderSidebar();

    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('renderiza todos os itens de navegação esperados', () => {
    useRealtime.mockReturnValue({ unreadCount: 0 });

    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Entregas')).toBeInTheDocument();
    expect(screen.getByText('Nova entrega')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
    expect(screen.getByText('Perfil da loja')).toBeInTheDocument();
    expect(screen.getByText('Conta')).toBeInTheDocument();
  });
});