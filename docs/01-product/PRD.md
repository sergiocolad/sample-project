# Product Requirements Document — Shelfie

| | |
|---|---|
| **Status** | Approved |
| **Owner** | Product |
| **Last updated** | 2026-09-10 |
| **Related** | [User Stories](USER_STORIES.md) · [Architecture](../02-architecture/ARCHITECTURE.md) |

## 1. Problem statement

Avid readers track what they've read and want to read across a mix of tools
that aren't built for it: spreadsheets, notes apps, or social platforms that
optimize for engagement over utility. These tools either lack structure
(freeform notes) or lack focus (social reading apps bury tracking under feeds,
recommendations, and social pressure).

There is no lightweight tool that does three things well: **find a book
quickly, log where you stand with it, and see your reading habits over time**
— without an account wall you don't trust, or a UI cluttered with things you
didn't ask for.

## 2. Goals

- Let a user find any published book in seconds without maintaining our own
  book catalog.
- Let a user record and update their relationship to a book (want to read /
  reading / read, progress, rating, review) in as few steps as possible.
- Give the user an honest, at-a-glance picture of their reading activity.
- Keep the system small enough that its entire surface area is understandable
  by a single engineer in one sitting — this is a deliberate constraint, not
  an oversight (see [Non-goals](#4-non-goals)).

## 3. Non-goals

*(Explicit, because unstated non-goals are where scope creep hides.)*

- **Not a social network.** No following, feeds, comments on other users'
  shelves, or public discovery in v1.
- **Not a bookstore.** No purchase links, no affiliate integrations.
- **Not a content platform.** We do not host or moderate long-form reviews at
  scale; reviews are personal notes, not a public review system.
- **Not multi-tenant / organization-aware.** Single user account model only;
  no shared or family shelves in v1.
- **Not offline-first.** Requires connectivity; no local-first sync engine.

## 4. Personas

**Primary — "The Steady Reader."** Reads 15–40 books a year across formats,
has tried and abandoned at least one spreadsheet or notes-app system for
tracking, wants something that takes less effort to maintain than the reading
itself.

**Secondary — "The Goal-Setter."** Reads to hit a yearly target (e.g., via a
reading challenge) and cares primarily about the stats view — books/pages
completed, pace against goal.

## 5. Scope for v1 (this repository)

| In scope | Out of scope (future) |
|---|---|
| Email/password auth | OAuth / social login |
| Search books via external catalog | Curated/owned book database |
| Add to shelf, change status | Multiple custom shelves per user |
| Progress (current page), rating, review | Reading goals / challenges |
| Aggregate stats dashboard | Public profile pages |
| — | Recommendations |
| — | Mobile app |

## 6. Success metrics

Since this is a reference project rather than a live product, "success" is
defined as the following being demonstrably true, each traceable to a spec
and its acceptance criteria:

1. A new user can register, find a real book, and add it to a shelf in under
   60 seconds of interaction (SPEC-001, SPEC-002, SPEC-003).
2. A user can update reading progress and see it reflected in the stats
   dashboard without a page reload requiring more than one round trip
   (SPEC-003, SPEC-004).
3. The system correctly reflects data from the external API (title, author,
   cover) without the user ever seeing a raw external error (SPEC-002).

In a live product these would be instrumented (activation rate, time-to-first-
shelf-add, weekly active shelves updated); instrumentation is intentionally
out of scope here — see [Non-goals](#4-non-goals) and `docs/05-operations/RUNBOOK.md`
for what we'd add first if this shipped for real.

## 7. Risks & assumptions

- **Assumption:** the Open Library API's free/unauthenticated tier has
  sufficient rate limits and uptime for this use case. Risk if wrong: search
  becomes unreliable. Mitigation: our own `Book` table caches metadata after
  first fetch (see [ADR-0004](../02-architecture/adr/0004-openlibrary-integration.md)),
  so a transient outage degrades new searches only, not already-shelved books.
- **Assumption:** users are comfortable with email/password auth for a
  personal tool. Revisit if this were to support real users beyond this
  reference implementation.

## 8. Open questions

None blocking v1. Tracked future decisions live as issues, promoted to specs
when prioritized.
