"use client";

import { useParams } from "next/navigation";
import type { RiderPayRule } from "@chowlane/types";
import { effectiveRiderPayRule, offerFor, riderPayRuleLabel } from "@chowlane/lib";
import { useRiderIdentity } from "./identity";
import { useRiderData } from "./rider-data";

/**
 * Everything a rider screen needs, from Supabase (2.6). `db` holds the rider's own records (orders incl. the open
 * offer, shifts, merchants, the customer of a live delivery); `me` is the rider as stored now; `live` the row the
 * login resolved (used to decide whether they may use the app at all).
 */
export function useRider() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const auth = useRiderIdentity();
  const { data, reload } = useRiderData();
  const live = auth.identity?.rider;
  const me = live?.status === "ACTIVE" ? data?.me : undefined;
  const db = {
    orders: data?.orders ?? [],
    merchants: data?.merchants ?? [],
    shifts: data?.shifts ?? [],
    customers: data?.customers ?? [],
  };
  const settings = data?.settings;
  const rule = effectiveRiderPayRule(settings?.riderPay, me?.payOverride);
  const offer = me ? offerFor(db.orders, me.id) : undefined;
  const active = me?.activeOrderId ? db.orders.find((o) => o.id === me.activeOrderId) : undefined;
  const shift = me?.currentShiftId ? db.shifts.find((s) => s.id === me.currentShiftId) : undefined;
  const session = { ready: auth.ready, signOut: auth.signOut };
  return {
    slug,
    base: `/${slug}`,
    db,
    /** The business's public branding (name, logo, color). */
    tenant: auth.tenant,
    settings,
    me,
    live,
    loaded: Boolean(data),
    rule,
    offer,
    active,
    shift,
    session,
    supabase: auth.supabase,
    reload,
  };
}

export { useNow, useTicker } from "@chowlane/ui";

/** How this rider is paid, e.g. "₱500 per day" (lib). */
export function payRuleLabel(rule: RiderPayRule | undefined): string {
  return rule ? riderPayRuleLabel(rule) : "not set yet — ask your admin";
}
