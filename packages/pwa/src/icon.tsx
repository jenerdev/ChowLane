import { ImageResponse } from "next/og";

type TenantIconInput = {
  name: string;
  color: string;
  textColor: string;
  size: number;
  maskable?: boolean;
};

/**
 * Placeholder tenant app icon (PNG): brand-colored tile with the business initial.
 * Phase 2 replaces this with icons generated from the uploaded logo (FND-013).
 */
export function tenantIconResponse({
  name,
  color,
  textColor,
  size,
  maskable = false,
}: TenantIconInput) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  // Maskable icons keep the content inside the 80% safe zone.
  const fontSize = Math.round(size * (maskable ? 0.42 : 0.56));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: textColor,
        fontSize,
        fontWeight: 800,
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
      }}
    >
      {initial}
    </div>,
    { width: size, height: size, headers: { "cache-control": "public, max-age=3600" } },
  );
}
