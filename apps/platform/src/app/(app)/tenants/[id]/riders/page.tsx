"use client";

import { Bike } from "lucide-react";
import { formatDateTime, formatPhMobile } from "@chowlane/lib";
import { Avatar, Badge, EmptyState, RemitBadge } from "@chowlane/ui";
import { ReadOnlyNote } from "@/components/read-only-note";
import { useTenantRecords } from "@/lib/use-tenant";

/** S-504 — tenant riders, shift status, deliveries (read-only, PLT-005). */
export default function TenantRiders() {
  const r = useTenantRecords();
  if (!r.tenant) return null;
  const delivered = (id: string) =>
    r.orders.filter((o) => o.riderId === id && o.status === "DELIVERED").length;
  const lastShift = (id: string) =>
    r.shifts
      .filter((s) => s.riderId === id)
      .sort((a, b) => Date.parse(b.timeIn) - Date.parse(a.timeIn))[0];
  const list = [...r.riders].sort(
    (a, b) => Number(b.isOnShift) - Number(a.isOnShift) || a.name.localeCompare(b.name),
  );
  return (
    <>
      <ReadOnlyNote />
      {list.length === 0 ? (
        <EmptyState icon={<Bike />} title="No riders yet" />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((x) => {
            const s = lastShift(x.id);
            return (
              <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={x.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{x.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {x.vehicleType.toLowerCase()} · {formatPhMobile(x.phone)} · {delivered(x.id)}{" "}
                    delivered
                    {s ? ` · last shift ${formatDateTime(s.timeIn)}` : ""}
                  </span>
                </span>
                {s && s.remitStatus !== "OPEN" ? <RemitBadge status={s.remitStatus} /> : null}
                {x.status === "INACTIVE" ? (
                  <Badge>Inactive</Badge>
                ) : x.isOnShift ? (
                  <Badge tone="success">On shift</Badge>
                ) : (
                  <Badge>Off shift</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
