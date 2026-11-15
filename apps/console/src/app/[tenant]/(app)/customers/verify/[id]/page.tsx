"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { ID_TYPE_LABELS } from "@chowlane/types";
import { formatDateTime, ID_REJECT_REASONS } from "@chowlane/lib";
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
import { ReasonSheet } from "@/components/reason-sheet";
import { RequirePermission } from "@/components/require-permission";
import { useConsole } from "@/lib/use-console";
import { useOrderActions } from "@/lib/use-order-actions";

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
  const router = useRouter();
  const { db, tenant, base } = useConsole();
  const actions = useOrderActions();
  const [reject, setReject] = useState(false);
  const c = db.customers.find((x) => x.id === id && x.tenantId === tenant.id);
  if (!c || !c.verification) return <EmptyState icon={<UserRound />} title="Nothing to review" />;
  const v = c.verification;
  const order = db.orders.find((o) => o.customerId === c.id && o.status === "PENDING_APPROVAL");
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
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setReject(true)}>
            Reject ID
          </Button>
          <Button
            onClick={() => {
              actions.approveCustomer(c);
              router.push(order ? `${base}/orders/${order.id}` : `${base}/customers/verify`);
            }}
          >
            Approve ID{order ? " & review order" : ""}
          </Button>
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
            href={`${base}/orders/${order.id}`}
            className="underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {order.orderNumber}
          </Link>{" "}
          — it is rejected automatically if you reject the ID.
        </p>
      ) : null}

      <ReasonSheet
        open={reject}
        onOpenChange={setReject}
        title="Reject this ID?"
        description="The customer sees the reason and can send a new ID."
        presets={ID_REJECT_REASONS}
        confirmLabel="Reject ID"
        destructive
        onSubmit={(r) => {
          actions.rejectCustomer(c, r);
          router.push(`${base}/customers/verify`);
        }}
      />
    </>
  );
}
