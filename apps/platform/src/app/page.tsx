"use client";

import { formatPeso } from "@chowlane/lib";
import { PageHeader, Stat } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** Foundation preview — the real overview (S-501) is Milestone 1.7. */
export default function Overview() {
  const db = useMockStore();
  const active = db.tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = db.tenants.length - active;
  const unpaid = db.billingStatements
    .filter((b) => b.status === "UNPAID")
    .reduce((s, b) => s + b.amountDue, 0);
  const ridersOnShift = db.riders.filter((r) => r.isOnShift).length;
  return (
    <>
      <PageHeader title="Platform overview" description="All tenants" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active tenants" value={active} />
        <Stat label="Suspended" value={suspended} />
        <Stat label="Riders on shift" value={ridersOnShift} />
        <Stat label="Billing unpaid" value={formatPeso(unpaid)} />
      </div>
    </>
  );
}
