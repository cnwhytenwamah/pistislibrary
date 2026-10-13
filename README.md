# PistisLibrary

A digital library for Christian books. **Discover. Read. Grow.**

```
pistislibrary/
├── frontend/   Next.js + TypeScript + Tailwind (web)
├── backend/    Express + TypeScript + Sequelize (REST API at /api/v1, plus the BullMQ worker)
├── database/   Sequelize migrations, seeders and CLI config
└── docker-compose.yml   PostgreSQL, Redis, MinIO for local development
```

```
Next.js  ──REST──►  Express API  ──►  PostgreSQL  (source of truth)
                        │         ──►  Redis       (cache, rate limits, BullMQ)
                        │         ──►  Object storage (PDF / EPUB / covers)
                   BullMQ worker (separate process, same Redis + PostgreSQL)
```

The mobile app (React Native + Expo, Phase 11) will use the same API.

## Prerequisites

Node.js 20+, Docker (or your own PostgreSQL 14+, Redis 6+ and S3-compatible storage).

## Quick start

```bash
npm run install:all

cp backend/.env.example backend/.env       # set JWT_ACCESS_SECRET and GOOGLE_CLIENT_IDS
cp frontend/.env.example frontend/.env.local   # optional: NEXT_PUBLIC_GOOGLE_CLIENT_ID for Google sign-in

npm run infra:up                           # PostgreSQL, Redis, MinIO
# create the bucket named in S3_BUCKET (default "pistis-library") at http://localhost:9001
npm run migrate
npm run seed                               # optional starter categories, run once

# three terminals:
npm run dev:backend                        # http://localhost:4000/api/v1/health
npm run dev:worker                         # BullMQ worker
npm run dev:frontend                       # http://localhost:3000
```

## Verify the foundation

With the three processes above running:

```bash
npm run verify
```

```
✔ Frontend → Running
✔ Backend → Running
✔ PostgreSQL → Connected
✔ Sequelize → Connected
✔ Redis → Connected
✔ BullMQ → Connected
✔ Health endpoint → Working
```

`GET /api/v1/health` returns 200 when PostgreSQL, Redis and the queue are reachable (503 otherwise);
`GET /api/v1/health/live` is a dependency-free liveness check.

## Conventions

- Backend layering: routes → middleware → controllers → services → repositories → Sequelize models.
- Schema changes go through migrations in `database/migrations` (never `sync({ alter: true })`).
- First admin: sign in once, then `UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';`
- Only content PistisLibrary has the right to distribute belongs in the library
  (public domain, openly licensed, or used with permission). Each book has a `rightsNote` for provenance.

## Phase status

| Phase | Status |
|---|---|
| 1 Foundation (monorepo, Next.js, Express, Sequelize, PostgreSQL, Redis, BullMQ, health checks) | ✅ |
| 2 Authentication (email/password, Google sign-in, refresh rotation, roles) | ✅ |
| 3 Library backend (authors, categories, multi-category books, files, uploads, publishing) | ✅ |
| 4 Library frontend (home, library, search and filters, categories, authors, book pages, SEO, login/register UI) | ✅ |
| 5 Reading, bookmarks, downloads | ⬜ |
| 6 Book requests | ⬜ |
| 7 Notifications | ⬜ |
| 8 Admin dashboard | ⬜ |
| 9 Testing & security | ⬜ |
| 10 Deployment | ⬜ |
| 11 Mobile (Expo) | ⬜ |
