"use server";

import type { CartLine } from "@chowlane/lib";
import type { Centavos, LatLng } from "@chowlane/types";
import { CHECKOUT_MESSAGES, placeOrder } from "@chowlane/lib";
import {
  toBarangayFee,
  toCoupon,
  toCustomer,
  toMerchant,
  toPlaceOrderPayload,
  toProduct,
  toTenantSettings,
  type VerificationUpload,
} from "@chowlane/db/mappers";
import { createAdminSupabase } from "@chowlane/db/admin";
import { createServerSupabase } from "@chowlane/db/server";

export type PlaceOrderRequest = {
  tenantId: string;
  merchantId: string;
  lines: CartLine[];
  pin: LatLng;
  addressText: string;
  notes?: string;
  barangayFeeId?: string;
  couponCode?: string;
  useFreeDelivery: boolean;
  claimGift: boolean;
  points: number;
  changeFor?: Centavos;
  /** First order (or after a rejected ID): photos already uploaded to id-documents (BL-3.3). */
  verification?: VerificationUpload;
};

export type PlaceOrderResponse =
  | { ok: true; orderId: string; orderNumber: string; autoApproved: boolean }
  | { ok: false; error: string };

/**
 * Places an order (CUS-005). Runs on the server: who the customer is comes from their session; the menu (incl. store
 * prices), coupon and settings are read here with the service role; packages/lib prices the order (same rules as the
 * checkout screen); `place_order` re-checks coupon limits, balances and totals in one transaction and saves it.
 */
export async function placeOrderAction(req: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  const session = await createServerSupabase("customer");
  const { data: auth } = await session.auth.getUser();
  if (!auth.user) return { ok: false, error: "Your session ended. Log in again." };
  const { data: me } = await session
    .from("customers")
    .select("id")
    .eq("tenant_id", req.tenantId)
    .eq("auth_user_id", auth.user.id)
    .maybeSingle();
  if (!me) return { ok: false, error: "Log in again to order." };

  const admin = createAdminSupabase();
  const code = req.couponCode?.trim().toUpperCase() || undefined;
  const [settings, merchant, products, customer, addresses, verifications, barangay, coupon] =
    await Promise.all([
      admin.from("tenant_settings").select("*").eq("tenant_id", req.tenantId).single(),
      admin
        .from("merchants")
        .select("*")
        .eq("id", req.merchantId)
        .eq("tenant_id", req.tenantId)
        .maybeSingle(),
      admin.from("products").select("*").eq("tenant_id", req.tenantId),
      admin.from("customers").select("*").eq("id", me.id).single(),
      admin.from("customer_addresses").select("*").eq("customer_id", me.id),
      admin.from("verifications").select("*").eq("customer_id", me.id),
      req.barangayFeeId
        ? admin
            .from("barangay_fees")
            .select("*")
            .eq("id", req.barangayFeeId)
            .eq("tenant_id", req.tenantId)
            .maybeSingle()
        : { data: null, error: null },
      code
        ? admin
            .from("coupons")
            .select("*")
            .eq("tenant_id", req.tenantId)
            .eq("code", code)
            .maybeSingle()
        : { data: null, error: null },
    ]);
  const failed = [settings, merchant, products, customer, addresses, verifications].find(
    (r) => r.error,
  );
  if (failed?.error) return { ok: false, error: failed.error.message };
  if (!merchant.data) return { ok: false, error: "This restaurant isn't available." };

  const usedByMe = coupon.data
    ? ((
        await admin
          .from("coupon_redemptions")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", coupon.data.id)
          .eq("customer_id", me.id)
          .eq("released", false)
      ).count ?? 0)
    : 0;

  const r = placeOrder({
    lines: req.lines,
    products: products.data!.map(toProduct),
    merchant: toMerchant(merchant.data),
    settings: toTenantSettings(settings.data!),
    customer: toCustomer(customer.data!, addresses.data!, verifications.data!),
    pin: req.pin,
    barangayFee: barangay.data ? toBarangayFee(barangay.data) : undefined,
    couponCode: code,
    coupon: coupon.data ? toCoupon(coupon.data) : undefined,
    customerCouponUses: usedByMe,
    useFreeDeliveryReward: req.useFreeDelivery,
    claimFreeGift: req.claimGift,
    pointsToRedeem: req.points,
    changeFor: req.changeFor,
    now: new Date().toISOString(),
    tenantId: req.tenantId,
    orderId: "",
    orderNumber: "",
    addressText: req.addressText.trim(),
    notes: req.notes,
    // the id is set by the database; placeOrder only needs to know an ID comes with the order
    verification: req.verification ? { ...req.verification, id: "" } : undefined,
  });
  if (!r.ok)
    return {
      ok: false,
      error: r.reason ?? CHECKOUT_MESSAGES[r.problems[0]!] ?? "Check your order.",
    };

  const { data, error } = await admin.rpc("place_order", {
    p: toPlaceOrderPayload(r.order, req.verification),
  });
  if (error) return { ok: false, error: error.message };
  const placed = data as { id: string; order_number: string; status: string };
  return {
    ok: true,
    orderId: placed.id,
    orderNumber: placed.order_number,
    autoApproved: placed.status === "APPROVED",
  };
}
