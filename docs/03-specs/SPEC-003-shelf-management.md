# SPEC-003: Shelf Management

| | |
|---|---|
| **Status** | Implemented |
| **Author** | Engineering |
| **Date** | 2026-09-10 |
| **User stories** | [US-5–US-8](../01-product/USER_STORIES.md#shelf-management) |
| **ADRs referenced** | [ADR-0004](../02-architecture/adr/0004-openlibrary-integration.md) |

## 1. Overview

The core of the product: adding a book (found via [SPEC-002](SPEC-002-book-search-catalog.md))
to one of three shelves, updating reading progress, rating/reviewing on
completion, and removing entries. This spec is where a `Book` row first gets
cached, and where `ShelfEntry` — the central table of the schema — is
governed.

## 2. User stories in scope

- US-5: add to Want to Read / Reading / Read
- US-6: update current page
- US-7: rate and review on finishing
- US-8: remove from shelf

## 3. Assumptions

- "Adding" a book already on the user's shelf **updates** its status rather
  than erroring (see [API_DESIGN.md — idempotency](../02-architecture/API_DESIGN.md#idempotency--upserts)).
  This matches the natural UI action "move this book to Read."
- Setting `status = READ` without an explicit `finishedAt` defaults it to
  "now" server-side — the common case (finishing a book right when you
  update its status) shouldn't require an extra field the user has to think
  about.
- `currentPage` may only be set when `status = READING` or `READ`; setting it
  on a `WANT_TO_READ` entry is rejected (`422`) as a contradiction the UI
  shouldn't allow to reach the API.

## 4. API contract

Full shapes in [`docs/openapi.yaml`](../openapi.yaml). Behavioral notes:

- `POST /api/shelf` — `{ openLibraryId, status }`. If no `Book` row exists
  for `openLibraryId` yet, fetches it from Open Library
  ([SPEC-002](SPEC-002-book-search-catalog.md)) and creates one, then
  upserts the caller's `ShelfEntry`. Returns `201` on first add, `200` on an
  update-via-upsert of an existing entry (same status semantics, different
  status code to let the frontend distinguish "added" from "moved").
- `GET /api/shelf?status=&page=&limit=` — lists the caller's shelf entries,
  optionally filtered by status, each including the joined `Book` data
  needed to render a shelf UI without a second round trip.
- `PATCH /api/shelf/:id` — partial update: any of `status`, `currentPage`,
  `totalPages`, `rating`, `review`. Ownership enforced (404 if the entry
  belongs to another user, per [API_DESIGN.md](../02-architecture/API_DESIGN.md#resource-ownership)).
- `DELETE /api/shelf/:id` — removes the entry. `204`. Does **not** delete the
  underlying `Book` cache row (it may be referenced by other users' shelves).

## 5. Data model impact

Introduces the first writes to `Book` (cache-on-demand) and to `ShelfEntry`,
both as defined in [DATABASE_SCHEMA.md](../02-architecture/DATABASE_SCHEMA.md).
No schema changes beyond what's already specified there.

## 6. Acceptance criteria

- **AC1**: Given a book not yet cached, when adding it to a shelf, then a
  `Book` row is created from Open Library data and a `ShelfEntry` links it
  to the caller.
  → `backend/tests/shelf.test.ts`
- **AC2**: Given a book already on the caller's shelf, when adding it again
  with a different status, then the existing `ShelfEntry` is updated in
  place (no duplicate row), per the unique `(userId, bookId)` constraint.
  → `backend/tests/shelf.test.ts`
- **AC3**: Given a `ShelfEntry` owned by another user, when the caller
  attempts to `PATCH` or `DELETE` it by id, then the API returns `404`.
  → `backend/tests/shelf.test.ts`
- **AC4**: Given a `ShelfEntry` with `status=WANT_TO_READ`, when attempting
  to `PATCH currentPage`, then the API returns `422`.
  → `backend/tests/shelf.test.ts`
- **AC5**: Given a `ShelfEntry`, when `PATCH`ing `status` to `READ` without
  `finishedAt`, then `finishedAt` is set to the current server time.
  → `backend/tests/shelf.test.ts`

## 7. Edge cases

- `rating` outside 1–5: rejected (`422`) by `shelf.schema.ts`.
- `currentPage > totalPages`: rejected (`422`) — an obvious data-entry error
  worth catching at the boundary rather than silently storing.
- Deleting a `ShelfEntry` that doesn't exist: `404`, not `204` — we don't
  treat "already gone" as success for an explicit delete-by-id, so a client
  bug (double-submit) surfaces instead of being silently swallowed.

## 8. Non-goals for this spec

- Multiple custom shelves beyond the three fixed statuses (see
  [PRD scope](../01-product/PRD.md#5-scope-for-v1-this-repository)).
- Bulk operations (e.g., bulk status change across many books).

## 9. Open questions

None blocking.
