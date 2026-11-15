"use client";

import { computeRiderPay, formatDateTime, formatPeso, manilaDateKey } from "@chowlane/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  RemitBadge,
  Stat,
} from "@chowlane/ui";
import { payRuleLabel, useNow, useRider } from "@/lib/use-rider";

/** S-205 — earnings today / last 7 days by pay mode, deliveries and shifts with cash status (RID-008). */
export default function Earnings() {
  const { me, db, rule } = useRider();
  const nowMs = useNow();
  if (!me) return null;

  const today = manilaDateKey(new Date(nowMs).toISOString());
  const weekAgo = nowMs - 7 * 86_400_000;
  const delivered = db.orders
    .filter((o) => o.riderId === me.id && o.status === "DELIVERED")
    .sort(
      (a, b) =>
        Date.parse(b.cashCollectedAt ?? b.createdAt) - Date.parse(a.cashCollectedAt ?? a.createdAt),
    );
  const shifts = db.shifts
    .filter((s) => s.riderId === me.id)
    .sort((a, b) => Date.parse(b.timeIn) - Date.parse(a.timeIn));
  const at = (o: (typeof delivered)[number]) => o.cashCollectedAt ?? o.timeline.at(-1)!.at;
  const pay = (orders: typeof delivered, sh: typeof shifts) =>
    computeRiderPay({
      rule,
      deliveredOrderFees: orders.map((o) => o.deliveryFee),
      shiftTimeIns: sh.map((s) => s.timeIn),
    });
  const todayPay = pay(
    delivered.filter((o) => manilaDateKey(at(o)) === today),
    shifts.filter((s) => manilaDateKey(s.timeIn) === today),
  );
  const week = delivered.filter((o) => Date.parse(at(o)) >= weekAgo);
  const weekPay = pay(
    week,
    shifts.filter((s) => Date.parse(s.timeIn) >= weekAgo),
  );

  return (
    <>
      <PageHeader
        title="Earnings"
        description={`You're paid ${payRuleLabel(rule)}.${me.payOverride ? " (your own rate)" : ""}`}
      />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Stat label="Today" value={formatPeso(todayPay)} />
        <Stat label="Last 7 days" value={formatPeso(weekPay)} hint={`${week.length} deliveries`} />
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shifts</CardTitle>
        </CardHeader>
        {shifts.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">No shifts yet.</p>
          </CardContent>
        ) : (
          <ul className="divide-y border-t">
            {shifts.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  {formatDateTime(s.timeIn)} – {s.timeOut ? formatDateTime(s.timeOut) : "now"}
                  {s.timeOut ? (
                    <span className="block text-[13px] text-muted-foreground">
                      Hand over {formatPeso(s.expectedRemit)}
                    </span>
                  ) : null}
                </span>
                <RemitBadge status={s.remitStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Deliveries</CardTitle>
        </CardHeader>
        {delivered.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">No deliveries yet.</p>
          </CardContent>
        ) : (
          <ul className="divide-y border-t">
            {delivered.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  {o.orderNumber}
                  <span className="block text-[13px] text-muted-foreground">
                    {formatDateTime(at(o))}
                  </span>
                </span>
                <span className="tabular-nums">
                  {rule.mode === "DAILY" ? "—" : formatPeso(o.riderEarning ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
