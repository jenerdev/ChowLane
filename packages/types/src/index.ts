/**
 * @chowlane/types — domain types.
 * Source of truth: docs/DATA-MODEL.md. Full types are added in Milestone 1.1.
 */

/** Money is always stored as integer centavos (₱1.00 = 100). */
export type Centavos = number;

export type LatLng = { lat: number; lng: number };

export type TenantSlug = string;
