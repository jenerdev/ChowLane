"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
import { Avatar, Button, EmptyState, Input, PageHeader, VerificationBadge } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { loadCustomers } from "@/lib/customers";
import { useConsole } from "@/lib/use-console";
import { useLive } from "@/lib/use-live";

/** S-106 — customers (ADM-009). */
export default function CustomersPage() {
  return (
    <RequirePermission perm="customers.view">
      <Customers />
    </RequirePermission>
  );
}

function Customers() {
  const { live, base, can } = useConsole();
  const [q, setQ] = useState("");
  const data = useLive(`customers:${live.id}`, async (sb) => {
    const [customers, orders] = await Promise.all([
      loadCustomers(sb, live.id),
      sb.from("orders").select("customer_id").eq("tenant_id", live.id),
    ]);
    // orders.view is needed to see orders; without it the count stays 0
    return { customers, orderCustomerIds: (orders.data ?? []).map((o) => o.customer_id) };
  });
  const all = data.data?.customers ?? [];
  const pending = all.filter((c) => c.verificationStatus === "PENDING").length;
  const list = all
    .filter((c) =>
      `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const orders = (id: string) => (data.data?.orderCustomerIds ?? []).filter((x) => x === id).length;

  return (
    <>
      <PageHeader
        title="Customers"
        actions={
          can("customers.verify") && pending > 0 ? (
            <Button asChild>
              <Link href={`${base}/customers/verify`}>Verify IDs ({pending})</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="relative mb-4 md:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, phone, email"
          aria-label="Search customers"
          className="pl-9"
        />
      </div>
      {data.error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          Couldn&apos;t load customers: {data.error}
        </p>
      ) : null}
      {data.loading ? null : list.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={q ? "No customers match your search" : "No customers yet"}
          description={q ? undefined : "Customers appear after they log in with Facebook."}
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`${base}/customers/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <Avatar name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {orders(c.id)} orders · {c.loyalty.points} points
                  </span>
                </span>
                <VerificationBadge status={c.verificationStatus} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
