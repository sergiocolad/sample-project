# SPEC-004: Reading Stats Dashboard

| | |
|---|---|
| **Status** | Implemented |
| **Author** | Engineering |
| **Date** | 2026-09-10 |
| **User stories** | [US-9, US-10](../01-product/USER_STORIES.md#stats) |
| **ADRs referenced** | none beyond those already governing `ShelfEntry` |

## 1. Overview

A single endpoint aggregating the caller's `ShelfEntry` data into the numbers
that matter to a goal-oriented reader: books and pages finished (this year
and all-time), and a rating distribution — computed on read, not maintained
as a separately-updated denormalized counter.

## 2. User stories in scope

- US-9: books/pages finished this year
- US-10: rating distribution

## 3. Assumptions

- Stats are computed on-demand via a single aggregating query, not
  precomputed/cached. At the data volume of one user's personal shelf
  (tens to low thousands of rows), this is fast enough that a caching layer
  would be premature — see the top-level engineering principle against
  designing for hypothetical scale.
- "This year" means the calendar year of `finishedAt` in the server's
  configured timezone (UTC) — not the user's local timezone. Acceptable
  simplification for v1; noted explicitly so it isn't mistaken for a bug.
- Books with `status != READ` don't count toward "finished" metrics but do
  count toward a separate `currentlyReading` count, since a goal-setter
  cares about both.

## 4. API contract

Full shape in [`docs/openapi.yaml`](../openapi.yaml). Behavioral notes:

- `GET /api/stats` — requires auth, scoped to the caller, no parameters.
  Returns:
  ```json
  {
    "booksReadThisYear": 12,
    "booksReadAllTime": 47,
    "pagesReadThisYear": 3210,
    "currentlyReading": 2,
    "ratingDistribution": { "1": 0, "2": 1, "3": 5, "4": 14, "5": 8 }
  }
  ```
- `pagesReadThisYear` sums `totalPages` for entries with `status=READ` and
  `finishedAt` in the current year. It uses `totalPages` (the book's full
  length once finished), not `currentPage`, per the definition of "pages
  *read*" implying completion — an in-progress book's partial pages aren't
  counted toward this total, avoiding a stat that fluctuates confusingly as
  progress updates.

## 5. Data model impact

None — pure read/aggregation over `ShelfEntry`. No new tables or columns.

## 6. Acceptance criteria

- **AC1**: Given a user with books marked `READ` in the current and prior
  years, when calling `GET /api/stats`, then `booksReadThisYear` counts only
  entries with `finishedAt` in the current year, while `booksReadAllTime`
  counts all `READ` entries regardless of year.
  → `backend/tests/stats.test.ts`
- **AC2**: Given a user with rated books, when calling `GET /api/stats`,
  then `ratingDistribution` includes a key for every rating 1–5 (zero-filled
  if unused), not only ratings that occurred.
  → `backend/tests/stats.test.ts`
- **AC3**: Given a user with no shelf entries at all, when calling
  `GET /api/stats`, then the API returns all-zero stats, not an error.
  → `backend/tests/stats.test.ts`

## 7. Edge cases

- A `READ` entry with `totalPages` unset (user never filled it in): excluded
  from `pagesReadThisYear`'s sum (treated as 0 contribution, not a stats
  error), but still counted in `booksReadThisYear`.
- Timezone boundary (a book finished at 23:50 UTC on Dec 31 local time):
  accepted known simplification per [Assumptions](#3-assumptions).

## 8. Non-goals for this spec

- Historical trend charts (reading pace over months) — v1 is snapshot stats
  only, per [PRD scope](../01-product/PRD.md#5-scope-for-v1-this-repository).
- Configurable/custom date ranges.
- Reading goals or progress-against-goal (explicit PRD non-goal).

## 9. Open questions

None blocking.
