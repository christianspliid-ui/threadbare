# P1 — Content Census Instrument (implementation spec)

**Author:** Cowork · **Date:** 2026-06-22 · **Status:** Ready for Dev
**Parent program:** THR-469 / `2026-06-22-cross-content-variety-and-coverage-program.md` · **Grill-me:** `2026-06-22-cross-content-coverage-grill-me.md`

## Goal

A headless, deterministic tool that measures **content coverage across the reach × scale matrix, per content type**, flags deserts, and lists untagged entries. It is the sibling of the THR-457 KPI harness — measurement before authoring. Everything downstream in THR-469 re-bases on its output.

## Why first

Director decisions (grill-me): global catalog completeness, uniform fill, audit-first. None of that is actionable until we can see, per cell, what exists. Raw counts deceive (200 encounters looked fine but one fires 37%); this instrument replaces counts with cell-fill.

## Scope

**In:** a read-only census over all *authored player-encountered* content types: encounters (branching + ambient + family templates), attachments/items (`reward-attachment-catalog`, `starter-attachments`), conditions (`condition-trait-content`), spells (`spell-templates`), artifacts (`artifact-templates`), omens (`omenTemplates`), sublocations (`phaseSublocations` + types), non-encounter actions (`action-template-content`).

**Out:** generative systems (agent/culture/faction generation); elder/foundation-sphere content; authoring anything; UI dashboard (deferred — see UI pillar).

## Matrix definition

- **Primary spine (the cells):** `contentType × reach(8) × scale(4)`. Reaches: iron, gold, shadow, veil, heart, eye, stone, star. Scales: cosmic, regional, local, personal.
- **Cell threshold:** `CONTENT_CELL_MIN = 5`. A cell is *filled* at ≥5, *desert* at 1–4, *empty* at 0, or *N/A* (see below).
- **Scale applicability (N/A handling — REQUIRED):** not every type spans all 4 scales. Define `SCALE_APPLICABILITY: Record<ContentType, ActionScale[]>` as a named constant (first-guess defaults below; tune in review). Cells outside a type's applicable scales render **N/A**, never counted as deserts.
  - encounters: local, regional, cosmic, personal
  - actions: local, regional, cosmic, personal
  - sublocations: local (only)
  - attachments/items, artifacts: local, regional, cosmic (no personal)
  - conditions: personal, local
  - spells: local, regional, cosmic
  - omens: regional, cosmic
- **Secondary fill (reported within cells, not part of the threshold):** archetype-pole (16), rarity tier, location-subtype. Report distribution but do not gate on it in v1.

## Tag resolution

For each content entry, resolve `(contentType, reach, scale)`:
- `contentType` = source registry.
- `reach` = entry's `reach` field.
- `scale` = entry's `scale` / `ActionScale` field.
- Entries missing reach **or** scale go to an **`untagged`** bucket per type — this list IS the audit-first prerequisite output (what must be tagged before the catalog can be measured). Never throw on missing fields (fail-soft).

## Output

Dated report `Docs/playtests/coverage/YYYY-MM-DD-content-census.{md,json}`:
1. **Per-type heatmap** — reach×scale grid with counts; cells marked filled / desert / empty / N/A.
2. **Desert list** — every `(type, reach, scale)` with 1–4 entries (the author-against list).
3. **Empty list** — applicable cells with 0 entries (the highest-priority deserts).
4. **Untagged list** — entries missing reach/scale, per type (the re-tag worklist).
5. **Summary** — per type: % of applicable cells filled; total entries; untagged count.
6. JSON twin for tooling.

## Three pillars

- **Engine:** new pure module `src/engine/contentCensus/` (matrix builder + tag resolver, no side effects) + `scripts/content-census.ts` runner mirroring `scripts/gameplay-report.ts` (esbuild bundle → node, `npm run content-census`). Deterministic; no PRNG.
- **Content:** N/A for authoring — but the **untagged list** is a content-facing deliverable (the re-tag worklist). If a content type carries no reach/scale field at all, that's a finding, not a blocker: report it and proceed.
- **UI:** v1 output is markdown + JSON (CLI artifact). The interactive **coverage dashboard** is explicitly deferred to a follow-up (file as a P1.5 issue); mark N/A for runtime UI in v1.

## Constants (NFP #1)
`CONTENT_CELL_MIN = 5`; `SCALE_APPLICABILITY` (table above); `CENSUS_REACHES` (8); `CENSUS_SCALES` (4). All in one constants file.

## Tracing / fail-soft (NFP #2/#4)
Pure read tool — no runtime traces. Fail-soft: any entry that can't resolve a field → `untagged` bucket with reason; a content registry that can't be loaded → skip with a logged warning, never abort the whole run.

## Acceptance / Done when
- `npm run content-census` produces the dated md+json report covering all in-scope types.
- Report renders the reach×scale heatmap per type with filled/desert/empty/**N/A** correctly distinguished (N/A driven by `SCALE_APPLICABILITY`).
- Desert, empty, and untagged lists are present and accurate (spot-check ≥2 types against manual counts).
- Deterministic: two runs on the same source produce identical output.
- Verification evidence (raw `npm run content-census` tail + `npm test`/`tsc`/`vite build`) in the closing commit/comment.

## Coordination block
**Suggested model:** sonnet
**Parallel-safe with:** all content-authoring work and THR-464/465 tuning (read-only over content data; new files only)
**Mutex with:** none (no shared files; only adds new module + script + npm script)
**Codex review:** no (instrument verified by its own deterministic output + spot-checks)

## Follow-ups to file
- **P1.5** — coverage dashboard UI (render census json as an interactive heatmap for the director).
- **P0.5** — automated prose-quality eval harness (quality gate dependency for mass authoring).
