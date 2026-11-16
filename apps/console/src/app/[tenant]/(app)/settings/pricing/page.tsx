"use client";

import { useState } from "react";
import Link from "next/link";
import type { Centavos, DeliveryFeeMode, DeliveryFeeRule } from "@chowlane/types";
import { computeDeliveryFee, formatPeso } from "@chowlane/lib";
import {
  Button,
  Field,
  FormSection,
  MoneyInput,
  NumberInput,
  PageHeader,
  RadioCards,
  SaveBar,
  Switch,
  SwitchRow,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { useConsole } from "@/lib/use-console";

/** S-116 — delivery fee mode + order rules (OWN-005, OWN-011, OWN-013, BL-7.2). */
export default function PricingSettings() {
  return (
    <RequirePermission perm="settings.pricing">
      <Pricing />
    </RequirePermission>
  );
}

type PerKm = { baseFee?: Centavos; ratePerKm?: Centavos; includedKm?: number; minFee?: Centavos };

function Pricing() {
  const { settings, db, tenant, base } = useConsole();
  const setTenantRow = useMockStore((s) => s.setTenantRow);
  const fee = settings.deliveryFee;
  // A new business has no fee yet (D-061): the form starts on per km with example values.
  const [mode, setMode] = useState<DeliveryFeeMode>(fee?.mode ?? "PER_KM");
  const [perKm, setPerKm] = useState<PerKm>(
    fee?.mode === "PER_KM" ? fee : { baseFee: 4900, ratePerKm: 1000, includedKm: 2, minFee: 4900 },
  );
  const [fixed, setFixed] = useState<Centavos | undefined>(
    fee?.mode === "FIXED" ? fee.amount : 5000,
  );
  const [maxOrder, setMaxOrder] = useState<Centavos | undefined>(settings.maxOrderSubtotal);
  const [autoApprove, setAutoApprove] = useState(settings.autoApproveVerifiedCustomers);
  const [km, setKm] = useState<number | undefined>(4);
  const barangays = db.barangayFees.filter((b) => b.tenantId === tenant.id && b.isActive).length;

  const rule: DeliveryFeeRule | null =
    mode === "FIXED"
      ? fixed
        ? { mode, amount: fixed }
        : null
      : mode === "PER_KM"
        ? perKm.baseFee !== undefined &&
          perKm.ratePerKm !== undefined &&
          perKm.includedKm !== undefined &&
          perKm.minFee !== undefined
          ? {
              mode,
              baseFee: perKm.baseFee,
              ratePerKm: perKm.ratePerKm,
              includedKm: perKm.includedKm,
              minFee: perKm.minFee,
            }
          : null
        : { mode };
  const preview =
    rule && rule.mode !== "PER_BARANGAY" ? computeDeliveryFee({ rule, distanceKm: km ?? 0 }) : null;
  const canSave = Boolean(rule) && Boolean(maxOrder && maxOrder > 0);

  return (
    <>
      <PageHeader
        back={{ href: `${base}/settings`, label: "Settings" }}
        title="Delivery fee & order rules"
      />
      <FormSection
        title="Delivery fee"
        description="What customers pay for delivery. Changes apply to new orders only. Fees are rounded up to the peso."
      >
        <RadioCards<DeliveryFeeMode>
          name="fee-mode"
          value={mode}
          onChange={setMode}
          options={[
            {
              value: "PER_KM",
              label: "Per kilometer",
              description: "Based on the distance from the store to the customer.",
            },
            { value: "FIXED", label: "Fixed", description: "The same fee for every order." },
            {
              value: "PER_BARANGAY",
              label: "Per barangay",
              description: "Set a price for each barangay you serve.",
            },
          ]}
        />
        {mode === "PER_KM" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Base fee" htmlFor="f-base">
              <MoneyInput
                id="f-base"
                value={perKm.baseFee}
                onChange={(v) => setPerKm({ ...perKm, baseFee: v })}
              />
            </Field>
            <Field label="Included distance" htmlFor="f-incl" hint="Covered by the base fee">
              <NumberInput
                id="f-incl"
                value={perKm.includedKm}
                onChange={(v) => setPerKm({ ...perKm, includedKm: v })}
                suffix="km"
                min={0}
                step={0.5}
              />
            </Field>
            <Field label="Per extra km" htmlFor="f-rate">
              <MoneyInput
                id="f-rate"
                value={perKm.ratePerKm}
                onChange={(v) => setPerKm({ ...perKm, ratePerKm: v })}
              />
            </Field>
            <Field label="Minimum fee" htmlFor="f-min">
              <MoneyInput
                id="f-min"
                value={perKm.minFee}
                onChange={(v) => setPerKm({ ...perKm, minFee: v })}
              />
            </Field>
          </div>
        ) : null}
        {mode === "FIXED" ? (
          <Field label="Fee per order" htmlFor="f-fixed">
            <MoneyInput id="f-fixed" value={fixed} onChange={setFixed} className="max-w-48" />
          </Field>
        ) : null}
        {mode === "PER_BARANGAY" ? (
          <p className="text-sm">
            {barangays} barangays listed.{" "}
            <Link
              href={`${base}/settings/pricing/barangays`}
              className="underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              Edit barangay prices
            </Link>
          </p>
        ) : null}
        {preview ? (
          <div className="flex flex-wrap items-center gap-3 rounded-control bg-subtle px-4 py-3 text-sm">
            <span className="text-muted-foreground">Try a distance</span>
            <NumberInput
              value={km}
              onChange={setKm}
              suffix="km"
              min={0}
              step={0.5}
              className="h-9 w-28 bg-white"
              aria-label="Distance"
            />
            <span>
              →{" "}
              <span className="font-medium tabular-nums">
                {preview.ok ? formatPeso(preview.fee) : "—"}
              </span>
            </span>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Order rules">
        <Field
          label="Maximum order amount"
          htmlFor="f-max"
          hint="Food total per order. Riders pay the store with their own cash, so this limits what they front."
        >
          <MoneyInput id="f-max" value={maxOrder} onChange={setMaxOrder} className="max-w-48" />
        </Field>
        <SwitchRow
          title="Auto-approve verified customers"
          description="Orders from customers whose ID is already verified skip the approval step."
          control={
            <Switch
              checked={autoApprove}
              onCheckedChange={setAutoApprove}
              aria-label="Auto-approve verified customers"
            />
          }
        />
      </FormSection>

      <SaveBar>
        <Button
          disabled={!canSave}
          onClick={() => {
            setTenantRow("tenantSettings", {
              ...settings,
              deliveryFee: rule!,
              maxOrderSubtotal: maxOrder!,
              autoApproveVerifiedCustomers: autoApprove,
            });
            toast("Delivery fee saved");
          }}
        >
          Save changes
        </Button>
      </SaveBar>
    </>
  );
}
