/** Calendar date key in Asia/Manila, e.g. "2026-11-15" (BL-7.8 day boundaries). */
export function manilaDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
