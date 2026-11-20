"use client";

import type { ReactNode } from "react";
import { DevToolbar } from "@chowlane/mocks/react";
import { Toaster } from "@chowlane/ui";
import { PlatformIdentityProvider } from "@/lib/identity";
import { PlatformDataProvider } from "@/lib/platform-data";

/**
 * App-wide pieces for every page (incl. login): Supabase session + every tenant's records (2.7), toasts, DEV app
 * switcher. Shell lives in (app)/.
 */
export function PlatformRoot({ children }: { children: ReactNode }) {
  return (
    <PlatformIdentityProvider>
      <PlatformDataProvider>
        {children}
        <Toaster />
        <DevToolbar app="platform" />
      </PlatformDataProvider>
    </PlatformIdentityProvider>
  );
}
