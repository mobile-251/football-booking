import type { RecentBookingItem } from '../../../api/dashboardApi';
import { cn } from '../../../lib/cn';

interface RecentBookingsProps {
  bookings: RecentBookingItem[];
  onViewAll?: () => void;
}

function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function RecentBookings({
  bookings,
  onViewAll,
}: RecentBookingsProps) {
  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-bold text-primary-dark">
            Đặt sân mới nhất
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Các đơn hàng được đặt gần đây nhất
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            className="btn-primary shrink-0 px-4 py-2 text-sm"
            onClick={onViewAll}
          >
            Xem tất cả
          </button>
        )}
      </div>

      <div className="flex flex-col divide-y divide-gray-100">
        {bookings.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Chưa có đơn đặt sân nào
          </p>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                {getInitials(b.customerName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate font-semibold text-slate-800">
                  {b.customerName}
                </p>
                <p className="m-0 mt-0.5 text-sm text-slate-500">
                  {b.startTime} - {b.endTime} · {b.fieldName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="m-0 font-semibold text-primary-dark">
                  {formatPrice(b.totalPrice)}
                </p>
                <span
                  className={cn(
                    'mt-1 inline-flex items-center gap-1 text-xs font-medium',
                    b.isPaid ? 'text-primary' : 'text-amber-600',
                  )}
                >
                  {b.isPaid ? (
                    <>
                      <span aria-hidden>✓</span> Đã thanh toán
                    </>
                  ) : (
                    'Chờ thanh toán'
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
