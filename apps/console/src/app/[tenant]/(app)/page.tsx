"use client";

import Link from "next/link";
import { Check, ChevronRight, Circle } from "lucide-react";
import { checklistProgress, setupChecklist } from "@chowlane/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Progress,
  Stat,
  cn,
} from "@chowlane/ui";
import { useConsole } from "@/lib/use-console";

/** S-101 — console home: setup checklist (until done) + today's numbers (OWN-001, ADM-008). */
export default function ConsoleHome() {
  const { db, tenant, settings, me, can, base } = useConsole();
  const of = <T extends { tenantId: string }>(rows: T[]) =>
    rows.filter((r) => r.tenantId === tenant.id);

  const steps = setupChecklist({
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    serviceAreaConfirmed: Boolean(settings.serviceArea),
    deliveryFeeMode: settings.deliveryFee.mode,
    barangayCount: of(db.barangayFees).filter((b) => b.isActive).length,
    riderPayMode: settings.riderPay.mode,
    merchants: of(db.merchants),
    products: of(db.products),
    riders: of(db.riders),
    staff: of(db.staff),
  });
  const progress = checklistProgress(steps);
  const showSetup = can("settings.business") && !progress.complete;

  const orders = of(db.orders);
  const stats = [
    {
      label: "Orders to approve",
      value: orders.filter((o) => o.status === "PENDING_APPROVAL").length,
      perm: "orders.approve" as const,
    },
    {
      label: "Customers to verify",
      value: of(db.customers).filter((c) => c.verificationStatus === "PENDING").length,
      perm: "customers.verify" as const,
    },
    {
      label: "Active orders",
      value: orders.filter((o) =>
        ["APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"].includes(o.status),
      ).length,
      perm: "orders.view" as const,
    },
    {
      label: "Riders on shift",
      value: of(db.riders).filter((r) => r.isOnShift).length,
      perm: "riders.view" as const,
    },
    {
      label: "Cash to record",
      value: of(db.shifts).filter((s) => s.remitStatus === "PENDING").length,
      perm: "cash.manage" as const,
    },
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
