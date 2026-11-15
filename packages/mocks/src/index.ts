/**
 * @chowlane/mocks — Phase 1 mock data. Every shape must match @chowlane/types.
 * Full mock tenants, merchants, riders, customers and orders are added in Milestone 1.1.
 */
import type { TenantSlug } from "@chowlane/types";

export type MockTenant = { slug: TenantSlug; businessName: string; primaryColor: string };

export const mockTenants: MockTenant[] = [
  { slug: "fastbite", businessName: "FastBite Delivery", primaryColor: "#E4572E" },
  { slug: "kainexpress", businessName: "Kain Express", primaryColor: "#2E86AB" },
];

export function findMockTenant(slug: string): MockTenant | undefined {
  return mockTenants.find((t) => t.slug === slug);
}
