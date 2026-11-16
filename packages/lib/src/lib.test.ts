import { describe, expect, it } from "vitest";
import type {
  BarangayFee,
  OrderItem,
  Rider,
  Role,
  StaffUser,
  TenantBilling,
} from "@chowlane/types";
import {
  allItemsUnavailable,
  canCancel,
  canTransition,
  cashNeededAtStore,
  computeBillingAmount,
  computeDeliveryFee,
  computeExpectedRemit,
  computeRiderPay,
  riderPayRuleLabel,
  computeSubtotal,
  exceedsMaxOrder,
  formatPeso,
  formatPhMobile,
  haversineKm,
  hasPermission,
  isPinAdjustAllowed,
  manilaDateKey,
  normalizePhMobile,
  pesos,
  pickAutoRider,
  readableTextColor,
  remitStatusFor,
  riderEarningForOrder,
  roundUpKm,
} from "./index";

describe("money", () => {
  it("formats centavos as pesos", () => {
    expect(formatPeso(123450)).toBe("₱1,234.50");
    expect(pesos(49.5)).toBe(4950);
  });
});

describe("geo", () => {
  const ayala = { lat: 14.5547, lng: 121.0244 };
  const bgc = { lat: 14.5509, lng: 121.0503 };
  it("computes straight-line distance", () => {
    expect(haversineKm(ayala, bgc)).toBeGreaterThan(2.7);
    expect(haversineKm(ayala, bgc)).toBeLessThan(2.9);
  });
  it("rounds km up to 0.1", () => {
    expect(roundUpKm(2.01)).toBe(2.1);
    expect(roundUpKm(2.0)).toBe(2);
  });
  it("limits pin adjustment to the radius", () => {
    expect(isPinAdjustAllowed(ayala, { lat: 14.5555, lng: 121.0244 }, 200)).toBe(true);
    expect(isPinAdjustAllowed(ayala, bgc, 200)).toBe(false);
  });
});

describe("time", () => {
  it("uses Asia/Manila day boundaries", () => {
    expect(manilaDateKey("2026-11-15T16:30:00.000Z")).toBe("2026-11-16");
    expect(manilaDateKey("2026-11-15T15:59:00.000Z")).toBe("2026-11-15");
  });
});

describe("phone", () => {
  it("normalises PH mobile numbers", () => {
    expect(normalizePhMobile("0917 123 4567")).toBe("+639171234567");
    expect(normalizePhMobile("+63 917-123-4567")).toBe("+639171234567");
    expect(normalizePhMobile("9171234567")).toBe("+639171234567");
    expect(normalizePhMobile("028123456")).toBeNull();
    expect(formatPhMobile("+639171234567")).toBe("0917 123 4567");
  });
});

describe("delivery fee", () => {
  const perKm = {
    mode: "PER_KM",
    baseFee: 4900,
    ratePerKm: 1000,
    includedKm: 2,
    minFee: 4900,
  } as const;
  it("FIXED", () => {
    expect(computeDeliveryFee({ rule: { mode: "FIXED", amount: 5000 } })).toEqual({
      ok: true,
      fee: 5000,
    });
  });
  it("PER_KM uses base fee within included km and rounds up to the peso", () => {
    expect(computeDeliveryFee({ rule: perKm, distanceKm: 1.5 })).toEqual({ ok: true, fee: 4900 });
    expect(computeDeliveryFee({ rule: perKm, distanceKm: 4.35 })).toEqual({ ok: true, fee: 7300 });
    expect(computeDeliveryFee({ rule: perKm })).toEqual({ ok: false, reason: "MISSING_DISTANCE" });
  });
  it("PER_BARANGAY needs an active listed barangay", () => {
    const brgy: BarangayFee = {
      id: "b1",
      tenantId: "t1",
      barangay: "Poblacion",
      cityMunicipality: "Makati",
      province: "Metro Manila",
      fee: 4000,
      isActive: true,
    };
    const rule = { mode: "PER_BARANGAY" } as const;
    expect(computeDeliveryFee({ rule, barangayFee: brgy })).toEqual({ ok: true, fee: 4000 });
    expect(computeDeliveryFee({ rule, barangayFee: { ...brgy, isActive: false } })).toEqual({
      ok: false,
      reason: "BARANGAY_NOT_LISTED",
    });
    expect(computeDeliveryFee({ rule })).toEqual({ ok: false, reason: "BARANGAY_NOT_LISTED" });
  });
});

describe("order totals", () => {
  const items: OrderItem[] = [
    {
      productId: "p1",
      name: "Chickenjoy",
      unitPrice: 12000,
      storeUnitPrice: 10000,
      qty: 2,
      lineTotal: 24000,
    },
    {
      productId: "p2",
      name: "Sundae",
      unitPrice: 5000,
      qty: 1,
      lineTotal: 5000,
      isUnavailable: true,
    },
  ];
  it("excludes unavailable items", () => {
    expect(computeSubtotal(items)).toBe(24000);
    expect(cashNeededAtStore(items)).toBe(20000);
    expect(allItemsUnavailable(items)).toBe(false);
    expect(allItemsUnavailable(items.map((i) => ({ ...i, isUnavailable: true })))).toBe(true);
  });
  it("enforces max order subtotal", () => {
    expect(exceedsMaxOrder(200001, 200000)).toBe(true);
    expect(exceedsMaxOrder(200000, 200000)).toBe(false);
  });
});

