"use client";

import { FlaskConical, RotateCcw } from "lucide-react";
import { Button, Sheet, SheetContent, SheetTrigger } from "@chowlane/ui";
import { tenants } from "../data";

export type AppKey = "landing" | "console" | "rider" | "customer" | "platform";

/** Dev URLs per app — override in production previews with NEXT_PUBLIC_APP_URL_<APP>. */
const APP_URLS: Record<AppKey, string> = {
  landing: process.env.NEXT_PUBLIC_APP_URL_LANDING ?? "http://localhost:3000",
  console: process.env.NEXT_PUBLIC_APP_URL_CONSOLE ?? "http://localhost:3001",
  rider: process.env.NEXT_PUBLIC_APP_URL_RIDER ?? "http://localhost:3002",
  customer: process.env.NEXT_PUBLIC_APP_URL_CUSTOMER ?? "http://localhost:3003",
  platform: process.env.NEXT_PUBLIC_APP_URL_PLATFORM ?? "http://localhost:3004",
};
/** Base URL of another app (Phase 1: separate ports / preview URLs). */
export function appUrl(app: AppKey): string {
  return APP_URLS[app];
}

const TENANT_APPS: AppKey[] = ["console", "rider", "customer"];
const APP_LABEL: Record<AppKey, string> = {
  landing: "Landing",
  console: "Console (Owner/Admin)",
  rider: "Rider",
  customer: "Customer",
  platform: "Platform Admin",
};

// ------------------------------------------------------------------ toolbar
type DevToolbarProps = {
  app: AppKey;
  tenantSlug?: string;
  /** Resets this app's demo data. */
  onReset?: () => void;
};

/**
 * Floating dev-only switcher: jump between apps & tenants, reset the mock data of screens not yet on Supabase.
 * Logins are real since Milestone 2.3 (no "acting as"); the whole toolbar goes in 2.8 (D-045).
 */
export function DevToolbar({ app, tenantSlug, onReset }: DevToolbarProps) {
  if (process.env.NEXT_PUBLIC_DEV_TOOLS === "0") return null;

  const link = (target: AppKey, slug = tenantSlug) =>
    TENANT_APPS.includes(target)
      ? `${APP_URLS[target]}/${slug ?? tenants[0]!.slug}`
      : APP_URLS[target];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Dev tools"
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-40 inline-flex items-center gap-1 rounded-full border bg-background/90 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur md:bottom-4"
        >
          <FlaskConical className="size-3.5" /> DEV
        </button>
      </SheetTrigger>
      <SheetContent
        title="Prototype switcher"
        description="Logins are real; screens not yet on Supabase use per-browser demo data."
      >
        {tenantSlug ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Tenant</p>
            <div className="flex flex-wrap gap-2">
              {tenants.map((t) => (
                <a
                  key={t.slug}
                  href={link(app, t.slug)}
                  className={`rounded-full border px-3 py-1 text-sm ${t.slug === tenantSlug ? "border-zinc-900 text-foreground" : ""}`}
                >
                  {t.businessName}
                  {t.status === "SUSPENDED" ? " (suspended)" : ""}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">Open app</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(APP_URLS) as AppKey[]).map((a) => (
              <a
                key={a}
                href={link(a)}
                className={`rounded-control border px-3 py-2 text-sm ${a === app ? "border-zinc-900 font-medium text-foreground" : "hover:bg-muted"}`}
              >
                {APP_LABEL[a]}
              </a>
            ))}
          </div>
        </div>

        {onReset ? (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw /> Reset demo data
          </Button>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
