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
  const sign = changePercent > 0 ? '+' : '';

  return (
    <div className="card-surface col-span-1 flex flex-col gap-4 p-5 sm:col-span-2 xl:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-sm text-slate-500">Doanh thu tháng này</p>
          <p className="m-0 mt-1 text-3xl font-bold text-primary-dark">
            {formatCurrency(total)}
          </p>
          <p className="m-0 mt-1 text-xs font-medium text-primary">
            {sign}
            {changePercent}% so với tháng trước
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-lg font-bold text-primary">
          ₫
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Đặt sân (coin/CK)
          </p>
          <p className="m-0 mt-1 text-sm font-bold text-slate-800">
            {formatCurrency(bookingRevenue)}
          </p>
        </div>
        <div className="rounded-xl bg-violet-50 px-3 py-2.5">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-violet-600">
            Bán gói combo
          </p>
          <p className="m-0 mt-1 text-sm font-bold text-violet-900">
            {formatCurrency(comboRevenue)}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2.5">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Đặt bằng gói
          </p>
          <p className="m-0 mt-1 text-sm font-bold text-amber-900">
            {comboBookings} lượt
          </p>
          <p className="m-0 mt-0.5 text-[10px] text-amber-700/80">
            Không cộng thêm tiền sân
          </p>
        </div>
      </div>
    </div>
  );
}
