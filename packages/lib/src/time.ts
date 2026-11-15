/** Calendar date key in Asia/Manila, e.g. "2026-11-15" (BL-7.8 day boundaries). */
export function manilaDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "Nov 15, 2026" in Asia/Manila. */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** "Nov 15, 12:00 PM" in Asia/Manila. */
export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** ISO → value for <input type="datetime-local"> in Manila time ("2026-11-15T12:00"). */
export function toManilaInput(iso: string): string {
  const d = new Date(Date.parse(iso) + 8 * 3_600_000);
  return d.toISOString().slice(0, 16);
}

/** <input type="datetime-local"> value (Manila time) → ISO UTC. */
export function fromManilaInput(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}
