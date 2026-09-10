# CI/CD

| | |
|---|---|
| **Pipeline** | GitHub Actions — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| **Related** | [TESTING_STRATEGY.md](TESTING_STRATEGY.md) |

## What runs on every PR and every push to `main`

Two parallel jobs, `backend` and `frontend`, each:

1. Install dependencies (`npm ci`, cached by lockfile hash).
2. `npm run lint` — ESLint; fails the build on any lint error.
3. `npm run typecheck` — `tsc --noEmit`; fails the build on any type error.
4. `npm test` — the suite described in [TESTING_STRATEGY.md](TESTING_STRATEGY.md).
   The backend job spins up a `postgres:16` service container so integration
   tests run against a real database, not a mock.
5. `npm run build` — confirms the production build actually compiles (catches
   issues `tsc --noEmit` alone can miss, e.g. Vite-specific build errors).

A PR cannot merge with a red pipeline. This is enforced by branch protection
on `main` (configured in repository settings, not in the workflow file
itself — see [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) for the
distinction between what's in this repo's version control and what's
GitHub-side configuration).

## External dependencies in CI

The backend integration tests never call the real Open Library API — network
calls in CI to a third party are slow, rate-limited, and a source of flaky,
unrelated failures. `openLibrary.client.ts` is mocked at the module boundary
in tests. This means CI does **not** catch a real breaking change in Open
Library's response shape; that class of failure surfaces at runtime and is
the reason `502 UPSTREAM_ERROR` mapping exists as a defensive boundary rather
than an afterthought (see [SPEC-002 AC2](../03-specs/SPEC-002-book-search-catalog.md#6-acceptance-criteria)).

## What CI does not do (by design, for this reference project)

- **No automatic deploy.** Merging to `main` does not push to any
  environment — there is no live environment for this reference project.
  See [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) for what a real deploy
  stage would look like if this shipped.
- **No Docker image publishing.** `Dockerfile`s exist and are used for local
  `docker compose`; CI doesn't build/push them to a registry. Add a
  `docker/build-push-action` job when there's an actual registry/target to
  publish to — adding it earlier would be undirected effort.
- **No dependency-vulnerability scanning job in the workflow file.** GitHub's
  built-in Dependabot alerts cover this at the repository-settings level
  without needing a workflow step; see [SECURITY.md](SECURITY.md).

## Required status checks

`backend` and `frontend` jobs are both required checks on `main` (set in
GitHub branch protection settings). A spec's "Implemented" status
(`docs/03-specs/*`) should not be marked true until its PR merged with both
green.
