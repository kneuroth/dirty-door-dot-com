import type { Cleanliness } from "@repo/db";
import type { ReactNode } from "react";

type Palette = {
  body: string;
  frame: string;
  panel: string;
  panelStroke: string;
};

type MarkerPalette = Record<Cleanliness, Palette>;

const DEFAULT_PALETTE: MarkerPalette = {
  immaculate: {
    body: "#22c55e",
    frame: "#14532d",
    panel: "#4ade80",
    panelStroke: "#16a34a",
  },
  decent: {
    body: "#84cc16",
    frame: "#3f6212",
    panel: "#a3e635",
    panelStroke: "#65a30d",
  },
  "smudged up": {
    body: "#eab308",
    frame: "#78350f",
    panel: "#fbbf24",
    panelStroke: "#b45309",
  },
  dirty: {
    body: "#f97316",
    frame: "#7c2d12",
    panel: "#fb923c",
    panelStroke: "#c2410c",
  },
  horrifying: {
    body: "#ef4444",
    frame: "#450a0a",
    panel: "#f87171",
    panelStroke: "#b91c1c",
  },
};

const KNOB_FILL = "#d4a373";
const KNOB_DETAIL = "#8b6f47";
const DIRT = "rgb(30,15,0)";

function getDirtElements(cleanliness: Cleanliness): ReactNode {
  switch (cleanliness) {
    case "immaculate":
      return (
        <ellipse
          cx="8"
          cy="8"
          rx="3"
          ry="5"
          fill="white"
          opacity={0.12}
          transform="rotate(-15 8 8)"
        />
      );

    case "decent":
      return (
        <>
          <ellipse cx="8" cy="21" rx="2" ry="1" fill={DIRT} opacity={0.25} transform="rotate(-10 8 21)" />
          <ellipse cx="12" cy="19.5" rx="1.2" ry="0.8" fill={DIRT} opacity={0.2} transform="rotate(6 12 19.5)" />
          <circle cx="6.5" cy="18" r="0.7" fill={DIRT} opacity={0.2} />
          <ellipse cx="10" cy="24" rx="1.8" ry="0.6" fill={DIRT} opacity={0.22} />
        </>
      );

    case "smudged up":
      return (
        <>
          <ellipse cx="12.5" cy="16" rx="1.8" ry="2.5" fill={DIRT} opacity={0.25} />
          <ellipse cx="13.2" cy="14" rx="1" ry="1.5" fill={DIRT} opacity={0.2} transform="rotate(15 13.2 14)" />
          <ellipse cx="7" cy="20" rx="3" ry="1.5" fill={DIRT} opacity={0.28} transform="rotate(-8 7 20)" />
          <ellipse cx="11" cy="23" rx="2.5" ry="1" fill={DIRT} opacity={0.25} transform="rotate(5 11 23)" />
          <circle cx="9" cy="18" r="0.8" fill={DIRT} opacity={0.22} />
          <ellipse cx="8" cy="7" rx="1.5" ry="1" fill={DIRT} opacity={0.18} transform="rotate(-12 8 7)" />
          <path d="M7.5 18 Q7.2 20,7.5 22" stroke={DIRT} strokeWidth="0.6" fill="none" opacity={0.2} strokeLinecap="round" />
          <rect x="4" y="24" width="12" height="1.5" rx="0.5" fill={DIRT} opacity={0.15} />
        </>
      );

    case "dirty":
      return (
        <>
          <ellipse cx="8" cy="17" rx="4" ry="3" fill={DIRT} opacity={0.35} transform="rotate(-12 8 17)" />
          <ellipse cx="12" cy="21" rx="3.5" ry="2.5" fill={DIRT} opacity={0.32} transform="rotate(8 12 21)" />
          <ellipse cx="12" cy="15" rx="2" ry="2.5" fill={DIRT} opacity={0.3} />
          <ellipse cx="9" cy="6.5" rx="3" ry="2" fill={DIRT} opacity={0.28} transform="rotate(-5 9 6.5)" />
          <ellipse cx="6" cy="9" rx="1.5" ry="2" fill={DIRT} opacity={0.25} />
          <path d="M7 11 Q7.3 15,6.8 19 Q7 22,6.5 25" stroke={DIRT} strokeWidth="1" fill="none" opacity={0.35} strokeLinecap="round" />
          <path d="M12 9 Q12.3 12,12 15" stroke={DIRT} strokeWidth="0.7" fill="none" opacity={0.28} strokeLinecap="round" />
          <circle cx="5.5" cy="14" r="1" fill={DIRT} opacity={0.3} />
          <circle cx="14" cy="20" r="0.8" fill={DIRT} opacity={0.28} />
          <circle cx="10" cy="24" r="1.2" fill={DIRT} opacity={0.32} />
          <circle cx="15" cy="8" r="0.6" fill={DIRT} opacity={0.22} />
          <rect x="3" y="23.5" width="14" height="3" rx="0.5" fill={DIRT} opacity={0.3} />
        </>
      );

    case "horrifying":
      return (
        <>
          {/* Base grime — covers nearly the entire door */}
          <rect x="2.5" y="1.5" width="15" height="25" fill={DIRT} opacity={0.55} />
          {/* Layered filth */}
          <ellipse cx="10" cy="14" rx="6" ry="8" fill={DIRT} opacity={0.3} />
          <ellipse cx="7" cy="7" rx="4.5" ry="3.5" fill={DIRT} opacity={0.35} transform="rotate(-8 7 7)" />
          <ellipse cx="13" cy="21" rx="4" ry="4.5" fill={DIRT} opacity={0.3} transform="rotate(5 13 21)" />
          <ellipse cx="6" cy="20" rx="3.5" ry="4" fill={DIRT} opacity={0.3} transform="rotate(-6 6 20)" />
          {/* Heavy drips */}
          <path d="M5 3 Q4.5 9,5.5 15 Q5 20,4.5 26" stroke={DIRT} strokeWidth="1.5" fill="none" opacity={0.45} strokeLinecap="round" />
          <path d="M9 2 Q9.5 7,9 12 Q9.3 17,8.5 24" stroke={DIRT} strokeWidth="1.2" fill="none" opacity={0.4} strokeLinecap="round" />
          <path d="M14 4 Q13.5 10,14.5 17 Q14 22,13 26" stroke={DIRT} strokeWidth="1.3" fill="none" opacity={0.42} strokeLinecap="round" />
          <path d="M11 8 Q11.5 13,11 19 Q11.3 22,11 26" stroke={DIRT} strokeWidth="0.9" fill="none" opacity={0.35} strokeLinecap="round" />
          {/* Splatter */}
          <circle cx="5" cy="11" r="1.5" fill={DIRT} opacity={0.4} />
          <circle cx="15" cy="5" r="1.2" fill={DIRT} opacity={0.38} />
          <circle cx="7" cy="24" r="1.5" fill={DIRT} opacity={0.45} />
          <circle cx="13" cy="10" r="0.9" fill={DIRT} opacity={0.35} />
          <circle cx="4" cy="18" r="1" fill={DIRT} opacity={0.38} />
          <circle cx="16" cy="15" r="0.8" fill={DIRT} opacity={0.35} />
          {/* Thick crust along bottom */}
          <rect x="2.5" y="22" width="15" height="4.5" rx="0.5" fill={DIRT} opacity={0.45} />
        </>
      );
  }
}

