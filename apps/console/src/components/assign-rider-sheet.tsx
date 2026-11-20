"use client";

import type { Order } from "@chowlane/types";
import {
  cashNeededAtStore,
  declinedRiderIds,
  eligibleRiders,
  formatPeso,
  haversineKm,
  RIDER_REJECT_LABELS,
  ridersWithOpenOffers,
} from "@chowlane/lib";
import { Avatar, Badge, EmptyState, Sheet, SheetContent } from "@chowlane/ui";
import { Bike } from "lucide-react";
import { loadDispatch } from "@/lib/dispatch";
import { useOrderOps } from "@/lib/orders";
import { useConsole } from "@/lib/use-console";
import { useLive } from "@/lib/use-live";

/**
 * Pick an online rider for an order (ADM-004). Nearest first; busy / declined riders shown but not selectable.
 * Loads the business's riders and open offers itself; `assign_order` re-checks that the rider is free (BL-5.10/5.12).
 */
export function AssignRiderSheet({
  order,
  open,
  onOpenChange,
  onAssigned,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAssigned?: () => void;
}) {
  const { live } = useConsole();
  const ops = useOrderOps();
  const data = useLive(`assign:${order.id}`, (sb) => loadDispatch(sb, live.id));
  const d = data.data;
  const merchant = d?.merchants.find((m) => m.id === order.merchantId);
  const declined = declinedRiderIds(order);
  const onShift = (d?.riders ?? []).filter((r) => r.status === "ACTIVE" && r.isOnShift);
  const offered = ridersWithOpenOffers(d?.orders ?? [], order.id);
  const eligible = new Set(eligibleRiders(onShift, offered).map((r) => r.id));
  const dist = (r: (typeof onShift)[number]) =>
    r.lastLocation && merchant ? haversineKm(r.lastLocation, merchant.location) : Infinity;
  const list = [...onShift].sort(
    (a, b) => Number(eligible.has(b.id)) - Number(eligible.has(a.id)) || dist(a) - dist(b),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={order.riderId ? "Reassign rider" : "Assign a rider"}
        description={`Cash needed at ${merchant?.name ?? "the store"}: ${formatPeso(cashNeededAtStore(order.items))}.${d ? ` The rider gets ${d.settings.riderResponseTimeoutSec} seconds to accept.` : ""}`}
      >
        {!d ? null : list.length === 0 ? (
          <EmptyState
            icon={<Bike />}
            title="No riders on shift"
            description="Riders appear here when they time in."
            className="py-6"
          />
        ) : (
          <ul className="-mx-2 flex flex-col">
            {list.map((r) => {
              const can =
                eligible.has(r.id) &&
                r.id !== order.riderId &&
                r.id !== order.pendingOffer?.riderId;
              const why =
                r.id === order.riderId
                  ? "Current rider"
                  : r.id === order.pendingOffer?.riderId
                    ? "Offered now"
                    : r.activeOrderId
                      ? "On another order"
                      : offered.includes(r.id)
                        ? "Has an open offer"
                        : null;
              const prev = order.assignmentAttempts
                .filter(
                  (a) =>
                    a.riderId === r.id && (a.response === "REJECTED" || a.response === "TIMED_OUT"),
                )
                .at(-1);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={!can}
                    onClick={async () => {
                      if (await ops.assign(order.id, r.id, r.name)) {
                        onOpenChange(false);
                        onAssigned?.();
                      } else await data.reload();
                    }}
                    className="flex w-full items-center gap-3 rounded-control px-2 py-2.5 text-left enabled:hover:bg-muted disabled:opacity-50"
                  >
                    <Avatar name={r.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{r.name}</span>
                      <span className="block text-[13px] text-muted-foreground">
                        {r.vehicleType.toLowerCase()} ·{" "}
                        {Number.isFinite(dist(r))
                          ? `${dist(r).toFixed(1)} km from store`
                          : "location unknown"}
                        {declined.includes(r.id) && prev?.rejectReason
                          ? ` · declined: ${RIDER_REJECT_LABELS[prev.rejectReason].toLowerCase()}`
                          : ""}
                      </span>
                    </span>
                    {why ? <Badge>{why}</Badge> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
