"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dd-radio-volume-level";
const LEVELS = [0, 0.25, 0.5, 0.75, 1.0] as const;
const DEFAULT_LEVEL = 2;
// rotation degrees per level: spans -135° (off) to +135° (max)
const ROTATION_PER_LEVEL = 270 / (LEVELS.length - 1);

/**
 * Module-level mirror of the current level, kept in sync with the React state.
 * Allows non-React code (e.g. timers in useEffect) to read the latest value
 * without needing the state in their dep array.
 */
let currentLevel = DEFAULT_LEVEL;

export function getRadioVolumeMultiplier(): number {
  return LEVELS[currentLevel] ?? 0;
}

export function useRadioVolume() {
  const [level, setLevel] = useState<number>(DEFAULT_LEVEL);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n >= 0 && n < LEVELS.length) {
        setLevel(n);
        currentLevel = n;
      }
    }
  }, []);

  const update = (next: number) => {
    const clamped = Math.max(0, Math.min(LEVELS.length - 1, next));
    setLevel(clamped);
    currentLevel = clamped;
    localStorage.setItem(STORAGE_KEY, String(clamped));
  };

  return {
    level,
    multiplier: LEVELS[level] ?? 0,
    setLevel: update,
    maxLevel: LEVELS.length - 1,
  };
}

export function VolumeKnob() {
  const { level, setLevel, maxLevel } = useRadioVolume();
  const rotation = -135 + level * ROTATION_PER_LEVEL;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setLevel(level === maxLevel ? 0 : level + 1)}
        className="relative size-10 rounded-full border-2 border-border bg-secondary shadow-[var(--shadow-button)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[inset_0_1px_0_0_rgb(0_0_0/0.25)] transition-[transform,box-shadow] duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Volume level ${level} of ${maxLevel}`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={maxLevel}
        aria-valuenow={level}
      >
        <div
          className="absolute inset-0 transition-transform duration-150"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <span className="absolute left-1/2 top-1 h-2 w-[3px] -translate-x-1/2 rounded-sm bg-primary shadow-[0_0_4px_var(--primary)]" />
        </div>
      </button>
    </div>
  );
}
