"use client";

import { useState } from "react";
import { ReceiptText, Search } from "lucide-react";
import type { OrderStatus } from "@chowlane/types";
import { isOfferExpired, needsRider } from "@chowlane/lib";
import { Badge, EmptyState, Input, PageHeader, Tabs, TabsList, TabsTrigger } from "@chowlane/ui";
import { OrderRow } from "@/components/order-row";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";

const GROUPS: Record<string, OrderStatus[]> = {
  approve: ["PENDING_APPROVAL"],
  active: ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"],
  done: ["DELIVERED"],
  closed: ["REJECTED", "CANCELLED"],
};

/** S-102 — orders by stage (ADM-003). */
export default function OrdersPage() {
  return (
    <RequirePermission perm="orders.view">
      <Orders />
    </RequirePermission>
  );
}

function Orders() {
  const { db, tenant, base } = useConsole();
  const [tab, setTab] = useState<keyof typeof GROUPS>("approve");
  const [q, setQ] = useState("");
  const now = new Date().toISOString();
  const orders = db.orders
    .filter((o) => o.tenantId === tenant.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const name = (id: string) => db.customers.find((c) => c.id === id)?.name ?? "Customer";
  const store = (id: string) => db.merchants.find((m) => m.id === id)?.name ?? "Store";
  const list = orders
    .filter((o) => GROUPS[tab]!.includes(o.status))
    .filter((o) =>
      `${o.orderNumber} ${name(o.customerId)} ${store(o.merchantId)}`
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
    );
  const count = (k: keyof typeof GROUPS) =>
    orders.filter((o) => GROUPS[k]!.includes(o.status)).length;

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
      {list.length === 0 ? (
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
          {list.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              href={`${base}/orders/${o.id}`}
              customer={name(o.customerId)}
              merchant={store(o.merchantId)}
              now={now}
              extra={
                o.status === "PENDING_APPROVAL" &&
                db.customers.find((c) => c.id === o.customerId)?.verificationStatus ===
                  "PENDING" ? (
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
