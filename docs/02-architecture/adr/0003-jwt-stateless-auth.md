# ADR-0003: Stateless JWT auth (access + refresh), not server-side sessions

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-10 |
| **Deciders** | Engineering |

## Context

We need to authenticate requests from the SPA to the API and keep users
logged in across visits, per [US-2](../../01-product/USER_STORIES.md#authentication).

## Decision

Short-lived JWT access tokens (15 min), returned in the response body and
held in memory by the SPA, plus a longer-lived refresh token (7 days) stored
in an httpOnly, `Secure`, `SameSite=Strict` cookie, exchanged via
`POST /api/auth/refresh` for a new access token. No server-side session
store.

## Alternatives considered

- **Server-side sessions (session id in a cookie, session store in
  Postgres/Redis)** — simpler revocation story (delete the session row) and
  no token-expiry UX to design around. Rejected for this project's scope: it
  adds a stateful store and a session-cleanup concern for a single-instance
  reference app with no current multi-service consumer of the API. The
  stateless approach also better demonstrates the JWT pattern this repo is
  meant to be a reference for.
- **Long-lived access token only, no refresh token** — simpler, but means
  either a long-lived token with a large blast radius if leaked, or forcing
  frequent re-logins. Rejected on security grounds.
- **Storing the access token in localStorage** — rejected: readable by any
  script on the page, meaningfully worse XSS blast radius than an in-memory
  value. See [SECURITY.md](../../04-engineering/SECURITY.md#token-storage).

## Consequences

- The API stays horizontally scalable with zero shared session state — any
  instance can validate any request.
- Logout is client-side (discard the in-memory token, clear the refresh
  cookie) plus a server-side cookie-clear; there is **no server-side token
  revocation** before natural expiry. Accepted for this project's scope;
  a real deployment handling sensitive data would add a revocation list
  (e.g., a short-lived denylist keyed by token `jti`) — noted here so it
  isn't mistaken for an oversight.
- Access-token expiry (15 min) means the frontend must handle silent refresh
  (`AuthContext` in `frontend/src/context/AuthContext.tsx`) — this is
  meaningfully more frontend complexity than a cookie-session model would be.

## Revisit when

A requirement for server-side "log out everywhere" or immediate credential
revocation appears — at that point, add a minimal revocation store (a table
of invalidated `jti`s with TTL cleanup) rather than switching auth models
wholesale.
