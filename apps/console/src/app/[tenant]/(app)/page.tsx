"use client";

import Link from "next/link";
import { Check, ChevronRight, Circle, CircleAlert } from "lucide-react";
import { checklistProgress, setupChecklist } from "@chowlane/lib";
import {
  toMerchant,
  toProduct,
  toRider,
  toStaffUser,
  toTenantSettings,
} from "@chowlane/db/mappers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Progress,
  Stat,
  cn,
} from "@chowlane/ui";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-101 — console home: setup checklist (until done) + today's numbers (OWN-001, ADM-008). */
export default function ConsoleHome() {
  const { live: tenant, me, can, base } = useConsole();
  // Live since 2.4. Counts come from Supabase (RLS); a count the user can't see stays 0 and isn't shown.
  const data = useLive(`home:${tenant.id}`, async (sb) => {
    const count = async (
      q: PromiseLike<{ count: number | null; error: { message: string } | null }>,
    ) => {
      const res = await q;
      if (res.error) throw new Error(res.error.message);
      return res.count ?? 0;
    };
    const head = { count: "exact" as const, head: true };
    const [settings, barangays, merchants, products, riders, staff, counts] = await Promise.all([
      sb.from("tenant_settings").select("*").eq("tenant_id", tenant.id).single(),
      count(
        sb
          .from("barangay_fees")
          .select("id", head)
          .eq("tenant_id", tenant.id)
          .eq("is_active", true),
      ),
      sb.from("merchants").select("*").eq("tenant_id", tenant.id),
      sb.from("products").select("*").eq("tenant_id", tenant.id),
      sb.from("riders").select("*").eq("tenant_id", tenant.id),
      sb.from("staff_users").select("*").eq("tenant_id", tenant.id),
      Promise.all([
        count(
          sb
            .from("orders")
            .select("id", head)
            .eq("tenant_id", tenant.id)
            .eq("status", "PENDING_APPROVAL"),
        ),
        count(
          sb
            .from("customers")
            .select("id", head)
            .eq("tenant_id", tenant.id)
            .eq("verification_status", "PENDING"),
        ),
        count(
          sb
            .from("orders")
            .select("id", head)
            .eq("tenant_id", tenant.id)
            .in("status", ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"]),
        ),
        count(
          sb.from("riders").select("id", head).eq("tenant_id", tenant.id).eq("is_on_shift", true),
        ),
        count(
          sb
            .from("shifts")
            .select("id", head)
            .eq("tenant_id", tenant.id)
            .eq("remit_status", "PENDING"),
        ),
      ]),
    ]);
    return {
      settings: toTenantSettings(must(settings)),
      barangays,
      merchants: must(merchants).map(toMerchant),
      products: must(products).map(toProduct),
      riders: must(riders).map(toRider),
      staff: must(staff).map(toStaffUser),
      counts,
    };
  });
  if (data.loading) return null;
  if (!data.data)
    return <EmptyState icon={<CircleAlert />} title="Couldn't load" description={data.error} />;
  const d = data.data;

  const steps = setupChecklist({
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    serviceAreaConfirmed: Boolean(d.settings.serviceArea),
    deliveryFeeMode: d.settings.deliveryFee?.mode,
    barangayCount: d.barangays,
    riderPayMode: d.settings.riderPay?.mode,
    merchants: d.merchants,
    products: d.products,
    riders: d.riders,
    staff: d.staff,
  });
  const progress = checklistProgress(steps);
  const showSetup = can("settings.business") && !progress.complete;

  const [toApprove, toVerify, active, onShift, cash] = d.counts;
  const stats = [
    { label: "Orders to approve", value: toApprove, perm: "orders.approve" as const },
    { label: "Customers to verify", value: toVerify, perm: "customers.verify" as const },
    { label: "Active orders", value: active, perm: "orders.view" as const },
    { label: "Riders on shift", value: onShift, perm: "riders.view" as const },
    { label: "Cash to record", value: cash, perm: "cash.manage" as const },
  ].filter((s) => can(s.perm));

  return (
    <>
      <PageHeader
        title={`Good day, ${me?.name.split(" ")[0] ?? ""}`}
        description={tenant.businessName}
      />

      {showSetup || (can("settings.business") && steps.some((s) => s.optional && !s.done)) ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{progress.complete ? "A few extras" : "Finish setting up"}</CardTitle>
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {progress.done} of {progress.total} done
              </span>
            </div>
            <Progress
              value={progress.done / progress.total}
              label="Setup progress"
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="pb-2">
            <ul className="-mx-2 flex flex-col">
              {steps.map((s) => (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    className="flex h-11 items-center gap-3 rounded-control px-2 text-sm hover:bg-muted"
                  >
                    {s.done ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                        <Check className="size-3" />
                      </span>
                    ) : (
                      <Circle className="size-5 text-zinc-300" />
                    )}
                    <span
                      className={cn(
                        "flex-1",
                        s.done && "text-muted-foreground line-through decoration-zinc-300",
                      )}
                    >
                      {s.title}
                      {s.optional ? (
                        <span className="text-muted-foreground"> (optional)</span>
                      ) : null}
                    </span>
                    {!s.done ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : null}

      <p className="mt-8 text-[13px] text-muted-foreground">
        Your customer app: <span className="text-foreground">chowlane.app{base}</span>
      </p>
    </>
  );
}
