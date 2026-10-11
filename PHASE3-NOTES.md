# Phase 3 alignment: library backend (delta)

Only new and changed files, so your other files and local edits are untouched.
Unzip over your `pistislibrary/` folder. No new npm packages.

## Apply

```bash
# from the pistislibrary/ root, after unzipping
npm run migrate        # adds 20261008000001-align-library-with-blueprint
npm run typecheck
```

The migration is reversible (`npm run migrate:undo`) and backfills existing data:

- every book keeps its category in the new `book_categories` table
- each file gets `file_name`, `mime_type`, and `is_readable` / `is_downloadable` copied from its book's old flags
- existing downloads are linked to their `book_file_id`
- all search vectors are rebuilt

Going back down keeps only each book's first category and cannot remove the `ARCHIVED` enum value (archived books become drafts).

## API changes (breaking, no clients exist yet)

| Before | Now |
|---|---|
| `/admin/books`, `/admin/authors`, `/admin/categories`, `/admin/uploads/presign` | `/books`, `/authors`, `/categories`, `/uploads/presign`; mutations are ADMIN-only per route |
| `GET /admin/books` (all statuses) | `GET /books?status=ALL` (administrators only) |
| `GET /admin/books/:id` | `GET /books/:idOrSlug` (administrators can open drafts and archived books) |
| `GET /books/:slug` | `GET /books/:idOrSlug` (UUID or slug) |
| `POST/PATCH` book with `categoryId` | `categoryIds: [...]` (1 to 10) |
| book `allowReading` / `allowDownload` fields | per file: `isReadable` / `isDownloadable` (the book's `allowReading` / `allowDownload` in responses are derived) |
| response `category` | response `categories: [...]` |
| statuses `DRAFT`, `PUBLISHED` | adds `ARCHIVED` (`POST /books/:id/archive`) |
| (new) | `PATCH /books/:id/files/:format` (rename, toggle read/download), author `photoKey`, upload `kind: "authorPhoto"` |

## Changed files (re-apply any local edits)

`README.md`, `backend/README.md`, `backend/src/routes.ts`, `backend/src/middleware/auth.ts`, `backend/src/utils/parseId.ts`,
`backend/src/services/storage.service.ts` (`coverUrl` renamed `imageUrl`), models `Author`, `Book`, `BookFile`, `Download`, `index`,
and every file in `backend/src/modules/{authors,books}` plus `categories/{controller,repository,routes,service}` and `uploads/{routes,schema,service}`.

New: `database/migrations/20261008000001-align-library-with-blueprint.js`, `backend/src/database/models/BookCategory.ts`,
`backend/src/services/{cache,uploadVerification}.service.ts`, `backend/src/utils/storageKeys.ts`.
