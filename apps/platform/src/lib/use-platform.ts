"use client";

import { useCallback, useState } from "react";
import type { BillingModel, TenantStatus } from "@chowlane/types";
import { toast } from "@chowlane/ui";
import { usePlatformIdentity } from "./identity";
import { usePlatformData } from "./platform-data";

/**
 * Everything a platform screen needs: the signed-in platform admin, every tenant's records from Supabase (`db`,
 * 2.7), and `ops` — the only changes a platform admin makes (status, billing, statements), each one Postgres function
 * that checks the platform admin itself. `now` is captured once per screen (keeps render pure).
 */
export function usePlatform() {
  const auth = usePlatformIdentity();
  const data = usePlatformData();
  const live = auth.identity?.admin;
  const me = live?.status === "ACTIVE" ? live : undefined;
  const [now] = useState(() => new Date().toISOString());
  const { supabase } = auth;
  const { reload } = data;

  const run = useCallback(
    async (fn: () => PromiseLike<{ error: { message: string } | null }>, message: string) => {
      const { error } = await fn();
      await reload();
      if (error) {
        toast(error.message, "error");
        return false;
      }
      toast(message);
      return true;
    },
    [reload],
  );

  const ops = {
    /** Suspend (reason required) / reactivate — PLT-009, BL-10.8. */
    setStatus: (tenantId: string, status: TenantStatus, reason: string | undefined, msg: string) =>
      run(
        () =>
          supabase.rpc("set_tenant_status", {
            p_tenant: tenantId,
            p_status: status,
            p_reason: reason,
          }),
        msg,
      ),
    /** Billing plan from now on — PLT-007, BL-10.13. */
    setBilling: (
      tenantId: string,
      b: { model: BillingModel; monthlyFee?: number; perOrderFee?: number; trialEndsAt?: string },
    ) =>
      run(
        () =>
          supabase.rpc("set_tenant_billing", {
            p_tenant: tenantId,
            p_model: b.model,
            p_monthly_fee: b.monthlyFee,
            p_per_order_fee: b.perOrderFee,
            p_trial_ends_at: b.trialEndsAt,
          }),
        "Billing saved",
      ),
    /** This month's statement — PLT-008, BL-10.10. */
    generateStatement: (tenantId: string, msg: string) =>
      run(() => supabase.rpc("generate_billing_statement", { p_tenant: tenantId }), msg),
    /** PAID (optional note) / WAIVED (reason) — BL-10.12. */
    settleStatement: (
      id: string,
      status: "PAID" | "WAIVED",
      note: string | undefined,
      msg: string,
    ) =>
      run(
        () => supabase.rpc("settle_statement", { p_statement: id, p_status: status, p_note: note }),
        msg,
      ),
  };

  return {
    db: data.db,
    loaded: data.loaded,
    me,
    now,
    ready: auth.ready,
    signOut: auth.signOut,
    ops,
  };
}
