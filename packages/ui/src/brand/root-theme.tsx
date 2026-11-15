"use client";

import { useEffect } from "react";

/**
 * Mirrors the tenant brand color onto <html> so content rendered in portals (sheets, dialogs, toasts)
 * — which sit outside the TenantTheme wrapper — uses the tenant color too.
 */
export function RootThemeSync({ color, foreground }: { color: string; foreground: string }) {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--brand", color);
    root.setProperty("--brand-foreground", foreground);
    return () => {
      root.removeProperty("--brand");
      root.removeProperty("--brand-foreground");
    };
  }, [color, foreground]);
  return null;
}
