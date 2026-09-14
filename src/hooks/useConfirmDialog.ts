import { useState, useCallback } from 'react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'primary';
  confirmText?: string;
  cancelText?: string;
}

export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });
  const [loading, setLoading] = useState(false);

  const confirm = useCallback(
    (options: {
      title: string;
      message: string;
      onConfirm: () => void | Promise<void>;
      variant?: 'danger' | 'primary';
      confirmText?: string;
      cancelText?: string;
    }) => {
      setDialogState({
        isOpen: true,
        title: options.title,
        message: options.message,
        onConfirm: options.onConfirm,
        variant: options.variant || 'danger',
        confirmText: options.confirmText,
        cancelText: options.cancelText,
      });
    },
    []
  );

  const close = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await dialogState.onConfirm();
      close();
    } catch {
      setLoading(false);
    }
  }, [dialogState, close]);

  return {
    isOpen: dialogState.isOpen,
    title: dialogState.title,
    message: dialogState.message,
    variant: dialogState.variant,
    confirmText: dialogState.confirmText,
    cancelText: dialogState.cancelText,
    loading,
    confirm,
    close,
    handleConfirm,
  };
};

export default useConfirmDialog;
