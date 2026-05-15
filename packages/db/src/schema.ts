import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const doors = pgTable("doors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export type Door = typeof doors.$inferSelect;
export type NewDoor = typeof doors.$inferInsert;
