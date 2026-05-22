"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cleanlinessValues, type Cleanliness } from "@repo/db";

const LocationPreview = dynamic(
  () =>
    import("@/components/map/location-preview").then((m) => m.LocationPreview),
  { ssr: false },
);

type Props = {
  open: boolean;
  onClose: () => void;
};

type FieldStatus = "incomplete" | "valid" | "invalid";
type PermissionState =
  | "checking"
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported";

const SERIF = "Times, 'Times New Roman', Georgia, serif";

export function DoorReportForm({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cleanliness, setCleanliness] = useState<Cleanliness | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("checking");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fires a one-shot GPS lookup. Triggers the native prompt if the user hasn't
  // decided yet, and translates the various failure modes into a single state
  // machine the JSX below can branch on.
  const requestLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermissionState("granted");
        setLocationError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState("denied");
          setLocationError(null);
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError("Position unavailable. Try again.");
        } else if (err.code === err.TIMEOUT) {
          setLocationError("Location request timed out.");
        } else {
          setLocationError("Could not get location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // On form open: inspect the permission state and either auto-fetch (granted)
  // or wait for the user to press the "Allow Location" button (prompt) /
  // surface settings instructions (denied). The Permissions API gate is what
  // lets us avoid showing the popup unsolicited every single time the form
  // opens.
  useEffect(() => {
    if (!open) return;
    setLocation(null);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setPermissionState("unsupported");
      return;
    }
    if (!navigator.permissions?.query) {
      // Older browsers (older Safari) — skip the inspection and let the user
      // tap the button to trigger the native prompt directly.
      setPermissionState("prompt");
      return;
    }

    setPermissionState("checking");
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "granted") {
          setPermissionState("granted");
          requestLocation();
        } else if (result.state === "denied") {
          setPermissionState("denied");
        } else {
          setPermissionState("prompt");
        }
      })
      .catch(() => {
        setPermissionState("prompt");
      });
  }, [open, requestLocation]);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const titleStatus: FieldStatus =
    title.length === 0
      ? "incomplete"
      : title.length > 200
        ? "invalid"
        : "valid";

  const descriptionStatus: FieldStatus =
    description.length === 0
      ? "incomplete"
      : description.length > 2000
        ? "invalid"
        : "valid";

  const cleanlinessStatus: FieldStatus =
    cleanliness === null ? "incomplete" : "valid";

  const locationStatus: FieldStatus = location
    ? "valid"
    : permissionState === "denied" ||
        permissionState === "unsupported" ||
        locationError
      ? "invalid"
      : "incomplete";

  const canSubmit =
    titleStatus === "valid" &&
    descriptionStatus !== "invalid" &&
    cleanlinessStatus === "valid" &&
    locationStatus === "valid" &&
    !submitting;

  const reset = () => {
    setTitle("");
    setDescription("");
    setCleanliness(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !location || !cleanliness) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/doors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          cleanliness,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });
      if (!res.ok) {
        setSubmitError("ERROR: COULD NOT TRANSMIT");
        return;
      }
      reset();
      onClose();
    } catch {
      setSubmitError("ERROR: COULD NOT TRANSMIT");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        background:
          "radial-gradient(ellipse at center, #353535 0%, #1a1a1a 100%)",
      }}
    >
      {/* Drawer-slat shadow lines over the desk surface */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(0,0,0,0.22) 30px, rgba(0,0,0,0.22) 31px)",
        }}
      />

      {/* Warm-grey enclosing mat (the "clipboard" the paper sits on) */}
      <div
        className="relative z-10 bg-[#4a423a] p-6 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Paper */}
        <div
          className="relative flex max-h-[88dvh] w-[88vw] max-w-[640px] gap-0 bg-white text-black shadow-[6px_6px_0_0_rgba(0,0,0,0.55)]"
          style={{ fontFamily: SERIF }}
        >
          {/* Scrolling form body */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:hidden sm:px-6 sm:py-5"
            style={{ scrollbarWidth: "none" }}
          >
            <header className="mb-3">
              <h2 className="text-xl font-bold uppercase tracking-wide sm:text-2xl">
                Dirty Door Incident Report
              </h2>
              <p className="text-xs italic">Form DD-001 / Rev. 1.0</p>
            </header>
            <hr className="border-0 border-t-2 border-black" />

            {/* Title */}
            <section className="py-3">
              <label
                htmlFor="dd-title"
                className="block text-sm font-bold uppercase"
              >
                1. Title <span className="font-normal">*</span>
              </label>
              <input
                id="dd-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full bg-transparent py-1 outline-none"
                autoFocus
              />
              {titleStatus === "invalid" && (
                <p className="mt-1 text-xs font-bold uppercase text-red-700">
                  Must be between 1 and 200 characters
                </p>
              )}
            </section>
            <hr className="border-0 border-t-2 border-black" />

            {/* Description */}
            <section className="py-3">
              <label
                htmlFor="dd-desc"
                className="block text-sm font-bold uppercase"
              >
                2. Description
              </label>
              <p className="text-xs italic">
                Optional. Note any unusual features.
              </p>
              <textarea
                id="dd-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full resize-none bg-transparent py-1 outline-none"
              />
              {descriptionStatus === "invalid" && (
                <p className="mt-1 text-xs font-bold uppercase text-red-700">
                  Must be 2000 characters or fewer
                </p>
              )}
            </section>
            <hr className="border-0 border-t-2 border-black" />

            {/* Cleanliness */}
            <section className="py-3">
              <p className="text-sm font-bold uppercase">
                3. Cleanliness <span className="font-normal">*</span>
              </p>
              <p className="text-xs italic">Mark one and only one box.</p>
              <ul className="mt-2 space-y-1">
                {cleanlinessValues.map((value) => (
                  <li key={value}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cleanliness === value}
                        onChange={() => setCleanliness(value)}
                      />
                      <span className="uppercase">{value}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
            <hr className="border-0 border-t-2 border-black" />

            {/* Location */}
            <section className="py-3">
              <p className="text-sm font-bold uppercase">
                4. Location{" "}
                <span className="font-normal italic">(auto-captured)</span>
              </p>
              {location && (
                <>
                  <p className="mt-1 font-mono text-sm">
                    LAT {location.lat.toFixed(5)} &nbsp;&nbsp; LNG{" "}
                    {location.lng.toFixed(5)}
                  </p>
                  <div className="mt-2 inline-block">
                    <LocationPreview
                      latitude={location.lat}
                      longitude={location.lng}
                    />
                    {/* Placeholder for future "select a different location" flow. Disabled for now. */}
                    <button
                      type="button"
                      disabled
                      className="mt-2 w-full border-2 border-black bg-white px-3 py-0.5 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Change Location
                    </button>
                  </div>
                </>
              )}
              {!location && permissionState === "checking" && (
                <p className="mt-1 text-sm italic">Checking permissions...</p>
              )}
              {!location && permissionState === "granted" && !locationError && (
                <p className="mt-1 text-sm italic">Awaiting GPS lock...</p>
              )}
              {!location && permissionState === "prompt" && (
                <>
                  <p className="mt-1 text-xs italic">
                    This report needs your current location.
                  </p>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="mt-2 border-2 border-black bg-white px-3 py-1 text-sm font-bold uppercase"
                  >
                    Allow Location
                  </button>
                </>
              )}
              {!location && permissionState === "denied" && (
                <p className="mt-1 text-xs font-bold uppercase text-red-700">
                  Location is blocked. Tap the lock icon in your address bar,
                  allow location for this site, then reopen this form.
                </p>
              )}
              {!location && permissionState === "unsupported" && (
                <p className="mt-1 text-xs font-bold uppercase text-red-700">
                  Geolocation unavailable on this device.
                </p>
              )}
              {locationError && (
                <p className="mt-1 text-sm font-bold uppercase text-red-700">
                  {locationError}
                </p>
              )}
            </section>
            <hr className="border-0 border-t-2 border-black" />

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3 py-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="border-2 border-black bg-white px-4 py-1 text-sm font-bold uppercase disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Transmitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border-2 border-black bg-white px-4 py-1 text-sm font-bold uppercase"
              >
                Cancel
              </button>
              {submitError && (
                <span className="text-xs font-bold uppercase text-red-700">
                  {submitError}
                </span>
              )}
            </div>
          </form>

          {/* Sticky status panel */}
          <aside className="flex w-[96px] shrink-0 flex-col bg-white p-2 sm:w-[124px] sm:p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest">
              Status
            </p>
            <StatusRow label="Title" status={titleStatus} />
            <StatusRow label="Desc" status={descriptionStatus} />
            <StatusRow label="Clean" status={cleanlinessStatus} />
            <StatusRow label="Loc" status={locationStatus} />
          </aside>

          {/* Sticky-note photo placeholder.
            Stuck to the paper, not part of the scrollable form. Hangs off the right edge.
            Currently a no-op button — will eventually open the camera / upload flow.
            Replace with an <img> here when wired up; same position/rotation/shadow. */}
          <button
            type="button"
            aria-label="Attach photo (coming soon)"
            className="absolute bottom-[18%] right-[-14px] z-20 size-32 rotate-3 cursor-pointer bg-[#fdf08a] shadow-[3px_3px_0_0_rgba(0,0,0,0.25)] outline-none transition-transform hover:rotate-0 focus-visible:outline-2 focus-visible:outline-black sm:size-40"
          />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: FieldStatus }) {
  return (
    <div className="flex items-center justify-between gap-1 py-1 text-[11px] uppercase">
      <span>{label}</span>
      <StatusMarker status={status} />
    </div>
  );
}

function StatusMarker({ status }: { status: FieldStatus }) {
  const symbol = status === "valid" ? "X" : status === "invalid" ? "!" : "";
  const colorClass =
    status === "incomplete"
      ? "border-gray-500 text-gray-500"
      : status === "invalid"
        ? "border-red-700 text-red-700"
        : "border-black text-black";
  return (
    <span
      aria-label={status}
      className={`inline-flex size-[18px] items-center justify-center border-[1.5px] bg-white text-[12px] font-bold leading-none ${colorClass}`}
    >
      {symbol}
    </span>
  );
}
