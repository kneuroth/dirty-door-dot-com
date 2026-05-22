"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker } from "react-map-gl/maplibre";

type Props = {
  latitude: number;
  longitude: number;
  /** Initial zoom level. 15 ≈ street-level detail. */
  zoom?: number;
};

/**
 * Frozen mini-map for the report form. No pan, no zoom, no interaction.
 * Always uses the light style so it matches the form's paper aesthetic
 * regardless of the app's theme toggle.
 */
export function LocationPreview({ latitude, longitude, zoom = 16 }: Props) {
  return (
    <div className="relative h-32 w-60 overflow-hidden border-2 border-black">
      <Map
        initialViewState={{ latitude, longitude, zoom }}
        mapStyle="/map-style-light.json"
        interactive={false}
        attributionControl={false}
      >
        <Marker latitude={latitude} longitude={longitude} anchor="center">
          <div className="size-3 rotate-45 border-2 border-black bg-red-700 shadow-[1px_1px_0_0_rgba(0,0,0,0.6)]" />
        </Marker>
      </Map>
    </div>
  );
}
