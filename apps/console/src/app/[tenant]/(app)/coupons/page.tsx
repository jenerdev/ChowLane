"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Ticket } from "lucide-react";
import { COUPON_STATUS_LABELS, couponStatus, formatDate, type CouponStatus } from "@chowlane/lib";
import { toCoupon } from "@chowlane/db/mappers";
import { Badge, Button, EmptyState, PageHeader, Tabs, TabsList, TabsTrigger } from "@chowlane/ui";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";
import { couponSummary, STATUS_TONE } from "./coupon-utils";

/** S-125 — coupons with status and usage (OWN-017, OWN-018). */
export default function CouponsPage() {
  return (
    <RequirePermission perm="coupons.manage">
      <Coupons />
    </RequirePermission>
  );
}

type Filter = "current" | "ended";

function Coupons() {
  const { live, base } = useConsole();
  const [filter, setFilter] = useState<Filter>("current");
  const now = new Date().toISOString();
  const data = useLive(`coupons:${live.id}`, async (sb) =>
    must(await sb.from("coupons").select("*").eq("tenant_id", live.id)).map(toCoupon),
  );
  const all = (data.data ?? [])
    .map((c) => ({ c, status: couponStatus(c, now) }))
    .sort((a, b) => Date.parse(b.c.validFrom) - Date.parse(a.c.validFrom));
  const isCurrent = (s: CouponStatus) => s === "ACTIVE" || s === "SCHEDULED";
  const list = all.filter((x) =>
    filter === "current" ? isCurrent(x.status) : !isCurrent(x.status),
  );

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Codes customers enter at checkout."
        actions={
          <Button asChild>
            <Link href={`${base}/coupons/new`}>
              <Plus /> New
            </Link>
          </Button>
        }
      />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
        <TabsList className="w-auto">
          <TabsTrigger value="current">
            Active & scheduled ({all.filter((x) => isCurrent(x.status)).length})
          </TabsTrigger>
          <TabsTrigger value="ended">
            Ended & off ({all.filter((x) => !isCurrent(x.status)).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {data.error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          Couldn&apos;t load coupons: {data.error}
        </p>
      ) : null}
      {data.loading ? null : list.length === 0 ? (
        <EmptyState
          icon={<Ticket />}
          title={filter === "current" ? "No active coupons" : "Nothing here"}
          description={
            filter === "current" ? "Create a coupon code to bring customers back." : undefined
          }
          action={
            filter === "current" ? (
              <Button asChild>
                <Link href={`${base}/coupons/new`}>New coupon</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y rounded-card border">
          {list.map(({ c, status }) => (
            <li key={c.id}>
              <Link
                href={`${base}/coupons/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium tracking-wide">{c.code}</span>
                    <Badge tone={STATUS_TONE[status]}>{COUPON_STATUS_LABELS[status]}</Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                    {couponSummary(c)} · {formatDate(c.validFrom)} – {formatDate(c.validUntil)}
                  </span>
                </span>
                <span className="text-right text-[13px] text-muted-foreground tabular-nums">
                  {c.usedCount}/{c.maxUses}
                  <span className="block">used</span>
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
