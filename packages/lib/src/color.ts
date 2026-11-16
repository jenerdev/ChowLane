/** Relative luminance of a #RRGGBB color (WCAG). */
function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.replace(/./g, "$&$&") : n;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text color for content on the tenant's brand color. Prefers white (brand buttons are bold text)
 * as long as it reaches 3:1 contrast; otherwise near-black.
 */
export function readableTextColor(bgHex: string): "#ffffff" | "#1c1917" {
  return contrast(luminance(bgHex), 1) >= 3 ? "#ffffff" : "#1c1917";
}

/**
 * A very light tint of the brand color (mixed with white) — the installed app's splash / background color for a
 * new business (Tenant.backgroundColor). `amount` = share of white, 0–1.
 */
export function brandTint(hex: string, amount = 0.94): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.replace(/./g, "$&$&") : n;
  return `#${[0, 2, 4]
    .map((i) => {
      const c = parseInt(full.slice(i, i + 2), 16);
      return Math.round(c + (255 - c) * amount)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")
    .toUpperCase()}`;
}
