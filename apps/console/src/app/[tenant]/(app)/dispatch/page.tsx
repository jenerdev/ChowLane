"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Route } from "lucide-react";
import type { DispatchMode, Order } from "@chowlane/types";
import { cashNeededAtStore, formatPeso, isOfferExpired, needsRider, timeAgo } from "@chowlane/lib";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  RadioCards,
  Stat,
  toast,
} from "@chowlane/ui";
import { AssignRiderSheet } from "@/components/assign-rider-sheet";
import { RequirePermission } from "@/components/require-permission";
import { loadDispatch } from "@/lib/dispatch";
import { useSaveSettings } from "@/lib/settings";
import { useConsole, useNow } from "@/lib/use-console";
import { useAutoReload, useLive } from "@/lib/use-live";

/** S-121 — dispatch mode (AUTO / MANUAL) + orders that need a rider (ADM-004, ADM-010, BL-5). Live since 2.6. */
export default function DispatchPage() {
  return (
    <RequirePermission perm="orders.assign">
      <Dispatch />
    </RequirePermission>
  );
}

function Dispatch() {
  const { live, base, can } = useConsole();
  const saveSettings = useSaveSettings();
  const [assigning, setAssigning] = useState<Order | null>(null);
  const nowMs = useNow();
  const data = useLive(`dispatch:${live.id}`, (sb) => loadDispatch(sb, live.id));
  useAutoReload(data.reload);
  if (!data.data)
    return data.loading ? null : (
      <EmptyState icon={<Route />} title="Couldn't load dispatch" description={data.error} />
    );
  const { orders, merchants, settings } = data.data;
  const now = new Date(nowMs).toISOString();
  const needs = orders.filter(needsRider);
  const waiting = orders.filter((o) => o.status === "APPROVED" && o.pendingOffer);
  const riders = data.data.riders.filter((r) => r.status === "ACTIVE" && r.isOnShift);
  const offered = new Set(orders.flatMap((o) => (o.pendingOffer ? [o.pendingOffer.riderId] : [])));
  const free = riders.filter((r) => !r.activeOrderId && !offered.has(r.id)).length;
  const store = (id: string) => merchants.find((m) => m.id === id)?.name ?? "Store";
  const riderName = (id?: string) => data.data?.riders.find((r) => r.id === id)?.name ?? "rider";

  return (
    <>
      <PageHeader title="Dispatch" description="Get approved orders to online riders." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Need a rider" value={needs.length} />
        <Stat label="Waiting for rider" value={waiting.length} />
        <Stat label="Free riders" value={`${free}/${riders.length}`} />
      </div>

      {can("settings.dispatch") ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How orders reach riders</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioCards<DispatchMode>
              name="dispatch"
              columns={2}
              value={settings.dispatchMode}
              onChange={async (m) => {
                const error = await saveSettings({ dispatchMode: m });
                await data.reload();
                toast(
                  error
                    ? `Couldn't save: ${error}`
                    : m === "AUTO"
                      ? "Auto assign is on"
                      : "Manual assign is on",
                );
              }}
              options={[
                {
                  value: "AUTO",
                  label: "Auto assign",
                  description: `Offered to the nearest free rider. ${settings.riderResponseTimeoutSec}s to accept, then the next.`,
                },
                {
                  value: "MANUAL",
                  label: "Manual assign",
                  description: "You pick a rider for each order. Declined orders come back here.",
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      <h2 className="mb-2 text-[13px] font-medium text-muted-foreground">Needs a rider</h2>
      {needs.length === 0 ? (
        <EmptyState
          icon={<CircleCheck />}
          title="Every approved order has a rider"
          className="py-8"
        />
      ) : (
        <ul className="mb-8 divide-y rounded-card border">
          {needs.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`${base}/orders/${o.id}`} className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{o.orderNumber}</span>
                <span className="block truncate text-[13px] text-muted-foreground">
                  {store(o.merchantId)} · cash needed {formatPeso(cashNeededAtStore(o.items))} ·{" "}
                  {timeAgo(o.createdAt, now)}
                  {o.assignmentAttempts.length
                    ? ` · declined by ${o.assignmentAttempts.filter((a) => a.response === "REJECTED" || a.response === "TIMED_OUT").length}`
                    : ""}
                </span>
              </Link>
              <Button size="sm" onClick={() => setAssigning(o)}>
                Assign
              </Button>
            </li>
          ))}
        </ul>
      )}

      {waiting.length ? (
        <>
          <h2 className="mt-8 mb-2 text-[13px] font-medium text-muted-foreground">
            Waiting for the rider to accept
          </h2>
          <ul className="divide-y rounded-card border">
            {waiting.map((o) => (
              <li key={o.id}>
                <Link
                  href={`${base}/orders/${o.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{o.orderNumber}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      Offered to {riderName(o.pendingOffer?.riderId)} ·{" "}
                      {timeAgo(o.pendingOffer!.offeredAt, now)}
                    </span>
                  </span>
                  {isOfferExpired(o, now) ? (
                    <Badge tone="warning">Expired</Badge>
                  ) : (
                    <Badge tone="info">{o.pendingOffer?.by === "AUTO" ? "Auto" : "Manual"}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {assigning ? (
        <AssignRiderSheet
          order={assigning}
          open
          onOpenChange={(o) => !o && setAssigning(null)}
          onAssigned={() => void data.reload()}
        />
      ) : null}
    </>
  );
}
