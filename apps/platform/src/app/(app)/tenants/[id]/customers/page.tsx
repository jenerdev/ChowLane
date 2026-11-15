"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { formatDate } from "@chowlane/lib";
import { Avatar, EmptyState, Input, VerificationBadge } from "@chowlane/ui";
import { ReadOnlyNote } from "@/components/read-only-note";
import { useTenantRecords } from "@/lib/use-tenant";

/** S-506 — tenant customers + verification status (read-only, PLT-006). */
export default function TenantCustomers() {
  const r = useTenantRecords();
  const [q, setQ] = useState("");
  if (!r.tenant) return null;
  const orders = (id: string) => r.orders.filter((o) => o.customerId === id).length;
  const list = r.customers
    .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <ReadOnlyNote />
      <div className="relative mb-4 md:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name"
          aria-label="Search customers"
          className="pl-9"
        />
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={q ? "No customers match your search" : "No customers yet"}
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={c.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block truncate text-[13px] text-muted-foreground">
                  {orders(c.id)} orders · {c.loyalty.points} points · since{" "}
                  {formatDate(c.createdAt)}
                </span>
              </span>
              <VerificationBadge status={c.verificationStatus} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
