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
import { toMerchant } from "@chowlane/db/mappers";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-111 — merchants (restaurants) the business delivers for. No merchant portal (D-006). */
export default function MerchantsPage() {
  return (
    <RequirePermission perm="merchants.manage">
      <Merchants />
    </RequirePermission>
  );
}

function Merchants() {
  const { live, base, supabase } = useConsole();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const data = useLive(`merchants:${live.id}`, async (sb) => {
    const [merchants, products] = await Promise.all([
      sb.from("merchants").select("*").eq("tenant_id", live.id).order("name"),
      sb.from("products").select("merchant_id").eq("tenant_id", live.id),
    ]);
    return {
      merchants: must(merchants).map(toMerchant),
      productMerchantIds: must(products).map((p) => p.merchant_id),
    };
  });

  const all = data.data?.merchants ?? [];
  const list = all
    .filter((m) => m.status === tab)
    .filter((m) => `${m.name} ${m.category}`.toLowerCase().includes(q.trim().toLowerCase()));
  const productCount = (id: string) =>
    (data.data?.productMerchantIds ?? []).filter((x) => x === id).length;

  async function setOpen(id: string, name: string, open: boolean) {
    const { error } = await supabase.from("merchants").update({ is_open: open }).eq("id", id);
    toast(error ? `Couldn't save: ${error.message}` : `${name} is now ${open ? "open" : "closed"}`);
    await data.reload();
  }

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

      {data.error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          Couldn&apos;t load merchants: {data.error}
        </p>
      ) : null}
      {data.loading ? null : list.length === 0 ? (
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
                    onCheckedChange={(v) => void setOpen(m.id, m.name, v)}
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
