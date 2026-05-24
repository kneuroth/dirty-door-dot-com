"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map from "react-map-gl/maplibre";
import type { Cleanliness } from "@repo/db";
import { DoorMarker } from "./door-marker";

type Props = {
  latitude: number;
  longitude: number;
  cleanliness: Cleanliness;
  onLocationChange: (lat: number, lng: number) => void;
  zoom?: number;
};

export function LocationPreview({
  latitude,
  longitude,
  cleanliness,
  onLocationChange,
  zoom = 16,
}: Props) {
  return (
    <div className="relative h-32 w-full max-w-60 overflow-hidden border-2 border-black">
      <Map
        initialViewState={{ latitude, longitude, zoom }}
        mapStyle="/map-style-light.json"
        attributionControl={false}
        onMoveEnd={(e) => {
          onLocationChange(e.viewState.latitude, e.viewState.longitude);
        }}
      />
      {/* Fixed center — map moves underneath */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <DoorMarker cleanliness={cleanliness} size={20} />
      </div>
    </div>
  );
}
