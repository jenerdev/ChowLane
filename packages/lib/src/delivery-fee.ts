import type { BarangayFee, Centavos, DeliveryFeeRule } from "@chowlane/types";
import { roundUpToPeso } from "./money";

export type DeliveryFeeInput = {
  rule: DeliveryFeeRule;
  /** Store → customer distance (required for PER_KM). */
  distanceKm?: number;
  /** Customer's barangay entry (required for PER_BARANGAY). */
  barangayFee?: BarangayFee;
};

export type DeliveryFeeResult =
  { ok: true; fee: Centavos } | { ok: false; reason: "MISSING_DISTANCE" | "BARANGAY_NOT_LISTED" };

/** Delivery fee per BL-7.2 — result is rounded up to the whole peso (BL-7.8). */
export function computeDeliveryFee({
  rule,
  distanceKm,
  barangayFee,
}: DeliveryFeeInput): DeliveryFeeResult {
  switch (rule.mode) {
    case "FIXED":
      return { ok: true, fee: roundUpToPeso(rule.amount) };
    case "PER_KM": {
      if (distanceKm === undefined) return { ok: false, reason: "MISSING_DISTANCE" };
      const extraKm = Math.max(0, distanceKm - rule.includedKm);
      const fee = Math.max(rule.minFee, rule.baseFee + rule.ratePerKm * extraKm);
      return { ok: true, fee: roundUpToPeso(fee) };
    }
    case "PER_BARANGAY":
      if (!barangayFee || !barangayFee.isActive)
        return { ok: false, reason: "BARANGAY_NOT_LISTED" };
      return { ok: true, fee: roundUpToPeso(barangayFee.fee) };
  }
}
