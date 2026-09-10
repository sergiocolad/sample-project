# ADR-0001: Single repository with npm workspaces, not separate repos

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-10 |
| **Deciders** | Engineering |

## Context

The project has two deployable units — `backend` and `frontend` — plus shared
project-level docs, CI, and Docker config. We need to decide whether they live
in one repository or two (or more).

## Decision

One repository (`sample-project`), with `backend/` and `frontend/` as npm
workspaces sharing a root `package.json` for orchestration, but each with its
own independent `package.json`, dependency tree, lint/test/build scripts, and
Dockerfile.

## Alternatives considered

- **Polyrepo (separate `sample-project-api` / `sample-project-web` repos)** —
  gives each service its own release cadence and access control. Rejected for
  this project's scale: two services, one team, no need for independent
  deploy cadence or access boundaries. Polyrepo would add cross-repo PR
  coordination overhead (a single feature like SPEC-003 touches both the API
  and the UI) without a corresponding benefit here.
- **True monolith (frontend served by the backend process, no separation)** —
  rejected because it would blur the API contract; forcing a real HTTP
  boundary between frontend and backend keeps `docs/openapi.yaml` honest and
  makes the backend independently consumable (e.g., by a future mobile client).

## Consequences

- One PR can atomically change an API contract and its frontend consumer —
  reviewable as a single diff instead of coordinated cross-repo PRs.
- One CI pipeline, one place to look for build status.
- Root `package.json` must stay a thin orchestration layer (scripts that
  delegate into workspaces) — it must never accumulate its own runtime
  dependencies, or the workspace boundary erodes.
- If this system grew to many independently-deployed services with different
  teams owning them, this decision would need revisiting (see below).

## Revisit when

The number of independently deployable services grows past what fits one
team's mental model (a common rule of thumb: more than 3–4 services, or any
service needing a different release cadence/access control than the others).
