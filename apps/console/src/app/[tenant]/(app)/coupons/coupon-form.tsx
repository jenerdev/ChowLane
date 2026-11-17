"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon, CouponType } from "@chowlane/types";
import { fromCoupon, toCoupon } from "@chowlane/db/mappers";
import {
  checkCouponDraft,
  COUPON_STATUS_LABELS,
  couponStatus,
  formatDateTime,
  formatPeso,
  fromManilaInput,
  normalizeCouponCode,
  toManilaInput,
} from "@chowlane/lib";
import {
  Badge,
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
  Switch,
  SwitchRow,
  toast,
} from "@chowlane/ui";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";
import { STATUS_TONE } from "./coupon-utils";

type Draft = Omit<Coupon, "id" | "tenantId" | "usedCount" | "createdBy" | "createdAt">;

export type CouponUse = {
  id: string;
  orderNumber: string;
  customerName: string;
  discount: number;
  redeemedAt: string;
  released: boolean;
};

/** Loads the coupon (when editing), its uses, and the codes already taken in this business. */
export function useCouponFormData(id?: string) {
  const { live } = useConsole();
  return useLive(`coupon-form:${id ?? "new"}`, async (sb) => {
    const [coupon, codes, uses] = await Promise.all([
      id
        ? sb.from("coupons").select("*").eq("id", id).eq("tenant_id", live.id).maybeSingle()
        : { data: null, error: null },
      sb.from("coupons").select("id, code").eq("tenant_id", live.id),
      id
        ? sb
            .from("coupon_redemptions")
            .select("*, order:orders(order_number), customer:customers(name)")
            .eq("coupon_id", id)
            .order("redeemed_at", { ascending: false })
        : { data: [], error: null },
    ]);
    const c = must(coupon);
    if (id && !c) return null;
    return {
      coupon: c ? toCoupon(c) : undefined,
      taken: must(codes)
        .filter((x) => x.id !== id)
        .map((x) => x.code),
      uses: must(uses).map((u): CouponUse => ({
        id: u.id,
        orderNumber: u.order?.order_number ?? "Order",
        customerName: u.customer?.name ?? "Customer",
        discount: u.discount,
        redeemedAt: u.redeemed_at,
        released: u.released,
      })),
    };
  });
}

