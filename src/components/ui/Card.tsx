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
      className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-teal-200/90 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {header && <div className="px-6 py-4 border-b border-stone-100">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-3.5 bg-stone-50/80 border-t border-stone-100">{footer}</div>}
    </div>
  );
};

export default Card;
