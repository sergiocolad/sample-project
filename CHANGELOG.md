# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-09-10

### Added
- Initial product definition: PRD, user stories, and success metrics
  (`docs/01-product/`).
- System architecture, database schema, and API design docs
  (`docs/02-architecture/`).
- ADRs 0001–0005 covering monorepo structure, PostgreSQL/Prisma, JWT auth,
  the Open Library integration, and the React/Vite frontend choice.
- Feature specs SPEC-001 through SPEC-004 (auth, book search, shelf
  management, reading stats).
- Backend API (Express + TypeScript + Prisma): authentication, book search
  proxying the Open Library API, shelf CRUD, and reading statistics.
- Frontend SPA (React + TypeScript + Vite + Tailwind): login/register, book
  search, shelf management, and a stats dashboard.
- PostgreSQL schema and migrations via Prisma.
- Docker Compose setup for one-command local environment.
- CI pipeline: lint, typecheck, and test for both packages on every PR.
- Engineering docs: coding standards, testing strategy, CI/CD, security,
  deployment, and runbook.

[Unreleased]: https://github.com/sergiocolad/sample-project/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sergiocolad/sample-project/releases/tag/v0.1.0
