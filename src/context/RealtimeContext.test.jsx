import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { RealtimeProvider, useRealtime, buildWsUrl } from './RealtimeContext';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('../api/client', () => ({
  getToken: vi.fn(),
}));

vi.mock('../utils/notificationSound', () => ({
  playNotificationSound: vi.fn(),
  unlockAudio: vi.fn(),
}));

import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getToken } from '../api/client';
import { playNotificationSound } from '../utils/notificationSound';

// Mock mínimo de WebSocket que guarda a última instância criada, para o
// teste poder disparar onopen/onmessage/onclose manualmente.
class MockWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.close = vi.fn(() => {
      this.readyState = 3;
      this.onclose?.();
    });
    MockWebSocket.instances.push(this);
  }
}

function Probe() {
  const { lastEvent, unreadCount, clearUnread } = useRealtime();
  return (
    <div>
      <span data-testid="unread">{unreadCount}</span>
      <span data-testid="last-event">{lastEvent ? lastEvent.event : 'none'}</span>
      <button onClick={clearUnread}>limpar</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <RealtimeProvider>
      <Probe />
    </RealtimeProvider>,
  );
}

describe('buildWsUrl', () => {
  it('troca http por ws e remove o sufixo /api', () => {
    const url = buildWsUrl('meu-token');
    expect(url.startsWith('ws://')).toBe(true);
    expect(url).not.toContain('/api');
    expect(url).toContain('token=meu-token');
  });
});

describe('RealtimeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    useToast.mockReturnValue(vi.fn());
    getToken.mockReturnValue('token-valido');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('não abre conexão quando o status não é "authenticated"', () => {
    useAuth.mockReturnValue({ status: 'guest' });

    renderProvider();

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('abre a conexão com o token da loja quando autenticado', () => {
    useAuth.mockReturnValue({ status: 'authenticated' });

    renderProvider();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toContain('token=token-valido');
  });

  it('ao receber delivery:updated, atualiza lastEvent, soma unreadCount e toca o som', async () => {
    useAuth.mockReturnValue({ status: 'authenticated' });
    const showToast = vi.fn();
    useToast.mockReturnValue(showToast);

    renderProvider();
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.onmessage({ data: JSON.stringify({ type: 'delivery:updated', event: 'accepted', delivery: {} }) });
    });

    await waitFor(() => expect(screen.getByTestId('unread').textContent).toBe('1'));
    expect(screen.getByTestId('last-event').textContent).toBe('accepted');
    expect(playNotificationSound).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('aceitou'), 'success');
  });

  it('ignora mensagens que não são delivery:updated', async () => {
    useAuth.mockReturnValue({ status: 'authenticated' });

    renderProvider();
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.onmessage({ data: JSON.stringify({ type: 'outro:evento' }) });
    });

    expect(screen.getByTestId('unread').textContent).toBe('0');
    expect(playNotificationSound).not.toHaveBeenCalled();
  });

  it('ignora mensagens com JSON inválido sem lançar erro', () => {
    useAuth.mockReturnValue({ status: 'authenticated' });

    renderProvider();
    const ws = MockWebSocket.instances[0];

    expect(() => {
      act(() => {
        ws.onmessage({ data: 'não é json' });
      });
    }).not.toThrow();
  });

  it('clearUnread zera a contagem', async () => {
    useAuth.mockReturnValue({ status: 'authenticated' });

    renderProvider();
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.onmessage({ data: JSON.stringify({ type: 'delivery:updated', event: 'accepted', delivery: {} }) });
    });
    await waitFor(() => expect(screen.getByTestId('unread').textContent).toBe('1'));

    act(() => {
      screen.getByRole('button', { name: 'limpar' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('unread').textContent).toBe('0'));
  });

  it('reconecta depois que a conexão fecha', async () => {
    vi.useFakeTimers();
    useAuth.mockReturnValue({ status: 'authenticated' });

    renderProvider();
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      MockWebSocket.instances[0].onclose();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(MockWebSocket.instances).toHaveLength(2);
    vi.useRealTimers();
  });
});