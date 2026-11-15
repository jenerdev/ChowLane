"use client";

import { useParams } from "next/navigation";
import { usePlatform } from "./use-platform";

/** The tenant of the current /tenants/[id] route + its rows (all read-only except billing & status). */
export function useTenantRecords() {
  const { id } = useParams<{ id: string }>();
  const p = usePlatform();
  const { db } = p;
  const tenant = db.tenants.find((t) => t.id === id);
  const of = <T extends { tenantId: string }>(rows: T[]) => rows.filter((r) => r.tenantId === id);
  return {
    ...p,
    tenant,
    settings: db.tenantSettings.find((s) => s.tenantId === id),
    billing: db.tenantBilling.find((b) => b.tenantId === id),
    statements: of(db.billingStatements).sort(
      (a, b) => Date.parse(b.periodStart) - Date.parse(a.periodStart),
    ),
    orders: of(db.orders).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    customers: of(db.customers),
    riders: of(db.riders),
    shifts: of(db.shifts),
    merchants: of(db.merchants),
    products: of(db.products),
    staff: of(db.staff),
    roles: of(db.roles),
    coupons: of(db.coupons),
  };
}
