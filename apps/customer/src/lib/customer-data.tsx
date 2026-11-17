"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  BarangayFee,
  Customer,
  LoyaltyTransaction,
  Merchant,
  Order,
  Product,
  Rider,
  TenantSettings,
} from "@chowlane/types";
import {
  toBarangayFee,
  toCustomer,
  toLoyaltyTransaction,
  toMerchant,
  toOrder,
  toPublicSettings,
  toRider,
} from "@chowlane/db/mappers";
import type { AppSupabase } from "@chowlane/db/react";
import { useCustomerIdentity } from "./identity";

/**
 * Everything the customer app shows for one business, from Supabase (2.5). RLS limits it to the public menu and the
 * signed-in customer's own rows; prices without the store price (products_public), settings without rider pay
 * (tenant_settings_public). Screens filter these lists like they filtered the Phase 1 store.
 */
export type CustomerData = {
  settings: TenantSettings;
  me?: Customer;
  merchants: Merchant[];
  products: Product[];
  barangayFees: BarangayFee[];
  orders: Order[];
  riders: Rider[];
  loyaltyTransactions: LoyaltyTransaction[];
};

type Ctx = {
  data: CustomerData | null;
  error?: string;
  loaded: boolean;
  reload: () => Promise<void>;
};
const DataContext = createContext<Ctx | null>(null);

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function load(sb: AppSupabase, tenantId: string, customerId?: string): Promise<CustomerData> {
  const [settings, merchants, products, barangays] = await Promise.all([
    sb.from("tenant_settings_public").select("*").eq("tenant_id", tenantId).single(),
    sb.from("merchants").select("*").eq("tenant_id", tenantId).eq("status", "ACTIVE"),
    sb.from("products_public").select("*").eq("tenant_id", tenantId).order("sort_order"),
    sb.from("barangay_fees").select("*").eq("tenant_id", tenantId).eq("is_active", true),
  ]);
  const base = {
    settings: toPublicSettings(must(settings)),
    merchants: must(merchants).map(toMerchant),
    products: must(products).map((p) =>
      // products_public has no store price (the business's cost) — not needed in this app
      ({
        id: p.id!,
        tenantId: p.tenant_id!,
        merchantId: p.merchant_id!,
        name: p.name!,
        category: p.category!,
        description: p.description ?? "",
        price: p.price!,
        imageUrl: p.image_url ?? "",
        isAvailable: p.is_available!,
        sortOrder: p.sort_order ?? 0,
      }),
    ),
    barangayFees: must(barangays).map(toBarangayFee),
  };
  if (!customerId)
    return { ...base, orders: [], riders: [], loyaltyTransactions: [] } satisfies CustomerData;

  const [customer, addresses, verifications, orders, tx] = await Promise.all([
    sb.from("customers").select("*").eq("id", customerId).single(),
    sb.from("customer_addresses").select("*").eq("customer_id", customerId),
    sb.from("verifications").select("*").eq("customer_id", customerId),
    sb
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    sb
      .from("loyalty_transactions")
      .select("*")
      .eq("customer_id", customerId)
      .order("at", { ascending: false }),
  ]);
  const orderRows = must(orders);
  const ids = orderRows.map((o) => o.id);
  const riderIds = orderRows.flatMap((o) => (o.rider_id ? [o.rider_id] : []));
  const [items, events, riders] = await Promise.all([
    ids.length ? sb.from("order_items").select("*").in("order_id", ids) : { data: [], error: null },
    ids.length
      ? sb.from("order_events").select("*").in("order_id", ids)
      : { data: [], error: null },
    // RLS: a customer sees the rider only while their order is on the way
    riderIds.length ? sb.from("riders").select("*").in("id", riderIds) : { data: [], error: null },
  ]);
  return {
    ...base,
    me: toCustomer(must(customer), must(addresses), must(verifications)),
    orders: orderRows.map((o) => toOrder(o, must(items), must(events))),
    riders: must(riders).map(toRider),
    loyaltyTransactions: must(tx).map(toLoyaltyTransaction),
  };
}

/** Loads the business's menu + the signed-in customer's data; reloads on sign-in and every 20 s with live orders. */
export function CustomerDataProvider({ children }: { children: ReactNode }) {
  const auth = useCustomerIdentity();
  const customerId = auth.identity?.customerId;
  const [state, setState] = useState<{ data: CustomerData | null; error?: string; key?: string }>({
    data: null,
  });
  const key = `${auth.tenant.id}:${customerId ?? "-"}`;

  const reload = useCallback(async () => {
    try {
      const data = await load(auth.supabase, auth.tenant.id, customerId);
      setState({ data, key });
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e), key }));
    }
  }, [auth.supabase, auth.tenant.id, customerId, key]);

  useEffect(() => {
    if (auth.ready) void reload();
  }, [auth.ready, reload]);

  // Tracking without Realtime yet (2.6): refresh while an order is in progress, and when the app comes back.
  const hasLiveOrder = Boolean(
    state.data?.orders.some((o) => !["DELIVERED", "REJECTED", "CANCELLED"].includes(o.status)),
  );
  useEffect(() => {
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    const timer = hasLiveOrder ? window.setInterval(onFocus, 20_000) : undefined;
    return () => {
      window.removeEventListener("focus", onFocus);
      if (timer) window.clearInterval(timer);
    };
  }, [hasLiveOrder, reload]);

  return (
    <DataContext.Provider
      value={{ data: state.data, error: state.error, loaded: state.key === key, reload }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useCustomerData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useCustomerData needs <CustomerDataProvider>");
  return ctx;
}
