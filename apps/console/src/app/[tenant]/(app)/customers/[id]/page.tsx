"use client";

import { use, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { ID_TYPE_LABELS } from "@chowlane/types";
import { formatDate, formatDateTime, formatPhMobile } from "@chowlane/lib";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  NumberInput,
  PageHeader,
  Sheet,
  SheetContent,
  Stat,
  VerificationBadge,
  toast,
} from "@chowlane/ui";
import { OrderRow } from "@/components/order-row";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { newId, useConsole } from "@/lib/use-console";

/** S-106 — customer detail: contact, verification, orders, loyalty (+ manual points adjust, ADM-013). */
export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="customers.view">
      <Detail id={id} />
    </RequirePermission>
  );
}

const TX_LABEL: Record<string, string> = {
  POINTS_EARNED: "Points earned",
  POINTS_REDEEMED: "Points used",
  POINTS_REFUNDED: "Points given back",
  POINTS_ADJUSTED: "Points adjusted",
  FREE_DELIVERY_EARNED: "Free delivery earned",
  FREE_DELIVERY_USED: "Free delivery used",
  FREE_DELIVERY_REFUNDED: "Free delivery given back",
  FREE_GIFT_EARNED: "Free gift earned",
  FREE_GIFT_USED: "Free gift claimed",
  FREE_GIFT_REFUNDED: "Free gift given back",
};

function Detail({ id }: { id: string }) {
  const { db, tenant, base, settings, can, me } = useConsole();
  const patch = useMockStore((s) => s.patch);
  const insert = useMockStore((s) => s.insert);
  const [adjust, setAdjust] = useState(false);
  const [delta, setDelta] = useState<number | undefined>();
  const [note, setNote] = useState("");
  const c = db.customers.find((x) => x.id === id && x.tenantId === tenant.id);
  if (!c) return <EmptyState icon={<UserRound />} title="Customer not found" />;

  const now = new Date().toISOString();
  const orders = db.orders
    .filter((o) => o.customerId === c.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const store = (mid: string) => db.merchants.find((m) => m.id === mid)?.name ?? "Store";
  const tx = db.loyaltyTransactions
    .filter((t) => t.customerId === c.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const l = settings.loyalty;
  const validDelta = delta !== undefined && delta !== 0 && c.loyalty.points + delta >= 0;

  return (
    <>
      <PageHeader
        back={{ href: `${base}/customers`, label: "Customers" }}
        title={c.name}
        actions={<VerificationBadge status={c.verificationStatus} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          {l.enabled ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rewards</CardTitle>
                  {can("loyalty.manage") && l.points.enabled ? (
                    <Button variant="outline" size="sm" onClick={() => setAdjust(true)}>
                      Adjust points
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {l.points.enabled ? <Stat label="Points" value={c.loyalty.points} /> : null}
                  {l.freeDelivery.enabled ? (
                    <Stat
                      label="Free deliveries"
                      value={c.loyalty.freeDeliveryRewards}
                      hint={`${c.loyalty.ordersTowardFreeDelivery}/${l.freeDelivery.ordersRequired} to the next`}
                    />
                  ) : null}
                  {l.freeGift.enabled ? (
                    <Stat
                      label="Free gifts"
                      value={c.loyalty.freeGiftRewards}
                      hint={`${c.loyalty.ordersTowardFreeGift}/${l.freeGift.ordersRequired} to the next`}
                    />
                  ) : null}
                </div>
                {tx.length ? (
                  <ul className="divide-y">
                    {tx.slice(0, 8).map((t) => (
                      <li key={t.id} className="flex justify-between gap-3 py-2 text-sm">
                        <span>
                          {TX_LABEL[t.kind]}
                          <span className="block text-[13px] text-muted-foreground">
                            {formatDateTime(t.at)}
                            {t.note ? ` · ${t.note}` : ""}
                          </span>
                        </span>
                        <span className="tabular-nums">
                          {t.points
                            ? `${t.points > 0 ? "+" : ""}${t.points} pts`
                            : `${t.rewards > 0 ? "+" : ""}${t.rewards}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Orders ({orders.length})</CardTitle>
            </CardHeader>
            {orders.length === 0 ? (
              <CardContent>
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              </CardContent>
            ) : (
              <ul className="divide-y border-t">
                {orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    href={`${base}/orders/${o.id}`}
                    customer={c.name}
                    merchant={store(o.merchantId)}
                    now={now}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-5 text-sm">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} src={c.avatarUrl || undefined} />
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-[13px] text-muted-foreground">
                    Since {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>
              {c.phone ? <p>{formatPhMobile(c.phone)}</p> : null}
              {c.email ? <p className="text-muted-foreground">{c.email}</p> : null}
              {c.addresses.map((a) => (
                <p key={a.id} className="text-muted-foreground">
                  {a.label}: {a.line1}, {a.barangay}, {a.cityMunicipality}
                </p>
              ))}
              <p className="text-muted-foreground">
                Location access:{" "}
                {c.locationPermission === "GRANTED"
                  ? "allowed"
                  : c.locationPermission === "DENIED"
                    ? "blocked"
                    : "not asked yet"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2 pt-5 text-sm">
              <p className="font-medium">ID verification</p>
              {c.verification ? (
                <p className="text-muted-foreground">
                  {ID_TYPE_LABELS[c.verification.idType]} · {formatDate(c.verification.submittedAt)}
                  {c.verification.rejectReason ? ` · ${c.verification.rejectReason}` : ""}
                </p>
              ) : (
                <p className="text-muted-foreground">No ID sent yet — asked on the first order.</p>
              )}
              {c.verificationStatus === "PENDING" && can("customers.verify") ? (
                <Button asChild size="sm" className="self-start">
                  <Link href={`${base}/customers/verify/${c.id}`}>Review ID</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={adjust} onOpenChange={setAdjust}>
        <SheetContent
          title="Adjust points"
          description={`${c.name} has ${c.loyalty.points} points.`}
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!validDelta || !note.trim()) return;
              patch("customers", c.id, {
                loyalty: { ...c.loyalty, points: c.loyalty.points + delta! },
              });
              insert("loyaltyTransactions", {
                id: newId("lt"),
                tenantId: tenant.id,
                customerId: c.id,
                kind: "POINTS_ADJUSTED",
                points: delta!,
                rewards: 0,
                at: new Date().toISOString(),
                staffId: me!.id,
                note: note.trim(),
              });
              toast(`Points ${delta! > 0 ? "added" : "removed"}`);
              setAdjust(false);
              setDelta(undefined);
              setNote("");
            }}
          >
            <Field
              label="Points to add (use a minus sign to remove)"
              htmlFor="adj-pts"
              error={
                delta !== undefined && c.loyalty.points + delta < 0
                  ? "Balance can't go below 0."
                  : undefined
              }
            >
              <NumberInput id="adj-pts" value={delta} onChange={setDelta} suffix="pts" />
            </Field>
            <Field
              label="Reason"
              htmlFor="adj-note"
              hint="Saved in the history, e.g. “Late delivery apology”"
            >
              <Input id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Button type="submit" disabled={!validDelta || !note.trim()}>
              Save
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
