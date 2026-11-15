"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Navigation, Phone } from "lucide-react";
import { allItemsUnavailable, cashNeededAtStore, directionsUrl, formatPeso } from "@chowlane/lib";
import {
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  Field,
  MapPicker,
  MoneyInput,
  OrderStatusBadge,
  PageHeader,
  Switch,
  cn,
} from "@chowlane/ui";
import { PhotoInput } from "@/components/photo-input";
import { useRider } from "@/lib/use-rider";
import { useRiderActions } from "@/lib/use-rider-actions";

const STEPS = ["Go to the store", "Order & pay", "Deliver"];

/** S-203 — active delivery: store → pay & pick up → customer (RID-005, RID-006, RID-012, RID-013, RID-015). */
export default function ActiveDelivery() {
  const router = useRouter();
  const { me, active: order, db, base, tenant } = useRider();
  const actions = useRiderActions();
  // Follows the expected store cost (which changes when items are marked unavailable) until the rider edits it.
  const [paidEdit, setPaidEdit] = useState<{ value: number | undefined } | null>(null);
  const [receipt, setReceipt] = useState<string | undefined>(
    order?.storeReceiptPhotoUrl || undefined,
  );
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!me || !order) {
    return (
      <EmptyState
        icon={<Bike />}
        title="No active delivery"
        action={
          <Button asChild variant="outline">
            <Link href={base}>Back to home</Link>
          </Button>
        }
      />
    );
  }

  const paid = paidEdit
    ? paidEdit.value
    : (order.storeAmountPaid ?? cashNeededAtStore(order.items));
  const setPaid = (value: number | undefined) => setPaidEdit({ value });
  const store = db.merchants.find((m) => m.id === order.merchantId)!;
  const customer = db.customers.find((c) => c.id === order.customerId);
  const step = order.status === "ASSIGNED" ? 0 : order.status === "AT_MERCHANT" ? 1 : 2;
  const target = step < 2 ? store.location : order.deliveryLocation;
  const unavailable = order.items.flatMap((i, idx) => (i.isUnavailable ? [idx] : []));
  const toggle = (idx: number, off: boolean) =>
    actions.setUnavailable(
      order,
      off ? [...unavailable, idx] : unavailable.filter((x) => x !== idx),
    );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={{ href: base, label: "Home" }}
        title={order.orderNumber}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <ol className="grid grid-cols-3 gap-2" aria-label="Delivery steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <span className={cn("h-1 rounded-full", i <= step ? "bg-brand" : "bg-muted")} />
            <span
              className={cn("text-[12px]", i === step ? "font-medium" : "text-muted-foreground")}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      <MapPicker
        center={target}
        zoom={15}
        color={tenant.primaryColor}
        markers={
          me.lastLocation ? [{ position: me.lastLocation, label: "You", color: "#18181b" }] : []
        }
        className="h-52"
      />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 text-sm">
          {step < 2 ? (
            <>
              <div>
                <p className="text-[15px] font-semibold">{store.name}</p>
                <p className="text-muted-foreground">{store.address}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={directionsUrl(store.location)} target="_blank" rel="noreferrer">
                    <Navigation /> Directions
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${store.phone}`}>
                    <Phone /> Call store
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[15px] font-semibold">{customer?.name}</p>
                <p className="text-muted-foreground">{order.deliveryAddressText}</p>
                {order.notes ? <p className="mt-1">Note: {order.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={directionsUrl(order.deliveryLocation)} target="_blank" rel="noreferrer">
                    <Navigation /> Directions
                  </a>
                </Button>
                {customer?.phone ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${customer.phone}`}>
                      <Phone /> Call customer
                    </a>
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <p className="text-[15px] font-semibold">
            {step === 0
              ? "What to order"
              : step === 1
                ? "Mark anything the store doesn't have"
                : "Items"}
          </p>
          <ul className="flex flex-col divide-y text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-3 py-2">
                <span
                  className={cn("flex-1", i.isUnavailable && "text-muted-foreground line-through")}
                >
                  {i.qty}× {i.name}
                  {i.isFreeGift ? (
                    <span className="text-muted-foreground"> · free gift</span>
                  ) : null}
                </span>
                {step === 1 ? (
                  <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    {i.isUnavailable ? "Not available" : "Available"}
                    <Switch
                      checked={!i.isUnavailable}
                      onCheckedChange={(v) => toggle(idx, !v)}
                      aria-label={`${i.name} available`}
                    />
                  </label>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Cash needed at store</span>
            <span className="font-semibold tabular-nums">
              {formatPeso(cashNeededAtStore(order.items))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collect from customer</span>
            <span className="font-semibold tabular-nums">{formatPeso(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      {step === 0 ? (
        <Button size="lg" onClick={() => actions.arrive(order)}>
          I&apos;m at the store & ordered
        </Button>
      ) : step === 1 ? (
        allItemsUnavailable(order.items) ? (
          <Button size="lg" variant="destructive" onClick={() => setConfirmCancel(true)}>
            Cancel order — nothing available
          </Button>
        ) : (
          <div className="flex flex-col gap-4">
            <Field
              label="Amount you paid at the store"
              htmlFor="paid"
              hint="From the receipt. You get this back when you hand over cash after your shift."
            >
              <MoneyInput id="paid" value={paid} onChange={setPaid} />
            </Field>
            <PhotoInput id="receipt" label="Receipt photo" value={receipt} onChange={setReceipt} />
            <Button size="lg" onClick={() => actions.pickUp(order, paid, receipt)}>
              Picked up
            </Button>
          </div>
        )
      ) : (
        <Button size="lg" onClick={() => router.push(`${base}/active/complete`)}>
          I&apos;m at the customer
        </Button>
      )}

      <ConfirmSheet
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this order?"
        description="The store has none of the items. The customer is told and gets their coupon and points back."
        confirmLabel="Cancel order"
        destructive
        onConfirm={() => actions.cancelUnavailable(order)}
      />
    </div>
  );
}
