import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, type ToastType } from '@/components/ui/Toast';

export interface MostrarToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastContextValue {
  mostrarToast: (options: MostrarToastOptions) => void;
  toastExito: (message: string, title?: string) => void;
  toastError: (message: string, title?: string) => void;
  toastInfo: (message: string, title?: string) => void;
  toastAlerta: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    type: ToastType;
    duration: number;
  }>({
    isOpen: false,
    message: '',
    title: undefined,
    type: 'success',
    duration: 4000,
  });

  const mostrarToast = useCallback(
    ({ message, title, type = 'success', duration = 4000 }: MostrarToastOptions) => {
      setToast({
        isOpen: true,
        message,
        title,
        type,
        duration,
      });
    },
    []
  );

  const toastExito = useCallback(
    (message: string, title?: string) => {
      mostrarToast({ message, title, type: 'success' });
    },
    [mostrarToast]
  );

  const toastError = useCallback(
    (message: string, title?: string) => {
      mostrarToast({ message, title, type: 'error' });
    },
    [mostrarToast]
  );

  const toastInfo = useCallback(
    (message: string, title?: string) => {
      mostrarToast({ message, title, type: 'info' });
    },
    [mostrarToast]
  );

  const toastAlerta = useCallback(
    (message: string, title?: string) => {
      mostrarToast({ message, title, type: 'warning' });
    },
    [mostrarToast]
  );

  const cerrarToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        mostrarToast,
        toastExito,
        toastError,
        toastInfo,
        toastAlerta,
      }}
    >
      {children}
      <Toast
        isOpen={toast.isOpen}
        onClose={cerrarToast}
        message={toast.message}
        title={toast.title}
        type={toast.type}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
};

const defaultToastContext: ToastContextValue = {
  mostrarToast: () => {},
  toastExito: () => {},
  toastError: () => {},
  toastInfo: () => {},
  toastAlerta: () => {},
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  return context || defaultToastContext;
};
