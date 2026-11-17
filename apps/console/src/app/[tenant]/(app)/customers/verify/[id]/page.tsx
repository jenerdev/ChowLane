"use client";

import { use } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { ID_TYPE_LABELS } from "@chowlane/types";
import { formatDateTime } from "@chowlane/lib";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  VerificationBadge,
} from "@chowlane/ui";
import { IdImage } from "@/components/id-image";
import { RequirePermission } from "@/components/require-permission";
import { loadCustomers } from "@/lib/customers";
import { useConsole } from "@/lib/use-console";
import { must, useLive } from "@/lib/use-live";

/** S-105 — compare the ID with the selfie and the Facebook photo, then approve or reject (ADM-001, BL-3). */
export default function VerifyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission perm="customers.verify">
      <Review id={id} />
    </RequirePermission>
  );
}

function Review({ id }: { id: string }) {
  const { live, base, db } = useConsole();
  const data = useLive(`verify:${id}`, async (sb) => {
    const [customer] = await loadCustomers(sb, live.id, { ids: [id] });
    if (!customer) return null;
    const waiting = must(
      await sb
        .from("orders")
        .select("order_number")
        .eq("customer_id", id)
        .eq("status", "PENDING_APPROVAL")
        .limit(1),
    );
    return { customer, waitingOrder: waiting[0]?.order_number };
  });
  if (data.loading) return null;
  const c = data.data?.customer;
  if (!c || !c.verification)
    return <EmptyState icon={<UserRound />} title="Nothing to review" description={data.error} />;
  const v = c.verification;
  // The order screen still runs on mock data (until 2.5–2.6): open the same order by its number.
  const waitingNumber = data.data?.waitingOrder;
  const mockOrder = waitingNumber
    ? db.orders.find((o) => o.orderNumber === waitingNumber)
    : undefined;
  const order = waitingNumber
    ? {
        orderNumber: waitingNumber,
        href: mockOrder ? `${base}/orders/${mockOrder.id}` : `${base}/orders`,
      }
    : undefined;
  const past = c.verificationHistory.filter((h) => h.id !== v.id);

  return (
    <>
      <PageHeader
        back={{ href: `${base}/customers/verify`, label: "Verify customers" }}
        title={c.name}
        actions={<VerificationBadge status={c.verificationStatus} />}
      />
      <div className="mb-6 flex items-center gap-3">
        <Avatar name={c.name} src={c.avatarUrl || undefined} size="lg" />
        <div className="text-sm">
          <p className="font-medium">Facebook profile</p>
          <p className="text-muted-foreground">
            {ID_TYPE_LABELS[v.idType]} · sent {formatDateTime(v.submittedAt)}
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <IdImage
          src={v.idFrontUrl || undefined}
          kind="id"
          label={`${ID_TYPE_LABELS[v.idType]} — front`}
        />
        <IdImage src={v.selfieWithIdUrl || undefined} kind="selfie" label="Selfie holding the ID" />
      </div>
      <p className="mt-4 text-[13px] text-muted-foreground">
        Check that the face matches, the name matches the account, and the ID is readable and not
        expired.
      </p>

      {c.verificationStatus === "PENDING" ? (
        <div className="mt-6 flex flex-col gap-2 sm:items-end">
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" disabled>
              Reject ID
            </Button>
            <Button disabled>Approve ID{order ? " & review order" : ""}</Button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Approving and rejecting IDs switches on with live ordering in the next update.
          </p>
        </div>
      ) : null}

      {past.length ? (
        <Card className="mt-8">
          <CardContent className="pt-5">
            <p className="mb-2 text-sm font-medium">Earlier submissions</p>
            <ul className="divide-y">
              {past.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    {ID_TYPE_LABELS[h.idType]}
                    <span className="block text-[13px] text-muted-foreground">
                      {formatDateTime(h.submittedAt)}
                      {h.rejectReason ? ` · ${h.rejectReason}` : ""}
                    </span>
                  </span>
                  <Badge
                    tone={
                      h.result === "APPROVED"
                        ? "success"
                        : h.result === "REJECTED"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {h.result === "APPROVED"
                      ? "Approved"
                      : h.result === "REJECTED"
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {order ? (
        <p className="mt-6 text-sm">
          Waiting order:{" "}
          <Link
            href={order.href}
            className="underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {order.orderNumber}
          </Link>{" "}
          — it is rejected automatically if you reject the ID.
        </p>
      ) : null}
    </>
  );
}
