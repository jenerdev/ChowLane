"use server";

import type { Order } from "@chowlane/types";
import {
  applyDeliveredOrder,
  completeDelivery,
  effectiveRiderPayRule,
  orderFoodPaid,
  setItemsUnavailable,
} from "@chowlane/lib";
import { toCoupon, toCustomer, toOrder, toRider, toTenantSettings } from "@chowlane/db/mappers";
import { createAdminSupabase } from "@chowlane/db/admin";
import { createServerSupabase } from "@chowlane/db/server";

export type DeliveryActionResult = { ok: true } | { ok: false; error: string };

/**
 * The two delivery steps that change money (BL-11.7, BL-14.12). Who the rider is comes from their session; the
 * order, coupon, settings and customer are read here with the service role; packages/lib computes the new numbers
 * (same rules as Phase 1); the Postgres function re-checks the invariants and saves in one transaction.
 */
async function loadForRider(orderId: string) {
  const session = await createServerSupabase("rider");
  const { data: auth } = await session.auth.getUser();
  if (!auth.user) return { error: "Your session ended. Log in again." } as const;
  const admin = createAdminSupabase();
  const { data: row } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!row) return { error: "Order not found." } as const;
  const { data: rider } = await admin
    .from("riders")
    .select("*")
    .eq("tenant_id", row.tenant_id)
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (!rider || rider.status !== "ACTIVE" || row.rider_id !== rider.id)
    return { error: "This isn't your order." } as const;
  const [items, coupon] = await Promise.all([
    admin.from("order_items").select("*").eq("order_id", orderId).order("line_no"),
    row.coupon_id
      ? admin.from("coupons").select("*").eq("id", row.coupon_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const itemRows = items.data ?? [];
  return {
    admin,
    rider: toRider(rider),
    order: toOrder(row, itemRows),
    lineNos: itemRows.map((i) => i.line_no),
    coupon: coupon.data ? toCoupon(coupon.data) : undefined,
  } as const;
}

/** RID-012: mark items the store doesn't have; the total the customer pays is recalculated. */
export async function setItemsUnavailableAction(
  orderId: string,
  unavailableIdx: number[],
): Promise<DeliveryActionResult> {
  const ctx = await loadForRider(orderId);
  if ("error" in ctx) return { ok: false, error: ctx.error ?? "Something went wrong." };
  const next: Order = setItemsUnavailable(ctx.order, unavailableIdx, ctx.coupon);
  const { error } = await ctx.admin.rpc("set_items_unavailable", {
    p: {
      order_id: orderId,
      rider_id: ctx.rider.id,
      unavailable_lines: unavailableIdx.map((i) => ctx.lineNos[i]!),
      subtotal: next.subtotal,
      coupon_discount: next.couponDiscount,
      points_discount: next.pointsDiscount,
      discount_total: next.discountTotal,
      total: next.total,
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** RID-007: cash collected + proof → DELIVERED, rider earning and the customer's loyalty (BL-14.12). */
export async function completeDeliveryAction(
  orderId: string,
  proof: { photoPath?: string; note?: string },
  cashCollected: boolean,
): Promise<DeliveryActionResult & { riderEarning?: number }> {
  // Another delivery for the same customer may update their loyalty counters meanwhile → retry (40001).
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctx = await loadForRider(orderId);
    if ("error" in ctx) return { ok: false, error: ctx.error ?? "Something went wrong." };
    const { admin, order, rider, coupon } = ctx;
    const [settingsRes, customerRes] = await Promise.all([
      admin.from("tenant_settings").select("*").eq("tenant_id", order.tenantId).single(),
      admin.from("customers").select("*").eq("id", order.customerId).single(),
    ]);
    if (!settingsRes.data || !customerRes.data)
      return { ok: false, error: "Couldn't load the order's business or customer." };
    const settings = toTenantSettings(settingsRes.data);
    const customer = toCustomer(customerRes.data, [], []);
    const rule = effectiveRiderPayRule(settings.riderPay, rider.payOverride);
    const loyalty = applyDeliveredOrder(
      customer.loyalty,
      settings.loyalty,
      orderFoodPaid(order, coupon),
    );
    const done = completeDelivery(
      order,
      rider.id,
      rule,
      { photoUrl: proof.photoPath, note: proof.note },
      cashCollected,
      loyalty.pointsEarned,
      new Date().toISOString(),
    );
    if (!done.ok) return { ok: false, error: done.reason };

    const { error } = await admin.rpc("complete_delivery", {
      p: {
        order_id: orderId,
        rider_id: rider.id,
        cash_collected: cashCollected,
        proof_photo_url: proof.photoPath ?? null,
        proof_note: proof.note?.trim() || null,
        rider_earning: done.value.riderEarning ?? null,
        loyalty: {
          base_delivered_orders: customer.loyalty.deliveredOrders,
          orders_toward_free_delivery: loyalty.loyalty.ordersTowardFreeDelivery,
          orders_toward_free_gift: loyalty.loyalty.ordersTowardFreeGift,
          points_earned: loyalty.pointsEarned,
          free_delivery_earned: loyalty.freeDeliveryEarned,
          free_gift_earned: loyalty.freeGiftEarned,
        },
      },
    });
    if (!error) return { ok: true, riderEarning: done.value.riderEarning };
    if (error.code !== "40001") return { ok: false, error: error.message };
  }
  return { ok: false, error: "The customer's account is busy — try again." };
}
