import type { TodayScheduleSlot } from '../../../api/dashboardApi';
import { cn } from '../../../lib/cn';

interface TodayScheduleProps {
  slots: TodayScheduleSlot[];
}

export default function TodaySchedule({ slots }: TodayScheduleProps) {
  const maxCount = Math.max(...slots.map((s) => s.bookingCount), 1);

  return (
    <div className="card-surface flex h-full flex-col p-5">
      <div className="mb-4">
        <h3 className="m-0 text-base font-bold text-primary-dark">
          Lịch hôm nay
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Tình trạng các khung giờ
        </p>
      </div>

      <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
        {slots.map((slot) => (
          <div key={slot.hour} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-xs font-medium text-slate-500">
              {slot.hour}
            </span>
            <div className="relative flex-1">
              {slot.status === 'maintenance' ? (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {slot.note ?? 'Bảo trì'}
                </div>
              ) : (
                <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                  {slot.bookingCount > 0 && (
                    <div
                      className="flex h-full items-center rounded-lg bg-primary/20 px-2 text-xs font-semibold text-primary-dark"
                      style={{
                        width: `${Math.max((slot.bookingCount / maxCount) * 100, 28)}%`,
                      }}
                    >
                      {slot.bookingCount}
                    </div>
                  )}
                </div>
              )}
            </div>
            {slot.status === 'maintenance' && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Đã đặt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          Trống
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full bg-red-500')} />
          Bảo trì
        </span>
      </div>
    </div>
  );
}
