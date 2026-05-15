# apps/web

The only application in the repo. Next.js 16 (App Router) — frontend pages AND backend route handlers live here. No separate backend service.

## Layout

```
app/
├── layout.tsx          # root layout (html/body, metadata, viewport)
├── page.tsx            # landing page (mobile-first)
├── globals.css         # Tailwind v4 entry + shadcn theme tokens
└── api/
    └── doors/
        └── route.ts    # POST /api/doors
components/
└── ui/                 # shadcn components (copied in, customizable)
lib/
└── utils.ts            # shadcn cn() helper
```

Path alias: `@/*` resolves to `apps/web/*` (see `tsconfig.json`).

## Conventions

- **Frontend pages**: React Server Components by default. Add `"use client"` only when you need state, effects, or browser-only APIs.
- **API routes**: route handlers under `app/api/<segment>/route.ts`. Always validate request bodies with a Zod schema from `@repo/db/zod`. Return `NextResponse.json(...)` with explicit status codes.
- **DB access**: import `db` from `@repo/db/client` inside server code only. Never reach for it from a client component.
- **Validation**: never re-declare a schema in this app — derive everything from `@repo/db/zod`.

## Styling

Tailwind CSS v4 via `@tailwindcss/postcss`. No `tailwind.config.{ts,js}` file — config lives inside `app/globals.css` under `@theme`. Design tokens (colors, radius) are CSS variables that shadcn components consume.

Mobile-first: layout assumes phone screen by default; use `sm:`, `md:`, `lg:` to enhance for larger viewports.

## shadcn

```bash
# Add a new component (run from repo root):
pnpm dlx shadcn@latest add <component>   # writes to apps/web/components/ui
```

`components.json` is configured for the "new-york" style with neutral base color and CSS variables.

## Env vars

Copy `.env.example` to `.env.local` for local dev. Required:

- `DATABASE_URL` — Neon Postgres connection string.

Future:
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token, used once image upload lands.

## Build / deploy

- `pnpm build` → `next build` only (use during local CI checks).
- `pnpm vercel-build` → runs `drizzle-kit migrate` (via `@repo/db`) then `next build`. **This is the script Vercel uses** — it's set as the build command in the Vercel project so each deploy applies pending migrations against that environment's DB before building.

## Image upload (future)

When images land:
1. Add `@vercel/blob` to dependencies.
2. New route handler `app/api/doors/[id]/images/route.ts` accepts a multipart upload, calls `put(...)` from `@vercel/blob`, persists the returned URL in the `door_images` table (defined in `@repo/db/schema`).
3. Frontend uses `<Image>` from `next/image` against the Blob URL host (allowlist it in `next.config.js`).
