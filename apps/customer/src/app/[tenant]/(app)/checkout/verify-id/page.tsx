"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { needsIdForOrder } from "@chowlane/lib";
import { PageHeader, toast } from "@chowlane/ui";
import { IdForm } from "@/components/id-form";
import { useMockStore } from "@/lib/store";
import { useCheckout } from "@/lib/use-place-order";
import { newId } from "@/lib/use-customer";

/**
 * S-306 — first-order ID (CUS-006) and re-submission after a rejection (CUS-012, `?resubmit=1`).
 * With an order: the ID is sent together with the order. Re-submit: only the ID.
 */
export default function VerifyIdPage() {
  const router = useRouter();
  const resubmit = useSearchParams().get("resubmit") === "1";
  const c = useCheckout();
  const patch = useMockStore((s) => s.patch);
  if (!c.me) return null;
  const me = c.me;
  const rejected = me.verificationStatus === "REJECTED" ? me.verification?.rejectReason : undefined;

  return (
    <>
      <PageHeader
        back={
          resubmit
            ? { href: `${c.base}/profile`, label: "Profile" }
            : { href: `${c.base}/checkout`, label: "Checkout" }
        }
        title={resubmit ? "Send a new ID" : "Verify your ID"}
        description={
          resubmit
            ? "We'll check it and let you know."
            : "First order only. We confirm your order right after we check it."
        }
      />
      {rejected ? (
        <p className="mb-5 rounded-control bg-danger-soft px-4 py-3 text-sm text-danger">
          Your last ID wasn&apos;t accepted: {rejected}
        </p>
      ) : null}
      {!resubmit && !needsIdForOrder(me) ? (
        <p className="text-sm text-muted-foreground">
          Your ID is already verified or being checked — go back to checkout to place your order.
        </p>
      ) : (
        <IdForm
          accepted={c.settings.acceptedIdTypes}
          submitLabel={resubmit ? "Send ID" : "Send ID & place order"}
          onSubmit={(v) => {
            if (resubmit) {
              const ver = { ...v, id: newId("v"), submittedAt: new Date().toISOString() };
              patch("customers", me.id, {
                verificationStatus: "PENDING",
                verification: ver,
                verificationHistory: [...me.verificationHistory, ver],
              });
              toast("ID sent — we'll check it soon");
              router.replace(`${c.base}/profile`);
            } else {
              c.place(v);
            }
          }}
        />
      )}
    </>
  );
}
