import { describe, expect, it } from "vitest";
import type {
  BarangayFee,
  Coupon,
  Customer,
  Merchant,
  Order,
  Product,
  TenantSettings,
} from "@chowlane/types";
import {
  checkoutQuote,
  customerStatusMessage,
  needsIdForOrder,
  nextOrderNumber,
  placeOrder,
  promoRefunds,
  trackingSteps,
  type CheckoutInput,
} from "./index";

const now = "2026-11-15T04:00:00.000Z";
const center = { lat: 14.5547, lng: 121.0244 };

const settings: TenantSettings = {
  tenantId: "t",
  serviceArea: { center, radiusKm: 5 },
  deliveryFee: { mode: "PER_KM", baseFee: 4900, ratePerKm: 1000, includedKm: 2, minFee: 4900 },
  riderPay: { mode: "COMMISSION", percent: 80 },
  autoApproveVerifiedCustomers: false,
  dispatchMode: "AUTO",
  riderResponseTimeoutSec: 60,
  acceptedIdTypes: ["SCHOOL"],
  maxOrderSubtotal: 200000,
  pinAdjustRadiusM: 200,
  loyalty: {
    enabled: true,
    freeDelivery: { enabled: true, ordersRequired: 10 },
    freeGift: { enabled: true, ordersRequired: 5, giftName: "Free Halo-Halo", productId: "p-gift" },
    points: {
      enabled: true,
      earnMode: "PER_PESO",
      pointsPerOrder: 0,
      centavosPerPoint: 5000,
      pointValue: 100,
      minRedeemPoints: 50,
      maxRedeemPercent: 50,
    },
  },
};

const merchant: Merchant = {
  id: "m1",
  tenantId: "t",
  name: "Lola's",
  category: "Filipino",
  phone: "+639171110001",
  address: "",
  location: { lat: 14.5622, lng: 121.0296 },
  photoUrl: "",
  isOpen: true,
  status: "ACTIVE",
  createdAt: "",
};
const product = (id: string, price: number, merchantId = "m1", isAvailable = true): Product => ({
  id,
  tenantId: "t",
  merchantId,
  name: id,
  category: "Meals",
  description: "",
  price,
  storePrice: price - 2000,
  imageUrl: "",
  isAvailable,
  sortOrder: 0,
});
const products = [
  product("p1", 15000),
  product("p2", 10000),
  product("p-gift", 9500),
  product("p-other", 5000, "m2"),
];

const customer = (over: Partial<Customer> = {}): Customer => ({
  id: "c1",
  tenantId: "t",
  facebookId: "fb",
  name: "Andrea",
  avatarUrl: "",
  verificationStatus: "VERIFIED",
  verificationHistory: [],
  locationPermission: "GRANTED",
  addresses: [],
  loyalty: {
    deliveredOrders: 12,
    ordersTowardFreeDelivery: 2,
    freeDeliveryRewards: 1,
    ordersTowardFreeGift: 0,
    freeGiftRewards: 1,
    points: 200,
  },
  createdAt: "",
  ...over,
});

const base = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  lines: [{ productId: "p1", qty: 2 }],
  products,
  merchant,
  settings,
  customer: customer(),
  pin: { lat: 14.5598, lng: 121.0235 },
  now,
  ...over,
});

