"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Centavos, Rider, RiderPayMode, RiderPayRule, VehicleType } from "@chowlane/types";
import { checkPassword, formatPhMobile, isValidEmail, normalizePhMobile } from "@chowlane/lib";
import {
  Button,
  ConfirmSheet,
  Field,
  FormSection,
  Input,
  MoneyInput,
  NumberInput,
  PageHeader,
  RadioCards,
  SaveBar,
  Select,
  Switch,
  SwitchRow,
  toast,
} from "@chowlane/ui";
import { saveRiderLogin } from "@/lib/team-actions";
import { useConsole } from "@/lib/use-console";

type Draft = {
  name: string;
  phone: string;
  password: string;
  email: string;
  vehicleType: VehicleType;
  plateNumber: string;
  active: boolean;
  override: boolean;
  mode: RiderPayMode;
  amount?: Centavos;
  percent?: number;
};

const ruleToDraft = (r?: RiderPayRule) =>
  r?.mode === "DAILY"
    ? { mode: r.mode, amount: r.dailyRate }
    : r?.mode === "PER_DELIVERY"
      ? { mode: r.mode, amount: r.ratePerDelivery }
      : r?.mode === "COMMISSION"
        ? { mode: r.mode, percent: r.percent }
        : {};

/**
 * S-108 — add / edit a rider incl. optional pay override (ADM-006, BL-8.2). Live on Supabase since 2.3: the
 * admin sets the rider's password; the rider logs in with mobile number + password (Q-30).
 */
