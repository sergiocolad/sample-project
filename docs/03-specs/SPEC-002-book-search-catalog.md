# SPEC-002: Book Search & Catalog

| | |
|---|---|
| **Status** | Implemented |
| **Author** | Engineering |
| **Date** | 2026-09-10 |
| **User stories** | [US-3, US-4](../01-product/USER_STORIES.md#book-discovery) |
| **ADRs referenced** | [ADR-0004](../02-architecture/adr/0004-openlibrary-integration.md) |

## 1. Overview

Lets a logged-in user search for a book by title/author and see enough detail
(cover, author, publish year) to confidently pick the right edition to shelve,
without Shelfie maintaining its own book database.

## 2. User stories in scope

- US-3: search by title or author
- US-4: see cover art and basic details before adding

## 3. Assumptions

- We surface Open Library's top matches as-is (relevance-ordered by their
  API); we do not re-rank results ourselves. Re-ranking would require
  understanding Open Library's relevance signals in more depth than this
  project's scope justifies.
- We query Open Library's **work**-level search (not per-edition), since a
  user thinks in terms of "the book," not a specific print edition — this
  determines `openLibraryId` = Open Library **work key** (e.g. `OL27448W`),
  consistently used as the cache key in `Book` (see
  [DATABASE_SCHEMA.md](../02-architecture/DATABASE_SCHEMA.md#book)).

## 4. API contract

Full shapes in [`docs/openapi.yaml`](../openapi.yaml). Behavioral notes:

- `GET /api/books/search?q=<query>&page=&limit=` — requires auth (search
  itself has no per-user data, but keeping it behind auth avoids exposing an
  open, unauthenticated proxy to a third-party API from our infrastructure).
  Proxies Open Library's search endpoint, normalizes the response to our own
  shape (`{ openLibraryId, title, author, coverUrl, publishedYear }`), and
  does **not** persist anything — caching into `Book` only happens on
  add-to-shelf (see [SPEC-003](SPEC-003-shelf-management.md)).
- `GET /api/books/:openLibraryId` — fetches a single work's detail (used for
  a book detail view), normalized the same way. `404` if Open Library has no
  such work.
- Both endpoints return `502 UPSTREAM_ERROR` (never a raw proxy of Open
  Library's error body) if the upstream call times out or errors, per
  [API_DESIGN.md](../02-architecture/API_DESIGN.md#error-shape).

## 5. Data model impact

None directly — see [SPEC-003](SPEC-003-shelf-management.md) for when a
`Book` row is actually created.

## 6. Acceptance criteria

- **AC1**: Given a search query matching real books, when calling
  `GET /api/books/search`, then the response contains normalized results
  with `title`, `author`, and `coverUrl` (when Open Library has cover art).
  → `backend/tests/books.test.ts`
- **AC2**: Given Open Library times out or returns a 5xx, when calling
  either books endpoint, then the API returns `502 UPSTREAM_ERROR` within
  the configured timeout (5s), not a hung request.
  → `backend/tests/books.test.ts`
- **AC3**: Given a query with no results, when searching, then the API
  returns `200` with an empty `data` array, not an error.
  → `backend/tests/books.test.ts`

## 7. Edge cases

- Missing cover art: `coverUrl` is `null`; the frontend renders a placeholder
  (`frontend/src/components/BookCard.tsx`), never a broken image.
- Query shorter than 2 characters: rejected client-side and server-side
  (`422`) to avoid firing overly broad searches at the upstream API.
- Duplicate works in results (Open Library occasionally returns near-duplicate
  work entries for the same book): not de-duplicated in v1 — acceptable
  cosmetic noise, not a correctness issue, given the scope of this project.

## 8. Non-goals for this spec

- Full-text search across our own cached `Book` table (search always hits
  Open Library live; our cache is for shelved books only, per
  [ADR-0004](../02-architecture/adr/0004-openlibrary-integration.md)).
- Filtering/faceting (by genre, language, etc.) — Open Library's basic search
  API doesn't cleanly support it, and no user story requires it yet.

## 9. Open questions

None blocking.
