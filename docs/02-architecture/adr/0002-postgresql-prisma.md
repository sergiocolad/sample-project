# ADR-0002: PostgreSQL with Prisma ORM

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-10 |
| **Deciders** | Engineering |

## Context

The data model ([DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)) is fully
relational: users own shelf entries, shelf entries reference cached books,
and stats are computed via aggregation over that relationship. We need a
database and a data-access layer.

## Decision

PostgreSQL 16 as the database; Prisma as the ORM and migration tool.

## Alternatives considered

- **MongoDB / a document store** — rejected. The domain has real relations
  and a uniqueness constraint that spans two foreign keys
  (`(userId, bookId)` on `ShelfEntry`); modeling that in a document store
  means reimplementing relational integrity in application code for no
  benefit, since there's no schema-flexibility requirement here (every
  `ShelfEntry` has the same shape).
- **Raw SQL / a query builder (Knex, Kysely)** — would give more control over
  generated queries, at the cost of hand-writing migrations and losing
  generated TypeScript types for every model. For this project's complexity,
  Prisma's generated client (compile-time-checked queries matching
  `schema.prisma`) outweighs the control tradeoff. Revisit if a query's
  performance ever requires hand-tuned SQL Prisma can't express — Prisma
  supports raw queries as an escape hatch for exactly that case.
- **SQLite** — simplest for a demo, rejected because it doesn't reflect a
  production topology (this repo is a reference for real practice, including
  running Postgres via Docker Compose in local dev — see
  [DEPLOYMENT.md](../../05-operations/DEPLOYMENT.md)).

## Consequences

- Schema changes are explicit, reviewable migration files
  (`backend/prisma/migrations/`), not implicit/ad-hoc.
- The Prisma client gives compile-time type safety from the database schema
  through to service code — a renamed column is a TypeScript error, not a
  runtime surprise.
- Adds a build-time codegen step (`prisma generate`) that must run after
  `npm install` and after any schema change — wired into `postinstall` and
  documented in `backend/README.md` so it isn't a footgun for a fresh clone.
- Ties the project to Prisma's query capabilities; sufficiently complex
  reporting queries may eventually need `$queryRaw`.

## Revisit when

A query pattern emerges that Prisma's client API can't express efficiently
and `$queryRaw` stops feeling like an escape hatch and starts feeling like
the norm — at that point, a query-builder migration for the affected module
(not necessarily the whole app) is worth an ADR of its own.
