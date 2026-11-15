"use client";

import { useState } from "react";
import type { BillingModel, BillingStatement, Centavos } from "@chowlane/types";
import {
  BILLING_MODEL_LABELS,
  checkBillingDraft,
  computeBillingAmount,
  deliveredInPeriod,
  describeBilling,
  formatMonth,
  formatPeso,
  fromManilaInput,
  generateStatement,
  hasStatementFor,
  manilaMonthRange,
  normalizeBilling,
  toManilaInput,
} from "@chowlane/lib";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FormSection,
  Input,
  MoneyInput,
  RadioCards,
  toast,
} from "@chowlane/ui";
import { NoteSheet } from "@/components/note-sheet";
import { StatementStatusBadge } from "@/components/statement-status-badge";
import { useMockStore } from "@/lib/store";
import { newId } from "@/lib/use-platform";
import { useTenantRecords } from "@/lib/use-tenant";

/** S-509 — billing config + statements for one tenant (PLT-007, PLT-008, BL-10.4…10.9). */
export default function TenantBillingPage() {
  const r = useTenantRecords();
  const setTenantRow = useMockStore((s) => s.setTenantRow);
  const insert = useMockStore((s) => s.insert);
  const patch = useMockStore((s) => s.patch);
  const [model, setModel] = useState<BillingModel>(r.billing?.model ?? "FREE");
  const [monthlyFee, setMonthlyFee] = useState<Centavos | undefined>(r.billing?.monthlyFee);
  const [perOrderFee, setPerOrderFee] = useState<Centavos | undefined>(r.billing?.perOrderFee);
  const [trialEndsAt, setTrialEndsAt] = useState<string | undefined>(r.billing?.trialEndsAt);
  const [showErrors, setShowErrors] = useState(false);
  const [paying, setPaying] = useState<BillingStatement | null>(null);
  const [waiving, setWaiving] = useState<BillingStatement | null>(null);
  if (!r.tenant || !r.me) return null;
  const t = r.tenant;

  const draft = { model, monthlyFee, perOrderFee, trialEndsAt };
  const errors = checkBillingDraft(draft);
  const month = manilaMonthRange(r.now);
  const deliveredThisMonth = deliveredInPeriod(r.orders, month);
  const current = r.billing;
  const preview = current ? computeBillingAmount(current, deliveredThisMonth, month.start) : 0;
  const generated = hasStatementFor(r.statements, t.id, month);
  const needsMonthly = model === "MONTHLY" || model === "MONTHLY_PLUS_PER_ORDER";
  const needsPerOrder = model === "PER_ORDER" || model === "MONTHLY_PLUS_PER_ORDER";

  function save() {
    setShowErrors(true);
    if (Object.keys(errors).length) return;
    setTenantRow("tenantBilling", {
      tenantId: t.id,
      ...normalizeBilling(draft),
      effectiveFrom: r.now,
      updatedBy: r.me!.id,
    });
    toast("Billing saved");
  }

  return (
    <>
      <FormSection
        title="Plan"
        description="How ChowLane charges this business. Changes apply from now; existing statements stay as they are."
      >
        <RadioCards<BillingModel>
          name="billing-model"
          columns={2}
          value={model}
          onChange={setModel}
          options={[
            { value: "FREE", label: BILLING_MODEL_LABELS.FREE, description: "No charge." },
            {
              value: "MONTHLY",
              label: BILLING_MODEL_LABELS.MONTHLY,
              description: "A fixed fee every month.",
            },
            {
              value: "PER_ORDER",
              label: BILLING_MODEL_LABELS.PER_ORDER,
              description: "A fee for each delivered order.",
            },
            {
              value: "MONTHLY_PLUS_PER_ORDER",
              label: BILLING_MODEL_LABELS.MONTHLY_PLUS_PER_ORDER,
              description: "Both.",
            },
          ]}
        />
        {needsMonthly || needsPerOrder ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {needsMonthly ? (
              <Field
                label="Monthly fee"
                htmlFor="b-monthly"
                error={showErrors ? errors.monthlyFee : undefined}
              >
                <MoneyInput
                  id="b-monthly"
                  value={monthlyFee}
                  onChange={setMonthlyFee}
                  aria-invalid={Boolean(showErrors && errors.monthlyFee)}
                />
              </Field>
            ) : null}
            {needsPerOrder ? (
              <Field
                label="Per delivered order"
                htmlFor="b-per"
                error={showErrors ? errors.perOrderFee : undefined}
              >
                <MoneyInput
                  id="b-per"
                  value={perOrderFee}
                  onChange={setPerOrderFee}
                  aria-invalid={Boolean(showErrors && errors.perOrderFee)}
                />
              </Field>
            ) : null}
          </div>
        ) : null}
        {model !== "FREE" ? (
          <Field
            label="Free trial until"
            htmlFor="b-trial"
            hint="Optional — statements are ₱0 for months that start before this date."
          >
            <div className="flex items-center gap-2">
              <Input
                id="b-trial"
                type="datetime-local"
                value={trialEndsAt ? toManilaInput(trialEndsAt) : ""}
                onChange={(e) =>
                  setTrialEndsAt(e.target.value ? fromManilaInput(e.target.value) : undefined)
                }
                className="sm:max-w-64"
              />
              {trialEndsAt ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrialEndsAt(undefined)}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </Field>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground">
            Current: {current ? describeBilling(current) : "no plan set"}
          </p>
          <Button onClick={save}>Save plan</Button>
        </div>
      </FormSection>

      <Card className="mt-2">
        <CardHeader>
          <CardTitle>{formatMonth(r.now)}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            {deliveredThisMonth} delivered orders so far ·{" "}
            <span className="font-medium tabular-nums">{formatPeso(preview)}</span> on the current
            plan
          </p>
          <Button
            variant="outline"
            disabled={generated || !current}
            title={generated ? "Already generated for this month" : undefined}
            onClick={() => {
              if (!current) return;
              insert(
                "billingStatements",
                generateStatement({
                  id: newId("bs"),
                  tenantId: t.id,
                  billing: current,
                  orders: r.orders,
                  period: month,
                  now: r.now,
                }),
              );
              toast(`Statement for ${formatMonth(r.now)} created`);
            }}
          >
            {generated ? "Statement created" : "Create statement"}
          </Button>
        </CardContent>
      </Card>

      <h2 className="mt-8 mb-2 text-[13px] font-medium text-muted-foreground">Statements</h2>
      {r.statements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No statements yet.</p>
      ) : (
        <ul className="divide-y rounded-card border">
          {r.statements.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {formatMonth(s.periodStart)} <StatementStatusBadge status={s.status} />
                </span>
                <span className="block truncate text-[13px] text-muted-foreground">
                  {BILLING_MODEL_LABELS[s.model]} · {s.deliveredOrders} delivered orders
                  {s.note ? ` · ${s.note}` : ""}
                </span>
              </span>
              <span className="text-sm tabular-nums">{formatPeso(s.amountDue)}</span>
              {s.status === "UNPAID" ? (
                <span className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setWaiving(s)}>
                    Waive
                  </Button>
                  <Button size="sm" onClick={() => setPaying(s)}>
                    Mark as paid
                  </Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <NoteSheet
        open={paying !== null}
        onOpenChange={(o) => !o && setPaying(null)}
        title={paying ? `Mark ${formatMonth(paying.periodStart)} as paid?` : ""}
        description={
          paying
            ? `${formatPeso(paying.amountDue)} — payment is collected outside the app.`
            : undefined
        }
        label="Payment note"
        hint="Optional, e.g. “GCash ref 4021”"
        confirmLabel="Mark as paid"
        onSubmit={(note) => {
          if (!paying) return;
          patch("billingStatements", paying.id, {
            status: "PAID",
            paidAt: new Date().toISOString(),
            note: note || paying.note,
          });
          toast("Marked as paid");
        }}
      />
      <NoteSheet
        open={waiving !== null}
        onOpenChange={(o) => !o && setWaiving(null)}
        title={waiving ? `Waive ${formatMonth(waiving.periodStart)}?` : ""}
        description="The business won't owe this amount."
        label="Reason"
        required
        confirmLabel="Waive statement"
        destructive
        onSubmit={(note) => {
          if (!waiving) return;
          patch("billingStatements", waiving.id, { status: "WAIVED", note });
          toast("Statement waived");
        }}
      />
    </>
  );
}
