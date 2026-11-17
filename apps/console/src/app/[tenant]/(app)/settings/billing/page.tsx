"use client";

import { ReceiptText } from "lucide-react";
import {
  computeBillingAmount,
  describeBilling,
  formatDate,
  formatMonth,
  formatPeso,
  isOnTrial,
  manilaMonthRange,
  STATEMENT_STATUS_LABELS,
} from "@chowlane/lib";
import { toBillingStatement, toTenantBilling } from "@chowlane/db/mappers";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  FormSection,
  PageHeader,
  useNow,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-123 — the tenant's ChowLane plan and monthly statements, read-only (OWN-016, BL-10.6). */
export default function BillingSettingsPage() {
  return (
    <RequirePermission perm="owner">
      <Billing />
    </RequirePermission>
  );
}

function Billing() {
  const { live, base } = useConsole();
  const now = new Date(useNow()).toISOString();
  const month = manilaMonthRange(now);
  const data = useLive(`billing:${live.id}:${month.start}`, async (sb) => {
    const [billing, statements, delivered] = await Promise.all([
      sb.from("tenant_billing").select("*").eq("tenant_id", live.id).maybeSingle(),
      sb
        .from("billing_statements")
        .select("*")
        .eq("tenant_id", live.id)
        .order("period_start", { ascending: false }),
      // BL-10.5: delivered orders in this Manila month (same bounds as deliveredInPeriod)
      sb
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", live.id)
        .eq("status", "DELIVERED")
        .gte("created_at", month.start)
        .lte("created_at", month.end),
    ]);
    if (delivered.error) throw new Error(delivered.error.message);
    const b = must(billing);
    return {
      billing: b ? toTenantBilling(b) : undefined,
      statements: must(statements).map(toBillingStatement),
      delivered: delivered.count ?? 0,
    };
  });
  if (data.loading) return null;
  const { billing, statements = [], delivered = 0 } = data.data ?? {};

  return (
    <>
      <PageHeader
        back={{ href: `${base}/settings`, label: "Settings" }}
        title="Plan & billing"
        description="How ChowLane charges your business."
      />
      <FormSection title="Your plan" description="To change your plan, contact ChowLane.">
        {billing ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-5 text-sm">
              <p className="text-[15px] font-semibold">{describeBilling(billing)}</p>
              {isOnTrial(billing, now) ? (
                <p className="text-muted-foreground">
                  Free trial until {formatDate(billing.trialEndsAt!)}.
                </p>
              ) : null}
              <p className="text-muted-foreground">Since {formatDate(billing.effectiveFrom)}.</p>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">Free — no plan set yet.</p>
        )}
        {billing ? (
          <p className="rounded-control bg-subtle px-4 py-3 text-sm">
            {formatMonth(now)} so far: {delivered} delivered orders ·{" "}
            <span className="font-medium">
              {formatPeso(computeBillingAmount(billing, delivered, month.start))}
            </span>{" "}
            estimated
          </p>
        ) : null}
      </FormSection>
      <FormSection
        title="Statements"
        description="Pay through the channel ChowLane gave you; they mark it paid here."
      >
        {statements.length === 0 ? (
          <EmptyState icon={<ReceiptText />} title="No statements yet" className="py-8" />
        ) : (
          <ul className="divide-y rounded-card border">
            {statements.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{formatMonth(s.periodStart)}</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {s.deliveredOrders} delivered orders
                    {s.paidAt ? ` · paid ${formatDate(s.paidAt)}` : ""}
                  </span>
                </span>
                <Badge
                  tone={
                    s.status === "PAID" ? "success" : s.status === "UNPAID" ? "warning" : "neutral"
                  }
                >
                  {STATEMENT_STATUS_LABELS[s.status]}
                </Badge>
                <span className="tabular-nums">{formatPeso(s.amountDue)}</span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </>
  );
}
