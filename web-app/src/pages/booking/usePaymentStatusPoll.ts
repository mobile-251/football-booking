import { useEffect, useRef } from "react";
import bookingApi from "../../api/bookingApi";
import { PAYMENT_POLL_INTERVAL_MS } from "./paymentPolling";

type PollHandler = (result: Awaited<
  ReturnType<typeof bookingApi.getPaymentStatus>
>) => void;

/**
 * Poll payment-status đúng chu kỳ 5s — không reset interval khi parent re-render.
 */
export function usePaymentStatusPoll(
  bookingId: number | null | undefined,
  enabled: boolean,
  onResult: PollHandler,
) {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!enabled || bookingId == null) return;

    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await bookingApi.getPaymentStatus(bookingId);
        onResultRef.current(result);
      } catch {
        /* ignore */
      } finally {
        inFlight = false;
      }
    };

    const timer = window.setInterval(tick, PAYMENT_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, bookingId]);
}
