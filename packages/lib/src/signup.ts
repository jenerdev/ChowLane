/**
 * Owner signup helpers (LND-002, LND-003).
 */

/** Slugs that would clash with app routes or look official. */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "app",
  "apps",
  "billing",
  "chowlane",
  "console",
  "customer",
  "dashboard",
  "help",
  "login",
  "logout",
  "platform",
  "rider",
  "serwist",
  "settings",
  "signup",
  "static",
  "support",
  "www",
];

export const SLUG_MIN = 3;
export const SLUG_MAX = 30;

/** "Lola's Kitchen & Co." → "lolas-kitchen-co" */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export type SlugProblem = "TOO_SHORT" | "TOO_LONG" | "INVALID" | "RESERVED" | "TAKEN";

export const SLUG_MESSAGES: Record<SlugProblem, string> = {
  TOO_SHORT: `Use at least ${SLUG_MIN} characters.`,
  TOO_LONG: `Use at most ${SLUG_MAX} characters.`,
  INVALID: "Use lowercase letters, numbers and single dashes only — no dash at the start or end.",
  RESERVED: "This link is reserved. Try another one.",
  TAKEN: "Another business already uses this link.",
};

/** Validate a storefront slug against format, reserved words and existing tenants. */
export function checkSlug(slug: string, takenSlugs: string[]): SlugProblem | null {
  if (slug.length < SLUG_MIN) return "TOO_SHORT";
  if (slug.length > SLUG_MAX) return "TOO_LONG";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "INVALID";
  if (RESERVED_SLUGS.includes(slug)) return "RESERVED";
  if (takenSlugs.includes(slug)) return "TAKEN";
  return null;
}

/** Suggest free alternatives: name-2, name-ph, name-delivery… */
export function suggestSlugs(base: string, takenSlugs: string[], count = 3): string[] {
  const out: string[] = [];
  for (const suffix of ["ph", "delivery", "eats", "2", "3", "4"]) {
    const s = `${base}-${suffix}`.slice(0, SLUG_MAX);
    if (!checkSlug(s, takenSlugs)) out.push(s);
    if (out.length === count) break;
  }
  return out;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export const PASSWORD_MIN = 8;

export function checkPassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Use letters and at least one number.";
  return null;
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
