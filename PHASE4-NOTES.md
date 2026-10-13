# Phase 4: library frontend (delta)

Only new and changed files; your other files and local edits are untouched. Unzip over your `pistislibrary/` folder.

## Apply

```bash
# 1. remove the old placeholder home page (it moved to app/(public)/page.tsx)
rm frontend/app/page.tsx

# 2. new frontend dependency (package.json / lock files are not part of this zip)
cd frontend && npm i @react-oauth/google

# 3. optional: Google sign-in on the login/register pages
#    add NEXT_PUBLIC_GOOGLE_CLIENT_ID to frontend/.env.local (same web client ID as the backend's GOOGLE_CLIENT_IDS)
```

No database migration. Restart the backend (two small fixes below), then `npm run dev:frontend` or `npm run build && npm run start` in `frontend/`.

## Backend fixes included

- `GET /books` and `GET /authors` returned `total: 0` when the requested page was past the end of the results; they now return the real total.
  Changed: `backend/src/modules/books/book.repository.ts`, `backend/src/modules/authors/author.repository.ts`, `backend/src/modules/authors/author.service.ts`.

## Changed files (re-apply any local edits)

`README.md`, `frontend/.env.example`, `frontend/app/layout.tsx` (adds `AuthProvider`, metadata), `frontend/lib/api.ts` (silent token refresh),
`frontend/next.config.ts` (adds the `/search` redirect to the existing proxy and Tailwind rules).

Everything else in the zip is new: `app/(public)`, `app/(auth)`, `app/status`, `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`,
`components/`, `features/{library,layout,auth}`, `services/`, `lib/`, `types/`, `frontend/README.md`.

## Notes

- Not-found pages for unknown books, authors and categories render with a `noindex` tag but HTTP 200 (Next serves a prerendered shell
  first for dynamic routes). The sitemap lists only real URLs.
- Online reading and downloads are Phase 5; the book page shows formats and availability only.
- `/requests/new` is a placeholder until Phase 6.
