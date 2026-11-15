/**
 * @chowlane/pwa — per-tenant manifest builder (D-014, BL-9).
 * Server/edge safe: no React here. UI lives in "@chowlane/pwa/react", icons in "@chowlane/pwa/icon".
 */
export type TenantAppKind = "customer" | "rider" | "console";

export type ManifestInput = {
  kind: TenantAppKind;
  tenantSlug: string;
  businessName: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
};

const SUFFIX: Record<TenantAppKind, string> = { customer: "", rider: " Rider", console: " Admin" };

/** Installed app name (BL-9.7): "FastBite Delivery", "FastBite Delivery Rider", "FastBite Delivery Admin". */
export function tenantAppName(kind: TenantAppKind, businessName: string): string {
  return `${businessName}${SUFFIX[kind]}`;
}

/** Home-screen label, max 12 chars. */
export function tenantShortName(kind: TenantAppKind, shortName: string): string {
  const s = `${shortName}${SUFFIX[kind]}`;
  return s.length <= 12 ? s : shortName.slice(0, 12);
}

export const tenantIconUrl = (tenantSlug: string, size: 180 | 192 | 512, maskable = false) =>
  `/${tenantSlug}/pwa-icon/${size}${maskable ? "?maskable=1" : ""}`;

/** Web app manifest for one tenant + app. Each is a separate installable app (scope /[tenant]/ — BL-9.3). */
export function buildTenantManifest(input: ManifestInput) {
  const base = `/${input.tenantSlug}/`;
  return {
    id: base,
    name: tenantAppName(input.kind, input.businessName),
    short_name: tenantShortName(input.kind, input.shortName),
    start_url: base,
    scope: base,
    display: "standalone" as const,
    orientation: "portrait" as const,
    theme_color: input.themeColor,
    background_color: input.backgroundColor,
    icons: [
      { src: tenantIconUrl(input.tenantSlug, 192), sizes: "192x192", type: "image/png" },
      { src: tenantIconUrl(input.tenantSlug, 512), sizes: "512x512", type: "image/png" },
      {
        src: tenantIconUrl(input.tenantSlug, 512, true),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export function manifestResponse(manifest: ReturnType<typeof buildTenantManifest>): Response {
  return new Response(JSON.stringify(manifest), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
