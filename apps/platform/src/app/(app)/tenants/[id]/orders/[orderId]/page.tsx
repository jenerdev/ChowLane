"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { formatDateTime, formatPeso, ORDER_STATUS_LABELS } from "@chowlane/lib";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  OrderStatusBadge,
} from "@chowlane/ui";
import { ReadOnlyNote } from "@/components/read-only-note";
import { useTenantRecords } from "@/lib/use-tenant";

function Line({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-1 text-sm ${strong ? "font-semibold" : ""} ${muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** S-505 — one order, read-only (PLT-006). */
export default function TenantOrderDetail({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const r = useTenantRecords();
  if (!r.tenant) return null;
  const o = r.orders.find((x) => x.id === orderId);
  const back = (
    <Link
      href={`/tenants/${r.tenant.id}/orders`}
      className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" /> Orders
    </Link>
  );
  if (!o)
    return (
      <>
        {back}
        <EmptyState icon={<ReceiptText />} title="Order not found" />
      </>
    );
  const customer = r.customers.find((c) => c.id === o.customerId);
  const merchant = r.merchants.find((m) => m.id === o.merchantId);
  const rider = r.riders.find((x) => x.id === o.riderId);

  return (
    <>
      {back}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">{o.orderNumber}</h2>
        <OrderStatusBadge status={o.status} />
        <span className="text-[13px] text-muted-foreground">{formatDateTime(o.createdAt)}</span>
      </div>
      <ReadOnlyNote />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{merchant?.name ?? "Store"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {o.items.map((i) => (
                  <li key={i.productId + i.name} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-6 text-muted-foreground tabular-nums">{i.qty}×</span>
                    <span
                      className={`flex-1 ${i.isUnavailable ? "text-muted-foreground line-through" : ""}`}
                    >
                      {i.name}
                      {i.isFreeGift ? (
                        <Badge tone="brand" className="ml-2">
                          Free gift
                        </Badge>
                      ) : null}
                    </span>
                    <span className="tabular-nums">{formatPeso(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t pt-3">
                <Line label="Subtotal" value={formatPeso(o.subtotal)} />
                <Line
                  label={`Delivery fee (${o.distanceKm} km)`}
                  value={formatPeso(o.deliveryFee)}
                />
                {o.discountTotal ? (
                  <Line label="Discounts" value={`−${formatPeso(o.discountTotal)}`} muted />
                ) : null}
                <Line label="Customer paid (cash)" value={formatPeso(o.total)} strong />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {[...o.timeline].reverse().map((e, i) => (
                  <li key={i} className="text-sm">
                    {ORDER_STATUS_LABELS[e.status]}
                    <span className="block text-[13px] text-muted-foreground">
                      {formatDateTime(e.at)}
                      {e.note ? ` · ${e.note}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
        <Card className="self-start">
          <CardContent className="flex flex-col gap-3 pt-5 text-sm">
            <div>
              <p className="text-[13px] text-muted-foreground">Customer</p>
              <p className="font-medium">{customer?.name ?? "—"}</p>
              <p className="text-[13px] text-muted-foreground">{o.deliveryAddressText}</p>
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Rider</p>
              <p className="font-medium">{rider?.name ?? "Not assigned"}</p>
            </div>
            {o.rejectReason || o.cancelReason ? (
              <div>
                <p className="text-[13px] text-muted-foreground">Reason</p>
                <p>{o.rejectReason ?? o.cancelReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
