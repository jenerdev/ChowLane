"use client";

import { useCallback } from "react";
import type { Order, VerificationStatus } from "@chowlane/types";
import { toOrder } from "@chowlane/db/mappers";
import type { AppSupabase } from "@chowlane/db/react";
import { toast } from "@chowlane/ui";
import { useConsole } from "./use-console";
import { must } from "./use-live";

export type OrderListRow = {
  order: Order;
  customer: { name: string; verificationStatus: VerificationStatus };
  merchant: string;
};

/** Orders of the business for the lists (no timeline / items — S-102). */
export async function loadOrderList(sb: AppSupabase, tenantId: string): Promise<OrderListRow[]> {
  const rows = must(
    await sb
      .from("orders")
      .select("*, customer:customers(name, verification_status), merchant:merchants(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
  );
  return rows.map(({ customer, merchant, ...o }) => ({
    order: toOrder(o),
    customer: {
      name: customer?.name ?? "Customer",
      verificationStatus: customer?.verification_status ?? "UNVERIFIED",
    },
    merchant: merchant?.name ?? "Store",
  }));
}

/** One order with items, timeline, rider offers, and the people around it (S-103). */
export async function loadOrderDetail(sb: AppSupabase, tenantId: string, id: string) {
  const res = await sb
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  const row = res.data;
  if (!row) return null;
  const [items, events, attempts, customer, merchant] = await Promise.all([
    sb.from("order_items").select("*").eq("order_id", id),
    sb.from("order_events").select("*").eq("order_id", id),
    sb.from("assignment_attempts").select("*").eq("order_id", id),
    sb
      .from("customers")
      .select("id, name, phone, verification_status")
      .eq("id", row.customer_id)
      .single(),
    sb.from("merchants").select("name").eq("id", row.merchant_id).single(),
  ]);
  const order = toOrder(row, must(items), must(events), must(attempts));
  const riderIds = [
    ...new Set(
      [
        order.riderId,
        order.pendingOffer?.riderId,
        ...order.assignmentAttempts.map((a) => a.riderId),
      ].filter((x): x is string => Boolean(x)),
    ),
  ];
  const riders = riderIds.length
    ? must(await sb.from("riders").select("id, name, phone").in("id", riderIds))
    : [];
  const c = must(customer);
  return {
    order,
    customer: {
      id: c.id,
      name: c.name,
      phone: c.phone ?? undefined,
      verificationStatus: c.verification_status,
    },
    merchant: must(merchant).name,
    riders,
  };
}

/**
 * Order and ID decisions on Supabase (2.5): each is one Postgres function that checks the permission, the status
 * and gives back coupon uses / points itself (BL-3.5, BL-4, BL-13.7, BL-14.7). Returns true when it worked.
 */
export function useOrderOps() {
  const { supabase } = useConsole();
  const run = useCallback(
    async (fn: () => PromiseLike<{ error: { message: string } | null }>, message: string) => {
      const { error } = await fn();
      if (error) {
        toast(error.message, "error");
        return false;
      }
      toast(message);
      return true;
    },
    [],
  );
  return {
    approve: (orderId: string) =>
      run(() => supabase.rpc("approve_order", { p_order: orderId }), "Order approved"),
    reject: (orderId: string, reason: string) =>
      run(
        () => supabase.rpc("reject_order", { p_order: orderId, p_reason: reason }),
        "Order rejected",
      ),
    cancel: (orderId: string, reason: string) =>
      run(
        () => supabase.rpc("cancel_order", { p_order: orderId, p_reason: reason }),
        "Order cancelled",
      ),
    verifyCustomer: (customerId: string, name: string) =>
      run(() => supabase.rpc("verify_customer", { p_customer: customerId }), `${name} verified`),
    rejectCustomer: (customerId: string, name: string, reason: string) =>
      run(
        () => supabase.rpc("reject_customer", { p_customer: customerId, p_reason: reason }),
        `${name}'s ID rejected`,
      ),
  };
}
