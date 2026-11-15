"use client";

import { Camera, X } from "lucide-react";
import { toSmallJpeg } from "@/lib/device";

/** Take a photo (back camera on phones) and preview it. Value = small JPEG data URL. */
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
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
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
              if (f) onChange(await toSmallJpeg(f));
            }}
          />
        </label>
      )}
    </div>
  );
}
