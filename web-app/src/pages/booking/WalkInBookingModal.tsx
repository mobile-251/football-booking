import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import bookingApi from "../../api/bookingApi";
import fieldApi from "../../api/fieldApi";
import type { FieldPricingSlot } from "../../api/fieldApi";
import { groupContiguousHours, type TimeRange } from "./slotSelection";

export interface WalkInTimeRange {
  startTime: string;
  endTime: string;
}

export interface WalkInSlotContext {
  fieldId: number;
  fieldName: string;
  date: string;
  ranges: WalkInTimeRange[];
}

interface WalkInBookingModalProps {
  venueId: number;
  slot: WalkInSlotContext;
  onClose: () => void;
  onSuccess: () => void;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function rangesToGrouped(ranges: WalkInTimeRange[]): TimeRange[] {
  const hours: number[] = [];
  for (const r of ranges) {
    const startH = parseInt(r.startTime.split(":")[0], 10);
    const endH = parseInt(r.endTime.split(":")[0], 10);
    for (let h = startH; h < endH; h++) hours.push(h);
  }
  return groupContiguousHours(hours);
}

const WalkInBookingModal: React.FC<WalkInBookingModalProps> = ({
  venueId,
  slot,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [pricingSlots, setPricingSlots] = useState<FieldPricingSlot[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const groupedRanges = useMemo(() => rangesToGrouped(slot.ranges), [slot.ranges]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const loadPricing = async () => {
      setPricingLoading(true);
      try {
        const data = await fieldApi.getPricing(slot.fieldId, slot.date);
        setPricingSlots(data.slots ?? []);
      } catch {
        toast.error("Không tải được bảng giá sân");
        setPricingSlots([]);
      } finally {
        setPricingLoading(false);
      }
    };
    loadPricing();
  }, [slot.fieldId, slot.date]);

  const { totalPrice, priceBreakdown, allConfigured } = useMemo(() => {
    const breakdown: { time: string; price: number }[] = [];
    let total = 0;

    for (const range of groupedRanges) {
      for (let h = range.startHour; h < range.endHour; h++) {
        const timeLabel = `${h.toString().padStart(2, "0")}:00`;
        const match = pricingSlots.find(
          (s) =>
            s.startTime === timeLabel && s.isConfigured && s.price != null,
        );
        if (!match?.price) {
          return { totalPrice: null, priceBreakdown: [], allConfigured: false };
        }
        breakdown.push({
          time: `${timeLabel} – ${(h + 1).toString().padStart(2, "0")}:00`,
          price: match.price,
        });
        total += match.price;
      }
    }

    return { totalPrice: total, priceBreakdown: breakdown, allConfigured: true };
  }, [pricingSlots, groupedRanges]);

  const slotCount = groupedRanges.reduce(
    (n, r) => n + (r.endHour - r.startHour),
    0,
  );

  const canSubmit =
    !pricingLoading &&
    allConfigured &&
    totalPrice !== null &&
    groupedRanges.length > 0 &&
    customerName.trim() &&
    customerEmail.trim() &&
    customerPhone.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const payload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      note: note.trim() || undefined,
    };

    try {
      for (const range of groupedRanges) {
        await bookingApi.createWalkIn(venueId, {
          fieldId: slot.fieldId,
          date: slot.date,
          startTime: range.startTime,
          endTime: range.endTime,
          ...payload,
        });
      }
      const count = groupedRanges.length;
      toast.success(
        count > 1
          ? `Đã tạo ${count} booking — thanh toán tại sân`
          : "Đặt sân hộ khách thành công — thanh toán tại sân",
      );
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? "Không thể tạo booking";
      const text = Array.isArray(msg) ? msg.join(", ") : String(msg);
      toast.error(text);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="walkin-modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary-muted">
              Đặt tại quầy
            </p>
            <h2
              id="walkin-modal-title"
              className="m-0 mt-0.5 text-lg font-bold text-primary-dark"
            >
              Đặt sân hộ khách
            </h2>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary-light to-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-sm font-bold text-primary-dark">
                    {slot.fieldName}
                  </p>
                  <p className="m-0 mt-1 text-sm text-slate-600">
                    {formatDisplayDate(slot.date)}
                  </p>
                  <p className="m-0 mt-1 text-sm font-semibold text-primary">
                    {groupedRanges.length > 1
                      ? `${groupedRanges.length} khung giờ`
                      : "1 khung giờ"}
                    <span className="ml-1 font-normal text-slate-500">
                      ({slotCount} giờ)
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="m-0 text-xs text-primary-muted">Tổng tiền</p>
                  {pricingLoading ? (
                    <p className="m-0 text-sm text-slate-500">Đang tính...</p>
                  ) : totalPrice != null ? (
                    <p className="m-0 text-xl font-bold text-primary-dark">
                      {totalPrice.toLocaleString("vi-VN")}
                      <span className="text-sm font-semibold">đ</span>
                    </p>
                  ) : (
                    <p className="m-0 max-w-[140px] text-xs font-medium text-danger">
                      Chưa có giá — cấu hình tại Quản lý sân
                    </p>
                  )}
                </div>
              </div>

              <ul className="m-0 mt-3 list-none space-y-1.5 border-t border-primary/10 p-0 pt-3">
                {groupedRanges.map((r) => (
                  <li
                    key={`${r.startTime}-${r.endTime}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-primary-dark">
                      {r.startTime} – {r.endTime}
                    </span>
                    <span className="text-xs text-slate-500">
                      {r.endHour - r.startHour} giờ
                    </span>
                  </li>
                ))}
              </ul>

              {!pricingLoading && priceBreakdown.length > 0 && (
                <ul className="m-0 mt-3 list-none space-y-1 border-t border-primary/10 p-0 pt-3">
                  {priceBreakdown.map((row) => (
                    <li
                      key={row.time}
                      className="flex justify-between text-xs text-slate-600"
                    >
                      <span>{row.time}</span>
                      <span className="font-semibold text-primary-dark">
                        {row.price.toLocaleString("vi-VN")}đ
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Họ tên khách <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nguyễn Văn A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Số điện thoại <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="09xx xxx xxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="khach@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Ghi chú
                </label>
                <textarea
                  className="input-field min-h-[80px] resize-y py-2.5"
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg">
                💵
              </span>
              <div>
                <p className="m-0 text-sm font-semibold text-primary-dark">
                  Thanh toán tại sân
                </p>
                <p className="m-0 text-xs text-slate-600">
                  {groupedRanges.length > 1
                    ? "Mỗi khung giờ tạo một booking riêng"
                    : "Khách trả tiền mặt trực tiếp tại quầy"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={!canSubmit || submitting}
            >
              {submitting
                ? "Đang lưu..."
                : groupedRanges.length > 1
                  ? `Xác nhận ${groupedRanges.length} booking`
                  : "Xác nhận đặt sân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkInBookingModal;
