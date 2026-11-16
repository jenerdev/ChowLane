"use client";

import { useParams } from "next/navigation";
import type { RiderPayRule } from "@chowlane/types";
import { effectiveRiderPayRule, offerFor, riderPayRuleLabel } from "@chowlane/lib";
import { useRiderIdentity } from "./identity";
import { useMockStore } from "./store";

/**
 * Everything a rider screen needs. The signed-in rider comes from Supabase (mobile number + password, Q-30);
 * screens still read tenant, settings, orders and shifts from the mock store until Milestone 2.6, so `me` is the
 * mock rider with the same mobile number. `live` is the rider as stored in Supabase.
 */
export function useRider() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const db = useMockStore();
  const auth = useRiderIdentity();
  const live = auth.identity?.rider;
  const tenant = db.tenants.find((t) => t.slug === slug)!;
  const settings = db.tenantSettings.find((s) => s.tenantId === tenant?.id)!;
  const me =
    live?.status === "ACTIVE"
      ? db.riders.find((r) => r.tenantId === tenant?.id && r.phone === live.phone)
      : undefined;
  const session = { ready: auth.ready, staffId: me?.id ?? null, signOut: auth.signOut };
  const rule = effectiveRiderPayRule(settings?.riderPay, me?.payOverride);
  const offer = me ? offerFor(db.orders, me.id) : undefined;
  const active = me?.activeOrderId ? db.orders.find((o) => o.id === me.activeOrderId) : undefined;
  const shift = me?.currentShiftId ? db.shifts.find((s) => s.id === me.currentShiftId) : undefined;
  return {
    slug,
    base: `/${slug}`,
    db,
    tenant,
    settings,
    me,
    live,
    hasMockData: Boolean(tenant),
    rule,
    offer,
    active,
    shift,
    session,
  };
}

export { useNow, useTicker } from "@chowlane/ui";
export { newId } from "@chowlane/mocks/store";

/** How this rider is paid, e.g. "₱500 per day" (lib). */
export function payRuleLabel(rule: RiderPayRule | undefined): string {
  return rule ? riderPayRuleLabel(rule) : "not set yet — ask your admin";
}
