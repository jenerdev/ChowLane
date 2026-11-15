"use client";

import { useEffect, useState } from "react";

/** Current time (ms), captured once when the screen mounts — keeps render pure. */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}

/** Current time (ms) that updates every `ms` (countdowns). */
export function useTicker(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}
