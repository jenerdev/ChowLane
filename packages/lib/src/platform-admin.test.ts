import { describe, expect, it } from "vitest";
import type { BillingStatement, Order, TenantBilling } from "@chowlane/types";
import {
  checkBillingDraft,
  describeBilling,
  generateStatement,
  hasStatementFor,
  isOnTrial,
  manilaDayRange,
  manilaMonthRange,
  normalizeBilling,
  previousManilaMonth,
  statementTotals,
  tenantStats,
} from "./index";

const order = (id: string, createdAt: string, status: Order["status"], deliveryFee = 5000): Order =>
  ({ id, tenantId: "t", customerId: `c-${id}`, status, createdAt, deliveryFee }) as Order;

describe("Manila calendar ranges", () => {
  it("uses Asia/Manila month and day boundaries", () => {
    expect(manilaMonthRange("2026-11-15T04:00:00.000Z")).toEqual({
      start: "2026-10-31T16:00:00.000Z",
      end: "2026-11-30T15:59:59.000Z",
    });
    // 2026-10-31 17:00 UTC is already Nov 1 in Manila
    expect(manilaMonthRange("2026-10-31T17:00:00.000Z").start).toBe("2026-10-31T16:00:00.000Z");
    expect(previousManilaMonth("2026-11-15T04:00:00.000Z")).toEqual({
      start: "2026-09-30T16:00:00.000Z",
      end: "2026-10-31T15:59:59.000Z",
    });
    expect(manilaDayRange("2026-11-15T17:00:00.000Z").start).toBe("2026-11-15T16:00:00.000Z");
  });
});

describe("tenant stats", () => {
  it("aggregates orders, customers and riders", () => {
    const now = "2026-11-15T04:00:00.000Z";
    const s = tenantStats(
      {
        orders: [
          order("1", "2026-11-15T02:00:00Z", "DELIVERED", 6000),
          order("2", "2026-11-10T02:00:00Z", "CANCELLED"),
          order("3", "2026-10-20T02:00:00Z", "DELIVERED", 4000),
          order("4", "2026-11-15T03:00:00Z", "ASSIGNED"),
        ],
        customers: [],
        riders: [
          { status: "ACTIVE", isOnShift: true },
          { status: "ACTIVE", isOnShift: false },
          { status: "INACTIVE", isOnShift: false },
        ] as never,
      },
      now,
    );
    expect(s).toMatchObject({
      ordersTotal: 4,
      ordersToday: 2,
      ordersThisMonth: 3,
      deliveredThisMonth: 1,
      delivered: 2,
      cancelled: 1,
      active: 1,
      deliveryFeeRevenue: 10000,
      activeCustomers: 3,
      ridersOnShift: 1,
      riders: 2,
    });
  });
});

describe("billing", () => {
  const base: TenantBilling = {
    tenantId: "t",
    model: "MONTHLY_PLUS_PER_ORDER",
    monthlyFee: 99900,
    perOrderFee: 500,
    effectiveFrom: "",
    updatedBy: "p",
  };

  it("validates and normalizes drafts", () => {
    expect(checkBillingDraft({ model: "FREE" })).toEqual({});
    expect(checkBillingDraft({ model: "MONTHLY" }).monthlyFee).toBeDefined();
    expect(checkBillingDraft({ model: "MONTHLY_PLUS_PER_ORDER", monthlyFee: 100 })).toEqual({
      perOrderFee: "Enter the fee per delivered order.",
    });
    expect(
      normalizeBilling({ model: "PER_ORDER", monthlyFee: 100, perOrderFee: 500, trialEndsAt: "x" }),
    ).toEqual({
      model: "PER_ORDER",
      monthlyFee: undefined,
      perOrderFee: 500,
      trialEndsAt: "x",
    });
    expect(describeBilling(base)).toBe("₱999.00 / month + ₱5.00 per delivered order");
  });

  it("generates a statement from delivered orders in the Manila month", () => {
    const period = manilaMonthRange("2026-11-15T04:00:00.000Z");
    const orders = [
      order("1", "2026-11-02T02:00:00Z", "DELIVERED"),
      order("2", "2026-11-03T02:00:00Z", "DELIVERED"),
      order("3", "2026-11-03T02:00:00Z", "CANCELLED"),
      order("4", "2026-10-31T15:00:00Z", "DELIVERED"), // Oct 31 23:00 Manila
    ];
    const st = generateStatement({
      id: "s1",
      tenantId: "t",
      billing: base,
      orders,
      period,
      now: "2026-11-30T16:00:00Z",
    });
    expect(st).toMatchObject({
      deliveredOrders: 2,
      amountDue: 100900,
      status: "UNPAID",
      periodStart: period.start,
    });
    const free = generateStatement({
      id: "s2",
      tenantId: "t",
      billing: { ...base, model: "FREE" },
      orders,
      period,
      now: "",
    });
    expect(free).toMatchObject({ amountDue: 0, status: "WAIVED", note: "Free plan" });
    const trial = generateStatement({
      id: "s3",
      tenantId: "t",
      billing: { ...base, trialEndsAt: "2026-12-01T00:00:00Z" },
      orders,
      period,
      now: "",
    });
    expect(trial).toMatchObject({ amountDue: 0, status: "WAIVED", note: "Free trial" });
    expect(hasStatementFor([st], "t", period)).toBe(true);
    expect(
      isOnTrial({ ...base, trialEndsAt: "2026-12-01T00:00:00Z" }, "2026-11-15T00:00:00Z"),
    ).toBe(true);
  });

  it("totals statements", () => {
    const s = (amountDue: number, status: BillingStatement["status"]) =>
      ({ amountDue, status }) as BillingStatement;
    expect(
      statementTotals([s(100, "PAID"), s(200, "UNPAID"), s(300, "UNPAID"), s(0, "WAIVED")]),
    ).toEqual({
      due: 600,
      paid: 100,
      unpaid: 500,
      waived: 0,
      unpaidCount: 2,
    });
  });
});
