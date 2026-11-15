import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { tenantAppName, tenantIconUrl } from "@chowlane/pwa";
import { TenantTheme } from "@chowlane/ui";
import { resolveTenant } from "@/lib/tenant";
import { TenantChrome } from "./tenant-chrome";

type Props = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await resolveTenant(params);
  const name = tenantAppName("console", t.businessName);
  return {
    title: { default: name, template: `%s · ${name}` },
    manifest: `/${t.slug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    icons: { icon: tenantIconUrl(t.slug, 192), apple: tenantIconUrl(t.slug, 180) },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const t = await resolveTenant(params);
  return { themeColor: t.primaryColor };
}

/** Everything under /[tenant] is branded as the tenant (BL-1.5) and installable (BL-9). */
export default async function TenantLayout({ children, params }: Props & { children: ReactNode }) {
  const tenant = await resolveTenant(params);

  return (
    <TenantTheme color={tenant.primaryColor}>
      <TenantChrome tenant={tenant}>{children}</TenantChrome>
    </TenantTheme>
  );
}
