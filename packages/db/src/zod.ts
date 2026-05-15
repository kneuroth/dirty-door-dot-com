import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { doors } from "./schema";

export const doorSelectSchema = createSelectSchema(doors);

export const doorInsertSchema = createInsertSchema(doors, {
  name: (s) => s.name.min(1).max(200),
}).omit({ id: true });

export type DoorInsert = z.infer<typeof doorInsertSchema>;
export type DoorSelect = z.infer<typeof doorSelectSchema>;
