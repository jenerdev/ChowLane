"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng } from "@chowlane/types";

export type MapInnerProps = {
  center: LatLng;
  radiusKm?: number;
  /** Click on the map moves the pin. */
  onPick?: (p: LatLng) => void;
  zoom?: number;
  color?: string;
  markers?: { position: LatLng; label: string; color?: string }[];
  /** Hide the center pin (e.g. overview maps). */
  hideCenter?: boolean;
};

function ClickToPick({ onPick }: { onPick?: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
    },
  });
  return null;
}

function FollowCenter({ center, radiusKm }: { center: LatLng; radiusKm?: number }) {
  const map = useMap();
  useEffect(() => {
    if (radiusKm) {
      const d = radiusKm / 111; // rough degrees per km
      map.fitBounds(
        [
          [center.lat - d, center.lng - d],
          [center.lat + d, center.lng + d],
        ],
        { animate: false },
      );
    } else {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: false });
    }
  }, [map, center.lat, center.lng, radiusKm]);
  return null;
}

/** OpenStreetMap via Leaflet (D-009). No marker images — circles only, so nothing breaks with bundlers. */
export default function MapInner({
  center,
  radiusKm,
  onPick,
  zoom = 13,
  color = "#18181b",
  markers = [],
  hideCenter,
}: MapInnerProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {radiusKm ? (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color, weight: 1.5, fillOpacity: 0.08 }}
        />
      ) : null}
      {hideCenter ? null : (
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={7}
          pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }}
        />
      )}
      {markers.map((m) => (
        <CircleMarker
          key={m.label}
          center={[m.position.lat, m.position.lng]}
          radius={7}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: m.color ?? "#71717a",
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {m.label}
          </Tooltip>
        </CircleMarker>
      ))}
      <ClickToPick onPick={onPick} />
      <FollowCenter center={center} radiusKm={radiusKm} />
    </MapContainer>
  );
}
