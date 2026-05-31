import { cn } from "../../../lib/cn";

type Variant = "dark" | "light";

type AppStoreBadgesProps = {
  variant?: Variant;
  className?: string;
};

const APP_STORE_URL = "https://apps.apple.com/vn/app/ballmate/id0000000000";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=vn.ballmate.app";

export default function AppStoreBadges({
  variant = "dark",
  className,
}: AppStoreBadgesProps) {
  const base =
    "inline-flex h-13 min-h-[52px] items-center gap-3 rounded-[14px] px-4 transition-all active:translate-y-px";
  const styles =
    variant === "dark"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-white text-slate-900 border border-slate-200 hover:border-primary/40";

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Tải Ballmate trên App Store"
        className={cn(base, styles)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <path d="M16.365 1.43c0 1.14-.475 2.27-1.247 3.083-.83.876-2.196 1.55-3.337 1.456-.146-1.118.42-2.293 1.182-3.067.85-.857 2.293-1.477 3.402-1.472zM19.6 17.43c-.523 1.207-.77 1.745-1.43 2.81-.926 1.49-2.23 3.347-3.846 3.36-1.436.013-1.806-.937-3.756-.925-1.95.013-2.357.95-3.795.937-1.616-.013-2.85-1.69-3.776-3.18-2.59-4.155-2.862-9.034-1.264-11.633C2.866 6.998 4.69 5.95 6.402 5.95c1.741 0 2.836.957 4.273.957 1.394 0 2.244-.96 4.26-.96 1.526 0 3.144.833 4.295 2.27-3.778 2.07-3.166 7.469.37 9.213z" />
        </svg>
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            Tải về trên
          </span>
          <span className="text-[16px] font-semibold">App Store</span>
        </span>
      </a>

      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Tải Ballmate trên Google Play"
        className={cn(base, styles)}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .61-.92z"
            fill="#34a853"
          />
          <path
            d="M16.794 8.913l-2.706 3.087 2.706 3.087 3.45-1.99c.92-.53.92-1.864 0-2.394l-3.45-1.79z"
            fill="#fbbc04"
          />
          <path
            d="M3.61 1.814l10.18 10.184L16.793 8.91 4.99 1.214a.999.999 0 0 0-1.38.6z"
            fill="#ea4335"
          />
          <path
            d="M3.61 22.186l10.18-10.188 3.003 3.088L4.99 22.786a.999.999 0 0 1-1.38-.6z"
            fill="#4285f4"
          />
        </svg>
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            Tải về trên
          </span>
          <span className="text-[16px] font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
