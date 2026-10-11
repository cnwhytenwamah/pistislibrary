# Moving your existing project into the PistisLibrary monorepo (delta)

This zip holds only new and changed files. It assumes your current API project is the one from the previous zips.
Your other backend files (auth, books, authors, categories, uploads, models, migrations) are left untouched.

## 1. Restructure (one time)

From the folder that contains your API project:

```bash
mkdir pistislibrary
mv pistis-library-api pistislibrary/backend          # use your project folder's name
cd pistislibrary
mkdir database
mv backend/src/database/migrations backend/src/database/seeders backend/src/database/config.js database/
```

## 2. Unzip this delta into `pistislibrary/`

Files you've edited locally that this zip replaces (compare before overwriting):

- `backend/.sequelizerc`, `backend/.env.example`
- `backend/src/config/env.ts` (adds `REDIS_URL`)
- `backend/src/routes.ts` (health moved to `app.ts`)
- `backend/src/app.ts`, `backend/src/server.ts`
- `backend/src/modules/auth/auth.routes.ts` (Redis-backed `authLimiter`)
- `backend/src/modules/books/book.routes.ts` (search and download limiters)

New files: `backend/src/config/{redis,queues}.ts`, `backend/src/queues/`, `backend/src/workers/`,
`backend/src/services/health.service.ts`, `backend/src/modules/health/`, `backend/src/middleware/rateLimit.ts`,
`backend/src/scripts/verify-foundation.ts`, `database/config.js` (replaces the moved copy), the whole `frontend/`, and the root files.

## 3. Backend dependencies and scripts

```bash
cd backend
npm i ioredis bullmq rate-limit-redis
npm pkg set scripts.worker="tsx src/workers/index.ts" \
            scripts.worker:dev="tsx watch src/workers/index.ts" \
            scripts.start:worker="node dist/workers/index.js" \
            scripts.verify:foundation="tsx src/scripts/verify-foundation.ts"
```

Add to `backend/.env`: `REDIS_URL=redis://localhost:6379` (and keep `CLIENT_URL` pointing at the frontend).

## 4. Frontend, then verify

```bash
cd ../frontend && npm install && cp .env.example .env.local && cd ..
npm run infra:up                      # PostgreSQL, Redis, MinIO
npm run migrate                       # nothing new; confirms ../database is wired up
# three terminals: npm run dev:backend | npm run dev:worker | npm run dev:frontend
npm run verify
```

Then `git init && git add . && git commit -m "Phase 1 foundation"`.
