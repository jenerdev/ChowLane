import { describe, expect, it } from "vitest";
import { mockDb } from "./index";
import {
  approveCustomer,
  approveOrder,
  cancelOrder,
  declinedRiderIds,
  needsRider,
  offerOrder,
  rejectCustomer,
  rejectOrder,
  respondToOffer,
  timeAgo,
} from "@chowlane/lib";

const now = "2026-11-15T05:00:00.000Z";
const order = (id: string) => structuredClone(mockDb.orders.find((o) => o.id === id)!);
const customer = (id: string) => structuredClone(mockDb.customers.find((c) => c.id === id)!);

describe("order actions", () => {
  it("approves only verified customers' orders", () => {
    const first = order("o-fb-1"); // customer pending verification
    expect(approveOrder(first, customer("c-fb-2"), "s1", "ADMIN", now)).toEqual({
      ok: false,
      reason: "Verify the customer's ID first.",
    });
    const r = approveOrder(order("o-fb-2"), customer("c-fb-1"), "s1", "ADMIN", now);
    expect(r.ok && r.order.status).toBe("APPROVED");
    expect(r.ok && r.order.timeline.at(-1)).toMatchObject({ status: "APPROVED", actorId: "s1" });
  });

  it("rejects and cancels with a reason", () => {
    expect(rejectOrder(order("o-fb-2"), "s1", "ADMIN", "", now).ok).toBe(false);
    const r = rejectOrder(order("o-fb-2"), "s1", "ADMIN", "Store closed", now);
    expect(r.ok && r.order).toMatchObject({ status: "REJECTED", rejectReason: "Store closed" });
    expect(cancelOrder(order("o-fb-5"), "s1", "ADMIN", "x", now).ok).toBe(false); // picked up
    expect(cancelOrder(order("o-fb-4"), "s1", "ADMIN", "Customer unreachable", now).ok).toBe(true);
  });

  it("offers, withdraws the previous offer, and handles responses", () => {
    const o = order("o-fb-3"); // has a pending offer to rd-fb-3
    const r = offerOrder(o, "rd-fb-4", "ADMIN", "s1", now, 60);
    if (!r.ok) throw new Error(r.reason);
    expect(r.order.assignmentAttempts.find((a) => a.riderId === "rd-fb-3")?.response).toBe(
      "WITHDRAWN",
    );
    expect(r.order.pendingOffer).toMatchObject({
      riderId: "rd-fb-4",
      expiresAt: "2026-11-15T05:01:00.000Z",
    });

    const rejected = respondToOffer(r.order, "REJECTED", now, "TOO_FAR");
    if (!rejected.ok) throw new Error();
    expect(needsRider(rejected.order)).toBe(true);
    expect(declinedRiderIds(rejected.order)).toContain("rd-fb-4");

    const again = offerOrder(rejected.order, "rd-fb-2", "AUTO", undefined, now, 60);
    if (!again.ok) throw new Error();
    const accepted = respondToOffer(again.order, "ACCEPTED", now);
    expect(accepted.ok && accepted.order).toMatchObject({ status: "ASSIGNED", riderId: "rd-fb-2" });
  });

  it("reassigning before pickup puts the order back to APPROVED", () => {
    const r = offerOrder(order("o-fb-4"), "rd-fb-3", "ADMIN", "s1", now, 60);
    expect(r.ok && r.order).toMatchObject({ status: "APPROVED", riderId: undefined });
  });
});

describe("customer verification", () => {
  it("approves and rejects the latest submission", () => {
    const ok = approveCustomer(customer("c-fb-2"), "s1", now);
    expect(ok.verificationStatus).toBe("VERIFIED");
    expect(ok.verificationHistory.at(-1)?.result).toBe("APPROVED");
    const no = rejectCustomer(customer("c-fb-2"), "s1", "Blurry", now);
    expect(no.verification).toMatchObject({ result: "REJECTED", rejectReason: "Blurry" });
  });
});

describe("timeAgo", () => {
  it("formats", () => {
    expect(timeAgo("2026-11-15T04:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-11-15T04:48:00Z", now)).toBe("12 min ago");
    expect(timeAgo("2026-11-15T02:00:00Z", now)).toBe("3 h ago");
    expect(timeAgo("2026-11-13T02:00:00Z", now)).toBe("2 d ago");
  });
});

describe("open offers", () => {
  it("lists riders holding an open offer and detects expiry", async () => {
    const { ridersWithOpenOffers, isOfferExpired } = await import("@chowlane/lib");
    const o3 = order("o-fb-3");
    expect(ridersWithOpenOffers(mockDb.orders)).toContain("rd-fb-3");
    expect(ridersWithOpenOffers(mockDb.orders, "o-fb-3")).not.toContain("rd-fb-3");
    expect(isOfferExpired(o3, o3.pendingOffer!.offeredAt)).toBe(false);
    expect(isOfferExpired(o3, "2030-01-01T00:00:00Z")).toBe(true);
  });
});

describe("coupon release", () => {
  it("gives back one use and marks the redemption released", async () => {
    const { couponRelease } = await import("@chowlane/lib");
    const o = order("o-fb-2"); // uses WELCOME20 (37 used)
    const r = couponRelease(o, mockDb.coupons, mockDb.couponRedemptions);
    expect(r).toMatchObject({ couponId: "cp-1", usedCount: 36 });
    expect(r?.redemptionId).toBeDefined();
    expect(couponRelease(order("o-fb-1"), mockDb.coupons, mockDb.couponRedemptions)).toBeNull();
  });
});

describe("rider pay report", () => {
  it("sums deliveries and earnings per rider in a period", async () => {
    const { riderPayReport } = await import("@chowlane/lib");
    const rows = riderPayReport({
      riders: mockDb.riders.filter((r) => r.tenantId === "t-fastbite"),
      orders: mockDb.orders,
      shifts: mockDb.shifts,
      tenantRule: { mode: "COMMISSION", percent: 80 },
      period: { start: "2026-11-01T00:00:00Z", end: "2026-11-30T23:59:59Z" },
    });
    const jomar = rows.find((r) => r.riderId === "rd-fb-1")!;
    expect(jomar.deliveries).toBe(1);
    expect(jomar.earnings).toBe(Math.round(jomar.deliveryFees * 0.8));
    const dennis = rows.find((r) => r.riderId === "rd-fb-4")!; // own rate ₱45 / delivery, 0 deliveries, 1 day
    expect(dennis).toMatchObject({
      hasOverride: true,
      deliveries: 0,
      daysWorked: 1,
      earnings: 0,
      cashPending: 43400,
    });
  });
});
