# PistisLibrary API

Express + TypeScript + Sequelize (PostgreSQL), with Redis (rate limiting, cache) and BullMQ (background jobs).
See the root README for setup. Run from `backend/`:

| Script | Purpose |
|---|---|
| `npm run dev` | API with reload (port 4000) |
| `npm run worker` / `worker:dev` | BullMQ worker process |
| `npm run migrate` / `migrate:undo` / `seed` | Sequelize CLI (migrations live in `../database`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:foundation` | Phase 1 checks (needs frontend, API, worker running) |

## Authorization model

Resources share one path; mutations are guarded per route with `adminOnly` (`authenticate` + `requireRole("ADMIN")`).
Reads are public. A few public routes use `optionalAuthenticate`: administrators additionally see drafts and archived
books and authors/categories without published books. Nothing relies on frontend route protection.

## Endpoints (`/api/v1`)

| Area | Endpoints | Access |
|---|---|---|
| Health | `GET /health`, `GET /health/live` | public |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout`; `GET /auth/me` | public / user |
| Books (read) | `GET /books` (`q, category, author, language, year, format, sort, page, limit`), `GET /books/:idOrSlug` | public (admins: `status=DRAFT\|PUBLISHED\|ARCHIVED\|ALL`) |
| Books (read/download) | `GET /books/:idOrSlug/files/:format/read-url`, `POST /books/:idOrSlug/files/:format/download` | logged in |
| Books (manage) | `POST /books`, `PATCH /books/:id`, `DELETE /books/:id` | **ADMIN** |
| Publishing | `POST /books/:id/publish`, `/unpublish`, `/archive` | **ADMIN** |
| Book files | `PUT /books/:id/files`, `PATCH /books/:id/files/:format`, `DELETE /books/:id/files/:format` | **ADMIN** |
| Authors | `GET /authors`, `GET /authors/:idOrSlug` · `POST /authors`, `PATCH /authors/:id`, `DELETE /authors/:id` | public · **ADMIN** |
| Categories | `GET /categories` · `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` | public · **ADMIN** |
| Uploads | `POST /uploads/presign` (`kind`: `book`, `cover`, `authorPhoto`) | **ADMIN** |

`sort`: `relevance` (default with `q`), `newest` (default), `oldest`, `downloads`, `popular`, `title`.
Book lookups accept a UUID or a slug (public pages use slugs for SEO). Web clients receive httpOnly cookies;
mobile clients send `x-client: mobile` and receive tokens in the JSON body.

## Books, categories and files

- A book belongs to **one or more categories** (`categoryIds`, 1 to 10) through `book_categories`.
- A book has one file per format (PDF, EPUB) in `book_files`: `file_name`, `mime_type`, `size_bytes`, `storage_key`,
  and per-file `is_readable` / `is_downloadable`. The book's `allowReading` / `allowDownload` in responses are derived from its files.
- Status: `DRAFT` → `PUBLISHED` (needs at least one file) → `ARCHIVED`. Only published books are public.
- Storage keys are never returned by the API; clients get short-lived signed URLs.

## Admin upload flow

1. `POST /uploads/presign` `{ kind, contentType, sizeBytes }` returns `{ key, uploadUrl, headers }`
2. `PUT` the file to `uploadUrl` with the returned `headers`
3. `POST /books` with metadata, `authorId`, `categoryIds`, `coverKey` and `files: [{ format, storageKey: key, fileName?, isReadable?, isDownloadable? }]`
   (the API checks each object exists in storage and enforces the size limits)
4. `POST /books/:id/publish`

Author photos use `kind: "authorPhoto"` and the author's `photoKey`.

## Storage

Books, covers and author photos live in an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO). The API never streams files.
The bucket needs CORS for `PUT` and `GET`:

```json
[{ "AllowedOrigins": ["http://localhost:3000"], "AllowedMethods": ["GET", "PUT", "HEAD"],
   "AllowedHeaders": ["*"], "ExposeHeaders": ["ETag"], "MaxAgeSeconds": 3600 }]
```

## Redis usage

- **Rate limiting** (shared across instances): general API, auth, search, downloads. If Redis is down, requests are allowed through.
- **Cache** (fails open; PostgreSQL stays the source of truth): `categories:all` (5 min) and `book:{id}` / `book:{slug}` (2 min),
  cleared when an administrator changes the related data.
- **BullMQ**: `system` queue today; notifications, email, book processing and analytics arrive with their phases.

## Search

Weighted PostgreSQL full-text (title and author highest, then keywords and **all** categories, then description) plus trigram
matching on titles for typos. The vector is maintained by database triggers, including when a book's categories change or
an author/category is renamed.

## Known differences from the blueprint

- Storage references are keys (`books.cover_key`, `authors.photo_key`), not stored URLs, because signed URLs expire.
- `downloads` keeps a `format` column next to `book_file_id` so history survives if a file is later removed.
- Tables for bookmarks, reading progress, requests, supporters and notifications arrive in Phases 5–7.
