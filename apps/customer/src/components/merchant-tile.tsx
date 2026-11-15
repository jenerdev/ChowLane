import { cn } from "@chowlane/ui";

/** Merchant photo or a neutral initial tile (no images in the prototype). */
export function MerchantTile({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string;
  className?: string;
}) {
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- Phase 2 storage URLs
    <img
      src={photoUrl}
      alt=""
      className={cn("size-14 shrink-0 rounded-card object-cover", className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-card bg-muted text-lg font-semibold text-zinc-500",
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
