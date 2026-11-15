import { Eye } from "lucide-react";

/** Reminder that platform admins only view tenant records (D-028). */
export function ReadOnlyNote() {
  return (
    <p className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground">
      <Eye className="size-4" /> View only — the business manages this in its own console.
    </p>
  );
}
