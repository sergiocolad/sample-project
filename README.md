# 📚 Shelfie

A personal reading tracker — search books, organize them into shelves, track
your progress, and see your reading stats. Built as a **reference full-stack
project**: React frontend, Node/Express backend, PostgreSQL database, JWT
auth, and a real third-party API integration (Open Library) — documented and
structured the way a production codebase should be.

> This repository doubles as a template for **spec-driven, documentation-first
> engineering**. If you're here to see *how* it's structured rather than *what*
> it does, start with [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/).

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Router, TanStack Query |
| Backend | Node.js 20, TypeScript, Express, Zod, JWT |
| Database | PostgreSQL 16, Prisma ORM |
| External API | [Open Library](https://openlibrary.org/developers/api) (search + covers — no API key required) |
| Testing | Vitest, Supertest, Testing Library |
| CI/CD | GitHub Actions |
| Infra (local) | Docker Compose |

## Features

- 🔐 Email/password auth with JWT access + refresh tokens
- 🔎 Book search backed by the Open Library catalog (title, author, cover art)
- 📖 Personal shelves: *Want to Read*, *Reading*, *Read*
- 📈 Progress tracking (current page, rating, review) per book
- 📊 A stats dashboard: books finished, pages read, ratings distribution

## Quick start

### Option A — Docker (recommended, zero local setup)

```bash
git clone https://github.com/sergiocolad/sample-project.git
cd sample-project
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Postgres: localhost:5432

The API container runs Prisma migrations and seeds a demo user
(`demo@shelfie.dev` / `password123`) automatically on first boot.

### Option B — Run locally without Docker

Requires Node.js 20+ and a running PostgreSQL 16 instance.

```bash
# 1. Backend
cd backend
cp .env.example .env        # point DATABASE_URL at your Postgres instance
npm install
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:3000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

No API key is required for the Open Library integration — it's a public,
unauthenticated API.

## Project structure

```
sample-project/
├── backend/     # Express API — see backend/README.md
├── frontend/    # React SPA — see frontend/README.md
├── docs/        # PRD, architecture, ADRs, specs, engineering & ops docs
├── .github/     # CI workflows, issue/PR templates
└── docker-compose.yml
```

## Documentation

This project follows a **spec-driven, documentation-first** workflow — every
feature has a written spec before it has code, and every architectural
decision has a recorded rationale. Full index in [`CLAUDE.md`](CLAUDE.md#2-map-of-the-documentation).

Highlights:
- [Product Requirements Document](docs/01-product/PRD.md) — why this exists
- [Architecture Overview](docs/02-architecture/ARCHITECTURE.md) — how it's built
- [Database Schema](docs/02-architecture/DATABASE_SCHEMA.md)
- [API Design](docs/02-architecture/API_DESIGN.md) · [OpenAPI contract](docs/openapi.yaml)
- [Architecture Decision Records](docs/02-architecture/adr/)
- [Feature Specs](docs/03-specs/)
- [Testing Strategy](docs/04-engineering/TESTING_STRATEGY.md)
- [Deployment Guide](docs/05-operations/DEPLOYMENT.md)

## Running tests

```bash
cd backend && npm test
cd frontend && npm test
```

## License

[MIT](LICENSE)
