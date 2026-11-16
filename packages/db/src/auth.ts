import type { Tenant } from "@chowlane/types";
import type { Database } from "./database.types";

/** Apps that sign users in. Each keeps its own session cookie (D-063). */
export type AuthApp = "landing" | "console" | "rider" | "customer" | "platform";

/**
 * Session cookie name per app. On localhost every port shares cookies, and on one domain the apps could too, so a
 * separate name keeps "logged in to the console" from also meaning "logged in to the rider app".
 */
export function sessionCookieName(app: AuthApp): string {
  return `chowlane-${app}-auth`;
}

/**
 * Riders log in with mobile number + password (Q-30) without SMS: each rider row gets its own login whose email is
 * derived from the business link and the number (D-062). The rider never sees this address.
 */
export function riderLoginEmail(tenantSlug: string, phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  if (!/^639\d{9}$/.test(digits)) throw new Error(`Not a PH mobile number: ${phoneE164}`);
  return `rider-${digits}@${tenantSlug}.riders.chowlane.internal`;
}

/** True when the app talks to a Supabase on this machine (local Docker stack). */
export function isLocalSupabase(url: string): boolean {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Public branding of a tenant (tenants_public view) — what login pages, manifests and frames need. */
export type PublicTenant = Pick<
  Tenant,
  | "id"
  | "slug"
  | "businessName"
  | "shortName"
  | "logoUrl"
  | "primaryColor"
  | "backgroundColor"
  | "currency"
  | "timezone"
  | "pwaIcons"
  | "status"
>;

type TenantsPublicRow = Database["public"]["Views"]["tenants_public"]["Row"];

export function toPublicTenant(r: TenantsPublicRow): PublicTenant {
  return {
    id: r.id!,
    slug: r.slug!,
    businessName: r.business_name!,
    shortName: r.short_name!,
    logoUrl: r.logo_url ?? "",
    primaryColor: r.primary_color!,
    backgroundColor: r.background_color!,
    currency: "PHP",
    timezone: "Asia/Manila",
    pwaIcons: (r.pwa_icons ?? {}) as PublicTenant["pwaIcons"],
    status: r.status!,
  };
}
