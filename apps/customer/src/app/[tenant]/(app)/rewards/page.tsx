"use client";

import { Gift } from "lucide-react";
import { formatDateTime, formatPeso } from "@chowlane/lib";
import { EmptyState, PageHeader, Progress } from "@chowlane/ui";
import { useCustomer } from "@/lib/use-customer";

const LABEL: Record<string, string> = {
  POINTS_EARNED: "Points earned",
  POINTS_REDEEMED: "Points used",
  POINTS_REFUNDED: "Points given back",
  POINTS_ADJUSTED: "Points adjusted by the store",
  FREE_DELIVERY_EARNED: "Free delivery earned",
  FREE_DELIVERY_USED: "Free delivery used",
  FREE_DELIVERY_REFUNDED: "Free delivery given back",
  FREE_GIFT_EARNED: "Free gift earned",
  FREE_GIFT_USED: "Free gift claimed",
  FREE_GIFT_REFUNDED: "Free gift given back",
};

/** S-310 — rewards: points, progress to free delivery / free gift, history (CUS-014, F-15). */
export default function RewardsPage() {
  const { db, me, settings } = useCustomer();
  if (!me) return null;
  const l = settings.loyalty;
  if (!l.enabled)
    return (
      <EmptyState
        icon={<Gift />}
        title="No rewards right now"
        description="This store doesn't run a rewards program at the moment."
      />
    );

  const tx = db.loyaltyTransactions
    .filter((t) => t.customerId === me.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const p = l.points;

  return (
    <>
      <PageHeader title="Rewards" description="Earned on every delivered order." />
      <div className="flex flex-col gap-4">
        {p.enabled ? (
          <section className="rounded-card border p-5">
            <p className="text-[13px] text-muted-foreground">Your points</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {me.loyalty.points}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Worth {formatPeso(me.loyalty.points * p.pointValue)} on food
            </p>
            <p className="mt-4 text-sm">
              {p.earnMode === "PER_ORDER"
                ? `Earn ${p.pointsPerOrder} points per delivered order.`
                : `Earn 1 point for every ${formatPeso(p.centavosPerPoint)} spent on food.`}{" "}
              Use them at checkout once you have {p.minRedeemPoints} — up to {p.maxRedeemPercent}%
              of your food. Points never expire.
            </p>
          </section>
        ) : null}
        {l.freeDelivery.enabled ? (
          <section className="rounded-card border p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Free delivery</span>
              <span className="text-muted-foreground tabular-nums">
                {me.loyalty.ordersTowardFreeDelivery}/{l.freeDelivery.ordersRequired} orders
              </span>
            </div>
            <Progress
              value={me.loyalty.ordersTowardFreeDelivery / l.freeDelivery.ordersRequired}
              className="mt-3"
              label="Progress to free delivery"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {me.loyalty.freeDeliveryRewards
                ? `You have ${me.loyalty.freeDeliveryRewards} free ${me.loyalty.freeDeliveryRewards === 1 ? "delivery" : "deliveries"} — turn it on at checkout.`
                : `${l.freeDelivery.ordersRequired - me.loyalty.ordersTowardFreeDelivery} more orders to go.`}
            </p>
          </section>
        ) : null}
        {l.freeGift.enabled ? (
          <section className="rounded-card border p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{l.freeGift.giftName}</span>
              <span className="text-muted-foreground tabular-nums">
                {me.loyalty.ordersTowardFreeGift}/{l.freeGift.ordersRequired} orders
              </span>
            </div>
            <Progress
              value={me.loyalty.ordersTowardFreeGift / l.freeGift.ordersRequired}
              className="mt-3"
              label="Progress to free gift"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {me.loyalty.freeGiftRewards
                ? `You have ${me.loyalty.freeGiftRewards} to claim at checkout.`
                : `${l.freeGift.ordersRequired - me.loyalty.ordersTowardFreeGift} more orders to go.`}
            </p>
          </section>
        ) : null}
      </div>

      <h2 className="mt-8 mb-2 text-[13px] font-medium text-muted-foreground">History</h2>
      {tx.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing yet — your first delivered order starts it.
        </p>
      ) : (
        <ul className="divide-y">
          {tx.map((t) => (
            <li key={t.id} className="flex justify-between gap-3 py-2.5 text-sm">
              <span>
                {LABEL[t.kind]}
                <span className="block text-[13px] text-muted-foreground">
                  {formatDateTime(t.at)}
                  {t.note ? ` · ${t.note}` : ""}
                </span>
              </span>
              <span className="tabular-nums">
                {t.points
                  ? `${t.points > 0 ? "+" : ""}${t.points}`
                  : `${t.rewards > 0 ? "+" : ""}${t.rewards}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
