# CLAUDE.md — Engineering Harness for AI Coding Agents

This file is the entry point for any AI coding agent (Claude Code or otherwise)
working in this repository. It exists so that an agent with zero prior context
can become productive and safe in under a minute of reading. Human contributors
should read it too — it doubles as the shortest path to understanding how we work.

If anything here is stale, fix it in the same PR that made it stale. A CLAUDE.md
that lies is worse than no CLAUDE.md.

## 0. What this project is

**Shelfie** is a personal reading tracker: users search books (via the public
Open Library API), add them to shelves (*Want to Read* / *Reading* / *Read*),
track progress, and see stats about their reading habits. It is a deliberately
small but *complete* full-stack system — frontend, backend, relational database,
auth, and a real third-party API integration — used here as a reference for how
we structure, spec, document, and ship software.

See [`README.md`](README.md) for the elevator pitch and quick start, and
[`docs/01-product/PRD.md`](docs/01-product/PRD.md) for why this product exists.

## 1. How work flows in this repo (Spec-Driven Development)

**No non-trivial code is written before its spec exists.** This is not
bureaucracy for its own sake — it's how we keep an AI agent (or a new hire)
from confidently building the wrong thing quickly.

The flow for any new feature or significant change:

1. **Write or update the spec first.** Specs live in [`docs/03-specs/`](docs/03-specs/),
   one file per feature, named `SPEC-NNN-kebab-case-name.md`. Copy
   [`docs/03-specs/TEMPLATE.md`](docs/03-specs/TEMPLATE.md). A spec defines: the
   problem, user stories, the API contract, the data model impact, acceptance
   criteria as Given/When/Then, edge cases, and explicit non-goals.
2. **If the change affects a cross-cutting technical decision** (a new
   dependency, a storage choice, an auth strategy, a pattern that other code
   will need to follow) — write an **ADR** in
   [`docs/02-architecture/adr/`](docs/02-architecture/adr/) using
   [`docs/02-architecture/adr/template.md`](docs/02-architecture/adr/template.md).
   Specs describe *what* and *why for the user*; ADRs describe *why this
   technical approach* and what was rejected.
3. **Implement against the spec.** The spec's acceptance criteria become your
   test cases. If reality forces a deviation from the spec, update the spec in
   the same PR — specs are living contracts, not historical artifacts.
4. **Update `docs/openapi.yaml`** if you touched an HTTP endpoint. It is the
   single source of truth for the API surface; do not let it drift from the
   code.
5. **Update [`CHANGELOG.md`](CHANGELOG.md)** under `[Unreleased]` following
   [Keep a Changelog](https://keepachangelog.com/).

Rationale for this order (spec → ADR if needed → code → docs sync) is that it
is far cheaper to catch a wrong assumption in a one-page markdown file than in
400 lines of TypeScript and a migration.

## 2. Map of the documentation

| Path | Purpose |
|---|---|
| `README.md` | What the project is, how to run it, 5-minute quick start |
| `docs/01-product/PRD.md` | Product Requirements Document — problem, personas, goals, success metrics |
| `docs/01-product/USER_STORIES.md` | User stories backing the PRD, mapped to specs |
| `docs/02-architecture/ARCHITECTURE.md` | System design, C4-style diagrams, component responsibilities |
| `docs/02-architecture/DATABASE_SCHEMA.md` | ER diagram and table-by-table rationale |
| `docs/02-architecture/API_DESIGN.md` | REST conventions, error shape, versioning policy |
| `docs/02-architecture/adr/` | Architecture Decision Records — one immutable file per decision |
| `docs/03-specs/` | Feature specs, written before implementation |
| `docs/04-engineering/CODING_STANDARDS.md` | Style, naming, module boundaries, review checklist |
| `docs/04-engineering/TESTING_STRATEGY.md` | What we test, at which layer, with which tool |
| `docs/04-engineering/CI_CD.md` | What the pipeline enforces and why |
| `docs/04-engineering/SECURITY.md` | Threat model, auth model, secrets handling |
| `docs/05-operations/DEPLOYMENT.md` | How and where this ships |
| `docs/05-operations/RUNBOOK.md` | What to do when something breaks in production |
| `docs/openapi.yaml` | Machine-readable API contract |

## 3. Repository layout

```
sample-project/
├── backend/          # Node.js + TypeScript + Express API, Prisma ORM
├── frontend/         # React + TypeScript + Vite SPA
├── docs/             # Everything described in the table above
├── .github/          # CI workflows, issue/PR templates
└── docker-compose.yml
```

Each of `backend/` and `frontend/` is independently runnable, testable, and
lintable. See their own `package.json` scripts — do not invent new tooling
without checking there first.

## 4. Non-negotiable conventions

- **TypeScript strict mode everywhere.** No `any` without a comment explaining
  why it's unavoidable (usually: an untyped third-party payload at a boundary).
- **Validate at the boundary.** Every HTTP input is parsed with a `zod` schema
  before it touches business logic (see `backend/src/modules/*/*.schema.ts`).
  Internal functions trust their inputs — do not re-validate downstream.
- **Modules are vertical, not layered globally.** Each feature under
  `backend/src/modules/<feature>/` owns its routes, controller, service, and
  schema. Don't create a global `services/` or `controllers/` folder.
- **Services never import Express types.** Controllers translate HTTP ↔
  domain; services are framework-agnostic and unit-testable without a server.
- **Secrets never enter source control.** `.env` files are gitignored;
  `.env.example` documents every variable a human needs to set.
- **Every new endpoint** gets: a zod schema, a spec entry, an OpenAPI entry,
  and at least one integration test (`backend/tests/`).
- **Commit messages** are imperative mood, reference the spec when applicable
  (`feat(shelf): add progress tracking (SPEC-003)`), and stay under one
  logical change per commit.

Full detail in [`docs/04-engineering/CODING_STANDARDS.md`](docs/04-engineering/CODING_STANDARDS.md).

## 5. Running things

```bash
# Full stack, containerized (Postgres + API + web)
docker compose up --build

# Backend only, local Node
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev

# Frontend only, local Node
cd frontend && npm install && npm run dev

# Tests
cd backend && npm test
cd frontend && npm test

# Lint + typecheck (run before every commit)
cd backend && npm run lint && npm run typecheck
cd frontend && npm run lint && npm run typecheck
```

Full walkthrough, including how to obtain zero API keys (the external
integration, Open Library, is key-free) in [`README.md`](README.md).

## 6. Quality gates an agent must satisfy before calling a task done

1. `npm run typecheck` passes in every package touched.
2. `npm run lint` passes in every package touched.
3. `npm test` passes in every package touched, including new tests for new
   behavior.
4. If an HTTP contract changed: `docs/openapi.yaml` reflects it.
5. If a spec exists for the feature: its acceptance criteria are all
   demonstrably met (link the test that proves each one, or state which
   remain manual and why).
6. `CHANGELOG.md` has an entry under `[Unreleased]`.

CI (`.github/workflows/ci.yml`) enforces 1–3 automatically. 4–6 are on the
author and reviewer — a green pipeline is necessary, not sufficient.

## 7. What to do when requirements are ambiguous

Do not guess silently and do not block on a full requirements document either.
Make the smallest reasonable assumption, write it down explicitly in the spec
under "Assumptions", and proceed. A wrong assumption that's visible in a spec
diff is cheap to correct in review; a wrong assumption buried in code is not.

## 8. Boundaries

This harness governs how code is written and documented. It does not grant
authority to: deploy to production, rotate or provision credentials, or
change CI/CD infrastructure outside `.github/workflows/ci.yml` — those remain
human-in-the-loop actions regardless of how confident the agent is.
