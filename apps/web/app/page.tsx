"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RadioDisplay } from "@/components/radio-display";
import { VolumeKnob, useRadioVolume } from "@/components/volume-knob";
import { DoorReportForm } from "@/components/door-report-form";
import { playRadio, preloadRadio } from "@/lib/sound";

const DoorMap = dynamic(
  () => import("@/components/map/door-map").then((m) => m.DoorMap),
  { ssr: false },
);

// Played when YOU press "File Door Report" — your own voice clips.
// Drop new files in apps/web/public/audio/ then add the path here.
const MY_DISPATCH_LINES: string[] = [
  "/audio/dont-like-the-look.m4a",
  "/audio/filing-a-ddr.m4a",
  "/audio/got-one-dirty-door-here.m4a",
  "/audio/head-office.m4a",
  "/audio/no-body-called.m4a",
  "/audio/reporting-dirty-door.m4a",
  "/audio/sigh-i-gotta-report.m4a",
  "/audio/step-back-folks.m4a",
  "/audio/uh-yeah.m4a",
  "/audio/we-got-a-dirty-door-here.m4a",
];

// Played by the auto-dispatcher every 30–60s — background "external call-in" voices.
// Leave empty to disable auto-dispatch entirely.
const EXT_DISPATCH_LINES: string[] = [];

// Auto-dispatch tuning
const AUTO_DISPATCH_ENABLED = false; // flip to true to enable background EXT calls
const AUTO_INTERVAL_MIN_MS = 30_000;
const AUTO_INTERVAL_MAX_MS = 60_000;
const AUTO_VOLUME_RATIO = 0.3; // auto-calls play at 30% of the user-press volume

function pickLine(lines: string[]): string | undefined {
  if (lines.length === 0) return undefined;
  return lines[Math.floor(Math.random() * lines.length)];
}

export default function Home() {
  const { multiplier } = useRadioVolume();
  const multiplierRef = useRef(multiplier);
  multiplierRef.current = multiplier;
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Preload every clip so first play has no fetch latency
  useEffect(() => {
    [...MY_DISPATCH_LINES, ...EXT_DISPATCH_LINES].forEach(preloadRadio);
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
            volume: multiplierRef.current * AUTO_VOLUME_RATIO,
          });
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <DoorMap />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4">
        <div className="relative flex items-center justify-center">
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
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (multiplier > 0) {
              const line = pickLine(MY_DISPATCH_LINES);
              if (line) playRadio(line, { volume: multiplier });
            }
            setIsFormOpen(true);
          }}
        >
          File Door Report
        </Button>
      </div>

      <DoorReportForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </main>
  );
}
