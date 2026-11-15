"use client";

import { useSyncExternalStore } from "react";
import type { LatLng } from "@chowlane/types";

const KEY = (slug: string) => `chowlane-customer-location:${slug}`;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function read(slug: string): string | null {
  try {
    return sessionStorage.getItem(KEY(slug));
  } catch {
    return null;
  }
}

/** Save the device location (BL-3.2). Phase 3: sent to the server while an order is active. */
export function saveCurrentLocation(slug: string, p: LatLng) {
  try {
    sessionStorage.setItem(KEY(slug), JSON.stringify(p));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Last known device location for this tenant session (null until the customer allowed location). */
export function useCurrentLocation(slug: string): LatLng | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => null,
  );
  return raw ? (JSON.parse(raw) as LatLng) : null;
}

/** Ask the browser for the current position. */
export function requestPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}
