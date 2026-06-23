# ContentCensusTag — schema plumbing + sublocation tag persistence (THR-474)

**Date:** 2026-06-23
**Issue:** THR-474 (re-scoped — see "Scope decision" below)
**Project:** Content Architecture
**Parent:** THR-469 (Cross-Content Variety & Coverage program) · **Blocked by:** THR-473 (Done — census instrument shipped, commit `c4d20d37`, PR #374)
**Executor:** Codex (mechanical schema/type addition)

---

## Scope decision (read first)

THR-474 originally read "add entry-level **reach/scale**" to the six thin registries. The THR-473 census run (which shipped the per-registry resolution adapter) revealed that the work is **not uniformly mechanical**:

| Slice | Nature | Queue |
|-------|--------|-------|
| Define the tag type + add the optional field to all 6 registry entry types | Pure additive schema plumbing — zero judgment | **Codex (this issue)** |
| Persist the 7 hard-coded sublocation tags (`gold`/`local`) + de-hardcode the adapter | Mechanical — values are constants already in the adapter | **Codex (this issue)** |
| Author `scale` for ~177 entries (attachments, artifacts, spells, conditions, omens) | No derivation exists; requires a per-entry rubric (is a *wounded* condition `personal` or `local`? is a spell `regional` or `cosmic`?) | **CC follow-up** |
| Author `reach` for conditions (6) + omens (44) + the ~10 effect-less attachments/spells | No `reach` axis in those schemas — genuine authoring | **CC follow-up** |

Per the coordination protocol's Codex-fit heuristic, the judgment-heavy value authoring must **not** go to Codex. This issue is therefore re-scoped to the mechanical slice only. The value-authoring slice is spun into a new follow-up (**THR-477**, CC-fit, blocked-by THR-474) which needs its own design pass to write the scale-assignment rubric.

**Net effect:** Codex lands the schema so the field *exists everywhere*; the follow-up only ever authors values, never touches type definitions. Clean Codex/CC boundary: Codex owns types, CC owns judgment-laden values.

---

## Why persist data at all (and why so little)

The census adapter (`src/engine/contentCensus/adapters.ts`) **already derives `reach` at runtime** for attachments/spells/artifacts via `dominantReachFromEffects(effects)`, and **already hard-codes** sublocation reach/scale (`gold`/`local`). Persisting the *derivable* reach would duplicate a derivation that goes stale the moment an entry's `effects[]` change — so this issue does **not** persist derivable reach. It persists only:

1. **The tag schema** — so authored axes (scale; condition/omen reach) have a home.
2. **The 7 sublocation tags** — because those values are *hard-coded in the adapter*, not derived from data. Moving them onto the specs removes a hard-code and is a strict improvement.

The derive-vs-persist policy for the effect-derivable types is explicitly left to the THR-477 design pass.

---

## Engine pillar

### New type — `src/types/contentCensus.ts` (new file)

Define `ContentCensusTag` in `src/types/` (not in `src/engine/contentCensus/`) so `src/data/*` registries can import it without a data→engine dependency. Both axes optional — `reach` may be authored independently of `scale`.

```ts
import type { ReachDomain } from './traits';        // 8 reaches: iron|gold|shadow|veil|heart|eye|stone|star
import type { ActionScale } from './unifiedAction';  // cosmic|regional|local|personal

/**
 * Additive, entry-level coverage classification read by the Content Census
 * (THR-473 instrument / THR-474 backfill). Metadata only — no runtime behaviour.
 * Both axes optional: an entry may carry an authored `scale` before its `reach`
 * is settled, or vice-versa.
 */
export interface ContentCensusTag {
  reach?: ReachDomain;
  scale?: ActionScale;
}
```

`ReachDomain` is confirmed at `src/types/traits.ts:59`; `ActionScale` at `src/types/unifiedAction.ts:18`. This mirrors exactly the imports the census module already uses.

### Add optional field to the 6 registry entry types

Add `censusTag?: ContentCensusTag;` to each. Two registries are `GraphNode`-backed — the field goes on the **node-properties** interface (NOT on the shared `GraphNode` type in `graph.ts`, which has 370 importers — do not touch it). The other four are plain typed-array entries — the field is a top-level entry member.

| Registry | File | Entry type (confirmed line) | Field placement |
|----------|------|------------------------------|-----------------|
| Attachments | `src/types/attachments.ts` | `PossessionNodeProperties` (`:79`) | inside node `properties` |
| Conditions | `src/types/traits.ts` | `TraitDefinitionProperties` (`:71`) | inside node `properties` |
| Spells | `src/types/effects.ts` | `SpellTemplate` (`:823`) | top-level entry field |
| Artifacts | `src/data/artifact-templates.ts` | `ArtifactTemplate` (`:13`, inline) | top-level entry field |
| Omens | `src/types/omen.ts` | `OmenTrackTemplate` (`:60`) | top-level entry field |
| Sublocations | `src/engine/phaseSublocations.ts` | `ConditionalSublocationSpec` (`:75`) | top-level entry field |

Each addition is a single optional property + an `import type { ContentCensusTag } from '<relative path>/contentCensus';`. No existing field changes.

### Export + populate sublocations

In `src/engine/phaseSublocations.ts`:
1. Change `const GOLD_SUBLOCATION_SPECS` (`:90`) to `export const GOLD_SUBLOCATION_SPECS`. (The census adapter imports this symbol; on current origin/main the export must already exist if THR-473 merged — verify in pre-flight, add if missing.)
2. Add `censusTag: { reach: 'gold', scale: 'local' }` to **every** entry in `GOLD_SUBLOCATION_SPECS` (Gold phase is the only sublocation phase that exists; all entries are `gold`/`local`).

### De-hardcode the adapter

In `src/engine/contentCensus/adapters.ts`, update `resolveSublocations` to read the persisted tag with the old hard-codes as fallback, preserving identical output:

```ts
// before: reach hard-coded 'gold', scale hard-coded 'local'
reach: spec.censusTag?.reach ?? 'gold',
scale: spec.censusTag?.scale ?? 'local',
```

No other adapter function changes. `dominantReachFromEffects` and the null-resolution for conditions/omens stay exactly as shipped.

### Constants — none new

This issue introduces no tunable numbers. (`ContentCensusTag` is a type; the sublocation values are domain constants, not tunables.)

### Tracing — N/A

No tick-loop participation, no PRNG, no runtime behaviour. Metadata read only by the offline census script.

### Fail-soft

| Case | Behaviour |
|------|-----------|
| Entry has no `censusTag` | Field is optional → `undefined`; adapter falls back to existing derivation/hard-code. No change from today. |
| Sublocation spec missing `censusTag` | `?? 'gold' / 'local'` fallback yields the pre-THR-474 value. Census output unchanged. |

---

## Content pillar

**N/A for this issue.** No content values are authored here beyond the 7 sublocation constants (which are mechanical domain facts, not authored prose/judgment). All judgment-laden value authoring is THR-477.

---

## UI pillar

**N/A.** The census surfaces results via the offline CLI artifact (`Docs/playtests/coverage/YYYY-MM-DD-content-census.{md,json}`), already shipped by THR-473. No player-facing surface, no HexMap signifier, no debug-panel change. (Per the three-pillar rule, UI is explicitly marked N/A with rationale: this is metadata schema plumbing with no runtime/render footprint.)

---

## Wiring

- **Consumer:** `src/engine/contentCensus/adapters.ts` `resolveSublocations` now reads `spec.censusTag`. No new orchestrator phase, GameState field, modal, or player control.
- **Re-run gate:** after the change, `npm run content-census` must produce a sublocations row identical to the pre-change run (7 entries, 100% resolvable, `gold`/`local`). All other registry rows unchanged.

---

## Blast Radius

Two touched files exceed/approach the high-impact threshold:

- **`src/types/traits.ts`** (~156 importers) — change is **adding one optional property to `TraitDefinitionProperties`**. `ReachDomain` itself is untouched. Adding an optional field to an interface is non-breaking; no importer must change. Cascade risk: negligible.
- **`src/types/effects.ts`** / **`src/types/attachments.ts`** / **`src/types/omen.ts`** — high-fanout type modules, but again only an additive optional field on one interface each. Non-breaking.

No change to `graph.ts`, `ReachDomain`, `ActionScale`, or any node-creation site. `npx tsc --noEmit` is the guard — if any addition were breaking, the typecheck fails.

---

## NFP compliance

| NFP | Verdict |
|-----|---------|
| 1 Tunability | PASS — no magic numbers introduced |
| 2 Inspectability | PASS — census artifact already reports per-registry resolvability |
| 3 Determinism | PASS — no PRNG; census output deterministic |
| 4 Fail-soft | PASS — optional field + `??` fallbacks (table above) |
| 5 Narrative-over-mechanical | N/A — schema metadata |
| 6 Additive-over-destructive | PASS — every change is an additive optional field; zero existing-field edits |
| 7 Performance | PASS — offline metadata, no tick-loop cost |

---

## Codex pre-flight (verify before coding)

1. **You are on current `origin/main`.** The THR-473 census module (`src/engine/contentCensus/`) and the `Docs/playtests/coverage/` artifact must be present. If `src/engine/contentCensus/adapters.ts` is absent, STOP and flag — THR-473's merge has not propagated and this issue cannot land yet. (The plan was authored from a Cowork checkout that was 36 commits behind main; paths below are confirmed stable on main but the census module was verified via the THR-473 worktree, not this checkout.)
2. Confirm `GOLD_SUBLOCATION_SPECS` export status at `src/engine/phaseSublocations.ts` — add `export` if THR-473 did not.
3. Confirm the six entry-type line numbers (they may have drifted): grep the interface names rather than trusting line numbers.

---

## Done when (binary)

- [ ] `src/types/contentCensus.ts` exists, exports `ContentCensusTag` with both members optional, importing `ReachDomain` from `./traits` and `ActionScale` from `./unifiedAction`.
- [ ] Optional `censusTag?: ContentCensusTag` added to all six entry types: `PossessionNodeProperties`, `TraitDefinitionProperties`, `SpellTemplate`, `ArtifactTemplate`, `OmenTrackTemplate`, `ConditionalSublocationSpec`.
- [ ] `GOLD_SUBLOCATION_SPECS` is `export`ed; every entry carries `censusTag: { reach: 'gold', scale: 'local' }`.
- [ ] `resolveSublocations` reads `spec.censusTag?.reach ?? 'gold'` / `?? 'local'`; no other adapter function changed.
- [ ] **No value changes** to attachments, spells, artifacts, conditions, or omens entries (only their *type* gains the optional field).
- [ ] `npm run content-census` sublocations row is identical to the pre-change run (7 entries / 100% resolvable / gold-local); all other rows unchanged.
- [ ] `npx tsc --noEmit`, `npm test`, `npx vite build` all clean — raw tails pasted in the closing comment.
- [ ] Closing commit body: `Fixes THR-474`.

---

## Follow-up (CC, do not do here)

**THR-477 — Content Census value authoring: scale axis + condition/omen reach.** Authors `censusTag.scale` for all applicable entries (per `SCALE_APPLICABILITY`) and `censusTag.reach` for conditions, omens, and effect-less attachments/spells. Requires a design pass to write the scale-assignment rubric. Blocked-by THR-474. Routes to Ready for Dev after design.
