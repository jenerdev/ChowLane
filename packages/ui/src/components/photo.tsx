"use client";

import { Camera, X } from "lucide-react";

/** Resize a photo to a small JPEG data URL so it fits browser storage (Phase 1; Phase 2 uploads to Storage). */
export async function photoToDataUrl(file: File, maxSide = 640): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

/** Take a photo (back camera on phones) with preview + remove. Value = small JPEG data URL. */
export function PhotoInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (v?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <div className="relative w-fit">
          <img src={value} alt={label} className="h-36 rounded-control border object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remove photo"
            className="absolute top-1.5 right-1.5 rounded-full bg-foreground/80 p-1 text-background"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed text-sm text-muted-foreground focus-within:ring-3 focus-within:ring-ring hover:border-zinc-400"
        >
          <Camera className="size-5" />
          Take photo
          <input
            id={id}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) onChange(await photoToDataUrl(f));
            }}
          />
        </label>
      )}
    </div>
  );
}
