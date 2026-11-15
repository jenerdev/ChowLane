"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, ShoppingBag } from "lucide-react";
import {
  CHECKOUT_MESSAGES,
  checkoutQuote,
  formatPeso,
  isPinAdjustAllowed,
  needsIdForOrder,
  normalizeCouponCode,
} from "@chowlane/lib";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  MapPicker,
  MoneyInput,
  PageHeader,
  Select,
  Switch,
  SwitchRow,
  Textarea,
  toast,
} from "@chowlane/ui";
import { PriceLines } from "@/components/price-lines";
import { useCheckoutDraft } from "@/lib/checkout-draft";
import { useCheckout } from "@/lib/use-place-order";

/** S-305 — checkout: location, address, promos, points, cash on delivery (CUS-005, CUS-013, CUS-014). */
export default function CheckoutPage() {
  const router = useRouter();
  const c = useCheckout();
  const { draft, update } = useCheckoutDraft(c.slug);
  const [codeText, setCodeText] = useState(draft.couponCode);
  const [errors, setErrors] = useState<{ address?: string }>({});

  // Keep the coupon text box in sync if the draft changes elsewhere.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror persisted draft into the input
    setCodeText(draft.couponCode);
  }, [draft.couponCode]);

  if (!c.input || !c.merchant || !c.me) {
    return (
      <>
        <PageHeader back={{ href: c.base, label: "Home" }} title="Checkout" />
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          action={
            <Button asChild>
              <Link href={c.base}>Browse restaurants</Link>
            </Button>
          }
        />
      </>
    );
  }

  const q = checkoutQuote(c.input);
  const s = c.settings;
  const l = s.loyalty;
  const perBarangay = s.deliveryFee.mode === "PER_BARANGAY";
  const barangays = c.db.barangayFees
    .filter((b) => b.tenantId === c.tenant.id && b.isActive)
    .sort((a, b) => a.barangay.localeCompare(b.barangay));
  const couponApplied = Boolean(draft.couponCode && !q.couponError && c.coupon);
  const needsId = needsIdForOrder(c.me);
  const blocked = q.problems.length > 0 || !q.pricing;

  function submit() {
    if (!draft.addressText.trim()) {
      setErrors({ address: "Add your house, unit or street so the rider finds you." });
      document.getElementById("co-address")?.focus();
      return;
    }
    if (needsId) router.push(`${c.base}/checkout/verify-id`);
    else c.place();
  }

  return (
    <>
      <PageHeader
        back={{ href: `${c.base}/cart`, label: "Cart" }}
        title="Checkout"
        description={c.merchant.name}
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold">Deliver to</h2>
        <MapPicker
          center={c.pin}
          zoom={16}
          color={c.tenant.primaryColor}
          onPick={(p) => {
            if (!isPinAdjustAllowed(c.current, p, s.pinAdjustRadiusM)) {
              toast(
                `You can move the pin up to ${s.pinAdjustRadiusM} m from where you are.`,
                "error",
              );
              return;
            }
            update({ pin: p });
          }}
          className="h-56"
        />
        <p className="-mt-2 text-[13px] text-muted-foreground">
          Pin is your current location. Tap the map to fine-tune it (up to {s.pinAdjustRadiusM} m).
        </p>
        {perBarangay ? (
          <Field
            label="Barangay"
            htmlFor="co-brgy"
            error={
              q.problems.includes("BARANGAY_NOT_LISTED") && draft.barangayFeeId
                ? CHECKOUT_MESSAGES.BARANGAY_NOT_LISTED
                : undefined
            }
            hint="Not on the list? Sorry — we don't deliver there yet."
          >
            <Select
              id="co-brgy"
              value={draft.barangayFeeId ?? ""}
              onChange={(e) => update({ barangayFeeId: e.target.value || undefined })}
            >
              <option value="">Choose your barangay</option>
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.barangay}, {b.cityMunicipality} — {formatPeso(b.fee)}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="House / unit, street" htmlFor="co-address" error={errors.address}>
          <Input
            id="co-address"
            value={draft.addressText}
            onChange={(e) => (update({ addressText: e.target.value }), setErrors({}))}
            placeholder="Unit 12B, Salcedo Tower"
            aria-invalid={Boolean(errors.address)}
          />
        </Field>
        <Field
          label="Note for the rider"
          htmlFor="co-notes"
          hint="Optional — landmark, gate code, “call when outside”"
        >
          <Textarea
            id="co-notes"
            value={draft.notes}
            onChange={(e) => update({ notes: e.target.value })}
            className="min-h-16"
          />
        </Field>
      </section>

      <section className="mt-8 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Your order</h2>
          <Link
            href={`${c.base}/cart`}
            className="text-sm underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Edit
          </Link>
        </div>
        <ul className="text-sm">
          {q.items.map((i) => (
            <li
              key={i.productId + (i.isFreeGift ? "-gift" : "")}
              className="flex justify-between gap-3 py-1"
            >
              <span>
                {i.qty}× {i.name} {i.isFreeGift ? <Badge tone="brand">Free gift</Badge> : null}
              </span>
              <span className="tabular-nums">
                {i.isFreeGift ? "Free" : formatPeso(i.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold">Discounts</h2>
        <Field
          label="Coupon code"
          htmlFor="co-coupon"
          error={draft.couponCode ? q.couponError : undefined}
          hint={
            couponApplied
              ? `Applied${c.coupon?.description ? ` — ${c.coupon.description}` : ""}`
              : undefined
          }
        >
          <div className="flex gap-2">
            <Input
              id="co-coupon"
              value={codeText}
              onChange={(e) => setCodeText(normalizeCouponCode(e.target.value))}
              className="font-mono uppercase"
              autoCapitalize="characters"
            />
            {draft.couponCode ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => (update({ couponCode: "" }), setCodeText(""))}
              >
                Remove
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={!codeText}
                onClick={() => update({ couponCode: codeText, useFreeDelivery: false })}
              >
                Apply
              </Button>
            )}
          </div>
        </Field>
        {l.enabled && q.canUseFreeDelivery ? (
          <SwitchRow
            title="Use a free delivery"
            description={
              couponApplied
                ? "One promo per order — remove the coupon to use this."
                : `You have ${c.me.loyalty.freeDeliveryRewards}.`
            }
            control={
              <Switch
                checked={draft.useFreeDelivery && !couponApplied}
                disabled={couponApplied}
                onCheckedChange={(v) => update({ useFreeDelivery: v })}
                aria-label="Use a free delivery"
              />
            }
          />
        ) : null}
        {l.enabled && l.freeGift.enabled && c.me.loyalty.freeGiftRewards > 0 ? (
          <SwitchRow
            title={`Claim your ${l.freeGift.giftName}`}
            description={
              q.giftOtherMerchant
                ? "This gift is only available on orders from the restaurant that makes it."
                : "Added to this order for free."
            }
            control={
              <Switch
                checked={draft.claimGift && q.canClaimGift}
                disabled={!q.canClaimGift}
                onCheckedChange={(v) => update({ claimGift: v })}
                aria-label="Claim free gift"
              />
            }
          />
        ) : null}
        {l.enabled && l.points.enabled ? (
          q.maxPoints > 0 ? (
            <div className="flex flex-col gap-2">
              <SwitchRow
                title="Pay with points"
                description={`You have ${c.me.loyalty.points} points. Up to ${q.maxPoints} can be used on this order.`}
                control={
                  <Switch
                    checked={draft.usePoints}
                    onCheckedChange={(v) => update({ usePoints: v, points: v ? q.maxPoints : 0 })}
                    aria-label="Pay with points"
                  />
                }
              />
              {draft.usePoints ? (
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="range"
                    min={l.points.minRedeemPoints}
                    max={q.maxPoints}
                    value={Math.min(Math.max(draft.points, l.points.minRedeemPoints), q.maxPoints)}
                    onChange={(e) => update({ points: Number(e.target.value) })}
                    className="flex-1 accent-zinc-900"
                    aria-label="Points to use"
                  />
                  <span className="w-28 text-right tabular-nums">
                    {Math.min(Math.max(draft.points, l.points.minRedeemPoints), q.maxPoints)} pts ={" "}
                    {formatPeso(
                      Math.min(Math.max(draft.points, l.points.minRedeemPoints), q.maxPoints) *
                        l.points.pointValue,
                    )}
                  </span>
                </label>
              ) : null}
            </div>
          ) : c.me.loyalty.points > 0 ? (
            <p className="text-[13px] text-muted-foreground">
              You have {c.me.loyalty.points} points — you can use them once you have{" "}
              {l.points.minRedeemPoints}.
            </p>
          ) : null
        ) : null}
      </section>

      <section className="mt-8 flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold">Payment</h2>
        <div className="flex items-center gap-3 rounded-control border px-4 py-3 text-sm">
          <Banknote className="size-5 text-muted-foreground" />
          <span className="flex-1">Cash on delivery</span>
        </div>
        <Field
          label="Change for"
          htmlFor="co-change"
          hint="Optional — so the rider brings change"
          error={q.problems.includes("BAD_CHANGE") ? CHECKOUT_MESSAGES.BAD_CHANGE : undefined}
        >
          <MoneyInput
            id="co-change"
            value={draft.changeFor}
            onChange={(v) => update({ changeFor: v })}
            className="max-w-48"
          />
        </Field>
      </section>

      <section className="mt-8 rounded-card bg-subtle p-4">
        {q.pricing ? (
          <PriceLines
            p={q.pricing}
            distanceKm={q.distanceKm}
            couponCode={couponApplied ? draft.couponCode : undefined}
          />
        ) : null}
      </section>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mt-6 flex flex-col gap-2 bg-background pt-3 pb-2">
        {q.problems
          .filter((p) => p !== "BAD_CHANGE" && p !== "BARANGAY_NOT_LISTED")
          .map((p) => (
            <p key={p} className="text-[13px] text-danger">
              {CHECKOUT_MESSAGES[p]}
            </p>
          ))}
        {perBarangay && !draft.barangayFeeId ? (
          <p className="text-[13px] text-muted-foreground">
            Choose your barangay to see the delivery fee.
          </p>
        ) : null}
        <Button size="lg" block disabled={blocked} onClick={submit}>
          {needsId
            ? "Continue — verify your ID"
            : `Place order · ${q.pricing ? formatPeso(q.pricing.total) : ""}`}
        </Button>
        {needsId ? (
          <p className="text-center text-[13px] text-muted-foreground">
            First order: we check a valid ID once, then you&apos;re all set.
          </p>
        ) : null}
      </div>
    </>
  );
}
