# Shelfie — Frontend

React + TypeScript SPA, built with Vite and styled with Tailwind CSS. See the
root [README.md](../README.md) for the full project overview and
[`docs/`](../docs/) for architecture and specs.

## Structure

```
src/
├── api/            # Typed API client functions — the only place fetch/axios is called
├── components/     # Shared UI: Layout, BookCard, ProtectedRoute
├── context/        # AuthContext — the one piece of client-only cross-cutting state
├── pages/          # One component per route
├── types/          # Shared TS types mirroring the API contract
├── App.tsx         # Route definitions
└── main.tsx        # Entry point — providers (QueryClient, Router, Auth)
```

See [docs/04-engineering/CODING_STANDARDS.md](../docs/04-engineering/CODING_STANDARDS.md#frontend-frontend)
for the conventions this structure enforces (server state via TanStack
Query, no direct API calls from components, Tailwind-only styling).

## Setup

```bash
cp .env.example .env
npm install
npm run dev   # http://localhost:5173, proxies /api to the backend on :3000
```

The backend must be running separately (see [../backend/README.md](../backend/README.md))
unless you're using `docker compose up` from the repo root.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR and the `/api` proxy |
| `npm run build` | Type-check (`tsc -b`) then produce the production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` / `npm run typecheck` | Quality gates |
| `npm test` / `npm run test:watch` | Vitest + Testing Library component tests |

## Testing

API calls are mocked at the `src/api/*.ts` module boundary — component tests
never hit a real network request. See
[docs/04-engineering/TESTING_STRATEGY.md](../docs/04-engineering/TESTING_STRATEGY.md#frontend).
