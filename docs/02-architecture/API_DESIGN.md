# API Design

| | |
|---|---|
| **Style** | REST over HTTPS, JSON |
| **Contract** | [`docs/openapi.yaml`](../openapi.yaml) (source of truth for shapes) |
| **Related** | [ARCHITECTURE.md](ARCHITECTURE.md) · [SECURITY.md](../04-engineering/SECURITY.md) |

This document covers *conventions* that apply across the whole API. Per-endpoint
request/response shapes live in the OpenAPI contract and in each feature's spec.

## Base path & versioning

All endpoints are mounted under `/api`. There is no `/v1` prefix yet — with a
single consumer (the bundled SPA) and no external integrators, a version
prefix would be speculative. **The first breaking change to a shipped
endpoint is what triggers introducing `/api/v2`**, per endpoint, not a
wholesale API version bump. Record that decision as an ADR when it happens.

## Authentication

- `Authorization: Bearer <accessToken>` header on every route except
  `POST /api/auth/register` and `POST /api/auth/login`.
- Access tokens are short-lived (15 min); `POST /api/auth/refresh` exchanges a
  valid refresh token (httpOnly cookie) for a new access token.
- See [ADR-0003](adr/0003-jwt-stateless-auth.md) and
  [SPEC-001](../03-specs/SPEC-001-user-authentication.md) for the full model.

## Resource ownership

Every resource under `/api/shelf/*` is implicitly scoped to
`req.user.id` (derived from the verified JWT, never from a request body or
query param). A `ShelfEntry` belonging to another user returns `404`, not
`403` — we do not confirm the existence of another user's resource to an
unauthorized caller.

## Request validation

Every route validates its input with a Zod schema (`modules/*/*.schema.ts`)
before the controller runs. A validation failure returns `422` with a
field-level breakdown (see [Error shape](#error-shape)) — never a `500` or an
unhandled exception.

## Error shape

Every error response, regardless of status code, has this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [
      { "field": "email", "issue": "Invalid email address" }
    ]
  }
}
```

`details` is omitted when not applicable. Standard `code` values:

| HTTP status | `code` | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request (e.g., invalid JSON) |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 404 | `NOT_FOUND` | Resource doesn't exist or isn't owned by caller |
| 409 | `CONFLICT` | e.g., email already registered |
| 422 | `VALIDATION_ERROR` | Input failed schema validation |
| 502 | `UPSTREAM_ERROR` | Open Library unavailable/errored |
| 500 | `INTERNAL_ERROR` | Unhandled — always logged with a correlation id |

This is implemented once, centrally, in `backend/src/middleware/errorHandler.ts`
via a typed `ApiError` class — individual routes throw `ApiError`, they don't
construct response bodies themselves.

## Pagination

List endpoints (`GET /api/shelf`, `GET /api/books/search`) use simple
offset-based pagination via `?page=1&limit=20` (default `limit=20`, max `100`).
Response envelope:

```json
{ "data": [ /* items */ ], "meta": { "page": 1, "limit": 20, "total": 57 } }
```

Cursor-based pagination is deliberately not used here — the scale (a single
user's shelf, a search page a human is skimming) doesn't warrant it. Revisit
if `Book` search results ever need deep pagination.

## Idempotency & upserts

`POST /api/shelf` on a book already on the caller's shelf **updates** the
existing entry (status change) rather than erroring or duplicating — this
matches the unique `(userId, bookId)` constraint in
[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#constraints--indexes) and the user's
mental model ("move this book to Read"), and is documented explicitly in
[SPEC-003](../03-specs/SPEC-003-shelf-management.md).

## What's out of scope for v1

- Rate limiting on our own API (not needed at this scale; would be an nginx/
  gateway concern before an application concern if this were deployed for
  real — see [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md)).
- Webhooks / server-sent events. No use case in this product yet.
- GraphQL. REST fits the resource shapes here; no over-fetching problem to solve.
