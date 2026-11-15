import { cn } from "../lib/cn";

/**
 * Placeholder ChowLane brand (Q-18 / D-029): a bowl whose rim doubles as a road lane.
 * Replace with the final logo later — keep the same component API.
 */
export function ChowLaneMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="#0E7C66" />
      <path d="M7 15h18a9 9 0 0 1-18 0Z" fill="#fff" />
      <path
        d="M9.5 13.2h3M14.5 13.2h3M19.5 13.2h3"
        stroke="#F59E0B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 9.5c0-1.4 1.2-1.4 1.2-2.8M16 9.5c0-1.4 1.2-1.4 1.2-2.8M20 9.5c0-1.4 1.2-1.4 1.2-2.8"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function ChowLaneLogo({
  className,
  tagline = false,
}: {
  className?: string;
  tagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ChowLaneMark />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-[#1C1917]">
          Chow<span className="text-chowlane">Lane</span>
        </span>
        {tagline ? (
          <span className="text-[10px] font-medium text-muted-foreground">
            Your brand. Your riders. Your lane.
          </span>
        ) : null}
      </span>
    </span>
  );
}
