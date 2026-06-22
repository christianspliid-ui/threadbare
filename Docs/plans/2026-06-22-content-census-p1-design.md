# Content Census P1 — Design (governance-pass output)

**Author:** Cowork · **Date:** 2026-06-22 · **Status:** Ready for Dev (revised)
**Parent program:** THR-469 / `2026-06-22-cross-content-variety-and-coverage-program.md`
**Supersedes the resolver section of:** `2026-06-22-content-census-p1-spec.md` (that spec remains the baseline; this doc records the governance-pass revisions and the coverage-shape reconciliation).
**Governance:** director endorsement (census-first) + grill-me (`2026-06-22-cross-content-coverage-grill-me.md`) + forked structural/intent audit (2026-06-22, verdict **Revise** — must-fixes integrated below).

## What this doc adds

The original P1 spec is directionally right and NFP-clean, but the forked audit surfaced one load-bearing flaw and one director-decision conflict. This doc resolves both so the issue can ship to an executor.

## 1. Coverage-shape reconciliation (uniform vs weighted)

**The conflict (and how it arose).** The same-day grill-me recorded director verdicts "Global catalog completeness" and "Uniform fill — not weighted-by-playtime" — a full-context decision. A later keep-work-flowing grill (2026-06-22) re-asked the same question without first reading that grill-me and framed "weighted" as the recommended option, eliciting the opposite answer. The director flagged the double-ask; **the earlier, considered verdict governs: uniform fill / global catalog completeness.**

**Resolution — it does not change P1.** The census *measures raw, neutral cell-fill* regardless of strategy, so the conflict never reached the instrument's core. The uniform/weighted choice only governs **authoring order (P2+)**, not measurement. The instrument is built **strategy-agnostic** and additionally emits an exposure-weighted desert-priority ranking as a separate, **non-gating** column, so the artifact serves either strategy. Per the governing verdict the default ranking lens is **uniform**; switching to weighted is a one-constant change. Any revisit of weighted-vs-uniform for P2 authoring order is a future director call with census data in hand — flagged on THR-469.

