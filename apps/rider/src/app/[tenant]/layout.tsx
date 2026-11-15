import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { tenantAppName, tenantIconUrl } from "@chowlane/pwa";
import { TenantLogo, TenantTheme } from "@chowlane/ui";
import { resolveTenant } from "@/lib/tenant";
import { TenantChrome } from "./tenant-chrome";

type Props = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await resolveTenant(params);
  const name = tenantAppName("rider", t.businessName);
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

  if (tenant.status === "SUSPENDED") {
    return (
      <TenantTheme color={tenant.primaryColor} global>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
          <TenantLogo
            name={tenant.businessName}
            logoUrl={tenant.logoUrl}
            className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand text-2xl font-semibold text-brand-foreground"
          />
          <h1 className="text-lg font-semibold">
            {tenant.businessName} is temporarily unavailable
          </h1>
          <p className="text-sm text-muted-foreground">Please check back later.</p>
        </main>
      </TenantTheme>
    );
  }

  return (
    <TenantTheme color={tenant.primaryColor} global>
      <TenantChrome tenant={tenant}>{children}</TenantChrome>
    </TenantTheme>
  );
}
