/**
 * Platform Admin (ChowLane owner) logic — Milestone 1.7. Pure functions only (BL-10, D-026…D-028).
 */
import type {
  BillingModel,
  BillingStatement,
  BillingStatementStatus,
  Centavos,
  Customer,
  ID,
  Order,
  Rider,
  TenantBilling,
} from "@chowlane/types";
import { computeBillingAmount } from "./billing";
import { formatPeso } from "./money";

const MANILA_OFFSET_MS = 8 * 3_600_000; // Asia/Manila is UTC+8, no DST

// ------------------------------------------------------------------ Manila calendar ranges
export type PeriodRange = { start: string; end: string };

/** Calendar month (Asia/Manila) containing `iso`. `end` is the last millisecond-second of the month, like statements. */
export function manilaMonthRange(iso: string): PeriodRange {
  const local = new Date(Date.parse(iso) + MANILA_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const start = Date.UTC(y, m, 1) - MANILA_OFFSET_MS;
  const next = Date.UTC(y, m + 1, 1) - MANILA_OFFSET_MS;
  return { start: new Date(start).toISOString(), end: new Date(next - 1000).toISOString() };
}

/** Calendar day (Asia/Manila) containing `iso`. */
export function manilaDayRange(iso: string): PeriodRange {
  const local = new Date(Date.parse(iso) + MANILA_OFFSET_MS);
  const start =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - MANILA_OFFSET_MS;
  return {
    start: new Date(start).toISOString(),
    end: new Date(start + 86_400_000 - 1000).toISOString(),
  };
}

/** Previous Manila calendar month. */
export function previousManilaMonth(iso: string): PeriodRange {
  return manilaMonthRange(new Date(Date.parse(manilaMonthRange(iso).start) - 1000).toISOString());
}

export function inRange(iso: string, r: PeriodRange): boolean {
  const t = Date.parse(iso);
  return t >= Date.parse(r.start) && t <= Date.parse(r.end);
}

/** "November 2026" (Asia/Manila). */
export function formatMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

// ------------------------------------------------------------------ tenant stats (PLT-002, PLT-004)
export type TenantStats = {
  ordersTotal: number;
  ordersToday: number;
  ordersThisMonth: number;
  deliveredThisMonth: number;
  delivered: number;
  cancelled: number;
  rejected: number;
  active: number;
  /** Sum of delivery fees of delivered orders (what the tenant charged for delivery). */
  deliveryFeeRevenue: Centavos;
  /** Customers with at least one order this month. */
  activeCustomers: number;
  customers: number;
  ridersOnShift: number;
  riders: number;
};

const ACTIVE_STATUSES = ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"];

export function tenantStats(
  input: { orders: Order[]; customers: Customer[]; riders: Rider[] },
  now: string,
): TenantStats {
  const month = manilaMonthRange(now);
  const day = manilaDayRange(now);
  const { orders, customers, riders } = input;
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const thisMonth = orders.filter((o) => inRange(o.createdAt, month));
  return {
    ordersTotal: orders.length,
    ordersToday: orders.filter((o) => inRange(o.createdAt, day)).length,
    ordersThisMonth: thisMonth.length,
    deliveredThisMonth: thisMonth.filter((o) => o.status === "DELIVERED").length,
    delivered: delivered.length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    rejected: orders.filter((o) => o.status === "REJECTED").length,
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    deliveryFeeRevenue: delivered.reduce((s, o) => s + o.deliveryFee, 0),
    activeCustomers: new Set(thisMonth.map((o) => o.customerId)).size,
    customers: customers.length,
    ridersOnShift: riders.filter((r) => r.status === "ACTIVE" && r.isOnShift).length,
    riders: riders.filter((r) => r.status === "ACTIVE").length,
  };
}

// ------------------------------------------------------------------ billing (BL-10.4 … BL-10.9)
export const BILLING_MODEL_LABELS: Record<BillingModel, string> = {
  FREE: "Free",
  MONTHLY: "Monthly",
  PER_ORDER: "Per order",
  MONTHLY_PLUS_PER_ORDER: "Monthly + per order",
};

export const STATEMENT_STATUS_LABELS: Record<BillingStatementStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  WAIVED: "Waived",
};

