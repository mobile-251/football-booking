import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import bookingApi from "../../api/bookingApi";
import type { WalkInBankTransferPayment } from "../../api/bookingApi";

export interface WalkInQrQueueItem extends WalkInBankTransferPayment {
  bookingId: number;
  slotLabel: string;
}

interface WalkInPaymentQrModalProps {
  items: WalkInQrQueueItem[];
  onClose: () => void;
  onAllPaid: () => void;
}

function formatCountdown(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Hết hạn";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WalkInPaymentQrModal: React.FC<WalkInPaymentQrModalProps> = ({
  items,
  onClose,
  onAllPaid,
}) => {
  const [index, setIndex] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const current = items[index];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const pollStatus = useCallback(async () => {
    if (!current) return;
    try {
      const status = await bookingApi.getPaymentStatus(current.bookingId);
      if (status.paymentStatus === "PAID") {
        if (index < items.length - 1) {
          toast.success(`Đã nhận tiền — chuyển sang QR ${index + 2}/${items.length}`);
          setIndex((i) => i + 1);
        } else {
          toast.success("Đã nhận tiền — chờ chủ sân duyệt");
          onAllPaid();
        }
      } else if (status.bookingStatus === "CONFIRMED") {
        if (index < items.length - 1) {
          toast.success(`Đã xác nhận — chuyển sang QR ${index + 2}/${items.length}`);
          setIndex((i) => i + 1);
        } else {
          toast.success("Thanh toán hoàn tất — booking đã xác nhận");
          onAllPaid();
        }
      } else if (status.expired || status.bookingStatus === "CANCELLED") {
        toast.error("QR đã hết hạn — vui lòng đặt lại");
        onClose();
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, [current, index, items.length, onAllPaid, onClose]);

  useEffect(() => {
    if (!current?.expiresAt) return;
    const tick = () => setCountdown(formatCountdown(current.expiresAt!));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [current?.expiresAt]);

  useEffect(() => {
    pollStatus();
    const t = setInterval(pollStatus, 4000);
    return () => clearInterval(t);
  }, [pollStatus]);

  const copyTransferContent = async () => {
    if (!current?.sepayPaymentCode) return;
    try {
      await navigator.clipboard.writeText(current.sepayPaymentCode);
      toast.success("Đã sao chép nội dung chuyển khoản");
    } catch {
      toast.error("Không sao chép được");
    }
  };

  const handleCancel = async () => {
    if (!current || !window.confirm("Hủy booking đang chờ thanh toán?")) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(current.bookingId);
      toast.success("Đã hủy booking");
      if (items.length === 1) {
        onClose();
      } else {
        onAllPaid();
      }
    } catch {
      toast.error("Không hủy được booking");
    } finally {
      setCancelling(false);
    }
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        className="flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="walkin-qr-title"
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary-muted">
            Chuyển khoản SePay
            {items.length > 1 && (
              <span className="ml-2 text-primary">
                ({index + 1}/{items.length})
              </span>
            )}
          </p>
          <h2
            id="walkin-qr-title"
            className="m-0 mt-0.5 text-lg font-bold text-primary-dark"
          >
            Quét QR thanh toán
          </h2>
          <p className="m-0 mt-1 text-sm text-slate-600">{current.slotLabel}</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-center">
          {current.qrImageUrl ? (
            <img
              src={current.qrImageUrl}
              alt="QR chuyển khoản"
              className="mx-auto max-h-[280px] w-full max-w-[280px] rounded-xl border border-gray-100 object-contain"
            />
          ) : (
            <div className="rounded-xl bg-slate-100 py-16 text-sm text-slate-500">
              Không tạo được QR
            </div>
          )}

          <div className="rounded-xl border border-primary/15 bg-primary-light/40 p-4 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Số tiền</span>
              <span className="font-bold text-primary-dark">
                {current.amount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-600">Nội dung CK</span>
              <span className="font-mono font-bold text-primary-dark">
                {current.sepayPaymentCode}
              </span>
            </div>
            {current.expiresAt && (
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-600">Còn lại</span>
                <span className="font-semibold text-amber-700">{countdown}</span>
              </div>
            )}
          </div>

          <p className="m-0 text-xs text-slate-500">
            Khách quét QR trên màn hình quầy bằng app ngân hàng. Hệ thống tự xác
            nhận khi tiền vào (cần webhook SePay hoặc mở lại QR để theo dõi).
          </p>

          <button
            type="button"
            className="btn-secondary w-full"
            onClick={copyTransferContent}
          >
            Sao chép nội dung CK
          </button>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            className="flex-1 rounded-[var(--radius-control)] border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-red-50 disabled:opacity-60"
            onClick={handleCancel}
            disabled={cancelling}
          >
            Hủy booking
          </button>
          <button type="button" className="btn-primary flex-1" onClick={onClose}>
            Quay lại lịch
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkInPaymentQrModal;
