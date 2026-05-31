import type { RecentActivityItem } from '../../../api/dashboardApi';

interface RecentCoinActivityProps {
  items: RecentActivityItem[];
}

function formatAmountVnd(amount: number): string {
  const value = Math.abs(Math.round(amount));
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function amountMeta(type: RecentActivityItem['type'], amountVnd: number) {
  const value = Math.abs(amountVnd);
  if (type === 'combo_purchase') {
    return {
      text: formatAmountVnd(value),
      className: 'text-violet-700',
    };
  }
  return {
    text: `+${formatAmountVnd(value)}`,
    className: 'text-emerald-700',
  };
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function typeMeta(type: RecentActivityItem['type']) {
  switch (type) {
    case 'top_up':
      return {
        icon: '💳',
        badge: 'Nạp coin',
        badgeClass: 'bg-emerald-50 text-emerald-700',
      };
    case 'combo_purchase':
      return {
        icon: '🎫',
        badge: 'Mua gói',
        badgeClass: 'bg-violet-50 text-violet-700',
      };
    default:
      return {
        icon: '⚽',
        badge: 'Hoạt động',
        badgeClass: 'bg-slate-100 text-slate-600',
      };
  }
}

export default function RecentCoinActivity({ items }: RecentCoinActivityProps) {
  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h3 className="m-0 text-base font-bold text-primary-dark">
          Coin & gói combo gần đây
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Nạp coin, mua gói và thanh toán liên quan sân bạn
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Chưa có giao dịch coin tại sân này
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const meta = typeMeta(item.type);
            const amount = amountMeta(item.type, item.amountVnd);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/80 px-4 py-3"
              >
                <span className="text-xl" aria-hidden>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 truncate text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}
                    >
                      {meta.badge}
                    </span>
                  </div>
                  <p className="m-0 mt-0.5 truncate text-xs text-slate-500">
                    {item.subtitle} · {formatTimeAgo(item.createdAt)}
                  </p>
                </div>
                <p
                  className={`m-0 shrink-0 text-sm font-bold ${amount.className}`}
                >
                  {amount.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
