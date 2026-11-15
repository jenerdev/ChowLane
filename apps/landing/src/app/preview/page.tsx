"use client";

import { useState } from "react";
import { appUrl, type AppKey } from "@chowlane/mocks/react";
import { Input, Select } from "@chowlane/ui";

const FRAMES: { app: AppKey; label: string; path: string }[] = [
  { app: "customer", label: "Customer", path: "/fastbite" },
  { app: "rider", label: "Rider", path: "/fastbite" },
  { app: "console", label: "Console", path: "/fastbite" },
  { app: "platform", label: "Platform", path: "/" },
  { app: "landing", label: "Landing", path: "/" },
];

const WIDTHS = [360, 390, 430];

/**
 * Dev tool (Phase 1): every app side by side in phone-sized frames, for checking mobile layouts
 * without a phone. Each frame is a real page at that width (media queries apply).
 */
export default function PhonePreview() {
  const [width, setWidth] = useState(390);
  const [paths, setPaths] = useState(
    () => Object.fromEntries(FRAMES.map((f) => [f.app, f.path])) as Record<AppKey, string>,
  );
  const height = Math.round(width * (844 / 390));

  return (
    <main className="min-h-dvh bg-subtle px-5 py-6">
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Phone preview</h1>
          <p className="text-sm text-muted-foreground">
            Prototype tool — each frame is the real app at phone width.
          </p>
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm">
          Width
          <Select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="h-9 w-28"
          >
            {WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w} px
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {FRAMES.map((f) => (
          <section key={f.app} className="flex shrink-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{f.label}</span>
              <Input
                aria-label={`${f.label} path`}
                value={paths[f.app]}
                onChange={(e) => setPaths((p) => ({ ...p, [f.app]: e.target.value }))}
                className="h-8 w-44 text-sm"
              />
            </div>
            <iframe
              title={`${f.label} preview`}
              src={`${appUrl(f.app)}${paths[f.app]}`}
              style={{ width, height }}
              className="rounded-[2rem] border-[6px] border-zinc-900 bg-white shadow-lg"
            />
          </section>
        ))}
      </div>
    </main>
  );
}
