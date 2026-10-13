# PistisLibrary frontend

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4. Run from `frontend/`:

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm run start` | Production build / server (the build does **not** need the API running) |
| `npm run lint` | ESLint |

Copy `.env.example` to `.env.local`. The browser only talks to this origin: `/api/v1/*` is proxied to the Express API
(`API_URL`), so auth cookies stay first-party.

## Pages

| Route | Content |
|---|---|
| `/` | Hero with search, featured (most popular) and recently added books, categories, request call-to-action |
| `/books` | Library: search, category / format / language / year filters, sorting, pagination (URL-driven `GET` form, works without JavaScript) |
| `/books/[slug]` | Book details, formats, categories, "more by this author"; `Book` structured data, Open Graph, canonical URL |
| `/categories`, `/categories/[slug]` | Category index and category listings |
| `/authors`, `/authors/[slug]` | Author index (searchable) and author profiles with their books |
| `/login`, `/register` | Email/password and Google sign-in (Google appears when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set) |
| `/requests/new` | Placeholder until the request system ships (Phase 6) |
| `/sitemap.xml`, `/robots.txt` | Generated from live library data |
| `/status` | Service health (not indexed) |

`/search?q=...` redirects to `/books?q=...`.

## How data and caching work

- Server components read the API through `services/library.ts`. Reads use `use cache` (`cacheLife("minutes")`, tagged), so a
  change made by an administrator appears within about a minute.
- Data-driven sections render at request time (`await connection()` inside Suspense), so builds never depend on the API.
- Free-text searches are not cached; the visitor's IP is forwarded (`X-Forwarded-For`) so the API's rate limits apply per
  visitor instead of to the Next.js server.
- Detail routes (`/books/[slug]`, `/categories/[slug]`, `/authors/[slug]`) declare a placeholder `generateStaticParams` entry.
  Next serves a prerendered shell first for these routes, so an unknown slug renders the not-found page with a `noindex` tag
  and HTTP 200 (the documented behavior for streamed pages). The sitemap lists only real URLs.

## Covers and Open Graph images

Cover and photo URLs come from the API. In development they are short-lived signed URLs; for production set the API's
`S3_PUBLIC_URL` to a public bucket or CDN so cover URLs (and social-share images) never expire. Images are served as-is
(`unoptimized`); configure `images.remotePatterns` in `next.config.ts` to enable Next's optimizer for that host.

## Design system

Tokens live in `app/globals.css` (`@theme`): `night`, `surface`, `umber`, `brown`, `copper`, `copper-bright`, `copper-soft`,
`ink`, `ink-soft`, `ink-muted`, `line`. Copper tones are accents (borders, glows, highlights). `ink-muted` is for decorative
text only because its contrast on the darkest backgrounds is below WCAG AA; use `ink-soft` for readable secondary text.

## Structure

```
app/(public)/   site pages with header and footer
app/(auth)/     focused login / register layout
components/     ui primitives (button, badge, container, skeleton...)
features/       library, layout, auth, system
services/       server data access (library.ts)
lib/            api clients, helpers, search-param parsing, config
types/          shared TypeScript types
```
