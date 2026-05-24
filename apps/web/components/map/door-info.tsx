import type { Cleanliness } from "@repo/db";
import { DEFAULT_PALETTE } from "./door-marker";

const SERIF = "Times, 'Times New Roman', Georgia, serif";
const STAMP_FONT = "Impact, 'Arial Narrow', 'Helvetica Neue', sans-serif";

type Props = {
  title: string;
  description?: string | null;
  cleanliness: Cleanliness;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
};

export function DoorInfo({
  title,
  description,
  cleanliness,
  latitude,
  longitude,
  compact,
}: Props) {
  const palette = DEFAULT_PALETTE[cleanliness];

  const stamp = (
    <div
      className="-rotate-[6deg] rounded-full border-[3px] px-2.5 py-0.5 text-center leading-tight"
      style={{
        borderColor: palette.body,
        color: palette.body,
        fontFamily: STAMP_FONT,
        borderStyle: "double",
      }}
    >
      <span
        className={`font-bold uppercase tracking-widest ${compact ? "text-[10px]" : "text-xs sm:text-sm"}`}
      >
        {cleanliness}
      </span>
    </div>
  );

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 bg-white p-2.5 text-black"
        style={{ fontFamily: SERIF }}
      >
        <p className="flex-1 text-xs font-bold uppercase leading-tight">
          {title}
        </p>
        {stamp}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 text-black sm:p-5" style={{ fontFamily: SERIF }}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-bold uppercase leading-tight sm:text-base">
          {title}
        </p>
        {stamp}
      </div>

      {description && (
        <>
          <hr className="my-2 border-0 border-t-2 border-black" />
          <p className="text-xs italic sm:text-sm">{description}</p>
        </>
      )}

      {latitude != null && longitude != null && (
        <>
          <hr className="my-2 border-0 border-t-2 border-black" />
          <p className="font-mono text-[10px] text-neutral-500">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
        </>
      )}
    </div>
  );
}
