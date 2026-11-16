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
  riderPayRuleLabel,
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
import { toRider, toShift, toTenantSettings } from "@chowlane/db/mappers";
import { RequirePermission } from "@/components/require-permission";
import { useConsole, useNow } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-109 — rider profile, current order, shifts, earnings (ADM-005, OWN-012 basic). Live since 2.3. */
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
  const { live, base, can, db } = useConsole();
  const nowMs = useNow();
  const data = useLive(`rider:${id}`, async (sb) => {
    const rider = must(
      await sb.from("riders").select("*").eq("id", id).eq("tenant_id", live.id).maybeSingle(),
    );
    if (!rider) return null;
    const [settings, shifts, orders] = await Promise.all([
      sb.from("tenant_settings").select("*").eq("tenant_id", live.id).single(),
      sb.from("shifts").select("*").eq("rider_id", id).order("time_in", { ascending: false }),
      sb
        .from("orders")
        .select("id, order_number, status, delivery_fee, created_at, merchant:merchants(name)")
        .eq("rider_id", id),
    ]);
    return {
      rider: toRider(rider),
      settings: toTenantSettings(must(settings)),
      shifts: must(shifts).map(toShift),
      orders: must(orders),
    };
  });
  if (data.loading) return null;
  if (data.error)
    return <EmptyState icon={<Bike />} title="Couldn't load this rider" description={data.error} />;
  if (!data.data) return <EmptyState icon={<Bike />} title="Rider not found" />;
  const { rider: r, settings, shifts, orders } = data.data;

  const weekAgo = nowMs - 7 * 86_400_000;
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const rule = effectiveRiderPayRule(settings.riderPay, r.payOverride);
  const week = computeRiderPay({
    rule,
    deliveredOrderFees: delivered
      .filter((o) => Date.parse(o.created_at) >= weekAgo)
      .map((o) => o.delivery_fee),
    shiftTimeIns: shifts.filter((s) => Date.parse(s.timeIn) >= weekAgo).map((s) => s.timeIn),
  });
  const active = orders.find((o) => o.id === r.activeOrderId);
  // The order screen still runs on mock data (until 2.5–2.6): open the same order by its number.
  const activeMockId = active
    ? db.orders.find((o) => o.orderNumber === active.order_number)?.id
    : undefined;
  const toRemit = shifts
    .filter((s) => s.remitStatus === "PENDING")
    .reduce((sum, s) => sum + s.expectedRemit, 0);
  const payLabel = riderPayRuleLabel(rule);

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
              <p className="font-medium">Current order {active.order_number}</p>
              <p className="text-[13px] text-muted-foreground">{active.merchant?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={active.status} />
              {activeMockId ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`${base}/orders/${activeMockId}`}>Open</Link>
                </Button>
              ) : null}
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
