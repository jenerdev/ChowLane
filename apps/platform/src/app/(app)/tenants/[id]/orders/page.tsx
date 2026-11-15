"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ReceiptText, Search } from "lucide-react";
import { formatPeso, timeAgo } from "@chowlane/lib";
import { EmptyState, Input, OrderStatusBadge } from "@chowlane/ui";
import { ReadOnlyNote } from "@/components/read-only-note";
import { useTenantRecords } from "@/lib/use-tenant";

/** S-505 — tenant orders (read-only, PLT-006). */
export default function TenantOrders() {
  const r = useTenantRecords();
  const [q, setQ] = useState("");
  if (!r.tenant) return null;
  const name = (id: string) => r.customers.find((c) => c.id === id)?.name ?? "Customer";
  const store = (id: string) => r.merchants.find((m) => m.id === id)?.name ?? "Store";
  const list = r.orders.filter((o) =>
    `${o.orderNumber} ${name(o.customerId)} ${store(o.merchantId)}`
      .toLowerCase()
      .includes(q.trim().toLowerCase()),
  );
  return (
    <>
      <ReadOnlyNote />
      <div className="relative mb-4 md:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Order, customer, store"
          aria-label="Search orders"
          className="pl-9"
        />
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={q ? "No orders match your search" : "No orders yet"}
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((o) => (
            <li key={o.id}>
              <Link
                href={`/tenants/${r.tenant!.id}/orders/${o.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {name(o.customerId)} · {store(o.merchantId)} · {timeAgo(o.createdAt, r.now)}
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatPeso(o.total)}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
