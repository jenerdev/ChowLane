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

/** Shrink a camera photo to a small JPEG data URL so it fits the mock store (Phase 2: Supabase Storage). */
export async function toSmallJpeg(file: File, maxSide = 640): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
