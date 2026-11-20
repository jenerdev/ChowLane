"use client";

import type { Merchant, Order, Rider, Shift, TenantSettings } from "@chowlane/types";
import { toMerchant, toOrder, toRider, toShift, toTenantSettings } from "@chowlane/db/mappers";
import type { AppSupabase } from "@chowlane/db/react";
import { must } from "./use-live";

export type DispatchData = {
  settings: TenantSettings;
  /** Orders between approval and delivery, with items and rider offers. */
  orders: Order[];
  riders: Rider[];
  merchants: Merchant[];
};

/** Dispatch, live map and the assign sheet (2.6): orders on their way + riders + stores of the business. */
export async function loadDispatch(sb: AppSupabase, tenantId: string): Promise<DispatchData> {
  const [settings, orders, riders, merchants] = await Promise.all([
    sb.from("tenant_settings").select("*").eq("tenant_id", tenantId).single(),
    sb
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("status", ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"])
      .order("created_at"),
    sb.from("riders").select("*").eq("tenant_id", tenantId).order("name"),
    sb.from("merchants").select("*").eq("tenant_id", tenantId),
  ]);
  const rows = must(orders);
  const ids = rows.map((o) => o.id);
  const [items, attempts] = ids.length
    ? await Promise.all([
        sb.from("order_items").select("*").in("order_id", ids),
        sb.from("assignment_attempts").select("*").in("order_id", ids),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  return {
    settings: toTenantSettings(must(settings)),
    orders: rows.map((o) => toOrder(o, must(items), [], must(attempts))),
    riders: must(riders).map(toRider),
    merchants: must(merchants).map(toMerchant),
  };
}

/** Cash (S-124): every shift with its rider's name, newest first. */
export async function loadShifts(sb: AppSupabase, tenantId: string) {
  const [shifts, riders] = await Promise.all([
    sb
      .from("shifts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("time_in", { ascending: false })
      .limit(300),
    sb.from("riders").select("id, name").eq("tenant_id", tenantId),
  ]);
  return { shifts: must(shifts).map(toShift), riders: must(riders) };
}

/** Rider pay report (S-120): riders, delivered orders and shifts since `since` (the earliest period shown). */
export async function loadRiderPay(
  sb: AppSupabase,
  tenantId: string,
  since: string,
): Promise<{ settings: TenantSettings; riders: Rider[]; orders: Order[]; shifts: Shift[] }> {
  const [settings, riders, orders, shifts] = await Promise.all([
    sb.from("tenant_settings").select("*").eq("tenant_id", tenantId).single(),
    sb.from("riders").select("*").eq("tenant_id", tenantId),
    sb
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "DELIVERED")
      .gte("cash_collected_at", since),
    sb.from("shifts").select("*").eq("tenant_id", tenantId).gte("time_in", since),
  ]);
  return {
    settings: toTenantSettings(must(settings)),
    riders: must(riders).map(toRider),
    orders: must(orders).map((o) => toOrder(o)),
    shifts: must(shifts).map(toShift),
  };
}
