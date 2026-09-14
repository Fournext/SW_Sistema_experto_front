import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Ha ocurrido un error',
  message = 'No se pudo cargar la información solicitada. Por favor verifica que el backend Django esté en ejecución e inténtalo de nuevo.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 bg-rose-50 border border-rose-200 rounded-2xl text-left ${className}`}>
      <div className="flex items-start gap-3.5">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="mt-1 text-sm text-rose-700 leading-relaxed">{message}</p>
          {onRetry && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
