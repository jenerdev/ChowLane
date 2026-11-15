"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Search } from "lucide-react";
import type { TenantStatus } from "@chowlane/types";
import { BILLING_MODEL_LABELS, formatDate, tenantStats } from "@chowlane/lib";
import {
  EmptyState,
  Input,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TenantLogo,
  TenantTheme,
} from "@chowlane/ui";
import { TenantStatusBadge } from "@/components/tenant-status-badge";
import { usePlatform } from "@/lib/use-platform";

type Filter = "ALL" | TenantStatus;

/** S-502 — all tenants with search and status filter (PLT-003). */
export default function TenantsPage() {
  const { db, now } = usePlatform();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const rows = db.tenants
    .filter((t) => filter === "ALL" || t.status === filter)
    .filter((t) => `${t.businessName} ${t.slug}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.businessName.localeCompare(b.businessName))
    .map((t) => ({
      t,
      billing: db.tenantBilling.find((b) => b.tenantId === t.id),
      stats: tenantStats(
        {
          orders: db.orders.filter((o) => o.tenantId === t.id),
          customers: db.customers.filter((c) => c.tenantId === t.id),
          riders: db.riders.filter((r) => r.tenantId === t.id),
        },
        now,
      ),
    }));
  const count = (f: Filter) => db.tenants.filter((t) => f === "ALL" || t.status === f).length;

  return (
    <>
      <PageHeader title="Tenants" description="Every delivery business running on ChowLane." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-auto">
            <TabsTrigger value="ALL">All ({count("ALL")})</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active ({count("ACTIVE")})</TabsTrigger>
            <TabsTrigger value="SUSPENDED">Suspended ({count("SUSPENDED")})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or link"
            aria-label="Search tenants"
            className="pl-9"
          />
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title={q ? "No businesses match your search" : "No businesses here"}
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {rows.map(({ t, billing, stats }) => (
            <li key={t.id}>
              <Link
                href={`/tenants/${t.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <TenantTheme color={t.primaryColor}>
                  <TenantLogo name={t.businessName} logoUrl={t.logoUrl} />
                </TenantTheme>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{t.businessName}</span>
                    <TenantStatusBadge status={t.status} />
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    /{t.slug} · {billing ? BILLING_MODEL_LABELS[billing.model] : "No plan"} · since{" "}
                    {formatDate(t.createdAt)}
                  </span>
                </span>
                <span className="hidden text-right text-[13px] text-muted-foreground tabular-nums sm:block">
                  <span className="block text-sm text-foreground">{stats.ordersThisMonth}</span>
                  orders this month
                </span>
                <span className="hidden text-right text-[13px] text-muted-foreground tabular-nums md:block">
                  <span className="block text-sm text-foreground">{stats.riders}</span>
                  riders
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
