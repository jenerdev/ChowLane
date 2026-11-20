"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Merchant, Order, Rider, Shift, TenantSettings } from "@chowlane/types";
import {
  toMerchant,
  toOfferOrder,
  toOrder,
  toRider,
  toShift,
  toTenantSettings,
  type OfferJson,
} from "@chowlane/db/mappers";
import { useRealtimeReload, type AppSupabase } from "@chowlane/db/react";
import { useRiderIdentity } from "./identity";

/** The customer of a delivery in progress — RLS shows name and phone only then (BL-2.8). */
export type DeliveryCustomer = { id: string; name: string; phone?: string };

/**
 * Everything the rider app shows, from Supabase (2.6). RLS limits it to the rider's own row, shifts and the orders
 * they deliver; the open offer comes from `my_offer` (area only, no address — BL-5.15).
 */
export type RiderData = {
  settings: TenantSettings;
  me: Rider;
  merchants: Merchant[];
  /** The rider's orders (newest first) + the offered order, if any. */
  orders: Order[];
  shifts: Shift[];
  customers: DeliveryCustomer[];
};

type Ctx = { data: RiderData | null; error?: string; reload: () => Promise<void> };
const DataContext = createContext<Ctx | null>(null);

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function load(sb: AppSupabase, tenantId: string, riderId: string): Promise<RiderData> {
  const [settings, me, merchants, orders, shifts, offer] = await Promise.all([
    sb.from("tenant_settings").select("*").eq("tenant_id", tenantId).single(),
    sb.from("riders").select("*").eq("id", riderId).single(),
    sb.from("merchants").select("*").eq("tenant_id", tenantId),
    sb
      .from("orders")
      .select("*")
      .eq("rider_id", riderId)
      .order("created_at", { ascending: false })
      .limit(200),
    sb
      .from("shifts")
      .select("*")
      .eq("rider_id", riderId)
      .order("time_in", { ascending: false })
      .limit(200),
    sb.rpc("my_offer", { p_tenant: tenantId }),
  ]);
  const orderRows = must(orders);
  const ids = orderRows.map((o) => o.id);
  const liveCustomerIds = orderRows
    .filter((o) => ["ASSIGNED", "AT_MERCHANT", "PICKED_UP"].includes(o.status))
    .map((o) => o.customer_id);
  const [items, events, customers] = await Promise.all([
    ids.length ? sb.from("order_items").select("*").in("order_id", ids) : { data: [], error: null },
    ids.length
      ? sb.from("order_events").select("*").in("order_id", ids)
      : { data: [], error: null },
    liveCustomerIds.length
      ? sb.from("customers").select("id, name, phone").in("id", liveCustomerIds)
      : { data: [], error: null },
  ]);
  const offerJson = must(offer) as unknown as OfferJson | null;
  return {
    settings: toTenantSettings(must(settings)),
    me: toRider(must(me)),
    merchants: must(merchants).map(toMerchant),
    orders: [
      ...(offerJson ? [toOfferOrder(offerJson, riderId)] : []),
      ...orderRows.map((o) => toOrder(o, must(items), must(events))),
    ],
    shifts: must(shifts).map(toShift),
    customers: must(customers).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ?? undefined,
    })),
  };
}

/** Loads the signed-in rider's data and keeps it fresh with Realtime (offers, own orders, shifts). */
export function RiderDataProvider({ children }: { children: ReactNode }) {
  const auth = useRiderIdentity();
  const rider = auth.identity?.rider;
  const riderId = rider?.status === "ACTIVE" ? rider.id : undefined;
  const [state, setState] = useState<{ data: RiderData | null; error?: string }>({ data: null });

  const reload = useCallback(async () => {
    if (!riderId) return setState({ data: null });
    try {
      setState({ data: await load(auth.supabase, auth.tenant.id, riderId) });
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
    }
  }, [auth.supabase, auth.tenant.id, riderId]);

  useEffect(() => {
    if (auth.ready) void reload();
  }, [auth.ready, reload]);

  useRealtimeReload(
    auth.supabase,
    `rider:${riderId}`,
    [
      // offers made / withdrawn / timed out (orders with an open offer aren't readable before accepting)
      { table: "assignment_attempts", filter: `rider_id=eq.${riderId}` },
      { table: "orders", filter: `rider_id=eq.${riderId}` },
      { table: "riders", filter: `id=eq.${riderId}` },
      { table: "shifts", filter: `rider_id=eq.${riderId}` },
    ],
    () => void reload(),
    { enabled: Boolean(riderId) },
  );

  return (
    <DataContext.Provider value={{ data: state.data, error: state.error, reload }}>
      {children}
    </DataContext.Provider>
  );
}

export function useRiderData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useRiderData needs <RiderDataProvider>");
  return ctx;
}