export function RiderForm({ rider, tenantRule }: { rider?: Rider; tenantRule?: RiderPayRule }) {
  const router = useRouter();
  const { live, base, can, supabase } = useConsole();
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "phone" | "password" | "email" | "plateNumber" | "pay", string>>
  >({});
  const [d, setD] = useState<Draft>({
    name: rider?.name ?? "",
    phone: rider ? formatPhMobile(rider.phone) : "",
    password: "",
    email: rider?.email ?? "",
    vehicleType: rider?.vehicleType ?? "MOTORCYCLE",
    plateNumber: rider?.plateNumber ?? "",
    active: rider ? rider.status === "ACTIVE" : true,
    override: Boolean(rider?.payOverride),
    mode: tenantRule?.mode ?? "PER_DELIVERY",
    ...ruleToDraft(tenantRule),
    ...ruleToDraft(rider?.payOverride),
  });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const canPay = can("settings.riderPay");

  async function save() {
    const e: typeof errors = {};
    if (d.name.trim().length < 2) e.name = "Enter the rider's full name.";
    const phone = normalizePhMobile(d.phone);
    if (!phone) e.phone = "Enter a PH mobile number, like 0917 123 4567.";
    if (!rider || d.password) {
      const pw = d.password ? checkPassword(d.password) : "Set a password so the rider can log in.";
      if (pw) e.password = pw;
    }
    if (d.email && !isValidEmail(d.email)) e.email = "Enter a valid email or leave it empty.";
    if (d.vehicleType !== "BICYCLE" && !d.plateNumber.trim())
      e.plateNumber = "Enter the plate number.";
    let payOverride: RiderPayRule | undefined;
    if (d.override) {
      if (d.mode === "COMMISSION")
        payOverride =
          d.percent && d.percent > 0 && d.percent <= 100
            ? { mode: "COMMISSION", percent: d.percent }
            : undefined;
      else if (d.amount && d.amount > 0)
        payOverride =
          d.mode === "DAILY"
            ? { mode: "DAILY", dailyRate: d.amount }
            : { mode: "PER_DELIVERY", ratePerDelivery: d.amount };
      if (!payOverride) e.pay = "Enter the rider's rate.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    const row = {
      name: d.name.trim(),
      phone: phone!,
      email: d.email.trim() || undefined,
      vehicleType: d.vehicleType,
      plateNumber: d.vehicleType === "BICYCLE" ? undefined : d.plateNumber.trim().toUpperCase(),
      payOverride,
      status: d.active ? ("ACTIVE" as const) : ("INACTIVE" as const),
    };
    const values = {
      name: row.name,
      phone: row.phone,
      email: row.email ?? null,
      vehicle_type: row.vehicleType,
      plate_number: row.plateNumber ?? null,
      pay_override: row.payOverride ?? null,
      status: row.status,
    };
    setBusy(true);
    try {
      const saved = rider
        ? await supabase.from("riders").update(values).eq("id", rider.id).select("id").single()
        : await supabase
            .from("riders")
            .insert({ ...values, tenant_id: live.id })
            .select("id")
            .single();
      if (saved.error)
        return setErrors(
          saved.error.code === "23505"
            ? { phone: "Another rider already uses this number." }
            : { name: saved.error.message },
        );
      const id = saved.data.id;
      // Login (mobile number + password): needed for a new rider, a new number or a new password.
      if (!rider || d.password || phone !== rider.phone) {
        const login = await saveRiderLogin({
          tenantId: live.id,
          slug: live.slug,
          riderId: id,
          password: d.password || undefined,
        });
        if (!login.ok) {
          toast(`Rider saved, but the login wasn't: ${login.error}`);
          return router.push(`${base}/riders/${id}/edit`);
        }
      }
      toast(rider ? "Rider saved" : `${row.name} added — tell them their password to log in`);
      router.push(`${base}/riders/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        back={{
          href: rider ? `${base}/riders/${rider.id}` : `${base}/riders`,
          label: rider ? rider.name : "Riders",
        }}
        title={rider ? "Edit rider" : "Add rider"}
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <FormSection
          title="Rider"
          description={
            rider
              ? undefined
              : "They log in to the rider app with their mobile number and the password you set."
          }
        >
          <Field label="Full name" htmlFor="r-name" error={errors.name}>
            <Input
              id="r-name"
              value={d.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field label="Mobile number" htmlFor="r-phone" error={errors.phone}>
            <Input
              id="r-phone"
              type="tel"
              inputMode="tel"
              value={d.phone}
              placeholder="0917 123 4567"
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={Boolean(errors.phone)}
            />
          </Field>
          <Field
            label={rider ? "New password" : "Password"}
            htmlFor="r-password"
            error={errors.password}
            hint={
              rider
                ? "Leave empty to keep the current one"
                : "At least 8 characters, letters and a number"
            }
          >
            <Input
              id="r-password"
              type="text"
              autoComplete="off"
              value={d.password}
              onChange={(e) => set("password", e.target.value)}
              aria-invalid={Boolean(errors.password)}
            />
          </Field>
          <Field label="Email" htmlFor="r-email" error={errors.email} hint="Optional">
            <Input
              id="r-email"
              type="email"
              value={d.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
        </FormSection>

        <FormSection title="Vehicle">
          <RadioCards<VehicleType>
            name="vehicle"
            columns={3}
            value={d.vehicleType}
            onChange={(v) => set("vehicleType", v)}
            options={[
              { value: "MOTORCYCLE", label: "Motorcycle" },
              { value: "BICYCLE", label: "Bicycle" },
              { value: "CAR", label: "Car" },
            ]}
          />
          {d.vehicleType !== "BICYCLE" ? (
            <Field label="Plate number" htmlFor="r-plate" error={errors.plateNumber}>
              <Input
                id="r-plate"
                value={d.plateNumber}
                onChange={(e) => set("plateNumber", e.target.value)}
                className="uppercase sm:max-w-48"
                aria-invalid={Boolean(errors.plateNumber)}
              />
            </Field>
          ) : null}
        </FormSection>

        {canPay ? (
          <FormSection
            title="Pay"
            description="By default riders follow your rider income setting."
          >
            <SwitchRow
              title="Different rate for this rider"
              control={
                <Switch
                  checked={d.override}
                  onCheckedChange={(v) => set("override", v)}
                  aria-label="Different rate"
                />
              }
            />
            {d.override ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Paid by" htmlFor="r-mode">
                  <Select
                    id="r-mode"
                    value={d.mode}
                    onChange={(e) => set("mode", e.target.value as RiderPayMode)}
                  >
                    <option value="DAILY">Fixed daily rate</option>
                    <option value="COMMISSION">Share of delivery fee</option>
                    <option value="PER_DELIVERY">Fixed amount per delivery</option>
                  </Select>
                </Field>
                {d.mode === "COMMISSION" ? (
                  <Field label="Share" htmlFor="r-pct" error={errors.pay}>
                    <NumberInput
                      id="r-pct"
                      value={d.percent}
                      onChange={(v) => set("percent", v)}
                      suffix="%"
                      min={1}
                      max={100}
                    />
                  </Field>
                ) : (
                  <Field
                    label={d.mode === "DAILY" ? "Daily rate" : "Per delivery"}
                    htmlFor="r-amt"
                    error={errors.pay}
                  >
                    <MoneyInput id="r-amt" value={d.amount} onChange={(v) => set("amount", v)} />
                  </Field>
                )}
              </div>
            ) : null}
          </FormSection>
        ) : null}

        {rider ? (
          <FormSection title="Status">
            <SwitchRow
              title="Active"
              description="Inactive riders can't log in or get orders. Their history is kept."
              control={
                <Switch
                  checked={d.active}
                  onCheckedChange={(v) => (v ? set("active", true) : setConfirmOff(true))}
                  aria-label="Active"
                />
              }
            />
          </FormSection>
        ) : null}

        <SaveBar>
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {rider ? "Save changes" : "Add rider"}
          </Button>
        </SaveBar>
      </form>
      <ConfirmSheet
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title="Make this rider inactive?"
        description={
          rider?.activeOrderId
            ? "They have an active order — reassign it first."
            : "They'll be logged out and won't get new orders."
        }
        confirmLabel="Make inactive"
        destructive
        onConfirm={() => {
          if (!rider?.activeOrderId) set("active", false);
        }}
      />
    </>
  );
}
