"use client";

import { useParams } from "next/navigation";
import type { RiderPayRule } from "@chowlane/types";
import { effectiveRiderPayRule, formatPeso, offerFor } from "@chowlane/lib";
import { useSession } from "@chowlane/mocks/react";
import { useMockStore } from "./store";

/**
 * Everything a rider screen needs: tenant + settings (live from the mock store), the signed-in rider,
 * their effective pay rule, current offer, active order and open shift. Phase 2: Supabase session + queries.
 */
export function useRider() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const db = useMockStore();
  const session = useSession(`rider:${slug}`);
  const tenant = db.tenants.find((t) => t.slug === slug)!;
  const settings = db.tenantSettings.find((s) => s.tenantId === tenant.id)!;
  const me = db.riders.find((r) => r.id === session.staffId && r.tenantId === tenant.id);
  const rule = effectiveRiderPayRule(settings.riderPay, me?.payOverride);
  const offer = me ? offerFor(db.orders, me.id) : undefined;
  const active = me?.activeOrderId ? db.orders.find((o) => o.id === me.activeOrderId) : undefined;
  const shift = me?.currentShiftId ? db.shifts.find((s) => s.id === me.currentShiftId) : undefined;
  return { slug, base: `/${slug}`, db, tenant, settings, me, rule, offer, active, shift, session };
}

export { useNow, useTicker } from "@chowlane/ui";
export { newId } from "@chowlane/mocks/store";

/** "₱500 per day", "80% of the delivery fee", "₱40 per delivery". */
export function payRuleLabel(rule: RiderPayRule): string {
  if (rule.mode === "DAILY") return `${formatPeso(rule.dailyRate)} per day`;
  if (rule.mode === "COMMISSION") return `${rule.percent}% of the delivery fee`;
  return `${formatPeso(rule.ratePerDelivery)} per delivery`;
}
