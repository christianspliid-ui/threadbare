---
domain: process
status: live
last_reviewed: 2026-05-05
reviewer: cowork
---

# Canon Pages — Schema and Ownership

`Docs/canon/` is the navigation layer between the Ubiquitous Language (terminology authority) and plan docs (rationale history). A Canon page answers the question **"what is true right now, and where do I read?"** for one creative or technical domain.

## The three-layer model

```
Layer 1 — UL (Docs/ubiquitous-language/)
  Owns: term definitions. "UL wins on disagreements."

Layer 2 — Canon pages (Docs/canon/<domain>.md)      ← this directory
  Owns: navigation, current spec pointers, rejected approaches, open questions.

Layer 3 — Plans (Docs/plans/)
  Owns: rationale, alternatives, decision history.
```

Agent loading order: load UL index always → load the relevant Canon page first when starting authoring work → descend into plans only when answering a *why* question.

## Page schema

Every Canon page must use this frontmatter and section structure:

```markdown
---
domain: <domain>              # encounters | cosmology | prose | hex-map | agents | engine | process | ...
last_reviewed: YYYY-MM-DD
reviewer: cowork | user       # 'user' when the user personally verdicted the review
ul_shards: [ShardsUsed]       # UL shard files that define terms for this domain
status: live | needs-review | stale
---

# Canon — <Domain>

> One-line statement of what this domain is.

## Current spec
- **Key:** pointer to current authoritative source

## Active design plans
- [plan file] — description (Linear issue)

## Rejected approaches
- ❌ Approach (replaced by what, when/ticket)

## Open questions
- Question needing a verdict

## Last-reviewed
YYYY-MM-DD by <reviewer>. Review trigger: monthly, or when any linked plan moves to `superseded`.
```

## Rules

**Rule 1 — One Canon page per creative domain.** One file, ≤200 lines, in `Docs/canon/<domain>.md`. It is the agent's Step 0 entrypoint. It does not contain definitions; it points to them.

**Rule 2 — Plans declare their lifecycle in frontmatter.** Every plan in `Docs/plans/` carries:
`status: proposal | current | implementation-log | superseded | historical`
and (when relevant) `superseded_by: <path>`. A plan with no status is treated as historical.
(`current` not `canon` — UL uses `Status: canonical` for term entries; this avoids collision.)

**Rule 3 — Old plans archive once their content lives in canon.** Plans with `status: implementation-log` and age >90 days move to `Docs/plans/archive/YYYY-MM/`. The flat `Docs/plans/` directory stays scannable.

**Rule 4 — Drift is detected, not discovered.** Lint signals (`lint-ul-vs-systems`, `lint-rejected-approaches`, `lint-untagged-plans`) run in the weekly drift scan and emit `drift-scan`-labeled Linear issues. You no longer find drift by reading 12 files.

## Ownership

| Role | Responsibility |
|------|---------------|
| Cowork | Drafts and updates Canon pages from current state; applies `plan-pending-commit` label after writing |
| User | Verdicts any factual decisions a Canon page must record; `reviewer: user` when a page encodes a user verdict |
| CC / Codex | Reads Canon pages as Step 0 before authoring work; flips plan frontmatter to `status: current` when a plan lands |

## Canon page index

| File | Domain | Status | Last reviewed |
|------|--------|--------|---------------|
| [encounters.md](encounters.md) | Encounters | live | 2026-05-05 |
| [cosmology.md](cosmology.md) | Cosmology | live | 2026-05-05 |
| [engine.md](engine.md) | Engine | live | 2026-05-05 |
| [process.md](process.md) | Process | live | 2026-05-06 |

## When to update a Canon page

- When a plan moves from `proposal` → `current`: update Current spec pointers, remove any matching Open questions, add the plan to Active design plans.
- When a plan moves to `superseded`: move it from Active design plans to the Rejected approaches section with a note.
- Monthly: update `last_reviewed` after a quick scan confirming the pointers still resolve.
- When any linked plan changes since `last_reviewed`: flip `status` to `needs-review`.
