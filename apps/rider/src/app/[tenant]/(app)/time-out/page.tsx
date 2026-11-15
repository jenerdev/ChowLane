"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { canTimeOut, formatDateTime, formatPeso, shiftSummary } from "@chowlane/lib";
import { Button, Card, CardContent, EmptyState, PageHeader } from "@chowlane/ui";
import { useNow, useRider } from "@/lib/use-rider";
import { useRiderActions } from "@/lib/use-rider-actions";

/** S-207 — time out with the shift's cash summary (RID-014, BL-12.3). */
export default function TimeOut() {
  const { me, shift, db, base } = useRider();
  const actions = useRiderActions();
  const nowMs = useNow();
  if (!me || !shift) {
    return (
      <EmptyState
        icon={<Clock />}
        title="You're not on shift"
        action={
          <Button asChild variant="outline">
            <Link href={base}>Back to home</Link>
          </Button>
        }
      />
    );
  }
  const now = new Date(nowMs).toISOString();
  const check = canTimeOut(me, db.orders);
  const sum = shiftSummary(shift, db.orders, now);
  const hours = ((nowMs - Date.parse(shift.timeIn)) / 3_600_000).toFixed(1);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={{ href: base, label: "Home" }}
        title="Time out"
        description={`On shift since ${formatDateTime(shift.timeIn)} · ${hours} h`}
      />
      <Card>
        <CardContent className="pt-5 text-sm">
          <dl>
            <div className="flex justify-between py-1">
              <dt>Deliveries this shift</dt>
              <dd className="tabular-nums">{sum.deliveries}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt>Collected from customers</dt>
              <dd className="tabular-nums">{formatPeso(sum.cashCollected)}</dd>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <dt>Paid at stores</dt>
              <dd className="tabular-nums">−{formatPeso(sum.storePaid)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t pt-3">
              <dt className="font-medium">Hand over to your admin</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatPeso(sum.expectedRemit)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <p className="text-[13px] text-muted-foreground">
        Give this cash to your admin. They record what they received — any difference needs a note.
      </p>
      {check.ok ? (
        <Button size="lg" onClick={() => void actions.timeOut()}>
          Time out
        </Button>
      ) : (
        <p className="rounded-control bg-warning-soft px-4 py-3 text-sm text-warning">
          {check.reason}
        </p>
      )}
    </div>
  );
}
