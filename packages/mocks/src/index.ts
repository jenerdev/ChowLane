/**
 * @chowlane/mocks — Phase 1 mock database (no backend). Shapes = @chowlane/types.
 * Phase 2 replaces these lookups with Supabase queries of the same shape.
 */
import type { ID, Tenant, TenantSettings } from "@chowlane/types";
import * as data from "./data";
import { couponRedemptions, loyaltyTransactions, orders } from "./orders";

export * from "./data";
export { couponRedemptions, loyaltyTransactions, orders } from "./orders";

/** Everything in one object — handy for seeding client-side stores. */
export const mockDb = {
  platformAdmins: data.platformAdmins,
  tenants: data.tenants,
  tenantSettings: data.tenantSettings,
  tenantBilling: data.tenantBilling,
  billingStatements: data.billingStatements,
  barangayFees: data.barangayFees,
  roles: data.roles,
  staff: data.staff,
  merchants: data.merchants,
  products: data.products,
  riders: data.riders,
  shifts: data.shifts,
  customers: data.customers,
  orders,
  coupons: data.coupons,
  couponRedemptions,
  loyaltyTransactions,
};

export type MockDb = typeof mockDb;

export function findTenantBySlug(slug: string): Tenant | undefined {
  return data.tenants.find((t) => t.slug === slug);
}

export function settingsFor(tenantId: ID): TenantSettings {
  const s = data.tenantSettings.find((x) => x.tenantId === tenantId);
  if (!s) throw new Error(`No settings for tenant ${tenantId}`);
  return s;
}

/** Filter any tenant-scoped collection to one tenant. */
export function forTenant<T extends { tenantId: ID }>(rows: T[], tenantId: ID): T[] {
  return rows.filter((r) => r.tenantId === tenantId);
}
