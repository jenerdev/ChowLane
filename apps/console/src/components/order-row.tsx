import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Order } from "@chowlane/types";
import { formatPeso, timeAgo } from "@chowlane/lib";
import { OrderStatusBadge } from "@chowlane/ui";

/** One order in a list. */
export function OrderRow({
  order,
  href,
  customer,
  merchant,
  now,
  extra,
}: {
  order: Order;
  href: string;
  customer: string;
  merchant: string;
  now: string;
  extra?: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
            {extra}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
            {customer} · {merchant} · {timeAgo(order.createdAt, now)}
          </span>
        </span>
        <span className="text-sm tabular-nums">{formatPeso(order.total)}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
