# Architecture Overview

| | |
|---|---|
| **Status** | Approved |
| **Last updated** | 2026-09-10 |
| **Related** | [Database Schema](DATABASE_SCHEMA.md) · [API Design](API_DESIGN.md) · [ADRs](adr/) |

## 1. C4 — System Context

```mermaid
C4Context
  title Shelfie — System Context

  Person(user, "Reader", "A person tracking their reading")
  System(shelfie, "Shelfie", "Search books, manage shelves, track progress")
  System_Ext(openlibrary, "Open Library API", "Public book catalog & cover images")

  Rel(user, shelfie, "Uses", "HTTPS")
  Rel(shelfie, openlibrary, "Searches & fetches metadata from", "HTTPS/JSON")
```

## 2. C4 — Container view

```mermaid
C4Container
  title Shelfie — Containers

  Person(user, "Reader")

  System_Boundary(shelfie, "Shelfie") {
    Container(spa, "Web App", "React, TypeScript, Vite", "Search, shelves, stats UI")
    Container(api, "API", "Node.js, Express, TypeScript", "Auth, shelf logic, stats, OL proxy/cache")
    ContainerDb(db, "Database", "PostgreSQL", "Users, cached book metadata, shelf entries")
  }

  System_Ext(openlibrary, "Open Library API")

  Rel(user, spa, "Uses", "HTTPS")
  Rel(spa, api, "Calls", "REST/JSON, JWT bearer")
  Rel(api, db, "Reads/writes", "SQL via Prisma")
  Rel(api, openlibrary, "Searches / fetches covers", "HTTPS/JSON")
```

**Why a proxy/cache instead of the SPA calling Open Library directly:** keeps
the third-party dependency and its failure modes behind our own API contract
(see [ADR-0004](adr/0004-openlibrary-integration.md)), lets us cache results
in `Book`, and avoids CORS/rate-limit exposure to end-user browsers.

## 3. Component view — API

```mermaid
flowchart TB
    subgraph API["Express API (backend/src)"]
        direction TB
        MW["middleware/\n(auth, error handler)"]
        subgraph Modules
            direction LR
            AuthM["modules/auth\nroutes, controller, service, schema"]
            BooksM["modules/books\nroutes, controller, service, OL client"]
            ShelfM["modules/shelf\nroutes, controller, service, schema"]
            StatsM["modules/stats\nroutes, controller, service"]
        end
        Prisma["lib/prisma (client)"]
    end

    Client["Frontend / API consumer"] -->|JWT bearer| MW
    MW --> AuthM
    MW --> BooksM
    MW --> ShelfM
    MW --> StatsM
    AuthM --> Prisma
    BooksM --> Prisma
    ShelfM --> Prisma
    StatsM --> Prisma
    BooksM -->|HTTPS| OL[(Open Library API)]
    Prisma --> PG[(PostgreSQL)]
```

Each module in `backend/src/modules/<name>/` is self-contained: `routes.ts`
(HTTP wiring) → `controller.ts` (HTTP ↔ domain translation) → `service.ts`
(business logic, framework-agnostic, unit-tested) → `schema.ts` (Zod input
validation). This is a **vertical-slice** structure, not a horizontal
layered one — see [ADR-0001](adr/0001-monorepo-npm-workspaces.md) and
[CODING_STANDARDS.md](../04-engineering/CODING_STANDARDS.md) for the
rationale.

## 4. Request flow — adding a book to a shelf

```mermaid
sequenceDiagram
    actor User
    participant SPA as Web App
    participant API as Express API
    participant OL as Open Library
    participant DB as PostgreSQL

    User->>SPA: Search "Project Hail Mary"
    SPA->>API: GET /api/books/search?q=...
    API->>OL: GET /search.json?q=...
    OL-->>API: Results (title, author, cover id, OL key)
    API-->>SPA: Normalized results
    User->>SPA: Click "Add to shelf → Want to Read"
    SPA->>API: POST /api/shelf {openLibraryId, status}
    API->>DB: Upsert Book (cache metadata if new)
    API->>DB: Insert ShelfEntry (userId, bookId, status)
    DB-->>API: ShelfEntry
    API-->>SPA: 201 Created
    SPA-->>User: Book appears on "Want to Read" shelf
```

## 5. Cross-cutting concerns

| Concern | Approach | Detail |
|---|---|---|
| AuthN | Stateless JWT (access + refresh) | [ADR-0003](adr/0003-jwt-stateless-auth.md), [SECURITY.md](../04-engineering/SECURITY.md) |
| AuthZ | Row-level ownership check (`userId` on every shelf query) | [API_DESIGN.md](API_DESIGN.md) |
| Validation | Zod schemas at every route boundary | [CODING_STANDARDS.md](../04-engineering/CODING_STANDARDS.md) |
| Error shape | Uniform `{ error: { code, message } }` via central error handler | [API_DESIGN.md](API_DESIGN.md) |
| External API resilience | Timeout + normalized error mapping in `openLibrary.client.ts`; cached `Book` rows survive OL outages | [ADR-0004](adr/0004-openlibrary-integration.md) |
| Config | Environment variables, validated at boot (`src/config/env.ts`) | fails fast on missing/invalid config |

## 6. Deployment topology (local / reference)

```mermaid
flowchart LR
    subgraph "docker compose"
        FE["frontend\n(vite dev server / nginx)"]
        BE["backend\n(node)"]
        PG[("postgres:16")]
        FE -->|"/api proxy"| BE
        BE --> PG
    end
    Browser -->|":5173"| FE
    BE -->|"HTTPS"| OL[(Open Library)]
```

See [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) for how this maps onto a
real hosting target (e.g., a managed Postgres + container platform).