/** One-line plan description, e.g. "₱999.00 / month + ₱5.00 per order". */
export function describeBilling(
  b: Pick<TenantBilling, "model" | "monthlyFee" | "perOrderFee">,
): string {
  const monthly = `${formatPeso(b.monthlyFee ?? 0)} / month`;
  const perOrder = `${formatPeso(b.perOrderFee ?? 0)} per delivered order`;
  switch (b.model) {
    case "FREE":
      return "Free";
    case "MONTHLY":
      return monthly;
    case "PER_ORDER":
      return perOrder;
    case "MONTHLY_PLUS_PER_ORDER":
      return `${monthly} + ${perOrder}`;
  }
}

export type BillingDraft = Pick<
  TenantBilling,
  "model" | "monthlyFee" | "perOrderFee" | "trialEndsAt"
>;
export type BillingDraftErrors = Partial<Record<"monthlyFee" | "perOrderFee", string>>;

/** Validate a billing config form (PLT-007). */
export function checkBillingDraft(d: BillingDraft): BillingDraftErrors {
  const e: BillingDraftErrors = {};
  const needsMonthly = d.model === "MONTHLY" || d.model === "MONTHLY_PLUS_PER_ORDER";
  const needsPerOrder = d.model === "PER_ORDER" || d.model === "MONTHLY_PLUS_PER_ORDER";
  if (needsMonthly && !(d.monthlyFee && d.monthlyFee > 0)) e.monthlyFee = "Enter the monthly fee.";
  if (needsPerOrder && !(d.perOrderFee && d.perOrderFee > 0))
    e.perOrderFee = "Enter the fee per delivered order.";
  return e;
}

/** Keep only the fields the model uses. */
export function normalizeBilling(d: BillingDraft): BillingDraft {
  const needsMonthly = d.model === "MONTHLY" || d.model === "MONTHLY_PLUS_PER_ORDER";
  const needsPerOrder = d.model === "PER_ORDER" || d.model === "MONTHLY_PLUS_PER_ORDER";
  return {
    model: d.model,
    monthlyFee: needsMonthly ? d.monthlyFee : undefined,
    perOrderFee: needsPerOrder ? d.perOrderFee : undefined,
    trialEndsAt: d.model === "FREE" ? undefined : d.trialEndsAt,
  };
}

/** Delivered orders of one tenant inside a period (BL-10.9: only DELIVERED counts). */
export function deliveredInPeriod(orders: Order[], period: PeriodRange): number {
  return orders.filter((o) => o.status === "DELIVERED" && inRange(o.createdAt, period)).length;
}

/**
 * Build the statement for one tenant and one Manila calendar month (BL-10.5).
 * A ₱0 statement (free plan / trial) is created as WAIVED so it never shows as unpaid.
 */
export function generateStatement(args: {
  id: ID;
  tenantId: ID;
  billing: TenantBilling;
  orders: Order[];
  period: PeriodRange;
  now: string;
}): BillingStatement {
  const { id, tenantId, billing, orders, period, now } = args;
  const deliveredOrders = deliveredInPeriod(orders, period);
  const amountDue = computeBillingAmount(billing, deliveredOrders, period.start);
  return {
    id,
    tenantId,
    periodStart: period.start,
    periodEnd: period.end,
    model: billing.model,
    deliveredOrders,
    amountDue,
    status: amountDue === 0 ? "WAIVED" : "UNPAID",
    note: amountDue === 0 ? (billing.model === "FREE" ? "Free plan" : "Free trial") : undefined,
    createdAt: now,
  };
}

/** A statement already exists for this tenant + month (times compared as instants: the database writes +00:00). */
export function hasStatementFor(
  statements: BillingStatement[],
  tenantId: ID,
  period: PeriodRange,
): boolean {
  return statements.some(
    (s) => s.tenantId === tenantId && Date.parse(s.periodStart) === Date.parse(period.start),
  );
}

export type StatementTotals = {
  due: Centavos;
  paid: Centavos;
  unpaid: Centavos;
  waived: Centavos;
  unpaidCount: number;
};

export function statementTotals(statements: BillingStatement[]): StatementTotals {
  const sum = (st: BillingStatementStatus) =>
    statements.filter((s) => s.status === st).reduce((a, s) => a + s.amountDue, 0);
  return {
    due: statements.filter((s) => s.status !== "WAIVED").reduce((a, s) => a + s.amountDue, 0),
    paid: sum("PAID"),
    unpaid: sum("UNPAID"),
    waived: sum("WAIVED"),
    unpaidCount: statements.filter((s) => s.status === "UNPAID").length,
  };
}

/** True while the tenant's free trial runs. */
export function isOnTrial(billing: TenantBilling, now: string): boolean {
  return Boolean(billing.trialEndsAt && Date.parse(now) < Date.parse(billing.trialEndsAt));
}
