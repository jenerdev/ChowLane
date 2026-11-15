import type { CSSProperties, ReactNode } from "react";
import { readableTextColor } from "@chowlane/lib";

type TenantThemeProps = { color: string; className?: string; children: ReactNode };

/** Applies a tenant's brand color to everything inside (BL-1.5). */
export function TenantTheme({ color, className, children }: TenantThemeProps) {
  const style = {
    "--brand": color,
    "--brand-foreground": readableTextColor(color),
  } as CSSProperties;
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}

type TenantLogoProps = { name: string; logoUrl?: string; className?: string };

/** Tenant logo, or a brand-colored initial tile when no logo is uploaded yet. */
export function TenantLogo({ name, logoUrl, className }: TenantLogoProps) {
  if (logoUrl) {
    return (
      <img src={logoUrl} alt={name} className={className ?? "size-9 rounded-xl object-cover"} />
    );
  }
  return (
    <span
      aria-label={name}
      className={
        className ??
        "inline-flex size-9 items-center justify-center rounded-xl bg-brand text-base font-bold text-brand-foreground"
      }
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
