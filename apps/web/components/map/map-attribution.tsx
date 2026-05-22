"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/**
 * Custom map attribution control.
 *
 * Replaces MapLibre's default "i" popover (which gets hidden behind the
 * bottom FAB on mobile). Styled to match the rest of the overlay UI.
 *
 * Compliance / respect:
 *   - Attributes OpenStreetMap contributors (required by ODbL)
 *   - Attributes OpenFreeMap (the tile provider) per their request
 *   - Links open in new tabs with rel="noopener noreferrer"
 *
 * If we ever change tile providers, update this one component.
 */
export function MapAttribution() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Map attribution"
        aria-expanded={open}
        className="flex size-9 items-center justify-center border border-border bg-background/85 shadow-[var(--shadow-panel)] backdrop-blur-md transition-colors hover:bg-background"
      >
        <Info className="size-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-[240px] border border-border bg-background/95 p-3 shadow-[var(--shadow-panel)] backdrop-blur-md">
          <p className="font-stencil text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Map Credits
          </p>
          <ul className="mt-1.5 space-y-1 text-sm leading-snug">
            <li>
              Tiles by{" "}
              <a
                href="https://openfreemap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-primary"
              >
                OpenFreeMap
              </a>
            </li>
            <li>
              Data ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-primary"
              >
                OpenStreetMap
              </a>{" "}
              contributors
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
