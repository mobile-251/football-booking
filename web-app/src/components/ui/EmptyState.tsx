import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card-surface mx-auto max-w-md px-6 py-12">
      <div className="text-center">
        {icon && <div className="mb-4 text-5xl leading-none">{icon}</div>}
        <h3 className="mb-2 text-lg font-bold text-primary-dark">{title}</h3>
        {description && (
          <p className="mb-5 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <button type="button" className="btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
