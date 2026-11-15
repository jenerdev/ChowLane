"use client";

import { useState } from "react";
import Link from "next/link";
import { Bike, ChevronRight, Map, Plus, Wallet } from "lucide-react";
import { formatDateTime } from "@chowlane/lib";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";

type Tab = "on" | "off" | "inactive";

/** S-107 — riders by shift status (ADM-005, ADM-006). */
export default function RidersPage() {
  return (
    <RequirePermission perm="riders.view">
      <Riders />
    </RequirePermission>
  );
}

function Riders() {
  const { db, tenant, base, can } = useConsole();
  const [tab, setTab] = useState<Tab>("on");
  const all = db.riders.filter((r) => r.tenantId === tenant.id);
  const groups: Record<Tab, typeof all> = {
    on: all.filter((r) => r.status === "ACTIVE" && r.isOnShift),
    off: all.filter((r) => r.status === "ACTIVE" && !r.isOnShift),
    inactive: all.filter((r) => r.status === "INACTIVE"),
  };
  const shiftStart = (id?: string) => db.shifts.find((s) => s.id === id)?.timeIn;
  const orderNo = (id?: string) => db.orders.find((o) => o.id === id)?.orderNumber;

  return (
    <>
      <PageHeader
        title="Riders"
        actions={
          <>
            {can("reports.view") ? (
              <Button variant="outline" asChild>
                <Link href={`${base}/reports/rider-pay`}>
                  <Wallet /> Pay
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href={`${base}/map`}>
                <Map /> Live map
              </Link>
            </Button>
            {can("riders.manage") ? (
              <Button asChild>
                <Link href={`${base}/riders/new`}>
                  <Plus /> Add
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList className="w-auto">
          <TabsTrigger value="on">On shift ({groups.on.length})</TabsTrigger>
          <TabsTrigger value="off">Off shift ({groups.off.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({groups.inactive.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {groups[tab].length === 0 ? (
        <EmptyState
          icon={<Bike />}
          title={
            tab === "on"
              ? "No riders on shift"
              : tab === "off"
                ? "Everyone is on shift"
                : "No inactive riders"
          }
          description={
            tab === "on" ? "Riders appear here when they time in on the rider app." : undefined
          }
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {groups[tab].map((r) => (
            <li key={r.id}>
              <Link
                href={`${base}/riders/${r.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <Avatar name={r.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {r.vehicleType.toLowerCase()}
                    {r.plateNumber ? ` · ${r.plateNumber}` : ""}
                    {r.isOnShift && shiftStart(r.currentShiftId)
                      ? ` · since ${formatDateTime(shiftStart(r.currentShiftId)!)}`
                      : ""}
                  </span>
                </span>
                {r.isOnShift ? (
                  r.activeOrderId ? (
                    <Badge tone="brand">{orderNo(r.activeOrderId)}</Badge>
                  ) : (
                    <Badge tone="success">Available</Badge>
                  )
                ) : null}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
