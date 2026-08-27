import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getToken } from '../api/client';
import { playNotificationSound, unlockAudio } from '../utils/notificationSound';

const RealtimeContext = createContext(null);

const RECONNECT_DELAY_MS = 3000;

// Mensagens amigáveis para cada evento que o backend manda via WebSocket
// (ver notifyEvent em controllers/delivery.controller.js na API).
const EVENT_LABELS = {
  accepted: 'Um entregador aceitou uma entrega.',
  picked_up: 'O entregador retirou o pacote.',
  dispatched: 'O entregador está a caminho do destino.',
  delivered: 'Uma entrega foi concluída.',
  returned: 'Um pacote foi devolvido pelo entregador.',
  cancelled_by_rider: 'O entregador cancelou a entrega — ela voltou para a fila.',
};

// Deriva a URL do WebSocket a partir de VITE_API_BASE_URL (troca o esquema
// http(s) por ws(s) e remove o sufixo /api, já que o WS é montado na raiz
// do servidor HTTP, não sob /api — ver index.js/websocket.js da API).
export function buildWsUrl(token) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const wsBase = apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
  return `${wsBase}?token=${encodeURIComponent(token)}`;
}

export function RealtimeProvider({ children }) {
  const { status } = useAuth();
  const showToast = useToast();
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  // "Destrava" o áudio no primeiro clique/tecla do usuário na página —
  // precisa acontecer antes do primeiro evento em tempo real chegar, ou o
  // navegador bloqueia o som silenciosamente.
  useEffect(() => {
    function unlock() {
      unlockAudio();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    }
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      wsRef.current?.close();
      wsRef.current = null;
      return undefined;
    }

    let cancelled = false;

    function connect() {
      const token = getToken();
      if (!token) return;

      const ws = new WebSocket(buildWsUrl(token));
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        let payload;
        try {
          payload = JSON.parse(evt.data);
        } catch {
          return;
        }

        if (payload?.type !== 'delivery:updated') return;

        setLastEvent(payload);
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
        showToast(EVENT_LABELS[payload.event] || 'Uma entrega foi atualizada.', 'success');
      };

      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [status, showToast]);

  return (
    <RealtimeContext.Provider value={{ lastEvent, unreadCount, clearUnread }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime deve ser usado dentro de <RealtimeProvider>');
  return ctx;
}