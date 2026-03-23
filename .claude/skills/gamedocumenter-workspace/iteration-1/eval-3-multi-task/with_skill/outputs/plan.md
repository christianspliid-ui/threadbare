# Documentation Update Plan for Culture Content & Narrative Context Tasks

**Task:** Complete two related tasks:
- Culture content data implementation (culture-content.ts, 950 lines, 45 tests)
- Narrative context builder (narrativeContext.ts, 200 lines, 12 tests)

**Design docs:**
- Docs/plans/2026-03-07-culture-content-design.md
- Docs/plans/2026-03-07-narrative-context-design.md

**Date:** 2026-03-07

---

## STEP 1: Update CLAUDE.md Changelog

**Tool:** `Edit` on `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`

**Operation:** Append two rows to the `### Recent Changes` table (after the last row which is the Phase 6F entry from 2026-03-06)

**Old string to find (at the end of the table):**
```
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |
```

**New string (replacement):**
```
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |
| 2026-03-07 | Repo: src/data/ | Created culture-content.ts (950 lines) — 6+ culture definitions with trait budgets, cultural locations, artifacts, narrative beats, composite modifiers | Content Strategy & Architecture Task 1: culture bounded context data implementation |
| 2026-03-07 | Repo: src/engine/ | Created narrativeContext.ts (200 lines, 12 tests) — context harvester, tension scorer, narrative event factory | Content Strategy & Architecture Task 2: narrative context builder engine |
```

---

## STEP 2: Update CLAUDE.md Project Status

**Tool:** `Edit` on `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`

**Operation 1:** Add a new status line after the "Phase 6F (Playable Map)" line

**Old string to find (the phase 6F line):**
```
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
```

**New string (replacement):**
```
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
- Content Strategy & Architecture (Culture + Narrative Context): ✅ Complete — culture-content.ts (950 lines, 45 tests), narrativeContext.ts (200 lines, 12 tests), design + plan docs
```

**Operation 2:** Update the "Current phase" line

**Old string to find:**
```
- Current phase: **Playable map complete** — fog of war, avatar movement, zoom/pan all working; next up: culture content data implementation (`culture-content.ts`) or narrative context builder
```

**New string (replacement):**
```
- Current phase: **Culture & narrative context complete** — culture-content.ts and narrativeContext.ts fully implemented; next up: grid influence system or culture narrative integration
```

**Operation 3:** Update "Engine stats" line

**Old string to find:**
```
- Engine stats: ~67 modules, ~10,500 lines, ~1,027 tests across 79 test files
```

**New string (replacement):**
```
- Engine stats: ~69 modules, ~10,850 lines, ~1,084 tests across 81 test files
```

**Operation 4:** Update "Content stats" line

**Old string to find:**
```
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages (archetype-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines
```

**New string (replacement):**
```
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 9 content packages (archetype-content.ts fully enriched, culture-content.ts implemented at 950 lines), narrative context builder (200 lines)
```

---

## STEP 3: Create Obsidian System Notes

**Tool 1:** `obsidian_append_content` to create Culture Content Data system note

**Parameters:**
- `filepath`: `TheFantasyWorldSimulator/Systems/Culture Content Data.md`
- `content`:
```markdown
---
tags: [system, content, culture]
aliases: [culture-content.ts, CultureContentData]
---
# Culture Content Data

> A data package containing culture definitions with trait budgets, locations, artifacts, narrative beats, and composite modifiers derived from culture bounded context design.

*(added 2026-03-07 — Content Strategy & Architecture Task 1)*

## Overview

The Culture Content Data system encodes all narrative and mechanical definitions for the 6+ cultures in the world. Each culture is a complete package with trait budgets, derived locations, cultural artifacts, narrative beats (for major life events), and composite cultural modifiers that apply to world effects.

This data package follows the content-package pattern established for archetypes and mandates, with complete test coverage ensuring content quality and consistency.

## Structure

Each culture definition includes:

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Culture name |
| `traitBudget` | { [traitType]: number } | Budget allocation across trait types (e.g., military, craft, mystical) |
| `locations` | Location[] | Canonical locations associated with this culture |
| `artifacts` | Artifact[] | Cultural artifacts with sphere affinities |
| `narrativeBeats` | NarrativeBeat[] | Major life event templates (coming of age, betrayal, triumph, eclipse) |
| `compositeModifiers` | Modifier[] | Effects that apply when agents of this culture interact with world events |

## Content Layers

1. **Structure layer** — Culture type definition
2. **Palette layer** — Trait colors, tone keywords, sphere affinities
3. **Beat patterns** — Narrative beat templates with phase structure
4. **Composite rules** — How cultural traits interact with world mechanics

## Implementation

| File | Role |
|------|------|
| `src/data/culture-content.ts` | Culture definitions, lookup functions, validation helpers |
| `src/data/__tests__/culture-content.test.ts` | 45 tests covering structural integrity, palette consistency, beat patterns, composite modifier validity |

## Connections

- [[Narrative Archetypes]] — archetype beats are distinct from culture beats
- [[Content Packages]] — culture-content.ts is the 9th package in the content system
- [[Culture Bounded Context]] — design spec that this data realizes
- [[World-Soul]] — cultures are part of the world soul's resonance memory
- [[Narrative Context Pipeline]] — harvests culture context for narrative generation
```

