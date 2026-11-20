import { describe, expect, it } from "vitest";
import {
  fromCoupon,
  fromTenantSettings,
  toCustomer,
  toOfferOrder,
  type CustomerRow,
  type OfferJson,
  type VerificationRow,
} from "./mappers";

const customer: CustomerRow = {
  id: "c1",
  tenant_id: "t1",
  auth_user_id: null,
  facebook_id: "fb1",
  name: "Ana",
  email: null,
  phone: null,
  avatar_url: "",
  verification_status: "REJECTED",
  location_permission: "UNKNOWN",
  loyalty_delivered_orders: 3,
  loyalty_orders_toward_free_delivery: 1,
  loyalty_free_delivery_rewards: 0,
  loyalty_orders_toward_free_gift: 2,
  loyalty_free_gift_rewards: 1,
  loyalty_points: 40,
  created_at: "2026-11-01T00:00:00Z",
};

const submission = (id: string, at: string, customerId = "c1"): VerificationRow => ({
  id,
  tenant_id: "t1",
  customer_id: customerId,
  id_type: "UMID",
  id_front_url: "",
  id_back_url: null,
  selfie_with_id_url: "",
  submitted_at: at,
  order_id: null,
  result: null,
  reviewed_by: null,
  reviewed_at: null,
  reject_reason: null,
});

describe("row mappers", () => {
  it("builds a customer: latest submission first, nulls become undefined, loyalty balances", () => {
    const c = toCustomer(
      customer,
      [],
      [
        submission("v1", "2026-11-02T00:00:00Z"),
        submission("v2", "2026-11-05T00:00:00Z"),
        submission("other", "2026-11-09T00:00:00Z", "c2"),
      ],
    );
    expect(c.verification?.id).toBe("v2");
    expect(c.verificationHistory.map((v) => v.id)).toEqual(["v2", "v1"]);
    expect(c.email).toBeUndefined();
    expect(c.loyalty).toMatchObject({ points: 40, freeGiftRewards: 1, deliveredOrders: 3 });
  });

  it("writes only the settings group that changed", () => {
    expect(fromTenantSettings({ dispatchMode: "AUTO" })).toEqual({ dispatch_mode: "AUTO" });
    expect(
      fromTenantSettings({ serviceArea: { center: { lat: 14.5, lng: 121 }, radiusKm: 5 } }),
    ).toEqual({ service_area_lat: 14.5, service_area_lng: 121, service_area_radius_km: 5 });
    expect(fromTenantSettings({ deliveryFee: { mode: "FIXED", amount: 5000 } })).toEqual({
      delivery_fee: { mode: "FIXED", amount: 5000 },
    });
  });

  it("drops percent fields from a free-delivery coupon", () => {
    const row = fromCoupon({
      code: "FREE",
      type: "FREE_DELIVERY",
      percentOff: 10,
      maxDiscount: 5000,
      maxUses: 5,
      perCustomerLimit: 1,
      validFrom: "2026-11-01T00:00:00Z",
      validUntil: "2026-12-01T00:00:00Z",
      isActive: true,
    });
    expect(row).toMatchObject({ percent_off: null, max_discount: null, description: null });
  });

  it("builds an offer the rider can see before accepting — area only, no address (BL-5.15)", () => {
    const base: OfferJson = {
      id: "o1",
      tenant_id: "t1",
      order_number: "FB-10240",
      merchant_id: "m1",
      distance_km: 2.4,
      drop_off_area: "Poblacion, Makati City",
      subtotal: 30000,
      delivery_fee: 5900,
      discount_total: 0,
      total: 35900,
      change_for: null,
      created_at: "2026-11-20T01:00:00Z",
      offer_offered_at: "2026-11-20T01:01:00Z",
      offer_expires_at: "2026-11-20T01:02:00Z",
      offer_by: "AUTO",
      items: [
        {
          line_no: 2,
          name: "Fries",
          qty: 1,
          unit_price: 9000,
          store_unit_price: 8000,
          line_total: 9000,
          is_free_gift: false,
        },
        {
          line_no: 1,
          name: "Burger",
          qty: 1,
          unit_price: 21000,
          store_unit_price: null,
          line_total: 21000,
          is_free_gift: false,
        },
      ],
    };
    const o = toOfferOrder(base, "r1");
    // dropOffArea (lib) shows what follows the first comma
    expect(o.deliveryAddressText.split(",").slice(1).join(",").trim()).toBe(
      "Poblacion, Makati City",
    );
    expect(o.items.map((i) => i.name)).toEqual(["Burger", "Fries"]);
    expect(o.items[0]!.storeUnitPrice).toBeUndefined();
    expect(o.status).toBe("APPROVED");
    // no barangay entry → no area, and no comma for dropOffArea to split
    expect(toOfferOrder({ ...base, drop_off_area: null }, "r1").deliveryAddressText).toBe(
      "Address shown after you accept",
    );
    expect(o.pendingOffer).toMatchObject({ riderId: "r1", expiresAt: "2026-11-20T01:02:00Z" });
  });
});
