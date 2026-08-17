import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast, ToastToggle } from 'flowbite-react';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

const ToastCtx = createContext(null);

const ICONS = {
  success: <HiCheckCircle className="h-5 w-5 shrink-0 text-green" />,
  error: <HiExclamationCircle className="h-5 w-5 shrink-0 text-red-500" />,
};

const DURATION_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = idRef.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={showToast}>
      {children}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id}>
            {ICONS[t.type]}
            <div className="ml-3 text-sm font-normal">{t.message}</div>
            <ToastToggle onDismiss={() => dismiss(t.id)} />
          </Toast>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// showToast(message, 'success' | 'error')
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}