New constants (NFP #1):

- `SCALE_EXPOSURE_WEIGHTS: Record<ActionScale, number>` — relative player-exposure weight per scale (local/personal high, regional mid, cosmic low). Drives the weighted desert-priority column and honors the grill-me §4.1 wave-1 = local+regional recommendation.
- `DESERT_PRIORITY_MODE: 'uniform' | 'weighted'` — default `'uniform'` (per the governing grill-me verdict). Selects the ranking lens; does not change raw cell-fill measurement.

## 2. Load-bearing fix — per-type tag-resolution adapter layer (MUST-FIX)

**The flaw.** The spec's resolver assumes `entry.reach` + `entry.scale` on every entry. Code reality (audited 2026-06-22):

| Registry | `reach` | `scale` |
|---|---|---|
| branching encounter files (e.g. `arcane-circle-encounter-content.ts`) | present | **present** (`scale: 'local'`) |
| `action-template-content.ts` | entry-level `reach: ReachDomain` | absent |
| `reward-attachment-catalog.ts` (~328) | **nested in `effects[]`** (often multiple per entry) | absent |
| `spell-templates.ts`, `artifact-templates.ts` | nested in effects/costs only | absent |
| `omenTemplates.ts` | absent/indirect | absent |
| `condition-trait-content.ts` | absent | absent |
| `phaseSublocations.ts` (**path: `src/engine/`, not `src/data/`** — Gold reach only) | absent | absent |

Without a fix, 6 of 8 in-scope types resolve to `untagged` → the first run is a ~1,000-entry untagged dump, not a heatmap. The instrument cannot measure a dimension the data does not encode.

**The fix.** P1 must implement a **per-registry tag-resolution adapter**, not a uniform field read. For each registry, name explicitly how `(reach, scale)` is derived:

- Encounters, actions → explicit entry-level `reach`; encounters → entry-level `scale`; actions → `scale` from `ActionScale` where present, else `untagged`.
- Attachments / spells / artifacts → **dominant-reach** derived from `effects[]` (documented tie-break: highest-weight effect; ties → `multi` flag, still counted), `scale` → `untagged` pending backfill.
- Conditions / omens / sublocations → documented `null → untagged` (no classification axis exists yet).

The adapter table itself is a named, reviewable artifact in the module.

## 3. Reframed primary deliverable

P1's headline output is **not** a pretend-complete heatmap. It is:

1. **Resolvability report** — per registry, the **% of entries that carry a resolvable `reach` / `scale`** vs. those requiring schema backfill. (New acceptance criterion.)
2. **Untagged / re-tag worklist** — the catalog-scale list of entries needing a classification tag. This is the audit-first prerequisite output and the input to the backfill issue (§4).
3. The reach×scale heatmap + desert/empty/N/A lists **for the types that already resolve** (encounters, actions), plus the weighted-priority column.

This sets honest expectations: wave-1 output is a re-tag worklist of catalog scale, which re-bases the whole program.

## 4. Precursor/sibling dependency — ContentCensusTag schema backfill

The real audit-first blocker for P2 authoring is that the thin registries have **no cell to author into** until they carry a classification tag. File a sibling issue under THR-469:

> **Add an entry-level `ContentCensusTag { reach, scale }` (or equivalent) to the thin content registries** (attachments, spells, artifacts, conditions, omens, sublocations), backfilled from the census untagged worklist. Engine-additive (NFP #6); the census re-run then produces a real heatmap.

Sequencing: **P1 census (now)** → produces resolvability report + untagged worklist → **backfill issue** (tag the thin registries) → **re-census** → P2 authoring into measured deserts. P1 is not blocked by the backfill; it produces the backfill's worklist.

## 5. Three pillars

- **Engine** — pure module `src/engine/contentCensus/` (matrix builder + **per-registry tag-resolution adapter** + weighted-priority ranker, no side effects, no PRNG) + `scripts/content-census.ts` runner mirroring `scripts/gameplay-report.ts` (esbuild→node, `npm run content-census`). Deterministic.
- **Content** — N/A for authoring in P1; the untagged worklist (§3.2) is the content-facing deliverable. The backfill issue (§4) is where content tags get written.
- **UI** — v1 output is markdown + JSON CLI artifact (`Docs/playtests/coverage/YYYY-MM-DD-content-census.{md,json}`). Interactive coverage dashboard deferred to P1.5 (N/A runtime UI in v1).

## 6. Constants (NFP #1)

`CONTENT_CELL_MIN = 5`; `SCALE_APPLICABILITY` (per-type applicable scales — N/A vs empty); `CENSUS_REACHES` (8); `CENSUS_SCALES` (4); **`SCALE_EXPOSURE_WEIGHTS`** (new); **`DESERT_PRIORITY_MODE='uniform'`** (new, per governing verdict). One constants file.

## 7. Tracing / fail-soft (NFP #2 / #4)

Pure read tool — no runtime traces. Fail-soft: any entry that can't resolve a field → `untagged` bucket with a reason string; a registry that can't be loaded → skip with a logged warning, never abort the run. A registry with no classification axis at all → reported as a finding (feeds §4), not a crash.

## 8. Acceptance / Done-when

- `npm run content-census` produces the dated md+json report over all in-scope types via the per-registry adapter (§2).
- **Resolvability report present**: per registry, % entries with resolvable reach/scale vs. needing backfill (§3.1).
- Untagged worklist present and accurate (§3.2); heatmap + desert/empty/**N/A** lists correct for resolvable types; weighted desert-priority column present (`DESERT_PRIORITY_MODE`).
- Deterministic: two runs on identical source → identical output.
- `phaseSublocations.ts` correctly read from `src/engine/` and reported as Gold-only (the 7-reach hole).
- Verification evidence (raw `npm run content-census` tail + `npm test` / `tsc` / `vite build`) in the closing commit/comment.

## 9. NFP self-audit

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all thresholds/weights named constants incl. the two new ones |
| 2 Inspectability | PASS — the census report itself is the inspection surface; adapter table is explicit |
| 3 Determinism | PASS — no PRNG; two-run-identical in acceptance |
| 4 Fail-soft | PASS — untagged bucket + skip-with-warning; no-axis registry → finding not crash |
| 5 Narrative > mechanical | N/A — offline instrument |
| 6 Additive | PASS — new module + script only; backfill issue (§4) is additive schema |
| 7 Performance | PASS — offline, one pass over static registries |

## 10. Coordination block (handoff)

- **Suggested model:** sonnet (adapter-layer judgment across heterogeneous registries; not mechanical)
- **Parallel-safe with:** THR-464, THR-448, all content-authoring (read-only over content data; adds new files only)
- **Mutex with:** none
- **Codex review:** no (instrument verified by its own deterministic output + spot-checks)
- **Blocks:** the ContentCensusTag backfill issue (§4) consumes P1's untagged worklist
- **Load first:** `2026-06-22-content-census-p1-spec.md` (baseline), this doc (revisions), `scripts/gameplay-report.ts` (runner pattern), `Docs/canon/cosmology.md` (reach/scale definitions)

## 11. Follow-ups to file

- **ContentCensusTag schema backfill** (§4) — sibling under THR-469, the audit-first blocker for P2.
- **P1.5** — coverage dashboard UI (render census JSON as interactive heatmap).
- **P0.5** — automated prose-quality eval harness (quality-gate dependency for mass authoring).
- **THR-469 P2 gate** — director verdict uniform vs weighted authoring order, with census data in hand.
