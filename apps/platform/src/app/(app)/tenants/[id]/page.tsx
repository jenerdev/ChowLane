"use client";

import { useState } from "react";
import Link from "next/link";
import { describeBilling, formatDate, formatPeso, isOnTrial, tenantStats } from "@chowlane/lib";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmSheet,
  Stat,
  toast,
} from "@chowlane/ui";
import { NoteSheet } from "@/components/note-sheet";
import { useMockStore } from "@/lib/store";
import { useTenantRecords } from "@/lib/use-tenant";

/** S-503 — tenant overview: stats, owner, plan, suspend / reactivate (PLT-004, PLT-009, BL-10.8). */
export default function TenantOverview() {
  const r = useTenantRecords();
  const patch = useMockStore((s) => s.patch);
  const [suspend, setSuspend] = useState(false);
  const [reactivate, setReactivate] = useState(false);
  if (!r.tenant) return null;
  const t = r.tenant;
  const s = tenantStats({ orders: r.orders, customers: r.customers, riders: r.riders }, r.now);
  const owner = r.staff.find((x) => x.id === t.ownerId);
  const unpaid = r.statements.filter((x) => x.status === "UNPAID");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          label="Orders (all time)"
          value={s.ordersTotal}
          hint={`${s.ordersThisMonth} this month`}
        />
        <Stat label="Delivered" value={s.delivered} hint={`${s.deliveredThisMonth} this month`} />
        <Stat label="Cancelled / rejected" value={s.cancelled + s.rejected} />
        <Stat
          label="Delivery fees charged"
          value={formatPeso(s.deliveryFeeRevenue)}
          hint="Delivered orders"
        />
        <Stat
          label="Active customers"
          value={s.activeCustomers}
          hint={`ordered this month · ${s.customers} total`}
        />
        <Stat label="Riders online" value={s.ridersOnShift} hint={`of ${s.riders} active`} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              Owner: <span className="font-medium">{owner?.name ?? "—"}</span>
            </p>
            {owner ? <p className="text-muted-foreground">{owner.email}</p> : null}
            <p className="text-muted-foreground">On ChowLane since {formatDate(t.createdAt)}</p>
            <p className="text-muted-foreground">
              {r.merchants.filter((m) => m.status === "ACTIVE").length} merchants ·{" "}
              {r.staff.filter((x) => x.type === "ADMIN").length} admins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{r.billing ? describeBilling(r.billing) : "No plan set"}</p>
            {r.billing && isOnTrial(r.billing, r.now) ? (
              <p className="text-muted-foreground">
                Free trial until {formatDate(r.billing.trialEndsAt!)}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {unpaid.length
                ? `${unpaid.length} unpaid statement${unpaid.length > 1 ? "s" : ""} · ${formatPeso(unpaid.reduce((a, x) => a + x.amountDue, 0))}`
                : "No unpaid statements"}
            </p>
            <Link
              href={`/tenants/${t.id}/billing`}
              className="mt-1 self-start underline decoration-border underline-offset-4 hover:decoration-foreground"
            >
              Manage billing
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {t.status === "ACTIVE" ? (
            <>
              <div className="text-sm">
                <p className="font-medium">Suspend this business</p>
                <p className="text-[13px] text-muted-foreground">
                  Customer and rider apps show “temporarily unavailable”; the console becomes
                  view-only.
                </p>
              </div>
              <Button variant="outline" className="text-danger" onClick={() => setSuspend(true)}>
                Suspend
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm">
                <p className="font-medium">This business is suspended</p>
                <p className="text-[13px] text-muted-foreground">
                  {t.suspendReason ?? "No reason recorded."}
                </p>
              </div>
              <Button onClick={() => setReactivate(true)}>Reactivate</Button>
            </>
          )}
        </CardContent>
      </Card>

      <NoteSheet
        open={suspend}
        onOpenChange={setSuspend}
        title={`Suspend ${t.businessName}?`}
        description="The owner sees the reason. You can reactivate any time."
        label="Reason"
        hint="Required, e.g. “Unpaid billing for October 2026”"
        required
        confirmLabel="Suspend business"
        destructive
        onSubmit={(reason) => {
          patch("tenants", t.id, { status: "SUSPENDED", suspendReason: reason });
          toast(`${t.businessName} suspended`);
        }}
      />
      <ConfirmSheet
        open={reactivate}
        onOpenChange={setReactivate}
        title={`Reactivate ${t.businessName}?`}
        description="Their apps work again right away."
        confirmLabel="Reactivate"
        onConfirm={() => {
          patch("tenants", t.id, { status: "ACTIVE", suspendReason: undefined });
          toast(`${t.businessName} is active again`);
        }}
      />
    </>
  );
}
