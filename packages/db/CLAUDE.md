# @repo/db

Shared database package — owns the Drizzle schema, the drizzle-zod-derived Zod schemas, and the Postgres client. Single source of truth: tables defined here are the only place tables live.

## Entrypoints

| Import path | Contents | Safe in browser? |
|---|---|---|
| `@repo/db` | Re-exports of `./schema` types and `./zod` schemas | Yes |
| `@repo/db/schema` | Drizzle table definitions and inferred types | Server only (loads `drizzle-orm`) |
| `@repo/db/zod` | Zod insert/select schemas (derived via `drizzle-zod`) | Yes |
| `@repo/db/client` | The Drizzle Postgres client over Neon HTTP | Server only — requires `DATABASE_URL` |

Frontend code should import only from `@repo/db` or `@repo/db/zod`. Importing `@repo/db/client` from a client component will fail.

## Migration workflow

We use Drizzle's SQL migrations (committed to `./drizzle`) for preview + prod, and `db:push` for fast local iteration on a Neon dev branch.

```bash
# Local dev — edit src/schema.ts, then sync the Neon dev branch instantly:
pnpm --filter @repo/db db:push

# When the schema is settled, generate a migration to commit:
pnpm --filter @repo/db db:generate

# Apply pending migrations (runs automatically on Vercel via apps/web's vercel-build):
pnpm --filter @repo/db db:migrate
```

`drizzle.config.ts` reads `DATABASE_URL` from `./env` (loaded via `dotenv/config`). Copy `.env.example` to `.env` for local CLI use.

## Adding a new table

1. Add the `pgTable(...)` definition to `src/schema.ts`.
2. Add `createInsertSchema` / `createSelectSchema` calls in `src/zod.ts` if frontend or API needs validation.
3. Re-export the inferred types from `src/index.ts` if they need to be reachable via `@repo/db` (the convenience entrypoint).
4. `pnpm --filter @repo/db db:push` to sync your local dev branch, then `db:generate` once it's ready to ship.

## Image storage (current shape)

Single optional `image_url` column on `doors`. Holds a Vercel Blob URL once upload lands. One door, one photo.

**If we ever want multiple images per door**, migrate to a sibling table:

```ts
export const doorImages = pgTable("door_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  doorId: uuid("door_id").notNull().references(() => doors.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

Migration plan: create `door_images`, backfill `INSERT INTO door_images (door_id, blob_url) SELECT id, image_url FROM doors WHERE image_url IS NOT NULL`, drop `doors.image_url`. Mechanical.

## Geo queries

`latitude` / `longitude` are `doublePrecision` columns indexed by a compound btree (`doors_location_idx`). This is sized for **bounding-box queries** — map viewport, "show me doors between these two corners":

```ts
db.select().from(doors).where(
  and(
    between(doors.latitude, swLat, neLat),
    between(doors.longitude, swLng, neLng),
  ),
);
```

The compound btree handles this efficiently because Postgres can use it for range scans on the leading column (`latitude`).

**Upgrade path to PostGIS** (do this when you need real "nearest N doors" / "within X meters" queries):
1. `CREATE EXTENSION IF NOT EXISTS postgis;` — one-time on each Neon branch.
2. Add a generated column to `doors`:
   ```sql
   ALTER TABLE doors ADD COLUMN geom geography(Point, 4326)
     GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED;
   ```
3. `CREATE INDEX doors_geom_idx ON doors USING GIST (geom);`
4. Add a drizzle `customType` for the geography column so the ORM knows about it, and switch queries to `ST_DWithin(doors.geom, ST_MakePoint($lng, $lat)::geography, $meters)`.

Why we didn't start with PostGIS: drizzle's PostGIS story requires a small `customType` and SQL fragments in queries, and `ST_DWithin` is overkill for v1 map-view rendering. Bounding boxes get you most of the way and we can layer in proper distance ranking later.

## Why `@neondatabase/serverless` everywhere

Neon's HTTP driver works against any Postgres they host (dev branch, prod branch) from any runtime — Node, Edge, local dev, Vercel. One driver, no environment branching in code. If we ever leave Neon, swap this file for `postgres` + `drizzle-orm/node-postgres`.
