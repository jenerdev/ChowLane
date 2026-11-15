import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

const field =
  "w-full rounded-xl border border-input bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-danger";

/** text-base (16px) prevents iOS zoom-on-focus. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(field, "h-11 appearance-none bg-[length:16px] pr-8", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

/** Label + control + hint/error, stacked (mobile-first forms). */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