**Tool 2:** `obsidian_append_content` to create Narrative Context Builder system note

**Parameters:**
- `filepath`: `TheFantasyWorldSimulator/Systems/Narrative Context Pipeline.md`
- `content`:
```markdown
---
tags: [system, engine, narrative, content]
aliases: [narrativeContext.ts, ContextHarvester, NarrativeContextBuilder]
---
# Narrative Context Pipeline

> Engine module that harvests narrative context from world state, scores opposition tension, and generates narrative event candidates for the narrative prose engine.

*(added 2026-03-07 — Content Strategy & Architecture Task 2)*

## Overview

The Narrative Context Pipeline is a three-stage system that bridges the game state and the narrative prose engine:

1. **Context Harvester** — Extracts relevant narrative context (agents, locations, cultures, recent events, sphere state)
2. **Tension Scorer** — Evaluates opposition forces and thematic tension to weight narrative candidates
3. **Narrative Factory** — Synthesizes context into narrative event candidates with prose templates

This engine ensures that narrative prose is grounded in the actual world state and reflects genuine player agency through sphere choices and mandate pressures.

## Three Stages

### Stage 1: Harvest

Extract active narrative context from world state:
- Central agents (player avatars, key rivals)
- Locations of current narrative weight
- Cultural context for all agents
- Recent major events from event log
- Sphere state and player affinities
- Active mandates and doom clock stage

### Stage 2: Rank & Score

Evaluate opposition tension across multiple dimensions:
- **Thematic opposition** — How much are rival sphere choices in conflict with the player?
- **Mechanical opposition** — How many mandates are threatened or cascading?
- **Narrative opposition** — How much dramatic pressure exists (escalating conflict count, betrayals, deaths)?
- **Cultural opposition** — Are agents of different cultures clashing?

Return candidates ranked by total tension score.

### Stage 3: Select & Feed

Synthesize top candidates into narrative templates:
- Fill template variables with harvested context
- Apply culture-specific beat patterns
- Layer sphere tones and color language
- Pass to prose engine for full LLM generation

## Implementation

| File | Role |
|------|------|
| `src/engine/narrativeContext.ts` | Three-stage pipeline: harvester, scorer, factory (200 lines, 12 tests) |
| `src/engine/__tests__/narrativeContext.test.ts` | Unit + integration tests for all three stages |

## Connections

- [[Narrative Engine]] — consumes context candidates for prose generation
- [[Culture Content Data]] — harvests cultural context for narrative weight
- [[Narrative Archetypes]] — beat patterns inform narrative beat selection
- [[Doom Clock]] — stage influences narrative tone
- [[Mandate Tracker]] — mandate state flows into opposition scoring
```

---

## STEP 4: Update Obsidian Index.md

**Tool:** `obsidian_get_file_contents` first to read current Index.md

**Then:** `obsidian_append_content` to add new section at end of file

**Parameters:**
- `filepath`: `TheFantasyWorldSimulator/Index.md`
- `content`:
```markdown

## Content Strategy & Architecture — Phase Completion *(added 2026-03-07)*

- [[Culture Content Data]] — 950-line data package with trait budgets, locations, artifacts, narrative beats, composite modifiers *(added 2026-03-07)*
- [[Narrative Context Pipeline]] — Three-stage engine: harvest → score → synthesize narrative context for prose generation *(added 2026-03-07)*
```

---

## STEP 5: Update Notion Backlog

**Tool 1:** `notion-fetch` to read current backlog state

