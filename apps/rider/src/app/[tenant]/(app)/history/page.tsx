"use client";

import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { formatDateTime, formatPeso } from "@chowlane/lib";
import { EmptyState, OrderStatusBadge, PageHeader } from "@chowlane/ui";
import { useRider } from "@/lib/use-rider";

/** Past deliveries of the signed-in rider (RID-008). */
export default function RiderHistory() {
  const { me, db, base } = useRider();
  if (!me) return null;
  const list = db.orders
    .filter((o) => o.riderId === me.id && (o.status === "DELIVERED" || o.status === "CANCELLED"))
    .sort((a, b) => Date.parse(b.timeline.at(-1)!.at) - Date.parse(a.timeline.at(-1)!.at));
  const store = (id: string) => db.merchants.find((m) => m.id === id)?.name ?? "Store";

  return (
    <>
      <PageHeader title="History" />
      {list.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No deliveries yet"
          description="Finished deliveries show up here."
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((o) => (
            <li key={o.id}>
              <Link
                href={`${base}/orders/${o.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {o.orderNumber} <OrderStatusBadge status={o.status} />
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {store(o.merchantId)} · {formatDateTime(o.timeline.at(-1)!.at)}
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatPeso(o.total)}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
