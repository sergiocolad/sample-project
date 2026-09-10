# SPEC-001: User Authentication

| | |
|---|---|
| **Status** | Implemented |
| **Author** | Engineering |
| **Date** | 2026-09-10 |
| **User stories** | [US-1, US-2](../01-product/USER_STORIES.md#authentication) |
| **ADRs referenced** | [ADR-0003](../02-architecture/adr/0003-jwt-stateless-auth.md) |

## 1. Overview

Email/password registration and login, issuing a short-lived JWT access
token plus an httpOnly-cookie refresh token, so a user's shelf data is
private and their session survives across visits without re-entering
credentials every 15 minutes.

## 2. User stories in scope

- US-1: register with email + password
- US-2: log in and remain logged in across sessions

## 3. Assumptions

- Email verification (confirming the address is real) is **not** required
  for v1 — this is a personal-use tool, not a system sending transactional
  email to third parties. Explicitly a non-goal here, not an oversight.
- Password reset via email is out of scope for v1 (no email-sending
  infrastructure exists yet in this project) — a user who forgets their
  password re-registers, or (in later iterations) this spec gets extended
  once an email provider is chosen (would need its own ADR).

## 4. API contract

Full shapes in [`docs/openapi.yaml`](../openapi.yaml). Behavioral notes:

- `POST /api/auth/register` — `{ email, password, name }` → `201` with
  `{ user, accessToken }` and sets the refresh cookie. Returns `409 CONFLICT`
  if the email is already registered. Password minimum 8 characters,
  enforced by `auth.schema.ts`, not just client-side.
- `POST /api/auth/login` — `{ email, password }` → `200` with
  `{ user, accessToken }` and sets the refresh cookie. Returns `401` for any
  failure reason (wrong email *or* wrong password) — **never** reveal which
  field was wrong (see [SECURITY.md](../04-engineering/SECURITY.md#authentication)).
- `POST /api/auth/refresh` — no body, reads the refresh cookie → `200` with a
  new `{ accessToken }` and a rotated refresh cookie. `401` if missing/invalid/
  expired, which the frontend treats as "log out."
- `POST /api/auth/logout` — clears the refresh cookie server-side. `204`.
- `GET /api/auth/me` — requires a valid access token → `200` with the current
  `user` object. This is how the SPA restores session state on page load.

## 5. Data model impact

Uses `User` as defined in [DATABASE_SCHEMA.md](../02-architecture/DATABASE_SCHEMA.md#user).
No new tables. `passwordHash` via bcrypt (cost factor 12).

## 6. Acceptance criteria

- **AC1**: Given a new email, when registering with a valid password (≥8
  chars), then a `User` row is created, a `201` is returned with an access
  token, and the password is never present in the response body.
  → `backend/tests/auth.test.ts`
- **AC2**: Given an already-registered email, when registering again, then
  the API returns `409 CONFLICT` and no new row is created.
  → `backend/tests/auth.test.ts`
- **AC3**: Given valid credentials, when logging in, then the API returns a
  fresh access token and sets a refresh cookie with `HttpOnly`, `Secure`,
  and `SameSite=Strict` attributes.
  → `backend/tests/auth.test.ts`
- **AC4**: Given wrong credentials (bad email or bad password), when logging
  in, then the API returns `401` with an identical, generic error message in
  both cases.
  → `backend/tests/auth.test.ts`
- **AC5**: Given a request to any `/api/shelf/*` route without a valid
  access token, when the request is made, then the API returns `401` before
  any business logic runs.
  → `backend/tests/shelf.test.ts`

## 7. Edge cases

- Expired access token with a valid refresh cookie: frontend transparently
  calls `/api/auth/refresh` once and retries the original request
  (`frontend/src/api/client.ts` interceptor); a second failure logs the user
  out client-side.
- Refresh token reuse after logout: the cookie is cleared server-side on
  logout; a cleared cookie simply isn't sent, so this reduces to the
  "missing cookie" case, not a distinct revocation check (see
  [ADR-0003 consequences](../02-architecture/adr/0003-jwt-stateless-auth.md#consequences)
  for what this does *not* protect against).
- Case sensitivity: emails are lowercased and trimmed before lookup/storage
  to avoid `User@x.com` and `user@x.com` being treated as different accounts.

## 8. Non-goals for this spec

- OAuth/social login (see [ADR-0005](../02-architecture/adr/0005-react-vite-frontend.md)
  scope note and [PRD](../01-product/PRD.md#5-scope-for-v1-this-repository)).
- Multi-factor authentication.
- Account deletion/data export flows.

## 9. Open questions

None blocking.
