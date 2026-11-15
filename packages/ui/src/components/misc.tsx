import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Separator({ className, ...props }: ComponentProps<"hr">) {
  return <hr className={cn("border-t", className)} {...props} />;
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-control bg-muted", className)} {...props} />;
}

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-6 py-16 text-center", className)}>
      {icon ? <div className="mb-2 text-zinc-400 [&_svg]:size-8">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-xs text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

type StatProps = { label: string; value: ReactNode; hint?: string; className?: string };

/** KPI tile: quiet label, prominent number. */
export function Stat({ label, value, hint, className }: StatProps) {
  return (
    <div className={cn("rounded-card border p-4", className)}>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
