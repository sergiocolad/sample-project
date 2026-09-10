# Testing Strategy

| | |
|---|---|
| **Backend tooling** | Vitest + Supertest |
| **Frontend tooling** | Vitest + React Testing Library |
| **Related** | [CI_CD.md](CI_CD.md) |

## Philosophy

Every acceptance criterion in `docs/03-specs/*` maps to at least one
automated test. A spec whose acceptance criteria aren't covered by a test is
not "done" per [CLAUDE.md §6](../../CLAUDE.md#6-quality-gates-an-agent-must-satisfy-before-calling-a-task-done),
even if it works when manually clicked through once.

We test at the layer where a bug would actually be introduced, and no
higher — this keeps the suite fast and its failures meaningful.

## Backend

| Layer | Tool | What it covers | Where |
|---|---|---|---|
| Integration (route → DB) | Vitest + Supertest, real test Postgres | Full request/response cycle per endpoint: auth, validation, ownership, error shapes | `backend/tests/*.test.ts` |
| Unit (service logic) | Vitest | Pure business logic not worth a full HTTP round trip (e.g., stats aggregation math) | colocated `*.spec.ts` next to the service, where logic is non-trivial enough to warrant isolation |

**Why integration-first for the backend, not unit-per-layer:** the value in
this API is almost entirely in the *wiring* — does validation actually run
before the service, does ownership actually get enforced, does the error
handler actually produce the documented shape. Unit-testing a controller in
isolation with mocked services would verify the mock, not the system. We
unit-test only logic complex enough that an integration test would obscure
*which* branch failed (see `stats.service` aggregation math).

The Open Library client (`openLibrary.client.ts`) is mocked at the HTTP layer
in tests (not hitting the real third-party API in CI) — see
[CI_CD.md](CI_CD.md#external-dependencies-in-ci) for why.

Test database: a separate `shelfie_test` Postgres database (see
`backend/.env.example`), reset via Prisma migration reset between test runs.

## Frontend

| Layer | Tool | What it covers |
|---|---|---|
| Component | React Testing Library | Rendering, user interaction, and API-call assertions per component/page — queried by role/label, not implementation detail (no snapshot tests, no testing internal state) |

API calls in component tests are mocked at the `src/api/*.ts` module
boundary (Vitest `vi.mock`), not at the network layer — this keeps tests fast
and decoupled from request/response wire format details already covered by
backend integration tests.

We do not maintain a separate end-to-end (Playwright/Cypress) suite in this
reference project — the combination of backend integration tests (proving
the API honors its contract) and frontend component tests (proving the UI
correctly calls that contract and renders its results) covers the risk
surface at this project's size without the added CI time and flakiness
budget a full E2E suite requires. **Revisit this if the app grows a
multi-step flow that can't be meaningfully verified at either layer alone**
(e.g., a real payment flow) — that would justify a small, targeted E2E suite,
not a wholesale one.

## What we deliberately don't test

- Third-party library internals (React, Express, Prisma themselves).
- Purely presentational styling (Tailwind class correctness) — a visual
  regression tool would be the right investment if this mattered at scale;
  out of scope here.
- Generated Prisma client code.

## Running

```bash
cd backend && npm test          # integration + unit
cd backend && npm run test:watch
cd frontend && npm test
```

CI runs both suites on every PR — see [CI_CD.md](CI_CD.md).
