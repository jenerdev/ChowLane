"use client";

import { useState } from "react";
import { ReceiptText, Search } from "lucide-react";
import type { OrderStatus } from "@chowlane/types";
import { isOfferExpired, needsRider } from "@chowlane/lib";
import { Badge, EmptyState, Input, PageHeader, Tabs, TabsList, TabsTrigger } from "@chowlane/ui";
import { OrderRow } from "@/components/order-row";
import { RequirePermission } from "@/components/require-permission";
import { loadOrderList } from "@/lib/orders";
import { useConsole, useNow } from "@/lib/use-console";
import { useAutoReload, useLive } from "@/lib/use-live";

const GROUPS: Record<string, OrderStatus[]> = {
  approve: ["PENDING_APPROVAL"],
  active: ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"],
  done: ["DELIVERED"],
  closed: ["REJECTED", "CANCELLED"],
};

/** S-102 — orders by stage (ADM-003). Live since 2.5; refreshes every 20 s until Realtime (2.6). */
export default function OrdersPage() {
  return (
    <RequirePermission perm="orders.view">
      <Orders />
    </RequirePermission>
  );
}

function Orders() {
  const { live, base } = useConsole();
  const [tab, setTab] = useState<keyof typeof GROUPS>("approve");
  const [q, setQ] = useState("");
  const now = new Date(useNow()).toISOString();
  const data = useLive(`orders:${live.id}`, (sb) => loadOrderList(sb, live.id));
  useAutoReload(data.reload);
  const rows = data.data ?? [];
  const list = rows
    .filter((r) => GROUPS[tab]!.includes(r.order.status))
    .filter((r) =>
      `${r.order.orderNumber} ${r.customer.name} ${r.merchant}`
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
    );
  const count = (k: keyof typeof GROUPS) =>
    rows.filter((r) => GROUPS[k]!.includes(r.order.status)).length;

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as keyof typeof GROUPS)}>
          <TabsList className="w-auto">
            <TabsTrigger value="approve">To approve ({count("approve")})</TabsTrigger>
            <TabsTrigger value="active">Active ({count("active")})</TabsTrigger>
            <TabsTrigger value="done">Delivered ({count("done")})</TabsTrigger>
            <TabsTrigger value="closed">Rejected & cancelled ({count("closed")})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order, customer, store"
            aria-label="Search orders"
            className="pl-9"
          />
        </div>
      </div>
      {data.error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          Couldn&apos;t load orders: {data.error}
        </p>
      ) : null}
      {data.loading ? null : list.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={
            q
              ? "No orders match your search"
              : tab === "approve"
                ? "Nothing to approve"
                : "No orders here"
          }
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map(({ order: o, customer, merchant }) => (
            <OrderRow
              key={o.id}
              order={o}
              href={`${base}/orders/${o.id}`}
              customer={customer.name}
              merchant={merchant}
              now={now}
              extra={
                o.status === "PENDING_APPROVAL" && customer.verificationStatus === "PENDING" ? (
                  <Badge tone="warning">ID to verify</Badge>
                ) : needsRider(o) ? (
                  <Badge tone="danger">Needs rider</Badge>
                ) : o.pendingOffer && isOfferExpired(o, now) ? (
                  <Badge tone="warning">Offer expired</Badge>
                ) : o.pendingOffer ? (
                  <Badge tone="info">Offered</Badge>
                ) : null
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}
