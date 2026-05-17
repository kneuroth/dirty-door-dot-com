import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const cleanlinessValues = [
  "horrifying",
  "dirty",
  "smudged up",
  "decent",
  "immaculate",
] as const;

export type Cleanliness = (typeof cleanlinessValues)[number];

export const cleanlinessEnum = pgEnum("cleanliness", cleanlinessValues);

export const doors = pgTable(
  "doors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    cleanliness: cleanlinessEnum("cleanliness").notNull(),
    imageUrl: text("image_url"),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
  },
  (table) => [
    index("doors_location_idx").on(table.latitude, table.longitude),
  ],
);

export type Door = typeof doors.$inferSelect;
export type NewDoor = typeof doors.$inferInsert;
