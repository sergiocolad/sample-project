# Coding Standards

These are enforced by CI where automatable (`npm run lint`, `npm run
typecheck`) and by review where they aren't. See [CLAUDE.md](../../CLAUDE.md#4-non-negotiable-conventions)
for the short version.

## General

- **TypeScript strict mode** in both packages (`"strict": true` in
  `tsconfig.json`). No implicit `any`.
- **No default exports** for anything except React page/App components and
  Vite config files — named exports make refactors and IDE navigation
  predictable.
- **Prefer explicit return types** on exported functions. Inference is fine
  for local variables and internal helpers.
- **No commented-out code.** Delete it — git history is the record, not a
  code comment.

## Backend (`backend/`)

- **Vertical module structure.** Each feature under `src/modules/<name>/`
  owns its `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.schema.ts`.
  Do not introduce a global `controllers/`, `services/`, or `routes/`
  directory — that's a horizontal-layer structure this project deliberately
  avoids (see [ARCHITECTURE.md §3](../02-architecture/ARCHITECTURE.md#3-component-view--api)).
- **Controllers are thin.** A controller: validates via the module's schema
  (or trusts middleware that already did), calls exactly one service method,
  maps the result to an HTTP response. No business logic in a controller.
- **Services are framework-agnostic.** A service function must be callable
  and testable without an Express `Request`/`Response` in scope. If a
  service "needs" `req`, that's a sign the needed value should be a plain
  parameter instead.
- **All I/O errors become `ApiError`.** Services/clients that call Prisma or
  an external API catch and rethrow as a typed `ApiError` (`src/utils/apiError.ts`)
  with the right `code` — never let a raw Prisma or Axios error reach the
  central error handler undecorated, or the response shape in
  [API_DESIGN.md](../02-architecture/API_DESIGN.md#error-shape) breaks.
- **Environment access only through `src/config/env.ts`.** No `process.env.X`
  scattered through the codebase — one module parses and validates all of it
  at boot (via Zod), so a missing/malformed env var fails fast and loudly
  instead of surfacing as `undefined` three layers deep at request time.

## Frontend (`frontend/`)

- **Server state via TanStack Query; client state via Context/`useState`.**
  Never duplicate server data into a separate client store — the query cache
  *is* the source of truth for anything that came from the API (see
  [ADR-0005](../02-architecture/adr/0005-react-vite-frontend.md#decision)).
- **API calls only in `src/api/*.ts`.** Components never call `fetch`/`axios`
  directly — they call a typed function from `src/api/`, which is what gets
  wrapped by a `useQuery`/`useMutation` hook colocated with the page that
  uses it.
- **No inline styles beyond Tailwind utility classes.** No CSS-in-JS, no
  separate `.css` files per component — Tailwind is the entire styling
  layer, per [ADR-0005](../02-architecture/adr/0005-react-vite-frontend.md).
- **Components take props, not context, where a parent can just pass data.**
  Reach for Context only for genuinely cross-cutting state (auth session) —
  not as a way to skip prop drilling two levels deep.

## Naming

- Files: `kebab-case.ts` for modules, `PascalCase.tsx` for React components.
- Types/interfaces: `PascalCase`, no `I`-prefix (`User`, not `IUser`).
- Booleans read as predicates: `isReading`, `hasFinished`, not `reading`,
  `finished`.

## Review checklist

Before approving a PR, confirm:

- [ ] Matches its spec's acceptance criteria (or the PR explains the
      deviation and updates the spec).
- [ ] New/changed endpoints: validated input, tested, present in
      `docs/openapi.yaml`.
- [ ] No new pattern introduced that contradicts this document — if a new
      pattern is genuinely needed, this document gets updated in the same PR,
      not silently diverged from.
- [ ] No secrets, tokens, or real credentials in the diff.
- [ ] `CHANGELOG.md` updated under `[Unreleased]`.
