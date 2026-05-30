import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import bookingApi from "../../api/bookingApi";
import WalkInPaymentQrModal from "./WalkInPaymentQrModal";
import type { WalkInQrQueueItem } from "./WalkInPaymentQrModal";
import {
  canConfirmBooking,
  getBookingStatusLabel,
  isAwaitingBankPayment,
} from "./bookingDisplay";
import { usePaymentStatusPoll } from "./usePaymentStatusPoll";

interface Booking {
  id: string | number;
  fieldId: number;
  fieldName?: string;
  customerName: string;
  phoneNumber?: string;
  startTime: string;
  endTime: string;
  price?: number;
  type: "booked" | "maintenance" | "pending" | "confirmed" | "canceled";
  note?: string;
  status?: string;
  source?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
  onRefresh?: () => void;
  onUpdate?: () => void;
}

type CheckInStep = "idle" | "walkin" | "mobile";

const statusBadgeClass: Record<string, string> = {
  "Chờ thanh toán CK": "bg-violet-600",
  "Chờ duyệt": "bg-amber-500",
  "Đã xác nhận": "bg-primary",
  "Hoàn tất": "bg-blue-500",
  "Đã hủy": "bg-slate-400",
};

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onRefresh,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [checkInStep, setCheckInStep] = useState<CheckInStep>("idle");
  const [fetchingCode, setFetchingCode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus);
  const [qrItem, setQrItem] = useState<WalkInQrQueueItem | null>(null);

  const isWalkIn = booking.source === "WEB_WALK_IN";
  const awaitingPayment = isAwaitingBankPayment(
    booking.paymentMethod,
    paymentStatus,
  );
  const canConfirm = canConfirmBooking(
    booking.status,
    booking.paymentMethod,
    paymentStatus,
  );
  const statusLabel = getBookingStatusLabel(
    booking.status,
    booking.paymentMethod,
    paymentStatus,
  );
  const statusClassName =
    statusBadgeClass[statusLabel] ?? "bg-slate-400";

  useEffect(() => {
    if (!isWalkIn || booking.paymentMethod !== "BANK_TRANSFER") return;
    bookingApi
      .getPaymentStatus(Number(booking.id))
      .then((data) => setPaymentStatus(data.paymentStatus))
      .catch(() => {});
  }, [booking.id, booking.paymentMethod, isWalkIn]);

  usePaymentStatusPoll(
    Number(booking.id),
    awaitingPayment,
    (data) => {
      if (data.paymentStatus === "PAID") {
        setPaymentStatus("PAID");
        toast.success("Đã nhận chuyển khoản — có thể duyệt booking");
        onRefresh?.();
      }
    },
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const openPaymentQr = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getPaymentStatus(Number(booking.id));
      if (data.paymentStatus === "PAID") {
        setPaymentStatus("PAID");
        toast.success("SePay đã ghi nhận thanh toán");
        onRefresh?.();
        return;
      }
      if (
        !data.qrImageUrl ||
        !data.sepayPaymentCode
      ) {
        toast.error("Không mở được QR — kiểm tra lại trạng thái thanh toán");
        return;
      }
      setQrItem({
        bookingId: Number(booking.id),
        slotLabel: `${booking.startTime} – ${booking.endTime}`,
        method: "BANK_TRANSFER",
        status: data.paymentStatus,
        amount: data.amount ?? booking.price ?? 0,
        sepayPaymentCode: data.sepayPaymentCode,
        qrImageUrl: data.qrImageUrl,
        expiresAt: data.expiresAt ?? "",
      });
    } catch {
      toast.error("Không tải được thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentAgain = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getPaymentStatus(Number(booking.id));
      setPaymentStatus(data.paymentStatus);
      if (data.paymentStatus === "PAID") {
        toast.success("Đã nhận chuyển khoản — có thể duyệt booking");
        onRefresh?.();
      } else {
        toast.error(
          "SePay chưa ghi nhận thanh toán. Kiểm tra số VA, số tiền và nội dung CK (mã BM...).",
        );
      }
    } catch {
      toast.error("Không kiểm tra được trạng thái thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const markPaidManually = async () => {
    if (
      !window.confirm(
        "Xác nhận bạn đã kiểm tra sao kê và thấy tiền vào tài khoản?",
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await bookingApi.markBankTransferPaid(Number(booking.id));
      setPaymentStatus("PAID");
      toast.success("Đã ghi nhận thanh toán — có thể duyệt booking");
      onRefresh?.();
    } catch {
      toast.error("Không cập nhật được trạng thái thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      toast.error("Booking chuyển khoản phải được thanh toán trước khi duyệt");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn duyệt booking này?")) return;

    setLoading(true);
    try {
      await bookingApi.confirm(Number(booking.id));
      toast.success("Đã duyệt booking thành công!");
      onUpdate?.();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi duyệt booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy booking này?")) return;

    setLoading(true);
    try {
      await bookingApi.cancel(Number(booking.id));
      toast.success("Đã hủy booking thành công!");
      onUpdate?.();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi hủy booking");
    } finally {
      setLoading(false);
    }
  };

  const startCheckIn = async () => {
    if (isWalkIn) {
      setFetchingCode(true);
      setCheckInStep("walkin");
      try {
        const detail = (await bookingApi.getOne(Number(booking.id))) as {
          bookingCode?: string;
        };
        const code = detail.bookingCode?.trim() ?? "";
        if (!code || code === "Chờ xác nhận") {
          toast.error("Không lấy được mã booking");
          setCheckInStep("idle");
          return;
        }
        setBookingCode(code);
      } catch {
        toast.error("Không tải được mã booking");
        setCheckInStep("idle");
      } finally {
        setFetchingCode(false);
      }
    } else {
      setBookingCode("");
      setCheckInStep("mobile");
    }
  };

  const handleComplete = async () => {
    if (!bookingCode.trim()) {
      toast.error(
        isWalkIn ? "Chưa có mã booking" : "Vui lòng nhập mã booking khách đọc từ app",
      );
      return;
    }

    setLoading(true);
    try {
      await bookingApi.complete(Number(booking.id), {
        bookingCode: bookingCode.trim(),
      });
      toast.success("Check-in thành công!");
      onUpdate?.();
    } catch (error) {
      console.error(error);
      toast.error("Mã booking không đúng hoặc có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const resetCheckIn = () => {
    setCheckInStep("idle");
    setBookingCode("");
  };

  const detailItems = [
    {
      label: "Khách hàng",
      value: booking.customerName,
      icon: (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
    {
      label: "Số điện thoại",
      value: booking.phoneNumber || "—",
      icon: (
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      ),
    },
    {
      label: "Sân",
      value: booking.fieldName || `Sân ${booking.fieldId}`,
      icon: (
        <>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </>
      ),
    },
    {
      label: "Thời gian",
      value: `${booking.startTime} – ${booking.endTime}`,
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      ),
    },
    {
      label: "Giá tiền",
      value: booking.price
        ? `${booking.price.toLocaleString("vi-VN")}đ`
        : "—",
      money: true,
      icon: (
        <>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="booking-detail-title"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary-muted">
              Chi tiết booking
            </p>
            <h2
              id="booking-detail-title"
              className="m-0 mt-0.5 text-lg font-bold text-primary-dark"
            >
              {booking.customerName}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold text-white ${statusClassName}`}
              >
                {statusLabel}
              </span>
              {isWalkIn && (
                <span className="inline-flex rounded-md border border-primary/25 bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary-dark">
                  Đặt tại quầy
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {detailItems.map((item) => (
            <div key={item.label} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-xs text-primary-muted">{item.label}</p>
                <p
                  className={`m-0 truncate text-base font-semibold ${
                    item.money ? "text-primary-dark" : "text-slate-800"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}

          {booking.note && (
            <div className="rounded-xl border border-gray-100 bg-slate-50 px-4 py-3">
              <p className="m-0 text-xs font-semibold text-slate-500">Ghi chú</p>
              <p className="m-0 mt-1 text-sm text-slate-700">{booking.note}</p>
            </div>
          )}

          {awaitingPayment && (
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
              <p className="m-0 text-sm font-semibold text-violet-900">
                Chưa nhận chuyển khoản
              </p>
              <p className="m-0 mt-1 text-xs text-violet-800/90">
                Khách cần quét QR và chuyển khoản đúng nội dung mã BM… Nếu đã
                chuyển mà chưa đổi trạng thái, bấm &quot;Kiểm tra lại SePay&quot;
                hoặc xác nhận thủ công sau khi đối sao kê.
              </p>
            </div>
          )}

          {booking.status === "PENDING" &&
            booking.paymentMethod === "BANK_TRANSFER" &&
            paymentStatus === "PAID" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="m-0 text-sm font-semibold text-emerald-900">
                  Đã thanh toán chuyển khoản
                </p>
                <p className="m-0 mt-1 text-xs text-emerald-800/90">
                  Tiền đã vào — vui lòng duyệt booking để xác nhận lịch.
                </p>
              </div>
            )}

          {checkInStep === "walkin" && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-light to-white p-4">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                Mã check-in (đặt tại quầy)
              </p>
              {fetchingCode ? (
                <p className="m-0 mt-2 text-sm text-slate-500">Đang lấy mã...</p>
              ) : (
                <p className="m-0 mt-2 font-mono text-2xl font-bold tracking-[0.2em] text-primary-dark">
                  {bookingCode}
                </p>
              )}
            </div>
          )}

          {checkInStep === "mobile" && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-4">
              <p className="m-0 text-sm font-semibold text-amber-900">
                Nhập mã khách đọc từ app
              </p>
              <p className="m-0 mt-1 text-xs text-amber-800/90">
                Booking từ mobile — khách xem mã sau khi chủ sân duyệt
              </p>
              <input
                type="text"
                className="input-field mt-3 font-mono uppercase tracking-wider"
                placeholder="VD: BM1A2B3C"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-gray-100 px-6 py-4">
          {booking.status === "PENDING" && checkInStep === "idle" && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-[var(--radius-control)] border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50 disabled:opacity-60"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Hủy đơn
                </button>
                {awaitingPayment ? (
                  <>
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={openPaymentQr}
                      disabled={loading}
                    >
                      Xem QR thanh toán
                    </button>
                  </>
                ) : (
                  canConfirm && (
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={handleConfirm}
                      disabled={loading}
                    >
                      Duyệt ngay
                    </button>
                  )
                )}
              </div>
              {awaitingPayment && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={checkPaymentAgain}
                    disabled={loading}
                  >
                    Kiểm tra lại SePay
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-60"
                    onClick={markPaidManually}
                    disabled={loading}
                  >
                    Xác nhận đã nhận tiền (đối sao kê)
                  </button>
                </div>
              )}
            </div>
          )}

          {booking.status === "CONFIRMED" && checkInStep === "idle" && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={startCheckIn}
              disabled={loading}
            >
              Check-in (hoàn tất)
            </button>
          )}

          {booking.status === "CONFIRMED" && checkInStep !== "idle" && (
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={resetCheckIn}
                disabled={loading || fetchingCode}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleComplete}
                disabled={
                  loading ||
                  fetchingCode ||
                  !bookingCode.trim()
                }
              >
                {loading ? "Đang xử lý..." : "Xác nhận check-in"}
              </button>
            </div>
          )}
        </div>
      </div>

      {qrItem && (
        <WalkInPaymentQrModal
          items={[qrItem]}
          onClose={() => setQrItem(null)}
          onAllPaid={() => {
            setQrItem(null);
            setPaymentStatus("PAID");
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default BookingDetailModal;
