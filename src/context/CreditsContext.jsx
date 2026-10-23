import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useRealtime } from './RealtimeContext';
import { getCredits } from '../api/credits';

// Saldo de entregas da loja, compartilhado entre menu, aviso no topo,
// tela de créditos e tela de nova entrega.
const DEFAULT_VALUE = { credits: null, openOrder: null, refresh: async () => {} };
const CreditsContext = createContext(DEFAULT_VALUE);

export function CreditsProvider({ children }) {
  const { status } = useAuth();
  const { creditsEvent } = useRealtime();
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setData(await getCredits());
    } catch {
      // Falha de rede não deve derrubar a tela; mantém o último saldo conhecido.
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      refresh();
    } else {
      setData(null);
    }
  }, [status, refresh, creditsEvent]);

  const value = useMemo(() => {
    const { openOrder = null, ...credits } = data || {};
    return { credits: data ? credits : null, openOrder, refresh };
  }, [data, refresh]);

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

// Não lança fora do provider: telas e testes antigos continuam funcionando.
export function useCredits() {
  return useContext(CreditsContext);
}
