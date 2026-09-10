# ADR-0004: Open Library as the external book catalog, proxied and cached

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-10 |
| **Deciders** | Engineering |

## Context

The product needs a real book catalog for search ([US-3](../../01-product/USER_STORIES.md#book-discovery))
without maintaining our own. We need to pick a provider and decide how deep
our own system depends on it.

## Decision

Use the [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
and [Covers API](https://openlibrary.org/dev/docs/api/covers) as the book
catalog. All calls to it happen server-side, inside
`backend/src/modules/books/openLibrary.client.ts` — never directly from the
browser. The first time a search result is added to a shelf, we persist a
`Book` row keyed by the Open Library work id (`openLibraryId`), so our own
data is not permanently coupled to Open Library's availability (see
[DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md#book)).

## Alternatives considered

- **Google Books API** — comparable coverage, but requires an API key and has
  stricter default quotas for unauthenticated use. Rejected specifically so
  this reference project runs with **zero required secrets** for its core
  feature — a meaningful property for a sample/teaching repo (anyone can
  `git clone` and `docker compose up` with no signup step).
- **ISBNdb / a paid catalog API** — better data quality and licensing clarity
  for commercial use, rejected on cost and the same key-requirement grounds
  for this project's purpose.
- **Calling Open Library directly from the browser (no backend proxy)** —
  rejected: it would leak the third-party dependency into the frontend's
  error handling, prevent caching in `Book`, and hit CORS/rate-limit
  exposure per end user rather than per server. See
  [ARCHITECTURE.md](../ARCHITECTURE.md#2-c4--container-view) for the resulting
  container shape.

## Consequences

- Zero-config onboarding: no API key to request, configure, or accidentally
  commit.
- Our error handling must explicitly translate Open Library failures
  (timeout, 5xx, malformed payload) into our own `502 UPSTREAM_ERROR` shape
  (see [API_DESIGN.md](../API_DESIGN.md#error-shape)) rather than leaking
  their response format to the frontend.
- Cached `Book` metadata can drift from Open Library's current data (a
  corrected title, a changed cover). Accepted tradeoff — there is no
  background refresh job in v1. A user re-searching and re-adding the same
  book would still see fresh search results even though the cached row
  underlying their existing shelf entry is untouched.
- Open Library has no formal SLA. For this project's purpose (a reference
  app, not a paying-customer product), that's acceptable; it would not be
  for a commercial product at scale.

## Revisit when

This ever became a real product with paying users depending on catalog
completeness or an SLA — at that point, re-evaluate a licensed provider and
budget for the API key/quota management this decision currently avoids.