/** S-126 — create / edit a coupon + its usage (OWN-017, OWN-018, BL-13). Live since 2.4. */
export function CouponForm({
  coupon,
  taken,
  uses,
}: {
  coupon?: Coupon;
  taken: string[];
  uses: CouponUse[];
}) {
  const router = useRouter();
  const { live, base, staff, supabase } = useConsole();
  const [busy, setBusy] = useState(false);
  const used = (coupon?.usedCount ?? 0) > 0;
  const now = new Date();
  const [d, setD] = useState<Draft>(
    coupon ?? {
      code: "",
      description: "",
      type: "PERCENT_OFF",
      percentOff: 10,
      maxUses: 100,
      perCustomerLimit: 1,
      validFrom: now.toISOString(),
      validUntil: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
      isActive: true,
    },
  );
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errors = checkCouponDraft(d, taken);
  const err = (k: keyof typeof errors) => (showErrors ? errors[k] : undefined);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function save() {
    setShowErrors(true);
    if (Object.keys(errors).length) return;
    const row = fromCoupon({ ...d, description: d.description?.trim() || undefined });
    setBusy(true);
    try {
      const { error } = coupon
        ? await supabase.from("coupons").update(row).eq("id", coupon.id)
        : await supabase
            .from("coupons")
            .insert({ ...row, tenant_id: live.id, created_by: staff?.id ?? null });
      if (error)
        return toast(
          error.code === "23505"
            ? "Another coupon already uses this code."
            : `Couldn't save: ${error.message}`,
        );
      toast(coupon ? "Coupon saved" : `Coupon ${row.code} created`);
      router.push(`${base}/coupons`);
    } finally {
      setBusy(false);
    }
  }

  const status = coupon ? couponStatus(coupon, now.toISOString()) : null;

  return (
    <>
      <PageHeader
        back={{ href: `${base}/coupons`, label: "Coupons" }}
        title={coupon ? coupon.code : "New coupon"}
        actions={
          status ? (
            <Badge tone={STATUS_TONE[status]}>{COUPON_STATUS_LABELS[status]}</Badge>
          ) : undefined
        }
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <FormSection
          title="Code"
          description={
            used
              ? "Code and discount can't change after the coupon has been used."
              : "Customers type this at checkout. Not case-sensitive."
          }
        >
          <Field label="Coupon code" htmlFor="cp-code" error={err("code")}>
            <Input
              id="cp-code"
              value={d.code}
              disabled={used}
              maxLength={20}
              autoCapitalize="characters"
              onChange={(e) => set("code", normalizeCouponCode(e.target.value))}
              className="font-mono tracking-wide uppercase"
              aria-invalid={Boolean(err("code"))}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="cp-desc"
            hint="Optional — shown to customers, e.g. “20% off your first order”"
          >
            <Input
              id="cp-desc"
              value={d.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </FormSection>

        <FormSection title="Discount">
          <div className={used ? "pointer-events-none opacity-60" : ""}>
            <RadioCards<CouponType>
              name="cp-type"
              columns={2}
              value={d.type}
              onChange={(v) => set("type", v)}
              options={[
                {
                  value: "PERCENT_OFF",
                  label: "Percentage off",
                  description: "Off the food total.",
                },
                {
                  value: "FREE_DELIVERY",
                  label: "Free delivery",
                  description: "Delivery fee is waived.",
                },
              ]}
            />
          </div>
          {d.type === "PERCENT_OFF" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Percentage" htmlFor="cp-pct" error={err("percentOff")}>
                <NumberInput
                  id="cp-pct"
                  value={d.percentOff}
                  onChange={(v) => set("percentOff", v)}
                  suffix="%"
                  min={1}
                  max={100}
                  disabled={used}
                />
              </Field>
              <Field label="Maximum discount" htmlFor="cp-max" hint="Optional cap">
                <MoneyInput
                  id="cp-max"
                  value={d.maxDiscount}
                  onChange={(v) => set("maxDiscount", v)}
                  disabled={used}
                />
              </Field>
            </div>
          ) : null}
          <Field
            label="Minimum order"
            htmlFor="cp-min"
            hint="Optional — food total needed to use the coupon"
          >
            <MoneyInput
              id="cp-min"
              value={d.minOrderSubtotal}
              onChange={(v) => set("minOrderSubtotal", v)}
              className="sm:max-w-[calc(50%-0.375rem)]"
            />
          </Field>
        </FormSection>

        <FormSection
          title="Limits"
          description="A use is given back if the order is rejected or cancelled."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Total uses"
              htmlFor="cp-uses"
              error={err("maxUses")}
              hint={coupon ? `${coupon.usedCount} used so far` : undefined}
            >
              <NumberInput
                id="cp-uses"
                value={d.maxUses}
                onChange={(v) => set("maxUses", v ?? 0)}
                min={1}
              />
            </Field>
            <Field label="Uses per customer" htmlFor="cp-per" error={err("perCustomerLimit")}>
              <NumberInput
                id="cp-per"
                value={d.perCustomerLimit}
                onChange={(v) => set("perCustomerLimit", v ?? 0)}
                min={1}
              />
            </Field>
            <Field label="Starts" htmlFor="cp-from">
              <Input
                id="cp-from"
                type="datetime-local"
                value={toManilaInput(d.validFrom)}
                onChange={(e) =>
                  e.target.value && set("validFrom", fromManilaInput(e.target.value))
                }
              />
            </Field>
            <Field label="Ends" htmlFor="cp-until" error={err("validUntil")}>
              <Input
                id="cp-until"
                type="datetime-local"
                value={toManilaInput(d.validUntil)}
                onChange={(e) =>
                  e.target.value && set("validUntil", fromManilaInput(e.target.value))
                }
                aria-invalid={Boolean(err("validUntil"))}
              />
            </Field>
          </div>
          <SwitchRow
            title="On"
            description="Turn off to stop the coupon right away."
            control={
              <Switch
                checked={d.isActive}
                onCheckedChange={(v) => set("isActive", v)}
                aria-label="Coupon on"
              />
            }
          />
        </FormSection>

        {coupon ? (
          <FormSection title="Uses" description={`${uses.length} recorded`}>
            {uses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders have used this coupon yet.</p>
            ) : (
              <ul className="divide-y rounded-card border">
                {uses.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{u.orderNumber}</span>
                      <span className="block text-[13px] text-muted-foreground">
                        {u.customerName} · {formatDateTime(u.redeemedAt)}
                      </span>
                    </span>
                    {u.released ? <Badge>Given back</Badge> : null}
                    <span className="tabular-nums">−{formatPeso(u.discount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>
        ) : null}

        <SaveBar
          note={
            showErrors && Object.keys(errors).length ? "Fix the highlighted fields." : undefined
          }
        >
          {coupon && !used ? (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : null}
          <Button type="submit" disabled={busy}>
            {coupon ? "Save changes" : "Create coupon"}
          </Button>
        </SaveBar>
      </form>
      <ConfirmSheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this coupon?"
        description="It hasn't been used, so it can be deleted. This can't be undone."
        confirmLabel="Delete coupon"
        destructive
        onConfirm={async () => {
          if (!coupon) return;
          const { data, error } = await supabase
            .from("coupons")
            .delete()
            .eq("id", coupon.id)
            .select("id");
          if (error || !data?.length)
            return toast(
              `Couldn't delete: ${error?.message ?? "it has been used — turn it off instead"}`,
            );
          toast("Coupon deleted");
          router.push(`${base}/coupons`);
        }}
      />
    </>
  );
}
