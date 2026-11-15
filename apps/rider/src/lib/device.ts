import type { LatLng } from "@chowlane/types";

/** Phone location if the rider allows it (5 s timeout). Never throws. */
export function getLocation(): Promise<LatLng | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: Number(p.coords.latitude.toFixed(6)),
          lng: Number(p.coords.longitude.toFixed(6)),
        }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  });
}

export { photoToDataUrl as toSmallJpeg } from "@chowlane/ui";
