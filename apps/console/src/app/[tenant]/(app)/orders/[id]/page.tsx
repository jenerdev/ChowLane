"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Gift, ReceiptText, ShieldAlert } from "lucide-react";
import type { ActorType } from "@chowlane/types";
import {
  canCancel,
  canReassign,
  cashNeededAtStore,
  formatDateTime,
  formatPeso,
  formatPhMobile,
  isOfferExpired,
  needsRider,
  ORDER_STATUS_LABELS,
  RIDER_REJECT_LABELS,
  timeAgo,
} from "@chowlane/lib";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  OrderStatusBadge,
  PageHeader,
  VerificationBadge,
} from "@chowlane/ui";
import { AssignRiderSheet } from "@/components/assign-rider-sheet";
import { ReasonSheet } from "@/components/reason-sheet";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { useOrderActions } from "@/lib/use-order-actions";

const ACTOR: Record<ActorType, string> = {
  CUSTOMER: "Customer",
  OWNER: "Owner",
  ADMIN: "Admin",
  RIDER: "Rider",
  SYSTEM: "Automatic",
};

/** S-103 — order detail with approve / reject / assign / cancel, timeline and assignment history (ADM-002…004, ADM-007, ADM-011). */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="orders.view">
      <OrderDetail id={id} />
    </RequirePermission>
  );
}