**Parameters:**
- `id`: `3182b241dfb081b9af78c279eef405cf`

**Tool 2:** `notion-update-page` to replace the Content Strategy & Architecture section

**Parameters:**
- `page_id`: `3182b241dfb081b9af78c279eef405cf`
- `command`: `replace_content_range`
- `selection_with_ellipsis`: `## Content Strategy...all 5 pending items` (approximately — adjust based on actual fetched content to capture the entire section)
- `new_str`: Updated section with tasks marked complete and reference docs added (exact text depends on current backlog structure, but pattern is):

```markdown
## Content Strategy & Architecture ✅ Complete (2026-03-07)

*Design docs: **`Docs/plans/2026-03-06-content-strategy.md`**. Culture bounded context design: **`Docs/plans/2026-03-06-culture-bounded-context-design.md`**. Narrative context design: **`Docs/plans/2026-03-07-narrative-context-design.md`**. 57 new tests across 3 test files (45 culture + 12 narrative context), 1,150 new lines (950 culture-content.ts + 200 narrativeContext.ts).*

- [x] Culture Bounded Context design — design rationale for culture traits, locations, artifacts, beats, modifiers system (`Docs/plans/2026-03-06-culture-bounded-context-design.md`)
- [x] Archetype Content Enrichment — 19 archetypes enriched with tone, beats, vignettes, requirements (894 lines, 53 tests) (`src/data/archetype-content.ts`)
- [x] Culture Content Data implementation — 950-line culture package with trait budgets, locations, artifacts, beats, composites (45 tests) (`src/data/culture-content.ts`)
- [x] Narrative Context Builder — 3-stage engine harvesting, scoring, synthesizing narrative context (200 lines, 12 tests) (`src/engine/narrativeContext.ts`)
```

**Tool 3:** `notion-update-page` to add reference docs at end of Reference Documents section

**Parameters:**
- `page_id`: `3182b241dfb081b9af78c279eef405cf`
- `command`: `insert_content_after`
- `selection_with_ellipsis`: (find the Reference Documents section header or last ref doc entry)
- `new_str`:
```
- `Docs/plans/2026-03-07-culture-content-design.md` — Culture content data design (structure, validation rules, palette patterns)
- `Docs/plans/2026-03-07-narrative-context-design.md` — Narrative context pipeline design (harvest/score/synthesize stages, opposition scoring, integration points)
```

---

## STEP 6: Commit Documentation Changes

**Tool:** `Bash` to execute git commit

**Command:**
```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && \
git add CLAUDE.md && \
git commit -m "docs: update project status for culture content & narrative context completion

- Added culture-content.ts (950 lines, 45 tests) to changelog
- Added narrativeContext.ts (200 lines, 12 tests) to changelog
- Updated Project Status: Content Strategy & Architecture now complete
- Updated engine stats: 69 modules, 10,850 lines, 1,084 tests
- Updated content stats: 9 packages (culture-content.ts implemented)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Execution Order & Dependencies

The tools must be executed in this order:

1. **Edit CLAUDE.md (changelog)** — filesystem tool, no dependencies
2. **Edit CLAUDE.md (project status)** — filesystem tool, depends on #1 being visually complete
3. **obsidian_append_content (Culture Content Data)** — creates new vault note, no dependencies
4. **obsidian_append_content (Narrative Context)** — creates new vault note, no dependencies
5. **obsidian_get_file_contents (Index.md)** — read current vault state
6. **obsidian_append_content (Index.md)** — update vault index, depends on #5
7. **notion-fetch (Backlog)** — read current backlog
8. **notion-update-page (Content Strategy section)** — replace backlog section, depends on #7
9. **notion-update-page (Reference docs)** — add backlog references, depends on #7
10. **Bash git commit** — commit CLAUDE.md, depends on #1-2 complete

---

## Success Criteria

After execution:

- CLAUDE.md changelog has 2 new rows for 2026-03-07 tasks ✓
- CLAUDE.md Project Status shows Culture & Narrative Context complete ✓
- CLAUDE.md engine/content stats updated ✓
- Obsidian vault has Culture Content Data.md system note ✓
- Obsidian vault has Narrative Context Pipeline.md system note (or updated existing) ✓
- Obsidian Index.md has new section with links to both systems ✓
- Notion backlog Content Strategy & Architecture marked complete ✓
- Notion backlog has reference doc links for new design docs ✓
- Git commit logged CLAUDE.md changes with proper message format ✓
