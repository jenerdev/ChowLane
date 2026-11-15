import type { LatLng } from "@chowlane/types";

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line distance in km (Phase 1 estimate — road distance comes in Phase 3, BL-7.3). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Distances are rounded UP to 0.1 km (BL-7.3). */
export function roundUpKm(km: number): number {
  return Math.ceil(Math.round(km * 1000) / 100) / 10;
}

export function isWithinRadius(center: LatLng, point: LatLng, radiusKm: number): boolean {
  return haversineKm(center, point) <= radiusKm;
}

/** Customer may move the delivery pin at most `radiusM` metres from their current location (BL-3.2). */
export function isPinAdjustAllowed(current: LatLng, pin: LatLng, radiusM: number): boolean {
  return haversineKm(current, pin) * 1000 <= radiusM;
}
