"use client";

import type { ReactNode } from "react";
import { platformAdmins } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { Toaster } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";
import { SESSION_SCOPE } from "@/lib/use-platform";

/** App-wide pieces for every page (incl. login): mock store, toasts, DEV switcher. Shell lives in (app)/. */
export function PlatformRoot({ children }: { children: ReactNode }) {
  const reset = useMockStore((s) => s.reset);
  return (
    <>
      {children}
      <Toaster />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar
        app="platform"
        personas={platformAdmins.map((p) => ({ id: p.id, label: p.name }))}
        personaScope={SESSION_SCOPE}
        onReset={reset}
      />
    </>
  );
}
