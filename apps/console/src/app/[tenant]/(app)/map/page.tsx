"use client";

import Link from "next/link";
import { Avatar, Badge, MapPicker, PageHeader } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";

/** S-110 — riders on shift and stores with active orders on one map (ADM-005). Phase 3: live via Realtime. */
export default function LiveMapPage() {
  return (
    <RequirePermission perm="riders.view">
      <LiveMap />
    </RequirePermission>
  );
}

function LiveMap() {
  const { db, tenant, base, settings } = useConsole();
  const riders = db.riders.filter((r) => r.tenantId === tenant.id && r.isOnShift);
  const activeOrders = db.orders.filter(
    (o) =>
      o.tenantId === tenant.id &&
      ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"].includes(o.status),
  );
  const stores = db.merchants.filter((m) => activeOrders.some((o) => o.merchantId === m.id));
  const markers = [
    ...riders
      .filter((r) => r.lastLocation)
      .map((r) => ({
        position: r.lastLocation!,
        label: `${r.name}${r.activeOrderId ? " — on an order" : " — available"}`,
        color: r.activeOrderId ? "#f59e0b" : tenant.primaryColor,
      })),
    ...stores.map((m) => ({ position: m.location, label: m.name, color: "#71717a" })),
  ];

  return (
    <>
      <PageHeader
        back={{ href: `${base}/riders`, label: "Riders" }}
        title="Live map"
        description="Locations update while riders have the app open."
      />
      <MapPicker
        center={settings.serviceArea.center}
        radiusKm={settings.serviceArea.radiusKm}
        markers={markers}
        hideCenter
        color={tenant.primaryColor}
        className="h-[60dvh]"
      />
      <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-brand" /> Available rider
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" /> Rider on an order
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-zinc-500" /> Store with an active order
        </span>
      </div>
      <ul className="mt-6 divide-y rounded-card border">
        {riders.map((r) => (
          <li key={r.id}>
            <Link
              href={`${base}/riders/${r.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
            >
              <Avatar name={r.name} size="sm" />
              <span className="flex-1 text-sm font-medium">{r.name}</span>
              {r.activeOrderId ? (
                <Badge tone="warning">On an order</Badge>
              ) : (
                <Badge tone="success">Available</Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
