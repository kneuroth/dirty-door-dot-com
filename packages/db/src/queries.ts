import { and, between } from "drizzle-orm";
import { db } from "./client";
import { doors } from "./schema";
import type { DoorBounds } from "./zod";

const MAX_RESULTS = 200;

export type MapDoor = {
  id: string;
  title: string;
  description: string | null;
  cleanliness: string;
  latitude: number;
  longitude: number;
};

export async function findDoorsInBounds(bounds: DoorBounds): Promise<MapDoor[]> {
  return db
    .select({
      id: doors.id,
      title: doors.title,
      description: doors.description,
      cleanliness: doors.cleanliness,
      latitude: doors.latitude,
      longitude: doors.longitude,
    })
    .from(doors)
    .where(
      and(
        between(doors.latitude, bounds.swLat, bounds.neLat),
        between(doors.longitude, bounds.swLng, bounds.neLng),
      ),
    )
    .limit(MAX_RESULTS);
}
