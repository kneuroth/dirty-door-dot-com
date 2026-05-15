# dirtydoor.com

Monorepo for **dirtydoor.com** — THE place to shame companies for their dirty doors.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **App**: Next.js 16 (App Router) — frontend + API in one app (`apps/web`)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **DB**: Postgres on [Neon](https://neon.tech) via Drizzle ORM
- **Validation**: Zod (derived from the Drizzle schema via `drizzle-zod`)
- **Hosting**: Vercel
- **Image storage (future)**: Vercel Blob

## Layout

```
apps/
└── web/                # Next.js app — UI + /api/* routes
packages/
├── db/                 # Drizzle schema, Zod schemas, Postgres client
├── eslint-config/      # shared ESLint config
└── typescript-config/  # shared TS config
```

## Environments

Three tiers, all using the same Postgres engine so dev truly mirrors prod:

| Tier       | Where                        | Database         |
| ---------- | ---------------------------- | ---------------- |
| Local      | `pnpm dev` on your machine   | Neon dev branch  |
| Preview    | Vercel preview URL (per PR)  | Neon dev branch  |
| Production | Vercel production deployment | Neon main branch |

## Run it locally

Prerequisites: Node 18+, pnpm 9+, a Neon project with a `dev` branch.

```bash
# 1. Install deps
pnpm install

# 2. Set DATABASE_URL in both places (one for the runtime client, one for drizzle-kit)
cp apps/web/.env.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
# Paste your Neon dev-branch connection string into both files.

# 3. Sync the schema to your Neon dev branch
pnpm --filter @repo/db db:push

# 4. Run the app
pnpm dev
# → http://localhost:3000
```

Try the API:

```bash
curl -X POST http://localhost:3000/api/doors \
  -H "content-type: application/json" \
  -d '{"name":"the door at the back of the laundromat"}'
```

## Run it in production (one-time setup)

1. Push the repo to GitHub.
2. In Vercel, **New Project** → import the repo. Set **Root Directory** to `apps/web`. Vercel will detect the Turborepo automatically.
3. Set the **Build Command** to `pnpm vercel-build` (this runs `drizzle-kit migrate` before `next build`).
4. Add the **Neon integration** from the Vercel marketplace → this wires `DATABASE_URL` for production, preview, and development environments automatically.
5. Push to `main` → production deploy. Open a PR → preview deploy with its own URL pointed at the Neon dev branch.

## Common commands

```bash
pnpm dev                                    # run the app
pnpm build                                  # build everything
pnpm lint                                   # lint everything
pnpm check-types                            # typecheck everything
pnpm format                                 # prettier write
pnpm --filter @repo/db db:push              # sync schema to current DATABASE_URL (no migration files)
pnpm --filter @repo/db db:generate          # generate a migration from schema changes
pnpm --filter @repo/db db:migrate           # apply pending migrations
pnpm --filter @repo/db db:studio            # open Drizzle Studio
pnpm dlx shadcn@latest add <component>      # add a shadcn component (writes to apps/web)
```

## Where things live

- New page or route → `apps/web/app/...`
- New DB table → `packages/db/src/schema.ts` (+ Zod schemas in `src/zod.ts`)
- New UI component → `apps/web/components/ui/...` (via shadcn) or `apps/web/components/...`
- Image upload (when it lands) → see `apps/web/CLAUDE.md` and `packages/db/CLAUDE.md`

Each `app` and `package` has its own `CLAUDE.md` with package-specific guidance.
