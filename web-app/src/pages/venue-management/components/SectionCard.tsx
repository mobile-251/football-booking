import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  children: ReactNode;
  action?: ReactNode;
}

export default function SectionCard({
  title,
  subtitle,
  onEdit,
  children,
  action,
}: SectionCardProps) {
  return (
    <section className="card-surface p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-primary-dark">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {onEdit && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition-colors hover:border-primary hover:text-primary"
              onClick={onEdit}
              aria-label={`Chỉnh sửa ${title}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
