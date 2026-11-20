"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { Avatar, Badge, EmptyState, MapPicker, PageHeader } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { loadDispatch } from "@/lib/dispatch";
import { useConsole } from "@/lib/use-console";
import { useAutoReload, useLive } from "@/lib/use-live";

/**
 * S-110 — riders on shift and stores with active orders on one map (ADM-005). Live since 2.6 (updates via Realtime);
 * a rider's position is where they last timed in / out — live GPS comes in Phase 3.
 */
export default function LiveMapPage() {
  return (
    <RequirePermission perm="riders.view">
      <LiveMap />
    </RequirePermission>
  );
}

function LiveMap() {
  const { live: tenant, base } = useConsole();
  const data = useLive(`map:${tenant.id}`, (sb) => loadDispatch(sb, tenant.id));
  useAutoReload(data.reload);
  if (!data.data)
    return data.loading ? null : (
      <EmptyState icon={<MapPinned />} title="Couldn't load the map" description={data.error} />
    );
  const { settings, orders: activeOrders, merchants } = data.data;
  const riders = data.data.riders.filter((r) => r.isOnShift);
  const stores = merchants.filter((m) => activeOrders.some((o) => o.merchantId === m.id));
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
        description="Riders show where they last timed in or out. Live GPS comes later."
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
