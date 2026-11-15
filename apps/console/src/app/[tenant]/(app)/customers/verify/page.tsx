"use client";

import Link from "next/link";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { ID_TYPE_LABELS } from "@chowlane/types";
import { timeAgo } from "@chowlane/lib";
import { Avatar, Badge, EmptyState, PageHeader } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";

/** S-104 — first-time customers waiting for ID verification, oldest first (ADM-001). */
export default function VerifyQueuePage() {
  return (
    <RequirePermission perm="customers.verify">
      <Queue />
    </RequirePermission>
  );
}

function Queue() {
  const { db, tenant, base } = useConsole();
  const now = new Date().toISOString();
  const list = db.customers
    .filter((c) => c.tenantId === tenant.id && c.verificationStatus === "PENDING" && c.verification)
    .sort(
      (a, b) => Date.parse(a.verification!.submittedAt) - Date.parse(b.verification!.submittedAt),
    );
  const hasOrder = (id: string) =>
    db.orders.some((o) => o.customerId === id && o.status === "PENDING_APPROVAL");

  return (
    <>
      <PageHeader
        back={{ href: `${base}/customers`, label: "Customers" }}
        title="Verify customers"
        description="New customers send a valid ID and a selfie holding it before their first order goes out."
      />
      {list.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck />}
          title="All caught up"
          description="No IDs waiting for review."
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`${base}/customers/verify/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <Avatar name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{c.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {ID_TYPE_LABELS[c.verification!.idType]} · sent{" "}
                    {timeAgo(c.verification!.submittedAt, now)}
                    {c.verificationHistory.length > 1 ? " · re-submitted" : ""}
                  </span>
                </span>
                {hasOrder(c.id) ? <Badge tone="warning">Order waiting</Badge> : null}
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
