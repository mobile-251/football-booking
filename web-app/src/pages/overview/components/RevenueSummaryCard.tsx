interface RevenueSummaryCardProps {
  total: number;
  bookingRevenue: number;
  comboRevenue: number;
  comboBookings: number;
  changePercent: number;
  formatCurrency: (n: number) => string;
}

export default function RevenueSummaryCard({
  total,
  bookingRevenue,
  comboRevenue,
  comboBookings,
  changePercent,
  formatCurrency,
}: RevenueSummaryCardProps) {
  const absChange = Math.abs(changePercent);
  const changeLabel =
    changePercent > 0
      ? `+${absChange}% so với tháng trước`
      : `${absChange}% so với tháng trước`;
  const changeTone =
    changePercent > 0
      ? 'text-emerald-700 bg-emerald-50'
      : changePercent < 0
        ? 'text-red-700 bg-red-50'
        : 'text-slate-600 bg-slate-100';

  return (
    <div className="card-surface overflow-hidden p-0">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
            ₫
          </div>
          <div>
            <p className="m-0 text-sm font-medium text-slate-500">
              Doanh thu tháng này
            </p>
            <p className="m-0 mt-1 text-3xl font-bold tracking-tight text-primary-dark">
              {formatCurrency(total)}
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${changeTone}`}
            >
              {changeLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[420px] lg:flex-1 lg:max-w-xl">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="m-0 text-xs text-slate-500">Đặt sân (coin / CK)</p>
            <p className="m-0 mt-1 text-base font-bold text-slate-800">
              {formatCurrency(bookingRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3">
            <p className="m-0 text-xs text-violet-600">Bán gói combo</p>
            <p className="m-0 mt-1 text-base font-bold text-violet-900">
              {formatCurrency(comboRevenue)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
            <p className="m-0 text-xs text-amber-800">Đặt bằng gói combo</p>
            <p className="m-0 mt-1 text-base font-bold text-amber-900">
              {comboBookings} lượt
            </p>
            <p className="m-0 mt-0.5 text-[11px] text-amber-700/90">
              Không tính thêm tiền sân
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
