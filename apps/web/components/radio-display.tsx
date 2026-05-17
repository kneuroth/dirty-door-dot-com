"use client";

import { useEffect, useRef } from "react";
import { getAnalyser } from "@/lib/sound";
import { cn } from "@/lib/utils";

const LCD_WIDTH = 160;
const LCD_HEIGHT = 32;
const BG = "#001a08";
const FG = "#46ff8b";
const GLOW = "rgba(70, 255, 139, 0.6)";

/**
 * Visual-only multiplier on the waveform's height. Doesn't change the audio at all.
 * 1.0 = raw signal. 3.0 = the boosted default. Crank up to fill the display.
 * (The trace clamps at the canvas edges no matter how high you push this.)
 */
const WAVE_HEIGHT = 6.0;

export function RadioDisplay({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let dataArray: Uint8Array<ArrayBuffer> | null = null;
    let phase = 0;

    const draw = () => {
      frameId = requestAnimationFrame(draw);
      const analyser = getAnalyser();

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);

      if (!analyser) {
        drawStandby(ctx, phase);
        phase += 0.05;
        return;
      }

      if (!dataArray || dataArray.length !== analyser.fftSize) {
        dataArray = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      }
      analyser.getByteTimeDomainData(dataArray);

      // Detect activity: peak deviation from 128 (silence midpoint)
      let peak = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const d = Math.abs(dataArray[i]! - 128);
        if (d > peak) peak = d;
      }

      if (peak < 4) {
        drawStandby(ctx, phase);
        phase += 0.05;
        return;
      }

      // Active — oscilloscope trace
      ctx.strokeStyle = FG;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = GLOW;
      ctx.shadowBlur = 3;
      ctx.beginPath();
      const step = dataArray.length / LCD_WIDTH;
      for (let x = 0; x < LCD_WIDTH; x++) {
        const i = Math.floor(x * step);
        const v = ((dataArray[i]! - 128) / 128) * WAVE_HEIGHT;
        const clamped = Math.max(-1, Math.min(1, v));
        const y = LCD_HEIGHT / 2 + clamped * (LCD_HEIGHT / 2 - 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className={cn(
        "relative border-2 border-border bg-[#001a08] p-1 shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        width={LCD_WIDTH}
        height={LCD_HEIGHT}
        className="block h-8 w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <span className="absolute left-1.5 top-1.5 font-stencil text-[8px] font-semibold uppercase tracking-widest text-[#46ff8b]/80">
        RX
      </span>
    </div>
  );
}

/** Idle standby pulse — slow low-amplitude sine, communicates "radio is on" */
function drawStandby(ctx: CanvasRenderingContext2D, phase: number) {
  ctx.strokeStyle = FG;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  ctx.shadowColor = GLOW;
  ctx.shadowBlur = 2;
  ctx.beginPath();
  for (let x = 0; x < LCD_WIDTH; x++) {
    const t = x / LCD_WIDTH;
    const y = LCD_HEIGHT / 2 + Math.sin(t * Math.PI * 4 + phase) * 1.5;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}
