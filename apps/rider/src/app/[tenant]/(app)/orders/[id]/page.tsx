"use client";

import { use } from "react";
import { ReceiptText } from "lucide-react";
import { dropOffArea, formatDateTime, formatPeso, ORDER_STATUS_LABELS } from "@chowlane/lib";
import { Card, CardContent, EmptyState, OrderStatusBadge, PageHeader } from "@chowlane/ui";
import { OfferCard } from "@/components/offer-card";
import { useRider } from "@/lib/use-rider";

/** S-202 — full offer (items before accepting) or a past delivery of mine. */
export default function RiderOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, me, base, rule } = useRider();
  const order = db.orders.find((o) => o.id === id);
  if (!me || !order) return <EmptyState icon={<ReceiptText />} title="Order not found" />;

  if (order.status === "APPROVED" && order.pendingOffer?.riderId === me.id) {
    return (
      <>
        <PageHeader back={{ href: base, label: "Home" }} title={`Offer ${order.orderNumber}`} />
        <OfferCard order={order} full />
      </>
    );
  }
  if (order.riderId !== me.id)
    return <EmptyState icon={<ReceiptText />} title="This order isn't yours anymore" />;

  const store = db.merchants.find((m) => m.id === order.merchantId);
  return (
    <>
      <PageHeader
        back={{ href: `${base}/history`, label: "History" }}
        title={order.orderNumber}
        description={formatDateTime(order.createdAt)}
        actions={<OrderStatusBadge status={order.status} />}
      />
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 text-sm">
          <p>
            {store?.name} → {dropOffArea(order)}
          </p>
          <ul className="divide-y">
            {order.items.map((i, idx) => (
              <li
                key={idx}
                className={`flex justify-between py-1.5 ${i.isUnavailable ? "text-muted-foreground line-through" : ""}`}
              >
                <span>
                  {i.qty}× {i.name}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-3">
            <Row label="Collected from customer" value={formatPeso(order.total)} />
            {order.storeAmountPaid ? (
              <Row label="Paid at store" value={formatPeso(order.storeAmountPaid)} />
            ) : null}
            <Row
              label="Your earning"
              value={
                rule.mode === "DAILY"
                  ? "Daily rate"
                  : order.riderEarning !== undefined
                    ? formatPeso(order.riderEarning)
                    : "—"
              }
            />
          </div>
          {order.cancelReason ? (
            <p className="text-muted-foreground">Cancelled: {order.cancelReason}</p>
          ) : null}
          {order.proofOfDelivery?.note ? (
            <p className="text-muted-foreground">Note: {order.proofOfDelivery.note}</p>
          ) : null}
          <p className="text-[13px] text-muted-foreground">{ORDER_STATUS_LABELS[order.status]}</p>
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
