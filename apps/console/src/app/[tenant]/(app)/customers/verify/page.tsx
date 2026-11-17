"use client";

import Link from "next/link";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { ID_TYPE_LABELS } from "@chowlane/types";
import { timeAgo } from "@chowlane/lib";
import { Avatar, Badge, EmptyState, PageHeader } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { loadCustomers } from "@/lib/customers";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-104 — first-time customers waiting for ID verification, oldest first (ADM-001). */
export default function VerifyQueuePage() {
  return (
    <RequirePermission perm="customers.verify">
      <Queue />
    </RequirePermission>
  );
}

function Queue() {
  const { live, base } = useConsole();
  const now = new Date().toISOString();
  const data = useLive(`verify-queue:${live.id}`, async (sb) => {
    const [customers, waiting] = await Promise.all([
      loadCustomers(sb, live.id, { status: "PENDING" }),
      sb
        .from("orders")
        .select("customer_id")
        .eq("tenant_id", live.id)
        .eq("status", "PENDING_APPROVAL"),
    ]);
    return { customers, waiting: must(waiting).map((o) => o.customer_id) };
  });
  const list = (data.data?.customers ?? [])
    .filter((c) => c.verification)
    .sort(
      (a, b) => Date.parse(a.verification!.submittedAt) - Date.parse(b.verification!.submittedAt),
    );
  const hasOrder = (id: string) => (data.data?.waiting ?? []).includes(id);
  if (data.loading) return null;

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
          description={data.error ?? "No IDs waiting for review."}
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
