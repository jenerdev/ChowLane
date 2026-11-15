import { describe, expect, it } from "vitest";
import type { Coupon } from "@chowlane/types";
import { PERMISSION_KEYS } from "@chowlane/types";
import {
  checkCouponDraft,
  checklistProgress,
  couponStatus,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  setupChecklist,
} from "./index";

const coupon: Coupon = {
  id: "c",
  tenantId: "t",
  code: "TEST10",
  type: "PERCENT_OFF",
  percentOff: 10,
  maxUses: 10,
  usedCount: 0,
  perCustomerLimit: 1,
  validFrom: "2026-11-01T00:00:00Z",
  validUntil: "2026-11-30T00:00:00Z",
  isActive: true,
  createdBy: "s",
  createdAt: "",
};

describe("permissions catalog", () => {
  it("labels every permission exactly once", () => {
    const keys = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual([...PERMISSION_KEYS].sort());
    expect(PERMISSION_LABELS["orders.approve"]).toBe("Approve orders");
  });
});

describe("coupon status", () => {
  const now = "2026-11-15T00:00:00Z";
  it("derives status", () => {
    expect(couponStatus(coupon, now)).toBe("ACTIVE");
    expect(couponStatus({ ...coupon, isActive: false }, now)).toBe("INACTIVE");
    expect(
      couponStatus(
        { ...coupon, validFrom: "2026-12-01T00:00:00Z", validUntil: "2026-12-31T00:00:00Z" },
        now,
      ),
    ).toBe("SCHEDULED");
    expect(couponStatus({ ...coupon, validUntil: "2026-11-10T00:00:00Z" }, now)).toBe("EXPIRED");
    expect(couponStatus({ ...coupon, usedCount: 10 }, now)).toBe("USED_UP");
  });
  it("validates drafts", () => {
    expect(checkCouponDraft(coupon, [])).toEqual({});
    expect(checkCouponDraft({ ...coupon, code: "ab" }, []).code).toBeDefined();
    expect(checkCouponDraft(coupon, ["TEST10"]).code).toBeDefined();
    expect(checkCouponDraft({ ...coupon, percentOff: 0 }, []).percentOff).toBeDefined();
    expect(
      checkCouponDraft({ ...coupon, validUntil: coupon.validFrom }, []).validUntil,
    ).toBeDefined();
  });
});

describe("setup checklist", () => {
  it("tracks required steps only for completion", () => {
    const steps = setupChecklist({
      slug: "new",
      logoUrl: "",
      serviceAreaConfirmed: true,
      deliveryFeeMode: "PER_BARANGAY",
      barangayCount: 0,
      riderPayMode: "DAILY",
      merchants: [],
      products: [],
      riders: [],
      staff: [],
    });
    const p = checklistProgress(steps);
    expect(p).toEqual({ done: 2, total: 6, complete: false });
    expect(steps.find((s) => s.key === "deliveryFee")!.done).toBe(false);
  });
});
