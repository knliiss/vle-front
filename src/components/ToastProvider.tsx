import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastItem { id: number; type: ToastType; message: string; timeout?: number; }

interface ToastContextValue {
  notify: (message: string, type?: ToastType, timeout?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if(!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'info', timeout = 3000) => {
    const id = Date.now() + Math.floor(Math.random()*1000);
    setToasts(prev => [...prev, { id, type, message, timeout }]);
  }, []);

  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id));
    }, t.timeout ?? 3000));
    return () => { timers.forEach(clearTimeout); };
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status" aria-live="polite">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

