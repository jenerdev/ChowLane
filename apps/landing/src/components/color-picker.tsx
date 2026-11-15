"use client";

import { Check } from "lucide-react";
import { isHexColor } from "@chowlane/lib";
import { cn } from "@chowlane/ui";
import { BRAND_COLORS } from "@/lib/presets";

type ColorPickerProps = { value: string; onChange: (hex: string) => void; idPrefix: string };

/** Preset swatches + a custom color input. */
export function ColorPicker({ value, onChange, idPrefix }: ColorPickerProps) {
  const isPreset = BRAND_COLORS.some((c) => c.hex.toLowerCase() === value.toLowerCase());
  return (
    <div role="radiogroup" aria-label="Brand color" className="flex flex-wrap items-center gap-2">
      {BRAND_COLORS.map((c) => {
        const selected = c.hex.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={c.hex}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={c.name}
            title={c.name}
            onClick={() => onChange(c.hex)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring",
              selected && "ring-2 ring-zinc-900 ring-offset-2",
            )}
            style={{ background: c.hex }}
          >
            {selected ? <Check className="size-4 text-white" /> : null}
          </button>
        );
      })}
      <label
        htmlFor={`${idPrefix}-custom-color`}
        className={cn(
          "relative flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm focus-within:ring-3 focus-within:ring-ring",
          !isPreset && "ring-2 ring-zinc-900 ring-offset-2",
        )}
      >
        <span
          className="size-5 rounded-full border"
          style={{ background: isHexColor(value) ? value : "#ffffff" }}
        />
        Custom
        <input
          id={`${idPrefix}-custom-color`}
          type="color"
          value={isHexColor(value) ? value : "#d9412b"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