describe("checkoutQuote", () => {
  it("prices a normal order", () => {
    const q = checkoutQuote(base());
    expect(q.problems).toEqual([]);
    expect(q.pricing).toMatchObject({ subtotal: 30000, deliveryFee: 4900, total: 34900 });
  });

  it("blocks closed stores, sold-out items, out-of-area pins and large orders", () => {
    expect(checkoutQuote(base({ merchant: { ...merchant, isOpen: false } })).problems).toContain(
      "MERCHANT_CLOSED",
    );
    expect(
      checkoutQuote(base({ products: [product("p1", 15000, "m1", false)] })).problems,
    ).toContain("ITEM_UNAVAILABLE");
    expect(checkoutQuote(base({ pin: { lat: 14.7, lng: 121.1 } })).problems).toContain(
      "OUTSIDE_AREA",
    );
    expect(checkoutQuote(base({ lines: [{ productId: "p1", qty: 20 }] })).problems).toContain(
      "OVER_MAX_ORDER",
    );
    expect(checkoutQuote(base({ lines: [] })).problems).toContain("EMPTY_CART");
  });

  it("stays closed until the business sets a delivery fee (D-061)", () => {
    const q = checkoutQuote(base({ settings: { ...settings, deliveryFee: undefined } }));
    expect(q.problems).toContain("DELIVERY_NOT_SET");
    expect(q.pricing).toBeNull();
  });

  it("uses the barangay list in PER_BARANGAY mode", () => {
    const s = { ...settings, deliveryFee: { mode: "PER_BARANGAY" } as const };
    const b: BarangayFee = {
      id: "b1",
      tenantId: "t",
      barangay: "Lahug",
      cityMunicipality: "Cebu",
      province: "Cebu",
      fee: 4000,
      isActive: true,
    };
    expect(checkoutQuote(base({ settings: s })).problems).toContain("BARANGAY_NOT_LISTED");
    const q = checkoutQuote(base({ settings: s, barangayFee: b, pin: { lat: 10.33, lng: 123.9 } }));
    expect(q.problems).toEqual([]);
    expect(q.pricing?.deliveryFee).toBe(4000);
  });

  it("applies coupon OR free delivery, plus points and a free gift", () => {
    const coupon: Coupon = {
      id: "cp",
      tenantId: "t",
      code: "SAVE10",
      type: "PERCENT_OFF",
      percentOff: 10,
      maxUses: 10,
      usedCount: 0,
      perCustomerLimit: 1,
      validFrom: "2026-11-01T00:00:00Z",
      validUntil: "2026-12-01T00:00:00Z",
      isActive: true,
      createdBy: "s",
      createdAt: "",
    };
    const withCoupon = checkoutQuote(
      base({
        couponCode: "SAVE10",
        coupon,
        useFreeDeliveryReward: true,
        pointsToRedeem: 100,
        claimFreeGift: true,
      }),
    );
    expect(withCoupon.pricing).toMatchObject({
      couponDiscount: 3000,
      freeDeliveryDiscount: 0,
      pointsRedeemed: 100,
    });
    expect(withCoupon.items.some((i) => i.isFreeGift && i.unitPrice === 0)).toBe(true);

    const noCoupon = checkoutQuote(base({ useFreeDeliveryReward: true }));
    expect(noCoupon.pricing).toMatchObject({ freeDeliveryDiscount: 4900, total: 30000 });

    expect(checkoutQuote(base({ couponCode: "NOPE" })).couponError).toBe(
      "This coupon code doesn't exist.",
    );
  });

  it("only offers the linked gift on that merchant's orders", () => {
    const other = { ...merchant, id: "m2" };
    const q = checkoutQuote(
      base({ merchant: other, lines: [{ productId: "p-other", qty: 1 }], claimFreeGift: true }),
    );
    expect(q.giftOtherMerchant).toBe(true);
    expect(q.items.some((i) => i.isFreeGift)).toBe(false);
  });

  it("checks change-for against the total", () => {
    expect(checkoutQuote(base({ changeFor: 30000 })).problems).toContain("BAD_CHANGE");
    expect(checkoutQuote(base({ changeFor: 50000 })).problems).toEqual([]);
  });
});

describe("placeOrder", () => {
  const extra = {
    tenantId: "t",
    orderId: "o-new",
    orderNumber: "FB-10300",
    addressText: "Salcedo",
  };

  it("needs an ID from unverified or rejected customers", () => {
    expect(needsIdForOrder(customer({ verificationStatus: "UNVERIFIED" }))).toBe(true);
    expect(needsIdForOrder(customer({ verificationStatus: "PENDING" }))).toBe(false);
    const r = placeOrder({
      ...base({ customer: customer({ verificationStatus: "UNVERIFIED" }) }),
      ...extra,
    });
    expect(r.ok).toBe(false);
    const ok = placeOrder({
      ...base({ customer: customer({ verificationStatus: "REJECTED" }) }),
      ...extra,
      verification: { id: "v9", idType: "SCHOOL", idFrontUrl: "x", selfieWithIdUrl: "y" },
    });
    expect(ok.ok && ok.customer.verificationStatus).toBe("PENDING");
    expect(ok.ok && ok.customer.verificationHistory.at(-1)?.orderId).toBe("o-new");
    expect(ok.ok && ok.order.status).toBe("PENDING_APPROVAL");
  });

  it("auto-approves verified customers when the tenant allows it, and books promos", () => {
    const r = placeOrder({
      ...base({
        settings: { ...settings, autoApproveVerifiedCustomers: true },
        useFreeDeliveryReward: true,
        pointsToRedeem: 100,
      }),
      ...extra,
    });
    if (!r.ok) throw new Error("expected ok");
    expect(r.autoApproved).toBe(true);
    expect(r.order.status).toBe("APPROVED");
    expect(r.order.timeline.map((t) => t.status)).toEqual(["PENDING_APPROVAL", "APPROVED"]);
    expect(r.customer.loyalty).toMatchObject({ points: 100, freeDeliveryRewards: 0 });
    expect(r.transactions.map((t) => t.kind)).toEqual(["POINTS_REDEEMED", "FREE_DELIVERY_USED"]);

    const refund = promoRefunds(r.order, r.customer, now);
    expect(refund.loyalty).toMatchObject({ points: 200, freeDeliveryRewards: 1 });
  });
});

describe("helpers", () => {
  it("continues the order number sequence", () => {
    expect(nextOrderNumber(["FB-10231", "FB-10232"], "fastbite")).toBe("FB-10233");
    expect(nextOrderNumber([], "kainexpress")).toBe("KA-1001");
  });

  it("builds tracking steps and messages", () => {
    const order = { status: "AT_MERCHANT", total: 34900 } as Order;
    expect(trackingSteps(order).map((s) => s.state)).toEqual([
      "done",
      "done",
      "done",
      "current",
      "todo",
      "todo",
    ]);
    expect(trackingSteps({ ...order, status: "CANCELLED" } as Order)).toEqual([]);
    expect(customerStatusMessage({ ...order, status: "PICKED_UP" } as Order, customer())).toContain(
      "₱349.00",
    );
  });
});
