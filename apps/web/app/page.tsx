"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RadioDisplay } from "@/components/radio-display";
import { VolumeKnob, useRadioVolume } from "@/components/volume-knob";
import { DoorReportForm } from "@/components/door-report-form";
import { MapAttribution } from "@/components/map/map-attribution";
import { playRadio, preloadRadio } from "@/lib/sound";

const DoorMap = dynamic(
  () => import("@/components/map/door-map").then((m) => m.DoorMap),
  { ssr: false },
);

// Played by the auto-dispatcher every 30–60s — background "external call-in" voices.
// Leave empty to disable auto-dispatch entirely.
const EXT_DISPATCH_LINES: string[] = [
  "/audio/code-h.mp4",
  "/audio/theatre-district.mp4",
  "/audio/mobil.mp4",
  "/audio/tims.mp4",
];

// Auto-dispatch tuning
const AUTO_DISPATCH_ENABLED = true; // flip to true to enable background EXT calls
const AUTO_INTERVAL_MIN_MS = 30_000;
const AUTO_INTERVAL_MAX_MS = 60_000;
// Headroom on the knob's max — keeps the file's baked-in effects from clipping
// against the gain stage at full volume.
const DISPATCH_VOLUME_RATIO = 0.7;
// Delay after the user first turns the radio on before the welcome dispatch fires
const FIRST_ACTIVATION_DELAY_MS = 2_000;

function pickLine(lines: string[]): string | undefined {
  if (lines.length === 0) return undefined;
  return lines[Math.floor(Math.random() * lines.length)];
}

export default function Home() {
  const { multiplier } = useRadioVolume();
  const multiplierRef = useRef(multiplier);
  multiplierRef.current = multiplier;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileReport = useCallback(() => {
    fileInputRef.current?.click();
    setIsFormOpen(true);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (file) setInitialFile(file);
      e.target.value = "";
    },
    [],
  );

  // Preload every clip so first play has no fetch latency
  useEffect(() => {
    EXT_DISPATCH_LINES.forEach(preloadRadio);
  }, []);

  // Auto-dispatcher — random "someone calls in" every 30–60s, pulled from EXT pool
  useEffect(() => {
    if (!AUTO_DISPATCH_ENABLED || EXT_DISPATCH_LINES.length === 0) return;
    let timerId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay =
        AUTO_INTERVAL_MIN_MS +
        Math.random() * (AUTO_INTERVAL_MAX_MS - AUTO_INTERVAL_MIN_MS);
      timerId = setTimeout(() => {
        const line = pickLine(EXT_DISPATCH_LINES);
        if (line && multiplierRef.current > 0) {
          playRadio(line, {
            volume: multiplierRef.current * DISPATCH_VOLUME_RATIO,
          });
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timerId);
  }, []);

  // First time the user turns the radio up from zero, play a welcome dispatch
  // 2s later — feels like the channel waking up. No cleanup: a subsequent knob
  // change must not cancel the pending timer.
  const firstActivationDoneRef = useRef(false);
  useEffect(() => {
    if (firstActivationDoneRef.current || multiplier <= 0) return;
    firstActivationDoneRef.current = true;
    const line = pickLine(EXT_DISPATCH_LINES);
    if (!line) return;
    setTimeout(() => {
      if (multiplierRef.current > 0) {
        playRadio(line, {
          volume: multiplierRef.current * DISPATCH_VOLUME_RATIO,
        });
      }
    }, FIRST_ACTIVATION_DELAY_MS);
  }, [multiplier]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <DoorMap />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
        <div className="relative flex items-center justify-center">
          <div className="pointer-events-auto absolute left-0">
            <MapAttribution />
          </div>
          <h1 className="pointer-events-auto border border-border bg-background/85 px-4 py-1.5 font-stencil text-base font-semibold uppercase tracking-widest shadow-[var(--shadow-panel)] backdrop-blur-md">
            dirtydoor<span className="text-muted-foreground">.com</span>
          </h1>
          <div className="pointer-events-auto absolute right-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-6 sm:pb-8">
        <div className="pointer-events-auto flex w-full max-w-sm items-end gap-3">
          <RadioDisplay className="flex-1" />
          <VolumeKnob />
        </div>
        <Button
          size="lg"
          className="pointer-events-auto w-full max-w-sm"
          onClick={handleFileReport}
        >
          File Door Report
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />
      <DoorReportForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setInitialFile(null);
        }}
        initialFile={initialFile}
      />
    </main>
  );
}
