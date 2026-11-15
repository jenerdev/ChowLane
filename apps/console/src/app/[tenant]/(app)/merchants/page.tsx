"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Search, Store } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
} from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useMockStore } from "@/lib/store";
import { useConsole } from "@/lib/use-console";

/** S-111 — merchants (restaurants) the business delivers for. No merchant portal (D-006). */
export default function MerchantsPage() {
  return (
    <RequirePermission perm="merchants.manage">
      <Merchants />
    </RequirePermission>
  );
}

function Merchants() {
  const { db, tenant, base } = useConsole();
  const patch = useMockStore((s) => s.patch);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const all = db.merchants.filter((m) => m.tenantId === tenant.id);
  const list = all
    .filter((m) => m.status === tab)
    .filter((m) => `${m.name} ${m.category}`.toLowerCase().includes(q.trim().toLowerCase()));
  const productCount = (id: string) => db.products.filter((p) => p.merchantId === id).length;

  return (
    <>
      <PageHeader
        title="Merchants"
        description="Restaurants you deliver for. Riders order and pay at the store."
        actions={
          <Button asChild>
            <Link href={`${base}/merchants/new`}>
              <Plus /> Add
            </Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-auto">
            <TabsTrigger value="ACTIVE">
              Active ({all.filter((m) => m.status === "ACTIVE").length})
            </TabsTrigger>
            <TabsTrigger value="INACTIVE">
              Inactive ({all.filter((m) => m.status === "INACTIVE").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search merchants"
            className="pl-9"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title={
            q
              ? "No merchants match your search"
              : tab === "ACTIVE"
                ? "No merchants yet"
                : "No inactive merchants"
          }
          description={
            tab === "ACTIVE" && !q
              ? "Add the restaurants you deliver for, then add their menu."
              : undefined
          }
          action={
            tab === "ACTIVE" && !q ? (
              <Button asChild>
                <Link href={`${base}/merchants/new`}>Add merchant</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Link
                href={`${base}/merchants/${m.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-muted text-sm font-medium text-zinc-600">
                  {m.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {m.category} · {productCount(m.id)} items
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              {m.status === "ACTIVE" ? (
                <label className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="hidden sm:inline">{m.isOpen ? "Open" : "Closed"}</span>
                  <Switch
                    checked={m.isOpen}
                    aria-label={`${m.name} open`}
                    onCheckedChange={(v) => {
                      patch("merchants", m.id, { isOpen: v });
                      toast(`${m.name} is now ${v ? "open" : "closed"}`);
                    }}
                  />
                </label>
              ) : (
                <Badge>Inactive</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
