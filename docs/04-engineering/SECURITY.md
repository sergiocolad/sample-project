# Security

| | |
|---|---|
| **Scope** | This reference application's own code, config, and dependencies |
| **Related** | [ADR-0003](../02-architecture/adr/0003-jwt-stateless-auth.md) · [SPEC-001](../03-specs/SPEC-001-user-authentication.md) |

## Threat model (summary)

This is a personal reading-tracker with no payment data, no PII beyond
email/name, and no admin/multi-tenant surface. The realistic threats are:
credential compromise (weak passwords, token theft via XSS), unauthorized
cross-user data access (IDOR on shelf entries), and dependency
vulnerabilities. It is explicitly **not** designed against threats out of
scope for its purpose (DDoS resilience, nation-state actors, physical
security) — a reference project doesn't need a threat model sized for a
bank.

## Authentication

- Passwords hashed with bcrypt (cost factor 12), never logged, never
  returned in any API response.
- Login failures are indistinguishable between "no such email" and "wrong
  password" — see [SPEC-001 AC4](../03-specs/SPEC-001-user-authentication.md#6-acceptance-criteria) —
  to prevent account enumeration.
- See [ADR-0003](../02-architecture/adr/0003-jwt-stateless-auth.md) for the
  full token model and its explicitly accepted limitation (no server-side
  revocation before natural expiry).

## Token storage

Access tokens live **only in memory** on the frontend (React state/context),
never in `localStorage` or a non-httpOnly cookie — this bounds the damage a
successful XSS could do (no persistent token to steal, only whatever's live
in memory during the attack window). The refresh token is `HttpOnly`,
`Secure`, `SameSite=Strict`, unreadable by any JavaScript, mitigating theft
via XSS entirely (though not CSRF — `SameSite=Strict` is the mitigation for
that, since the refresh endpoint has no other side-effect-free reason to be
called cross-site).

## Authorization

Every `/api/shelf/*` query filters by `req.user.id` derived from the verified
JWT — never from a client-supplied field. This is enforced per-query in
`shelf.service.ts`, not by a single upstream check, to prevent a future new
endpoint from accidentally forgetting the scope filter. See
[API_DESIGN.md — resource ownership](../02-architecture/API_DESIGN.md#resource-ownership).

## Input validation

All external input (HTTP request bodies/params/query, and normalized
third-party API responses) is validated with Zod at the boundary before it
reaches business logic — see [CODING_STANDARDS.md](CODING_STANDARDS.md#backend-backend).
This is the primary defense against injection-class bugs; Prisma's
parameterized queries are the defense against SQL injection specifically
(no raw string-concatenated SQL anywhere in this codebase).

## Secrets management

- `.env` files are gitignored; `.env.example` documents every required
  variable with a placeholder, never a real value.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` must be set to high-entropy
  values in any real deployment — the `.env.example` placeholder is
  explicitly invalid (`changeme_in_production`) so it fails loudly if
  someone forgets to replace it in a non-local environment (validated in
  `src/config/env.ts`).
- No third-party API key is required for the Open Library integration (see
  [ADR-0004](../02-architecture/adr/0004-openlibrary-integration.md)), which
  removes an entire class of "leaked API key" risk from this project.

## Dependency hygiene

- Dependabot (GitHub repository setting, not a file in this repo) is the
  intended mechanism for dependency-vulnerability alerts — see
  [CI_CD.md](CI_CD.md#what-ci-does-not-do-by-design-for-this-reference-project).
- `npm audit` is not wired into CI as a hard gate in v1 (it produces enough
  noise on transitive dependencies to cause alert fatigue at this project's
  size); Dependabot's curated alerts are the chosen signal instead.

## Reporting

This is a reference/sample project with no production deployment or user
data at stake. If you fork this for real use, replace this section with an
actual disclosure process (e.g., a `SECURITY.md` contact and response SLA)
before accepting real user data.