describe("order status", () => {
  it("follows the lifecycle", () => {
    expect(canTransition("PENDING_APPROVAL", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "DELIVERED")).toBe(false);
    expect(canTransition("PICKED_UP", "CANCELLED")).toBe(false);
  });
  it("limits who can cancel", () => {
    expect(canCancel("PENDING_APPROVAL", "CUSTOMER")).toBe(true);
    expect(canCancel("APPROVED", "CUSTOMER")).toBe(false);
    expect(canCancel("AT_MERCHANT", "ADMIN")).toBe(true);
    expect(canCancel("PICKED_UP", "OWNER")).toBe(false);
  });
});

describe("permissions", () => {
  const owner: StaffUser = {
    id: "s1",
    tenantId: "t1",
    name: "O",
    email: "o@x",
    type: "OWNER",
    status: "ACTIVE",
    createdAt: "",
  };
  const role: Role = {
    id: "r1",
    tenantId: "t1",
    name: "Dispatcher",
    permissions: ["orders.view"],
    isDefault: false,
  };
  const admin: StaffUser = { ...owner, id: "s2", type: "ADMIN", roleId: "r1" };
  it("owner has everything, admin only their role", () => {
    expect(hasPermission(owner, undefined, "admins.manage")).toBe(true);
    expect(hasPermission(admin, role, "orders.view")).toBe(true);
    expect(hasPermission(admin, role, "orders.approve")).toBe(false);
    expect(hasPermission({ ...admin, status: "INACTIVE" }, role, "orders.view")).toBe(false);
  });
});

describe("rider pay", () => {
  it("per order", () => {
    expect(riderEarningForOrder({ mode: "COMMISSION", percent: 80 }, 6000)).toBe(4800);
    expect(riderEarningForOrder({ mode: "PER_DELIVERY", ratePerDelivery: 4000 }, 6000)).toBe(4000);
  });
  it("DAILY counts distinct Manila days with a shift", () => {
    const pay = computeRiderPay({
      rule: { mode: "DAILY", dailyRate: 50000 },
      deliveredOrderFees: [6000, 6000],
      shiftTimeIns: ["2026-11-15T01:00:00Z", "2026-11-15T08:00:00Z", "2026-11-16T01:00:00Z"],
    });
    expect(pay).toBe(100000);
  });
  it("a business without a pay rule yet pays ₱0 and says so (D-061)", () => {
    expect(computeRiderPay({ rule: undefined, deliveredOrderFees: [6000], shiftTimeIns: [] })).toBe(
      0,
    );
    expect(riderPayRuleLabel(undefined)).toBe("Not set yet");
    expect(riderPayRuleLabel({ mode: "COMMISSION", percent: 80 })).toBe("80% of the delivery fee");
  });
});

describe("remittance", () => {
  it("collected minus paid at stores", () => {
    expect(
      computeExpectedRemit([
        { total: 30000, storeAmountPaid: 22000 },
        { total: 15000, storeAmountPaid: 10500 },
      ]),
    ).toEqual({ cashCollected: 45000, storePaid: 32500, expectedRemit: 12500 });
    expect(remitStatusFor(12500, 12500)).toBe("RECEIVED");
    expect(remitStatusFor(12500, 12000)).toBe("SHORT");
    expect(remitStatusFor(12500, 13000)).toBe("OVER");
  });
});

describe("billing", () => {
  const base: TenantBilling = {
    tenantId: "t1",
    model: "MONTHLY_PLUS_PER_ORDER",
    monthlyFee: 99900,
    perOrderFee: 500,
    effectiveFrom: "",
    updatedBy: "p1",
  };
  it("computes by model and honours trial", () => {
    expect(computeBillingAmount(base, 100, "2026-11-01T00:00:00Z")).toBe(149900);
    expect(computeBillingAmount({ ...base, model: "FREE" }, 100, "2026-11-01T00:00:00Z")).toBe(0);
    expect(
      computeBillingAmount(
        { ...base, trialEndsAt: "2026-12-01T00:00:00Z" },
        100,
        "2026-11-01T00:00:00Z",
      ),
    ).toBe(0);
  });
});

describe("dispatch", () => {
  const rider = (id: string, lat: number, extra: Partial<Rider> = {}): Rider => ({
    id,
    tenantId: "t1",
    name: id,
    phone: "+639170000000",
    photoUrl: "",
    vehicleType: "MOTORCYCLE",
    isOnShift: true,
    status: "ACTIVE",
    createdAt: "",
    lastLocation: { lat, lng: 121.02 },
    ...extra,
  });
  const merchant = { lat: 14.55, lng: 121.02 };
  it("picks the nearest eligible rider who hasn't rejected", () => {
    const riders = [
      rider("far", 14.6),
      rider("near", 14.551),
      rider("busy", 14.55, { activeOrderId: "o1" }),
      rider("off", 14.55, { isOnShift: false }),
    ];
    expect(pickAutoRider(riders, merchant, [])?.id).toBe("near");
    expect(pickAutoRider(riders, merchant, ["near"])?.id).toBe("far");
    expect(pickAutoRider(riders, merchant, ["near", "far"])).toBeUndefined();
  });
});

describe("color", () => {
  it("picks readable text for brand colors", () => {
    expect(readableTextColor("#0E7C66")).toBe("#ffffff");
    expect(readableTextColor("#E4572E")).toBe("#ffffff");
    expect(readableTextColor("#FACC15")).toBe("#1c1917");
  });
});

describe("manila date inputs", () => {
  it("round-trips datetime-local values in Asia/Manila", async () => {
    const { toManilaInput, fromManilaInput, formatDate } = await import("./index");
    expect(toManilaInput("2026-11-15T04:00:00.000Z")).toBe("2026-11-15T12:00");
    expect(fromManilaInput("2026-11-15T12:00")).toBe("2026-11-15T04:00:00.000Z");
    expect(formatDate("2026-11-15T17:00:00.000Z")).toContain("16");
  });
});
