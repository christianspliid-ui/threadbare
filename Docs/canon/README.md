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

**Fallback discovery — the plans index.** Canon pages are curated and don't cover every domain. When no Canon page points at the plan you need, consult [`Docs/plans/INDEX.md`](../plans/INDEX.md) — the generated, exhaustive catalog of every design plan (date, topic, linked Linear issue, and a ⚠️ marker on plans that declare themselves stale or are superseded by a later plan). It is the fallback catalog underneath this curated layer; regenerate it with `npm run rebuild-plans-index`.

## Page schema

Every Canon page must use this frontmatter and section structure:

```markdown
---
domain: <domain>              # encounters | cosmology | prose | hex-map | agents | engine | process | ...
last_reviewed: YYYY-MM-DD
reviewer: claude-code | user  # 'user' when the user personally verdicted the review ('cowork' appears on pre-THR-654 reviews; valid as history, not for new reviews)
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
| Design session | Drafts and updates Canon pages from current state; commits them via a `docs/plan-*` PR |
| User | Verdicts any factual decisions a Canon page must record; `reviewer: user` when a page encodes a user verdict |
| CC (executor sessions) | Reads Canon pages as Step 0 before authoring work; flips plan frontmatter to `status: current` when a plan lands |

## Canon page index

> **This table is the one full canon index** (THR-1334) — CLAUDE.md's canon table and the `state-of-game-design` router point here rather than keeping their own copies, after the 2026-08-28 audit found three indexes that all disagreed with the directory. When a canon page is added or retired, this table is the row to edit. `Last reviewed` mirrors each page's own frontmatter/footer; when they disagree, the page wins and this row needs the update.

| File | Domain | Status | Last reviewed |
|------|--------|--------|---------------|
| [rulebook-quick-reference.md](rulebook-quick-reference.md) | Rulebook quick-reference (always-load) | live | 2026-07-21 |
| [rulebook.md](rulebook.md) | Rulebook (synthesis) | live | 2026-08-19 |
| [process.md](process.md) | Process (meta-canon) | live | 2026-08-28 |
| [design-governance.md](design-governance.md) | Design governance (authoritative, THR-760) | live | 2026-08-06 |
| [verification-gates.md](verification-gates.md) | Verification gates + browser-verify (authoritative, THR-1336) | live | 2026-08-28 |
| [cosmology.md](cosmology.md) | Cosmology | live | 2026-08-28 |
| [encounters.md](encounters.md) | Encounters | live | 2026-05-05 |
| [undertakings.md](undertakings.md) | Undertakings (the factory line's Step 0, THR-1300) | live | 2026-09-02 |
| [agents.md](agents.md) | Agents | live | 2026-05-06 |
| [attachments.md](attachments.md) | Attachments | live | 2026-05-05 |
| [engine.md](engine.md) | Engine | live | 2026-05-05 |
| [prose.md](prose.md) | Prose (prose-doctrine authority) | live | 2026-08-25 |
| [hex-map.md](hex-map.md) | Hex Map | live | 2026-05-06 |
| [encounter-catalogs.md](encounter-catalogs.md) | Encounter catalogs | live | — |
| [interface-map.md](interface-map.md) | Interfaces (protocol) | live | 2026-07-23 |
| [interface-map.generated.md](interface-map.generated.md) | Interfaces (generated rows) | generated | — |
| [systems-inventory.md](systems-inventory.md) | Systems inventory (Engine-pillar Step 0) | generated | — |
| [world-objects.md](world-objects.md) | World objects (the catalogue of kinds, in game words) | live | 2026-09-03 |
| [world-objects.generated.md](world-objects.generated.md) | World objects (generated census + drift) | generated | — |
| [consumption-ledger.generated.md](consumption-ledger.generated.md) | Consumption ledger | generated | — |
| [setting-coverage.generated.md](setting-coverage.generated.md) | Setting coverage | generated | — |

> **The Rulebook is the synthesis layer.** Per-domain canon pages own current spec (Cosmology owns the eight Reaches, Encounters owns the encounter format, etc.). The Rulebook owns *how the systems combine into a game from the player's seat*. Every rulebook section ends with an authority-boundary footer pointing back at UL (terms), the relevant per-domain canon page (spec), and Vision (why). Each rule carries `[IMPL] / [DESIGN] / [OPEN]` so the gap between implemented and intended is structural, not hidden. Load the **quick-reference** at session start (always-loaded per CLAUDE.md); load the **full rulebook** when work touches rules of play (turn structure, action verb, prerequisite, resource, clock, win/loss).

## When to update a Canon page

- When a plan moves from `proposal` → `current`: update Current spec pointers, remove any matching Open questions, add the plan to Active design plans.
- When a plan moves to `superseded`: move it from Active design plans to the Rejected approaches section with a note.
- Monthly: update `last_reviewed` after a quick scan confirming the pointers still resolve.
- When any linked plan changes since `last_reviewed`: flip `status` to `needs-review`.
