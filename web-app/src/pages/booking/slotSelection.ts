export interface SlotSelection {
  fieldId: number;
  fieldName: string;
  /** Mỗi phần tử = 1 giờ [h, h+1), có thể không liên tiếp */
  selectedHours: number[];
}

export interface TimeRange {
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
}

export function hourToTimeString(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function groupContiguousHours(hours: number[]): TimeRange[] {
  if (hours.length === 0) return [];
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: TimeRange[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const h = sorted[i];
    if (h === prev + 1) {
      prev = h;
      continue;
    }
    ranges.push(toRange(start, prev + 1));
    start = h;
    prev = h;
  }
  ranges.push(toRange(start, prev + 1));
  return ranges;
}

function toRange(startHour: number, endHour: number): TimeRange {
  return {
    startHour,
    endHour,
    startTime: hourToTimeString(startHour),
    endTime: hourToTimeString(endHour),
  };
}

export function isHourSelected(
  selection: SlotSelection | null,
  fieldId: number,
  hour: number,
): boolean {
  if (!selection || selection.fieldId !== fieldId) return false;
  return selection.selectedHours.includes(hour);
}

export function isHourInDragPreview(
  preview: { fieldId: number; startHour: number; endHour: number } | null,
  fieldId: number,
  hour: number,
): boolean {
  if (!preview || preview.fieldId !== fieldId) return false;
  return hour >= preview.startHour && hour < preview.endHour;
}

export function getDragRange(anchorHour: number, currentHour: number) {
  const startHour = Math.min(anchorHour, currentHour);
  const endHour = Math.max(anchorHour, currentHour) + 1;
  return { startHour, endHour };
}

export function toggleHourInSelection(
  current: SlotSelection | null,
  field: { id: number; name: string },
  hour: number,
): SlotSelection {
  if (!current || current.fieldId !== field.id) {
    return {
      fieldId: field.id,
      fieldName: field.name,
      selectedHours: [hour],
    };
  }

  const has = current.selectedHours.includes(hour);
  const selectedHours = has
    ? current.selectedHours.filter((h) => h !== hour)
    : [...current.selectedHours, hour].sort((a, b) => a - b);

  return {
    ...current,
    selectedHours,
  };
}

export function addDragRangeToSelection(
  current: SlotSelection | null,
  field: { id: number; name: string },
  startHour: number,
  endHour: number,
  isHourFree: (hour: number) => boolean,
): SlotSelection | { error: string } {
  const hoursToAdd: number[] = [];
  for (let h = startHour; h < endHour; h++) {
    if (!isHourFree(h)) {
      return {
        error: "Không thể chọn — trong khoảng có giờ đã được đặt",
      };
    }
    hoursToAdd.push(h);
  }

  const base =
    current?.fieldId === field.id
      ? current
      : {
          fieldId: field.id,
          fieldName: field.name,
          selectedHours: [] as number[],
        };

  const merged = new Set([...base.selectedHours, ...hoursToAdd]);
  return {
    fieldId: field.id,
    fieldName: field.name,
    selectedHours: [...merged].sort((a, b) => a - b),
  };
}

export function formatSelectionRanges(selection: SlotSelection): string {
  const ranges = groupContiguousHours(selection.selectedHours);
  return ranges
    .map((r) =>
      r.startHour + 1 === r.endHour
        ? r.startTime
        : `${r.startTime} – ${r.endTime}`,
    )
    .join(", ");
}

export function selectionSlotCount(selection: SlotSelection): number {
  return selection.selectedHours.length;
}
