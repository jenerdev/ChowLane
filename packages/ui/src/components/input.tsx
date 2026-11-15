import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

const field =
  "w-full rounded-control border border-input bg-background px-3 text-base outline-none transition-colors duration-150 placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/15";

/** text-base (16px) prevents iOS zoom-on-focus. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(field, "h-11 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Label + control + hint/error, stacked (mobile-first forms). */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
