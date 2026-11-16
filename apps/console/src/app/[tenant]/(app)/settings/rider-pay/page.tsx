"use client";

import { useState } from "react";
import type { Centavos, RiderPayMode, RiderPayRule } from "@chowlane/types";
import { computeRiderPay, formatPeso } from "@chowlane/lib";
import {
  Button,
  Field,
  FormSection,
  MoneyInput,
  NumberInput,
  PageHeader,
  RadioCards,
  SaveBar,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { useConsole } from "@/lib/use-console";

/** S-117 — how riders are paid (OWN-006, BL-8). Owner-only by default (settings.riderPay). */
export default function RiderPaySettings() {
  return (
    <RequirePermission perm="settings.riderPay">
      <RiderPay />
    </RequirePermission>
  );
}

function RiderPay() {
  const { settings, base } = useConsole();
  const setTenantRow = useMockStore((s) => s.setTenantRow);
  const cur = settings.riderPay;
  // Not set yet on a new business (D-061): the form starts on per delivery.
  const [mode, setMode] = useState<RiderPayMode>(cur?.mode ?? "PER_DELIVERY");
  const [daily, setDaily] = useState<Centavos | undefined>(
    cur?.mode === "DAILY" ? cur.dailyRate : 60000,
  );
  const [percent, setPercent] = useState<number | undefined>(
    cur?.mode === "COMMISSION" ? cur.percent : 80,
  );
  const [perDelivery, setPerDelivery] = useState<Centavos | undefined>(
    cur?.mode === "PER_DELIVERY" ? cur.ratePerDelivery : 4000,
  );

  const rule: RiderPayRule | null =
    mode === "DAILY"
      ? daily
        ? { mode, dailyRate: daily }
        : null
      : mode === "COMMISSION"
        ? percent && percent > 0 && percent <= 100
          ? { mode, percent }
          : null
        : perDelivery
          ? { mode, ratePerDelivery: perDelivery }
          : null;

  // Example day: 12 deliveries with a ₱60 delivery fee each.
  const example = rule
    ? computeRiderPay({
        rule,
        deliveredOrderFees: Array(12).fill(6000),
        shiftTimeIns: ["2026-11-15T01:00:00Z"],
      })
    : null;

  return (
    <>
      <PageHeader back={{ href: `${base}/settings`, label: "Settings" }} title="Rider income" />
      <FormSection
        title="How riders are paid"
        description="Applies to all riders. You can set a different rate for one rider on their profile. Promos never reduce rider income."
      >
        <RadioCards<RiderPayMode>
          name="pay-mode"
          value={mode}
          onChange={setMode}
          options={[
            {
              value: "DAILY",
              label: "Fixed daily rate",
              description: "Paid for each day the rider works a shift.",
            },
            {
              value: "COMMISSION",
              label: "Share of the delivery fee",
              description: "A percentage of each delivery fee.",
            },
            {
              value: "PER_DELIVERY",
              label: "Fixed amount per delivery",
              description: "The same amount for every completed delivery.",
            },
          ]}
        />
        {mode === "DAILY" ? (
          <Field label="Daily rate" htmlFor="rp-daily">
            <MoneyInput id="rp-daily" value={daily} onChange={setDaily} className="max-w-48" />
          </Field>
        ) : mode === "COMMISSION" ? (
          <Field
            label="Rider's share"
            htmlFor="rp-pct"
            error={percent && (percent < 1 || percent > 100) ? "Use 1 to 100%." : undefined}
          >
            <NumberInput
              id="rp-pct"
              value={percent}
              onChange={setPercent}
              suffix="%"
              min={1}
              max={100}
              className="max-w-32"
            />
          </Field>
        ) : (
          <Field label="Per delivery" htmlFor="rp-per">
            <MoneyInput
              id="rp-per"
              value={perDelivery}
              onChange={setPerDelivery}
              className="max-w-48"
            />
          </Field>
        )}
        {example !== null ? (
          <p className="rounded-control bg-subtle px-4 py-3 text-sm">
            A rider who works one day and makes 12 deliveries with a ₱60 fee earns{" "}
            <span className="font-medium tabular-nums">{formatPeso(example)}</span>.
          </p>
        ) : null}
      </FormSection>
      <SaveBar>
        <Button
          disabled={!rule}
          onClick={() => {
            setTenantRow("tenantSettings", { ...settings, riderPay: rule! });
            toast("Rider income saved");
          }}
        >
          Save changes
        </Button>
      </SaveBar>
    </>
  );
}
