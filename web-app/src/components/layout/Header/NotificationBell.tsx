import React, { useCallback, useEffect, useRef, useState } from "react";
import notificationApi, { type AppNotification } from "../../../api/notificationApi";
import { TBIcon } from "../../../assets/icons";

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const NotificationBell: React.FC<{ onOpenAll?: () => void }> = ({
  onOpenAll,
}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [list, countRes] = await Promise.all([
        notificationApi.getAll(),
        notificationApi.getUnreadCount(),
      ]);
      setItems(list);
      setUnreadCount(countRes.unreadCount);
    } catch {
      /* ignore when not logged in */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    await load();
  };

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    await load();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10"
        onClick={toggle}
        aria-label="Thông báo"
      >
        <img src={TBIcon} alt="" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="m-0 text-sm font-bold text-primary-dark">Thông báo</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={markAllRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">
                Chưa có thông báo
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    !n.isRead ? "bg-primary-light/30" : ""
                  }`}
                  onClick={() => !n.isRead && markRead(n.id)}
                >
                  <p className="m-0 text-sm font-semibold text-slate-800">
                    {n.title}
                  </p>
                  <p className="m-0 mt-0.5 text-xs leading-relaxed text-slate-600">
                    {n.message}
                  </p>
                  <p className="m-0 mt-1 text-[11px] text-slate-400">
                    {formatTimeAgo(n.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
          {onOpenAll && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                className="w-full rounded-lg py-2 text-center text-sm font-semibold text-primary hover:bg-primary-light"
                onClick={() => {
                  setOpen(false);
                  onOpenAll();
                }}
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
