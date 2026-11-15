"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import {
  formatMonth,
  formatPeso,
  inRange,
  manilaMonthRange,
  previousManilaMonth,
  statementTotals,
} from "@chowlane/lib";
import { EmptyState, PageHeader, Stat, Tabs, TabsList, TabsTrigger } from "@chowlane/ui";
import { StatementStatusBadge } from "@/components/statement-status-badge";
import { usePlatform } from "@/lib/use-platform";

type Filter = "this" | "last" | "unpaid";

/** S-510 — billing across all tenants (PLT-010). */
export default function BillingOverview() {
  const { db, now } = usePlatform();
  const [filter, setFilter] = useState<Filter>("this");
  const thisMonth = manilaMonthRange(now);
  const lastMonth = previousManilaMonth(now);
  const all = [...db.billingStatements].sort(
    (a, b) => Date.parse(b.periodStart) - Date.parse(a.periodStart),
  );
  const pick: Record<Filter, typeof all> = {
    this: all.filter((s) => inRange(s.periodStart, thisMonth)),
    last: all.filter((s) => inRange(s.periodStart, lastMonth)),
    unpaid: all.filter((s) => s.status === "UNPAID"),
  };
  const list = pick[filter];
  const totals = statementTotals(list);
  const tenant = (id: string) => db.tenants.find((t) => t.id === id);

  return (
    <>
      <PageHeader
        title="Billing"
        description="What each business owes ChowLane. Payments are collected outside the app."
      />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
        <TabsList className="w-auto">
          <TabsTrigger value="this">{formatMonth(thisMonth.start)}</TabsTrigger>
          <TabsTrigger value="last">{formatMonth(lastMonth.start)}</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({pick.unpaid.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Billed" value={formatPeso(totals.due)} />
        <Stat label="Paid" value={formatPeso(totals.paid)} />
        <Stat
          label="Unpaid"
          value={formatPeso(totals.unpaid)}
          hint={`${totals.unpaidCount} statements`}
        />
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={filter === "unpaid" ? "Everything is paid" : "No statements for this month"}
          description={
            filter === "this" ? "Create statements from each business's Billing page." : undefined
          }
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((s) => (
            <li key={s.id}>
              <Link
                href={`/tenants/${s.tenantId}/billing`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {tenant(s.tenantId)?.businessName ?? "Business"}{" "}
                    <StatementStatusBadge status={s.status} />
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {formatMonth(s.periodStart)} · {s.deliveredOrders} delivered orders
                    {s.note ? ` · ${s.note}` : ""}
                  </span>
                </span>
                <span className="text-sm tabular-nums">{formatPeso(s.amountDue)}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
