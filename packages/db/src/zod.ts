import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { doors } from "./schema";

export const doorSelectSchema = createSelectSchema(doors);

export const doorInsertSchema = createInsertSchema(doors, {
  title: (s) => s.title.min(1).max(200),
  description: z.string().max(2000).nullish(),
  imageUrl: z.string().url().nullish(),
  latitude: (s) => s.latitude.min(-90).max(90),
  longitude: (s) => s.longitude.min(-180).max(180),
}).omit({ id: true });

export type DoorInsert = z.infer<typeof doorInsertSchema>;
export type DoorSelect = z.infer<typeof doorSelectSchema>;
