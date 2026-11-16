"use client";

import type { ReactNode } from "react";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { Toaster } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";
import { PlatformIdentityProvider } from "@/lib/identity";

/**
 * App-wide pieces for every page (incl. login): Supabase session, mock store (screens not yet on Supabase), toasts,
 * DEV switcher (no fake logins since 2.3). Shell lives in (app)/.
 */
export function PlatformRoot({ children }: { children: ReactNode }) {
  const reset = useMockStore((s) => s.reset);
  return (
    <PlatformIdentityProvider>
      {children}
      <Toaster />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar app="platform" onReset={reset} />
    </PlatformIdentityProvider>
  );
}
