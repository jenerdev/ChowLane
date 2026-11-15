import { cn } from "../lib/cn";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

type AvatarProps = { name: string; src?: string; size?: "sm" | "md" | "lg"; className?: string };

/** Photo when available, otherwise neutral initials. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const dim = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base" }[size];
  return src ? (
    <img src={src} alt={name} className={cn("rounded-full object-cover", dim, className)} />
  ) : (
    <span
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-zinc-600",
        dim,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
