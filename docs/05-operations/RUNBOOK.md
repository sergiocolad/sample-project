# Runbook

Operational guidance for local/reference use of this project. Written as if
this were a real on-call runbook, since that's the discipline this repo
exists to demonstrate — even though there is no live environment behind it
today (see [DEPLOYMENT.md](DEPLOYMENT.md)).

## "The backend container won't start"

1. Check logs: `docker compose logs backend`.
2. Most common cause: `db` isn't ready yet when `backend` tries to migrate.
   The `backend` service's compose healthcheck-dependency (`depends_on` with
   `condition: service_healthy` on `db`) should prevent this — if it still
   happens, confirm `db`'s healthcheck is passing: `docker compose ps`.
3. Second most common cause: a stale `DATABASE_URL` in `.env` not matching
   the `db` service name/credentials in `docker-compose.yml`.

## "Migrations fail with a drift error"

Prisma detected the database schema doesn't match migration history —
usually from manually editing the database or from mixing dev environments.

```bash
# Local dev only — destructive, recreates the database from migrations:
cd backend && npx prisma migrate reset
```

**Never run `migrate reset` against a database with real user data.** In a
real production incident, the fix is to write a corrective migration that
reconciles the drift, not to reset — see
[DEPLOYMENT.md](DEPLOYMENT.md#target-production-topology-not-implemented-here--described-for-reference)
for why migrations are a deliberate release step, not an on-boot action, in
a real deployment.

## "Book search returns 502s"

This is the documented, expected shape when Open Library is unavailable or
slow (see [ADR-0004](../02-architecture/adr/0004-openlibrary-integration.md)
and [API_DESIGN.md](../02-architecture/API_DESIGN.md#error-shape)) — not a
bug in this codebase by default.

1. Confirm it's upstream, not us: `curl -s -o /dev/null -w "%{http_code}\n"
   https://openlibrary.org/search.json?q=test`.
2. If Open Library itself is down, there is no client-side mitigation beyond
   what already exists: previously-shelved books are unaffected (served from
   the cached `Book` table), only *new* searches/adds degrade.
3. If our own backend is timing out well before Open Library actually would
   (check the configured timeout in `openLibrary.client.ts`), that's a bug —
   file it against [SPEC-002](../03-specs/SPEC-002-book-search-catalog.md).

## "A user reports seeing another user's books"

This would be a critical authorization bug — see
[SECURITY.md — authorization](../04-engineering/SECURITY.md#authorization).

1. Reproduce with two test accounts locally.
2. Check every query in `shelf.service.ts` filters by `userId` — this is the
   single invariant [SPEC-003 AC3](../03-specs/SPEC-003-shelf-management.md#6-acceptance-criteria)
   exists to guarantee. If a new endpoint was added without this filter,
   that's the bug.
3. This is a stop-the-line severity issue, not a normal bug-triage item — see
   [CODING_STANDARDS.md — review checklist](../04-engineering/CODING_STANDARDS.md#review-checklist)
   for why this specific class of bug is called out explicitly there.

## "Someone forgot their password"

By design (see [SPEC-001 §3](../03-specs/SPEC-001-user-authentication.md#3-assumptions)),
there is no password-reset flow in v1. The only local-dev workaround is
re-registering with a different email, or directly updating `passwordHash`
in the database for a test account. This is not an acceptable answer for a
real deployment with real users — see the note in SPEC-001 about what adding
password reset would require (an email provider decision, meriting its own
ADR).
