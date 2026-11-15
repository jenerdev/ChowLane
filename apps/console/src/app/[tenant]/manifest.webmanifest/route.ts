import { buildTenantManifest, manifestResponse } from "@chowlane/pwa";
import { resolveTenant } from "@/lib/tenant";

/** Per-tenant web app manifest (D-014). */
export async function GET(_req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const t = await resolveTenant(params);
  return manifestResponse(
    buildTenantManifest({
      kind: "console",
      tenantSlug: t.slug,
      businessName: t.businessName,
      shortName: t.shortName,
      themeColor: t.primaryColor,
      backgroundColor: t.backgroundColor,
    }),
  );
}
