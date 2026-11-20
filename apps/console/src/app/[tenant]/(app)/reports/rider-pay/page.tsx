"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import type { RiderPayRule } from "@chowlane/types";
import {
  formatPeso,
  manilaDayRange,
  manilaMonthRange,
  previousManilaMonth,
  riderPayReport,
} from "@chowlane/lib";
import { Badge, EmptyState, PageHeader, Select, Stat, useNow } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { loadRiderPay } from "@/lib/dispatch";
import { useConsole } from "@/lib/use-console";
import { useAutoReload, useLive } from "@/lib/use-live";

type PeriodKey = "today" | "7d" | "month" | "lastMonth";

const ruleLabel = (r: RiderPayRule | undefined) =>
  !r
    ? "Not set"
    : r.mode === "DAILY"
      ? `${formatPeso(r.dailyRate)} / day`
      : r.mode === "COMMISSION"
        ? `${r.percent}% of fee`
        : `${formatPeso(r.ratePerDelivery)} / delivery`;

/** S-120 — what each rider earned in a period (OWN-012, BL-8). Payouts happen outside the app. Live since 2.6. */
export default function RiderPayReportPage() {
  return (
    <RequirePermission perm="reports.view">
      <Report />
    </RequirePermission>
  );
}

function Report() {
  const { live, base } = useConsole();
  const nowMs = useNow();
  const now = new Date(nowMs).toISOString();
  const [key, setKey] = useState<PeriodKey>("7d");
  const periods: Record<PeriodKey, { label: string; range: { start: string; end: string } }> = {
    today: { label: "Today", range: manilaDayRange(now) },
    "7d": {
      label: "Last 7 days",
      range: { start: new Date(nowMs - 7 * 86_400_000).toISOString(), end: now },
    },
    month: { label: "This month", range: manilaMonthRange(now) },
    lastMonth: { label: "Last month", range: previousManilaMonth(now) },
  };
  // Load from the earliest period on offer (last month or 7 days ago) once; the periods filter it (lib).
  const since = [periods.lastMonth.range.start, periods["7d"].range.start].sort()[0]!.slice(0, 10);
  const data = useLive(`rider-pay:${live.id}:${since}`, (sb) => loadRiderPay(sb, live.id, since));
  useAutoReload(data.reload);
  const d = data.data;
  const rows = d
    ? riderPayReport({
        riders: d.riders,
        orders: d.orders,
        shifts: d.shifts,
        tenantRule: d.settings.riderPay,
        period: periods[key].range,
      })
    : [];
  const total = rows.reduce((a, r) => a + r.earnings, 0);
  const deliveries = rows.reduce((a, r) => a + r.deliveries, 0);

  return (
    <>
      <PageHeader
        back={{ href: `${base}/riders`, label: "Riders" }}
        title="Rider pay"
        description="Calculated from deliveries and shifts. Pay riders outside the app."
        actions={
          <Select
            aria-label="Period"
            value={key}
            onChange={(e) => setKey(e.target.value as PeriodKey)}
            className="h-9 w-40"
          >
            {(Object.keys(periods) as PeriodKey[]).map((k) => (
              <option key={k} value={k}>
                {periods[k].label}
              </option>
            ))}
          </Select>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Total to pay" value={formatPeso(total)} />
        <Stat label="Deliveries" value={deliveries} />
        <Stat label="Riders who worked" value={rows.length} />
      </div>
      {!d ? null : rows.length === 0 ? (
        <EmptyState icon={<Wallet />} title="No rider activity in this period" />
      ) : (
        <div className="overflow-x-auto rounded-card border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-[13px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Rider</th>
                <th className="px-4 py-2.5 font-medium">Pay</th>
                <th className="px-4 py-2.5 text-right font-medium">Days</th>
                <th className="px-4 py-2.5 text-right font-medium">Deliveries</th>
                <th className="px-4 py-2.5 text-right font-medium">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.riderId}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{r.name}</span>
                    {r.cashPending ? (
                      <span className="block text-[13px] text-warning">
                        Cash to record: {formatPeso(r.cashPending)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ruleLabel(r.rule)}{" "}
                    {r.hasOverride ? <Badge className="ml-1">Own rate</Badge> : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.daysWorked}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.deliveries}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatPeso(r.earnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
