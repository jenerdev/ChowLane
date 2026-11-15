"use client";

import { useState } from "react";
import type { RiderRejectReason } from "@chowlane/types";
import { RIDER_REJECT_LABELS } from "@chowlane/lib";
import { Button, Field, Input, Sheet, SheetContent } from "@chowlane/ui";

const REASONS: RiderRejectReason[] = ["NOT_ENOUGH_CASH", "TOO_FAR", "VEHICLE_PROBLEM", "OTHER"];

/** Why the rider declines an offer (BL-5.7). */
export function RejectSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (reason: RiderRejectReason, note?: string) => void;
}) {
  const [reason, setReason] = useState<RiderRejectReason | null>(null);
  const [note, setNote] = useState("");
  const valid = reason && (reason !== "OTHER" || note.trim());
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Decline this order?" description="It goes to another rider.">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSubmit(reason!, note.trim() || undefined);
            onOpenChange(false);
            setReason(null);
            setNote("");
          }}
        >
          <div role="radiogroup" className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className="flex h-12 cursor-pointer items-center gap-3 rounded-control border px-3 text-[15px] has-[:checked]:border-zinc-900 has-[:checked]:bg-subtle"
              >
                <input
                  type="radio"
                  name="reject"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-zinc-900"
                />
                {RIDER_REJECT_LABELS[r]}
              </label>
            ))}
          </div>
          {reason === "OTHER" ? (
            <Field label="Reason" htmlFor="reject-note">
              <Input
                id="reject-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                autoFocus
              />
            </Field>
          ) : null}
          <Button type="submit" size="lg" variant="destructive" disabled={!valid}>
            Decline order
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
