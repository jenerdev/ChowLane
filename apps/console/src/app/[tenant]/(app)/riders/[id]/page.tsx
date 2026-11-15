"use client";

import { use } from "react";
import Link from "next/link";
import { Bike } from "lucide-react";
import {
  computeRiderPay,
  effectiveRiderPayRule,
  formatDateTime,
  formatPeso,
  formatPhMobile,
} from "@chowlane/lib";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  OrderStatusBadge,
  PageHeader,
  RemitBadge,
  Stat,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole, useNow } from "@/lib/use-console";

/** S-109 — rider profile, current order, shifts, earnings (ADM-005, OWN-012 basic). */
export default function RiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="riders.view">
      <Detail id={id} />
    </RequirePermission>
  );
}

const hours = (a: string, b: string | undefined, nowMs: number) =>
  (((b ? Date.parse(b) : nowMs) - Date.parse(a)) / 3_600_000).toFixed(1);

function Detail({ id }: { id: string }) {
  const { db, tenant, base, can, settings } = useConsole();
  const nowMs = useNow();
  const r = db.riders.find((x) => x.id === id && x.tenantId === tenant.id);
  if (!r) return <EmptyState icon={<Bike />} title="Rider not found" />;

  const weekAgo = nowMs - 7 * 86_400_000;
  const delivered = db.orders.filter((o) => o.riderId === r.id && o.status === "DELIVERED");
  const shifts = db.shifts
    .filter((s) => s.riderId === r.id)
    .sort((a, b) => Date.parse(b.timeIn) - Date.parse(a.timeIn));
  const rule = effectiveRiderPayRule(settings.riderPay, r.payOverride);
  const week = computeRiderPay({
    rule,
    deliveredOrderFees: delivered
      .filter((o) => Date.parse(o.createdAt) >= weekAgo)
      .map((o) => o.deliveryFee),
    shiftTimeIns: shifts.filter((s) => Date.parse(s.timeIn) >= weekAgo).map((s) => s.timeIn),
  });
  const active = db.orders.find((o) => o.id === r.activeOrderId);
  const toRemit = shifts
    .filter((s) => s.remitStatus === "PENDING")
    .reduce((sum, s) => sum + s.expectedRemit, 0);
  const payLabel =
    rule.mode === "DAILY"
      ? `${formatPeso(rule.dailyRate)} per day`
      : rule.mode === "COMMISSION"
        ? `${rule.percent}% of delivery fee`
        : `${formatPeso(rule.ratePerDelivery)} per delivery`;

  return (
    <>
      <PageHeader
        back={{ href: `${base}/riders`, label: "Riders" }}
        title={r.name}
        description={`${r.vehicleType.toLowerCase()}${r.plateNumber ? ` · ${r.plateNumber}` : ""} · ${formatPhMobile(r.phone)}`}
        actions={
          <>
            {r.status === "INACTIVE" ? (
              <Badge>Inactive</Badge>
            ) : r.isOnShift ? (
              <Badge tone="success">On shift</Badge>
            ) : (
              <Badge>Off shift</Badge>
            )}
            {can("riders.manage") ? (
              <Button variant="outline" asChild>
                <Link href={`${base}/riders/${r.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Deliveries (total)" value={delivered.length} />
        <Stat
          label="Earnings, last 7 days"
          value={formatPeso(week)}
          hint={`${payLabel}${r.payOverride ? " (own rate)" : ""}`}
        />
        <Stat label="Cash to hand over" value={formatPeso(toRemit)} />
      </div>

      {active ? (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between gap-3 pt-5">
            <div className="text-sm">
              <p className="font-medium">Current order {active.orderNumber}</p>
              <p className="text-[13px] text-muted-foreground">
                {db.merchants.find((m) => m.id === active.merchantId)?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={active.status} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`${base}/orders/${active.id}`}>Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
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
                  <span className="block text-[13px] text-muted-foreground">
                    {hours(s.timeIn, s.timeOut, nowMs)} h
                    {s.timeOut ? ` · to hand over ${formatPeso(s.expectedRemit)}` : ""}
                  </span>
                </span>
                <RemitBadge status={s.remitStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
