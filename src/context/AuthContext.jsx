import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCurrentStore, loginStore } from '../api/storeAuth';
import { getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [store, setStore] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setStatus('guest');
      return;
    }
    try {
      const data = await fetchCurrentStore();
      setStore(data);
      setStatus('authenticated');
    } catch {
      setToken(null);
      setStore(null);
      setStatus('guest');
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function login({ email, password }) {
    const data = await loginStore({ email, password });
    const { token, ...storeData } = data;
    setToken(token);
    setStore(storeData);
    setStatus('authenticated');
    return storeData;
  }

  function logout() {
    setToken(null);
    setStore(null);
    setStatus('guest');
  }

  function updateStore(patch) {
    setStore((prev) => ({ ...prev, ...patch }));
  }

  const isEmailVerified = Boolean(store?.emailVerifiedAt);

  return (
    <AuthContext.Provider
      value={{ store, status, isEmailVerified, login, logout, updateStore, refresh: loadSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
