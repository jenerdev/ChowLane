import type { CSSProperties, ReactNode } from "react";
import { readableTextColor } from "@chowlane/lib";
import { RootThemeSync } from "./root-theme";

type TenantThemeProps = {
  color: string;
  className?: string;
  children: ReactNode;
  /** Also apply the color to <html> so portals (sheets, dialogs) match. Use once per tenant app, not for logo tiles. */
  global?: boolean;
};

/** Applies a tenant's brand color to everything inside (BL-1.5). */
export function TenantTheme({ color, className, children, global = false }: TenantThemeProps) {
  const style = {
    "--brand": color,
    "--brand-foreground": readableTextColor(color),
  } as CSSProperties;
  return (
    <div style={style} className={className}>
      {global ? <RootThemeSync color={color} foreground={readableTextColor(color)} /> : null}
      {children}
    </div>
  );
}

type TenantLogoProps = { name: string; logoUrl?: string; className?: string };

/** Tenant logo, or a brand-colored initial tile when no logo is uploaded yet. */
export function TenantLogo({ name, logoUrl, className }: TenantLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={className ?? "size-8 shrink-0 rounded-lg object-cover"}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={
        className ??
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground"
      }
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
