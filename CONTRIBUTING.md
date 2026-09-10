# Contributing

This is a reference/sample project, but it is set up and run exactly like a
production codebase would be. If you're using it as a template for real work,
this workflow is meant to be copied wholesale.

## Before you write code

Read [`CLAUDE.md`](CLAUDE.md) — it defines the spec-driven workflow this repo
follows. In short: **a feature gets a spec in `docs/03-specs/` before it gets
an implementation.** This applies to human and AI contributors alike.

## Workflow

1. **Open an issue** (or check `docs/03-specs/` for an existing spec) describing
   the problem before the solution.
2. **Write/update the spec.** Use [`docs/03-specs/TEMPLATE.md`](docs/03-specs/TEMPLATE.md).
   Get it reviewed — specs are cheap to change, code is not.
3. **Branch** off `main`: `feat/<short-name>`, `fix/<short-name>`, or
   `docs/<short-name>`.
4. **Implement**, keeping commits scoped to one logical change each.
5. **Update the OpenAPI contract** (`docs/openapi.yaml`) for any HTTP surface
   change, and `CHANGELOG.md` under `[Unreleased]`.
6. **Run the full local quality gate** before opening a PR:
   ```bash
   cd backend && npm run lint && npm run typecheck && npm test
   cd frontend && npm run lint && npm run typecheck && npm test
   ```
7. **Open a PR** using the template in `.github/PULL_REQUEST_TEMPLATE.md`. Link
   the spec. CI must be green before requesting review.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), referencing the
spec ID where applicable:

```
feat(shelf): add reading progress tracking (SPEC-003)
fix(auth): reject expired refresh tokens
docs(adr): record decision to use JWT over sessions
```

## Code review checklist

See [`docs/04-engineering/CODING_STANDARDS.md`](docs/04-engineering/CODING_STANDARDS.md#review-checklist)
for the full list. The short version: does it match its spec's acceptance
criteria, is every new endpoint validated and tested, and does it avoid
introducing a pattern not already documented in the standards?

## Code of conduct

Be direct, be kind, assume good faith. Disagree on ideas, not people.
