"use client";

import Link from "next/link";
import { ChevronRight, Clock, Sparkles } from "lucide-react";
import {
  canTimeOut,
  computeRiderPay,
  formatDateTime,
  formatPeso,
  manilaDateKey,
  ORDER_STATUS_LABELS,
} from "@chowlane/lib";
import { Button, Card, CardContent, EmptyState, OrderStatusBadge, Stat, toast } from "@chowlane/ui";
import { useRouter } from "next/navigation";
import { OfferCard } from "@/components/offer-card";
import { useNow, useRider } from "@/lib/use-rider";
import { useRiderActions } from "@/lib/use-rider-actions";

const NEXT_STEP: Partial<Record<string, string>> = {
  ASSIGNED: "Go to the store and order",
  AT_MERCHANT: "Pay the store and pick up",
  PICKED_UP: "Deliver to the customer",
};

/** S-201 — time in / out, incoming offer, active order, today's numbers (RID-002…004). */
export default function RiderHome() {
  const router = useRouter();
  const { me, db, offer, active, shift, rule, base } = useRider();
  const actions = useRiderActions();
  const nowMs = useNow();
  if (!me) return null;

  const today = manilaDateKey(new Date(nowMs).toISOString());
  const deliveredToday = db.orders.filter(
    (o) =>
      o.riderId === me.id &&
      o.status === "DELIVERED" &&
      o.cashCollectedAt &&
      manilaDateKey(o.cashCollectedAt) === today,
  );
  const shiftsToday = db.shifts.filter(
    (s) => s.riderId === me.id && manilaDateKey(s.timeIn) === today,
  );
  const earnedToday = computeRiderPay({
    rule,
    deliveredOrderFees: deliveredToday.map((o) => o.deliveryFee),
    shiftTimeIns: shiftsToday.map((s) => s.timeIn),
  });
  const store = active ? db.merchants.find((m) => m.id === active.merchantId) : undefined;
  const devTools = process.env.NEXT_PUBLIC_DEV_TOOLS !== "0";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Hi, {me.name.split(" ")[0]}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {me.isOnShift && shift
            ? `On shift since ${formatDateTime(shift.timeIn)}`
            : "You're off shift."}
        </p>
      </div>

      {!me.isOnShift ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <p className="text-sm">
              Time in to start getting orders. Keep this app open while you&apos;re on shift so
              dispatch can see where you are.
            </p>
            <Button size="lg" onClick={() => void actions.timeIn()}>
              <Clock /> Time in
            </Button>
          </CardContent>
        </Card>
      ) : active ? (
        <Link href={`${base}/active`}>
          <Card className="transition-colors hover:border-zinc-400">
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{active.orderNumber}</span>
                  <OrderStatusBadge status={active.status} />
                </div>
                <p className="mt-1 text-sm">
                  {NEXT_STEP[active.status] ?? ORDER_STATUS_LABELS[active.status]}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {store?.name} · collect {formatPeso(active.total)}
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ) : offer ? (
        <OfferCard order={offer} />
      ) : (
        <Card>
          <CardContent className="pt-1">
            <EmptyState
              icon={<Clock />}
              title="Waiting for orders"
              description="New offers appear here. You'll have a short time to accept."
              className="py-8"
              action={
                devTools ? (
                  <Button variant="outline" size="sm" onClick={actions.simulateOffer}>
                    <Sparkles /> Simulate a new offer (prototype)
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Delivered today" value={deliveredToday.length} />
        <Stat
          label="Earned today"
          value={formatPeso(earnedToday)}
          hint={rule?.mode === "DAILY" ? "Daily rate" : undefined}
        />
      </div>

      {me.isOnShift ? (
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            const check = canTimeOut(me, db.orders);
            if (!check.ok) return void toast(check.reason, "error");
            router.push(`${base}/time-out`);
          }}
        >
          Time out
        </Button>
      ) : null}
    </div>
  );
}
