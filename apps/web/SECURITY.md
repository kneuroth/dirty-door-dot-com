# Security tracker — apps/web

A live document. **Update it whenever a feature lands that changes the security surface, and whenever an item from "Future work" gets shipped or no longer applies.** The "Append log" at the bottom is the source of truth for what was changed when.

---

## Current state snapshot

_Last updated: 2026-05-17_

### What IS protected today

| Surface | Protection |
|---|---|
| SQL injection | Drizzle parameterized queries (`@repo/db/client`) |
| Malformed input on `POST /api/doors` | `doorInsertSchema` (`@repo/db/zod`) — title 1–200, description ≤2000, cleanliness enum-bound, lat ±90, lng ±180 |
| Unbounded reads on `GET /api/doors` | `doorBoundsSchema` validates bounds params; bounding box capped at 2° lat span; result set capped at 200 rows; only map-relevant columns returned (no description/imageUrl) |
| XSS at render | React default escaping. No `dangerouslySetInnerHTML` anywhere in the app — keep it that way unless absolutely necessary, and sanitize at that point. |
| Secret exposure | `.env*` gitignored; `DATABASE_URL` is server-only; map style JSON is public but contains no secrets |
| Cross-origin browser requests | Next.js routes are same-origin by default |
| Image upload on `POST /api/upload/door-image` | Server-side content-type allowlist (JPEG/PNG/WebP only), 10 MB size cap via `onBeforeGenerateToken`. Client-side pre-validation mirrors server rules. Signed upload tokens — bytes go directly to Vercel Blob, never through our server. |

### What is NOT protected today

- **No rate limiting** on `/api/doors`. Anyone can POST in a loop.
- **No auth.** Every door is anonymous; no per-user rate limit; no ban-ability.
- **No bot detection / no CAPTCHA.** Bots can hit the API directly, bypassing the form entirely.
- **No request logging** beyond Vercel defaults — abuse won't be noticed until billing notices.
- **Geolocation is client-trusted.** Lat/lng are spoofable; a bad actor can submit doors at any coordinates.
- **No explicit request body size cap** beyond Next.js's defaults (~4MB).
- **No image upload yet** — when it lands, expect a fresh class of risks (file type, size, content).

---

## Pre-launch checklist

The day before `dirtydoor.com` goes public, these should be done:

- [ ] **Rate limit `/api/doors`** — Upstash Ratelimit (free tier) or Vercel KV. Target: ≤5 POSTs per IP per minute, return 429 with `Retry-After`.
- [ ] **Cloudflare Turnstile** on the form. Server validates the token before insert. Invisible to most users.
- [ ] **Explicit body size cap** on the route handler (32KB is plenty for door JSON).
- [ ] **Pipe Vercel function logs** to Axiom / Logflare / Better Stack so abuse patterns are queryable.

These four take ~30 minutes total. None of them require auth.

---

## Future work (priority order)

### High — before serious traffic
- **User auth.** Clerk / Auth.js / Supabase Auth / Resend magic-links. Unlocks per-user rate limiting, ban-ability, "your doors" view.
- **Image moderation** when uploads land. Cloudflare Images has it built in; Sightengine and AWS Rekognition are alternatives.
- **Honeypot field** on the form. Catches naive bots that don't render the form properly.

### Medium
- **Vercel WAF** (requires Pro+) for DDoS, bot mitigation, geo-blocking.
- **IP block list** for repeat offenders.
- **Geo-rate-limiting** — cap doors-per-square-km-per-day to prevent map-flooding a target neighborhood.

### Low / monitor-and-react
- **IP-geolocation vs submitted lat/lng cross-check** — flag wildly inconsistent submissions (e.g. IP in Romania, claimed door in Seattle) for manual review.
- **Soft-delete** any future user-visible resources so admin moderation doesn't destroy data.

---

## Per-feature notes (consult BEFORE building)

### Image upload (when wired)

Where it'll live: `apps/web/app/api/upload/door-image/route.ts` per `apps/web/CLAUDE.md`.

- File type allowlist: `image/jpeg`, `image/png`, `image/webp`. Reject everything else server-side, even if the client claims otherwise.
- Size cap: 5–10MB.
- Use Vercel Blob's signed-upload tokens (`@vercel/blob/client` `upload()` + a server route that issues `handleUpload` tokens). **Do NOT** proxy image bytes through your own server.
- Orphan cleanup: if door insert fails after Blob upload, that Blob is now orphaned. Either (a) sweeper job, or (b) wrap upload+insert in a server action that deletes the Blob on insert failure.
- Content moderation: not on day one. Add it when user-uploaded content becomes visible to other users, OR when you see anything questionable hit Blob storage.

### User accounts (when introduced)

- Per-user rate limiting in addition to per-IP — anonymous attackers will rotate IPs faster than they'll rotate emails.
- Email verification before first door submission.
- `banned_at` / `banned_reason` columns on users table.
- Audit log table for admin actions (ban, unban, delete door).
- Sessions: use whatever the chosen auth lib provides; if rolling own, use httpOnly + Secure + SameSite=Lax cookies.

### Door list / GET /api/doors (shipped — MVP)

- ~~**Pagination** — never return unbounded lists.~~ **Done:** bounding-box viewport query with `LIMIT 200` and a 2° lat-span cap. No cursor needed while the only consumer is the map viewport.
- ~~**Don't expose internal IDs** in URLs if you can help it.~~ UUIDs in JSON responses are fine (not sequential, not guessable). Revisit if we add `/doors/:id` detail pages.
- **Rate limit reads too**, just less aggressively than writes (e.g. 60 reads/min/IP). **Not done yet** — still on the pre-launch checklist.
- **Privacy:** lat/lng of a door is the door's location, not the submitter's home. No user accounts exist yet, so reports aren't linkable to a person. When user accounts land, revisit whether to publicly attribute doors to users or keep them anonymous.

### Comments / ratings / any future user-rendered text

- Per-resource rate limit.
- XSS escaping is automatic via React, BUT if you ever convert markdown to HTML, sanitize with DOMPurify or rehype-sanitize.
- Profanity filtering / moderation queue.
- Soft-delete so admin moderation doesn't destroy data the user might want back.

### Admin endpoints (when they exist)

- Behind auth, not just behind "this is the admin path."
- Separate rate limits (or none — admins acting fast is fine).
- All admin actions go in an audit log.

---

## Append log

Most-recent-first.

- **2026-05-24** — Image upload shipped. `POST /api/upload/door-image` uses Vercel Blob signed tokens with server-side content-type allowlist (JPEG/PNG/WebP) and 10 MB cap. Client pre-validates type and size. Image bytes never touch our server. Content moderation still absent — noted in future work.
- **2026-05-24** — `GET /api/doors` shipped (MVP). Bounding-box query with `doorBoundsSchema` validation, 2° lat-span cap, 200-row limit, column-restricted response (id/title/cleanliness/lat/lng only). Client uses `AbortController` to cancel stale viewport fetches. Updated "Door list" section from future-work to shipped.
- **2026-05-17** — Initial tracker created. Audited current state: input validation via Zod is solid; everything around abuse (rate limiting, auth, captcha, logging) is missing. Documented pre-launch checklist (4 items, ~30 min total work) and prioritized future work. No code changes yet — this doc is the baseline to track against.
