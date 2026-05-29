import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  loading?: boolean;
  maxWidth?: "default" | "wide" | "full";
  children?: ReactNode;
}

function PageShell({
  title,
  subtitle,
  actions,
  loading = false,

  children,
}: PageShellProps) {
  return (
    <div className={cn("w-full px-6 pb-8 pt-5 box-border")}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-base font-bold leading-6 text-primary-dark">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm font-semibold leading-5 text-primary">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="skeleton-shimmer h-[140px] rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="skeleton-shimmer h-[100px] rounded-2xl" />
            <div className="skeleton-shimmer h-[100px] rounded-2xl" />
            <div className="skeleton-shimmer h-[100px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">{children}</div>
      )}
    </div>
  );
}

export default PageShell;
