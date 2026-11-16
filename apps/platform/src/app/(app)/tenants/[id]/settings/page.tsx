"use client";

import { formatPeso, PERMISSION_LABELS } from "@chowlane/lib";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle } from "@chowlane/ui";
import { ReadOnlyNote } from "@/components/read-only-note";
import { useTenantRecords } from "@/lib/use-tenant";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 text-sm sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="sm:text-right">{value}</dd>
    </div>
  );
}

/** S-508 — admins, roles and key settings of a tenant (read-only, PLT-006). */
export default function TenantSettingsView() {
  const r = useTenantRecords();
  if (!r.tenant || !r.settings) return null;
  const s = r.settings;
  const df = s.deliveryFee;
  const fee = !df
    ? "Not set yet"
    : df.mode === "PER_KM"
      ? `Per km — ${formatPeso(df.baseFee)} for the first ${df.includedKm} km, then ${formatPeso(df.ratePerKm)}/km (min ${formatPeso(df.minFee)})`
      : df.mode === "FIXED"
        ? `Fixed — ${formatPeso(df.amount)}`
        : `Per barangay — ${r.db.barangayFees.filter((b) => b.tenantId === r.tenant!.id && b.isActive).length} barangays`;
  const rp = s.riderPay;
  const pay = !rp
    ? "Not set yet"
    : rp.mode === "DAILY"
      ? `${formatPeso(rp.dailyRate)} per day`
      : rp.mode === "COMMISSION"
        ? `${rp.percent}% of the delivery fee`
        : `${formatPeso(rp.ratePerDelivery)} per delivery`;
  const l = s.loyalty;
  const loyalty = !l.enabled
    ? "Off"
    : [
        l.freeDelivery.enabled
          ? `free delivery every ${l.freeDelivery.ordersRequired} orders`
          : null,
        l.freeGift.enabled
          ? `${l.freeGift.giftName || "free gift"} every ${l.freeGift.ordersRequired} orders`
          : null,
        l.points.enabled ? "points" : null,
      ]
        .filter(Boolean)
        .join(", ") || "On, no rules";
  const roleName = (id?: string) => r.roles.find((x) => x.id === id)?.name ?? "No role";
  const activeCoupons = r.coupons.filter(
    (c) => c.isActive && Date.parse(c.validUntil) > Date.parse(r.now),
  ).length;

  return (
    <>
      <ReadOnlyNote />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
          </CardHeader>
          <ul className="divide-y border-t">
            {r.staff.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={x.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{x.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {x.email}
                  </span>
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {x.type === "OWNER" ? "Owner" : roleName(x.roleId)}
                </span>
                {x.status === "INVITED" ? (
                  <Badge tone="warning">Invited</Badge>
                ) : x.status === "INACTIVE" ? (
                  <Badge>Off</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {r.roles.map((role) => (
              <div key={role.id}>
                <p className="text-sm font-medium">
                  {role.name} {role.isDefault ? <Badge className="ml-1">Default</Badge> : null}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {role.permissions.map((p) => PERMISSION_LABELS[p]).join(", ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label="Delivery fee" value={fee} />
              <Row label="Rider income" value={pay} />
              <Row
                label="Dispatch"
                value={
                  s.dispatchMode === "AUTO"
                    ? `Auto assign (${s.riderResponseTimeoutSec}s to accept)`
                    : "Manual assign"
                }
              />
              <Row label="Delivery area" value={`${s.serviceArea.radiusKm} km radius`} />
              <Row label="Max order" value={formatPeso(s.maxOrderSubtotal)} />
              <Row
                label="Auto-approve verified customers"
                value={s.autoApproveVerifiedCustomers ? "On" : "Off"}
              />
              <Row label="Loyalty program" value={loyalty} />
              <Row label="Active coupons" value={String(activeCoupons)} />
              <Row label="Accepted ID types" value={String(s.acceptedIdTypes.length)} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
