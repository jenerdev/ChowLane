import { House, ReceiptText, Search, UserRound } from "lucide-react";
import { readableTextColor } from "@chowlane/lib";
import { cn } from "@chowlane/ui";

type PhonePreviewProps = { name: string; color: string; logoUrl?: string; className?: string };

const SHOPS = [
  { name: "Lola's Carinderia", meta: "Filipino · 20–30 min", fee: "₱49" },
  { name: "Inasal sa Kanto", meta: "Grilled · 25–35 min", fee: "₱59" },
  { name: "Tita Bel's Kakanin", meta: "Desserts · 15–25 min", fee: "₱49" },
];

/**
 * Miniature of the tenant's customer app (what their customers will install).
 * Pure presentation — colors come from the props so it re-brands live.
 */
export function PhonePreview({ name, color, logoUrl, className }: PhonePreviewProps) {
  const label = name.trim() || "Your business";
  const fg = readableTextColor(color);
  return (
    <div
      className={cn(
        "relative w-[260px] shrink-0 rounded-[2.4rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-xl shadow-zinc-900/10",
        className,
      )}
      role="img"
      aria-label={`Preview of the ${label} customer app`}
    >
      <div className="absolute top-2 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-zinc-900" />
      <div className="flex h-[520px] flex-col overflow-hidden rounded-[2rem] bg-white">
        <div
          className="px-4 pt-9 pb-4 transition-colors duration-500 motion-reduce:transition-none"
          style={{ background: color, color: fg }}
        >
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-8 rounded-lg bg-white object-cover" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">
                {label.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-sm font-semibold">{label}</span>
          </div>
          <p className="mt-4 text-lg leading-tight font-semibold">Gutom na? Order na.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-neutral-500">
            <Search className="size-3.5" /> Search food or restaurants
          </div>
        </div>
        <div className="flex gap-1.5 overflow-hidden px-4 pt-3 text-[11px] font-medium">
          {["Rice meals", "Grilled", "Merienda", "Drinks"].map((c, i) => (
            <span
              key={c}
              className="rounded-full border px-2.5 py-1 whitespace-nowrap transition-colors duration-500"
              style={i === 0 ? { background: color, color: fg, borderColor: color } : undefined}
            >
              {c}
            </span>
          ))}
        </div>
        <ul className="flex flex-1 flex-col gap-2.5 px-4 pt-3">
          {SHOPS.map((s) => (
            <li key={s.name} className="flex items-center gap-3">
              <span className="size-12 shrink-0 rounded-xl bg-neutral-100" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{s.name}</p>
                <p className="text-[11px] text-neutral-500">{s.meta}</p>
              </div>
              <span className="text-[11px] font-medium text-neutral-600">{s.fee}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-3 border-t py-2 text-[10px]">
          {[
            { icon: House, label: "Home" },
            { icon: ReceiptText, label: "Orders" },
            { icon: UserRound, label: "Profile" },
          ].map(({ icon: Icon, label: l }, i) => (
            <span
              key={l}
              className="flex flex-col items-center gap-0.5 transition-colors duration-500"
              style={{ color: i === 0 ? color : "#78716c" }}
            >
              <Icon className="size-4" />
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
