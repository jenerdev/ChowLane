/** Money is always stored as integer centavos (₱1.00 = 100). */
export type Centavos = number;

/** ISO-8601 UTC timestamp string, e.g. "2026-11-15T03:20:00.000Z". */
export type ISODateTime = string;

/** Philippine mobile number in E.164 format, e.g. "+639171234567". */
export type PhoneE164 = string;

export type ID = string;

export type TenantSlug = string;

export type LatLng = { lat: number; lng: number };
