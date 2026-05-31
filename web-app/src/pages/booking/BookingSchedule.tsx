import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import BookingDetailModal from "./BookingDetailModal";
import WalkInBookingModal from "./WalkInBookingModal";
import WalkInPaymentQrModal from "./WalkInPaymentQrModal";
import type { WalkInQrQueueItem } from "./WalkInPaymentQrModal";
import type { WalkInSlotContext } from "./WalkInBookingModal";
import venueApi from "../../api/venueApi";
import bookingApi from "../../api/bookingApi";
import { useCurrentVenue } from "../../hooks/useCurrentVenue";
import { getVenueScheduleConfig } from "../../utils/venueHours";
import { Toaster, toast } from "react-hot-toast";
import {
  getBookingCardVariant,
  getBookingStatusLabel,
  isAwaitingBankPayment,
} from "./bookingDisplay";
import { PAYMENT_POLL_INTERVAL_MS } from "./paymentPolling";
import {
  addDragRangeToSelection,
  formatSelectionRanges,
  getDragRange,
  groupContiguousHours,
  hourToTimeString,
  isHourInDragPreview,
  isHourSelected,
  selectionSlotCount,
  toggleHourInSelection,
  type SlotSelection,
} from "./slotSelection";

// Interface mapping to backend models
type FieldOperationalStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

interface Field {
  id: number;
  name: string;
  fieldType: string;
  isActive: boolean;
  operationalStatus?: FieldOperationalStatus;
  venueId: number;
}

const SLOT_HEIGHT_PX = 64;

interface Booking {
  id: string | number; // Frontend handles ID, backend is number
  fieldId: number;
  fieldName: string; // Added fieldName for better display
  customerName: string;
  phoneNumber?: string;
  startTime: string; // HH:mm format for display
  endTime: string; // HH:mm format for display
  price?: number;
  type: "booked" | "maintenance" | "pending" | "confirmed" | "canceled";
  note?: string;
  status?: string;
  source?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  originalData?: any; // Store full backend object if needed
}

