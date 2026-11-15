"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  formatMonth,
  formatPeso,
  inRange,
  manilaMonthRange,
  statementTotals,
  tenantStats,
} from "@chowlane/lib";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Stat } from "@chowlane/ui";
import { TenantStatusBadge } from "@/components/tenant-status-badge";
import { usePlatform } from "@/lib/use-platform";

/** S-501 — overview across all tenants (PLT-002). */
export default function Overview() {
  const { db, now, me } = usePlatform();
  const stats = tenantStats({ orders: db.orders, customers: db.customers, riders: db.riders }, now);
  const month = manilaMonthRange(now);
  const active = db.tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = db.tenants.length - active;
  const unpaid = db.billingStatements.filter((s) => s.status === "UNPAID");
  const monthTotals = statementTotals(
    db.billingStatements.filter((s) => inRange(s.periodStart, month)),
  );
  const unpaidTotals = statementTotals(unpaid);

  const attention = db.tenants
    .map((t) => ({
      t,
      reasons: [
        t.status === "SUSPENDED"
          ? `Suspended${t.suspendReason ? `: ${t.suspendReason}` : ""}`
          : null,
        ...unpaid
          .filter((s) => s.tenantId === t.id)
          .map((s) => `Unpaid ${formatMonth(s.periodStart)} — ${formatPeso(s.amountDue)}`),
      ].filter(Boolean) as string[],
    }))
    .filter((x) => x.reasons.length > 0);

  return (
    <>
      <PageHeader
        title={`Good day${me ? `, ${me.name.split(" ")[0]}` : ""}`}
        description={`All businesses on ChowLane · ${formatMonth(now)}`}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Active businesses"
          value={active}
          hint={suspended ? `${suspended} suspended` : undefined}
        />
        <Stat label="Orders today" value={stats.ordersToday} />
        <Stat
          label="Orders this month"
          value={stats.ordersThisMonth}
          hint={`${stats.deliveredThisMonth} delivered`}
        />
        <Stat
          label="Riders on shift"
          value={stats.ridersOnShift}
          hint={`of ${stats.riders} active`}
        />
        <Stat
          label="Billed this month"
          value={formatPeso(monthTotals.due)}
          hint={`${formatPeso(monthTotals.paid)} paid`}
        />
        <Stat
          label="Unpaid (all months)"
          value={formatPeso(unpaidTotals.unpaid)}
          hint={`${unpaidTotals.unpaidCount} statements`}
        />
        <Stat label="Delivered (all time)" value={stats.delivered} />
        <Stat label="Customers" value={stats.customers} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        {attention.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nothing right now — no suspended businesses or unpaid bills.
            </p>
          </CardContent>
        ) : (
          <ul className="divide-y border-t">
            {attention.map(({ t, reasons }) => (
              <li key={t.id}>
                <Link
                  href={`/tenants/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-subtle"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {t.businessName} <TenantStatusBadge status={t.status} />
                    </span>
                    {reasons.map((r) => (
                      <span key={r} className="block truncate text-[13px] text-muted-foreground">
                        {r}
                      </span>
                    ))}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
