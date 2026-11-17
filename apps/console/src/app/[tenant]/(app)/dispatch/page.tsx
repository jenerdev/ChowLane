"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
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
import { useSaveSettings } from "@/lib/settings";
import { useConsole } from "@/lib/use-console";

/** S-121 — dispatch mode (AUTO / MANUAL) + orders that need a rider (ADM-004, ADM-010, BL-5). */
export default function DispatchPage() {
  return (
    <RequirePermission perm="orders.assign">
      <Dispatch />
    </RequirePermission>
  );
}

function Dispatch() {
  const { db, tenant, base, settings, can } = useConsole();
  // Saved to Supabase and mirrored into this screen's mock data until dispatch moves (2.6).
  const saveSettings = useSaveSettings();
  const [assigning, setAssigning] = useState<Order | null>(null);
  const now = new Date().toISOString();
  const orders = db.orders.filter((o) => o.tenantId === tenant.id);
  const needs = orders.filter(needsRider);
  const waiting = orders.filter((o) => o.status === "APPROVED" && o.pendingOffer);
  const riders = db.riders.filter(
    (r) => r.tenantId === tenant.id && r.status === "ACTIVE" && r.isOnShift,
  );
  const free = riders.filter((r) => !r.activeOrderId).length;
  const store = (id: string) => db.merchants.find((m) => m.id === id)?.name ?? "Store";
  const riderName = (id?: string) => db.riders.find((r) => r.id === id)?.name ?? "rider";

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
        <AssignRiderSheet order={assigning} open onOpenChange={(o) => !o && setAssigning(null)} />
      ) : null}
    </>
  );
}