type Props = {
  cleanliness: Cleanliness;
  size?: number;
  palette?: MarkerPalette;
};

export function DoorMarker({
  cleanliness,
  size = 24,
  palette = DEFAULT_PALETTE,
}: Props) {
  const p = palette[cleanliness];
  const height = Math.round(size * 1.4);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 20 28"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Frame */}
      <rect x="0.5" y="0" width="19" height="28" rx="0.75" fill={p.frame} />

      {/* Door body */}
      <rect x="2.5" y="1.5" width="15" height="25" fill={p.body} />

      {/* Top panel */}
      <rect
        x="5"
        y="3.5"
        width="10"
        height="7"
        rx="0.4"
        fill={p.panel}
        stroke={p.panelStroke}
        strokeWidth="0.5"
      />

      {/* Bottom panel */}
      <rect
        x="5"
        y="13"
        width="10"
        height="10.5"
        rx="0.4"
        fill={p.panel}
        stroke={p.panelStroke}
        strokeWidth="0.5"
      />

      {/* Door knob */}
      <circle
        cx="14.5"
        cy="17"
        r="1.3"
        fill={KNOB_FILL}
        stroke={KNOB_DETAIL}
        strokeWidth="0.4"
      />
      <circle cx="14.5" cy="17" r="0.45" fill={KNOB_DETAIL} />

      {/* Dirt stains (rendered on top of everything) */}
      {getDirtElements(cleanliness)}
    </svg>
  );
}
