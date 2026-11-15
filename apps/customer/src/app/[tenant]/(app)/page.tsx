"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, Store } from "lucide-react";
import { ACTIVE_ORDER_STATUSES, customerStatusMessage } from "@chowlane/lib";
import { Badge, EmptyState, Input, OrderStatusBadge, cn } from "@chowlane/ui";
import { MerchantTile } from "@/components/merchant-tile";
import { useCustomer } from "@/lib/use-customer";

/** S-302 — branded home: active order, search, categories, restaurants, rewards teaser (CUS-003). */
export default function CustomerHome() {
  const { db, tenant, settings, me, base } = useCustomer();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  if (!me) return null;

  const merchants = db.merchants.filter((m) => m.tenantId === tenant.id && m.status === "ACTIVE");
  const categories = [...new Set(merchants.map((m) => m.category))];
  const products = db.products.filter((p) => p.tenantId === tenant.id);
  const term = q.trim().toLowerCase();
  const list = merchants
    .filter((m) => !cat || m.category === cat)
    .filter(
      (m) =>
        !term ||
        `${m.name} ${m.category}`.toLowerCase().includes(term) ||
        products.some((p) => p.merchantId === m.id && p.name.toLowerCase().includes(term)),
    )
    .sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || a.name.localeCompare(b.name));
  const active = db.orders
    .filter((o) => o.customerId === me.id && ACTIVE_ORDER_STATUSES.includes(o.status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const l = settings.loyalty;

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tight">Hi, {me.name.split(" ")[0]}</h1>
      <p className="text-sm text-muted-foreground">What are you craving today?</p>

      {active ? (
        <Link
          href={`${base}/orders/${active.id}`}
          className="mt-5 flex items-center gap-3 rounded-card border p-4 hover:bg-subtle"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              {active.orderNumber} <OrderStatusBadge status={active.status} />
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
              {customerStatusMessage(active, me)}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      ) : null}

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search food or restaurants"
          aria-label="Search"
          className="pl-9"
        />
      </div>

      {categories.length > 1 ? (
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-3.5 text-sm",
                cat === c ? "border-zinc-900 bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              {c ?? "All"}
            </button>
          ))}
        </div>
      ) : null}

      {l.enabled && (l.points.enabled || l.freeDelivery.enabled || l.freeGift.enabled) ? (
        <Link
          href={`${base}/rewards`}
          className="mt-5 block rounded-card bg-brand-soft p-4 text-sm"
        >
          <span className="font-medium text-brand">
            {l.points.enabled ? `${me.loyalty.points} points` : "Rewards"}
            {me.loyalty.freeDeliveryRewards
              ? ` · ${me.loyalty.freeDeliveryRewards} free delivery`
              : ""}
            {me.loyalty.freeGiftRewards ? ` · ${me.loyalty.freeGiftRewards} free gift` : ""}
          </span>
          <span className="mt-0.5 block text-muted-foreground">
            {l.freeDelivery.enabled
              ? `${l.freeDelivery.ordersRequired - me.loyalty.ordersTowardFreeDelivery} more orders to your next free delivery`
              : l.freeGift.enabled
                ? `${l.freeGift.ordersRequired - me.loyalty.ordersTowardFreeGift} more orders to a ${l.freeGift.giftName}`
                : "Earn points on every order"}
          </span>
        </Link>
      ) : null}

      <h2 className="mt-7 mb-2 text-[13px] font-medium text-muted-foreground">Restaurants</h2>
      {list.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title={term || cat ? "Nothing matches" : "No restaurants yet"}
          className="py-10"
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {list.map((m) => (
            <li key={m.id}>
              <Link
                href={`${base}/m/${m.id}`}
                aria-disabled={!m.isOpen}
                className={cn(
                  "-mx-2 flex items-center gap-3 rounded-card p-2 hover:bg-subtle",
                  !m.isOpen && "opacity-60",
                )}
              >
                <MerchantTile name={m.name} photoUrl={m.photoUrl || undefined} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{m.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {m.category}
                  </span>
                </span>
                {m.isOpen ? null : <Badge>Closed</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
