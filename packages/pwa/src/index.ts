/**
 * @chowlane/pwa — per-tenant manifest builder (D-014). Service worker (Serwist) is wired in Milestone 1.1.
 */
export type TenantAppKind = "customer" | "rider" | "console";

export type ManifestInput = {
  kind: TenantAppKind;
  tenantSlug: string;
  businessName: string;
  themeColor: string;
  backgroundColor?: string;
};

const suffix: Record<TenantAppKind, string> = { customer: "", rider: " Rider", console: " Admin" };

/** Builds the web app manifest for one tenant + app (BL-9.7 naming). */
export function buildTenantManifest(input: ManifestInput) {
  const name = `${input.businessName}${suffix[input.kind]}`;
  const base = `/${input.tenantSlug}/`;
  return {
    id: base,
    name,
    short_name: name.slice(0, 12),
    start_url: base,
    scope: base,
    display: "standalone" as const,
    theme_color: input.themeColor,
    background_color: input.backgroundColor ?? "#ffffff",
    icons: [] as { src: string; sizes: string; type: string; purpose?: string }[],
  };
}
