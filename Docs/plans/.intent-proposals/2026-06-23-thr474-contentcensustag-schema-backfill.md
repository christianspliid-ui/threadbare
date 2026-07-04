# Action Proposal — THR-474 ContentCensusTag schema backfill

## intent_quote

The originating ask is Christian's THR-474 issue (no direct chat message; surfaced by THR-473's forked structural audit and authored into Linear by Christian):

> **Scope:** Add an additive entry-level `ContentCensusTag { reach: ReachDomain; scale: ActionScale }` (or equivalent agreed shape) to the thin registries, **backfilled from** THR-473's untagged worklist … Additive only (NFP #6) — no behavioral change to how entries resolve at runtime; the tag is metadata the census reads.

> **Needs design before handoff:** Cowork pass to settle the tag shape (single dominant reach vs multi-reach set; how `scale` is assigned to inherently scale-less types like conditions/omens; whether N/A-scale types get an explicit sentinel). Not yet a CC handoff — design after THR-473's first run reveals the true magnitude per registry.

Program intent (THR-469, director-asked): "generate more variety and coverage across all content types," measurement-before-authoring.

## scope (what this plan does)

Settles the `ContentCensusTag` shape and adds it, additively, to the 6 thin content registries (attachments, spells, artifacts, conditions, omens, sublocations) so THR-473's census can place their entries in the reach×scale heatmap. Defines a new `ContentCensusTag {reach: CensusReach; scale: CensusScale}` type in `contentCensus/types.ts`, an optional `censusTag?` field on each registry entry interface, an adapter precedence rule (explicit tag > existing derivation > null), a `dominantReachFromContributions` helper for conditions, an `'n/a'` sentinel distinct from untagged-null, four named constants, and authoring heuristics for the bulk tag values driven by THR-473's untagged worklist.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT change how any entry resolves at runtime (no gameplay behavior change; tag is census-only metadata).
- Does NOT modify `ReachDomain` or `ActionScale` source types — imports them, defines new `CensusReach`/`CensusScale` aliases in the census module.
- Does NOT tag `actions` scale (kept inferred-not-authored per THR-473 §2) or re-touch `encounters` (already resolves).
- Does NOT author the P2 "desert-filling" content — this issue only makes the cells measurable; P2 authoring is downstream.
- Does NOT add any game-facing UI (census output is the existing CLI md/json artifact).
- Does NOT introduce a multi-reach-per-entry model (rejected — would corrupt fill%).

## impact_class

Reversible. (Additive optional field + new census-module code + bulk metadata values; no destructive edits, no external side effects, fully revertible.)

## evidence cited

- **Linear issue:** THR-474 (parent THR-469; prereq THR-473 Done)
- **Vision premises invoked:** none changed. Reach/scale semantics per cosmology (iron/gold/shadow/veil/heart/eye/stone/star; cosmic/regional/local/personal).
- **UL terms touched:** Reach, Scale — existing UL terms, no new terms; no `UL-proposal` needed.
- **Canon pages consulted:** `Docs/canon/cosmology.md` (Reaches/Spheres) for reach assignment heuristics.
- **Prior plan docs this builds on:** `Docs/plans/2026-06-22-content-census-p1-design.md` (governance-pass adapter design — wins), `Docs/plans/2026-06-22-content-census-p1-spec.md`, `Docs/plans/2026-06-22-cross-content-variety-and-coverage-program.md`.
- **Rejected approaches considered and dismissed:** multi-reach set per entry (corrupts one-entry-one-cell fill%); putting `ContentCensusTag` in `traits.ts` (touches 156-importer file unnecessarily); leaving conditions/omens permanently untagged (defeats the census purpose).

## load-bearing decisions touched

- **"Everything is a graph node/edge / additive over destructive changes" (NFP #6):** respected — `censusTag?` is an optional additive field; no existing field changes shape or semantics.
- **"Reaches and Spheres are orthogonal axes":** respected — reach assignment uses the activity-reach axis; no sphere conflation.
- **"No inventing node types":** respected — `ContentCensusTag` is a metadata interface on existing entries, not a new graph node type.

## high-impact files touched (from Codesight)

None modified. `src/types/traits.ts` (`ReachDomain`, 156 importers) and `src/types/unifiedAction.ts` (`ActionScale`) are imported only. New type in `src/engine/contentCensus/types.ts` (low importer count). The 6 entry-interface edits add one optional field each to modest-importer data types. No ≥100-importer file changes → no Blast Radius section required.

## kill criteria

If, after backfill, the re-run census still cannot drop the 6 registries' untagged counts to ~0 — i.e. the single-dominant-reach model proves too lossy to represent real entries (e.g. many entries genuinely need multi-reach to be meaningful) — the tag shape is wrong. Response: revert the optional fields (additive, trivially revertible) and reopen the shape question (likely a weighted multi-reach census variant, which is a larger THR-469 design change). Also wrong if `'n/a'` proves overused (>~10% of an applicable registry tagged n/a), signalling the SCALE_APPLICABILITY subsets are mis-specified rather than the entries being non-applicable.

## explicit user sign-off

N/A — Reversible class, not High-risk. Originating intent is Christian-authored THR-474 within director-asked program THR-469.

## author notes for the judge

This is the explicit "Cowork design pass" THR-474 asked for, run after its `blocked by` prereq (THR-473) reached Done. The three named design questions are answered in plan §2 (D1 single-dominant-reach, D2 scale-from-SCALE_APPLICABILITY-subset, D3 three-state real/n-a/null). The plan deliberately minimizes new authoring by deriving reach where signal exists (effects[] for attachments/spells/artifacts; domainContributions for conditions) and authoring explicitly only where there is no signal (omens). The one area of genuine judgment left to the executor is per-entry dominant reach/scale, bounded by documented heuristics and the SCALE_APPLICABILITY subsets. UI pillar is N/A-with-rationale (headless data artifact) — flagged Browser-verify exempt.