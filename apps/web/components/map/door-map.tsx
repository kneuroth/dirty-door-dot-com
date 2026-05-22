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

  // Two-stage view recenter, both popup-free:
  //   1. IP geolocation via /api/geo (Vercel edge headers) gives a coarse
  //      regional center on first paint.
  //   2. If the user has already granted geolocation permission, silently
  //      upgrade to precise GPS. We gate on Permissions API state === "granted"
  //      so this never triggers the prompt — `prompt`/`denied` stay on IP geo
  //      and the form is the only place that ever asks.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/geo")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.lat === "number" && typeof data.lng === "number") {
          setView({
            longitude: data.lng,
            latitude: data.lat,
            zoom: 12,
          });
        }
      })
      .catch(() => {
        /* swallow — fall back to FALLBACK_VIEW */
      });

    if (
      "geolocation" in navigator &&
      navigator.permissions?.query
    ) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (cancelled || result.state !== "granted") return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              setView({
                longitude: pos.coords.longitude,
                latitude: pos.coords.latitude,
                zoom: 14,
              });
            },
            () => {
              /* swallow — keep whichever view we already have */
            },
            { enableHighAccuracy: false, timeout: 5000 },
          );
        })
        .catch(() => {
          /* permissions API failed — leave the IP-geo view in place */
        });
    }

    return () => {
      cancelled = true;
    };
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
      attributionControl={false}
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
