"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  BarangayFee,
  BillingStatement,
  Coupon,
  Customer,
  Merchant,
  Order,
  Product,
  Rider,
  Role,
  Shift,
  StaffUser,
  Tenant,
  TenantBilling,
  TenantSettings,
} from "@chowlane/types";
import {
  toBarangayFee,
  toBillingStatement,
  toCoupon,
  toCustomer,
  toMerchant,
  toOrder,
  toProduct,
  toRider,
  toRole,
  toShift,
  toStaffUser,
  toTenant,
  toTenantBilling,
  toTenantSettings,
} from "@chowlane/db/mappers";
import { useRealtimeReload, type AppSupabase } from "@chowlane/db/react";
import { usePlatformIdentity } from "./identity";

/**
 * Every tenant's records as the platform admin sees them (2.7) — RLS lets a platform admin read all tenants
 * (BL-10.2) and change only billing and status (functions). Same shape as the Phase 1 mock store, so screens filter
 * these lists like before. MVP scale: one load of everything; paging comes when tenants grow.
 */
export type PlatformDb = {
  tenants: Tenant[];
  tenantSettings: TenantSettings[];
  tenantBilling: TenantBilling[];
  billingStatements: BillingStatement[];
  orders: Order[];
  customers: Customer[];
  riders: Rider[];
  shifts: Shift[];
  merchants: Merchant[];
  products: Product[];
  staff: StaffUser[];
  roles: Role[];
  coupons: Coupon[];
  barangayFees: BarangayFee[];
};

const EMPTY: PlatformDb = {
  tenants: [],
  tenantSettings: [],
  tenantBilling: [],
  billingStatements: [],
  orders: [],
  customers: [],
  riders: [],
  shifts: [],
  merchants: [],
  products: [],
  staff: [],
  roles: [],
  coupons: [],
  barangayFees: [],
};

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function load(sb: AppSupabase): Promise<PlatformDb> {
  const [
    tenants,
    settings,
    billing,
    statements,
    orders,
    items,
    events,
    attempts,
    customers,
    addresses,
    verifications,
    riders,
    shifts,
    merchants,
    products,
    staff,
    roles,
    coupons,
    barangays,
  ] = await Promise.all([
    sb.from("tenants").select("*").order("created_at"),
    sb.from("tenant_settings").select("*"),
    sb.from("tenant_billing").select("*"),
    sb.from("billing_statements").select("*"),
    sb.from("orders").select("*").order("created_at", { ascending: false }),
    sb.from("order_items").select("*"),
    sb.from("order_events").select("*"),
    sb.from("assignment_attempts").select("*"),
    sb.from("customers").select("*"),
    sb.from("customer_addresses").select("*"),
    sb.from("verifications").select("*"),
    sb.from("riders").select("*"),
    sb.from("shifts").select("*"),
    sb.from("merchants").select("*"),
    sb.from("products").select("*"),
    sb.from("staff_users").select("*"),
    sb.from("roles").select("*"),
    sb.from("coupons").select("*"),
    sb.from("barangay_fees").select("*"),
  ]);
  const it = must(items);
  const ev = must(events);
  const at = must(attempts);
  const ad = must(addresses);
  const ve = must(verifications);
  return {
    tenants: must(tenants).map(toTenant),
    tenantSettings: must(settings).map(toTenantSettings),
    tenantBilling: must(billing).map(toTenantBilling),
    billingStatements: must(statements).map(toBillingStatement),
    orders: must(orders).map((o) => toOrder(o, it, ev, at)),
    customers: must(customers).map((c) =>
      toCustomer(
        c,
        ad.filter((a) => a.customer_id === c.id),
        ve.filter((v) => v.customer_id === c.id),
      ),
    ),
    riders: must(riders).map(toRider),
    shifts: must(shifts).map(toShift),
    merchants: must(merchants).map(toMerchant),
    products: must(products).map(toProduct),
    staff: must(staff).map(toStaffUser),
    roles: must(roles).map(toRole),
    coupons: must(coupons).map(toCoupon),
    barangayFees: must(barangays).map(toBarangayFee),
  };
}

type Ctx = { db: PlatformDb; loaded: boolean; error?: string; reload: () => Promise<void> };
const DataContext = createContext<Ctx | null>(null);

/** Loads all tenants' records for a signed-in platform admin; Realtime keeps orders, riders and billing fresh. */
export function PlatformDataProvider({ children }: { children: ReactNode }) {
  const auth = usePlatformIdentity();
  const allowed = auth.identity?.admin.status === "ACTIVE";
  const [state, setState] = useState<{ db: PlatformDb; loaded: boolean; error?: string }>({
    db: EMPTY,
    loaded: false,
  });

  const reload = useCallback(async () => {
    if (!allowed) return setState({ db: EMPTY, loaded: false });
    try {
      setState({ db: await load(auth.supabase), loaded: true });
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
    }
  }, [auth.supabase, allowed]);

  useEffect(() => {
    if (auth.ready) void reload();
  }, [auth.ready, reload]);

  useRealtimeReload(
    auth.supabase,
    "platform",
    [{ table: "orders" }, { table: "riders" }, { table: "shifts" }, { table: "customers" }],
    () => void reload(),
    { enabled: allowed, fallbackMs: 120_000 },
  );

  return <DataContext.Provider value={{ ...state, reload }}>{children}</DataContext.Provider>;
}

export function usePlatformData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("usePlatformData needs <PlatformDataProvider>");
  return ctx;
}
