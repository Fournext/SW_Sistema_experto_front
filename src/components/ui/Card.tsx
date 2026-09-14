import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all ${
        hoverable ? 'hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {header && <div className="px-6 py-4 border-b border-slate-100">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100">{footer}</div>}
    </div>
  );
};

export default Card;
