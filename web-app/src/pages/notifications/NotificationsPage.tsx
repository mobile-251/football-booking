import { useCallback, useEffect, useState } from "react";
import PageShell from "../../components/layout/PageShell";
import notificationApi, { type AppNotification } from "../../api/notificationApi";

type Filter = "all" | "unread";

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function typeLabel(type: string) {
  switch (type) {
    case "BOOKING_PENDING":
      return "Chờ duyệt";
    case "BOOKING_CONFIRMED":
      return "Đã xác nhận";
    case "BOOKING_CANCELLED":
      return "Đã hủy";
    case "PAYMENT_SUCCESS":
      return "Thanh toán / Coin";
    case "PAYMENT_PENDING":
      return "Thanh toán";
    default:
      return "Thông báo";
  }
}

interface NotificationsPageProps {
  onNavigateSchedule?: () => void;
}

export default function NotificationsPage({
  onNavigateSchedule,
}: NotificationsPageProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await notificationApi.getAll(filter === "unread");
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    await load();
  };

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    await load();
  };

  const remove = async (id: number) => {
    await notificationApi.delete(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const handleItemClick = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.data?.bookingId && onNavigateSchedule) {
      onNavigateSchedule();
    }
  };

  return (
    <PageShell
      title="Thông báo"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} thông báo chưa đọc`
          : "Theo dõi đặt sân và thanh toán"
      }
      loading={loading}
      actions={
        unreadCount > 0 ? (
          <button type="button" className="btn-secondary !py-2 !px-4 text-sm" onClick={markAllRead}>
            Đánh dấu đã đọc
          </button>
        ) : undefined
      }
    >
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === key
                ? "bg-primary text-white"
                : "bg-white text-primary-dark hover:bg-primary-light"
            }`}
            onClick={() => setFilter(key)}
          >
            {key === "all" ? "Tất cả" : "Chưa đọc"}
          </button>
        ))}
      </div>

      {items.length === 0 && !loading ? (
        <div className="card-surface px-6 py-16 text-center">
          <p className="m-0 text-4xl">🔔</p>
          <p className="m-0 mt-3 text-base font-semibold text-primary-dark">
            {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo"}
          </p>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Lượt đặt sân mới và yêu cầu duyệt sẽ hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="card-surface divide-y divide-gray-100 overflow-hidden">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 px-5 py-4 transition-colors ${
                !n.isRead ? "bg-primary-light/25" : "bg-white"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => handleItemClick(n)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-dark">
                    {typeLabel(n.type)}
                  </span>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  )}
                </div>
                <p className="m-0 mt-1.5 text-sm font-semibold text-slate-900">
                  {n.title}
                </p>
                <p className="m-0 mt-0.5 text-sm leading-relaxed text-slate-600">
                  {n.message}
                </p>
                <p className="m-0 mt-2 text-xs text-slate-400">
                  {formatTimeAgo(n.createdAt)}
                </p>
              </button>
              <div className="flex shrink-0 flex-col gap-1">
                {!n.isRead && (
                  <button
                    type="button"
                    title="Đánh dấu đã đọc"
                    className="rounded-lg p-2 text-primary hover:bg-primary-light"
                    onClick={() => markRead(n.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  title="Xóa"
                  className="rounded-lg p-2 text-danger hover:bg-red-50"
                  onClick={() => remove(n.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
