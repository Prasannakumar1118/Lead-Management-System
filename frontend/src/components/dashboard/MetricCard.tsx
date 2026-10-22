import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: string;
  variant?: 'blue' | 'amber' | 'purple' | 'emerald' | 'rose' | 'indigo' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = 'default',
}) => {
  const styles = {
    default: {
      bg: 'bg-slate-50',
      iconText: 'text-slate-600',
      badge: 'text-slate-700',
    },
    indigo: {
      bg: 'bg-indigo-50',
      iconText: 'text-indigo-600',
      badge: 'text-indigo-700',
    },
    blue: {
      bg: 'bg-blue-50',
      iconText: 'text-blue-600',
      badge: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50',
      iconText: 'text-amber-600',
      badge: 'text-amber-700',
    },
    purple: {
      bg: 'bg-purple-50',
      iconText: 'text-purple-600',
      badge: 'text-purple-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      badge: 'text-emerald-700',
    },
    rose: {
      bg: 'bg-rose-50',
      iconText: 'text-rose-600',
      badge: 'text-rose-700',
    },
  };

  const currentStyle = styles[variant] || styles.default;

  return (
    <Card className="hover:border-slate-300 transition-all duration-150">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', currentStyle.bg)}>
            <Icon className={cn('w-4 h-4', currentStyle.iconText)} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
          {subtitle && (
            <span className="text-xs font-medium text-slate-500 truncate ml-2">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
