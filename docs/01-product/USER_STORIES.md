# User Stories

Backing the goals in [PRD.md](PRD.md). Each story maps to the spec that
implements it — this is the traceability chain from "why" to "how."

## Authentication

- **US-1**: As a new user, I want to create an account with my email and a
  password, so that my shelves are private to me.
  → [SPEC-001](../03-specs/SPEC-001-user-authentication.md)
- **US-2**: As a returning user, I want to log in and stay logged in across
  browser sessions, so I don't have to re-authenticate constantly.
  → [SPEC-001](../03-specs/SPEC-001-user-authentication.md)

## Book discovery

- **US-3**: As a user, I want to search for a book by title or author, so I
  can find the exact edition I'm reading without typing an ISBN.
  → [SPEC-002](../03-specs/SPEC-002-book-search-catalog.md)
- **US-4**: As a user, I want to see the cover art and basic details of a
  book before adding it, so I can confirm it's the right one.
  → [SPEC-002](../03-specs/SPEC-002-book-search-catalog.md)

## Shelf management

- **US-5**: As a user, I want to add a book to "Want to Read," "Reading," or
  "Read," so I can organize my reading life into those three honest states.
  → [SPEC-003](../03-specs/SPEC-003-shelf-management.md)
- **US-6**: As a user, I want to update my current page while reading a book,
  so I can track progress without opening a separate app.
  → [SPEC-003](../03-specs/SPEC-003-shelf-management.md)
- **US-7**: As a user, I want to rate and write a short review once I finish a
  book, so I remember what I thought of it later.
  → [SPEC-003](../03-specs/SPEC-003-shelf-management.md)
- **US-8**: As a user, I want to remove a book from my shelf, so mistakes or
  books I abandon don't clutter my stats.
  → [SPEC-003](../03-specs/SPEC-003-shelf-management.md)

## Stats

- **US-9**: As a goal-setter, I want to see how many books and pages I've
  finished this year, so I can gauge progress against my personal target.
  → [SPEC-004](../03-specs/SPEC-004-reading-stats-dashboard.md)
- **US-10**: As a user, I want to see the distribution of my ratings, so I
  can notice my own reading taste over time.
  → [SPEC-004](../03-specs/SPEC-004-reading-stats-dashboard.md)
