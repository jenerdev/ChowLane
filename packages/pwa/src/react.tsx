"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useSerwist } from "@serwist/turbopack/react";
import { Download, RefreshCw, Share, SquarePlus, WifiOff, X } from "lucide-react";
import { Button, TenantLogo } from "@chowlane/ui";

// ------------------------------------------------------------------ online status
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** true while the device is online. Use it to disable server actions offline (BL-9.6). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** Slim banner shown while offline (BL-9.6). */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-xs font-medium text-background"
    >
      <WifiOff className="size-3.5" /> You&apos;re offline — ordering and updates are paused.
    </div>
  );
}

/** Full-page fallback served by the service worker for documents when offline. */
export function OfflineScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="rounded-full bg-muted p-4">
        <WifiOff className="size-7" />
      </div>
      <h1 className="text-lg font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Check your internet connection. The app will reload when you&apos;re back online.
      </p>
    </main>
  );
}

// ------------------------------------------------------------------ install prompt
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_DAYS = 7; // BL-9.4

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

function dismissedRecently(key: string) {
  try {
    const at = Number(localStorage.getItem(key));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

type InstallPromptProps = {
  /** Installed app name, e.g. "FastBite Delivery Rider". */
  appName: string;
  /** Unique per tenant + app, e.g. "rider:fastbite". */
  storageKey: string;
  logoUrl?: string;
  /** Rider app: explain that the app must stay open during a shift (BL-9.5). */
  note?: ReactNode;
  /** Delay before showing, ms. */
  delayMs?: number;
};

/**
 * "Install app" card (FND-011, F-10): Android/desktop Chrome → native install prompt;
 * iPhone Safari → "Share → Add to Home Screen" steps. Hidden when already installed or dismissed < 7 days ago.
 */
export function InstallPrompt({
  appName,
  storageKey,
  logoUrl,
  note,
  delayMs = 2500,
}: InstallPromptProps) {
  const key = `cl-install-dismissed:${storageKey}`;
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");

  useEffect(() => {
    if (isStandalone() || dismissedRecently(key)) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => {
      if (isIosSafari()) setMode("ios");
    }, delayMs);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, [key, delayMs]);

  useEffect(() => {
    if (!deferred) return;
    const timer = window.setTimeout(() => setMode("native"), delayMs);
    return () => window.clearTimeout(timer);
  }, [deferred, delayMs]);

  const dismiss = () => {
    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {
      /* storage blocked — just hide */
    }
    setMode("hidden");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode("hidden");
  };

  if (mode === "hidden") return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border bg-background p-4 shadow-xl md:bottom-6">
      <div className="flex items-start gap-3">
        <TenantLogo name={appName} logoUrl={logoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Install {appName}</p>
          {mode === "native" ? (
            <p className="text-sm text-muted-foreground">
              Add it to your home screen — opens full-screen like an app.
            </p>
          ) : (
            <ol className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                1. Tap <Share className="size-4 text-info" /> <b>Share</b> in Safari
              </li>
              <li className="flex items-center gap-1.5">
                2. Choose <SquarePlus className="size-4" /> <b>Add to Home Screen</b>
              </li>
              <li>
                3. Tap <b>Add</b>
              </li>
            </ol>
          )}
          {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
        </div>
        <button
          onClick={dismiss}
          aria-label="Not now"
          className="-m-1 rounded-full p-1 hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
      {mode === "native" ? (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" block onClick={dismiss}>
            Not now
          </Button>
          <Button block onClick={install}>
            <Download /> Install
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ update banner
/** "New version available — Reload" when an updated service worker takes control (FND-012). */
export function UpdateBanner() {
  const { serwist } = useSerwist();
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!serwist) return;
    const onControlling = (event: { isUpdate?: boolean }) => {
      if (event.isUpdate) setUpdated(true);
    };
    serwist.addEventListener("controlling", onControlling);
    return () => serwist.removeEventListener("controlling", onControlling);
  }, [serwist]);

  if (!updated) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground p-3 pl-4 text-sm text-background shadow-xl"
    >
      <span className="flex-1">New version available</span>
      <Button size="sm" onClick={() => window.location.reload()}>
        <RefreshCw /> Reload
      </Button>
    </div>
  );
}
