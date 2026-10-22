import React from 'react';
import { cn, getStatusColor } from '../../lib/utils';
import { LeadStatus } from '../../types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'status' | 'outline' | 'danger' | 'warning' | 'success';
  status?: LeadStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  className,
}) => {
  if (variant === 'status' && status) {
    const color = getStatusColor(status);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          color.bg,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
        {children || status}
      </span>
    );
  }

  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variants[variant as keyof typeof variants] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
};
