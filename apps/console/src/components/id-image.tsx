import { IdCard, UserRound } from "lucide-react";

/** ID / selfie photo. Mock data has no images, so a labelled placeholder is shown (Phase 2: signed Storage URL). */
export function IdImage({
  src,
  kind,
  label,
}: {
  src?: string;
  kind: "id" | "selfie";
  label: string;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-card border bg-subtle">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- private signed URL in Phase 2
          <img src={src} alt={label} className="size-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            {kind === "id" ? <IdCard className="size-10" /> : <UserRound className="size-10" />}
            <span className="text-[13px]">Sample — no photo in the prototype</span>
          </div>
        )}
      </div>
      <figcaption className="text-[13px] text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
