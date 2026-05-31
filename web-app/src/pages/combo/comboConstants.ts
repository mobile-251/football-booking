export const FIELD_TYPE_OPTIONS = [
  { value: "FIELD_5VS5", label: "Sân 5 người", short: "5v5" },
  { value: "FIELD_7VS7", label: "Sân 7 người", short: "7v7" },
  { value: "FIELD_11VS11", label: "Sân 11 người", short: "11v11" },
] as const;

export const COIN_VND_RATE = 1000;

export function fieldTypeLabel(value: string): string {
  return FIELD_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function formatCoin(coin: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(coin)} coin`;
}

export function formatVndFromCoin(coin: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(coin * COIN_VND_RATE)}₫`;
}

export const DEFAULT_COMBO_FORM = {
  fieldType: "FIELD_5VS5",
  name: "",
  description: "",
  matchCount: 10,
  priceCoin: 3100,
  validityDays: 60,
};
