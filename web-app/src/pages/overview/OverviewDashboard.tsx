import { useEffect, useState } from "react";
import PageShell from "../../components/layout/PageShell";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";
import { isOwner } from "../../types/auth";
import dashboardApi, { type VenueDashboardData } from "../../api/dashboardApi";
import StatCard from "./components/StatCard";
import RevenueChart from "./components/RevenueChart";
import RevenueSummaryCard from "./components/RevenueSummaryCard";
import TodaySchedule from "./components/TodaySchedule";
import RecentBookings from "./components/RecentBookings";
import RecentCoinActivity from "./components/RecentCoinActivity";

interface OverviewDashboardProps {
  onNavigateRegister?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateManagers?: () => void;
}

function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(amount))}đ`;
}

function formatPercentChange(
  value: number,
  suffix = "so với tháng trước",
): string {
  const abs = Math.abs(value);
  if (value > 0) return `+${abs}% ${suffix}`;
  return `${abs}% ${suffix}`;
}

function OverviewDashboard({
  onNavigateRegister,
  onNavigateSchedule,
}: OverviewDashboardProps) {
  const { venues, currentVenueId, isLoading, user } = useCurrentVenue();
  const [dashboard, setDashboard] = useState<VenueDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentVenueId) {
      setDashboard(null);
      return;
    }

    let cancelled = false;
    setDashboardLoading(true);
    setDashboardError(null);

    dashboardApi
      .getVenueDashboard(currentVenueId)
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardError("Không tải được dữ liệu tổng quan");
          setDashboard(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentVenueId]);

  if (isLoading) {
    return <PageShell title="Tổng quan" loading />;
  }

  if (user && isOwner(user) && venues.length === 0) {
    return (
      <PageShell title="Tổng quan">
        <div className="card-surface px-6 py-12 text-center">
          <div className="mb-4 text-5xl">⚽</div>
          <h2 className="mb-2 text-lg font-bold text-primary-dark">
            Chưa có sân nào
          </h2>
          <p className="mb-6 text-slate-500">
            Bắt đầu bằng cách đăng ký sân đầu tiên của bạn.
          </p>
          {onNavigateRegister && (
            <button
              type="button"
              className="btn-primary"
              onClick={onNavigateRegister}
            >
              Đăng ký sân
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  if (!currentVenueId) {
    return (
      <PageShell
        title="Tổng quan"
        subtitle="Chọn sân ở menu bên trái để xem thống kê"
      />
    );
  }

  const stats = dashboard?.stats;

  return (
    <PageShell
      title="Tổng quan"
      subtitle="Theo dõi doanh thu, lịch đặt sân và hoạt động coin tại sân."
    >
      {dashboardError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {dashboardError}
        </div>
      )}

      {dashboardLoading && !dashboard ? (
        <div className="flex flex-col gap-5">
          <div className="skeleton-shimmer h-[160px] rounded-2xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-[120px] rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="skeleton-shimmer h-[280px] rounded-2xl" />
            <div className="skeleton-shimmer h-[280px] rounded-2xl" />
          </div>
          <div className="skeleton-shimmer h-[200px] rounded-2xl" />
        </div>
      ) : stats ? (
        <>
          <RevenueSummaryCard
            total={stats.monthlyRevenue}
            bookingRevenue={stats.monthlyBookingRevenue}
            comboRevenue={stats.monthlyComboRevenue}
            comboBookings={stats.comboBookingsThisMonth}
            changePercent={stats.monthlyRevenueChangePercent}
            formatCurrency={formatCurrency}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-600"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
              iconBg="bg-slate-100"
              label="Đặt sân hôm nay"
              value={String(stats.todayBookings)}
              badge={
                stats.todayBookingsChange > 0
                  ? `+${stats.todayBookingsChange} so với hôm qua`
                  : stats.todayBookingsChange < 0
                    ? `${Math.abs(stats.todayBookingsChange)} ít hơn hôm qua`
                    : "Bằng hôm qua"
              }
              badgeTone="neutral"
            />
            <StatCard
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              }
              iconBg="bg-primary-light"
              label="Tỷ lệ lấp đầy"
              value={`${stats.occupancyRate}%`}
              badge={formatPercentChange(stats.occupancyChangePercent)}
              badgeTone="positive"
            />
            <StatCard
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-red-500"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              }
              iconBg="bg-red-50"
              label="Thông báo mới"
              value={String(stats.unreadNotifications)}
              badge={
                stats.unreadNotifications > 0
                  ? "Cần xem"
                  : "Không có thông báo mới"
              }
              badgeTone={stats.unreadNotifications > 0 ? "alert" : "neutral"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {dashboard?.revenueChart && (
              <RevenueChart data={dashboard.revenueChart} />
            )}
            {dashboard?.todaySchedule && (
              <TodaySchedule slots={dashboard.todaySchedule} />
            )}
          </div>

          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
            <RecentCoinActivity items={dashboard.recentActivity} />
          )}

          {dashboard?.recentBookings && (
            <RecentBookings
              bookings={dashboard.recentBookings}
              onViewAll={onNavigateSchedule}
            />
          )}
        </>
      ) : null}
    </PageShell>
  );
}

export default OverviewDashboard;
