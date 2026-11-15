import type { LatLng } from "@chowlane/types";

/** Starter brand colors — all keep white text readable (3:1+). */
export const BRAND_COLORS = [
  { name: "Sili red", hex: "#D9412B" },
  { name: "Mango", hex: "#C2410C" },
  { name: "Calamansi", hex: "#4D7C0F" },
  { name: "Ube", hex: "#6D3FA0" },
  { name: "Dagat blue", hex: "#1D5FA8" },
  { name: "Gabi", hex: "#374151" },
];

export const DEFAULT_BRAND = { name: "Lutong Bahay Express", color: "#D9412B" };

export type City = { name: string; province: string; center: LatLng };

/** Starting point for the service area — refined on a map later in Settings → Service area (S-115). */
export const CITIES: City[] = [
  { name: "Makati City", province: "Metro Manila", center: { lat: 14.5547, lng: 121.0244 } },
  { name: "Quezon City", province: "Metro Manila", center: { lat: 14.676, lng: 121.0437 } },
  { name: "Manila", province: "Metro Manila", center: { lat: 14.5995, lng: 120.9842 } },
  { name: "Pasig City", province: "Metro Manila", center: { lat: 14.5764, lng: 121.0851 } },
  { name: "Cebu City", province: "Cebu", center: { lat: 10.3157, lng: 123.8854 } },
  { name: "Davao City", province: "Davao del Sur", center: { lat: 7.1907, lng: 125.4553 } },
  { name: "Iloilo City", province: "Iloilo", center: { lat: 10.7202, lng: 122.5621 } },
  { name: "Cagayan de Oro", province: "Misamis Oriental", center: { lat: 8.4542, lng: 124.6319 } },
  { name: "Baguio City", province: "Benguet", center: { lat: 16.4023, lng: 120.596 } },
];
