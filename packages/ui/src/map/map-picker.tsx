"use client";

import dynamic from "next/dynamic";
import { cn } from "../lib/cn";
import type { MapInnerProps } from "./map-inner";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
});

/** Map with a pin (click to move) and optional radius circle. Client-only. */
export function MapPicker({ className, ...props }: MapInnerProps & { className?: string }) {
  return (
    <div className={cn("relative isolate h-72 overflow-hidden rounded-card border", className)}>
      <MapInner {...props} />
    </div>
  );
}
