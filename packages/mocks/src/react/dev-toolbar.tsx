"use client";

import { useSyncExternalStore } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { Button, Select, Sheet, SheetContent, SheetTrigger } from "@chowlane/ui";
import { tenants } from "../data";

export type AppKey = "landing" | "console" | "rider" | "customer" | "platform";
export type Persona = { id: string; label: string; detail?: string };

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

// ------------------------------------------------------------------ persona ("acting as") — localStorage
const PERSONA_KEY = "chowlane-dev-persona";
const listeners = new Set<() => void>();

function readPersonas(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PERSONA_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writePersona(scope: string, id: string) {
  try {
    localStorage.setItem(PERSONA_KEY, JSON.stringify({ ...readPersonas(), [scope]: id }));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * Which mock user this browser is "acting as" in an app + tenant (FND-007).
 * Phase 2 replaces this with the real logged-in user.
 */
export function usePersona(scope: string, fallbackId: string): [string, (id: string) => void] {
  const id = useSyncExternalStore(
    subscribe,
    () => readPersonas()[scope] ?? fallbackId,
    () => fallbackId,
  );
  return [id, (next) => writePersona(scope, next)];
}

function clearPersona(scope: string) {
  try {
    const all = readPersonas();
    delete all[scope];
    localStorage.setItem(PERSONA_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const noopSubscribe = () => () => {};

/**
 * Mock login session for an app + tenant (LND-004). `ready` is false during SSR / first render,
 * so guards don't redirect before localStorage has been read. Phase 2: Supabase Auth.
 */
export function useSession(scope: string) {
  const staffId = useSyncExternalStore(
    subscribe,
    () => readPersonas()[scope] ?? null,
    () => null,
  );
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return {
    staffId,
    ready,
    signIn: (id: string) => writePersona(scope, id),
    signOut: () => clearPersona(scope),
  };
}

// ------------------------------------------------------------------ toolbar
type DevToolbarProps = {
  app: AppKey;
  tenantSlug?: string;
  /** Persona choices for this app + tenant (staff / riders / customers / platform admins). */
  personas?: Persona[];
  personaScope?: string;
  /** Resets this app's demo data. */
  onReset?: () => void;
};

/** Floating dev-only switcher: jump between apps & tenants, pick who you act as, reset demo data. */
export function DevToolbar({
  app,
  tenantSlug,
  personas = [],
  personaScope,
  onReset,
}: DevToolbarProps) {
  const [personaId, setPersonaId] = usePersona(personaScope ?? app, personas[0]?.id ?? "");
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
      <SheetContent title="Prototype switcher" description="Phase 1 mock data — not a real login.">
        {personas.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dev-persona" className="text-sm font-medium">
              Acting as
            </label>
            <Select
              id="dev-persona"
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.detail ? ` — ${p.detail}` : ""}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

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