function Line({
  label,
  value,
  muted,
  strong,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-1 text-sm ${muted ? "text-muted-foreground" : ""} ${strong ? "font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function OrderDetail({ id }: { id: string }) {
  const { db, tenant, base, can, settings } = useConsole();
  const actions = useOrderActions();
  const [reject, setReject] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [assign, setAssign] = useState(false);
  const order = db.orders.find((o) => o.id === id && o.tenantId === tenant.id);
  if (!order) return <EmptyState icon={<ReceiptText />} title="Order not found" />;

  const now = new Date().toISOString();
  const customer = db.customers.find((c) => c.id === order.customerId)!;
  const merchant = db.merchants.find((m) => m.id === order.merchantId)!;
  const rider = db.riders.find((r) => r.id === order.riderId);
  const offerRider = db.riders.find((r) => r.id === order.pendingOffer?.riderId);
  const riderName = (rid: string) => db.riders.find((r) => r.id === rid)?.name ?? "Rider";
  const waitingVerification =
    order.status === "PENDING_APPROVAL" && customer.verificationStatus !== "VERIFIED";

  return (
    <>
      <PageHeader
        back={{ href: `${base}/orders`, label: "Orders" }}
        title={order.orderNumber}
        description={`Placed ${timeAgo(order.createdAt, now)} · ${formatDateTime(order.createdAt)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      {/* ------------------------------------------------ next action */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {waitingVerification ? (
            <>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-medium">
                    First order — verify the customer&apos;s ID first
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    You can approve this order after the ID is approved.
                  </p>
                </div>
              </div>
              {can("customers.verify") && customer.verificationStatus === "PENDING" ? (
                <Button asChild>
                  <Link href={`${base}/customers/verify/${customer.id}`}>Review ID</Link>
                </Button>
              ) : null}
            </>
          ) : order.status === "PENDING_APPROVAL" ? (
            <>
              <p className="text-sm">Check the items and delivery location, then approve.</p>
              {can("orders.approve") ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setReject(true)}>
                    Reject
                  </Button>
                  <Button onClick={() => actions.approve(order)}>Approve</Button>
                </div>
              ) : null}
            </>
          ) : order.status === "APPROVED" && order.pendingOffer ? (
            isOfferExpired(order, now) ? (
              <>
                <div>
                  <p className="text-sm font-medium">
                    {offerRider?.name ?? "The rider"} didn&apos;t answer in time
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    The offer expired {timeAgo(order.pendingOffer.expiresAt, now)}. In the live app
                    this happens automatically.
                  </p>
                </div>
                <Button onClick={() => actions.simulateResponse(order, "TIMED_OUT")}>
                  Mark as no response
                </Button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">
                    Waiting for {offerRider?.name ?? "the rider"} to accept
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    Offered {timeAgo(order.pendingOffer.offeredAt, now)} ·{" "}
                    {order.pendingOffer.by === "AUTO" ? "auto-assigned" : "assigned by admin"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.simulateResponse(order, "REJECTED", "TOO_FAR")}
                  >
                    Simulate: rider declines
                  </Button>
                  <Button size="sm" onClick={() => actions.simulateResponse(order, "ACCEPTED")}>
                    Simulate: rider accepts
                  </Button>
                </div>
              </>
            )
          ) : needsRider(order) ? (
            <>
              <div>
                <p className="text-sm font-medium">Needs a rider</p>
                <p className="text-[13px] text-muted-foreground">
                  {settings.dispatchMode === "AUTO"
                    ? "No online rider accepted yet."
                    : "Dispatch is manual — pick a rider."}
                </p>
              </div>
              {can("orders.assign") ? (
                <Button onClick={() => setAssign(true)}>Assign rider</Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm">{ORDER_STATUS_LABELS[order.status]}.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{merchant.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {order.items.map((i) => (
                  <li key={i.productId + i.name} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-6 text-muted-foreground tabular-nums">{i.qty}×</span>
                    <span
                      className={`flex-1 ${i.isUnavailable ? "text-muted-foreground line-through" : ""}`}
                    >
                      {i.name}
                      {i.isFreeGift ? (
                        <Badge tone="brand" className="ml-2">
                          <Gift /> Free gift
                        </Badge>
                      ) : null}
                      {i.isUnavailable ? <Badge className="ml-2">Unavailable</Badge> : null}
                    </span>
                    <span className="tabular-nums">{formatPeso(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t pt-3">
                <Line label="Subtotal" value={formatPeso(order.subtotal)} />
                <Line
                  label={`Delivery fee (${order.distanceKm} km)`}
                  value={formatPeso(order.deliveryFee)}
                />
                {order.couponDiscount ? (
                  <Line
                    label={`Coupon ${order.couponCode}`}
                    value={`−${formatPeso(order.couponDiscount)}`}
                    muted
                  />
                ) : null}
                {order.freeDeliveryDiscount ? (
                  <Line
                    label="Free delivery reward"
                    value={`−${formatPeso(order.freeDeliveryDiscount)}`}
                    muted
                  />
                ) : null}
                {order.pointsDiscount ? (
                  <Line
                    label={`${order.pointsRedeemed} points`}
                    value={`−${formatPeso(order.pointsDiscount)}`}
                    muted
                  />
                ) : null}
                <Line label="Customer pays (cash)" value={formatPeso(order.total)} strong />
                {order.changeFor ? (
                  <Line label="Change for" value={formatPeso(order.changeFor)} muted />
                ) : null}
                <Line
                  label="Rider pays store (est.)"
                  value={formatPeso(order.storeAmountPaid ?? cashNeededAtStore(order.items))}
                  muted
                />
                {order.pointsEarned ? (
                  <Line label="Points earned" value={`+${order.pointsEarned}`} muted />
                ) : null}
              </div>
              {order.notes ? (
                <p className="mt-3 rounded-control bg-subtle px-3 py-2 text-[13px]">
                  Note: {order.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {[...order.timeline].reverse().map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${i === 0 ? "bg-brand" : "bg-zinc-300"}`}
                    />
                    <span className="flex-1">
                      {ORDER_STATUS_LABELS[e.status]}
                      <span className="block text-[13px] text-muted-foreground">
                        {ACTOR[e.actorType]} · {formatDateTime(e.at)}
                        {e.note ? ` · ${e.note}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {order.assignmentAttempts.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Rider offers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {order.assignmentAttempts.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>
                        {riderName(a.riderId)}
                        <span className="block text-[13px] text-muted-foreground">
                          {a.by === "AUTO" ? "Auto" : "Admin"} · {formatDateTime(a.offeredAt)}
                        </span>
                      </span>
                      <Badge
                        tone={
                          a.response === "ACCEPTED" ? "success" : a.response ? "neutral" : "info"
                        }
                      >
                        {a.response === "ACCEPTED"
                          ? "Accepted"
                          : a.response === "WITHDRAWN"
                            ? "Withdrawn"
                            : a.response
                              ? `Declined${a.rejectReason ? `: ${RIDER_REJECT_LABELS[a.rejectReason].toLowerCase()}` : ""}`
                              : "Waiting"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <Link
                href={`${base}/customers/${customer.id}`}
                className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                {customer.name}
              </Link>
              {customer.phone ? (
                <span className="text-muted-foreground">{formatPhMobile(customer.phone)}</span>
              ) : null}
              <span className="text-muted-foreground">{order.deliveryAddressText}</span>
              <span className="mt-1">
                <VerificationBadge status={customer.verificationStatus} />
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rider</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {rider ? (
                <>
                  <span className="font-medium">{rider.name}</span>
                  <span className="text-muted-foreground">{formatPhMobile(rider.phone)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {order.pendingOffer ? `Offered to ${offerRider?.name}` : "Not assigned"}
                </span>
              )}
              {can("orders.assign") && canReassign(order.status) && !needsRider(order) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setAssign(true)}
                >
                  {rider || order.pendingOffer ? "Reassign" : "Assign rider"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
          {can("orders.cancel") && canCancel(order.status, "ADMIN") ? (
            <Button
              variant="ghost"
              className="self-start text-danger"
              onClick={() => setCancel(true)}
            >
              Cancel order
            </Button>
          ) : null}
        </div>
      </div>

      <ReasonSheet
        open={reject}
        onOpenChange={setReject}
        title="Reject this order?"
        description="The customer sees the reason. Coupons and points are given back."
        presets={[
          "Store is closed",
          "Items not available",
          "Outside our delivery area",
          "Suspicious order",
        ]}
        confirmLabel="Reject order"
        destructive
        onSubmit={(r) => actions.reject(order, r)}
      />
      <ReasonSheet
        open={cancel}
        onOpenChange={setCancel}
        title="Cancel this order?"
        description="The customer and rider are told. Coupons and points are given back."
        presets={[
          "Customer asked to cancel",
          "Customer can't be reached",
          "Store can't prepare the order",
          "No rider available",
        ]}
        confirmLabel="Cancel order"
        destructive
        onSubmit={(r) => actions.cancel(order, r)}
      />
      <AssignRiderSheet order={order} open={assign} onOpenChange={setAssign} />
    </>
  );
}
