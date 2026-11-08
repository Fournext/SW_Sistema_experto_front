import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  onClose,
  message,
  title,
  type = 'success',
  duration = 4000,
}) => {
  useEffect(() => {
    if (!isOpen || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
      accent: 'text-emerald-800',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-950',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      accent: 'text-rose-800',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      accent: 'text-amber-800',
    },
    info: {
      bg: 'bg-teal-50 border-teal-200 text-teal-950',
      icon: <Info className="w-5 h-5 text-teal-600 shrink-0" />,
      accent: 'text-teal-800',
    },
  }[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xs ${styles.bg}`}
      >
        {styles.icon}
        <div className="flex-1 text-xs">
          {title && <p className="font-semibold text-sm mb-0.5 text-stone-900">{title}</p>}
          <p className={`leading-relaxed ${styles.accent}`}>{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

