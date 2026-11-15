"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ReceiptText } from "lucide-react";
import { ACTIVE_ORDER_STATUSES, formatDateTime, formatPeso } from "@chowlane/lib";
import {
  Button,
  EmptyState,
  OrderStatusBadge,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from "@chowlane/ui";
import { useCart } from "@/lib/cart";
import { useCustomer } from "@/lib/use-customer";

/** S-308 — active and past orders, reorder (CUS-009). */
export default function MyOrdersPage() {
  const router = useRouter();
  const { db, me, base, slug } = useCustomer();
  const cart = useCart(slug);
  const [tab, setTab] = useState<"active" | "past">("active");
  if (!me) return null;

  const mine = db.orders
    .filter((o) => o.customerId === me.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const active = mine.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));
  const past = mine.filter((o) => !ACTIVE_ORDER_STATUSES.includes(o.status));
  const list = tab === "active" ? active : past;
  const store = (id: string) => db.merchants.find((m) => m.id === id);

  const reorder = (orderId: string) => {
    const o = mine.find((x) => x.id === orderId)!;
    const lines = o.items
      .filter((i) => !i.isFreeGift && db.products.find((p) => p.id === i.productId)?.isAvailable)
      .map((i) => ({ productId: i.productId, qty: i.qty }));
    if (!lines.length) {
      toast("Those items aren't available right now", "error");
      return;
    }
    cart.replace(o.merchantId, lines);
    toast("Added to your cart");
    router.push(`${base}/cart`);
  };

  return (
    <>
      <PageHeader title="My orders" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList className="w-auto">
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={tab === "active" ? "No active orders" : "No past orders yet"}
          action={
            tab === "active" ? (
              <Button asChild>
                <Link href={base}>Order food</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y">
          {list.map((o) => (
            <li key={o.id} className="flex items-center gap-3 py-3">
              <Link
                href={`${base}/orders/${o.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {store(o.merchantId)?.name} <OrderStatusBadge status={o.status} />
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    {o.orderNumber} · {formatDateTime(o.createdAt)} · {formatPeso(o.total)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              {o.status === "DELIVERED" ? (
                <Button variant="outline" size="sm" onClick={() => reorder(o.id)}>
                  Reorder
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
