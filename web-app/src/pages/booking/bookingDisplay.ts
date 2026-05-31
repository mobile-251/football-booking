export type BookingCardVariant =
  | "booked"
  | "pending"
  | "awaiting-payment"
  | "completed"
  | "maintenance";

export function getBookingCardVariant(
  status?: string,
  paymentMethod?: string | null,
  paymentStatus?: string | null,
): BookingCardVariant {
  if (status === "COMPLETED") return "completed";
  if (status === "CONFIRMED") return "booked";
  if (status === "PENDING") {
    if (
      paymentMethod === "BANK_TRANSFER" &&
      paymentStatus === "PENDING"
    ) {
      return "awaiting-payment";
    }
    return "pending";
  }
  return "maintenance";
}

export function getBookingStatusLabel(
  status?: string,
  paymentMethod?: string | null,
  paymentStatus?: string | null,
): string {
  const variant = getBookingCardVariant(
    status,
    paymentMethod,
    paymentStatus,
  );
  switch (variant) {
    case "awaiting-payment":
      return "Chờ thanh toán CK";
    case "pending":
      return "Chờ duyệt";
    case "booked":
      return "Đã xác nhận";
    case "completed":
      return "Hoàn tất";
    default:
      return status ?? "—";
  }
}

export function canConfirmBooking(
  status?: string,
  paymentMethod?: string | null,
  paymentStatus?: string | null,
): boolean {
  if (status !== "PENDING") return false;
  if (paymentMethod === "BANK_TRANSFER" && paymentStatus !== "PAID") {
    return false;
  }
  return true;
}

export function isAwaitingBankPayment(
  paymentMethod?: string | null,
  paymentStatus?: string | null,
): boolean {
  return paymentMethod === "BANK_TRANSFER" && paymentStatus === "PENDING";
}
