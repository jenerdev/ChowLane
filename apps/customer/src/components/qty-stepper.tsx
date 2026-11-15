"use client";

import { Minus, Plus } from "lucide-react";

/** − qty + control (44px targets). */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Less"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-10 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="size-4" />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="More"
        onClick={() => onChange(value + 1)}
        className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
