"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import { useTheme } from "next-themes";

type CameraState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

const FALLBACK_VIEW: CameraState = {
  longitude: -122.3321,
  latitude: 47.6062,
  zoom: 13,
};

const SAMPLE_DOORS = [
  {
    id: "sample-1",
    title: "the back of the laundromat",
    latitude: 47.609,
    longitude: -122.336,
  },
];

export function DoorMap() {
  const [view, setView] = useState<CameraState>(FALLBACK_VIEW);
  const { resolvedTheme } = useTheme();
  const mapStyle =
    resolvedTheme === "light" ? "/map-style-light.json" : "/map-style-dark.json";

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setView({
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          zoom: 14,
        });
      },
      () => {
        /* permission denied or timeout — keep fallback */
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  }, []);

  return (
    <Map
      {...view}
      onMove={(e) =>
        setView({
          longitude: e.viewState.longitude,
          latitude: e.viewState.latitude,
          zoom: e.viewState.zoom,
        })
      }
      mapStyle={mapStyle}
      style={{ position: "fixed", inset: 0 }}
      attributionControl={{ compact: true }}
    >
      {SAMPLE_DOORS.map((door) => (
        <Marker
          key={door.id}
          longitude={door.longitude}
          latitude={door.latitude}
          anchor="bottom"
        >
          <div
            className="size-4 rotate-45 border-2 border-foreground bg-destructive shadow-[1.5px_1.5px_0_0_rgb(0_0_0/0.6)]"
            aria-label={door.title}
          />
        </Marker>
      ))}
    </Map>
  );
}
