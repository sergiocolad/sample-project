# SPEC-NNN: <Feature name>

| | |
|---|---|
| **Status** | Draft / Approved / Implemented |
| **Author** | |
| **Date** | YYYY-MM-DD |
| **User stories** | Link to `docs/01-product/USER_STORIES.md` entries |
| **ADRs referenced** | Link any that constrain this spec |

## 1. Overview

One paragraph: what this feature does and why, for someone who has never seen
this product.

## 2. User stories in scope

- US-N: ...

## 3. Assumptions

Anything not explicitly specified upstream that this spec had to decide on
its own. This is where ambiguity gets resolved visibly instead of silently.

## 4. API contract

Endpoint-by-endpoint. Full shapes belong in `docs/openapi.yaml`; this section
covers behavior the schema alone doesn't capture (side effects, ordering,
idempotency).

## 5. Data model impact

New tables/columns, or "none — uses existing `X`."

## 6. Acceptance criteria (Given/When/Then)

- **AC1**: Given ..., when ..., then ...
- **AC2**: Given ..., when ..., then ...

Each of these should be directly traceable to a test.

## 7. Edge cases

Enumerate the ones that matter — not exhaustively, but the ones a reviewer
would otherwise have to ask about.

## 8. Non-goals for this spec

What this feature explicitly does not do, even if related.

## 9. Open questions

Anything genuinely blocking, if any.
