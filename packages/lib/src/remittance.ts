import type { Centavos, RemitStatus } from "@chowlane/types";

export type RemitOrder = { total: Centavos; storeAmountPaid?: Centavos };

/** Cash the rider owes at time out = collected − paid at stores (BL-12.2). */
export function computeExpectedRemit(deliveredOrders: RemitOrder[]): {
  cashCollected: Centavos;
  storePaid: Centavos;
  expectedRemit: Centavos;
} {
  const cashCollected = deliveredOrders.reduce((s, o) => s + o.total, 0);
  const storePaid = deliveredOrders.reduce((s, o) => s + (o.storeAmountPaid ?? 0), 0);
  return { cashCollected, storePaid, expectedRemit: cashCollected - storePaid };
}

/** Status after the admin records the amount received (BL-12.4). */
export function remitStatusFor(expected: Centavos, received: Centavos): RemitStatus {
  if (received === expected) return "RECEIVED";
  return received < expected ? "SHORT" : "OVER";
}
