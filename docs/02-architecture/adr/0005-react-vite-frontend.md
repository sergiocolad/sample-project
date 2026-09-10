# ADR-0005: React + TypeScript + Vite for the frontend

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-09-10 |
| **Deciders** | Engineering |

## Context

The frontend is a single client-rendered SPA consuming our own REST API
(no SEO requirement, no content that needs to be crawlable pre-shelf-login).
We need a framework and build tool.

## Decision

React 18 + TypeScript, built with Vite, styled with Tailwind CSS, data
fetching/caching via TanStack Query, routing via React Router.

## Alternatives considered

- **Next.js** — rejected for v1: its main value (SSR/SSG, file-based routing,
  API routes) doesn't apply here — we already have a separate backend and no
  SEO/SSR requirement (see [PRD non-goals](../../01-product/PRD.md#4-non-goals):
  no public content to render server-side). Adding it would mean carrying
  framework surface area (data-fetching conventions, server/client component
  boundaries) with no corresponding need.
- **Vue / Svelte** — both reasonable choices; React was picked for this
  reference project specifically because it's the most widely recognized
  stack for a sample/teaching repo, not because of a technical gap in the
  alternatives.
- **Create React App** — deprecated by its own maintainers; Vite is the
  current standard for non-meta-framework React tooling (fast dev server via
  native ESM, first-class TypeScript support, minimal config).
- **Redux / Zustand for state** — rejected in favor of TanStack Query for
  server state (the vast majority of this app's state: search results, shelf
  entries, stats) plus plain React Context for the one piece of client-only
  state (auth session). Introducing a general state library for a component
  tree this shallow would be the abstraction the top-level engineering
  principle explicitly warns against.

## Consequences

- Fast local dev loop (Vite HMR) and a small, standard production bundle
  (static files servable by any static host or a minimal nginx container —
  see [DEPLOYMENT.md](../../05-operations/DEPLOYMENT.md)).
- TanStack Query gives cache invalidation, loading/error states, and refetch
  behavior "for free" for every API call, keeping components focused on
  rendering rather than fetch orchestration.
- No SSR means the initial load is a blank shell until JS executes — accepted
  given there's no SEO/first-paint requirement for a behind-login tool.

## Revisit when

A requirement emerges for public, crawlable, pre-login content (e.g., public
shelf pages from a relaxed non-goal) — that would be the trigger to
re-evaluate Next.js for just those routes, not necessarily the whole app.
