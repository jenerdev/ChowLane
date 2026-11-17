"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Check, Gift, Phone, ReceiptText } from "lucide-react";
import {
  canCancel,
  customerStatusMessage,
  formatDateTime,
  formatPeso,
  trackingSteps,
} from "@chowlane/lib";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  MapPicker,
  OrderStatusBadge,
  PageHeader,
  cn,
  toast,
} from "@chowlane/ui";
import { PriceLines } from "@/components/price-lines";
import { useCustomer } from "@/lib/use-customer";

/** S-307 — order status & tracking (CUS-007, CUS-008, CUS-015). Refreshes every 20 s (Realtime in 2.6). */
export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, me, tenant, base, supabase, reload } = useCustomer();
  const [confirm, setConfirm] = useState(false);
  const order = db.orders.find((o) => o.id === id && o.customerId === me?.id);
  if (!me) return null;
  if (!order)
    return (
      <EmptyState
        icon={<ReceiptText />}
        title="Order not found"
        action={
          <Button asChild>
            <Link href={`${base}/orders`}>My orders</Link>
          </Button>
        }
      />
    );

  const merchant = db.merchants.find((m) => m.id === order.merchantId);
  const rider = db.riders.find((r) => r.id === order.riderId);
  const steps = trackingSteps(order);
  const live = ["ASSIGNED", "AT_MERCHANT", "PICKED_UP"].includes(order.status);
  const idRejected = order.status === "REJECTED" && me.verificationStatus === "REJECTED";

  /** BL-4.2: only while waiting for approval; coupon use, points and rewards are given back (server). */
  async function cancel() {
    const { error } = await supabase.rpc("cancel_order_by_customer", { p_order: order!.id });
    if (error) return toast(error.message, "error");
    await reload();
    toast("Order cancelled");
  }

  return (
    <>
      <PageHeader
        back={{ href: `${base}/orders`, label: "My orders" }}
        title={order.orderNumber}
        description={`${merchant?.name ?? ""} · ${formatDateTime(order.createdAt)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <p className="mb-5 text-[15px]">{customerStatusMessage(order, me)}</p>
      {idRejected ? (
        <p className="mb-5 rounded-control bg-danger-soft px-4 py-3 text-sm text-danger">
          Your ID wasn&apos;t accepted
          {me.verification?.rejectReason ? `: ${me.verification.rejectReason}` : ""}.{" "}
          <Link
            href={`${base}/checkout/verify-id?resubmit=1`}
            className="font-medium underline underline-offset-4"
          >
            Send a new ID
          </Link>
        </p>
      ) : null}

      {steps.length ? (
        <ol className="mb-6 flex flex-col">
          {steps.map((s, i) => (
            <li key={s.key} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[11px]",
                    s.state === "done" && "border-brand bg-brand text-brand-foreground",
                    s.state === "current" && "border-brand text-brand",
                    s.state === "todo" && "text-zinc-300",
                  )}
                >
                  {s.state === "done" ? <Check className="size-3.5" /> : i + 1}
                </span>
                {i < steps.length - 1 ? (
                  <span
                    className={cn(
                      "my-0.5 w-px flex-1",
                      s.state === "done" ? "bg-brand" : "bg-border",
                    )}
                  />
                ) : null}
              </span>
              <span
                className={cn(
                  "pb-4 text-sm",
                  s.state === "todo" ? "text-muted-foreground" : "font-medium",
                )}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {live && rider ? (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{rider.name}</p>
              <p className="text-[13px] text-muted-foreground">
                {rider.vehicleType.toLowerCase()}
                {rider.plateNumber ? ` · ${rider.plateNumber}` : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${rider.phone}`}>
                <Phone /> Call
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {live ? (
        <MapPicker
          center={order.deliveryLocation}
          zoom={14}
          color="#18181b"
          markers={[
            ...(rider?.lastLocation
              ? [
                  {
                    position: rider.lastLocation,
                    label: `${rider.name} (rider)`,
                    color: tenant.primaryColor,
                  },
                ]
              : []),
            ...(merchant
              ? [{ position: merchant.location, label: merchant.name, color: "#71717a" }]
              : []),
          ]}
          className="mb-6 h-56"
        />
      ) : null}

      <section className="rounded-card border p-4">
        <ul className="mb-3 text-sm">
          {order.items.map((i) => (
            <li
              key={i.productId + (i.isFreeGift ? "-g" : "")}
              className={cn(
                "flex justify-between gap-3 py-1",
                i.isUnavailable && "text-muted-foreground line-through",
              )}
            >
              <span>
                {i.qty}× {i.name}{" "}
                {i.isFreeGift ? (
                  <Badge tone="brand">
                    <Gift /> Free
                  </Badge>
                ) : null}
                {i.isUnavailable ? <Badge>Unavailable</Badge> : null}
              </span>
              <span className="tabular-nums">
                {i.isFreeGift ? "Free" : formatPeso(i.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t pt-3">
          <PriceLines
            p={order}
            distanceKm={order.distanceKm}
            couponCode={order.couponCode}
            changeFor={order.changeFor}
          />
        </div>
        {order.pointsEarned ? (
          <p className="mt-3 text-sm text-brand">You earned {order.pointsEarned} points.</p>
        ) : null}
        <p className="mt-3 text-[13px] text-muted-foreground">
          Deliver to: {order.deliveryAddressText}
        </p>
      </section>

      {canCancel(order.status, "CUSTOMER") ? (
        <Button variant="ghost" className="mt-4 text-danger" onClick={() => setConfirm(true)}>
          Cancel order
        </Button>
      ) : null}
      <ConfirmSheet
        open={confirm}
        onOpenChange={setConfirm}
        title="Cancel this order?"
        description="You can cancel until the store confirms it. Coupons and points you used are given back."
        confirmLabel="Cancel order"
        destructive
        onConfirm={cancel}
      />
    </>
  );
}
