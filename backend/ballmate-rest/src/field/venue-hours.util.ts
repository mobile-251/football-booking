/** Giờ mở cửa (slot đầu tiên bắt đầu lúc openHour:00). */
export function parseOpenHour(openTime?: string | null): number {
  if (!openTime) return 6;
  const h = parseInt(openTime.split(':')[0], 10);
  return Number.isNaN(h) ? 6 : h;
}

/** Giờ kết thúc exclusive (slot cuối bắt đầu lúc end-1). */
export function parseExclusiveEndHour(time?: string | null): number {
  if (!time) return 23;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h)) return 24;
  // "00:00" = nửa đêm / hết ngày (slot cuối 23:00–24:00)
  if (h === 0 && m === 0) return 24;
  if (h >= 24) return 24;
  if (m > 0) return Math.min(h + 1, 24);
  return h;
}

/** @deprecated alias — dùng parseExclusiveEndHour */
export function parseExclusiveCloseHour(closeTime?: string | null): number {
  return parseExclusiveEndHour(closeTime);
}

export const DEFAULT_SCHEDULE_START_HOUR = 6;
export const DEFAULT_SCHEDULE_END_HOUR = 24;
