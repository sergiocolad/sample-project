# Shelfie — Backend

Express + TypeScript API. See the root [README.md](../README.md) for the
full project overview and [`docs/`](../docs/) for architecture, specs, and
API contract.

## Structure

```
src/
├── config/env.ts          # env parsing/validation — single source for config
├── lib/prisma.ts          # shared Prisma client
├── middleware/            # auth guard, central error handler
├── modules/
│   ├── auth/               # register, login, refresh, logout, me
│   ├── books/               # Open Library search/detail (openLibrary.client.ts)
│   ├── shelf/               # add/list/update/remove shelf entries
│   └── stats/               # aggregate reading stats
├── app.ts                  # Express app assembly
└── index.ts                 # process entry point
prisma/
├── schema.prisma           # data model — see docs/02-architecture/DATABASE_SCHEMA.md
└── seed.ts                 # demo user + books for local dev
tests/                       # Vitest + Supertest integration tests, one file per module
```

Each module follows routes → controller → service → schema. See
[docs/04-engineering/CODING_STANDARDS.md](../docs/04-engineering/CODING_STANDARDS.md#backend-backend).

## Setup

```bash
cp .env.example .env   # adjust DATABASE_URL if not using Docker
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Demo login after seeding: `demo@shelfie.dev` / `password123`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` / `npm start` | Compile then run the production build |
| `npm run lint` / `npm run typecheck` | Quality gates — see `docs/04-engineering/CI_CD.md` |
| `npm test` / `npm run test:watch` | Vitest integration + unit suite |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:migrate:deploy` | Apply pending migrations (production-style, no prompt) |
| `npm run db:seed` | Populate demo data |
| `npm run db:reset` | Drop, recreate, migrate, and reseed (destructive, local only) |

## Testing

Requires a real Postgres reachable via `DATABASE_URL` (the test suite
truncates tables between tests rather than mocking the database — see
[docs/04-engineering/TESTING_STRATEGY.md](../docs/04-engineering/TESTING_STRATEGY.md)).
The Open Library client is mocked; no network calls happen in tests.

```bash
npm test
```
