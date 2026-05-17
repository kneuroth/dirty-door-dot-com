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

## Sound

`apps/web/lib/sound.ts` exports two functions:

- `playClick()` — synthesized industrial button click (Web Audio API, no asset). Used by default on the CTA's `onPointerDown`.
- `playRadio(url, options?)` — loads an audio file from `/audio/*` and plays it through a radio-dispatcher effects chain (bandpass + saturation + compression). Buffer-cached, so each file is fetched + decoded once. `preloadRadio(url)` warms the cache for zero-latency first play.

To add a new voice clip, see `apps/web/public/audio/README.md` — that doc covers file formats, recording tips, wiring into `DISPATCH_LINES` in `page.tsx`, and per-clip radio-tuning overrides.

## Env vars

Copy `.env.example` to `.env.local` for local dev. Required:

- `DATABASE_URL` — Neon Postgres connection string.

Future:
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token, used once image upload lands.

## Build / deploy

- `pnpm build` → `next build` only (use during local CI checks).
- `pnpm vercel-build` → runs `drizzle-kit migrate` (via `@repo/db`) then `next build`. **This is the script Vercel uses** — it's set as the build command in the Vercel project so each deploy applies pending migrations against that environment's DB before building.

## Image upload (future)

The create flow is **photo-first**: tap "Upload door" → device camera opens → user captures → image uploads to Vercel Blob → form appears with the rest of the fields → submit creates the door row with the Blob URL filled in. This means image upload completes **before** the door row exists, so it can't hang off `app/api/doors/[id]/...`.

Wiring plan:

1. Add `@vercel/blob` to dependencies.
2. Add `app/api/upload/door-image/route.ts` that uses `handleUpload` from `@vercel/blob/client` to issue a one-time client-upload token. This route does **not** touch the DB.
3. Client uses `import { upload } from "@vercel/blob/client"` — uploads directly from the browser to Blob storage, gets back a `{ url }`. The `<input type="file" accept="image/*" capture="environment">` opens the camera on mobile.
4. Form submits `POST /api/doors` with `imageUrl: url` plus the other fields. The existing `doorInsertSchema` already requires `imageUrl` to be a valid URL when present (it's typed `nullish`, but the UX path always provides one), so the door row is created with the Blob URL persisted.
5. Frontend renders via `<Image>` from `next/image`. Allowlist the Blob host (`*.public.blob.vercel-storage.com`) in `next.config.js` under `images.remotePatterns`.

Failure handling note: if the door insert fails after the Blob upload succeeded, you have an orphaned Blob object. Two options when that's a concern: (a) periodic sweeper that deletes Blobs not referenced by any door, or (b) wrap the upload+insert in a server action that deletes the Blob on insert failure. Skip both until it's actually a problem.
