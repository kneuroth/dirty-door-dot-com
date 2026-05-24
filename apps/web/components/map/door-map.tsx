"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import type { Cleanliness } from "@repo/db";
import { DoorMarker } from "./door-marker";

type MapDoor = {
  id: string;
  title: string;
  cleanliness: Cleanliness;
  latitude: number;
  longitude: number;
};

const FALLBACK_VIEW = {
  longitude: -122.3321,
  latitude: 47.6062,
  zoom: 13,
};

export function DoorMap() {
  const [doors, setDoors] = useState<MapDoor[]>([]);
  const mapRef = useRef<MapRef>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { resolvedTheme } = useTheme();
  const mapStyle =
    resolvedTheme === "light"
      ? "/map-style-light.json"
      : "/map-style-dark.json";

  const fetchDoors = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const bounds = map.getBounds();
    const params = new URLSearchParams({
      swLat: bounds.getSouthWest().lat.toFixed(6),
      swLng: bounds.getSouthWest().lng.toFixed(6),
      neLat: bounds.getNorthEast().lat.toFixed(6),
      neLng: bounds.getNorthEast().lng.toFixed(6),
    });

    fetch(`/api/doors?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setDoors(data);
      })
      .catch(() => {});
  }, []);

  const handleLoad = useCallback(() => {
    fetchDoors();

    fetch("/api/geo")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          !data ||
          typeof data.lat !== "number" ||
          typeof data.lng !== "number"
        )
          return;
        mapRef.current?.flyTo({ center: [data.lng, data.lat], zoom: 12 });
      })
      .catch(() => {});

    if ("geolocation" in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state !== "granted") return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              mapRef.current?.flyTo({
                center: [pos.coords.longitude, pos.coords.latitude],
                zoom: 14,
              });
            },
            () => {},
            { enableHighAccuracy: false, timeout: 5000 },
          );
        })
        .catch(() => {});
    }
  }, [fetchDoors]);

  return (
    <Map
      ref={mapRef}
      initialViewState={FALLBACK_VIEW}
      onLoad={handleLoad}
      onMoveEnd={fetchDoors}
      mapStyle={mapStyle}
      style={{ position: "fixed", inset: 0 }}
      attributionControl={false}
    >
      {doors.map((door) => (
        <Marker
          key={door.id}
          longitude={door.longitude}
          latitude={door.latitude}
          anchor="bottom"
        >
          <div className="drop-shadow-md" aria-label={door.title}>
            <DoorMarker cleanliness={door.cleanliness} />
          </div>
        </Marker>
      ))}
    </Map>
  );
}
