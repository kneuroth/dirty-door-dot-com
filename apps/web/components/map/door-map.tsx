"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useRef, useState } from "react";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import type { Cleanliness } from "@repo/db";
import { DoorMarker } from "./door-marker";
import { DoorInfo } from "./door-info";

type MapDoor = {
  id: string;
  title: string;
  description: string | null;
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
  const [hoveredDoor, setHoveredDoor] = useState<MapDoor | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<MapDoor | null>(null);
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
        mapRef.current?.jumpTo({ center: [data.lng, data.lat], zoom: 12 });
      })
      .catch(() => {});

    if ("geolocation" in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state !== "granted") return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              mapRef.current?.jumpTo({
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
    <>
      <Map
        ref={mapRef}
        initialViewState={FALLBACK_VIEW}
        onLoad={handleLoad}
        onMoveEnd={fetchDoors}
        onClick={() => setSelectedDoor(null)}
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
            <div
              className="cursor-pointer drop-shadow-md"
              aria-label={door.title}
              onMouseEnter={() => setHoveredDoor(door)}
              onMouseLeave={() => setHoveredDoor(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDoor(door);
                setHoveredDoor(null);
              }}
            >
              <DoorMarker cleanliness={door.cleanliness} />
            </div>
          </Marker>
        ))}

        {/* Desktop hover tooltip */}
        {hoveredDoor && !selectedDoor && (
          <Popup
            longitude={hoveredDoor.longitude}
            latitude={hoveredDoor.latitude}
            anchor="bottom"
            offset={[0, -40] as [number, number]}
            closeButton={false}
            closeOnClick={false}
            className="[&_.maplibregl-popup-content]:!p-0 [&_.maplibregl-popup-content]:!shadow-[3px_3px_0_0_rgba(0,0,0,0.35)] [&_.maplibregl-popup-tip]:!border-t-white"
          >
            <div className="border-2 border-black">
              <DoorInfo
                title={hoveredDoor.title}
                cleanliness={hoveredDoor.cleanliness}
                compact
              />
            </div>
          </Popup>
        )}
      </Map>

      {/* Detail bottom sheet */}
      {selectedDoor && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSelectedDoor(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[50dvh] overflow-y-auto border-t-2 border-black bg-[#4a423a] p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:max-h-[60dvh] sm:w-[400px] sm:-translate-x-1/2 sm:border-2 sm:border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedDoor(null)}
              className="mb-1 ml-auto flex size-6 items-center justify-center border border-black bg-white text-xs font-bold uppercase leading-none"
              style={{ fontFamily: "Times, 'Times New Roman', Georgia, serif" }}
              aria-label="Close"
            >
              X
            </button>
            <div className="border-2 border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,0.55)]">
              <DoorInfo
                title={selectedDoor.title}
                description={selectedDoor.description}
                cleanliness={selectedDoor.cleanliness}
                latitude={selectedDoor.latitude}
                longitude={selectedDoor.longitude}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
