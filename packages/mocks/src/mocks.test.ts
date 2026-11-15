import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@chowlane/types";
import { mockDb } from "./index";

const tenantIds = new Set(mockDb.tenants.map((t) => t.id));

describe("mock data integrity", () => {
  it("every tenant-scoped row points to an existing tenant", () => {
    const scoped = [
      mockDb.tenantSettings,
      mockDb.tenantBilling,
      mockDb.billingStatements,
      mockDb.barangayFees,
      mockDb.roles,
      mockDb.staff,
      mockDb.merchants,
      mockDb.products,
      mockDb.riders,
      mockDb.shifts,
      mockDb.customers,
      mockDb.orders,
      mockDb.coupons,
      mockDb.couponRedemptions,
      mockDb.loyaltyTransactions,
    ];
    for (const rows of scoped) for (const r of rows) expect(tenantIds.has(r.tenantId)).toBe(true);
  });

  it("covers every order status", () => {
    const seen = new Set(mockDb.orders.map((o) => o.status));
    for (const s of ORDER_STATUSES) expect(seen.has(s)).toBe(true);
  });

  it("order references stay inside one tenant and totals add up", () => {
    for (const o of mockDb.orders) {
      const merchant = mockDb.merchants.find((m) => m.id === o.merchantId)!;
      const customer = mockDb.customers.find((c) => c.id === o.customerId)!;
      expect(merchant.tenantId).toBe(o.tenantId);
      expect(customer.tenantId).toBe(o.tenantId);
      if (o.riderId)
        expect(mockDb.riders.find((r) => r.id === o.riderId)!.tenantId).toBe(o.tenantId);
      expect(o.total).toBe(o.subtotal + o.deliveryFee - o.discountTotal);
      expect(o.deliveryFee).toBeGreaterThan(0);
      expect(o.timeline.at(-1)!.status).toBe(o.status);
    }
  });

  it("riders' active orders are assigned to them", () => {
    for (const r of mockDb.riders.filter((x) => x.activeOrderId)) {
      const order = mockDb.orders.find((o) => o.id === r.activeOrderId)!;
      expect(order.riderId).toBe(r.id);
      expect(r.isOnShift).toBe(true);
    }
  });

  it("each tenant has exactly one owner", () => {
    for (const t of mockDb.tenants) {
      const owners = mockDb.staff.filter((s) => s.tenantId === t.id && s.type === "OWNER");
      expect(owners.map((o) => o.id)).toEqual([t.ownerId]);
    }
  });

  it("uses each kind of promo at least once", () => {
    expect(mockDb.orders.some((o) => o.couponDiscount > 0)).toBe(true);
    expect(mockDb.orders.some((o) => o.usedFreeDeliveryReward)).toBe(true);
    expect(
      mockDb.orders.some((o) => o.usedFreeGiftReward && o.items.some((i) => i.isFreeGift)),
    ).toBe(true);
    expect(mockDb.orders.some((o) => o.pointsRedeemed > 0)).toBe(true);
    expect(mockDb.orders.some((o) => (o.pointsEarned ?? 0) > 0)).toBe(true);
  });

  it("coupon orders meet the coupon's minimum order", () => {
    for (const o of mockDb.orders.filter((x) => x.couponId)) {
      const c = mockDb.coupons.find((x) => x.id === o.couponId)!;
      expect(o.subtotal).toBeGreaterThanOrEqual(c.minOrderSubtotal ?? 0);
    }
  });
});
