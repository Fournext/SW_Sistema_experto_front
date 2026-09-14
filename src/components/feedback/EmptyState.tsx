import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button, { type ButtonProps } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionButtonProps?: Partial<ButtonProps>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionButtonProps,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
        {icon || <FolderOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-md leading-relaxed">{description}</p>
      )}
      {actionText && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={onAction} {...actionButtonProps}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
