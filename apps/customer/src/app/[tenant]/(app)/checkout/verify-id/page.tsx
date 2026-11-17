"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { needsIdForOrder } from "@chowlane/lib";
import { PageHeader, toast } from "@chowlane/ui";
import { IdForm } from "@/components/id-form";
import { uploadIdPhotos } from "@/lib/id-upload";
import { useCheckout } from "@/lib/use-place-order";

/**
 * S-306 — first-order ID (CUS-006) and re-submission after a rejection (CUS-012, `?resubmit=1`).
 * With an order: the ID is sent together with the order. Re-submit: only the ID (submit_verification).
 * Photos go to the private id-documents bucket first (2.5).
 */
export default function VerifyIdPage() {
  const router = useRouter();
  const resubmit = useSearchParams().get("resubmit") === "1";
  const c = useCheckout();
  const [sending, setSending] = useState(false);
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
      {!resubmit && !needsIdForOrder(me) && !sending ? (
        <p className="text-sm text-muted-foreground">
          Your ID is already verified or being checked — go back to checkout to place your order.
        </p>
      ) : (
        <IdForm
          accepted={c.settings.acceptedIdTypes}
          submitLabel={resubmit ? "Send ID" : "Send ID & place order"}
          busy={sending || c.busy}
          onSubmit={async (v) => {
            setSending(true);
            try {
              const upload = await uploadIdPhotos(c.supabase, c.tenant.id, me.id, v);
              if (resubmit) {
                const { error } = await c.supabase.rpc("submit_verification", {
                  p_tenant: c.tenant.id,
                  p_id_type: upload.idType,
                  p_id_front_url: upload.idFrontUrl,
                  p_selfie_with_id_url: upload.selfieWithIdUrl,
                });
                if (error) {
                  setSending(false);
                  return toast(error.message, "error");
                }
                await c.reload();
                toast("ID sent — we'll check it soon");
                router.replace(`${c.base}/profile`);
              } else if (await c.place(upload)) {
                return; // stay "sending" while the order page opens (no flash of the verified note)
              }
              setSending(false);
            } catch (e) {
              toast(e instanceof Error ? e.message : String(e), "error");
              setSending(false);
            }
          }}
        />
      )}
    </>
  );
}