const BookingSchedule: React.FC = () => {
  // Stage: Selected date for the schedule (default Today)
  const [selectedDate, setSelectedDate] = useState(new Date());
  // State: View month for the sidebar calendar
  const [viewDate, setViewDate] = useState(new Date());
  // State: Selected booking to show detailed modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [walkInSlot, setWalkInSlot] = useState<WalkInSlotContext | null>(null);
  const [qrQueue, setQrQueue] = useState<WalkInQrQueueItem[] | null>(null);
  const [slotSelection, setSlotSelection] = useState<SlotSelection | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    fieldId: number;
    startHour: number;
    endHour: number;
  } | null>(null);
  const dragSessionRef = useRef<{
    fieldId: number;
    anchorHour: number;
    moved: boolean;
  } | null>(null);
  // State: Filter field type
  const [filterType, setFilterType] = useState("All");

  const { currentVenueId, currentVenue } = useCurrentVenue();
  const venueId = currentVenueId;
  const [fields, setFields] = useState<Field[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [venueOpenTime, setVenueOpenTime] = useState("06:00");
  const [venueCloseTime, setVenueCloseTime] = useState("23:00");

  const scheduleConfig = useMemo(
    () => getVenueScheduleConfig(venueOpenTime, venueCloseTime),
    [venueOpenTime, venueCloseTime],
  );
  const scheduleBodyHeight = scheduleConfig.slotCount * SLOT_HEIGHT_PX;

  useEffect(() => {
    if (venueId) {
      fetchFields(venueId);
    } else {
      setFields([]);
      setBookings([]);
    }
  }, [venueId]);

  // Reload fields when quay lại tab (sau khi đổi trạng thái ở Quản lý sân)
  useEffect(() => {
    const refresh = () => {
      if (venueId) fetchFields(venueId);
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [venueId]);

  const fetchFields = async (vId: number) => {
    try {
      const venueData: any = await venueApi.getOne(vId);
      if (venueData) {
        setVenueOpenTime(venueData.openTime ?? "06:00");
        setVenueCloseTime(venueData.closeTime ?? "23:00");
      }
      if (venueData && venueData.fieldsPricings) {
        // venueData.fieldsPricings contains the fields list (based on backend response structure)
        const sortedFields = sortFields(venueData.fieldsPricings);
        setFields(sortedFields);
      } else if (venueData && venueData.fields) {
        // Fallback if structure changes
        const sortedFields = sortFields(venueData.fields);
        setFields(sortedFields);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
    }
  };

  const sortFields = (fieldsList: any[]) => {
    const priority: { [key: string]: number } = {
      FIELD_5VS5: 1,
      FIELD_7VS7: 2,
      FIELD_11VS11: 3,
    };
    return [...fieldsList].sort((a, b) => {
      const pA = priority[a.fieldType] || 99;
      const pB = priority[b.fieldType] || 99;
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });
  };

  const formatDateYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchBookings = useCallback(
    async (silent = false) => {
      if (!venueId) return;
      if (!silent) setLoading(true);
      try {
        const res: any = await bookingApi.getAll({ venueId: venueId });
        const bookingsList = Array.isArray(res) ? res : (res as any).data || [];

        const targetDateStr = formatDateYMD(selectedDate);

        const dayBookings = bookingsList.filter((b: any) => {
          if (!b.startTime) return false;
          const bookingDate = formatDateYMD(new Date(b.startTime));
          const isActive = b.status !== "CANCELLED" && b.status !== "REJECTED";
          return bookingDate === targetDateStr && isActive;
        });

        const mappedBookings: Booking[] = dayBookings.map((b: any) => {
          const start = new Date(b.startTime);
          const end = new Date(b.endTime);

          return {
            id: b.id,
            fieldId: b.fieldId,
            fieldName: b.field?.name || `Sân ${b.fieldId}`,
            customerName: b.customerName,
            phoneNumber: b.customerPhone,
            startTime: formatTime(start),
            endTime: formatTime(end),
            price: b.totalPrice,
            type: b.status === "CONFIRMED" ? "booked" : "pending",
            status: b.status,
            source: b.source,
            paymentMethod: b.payment?.method,
            paymentStatus: b.payment?.status,
            note: b.note,
            originalData: b,
          };
        });

        setBookings(mappedBookings);

        setSelectedBooking((prev) => {
          if (!prev) return prev;
          const updated = mappedBookings.find((b) => b.id === prev.id);
          return updated ?? prev;
        });
      } catch (error) {
        console.error("Error fetching bookings:", error);
        if (!silent) toast.error("Không thể tải lịch đặt sân");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [venueId, selectedDate],
  );

  const awaitingPaymentIdsKey = useMemo(() => {
    const ids = bookings
      .filter(
        (b) =>
          getBookingCardVariant(
            b.status,
            b.paymentMethod,
            b.paymentStatus,
          ) === "awaiting-payment",
      )
      .map((b) => Number(b.id))
      .sort((a, b) => a - b);
    return ids.length > 0 ? ids.join(",") : "";
  }, [bookings]);

  const paymentPollPaused =
    qrQueue != null ||
    (selectedBooking != null &&
      isAwaitingBankPayment(
        selectedBooking.paymentMethod,
        selectedBooking.paymentStatus,
      ));

  // Load bookings when date or venue changes
  useEffect(() => {
    if (venueId) {
      fetchBookings();
    }
  }, [venueId, selectedDate, fetchBookings]);

  // Poll payment-status mỗi 5s (chỉ khi danh sách id chờ CK đổi — tránh loop)
  useEffect(() => {
    if (!awaitingPaymentIdsKey || !venueId || paymentPollPaused) return;

    const ids = awaitingPaymentIdsKey.split(",").map(Number);
    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await Promise.all(
          ids.map((id) => bookingApi.getPaymentStatus(id).catch(() => null)),
        );
        await fetchBookings(true);
      } finally {
        inFlight = false;
      }
    };

    const timer = window.setInterval(tick, PAYMENT_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [awaitingPaymentIdsKey, venueId, paymentPollPaused, fetchBookings]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    if (newDate.getMonth() !== viewDate.getMonth()) {
      setViewDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
    if (newDate.getMonth() !== viewDate.getMonth()) {
      setViewDate(newDate);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  // Calendar Grid Logic
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = getDaysInMonth(viewDate);
  const startOffset = getFirstDayOfMonth(viewDate);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: startOffset }, (_, i) => i);

  // Formatting
  const formatMainDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const closeQrModal = useCallback(() => {
    setQrQueue(null);
    fetchBookings();
  }, [fetchBookings]);

  const handleQrAllPaid = useCallback(() => {
    setQrQueue(null);
    fetchBookings();
  }, [fetchBookings]);

  const HOURS = scheduleConfig.hourLabels;

  const hourToPx = useCallback(
    (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return (h + m / 60 - scheduleConfig.startHour) * SLOT_HEIGHT_PX;
    },
    [scheduleConfig.startHour],
  );

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const isSlotOccupied = (
    fieldId: number,
    startTime: string,
    endTime: string,
  ) => {
    const slotStart = timeToMinutes(startTime);
    const slotEnd = timeToMinutes(endTime);
    return bookings.some((b) => {
      if (b.fieldId !== fieldId) return false;
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return slotStart < bEnd && bStart < slotEnd;
    });
  };

  const isHourFree = useCallback(
    (fieldId: number, hour: number) => {
      const startTime = hourToTimeString(hour);
      const endTime = hourToTimeString(hour + 1);
      return !isSlotOccupied(fieldId, startTime, endTime);
    },
    [bookings],
  );

  const clearSlotSelection = () => {
    setSlotSelection(null);
    setDragPreview(null);
    dragSessionRef.current = null;
  };

  const handleSlotPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    field: Field,
    hour: number,
  ) => {
    const status =
      field.operationalStatus ?? (field.isActive ? "ACTIVE" : "INACTIVE");
    if (status !== "ACTIVE" || !isHourFree(field.id, hour)) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragSessionRef.current = {
      fieldId: field.id,
      anchorHour: hour,
      moved: false,
    };
    const { startHour, endHour } = getDragRange(hour, hour);
    setDragPreview({ fieldId: field.id, startHour, endHour });
  };

  const handleSlotPointerEnter = (
    field: Field,
    hour: number,
  ) => {
    const session = dragSessionRef.current;
    if (!session || session.fieldId !== field.id) return;

    if (hour !== session.anchorHour) {
      session.moved = true;
    }
    const { startHour, endHour } = getDragRange(session.anchorHour, hour);
    setDragPreview({ fieldId: field.id, startHour, endHour });
  };

  const handleSlotPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    _field: Field,
    hour: number,
  ) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    finalizePointerSession(hour);
  };

  const openWalkInFromSelection = () => {
    if (!slotSelection || !venueId || slotSelection.selectedHours.length === 0)
      return;
    const ranges = groupContiguousHours(slotSelection.selectedHours);
    setWalkInSlot({
      fieldId: slotSelection.fieldId,
      fieldName: slotSelection.fieldName,
      date: formatDateYMD(selectedDate),
      ranges: ranges.map((r) => ({
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    });
    setSlotSelection(null);
    setDragPreview(null);
  };

  const finalizePointerSession = useCallback(
    (releaseHour?: number) => {
      const session = dragSessionRef.current;
      if (!session) return;

      const field = fields.find((f) => f.id === session.fieldId);
      dragSessionRef.current = null;
      setDragPreview(null);

      if (!field) return;

      if (session.moved) {
        const hour =
          releaseHour ??
          (dragPreview && dragPreview.fieldId === field.id
            ? dragPreview.endHour - 1
            : session.anchorHour);
        const { startHour, endHour } = getDragRange(session.anchorHour, hour);
        const result = addDragRangeToSelection(
          slotSelection,
          field,
          startHour,
          endHour,
          (h) => isHourFree(field.id, h),
        );
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setSlotSelection(
          result.selectedHours.length === 0 ? null : result,
        );
        return;
      }

      const hour = releaseHour ?? session.anchorHour;
      if (!isHourFree(field.id, hour)) return;
      const next = toggleHourInSelection(slotSelection, field, hour);
      setSlotSelection(next.selectedHours.length === 0 ? null : next);
    },
    [fields, slotSelection, dragPreview, isHourFree],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSlotSelection();
    };
    const onPointerUp = () => finalizePointerSession();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [finalizePointerSession]);

  useEffect(() => {
    clearSlotSelection();
  }, [selectedDate, venueId, scheduleConfig.startHour, scheduleConfig.endHourExclusive]);

  const renderHourSlots = (field: Field) => {
    const status =
      field.operationalStatus ?? (field.isActive ? "ACTIVE" : "INACTIVE");
    const fieldActive = status === "ACTIVE";

    return Array.from({ length: scheduleConfig.slotCount }, (_, i) => {
      const hour = scheduleConfig.startHour + i;
      const startTime = hourToTimeString(hour);
      const endTime = hourToTimeString(hour + 1);
      const occupied = !isHourFree(field.id, hour);
      const selected = isHourSelected(slotSelection, field.id, hour);
      const dragHighlight =
        isHourInDragPreview(dragPreview, field.id, hour) && !selected;

      return (
        <button
          key={`${field.id}-${hour}`}
          type="button"
          className={[
            "schedule-hour-slot",
            occupied ? "schedule-hour-slot--occupied" : "schedule-hour-slot--available",
            selected ? "schedule-hour-slot--selected" : "",
            dragHighlight ? "schedule-hour-slot--drag-preview" : "",
            fieldActive && !occupied ? "schedule-hour-slot--interactive" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ top: i * SLOT_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
          disabled={!fieldActive || occupied}
          onPointerDown={(e) => handleSlotPointerDown(e, field, hour)}
          onPointerEnter={() => handleSlotPointerEnter(field, hour)}
          onPointerUp={(e) => handleSlotPointerUp(e, field, hour)}
          aria-label={
            occupied
              ? `${startTime} đã đặt`
              : selected
                ? `Đã chọn ${startTime} – ${endTime}`
                : `Chọn ${startTime} – ${endTime}`
          }
          aria-pressed={selected}
        >
          {(selected || dragHighlight) && (
            <span className="schedule-hour-slot__label">{startTime}</span>
          )}
          {!occupied && !selected && !dragHighlight && fieldActive && (
            <span className="schedule-hour-slot__hint">{startTime}</span>
          )}
        </button>
      );
    });
  };

  // Map field type for display
  const getFieldTypeDisplay = (type: string) => {
    switch (type) {
      case "FIELD_5VS5":
        return "Sân 5";
      case "FIELD_7VS7":
        return "Sân 7";
      case "FIELD_11VS11":
        return "Sân 11";
      default:
        return type;
    }
  };

  const getFieldStatusLabel = (status?: FieldOperationalStatus) => {
    switch (status) {
      case "MAINTENANCE":
        return "Bảo trì";
      case "INACTIVE":
        return "Ngưng hoạt động";
      default:
        return null;
    }
  };

  const renderFieldStatusBlock = (field: Field) => {
    const status =
      field.operationalStatus ?? (field.isActive ? "ACTIVE" : "INACTIVE");
    if (status === "ACTIVE") return null;

    const isMaintenance = status === "MAINTENANCE";
    return (
      <div
        className={`booking-card field-status bg-[#e5e7eb] text-black ${isMaintenance ? "maintenance" : "inactive"}`}
        style={{ top: 0, height: scheduleBodyHeight }}
        title={
          isMaintenance ? "Sân đang bảo trì cả ngày" : "Sân đã tắt cả ngày"
        }
      >
        <div className="booking-name">
          {isMaintenance ? "Bảo trì" : "Ngưng hoạt động"}
        </div>
        <div className="booking-time">
          Cả ngày ({scheduleConfig.hoursLabel})
        </div>
      </div>
    );
  };

  // Filter fields based on dropdown and sort by field type (5VS5 -> 7VS7 -> 11VS11)
  const filteredFields = sortFields(
    fields.filter((f) => {
      const displayType = getFieldTypeDisplay(f.fieldType);
      return filterType === "All" || displayType === filterType;
    }),
  );

  return (
    <div className="booking-page">
      <Toaster position="top-right" />
      {/* HEADER */}
      <div className="booking-top">
        <div>
          <h2>Quản lý lịch đặt sân</h2>
          <p>
            {currentVenue
              ? `${currentVenue.name} — Giờ hoạt động ${scheduleConfig.hoursLabel}`
              : "Xem và quản lý tất cả đặt sân của bạn"}
          </p>
        </div>
        <div className="booking-top__actions">
          <button type="button" className="btn-export">
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="booking-body">
        {/* SIDEBAR */}
        <aside className="booking-sidebar">
          <div className="calendar-card">
            <div className="calendar-header">
              <button onClick={handlePrevMonth}>‹</button>
              <span>{formatMonthYear(viewDate)}</span>
              <button onClick={handleNextMonth}>›</button>
            </div>

            <div className="calendar-grid">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                <div key={d} className="cal-day">
                  {d}
                </div>
              ))}
              {emptySlots.map((i) => (
                <div key={`empty-${i}`} />
              ))}
              {daysArray.map((day) => (
                <div
                  key={day}
                  className={`cal-date ${isSelected(day) ? "active" : ""}`}
                  onClick={() => handleDateClick(day)}
                  style={
                    isToday(day) && !isSelected(day)
                      ? { color: "#1F6650", fontWeight: "bold" }
                      : {}
                  }
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div className="legend-card">
            <div className="legend-item">
              <span
                className="dot"
                style={{ background: "#dbeafe", borderLeft: "non" }}
              />{" "}
              Hoàn tất
            </div>
            <div className="legend-item">
              <span className="dot booked" /> Đã xác nhận
            </div>
            <div className="legend-item">
              <span className="dot" style={{ background: "#f59e0b" }} /> Chờ xác
              nhận
            </div>
            <div className="legend-item">
              <span
                className="dot"
                style={{
                  background: "repeating-linear-gradient(135deg, #e9d5ff, #e9d5ff 4px, #f3e8ff 4px, #f3e8ff 8px)",
                  border: "2px dashed #7c3aed",
                }}
              />{" "}
              Chờ thanh toán CK
            </div>
            <div className="legend-item">
              <span
                className="dot"
                style={{ background: "#e5e7eb", border: "1px solid #9ca3af" }}
              />{" "}
              Ngưng hoạt động
            </div>
            <div className="legend-item">
              <span className="dot empty" /> Còn trống
            </div>
            <div className="legend-item">
              <span
                className="dot"
                style={{
                  background: "rgba(31, 102, 80, 0.2)",
                  border: "2px solid #1f6650",
                }}
              />{" "}
              Đang chọn
            </div>
          </div>

          <p className="schedule-hint">
            <strong>Click</strong> từng ô để bật/tắt (có thể chọn rời, vd 10h và
            17h). <strong>Kéo</strong> trên lịch để chọn dải giờ liền kề.
          </p>

          <div className="stat-card">
            <span>Tổng booking trong ngày</span>
            <strong>{bookings.length}</strong>
          </div>

          <div className="stat-card">
            <span>Doanh thu dự kiến</span>
            <strong>
              {bookings
                .reduce((sum, b) => sum + (b.price || 0), 0)
                .toLocaleString()}
              đ
            </strong>
          </div>
        </aside>

        {/* SCHEDULE */}
        <section className="schedule">
          <div className="schedule-header">
            <div className="date-nav">
              <button onClick={handlePrevDay}>‹</button>
              <span style={{ textTransform: "capitalize" }}>
                {formatMainDate(selectedDate)}
              </span>
              <button onClick={handleNextDay}>›</button>
            </div>

            <select
              className="field-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">Tất cả sân</option>
              <option value="Sân 5">Sân 5</option>
              <option value="Sân 7">Sân 7</option>
              <option value="Sân 11">Sân 11</option>
            </select>
          </div>

          <div className="schedule-grid">
            {/* TIME COLUMN */}
            <div className="time-column">
              <div className="time-spacer" />
              {HOURS.map((h) => (
                <div key={h} className="time-slot">
                  {h}
                </div>
              ))}
            </div>

            {/* FIELD COLUMNS */}
            {loading ? (
              <div style={{ padding: "20px" }}>Loading...</div>
            ) : filteredFields.length === 0 ? (
              <div style={{ padding: "20px" }}>Chưa có sân nào được tạo.</div>
            ) : (
              filteredFields.map((field) => {
                const statusLabel = getFieldStatusLabel(
                  field.operationalStatus ??
                    (field.isActive ? "ACTIVE" : "INACTIVE"),
                );
                const headerStatusClass =
                  field.operationalStatus === "MAINTENANCE"
                    ? "field-header--maintenance"
                    : field.operationalStatus === "INACTIVE"
                      ? "field-header--inactive"
                      : "";

                return (
                  <div key={field.id} className="field-column">
                    <div className={`field-header ${headerStatusClass}`}>
                      <div className="field-name">{field.name}</div>
                      <div className="field-type">
                        {getFieldTypeDisplay(field.fieldType)}
                        {statusLabel && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontWeight: 600,
                              color:
                                field.operationalStatus === "MAINTENANCE"
                                  ? "#e11d48"
                                  : "#6b7280",
                            }}
                          >
                            · {statusLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="field-body"
                      style={{
                        height: scheduleBodyHeight,
                        backgroundSize: `100% ${SLOT_HEIGHT_PX}px`,
                      }}
                    >
                      <div className="schedule-hour-slots" aria-hidden={false}>
                        {renderHourSlots(field)}
                      </div>
                      {bookings
                        .filter((b) => b.fieldId === field.id)
                        .map((b) => {
                          const top = hourToPx(b.startTime);
                          const height =
                            hourToPx(b.endTime) - hourToPx(b.startTime);
                          // Handle case where height is 0 or negative
                          if (height <= 0) return null;

                          const cardVariant = getBookingCardVariant(
                            b.status,
                            b.paymentMethod,
                            b.paymentStatus,
                          );
                          const statusLabel = getBookingStatusLabel(
                            b.status,
                            b.paymentMethod,
                            b.paymentStatus,
                          );

                          return (
                            <div
                              key={b.id}
                              className={`booking-card ${cardVariant}`}
                              style={{
                                top,
                                height,
                              }}
                              onClick={() => setSelectedBooking(b)}
                            >
                              <div className="booking-name">
                                {b.customerName}
                              </div>
                              <div className="booking-time">
                                {b.startTime} - {b.endTime}
                              </div>
                              {cardVariant !== "booked" && (
                                <div className="booking-status-tag">
                                  {statusLabel}
                                </div>
                              )}
                              {b.source === "WEB_WALK_IN" && (
                                <div
                                  className="booking-walkin-tag"
                                  style={{ fontSize: "0.7rem", opacity: 0.9 }}
                                >
                                  Tại quầy
                                </div>
                              )}
                              {b.price && (
                                <div className="booking-price">
                                  {(b.price / 1000).toLocaleString()}k
                                </div>
                              )}
                            </div>
                          );
                        })}
                      {renderFieldStatusBlock(field)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {slotSelection && slotSelection.selectedHours.length > 0 && (
            <div className="slot-selection-bar" role="status">
              <div className="slot-selection-bar__info">
                <span className="slot-selection-bar__title">Đang chọn</span>
                <strong>
                  {slotSelection.fieldName} ·{" "}
                  {formatSelectionRanges(slotSelection)}
                </strong>
                <span className="slot-selection-bar__meta">
                  {selectionSlotCount(slotSelection)} giờ ·{" "}
                  {groupContiguousHours(slotSelection.selectedHours).length}{" "}
                  khung · {formatDateYMD(selectedDate)}
                </span>
              </div>
              <div className="slot-selection-bar__actions">
                <button
                  type="button"
                  className="btn-secondary !py-2 !px-4 text-sm"
                  onClick={clearSlotSelection}
                >
                  Hủy chọn
                </button>
                <button
                  type="button"
                  className="btn-primary !py-2 !px-5 text-sm"
                  onClick={openWalkInFromSelection}
                >
                  Đặt sân
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={{
            ...selectedBooking,
            source:
              selectedBooking.source ??
              selectedBooking.originalData?.source,
          }}
          onClose={() => setSelectedBooking(null)}
          onRefresh={fetchBookings}
          onUpdate={() => {
            setSelectedBooking(null);
            fetchBookings();
          }}
        />
      )}

      {walkInSlot && venueId && (
        <WalkInBookingModal
          venueId={venueId}
          slot={walkInSlot}
          onClose={() => setWalkInSlot(null)}
          onSuccess={() => {
            setWalkInSlot(null);
            fetchBookings();
          }}
          onBankTransferCreated={(items) => {
            setWalkInSlot(null);
            setQrQueue(items);
            fetchBookings();
          }}
        />
      )}

      {qrQueue && qrQueue.length > 0 && (
        <WalkInPaymentQrModal
          items={qrQueue}
          onClose={closeQrModal}
          onAllPaid={handleQrAllPaid}
        />
      )}
    </div>
  );
};

export default BookingSchedule;
