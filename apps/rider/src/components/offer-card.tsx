"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, MapPin, Store, Wallet } from "lucide-react";
import type { Order } from "@chowlane/types";
import {
  cashNeededAtStore,
  dropOffArea,
  formatPeso,
  haversineKm,
  offerEarning,
  offerSecondsLeft,
} from "@chowlane/lib";
import { Button, Card, CardContent, cn } from "@chowlane/ui";
import { useRider, useTicker } from "@/lib/use-rider";
import { useRiderActions } from "@/lib/use-rider-actions";
import { RejectSheet } from "./reject-sheet";

/** Incoming order offer with countdown, cash needed and accept / decline (RID-004, RID-011, BL-5). */
export function OfferCard({ order, full = false }: { order: Order; full?: boolean }) {
  const { db, me, rule, base } = useRider();
  const actions = useRiderActions();
  const nowMs = useTicker(1000);
  const [rejecting, setRejecting] = useState(false);
  const secondsLeft = offerSecondsLeft(order, nowMs);
  const total = order.pendingOffer
    ? (Date.parse(order.pendingOffer.expiresAt) - Date.parse(order.pendingOffer.offeredAt)) / 1000
    : 60;
  const merchant = db.merchants.find((m) => m.id === order.merchantId);
  const earning = offerEarning(rule, order.deliveryFee);
  const toStore =
    me?.lastLocation && merchant ? haversineKm(me.lastLocation, merchant.location) : undefined;

  useEffect(() => {
    if (secondsLeft === 0 && order.pendingOffer) actions.expire(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when the countdown reaches 0
  }, [secondsLeft === 0, order.id]);

  return (
    <Card className="overflow-hidden border-zinc-900">
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-brand transition-[width] duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / Math.max(1, total)) * 100}%` }}
        />
      </div>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold">New order</p>
          <span
            className={cn(
              "flex items-center gap-1 text-sm tabular-nums",
              secondsLeft <= 10 && "text-danger",
            )}
          >
            <Clock className="size-4" /> {secondsLeft}s
          </span>
        </div>
        <ul className="flex flex-col gap-2.5 text-sm">
          <li className="flex gap-3">
            <Store className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              {merchant?.name}
              <span className="block text-[13px] text-muted-foreground">
                {merchant?.address}
                {toStore !== undefined ? ` · ${toStore.toFixed(1)} km from you` : ""}
              </span>
            </span>
          </li>
          <li className="flex gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              {dropOffArea(order)}
              <span className="block text-[13px] text-muted-foreground">
                {order.distanceKm} km from the store
              </span>
            </span>
          </li>
          <li className="flex gap-3">
            <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              Cash needed at store:{" "}
              <span className="font-semibold tabular-nums">
                {formatPeso(cashNeededAtStore(order.items))}
              </span>
              <span className="block text-[13px] text-muted-foreground">
                You collect {formatPeso(order.total)} ·{" "}
                {earning === null ? "paid by your daily rate" : `you earn ${formatPeso(earning)}`}
              </span>
            </span>
          </li>
        </ul>
        {full ? (
          <ul className="divide-y rounded-control border text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3 px-3 py-2">
                <span>
                  {i.qty}× {i.name}
                  {i.isFreeGift ? " (free gift)" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Link
            href={`${base}/orders/${order.id}`}
            className="-mt-1 text-[13px] text-muted-foreground underline decoration-border underline-offset-4"
          >
            See items ({order.items.length})
          </Link>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setRejecting(true)}>
            Decline
          </Button>
          <Button size="lg" className="flex-1" onClick={() => actions.accept(order)}>
            Accept
          </Button>
        </div>
      </CardContent>
      <RejectSheet
        open={rejecting}
        onOpenChange={setRejecting}
        onSubmit={(r, n) => actions.reject(order, r, n)}
      />
    </Card>
  );
}
