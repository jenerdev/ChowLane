"use client";

import { useState } from "react";
import { Button } from "./button";
import { Field, Textarea } from "./input";
import { Sheet, SheetContent } from "./sheet";

type ReasonSheetProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  /** Preset reasons shown as choices (+ "Other" with a text field). */
  presets?: string[];
  /** Text field label / hint (used when there are no presets, or "Other" is chosen). */
  label?: string;
  hint?: string;
  /** false = the text may be left empty (e.g. an optional payment note). */
  required?: boolean;
  confirmLabel: string;
  destructive?: boolean;
  onSubmit: (reason: string) => void;
};

/** Pick a preset reason or write one (reject, cancel, suspend, payment note…). */
export function ReasonSheet({
  open,
  onOpenChange,
  title,
  description,
  presets = [],
  label = "Reason",
  hint,
  required = true,
  confirmLabel,
  destructive,
  onSubmit,
}: ReasonSheetProps) {
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  const free = presets.length === 0 || choice === "__other";
  const reason = free ? other.trim() : choice;
  const ok = !required || Boolean(reason);
  const reset = () => {
    setChoice("");
    setOther("");
  };
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <SheetContent title={title} description={description}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ok) return;
            onSubmit(reason);
            onOpenChange(false);
            reset();
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
          {free ? (
            <Field label={label} htmlFor="reason-text" hint={hint}>
              <Textarea
                id="reason-text"
                value={other}
                onChange={(e) => setOther(e.target.value)}
                autoFocus
              />
            </Field>
          ) : null}
          <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={!ok}>
            {confirmLabel}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
