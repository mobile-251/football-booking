/** Giờ mở cửa — slot đầu bắt đầu lúc openHour:00. */
export function parseOpenHour(openTime?: string | null): number {
  if (!openTime) return 6;
  const h = parseInt(openTime.split(":")[0], 10);
  return Number.isNaN(h) ? 6 : h;
}

/**
 * Giờ kết thúc exclusive cho slot 1h.
 * closeTime "23:00" → slot cuối 22:00–23:00.
 * closeTime "00:00" → slot cuối 23:00–24:00.
 */
export function parseExclusiveEndHour(time?: string | null): number {
  if (!time) return 23;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (Number.isNaN(h)) return 23;
  if (h === 0 && m === 0) return 24;
  if (time === "24:00") return 24;
  if (h >= 24) return 24;
  if (m > 0) return Math.min(h + 1, 24);
  return h;
}

export function hourToTimeString(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function formatVenueHoursLabel(
  openTime?: string | null,
  closeTime?: string | null,
): string {
  const open = openTime ?? "06:00";
  const close = closeTime ?? "23:00";
  return `${open} – ${close === "00:00" ? "24:00" : close}`;
}

export function getVenueScheduleConfig(
  openTime?: string | null,
  closeTime?: string | null,
) {
  const startHour = parseOpenHour(openTime);
  const endHourExclusive = parseExclusiveEndHour(closeTime);
  const slotCount = Math.max(0, endHourExclusive - startHour);
  const hourLabels = Array.from({ length: slotCount }, (_, i) =>
    hourToTimeString(startHour + i),
  );

  return {
    startHour,
    endHourExclusive,
    slotCount,
    hourLabels,
    hoursLabel: formatVenueHoursLabel(openTime, closeTime),
  };
}

/** Chuẩn hóa HH:mm cho `<input type="time">`. */
export function normalizeToTimeInput(value?: string | null): string {
  if (!value) return "06:00";
  if (value === "24:00") return "00:00";
  const [h, m] = value.split(":");
  const hour = Number(h);
  const min = Number(m ?? 0);
  if (Number.isNaN(hour)) return "06:00";
  return `${String(hour).padStart(2, "0")}:${String(Number.isNaN(min) ? 0 : min).padStart(2, "0")}`;
}
