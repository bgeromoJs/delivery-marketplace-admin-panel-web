'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BadgeCheck, CircleAlert, Info, X } from 'lucide-react';
import { getApiErrorFeedback } from '@/lib/apiClient';

type ToastKind = 'success' | 'error' | 'warning' | 'info';
type ToastMessage = { id: number; kind: ToastKind; message: string };
type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  apiError: (error: unknown, fallback?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), toast.kind === 'error' || toast.kind === 'warning' ? 7000 : 5000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id, toast.kind]);

  const Icon = toast.kind === 'success' ? BadgeCheck : toast.kind === 'error' || toast.kind === 'warning' ? CircleAlert : Info;
  return <div className={`app-toast app-toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
    <Icon className="app-toast-icon" size={19} aria-hidden="true" />
    <p>{toast.message}</p>
    <button className="app-toast-close" type="button" onClick={() => onDismiss(toast.id)} aria-label="Fechar notificação"><X size={16} aria-hidden="true" /></button>
  </div>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const add = useCallback((kind: ToastKind, message: string) => {
    if (!message.trim()) return;
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-3), { id, kind, message }]);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    success: (message) => add('success', message),
    error: (message) => add('error', message),
    warning: (message) => add('warning', message),
    info: (message) => add('info', message),
    apiError: (error, fallback) => {
      const feedback = getApiErrorFeedback(error, fallback);
      add(feedback.kind, feedback.message);
    },
  }), [add]);

  return <ToastContext.Provider value={value}>
    {children}
    <div className="app-toast-viewport" aria-live="polite" aria-relevant="additions text" aria-label="Notificações">
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return context;
}
