# dirtydoor.com — repo guide

Mobile-first web app for posting dirty doors. Single Next.js app, single shared DB package.

## Topology

```
apps/web                     # Next.js 16 — UI + API routes
packages/db                  # Drizzle tables, Zod schemas, Postgres client
packages/eslint-config       # shared ESLint config (base + next-js)
packages/typescript-config   # shared tsconfig (base + nextjs)
```

There is only one app. Frontend and backend code both live in `apps/web` — Next.js App Router covers both.

## Single source of truth

The DB schema lives in **`packages/db/src/schema.ts`**. Zod validators (`packages/db/src/zod.ts`) are **derived** from that schema via `drizzle-zod` — never hand-write a parallel Zod schema in `apps/web`, always import from `@repo/db/zod`.

## Environment story

| Tier | DB |
|---|---|
| Local (`pnpm dev`) | Neon dev branch |
| Preview (Vercel per-PR) | Neon dev branch |
| Production | Neon main branch |

All three use Neon's HTTP driver (`@neondatabase/serverless`), so the client code is identical across environments. `DATABASE_URL` is the only env var that changes.

Migrations run on every Vercel build via `apps/web`'s `vercel-build` script, which calls `drizzle-kit migrate` before `next build`.

## Adding things

- **DB table** → edit `packages/db/src/schema.ts`. Add derived Zod schemas in `packages/db/src/zod.ts`. Run `pnpm --filter @repo/db db:push` to sync your local dev branch; commit a generated migration before merging via `db:generate`.
- **API route** → `apps/web/app/api/<segment>/route.ts`. Validate input with a schema from `@repo/db/zod`. Use `db` from `@repo/db/client` for queries.
- **Page** → `apps/web/app/<route>/page.tsx`. RSC by default; add `"use client"` only when needed.
- **UI component** → run `pnpm dlx shadcn@latest add <name>` from the repo root; it writes to `apps/web/components/ui/`.

## Commands

```bash
pnpm dev               # turbo dev (runs apps/web on :3000)
pnpm build             # build everything
pnpm check-types       # typecheck everything
pnpm lint              # lint everything

# DB ops (run from anywhere via filter):
pnpm --filter @repo/db db:push       # sync schema (local iteration)
pnpm --filter @repo/db db:generate   # emit a migration SQL file
pnpm --filter @repo/db db:migrate    # apply pending migrations
pnpm --filter @repo/db db:studio     # open Drizzle Studio
```

## Future: images

Storage will be **Vercel Blob**. The data model will be a sibling table `door_images` (not a column on `doors`) so multiple images per door is the default. See `packages/db/CLAUDE.md` and `apps/web/CLAUDE.md` for the wiring plan.

## Pushback notes

The repo was bootstrapped with `create-turbo`, which gave us a second demo Next.js app (`apps/docs`) and a shared UI package (`packages/ui`). Both were deleted in the initial setup pass — there's only one consumer app, and shadcn components are meant to live inside the consumer app, not be shared. If a second app ever appears (admin dashboard, marketing site), revisit whether to extract a shared UI package then.
