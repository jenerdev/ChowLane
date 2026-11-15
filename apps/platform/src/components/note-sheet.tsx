"use client";

import { useState } from "react";
import { Button, Field, Sheet, SheetContent, Textarea } from "@chowlane/ui";

type NoteSheetProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  label: string;
  hint?: string;
  required?: boolean;
  confirmLabel: string;
  destructive?: boolean;
  onSubmit: (note: string) => void;
};

/** Sheet with one text field (reason / payment note). App-local version of the console's ReasonSheet. */
export function NoteSheet({
  open,
  onOpenChange,
  title,
  description,
  label,
  hint,
  required,
  confirmLabel,
  destructive,
  onSubmit,
}: NoteSheetProps) {
  const [note, setNote] = useState("");
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setNote("");
      }}
    >
      <SheetContent title={title} description={description}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (required && !note.trim()) return;
            onSubmit(note.trim());
            onOpenChange(false);
            setNote("");
          }}
        >
          <Field label={label} htmlFor="note-text" hint={hint}>
            <Textarea
              id="note-text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
          </Field>
          <Button
            type="submit"
            variant={destructive ? "destructive" : "default"}
            disabled={required && !note.trim()}
          >
            {confirmLabel}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
