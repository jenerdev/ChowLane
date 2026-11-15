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
import { useConsole } from "@/lib/use-console";
import { useOrderActions } from "@/lib/use-order-actions";

/** Pick an online rider for an order (ADM-004). Nearest first; busy / declined riders shown but not selectable. */
export function AssignRiderSheet({
  order,
  open,
  onOpenChange,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { db, tenant, settings } = useConsole();
  const actions = useOrderActions();
  const merchant = db.merchants.find((m) => m.id === order.merchantId)!;
  const declined = declinedRiderIds(order);
  const onShift = db.riders.filter(
    (r) => r.tenantId === tenant.id && r.status === "ACTIVE" && r.isOnShift,
  );
  const offered = ridersWithOpenOffers(db.orders, order.id);
  const eligible = new Set(eligibleRiders(onShift, offered).map((r) => r.id));
  const dist = (r: (typeof onShift)[number]) =>
    r.lastLocation ? haversineKm(r.lastLocation, merchant.location) : Infinity;
  const list = [...onShift].sort(
    (a, b) => Number(eligible.has(b.id)) - Number(eligible.has(a.id)) || dist(a) - dist(b),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={order.riderId ? "Reassign rider" : "Assign a rider"}
        description={`Cash needed at ${merchant.name}: ${formatPeso(cashNeededAtStore(order.items))}. The rider gets ${settings.riderResponseTimeoutSec} seconds to accept.`}
      >
        {list.length === 0 ? (
          <EmptyState
            icon={<Bike />}
            title="No riders on shift"
            description="Riders appear here when they time in."
            className="py-6"
          />
        ) : (
          <ul className="-mx-2 flex flex-col">
            {list.map((r) => {
              const can = eligible.has(r.id) && r.id !== order.riderId;
              const why =
                r.id === order.riderId
                  ? "Current rider"
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
                    onClick={() => {
                      if (actions.assign(order, r.id)) onOpenChange(false);
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
