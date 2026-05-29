import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  badge?: string;
  badgeTone?: 'positive' | 'neutral' | 'alert';
}

export default function StatCard({
  icon,
  iconBg,
  label,
  value,
  badge,
  badgeTone = 'positive',
}: StatCardProps) {
  return (
    <div className="card-surface flex flex-col gap-3 p-5">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          iconBg,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="m-0 text-sm text-slate-500">{label}</p>
        <p className="m-0 mt-1 text-2xl font-bold text-primary-dark">
          {value}
        </p>
      </div>
      {badge && (
        <span
          className={cn(
            'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold',
            badgeTone === 'positive' && 'bg-primary-light text-primary',
            badgeTone === 'neutral' && 'bg-slate-100 text-slate-600',
            badgeTone === 'alert' && 'bg-red-50 text-red-600',
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
