"use client";

import { useState } from "react";
import { Button, Field, Sheet, SheetContent, Textarea } from "@chowlane/ui";

type ReasonSheetProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  presets?: string[];
  confirmLabel: string;
  destructive?: boolean;
  onSubmit: (reason: string) => void;
};

/** Pick a preset reason or write one — shown to the customer/rider where relevant. */
export function ReasonSheet({
  open,
  onOpenChange,
  title,
  description,
  presets = [],
  confirmLabel,
  destructive,
  onSubmit,
}: ReasonSheetProps) {
  const [choice, setChoice] = useState<string>("");
  const [other, setOther] = useState("");
  const reason = choice === "__other" || presets.length === 0 ? other.trim() : choice;
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setChoice("");
          setOther("");
        }
      }}
    >
      <SheetContent title={title} description={description}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason) return;
            onSubmit(reason);
            onOpenChange(false);
          }}
        >
          {presets.length ? (
            <div role="radiogroup" className="flex flex-col gap-2">
              {[...presets, "__other"].map((p) => (
                <label
                  key={p}
                  className="flex cursor-pointer items-center gap-3 rounded-control border px-3 py-2.5 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-subtle"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={p}
                    checked={choice === p}
                    onChange={() => setChoice(p)}
                    className="accent-zinc-900"
                  />
                  {p === "__other" ? "Other" : p}
                </label>
              ))}
            </div>
          ) : null}
          {choice === "__other" || presets.length === 0 ? (
            <Field label="Reason" htmlFor="reason-text">
              <Textarea
                id="reason-text"
                value={other}
                onChange={(e) => setOther(e.target.value)}
                autoFocus
              />
            </Field>
          ) : null}
          <Button
            type="submit"
            variant={destructive ? "destructive" : "default"}
            disabled={!reason}
          >
            {confirmLabel}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
