import type { ID, LatLng, Rider } from "@chowlane/types";
import { haversineKm } from "./geo";

/** Riders who may receive an order: active, on shift, no active order (BL-5.2, BL-5.10). */
export function eligibleRiders(riders: Rider[], excludeRiderIds: ID[] = []): Rider[] {
  return riders.filter(
    (r) =>
      r.status === "ACTIVE" && r.isOnShift && !r.activeOrderId && !excludeRiderIds.includes(r.id),
  );
}

/**
 * AUTO assign (BL-5.5): nearest eligible rider to the merchant who has not already rejected this order.
 * Riders without a known location are tried last. Returns undefined → "Needs rider" (BL-5.8).
 */
export function pickAutoRider(
  riders: Rider[],
  merchantLocation: LatLng,
  rejectedRiderIds: ID[],
): Rider | undefined {
  const dist = (r: Rider) =>
    r.lastLocation ? haversineKm(r.lastLocation, merchantLocation) : Infinity;
  return eligibleRiders(riders, rejectedRiderIds).sort((a, b) => dist(a) - dist(b))[0];
}
