# Action Proposal — THR-467 Phase 0 (Encounter Surface Foundation)

## intent_quote

> lets look at getting more work through design and into ready for dev before bedtime

> [In response to "Where should I focus the design effort tonight to maximize Ready-for-Dev throughput?"]
> THR-467 Phase 0

## scope (what this plan does)

Decomposes Phase 0 of the director-endorsed encounter-volume-scaling design (THR-467) into one
implementation-ready Ready-for-Dev unit. Phase 0 introduces an "encounter surface" naming layer:
a pure `computeSurfaceKey(entry)` derivation over context axes already present on
`EncounterCacheEntry` (sublocation type, reach, social role); re-keys the existing novelty/recency
tracking from `templateId` to that surface key (an immediate structural assist to THR-464 template
concentration); adds a tunable volume/replayability model script; and adds trace + Debug-Panel
visibility into which surface fired. It authors no encounter content and builds no
context-multiplication machinery.

## scope (what this plan does NOT do — explicit non-goals)

- No Tier-2 context-fragment authoring format or fragment tables (Phase 2).
- No `template-context-rewrite` skill (Phase 2).
- No Tier-3 procedural grammar (Phase 3).
- No per-run pool partitioning or `RUN_POOL_MIN_ELIGIBLE` enforcement (Phase 4 — the model script
  only *computes* the target; it does not enforce it).
- No retuning of novelty half-life constants (reused unchanged; retune at Phase 1 if KPI warrants).
- No new authored encounter content of any tier.
- No player-facing UI change beyond Debug-Panel inspection (surfaces render as templates do today).

## impact_class

Reversible. New module + new script + one optional cache field + a key-semantics change to an
existing record. No external side effects. The behavior-affecting part (selection distributions
shift because novelty is now surface-granular) is covered by determinism + engine-smoke gates and
is revertible by restoring the `templateId` argument at the two call sites.

## evidence cited

- **Linear issue:** THR-467 (parent), new Phase 0 child to be created
- **Vision premises invoked:** narrative-over-mechanical tiebreaker (NFP #5); replayability-first
  premise (parent design doc problem statement)
- **UL terms touched:** "encounter surface" is introduced as a distinct unit from "encounter
  template" — recommend a `UL-proposal` issue to formalize "surface" vs "template" vs "encounter"
  in the Encounters shard (flagged in handoff, not blocking Phase 0 code)
- **Canon pages consulted:** `Docs/canon/encounters.md` (current format = UnifiedActionTemplate;
  EncounterTemplate removed; intel never hides candidates)
- **Prior plan docs this builds on:** `Docs/plans/2026-06-22-encounter-volume-scaling-design.md`;
  companion audit `Docs/audits/2026-06-22-encounter-content-and-delivery-assessment.md`
- **Rejected approaches considered and dismissed:** pure-bespoke-at-volume and
  pure-combinatorial-generation (both rejected as backbone in the parent doc); Phase 0 commits to
  neither — it only builds the surface-naming layer common to the endorsed hybrid.

## load-bearing decisions touched

- **"Everything is a graph node/edge."** Respected — surface key is a *derived identity string* for
  recency bookkeeping, not a new node type or a relationship. No new node/edge type introduced.
- **Additive over destructive (NFP #6).** Respected — new module, optional field, new script; no
  type signatures broken; old novelty keys decay rather than requiring migration.
- **No inventing node types without verification.** Respected — `surfaceKey` is a string key, not a
  node. Explicitly not a graph entity.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` (176 importers) — **no signature change**; `encounterNoveltyRecord`
  already exists, only key semantics change. Blast Radius section present in plan doc.
- `src/engine/encounterScoring.ts` (high engine fan-in) — `computeNoveltyMultiplier` signature
  unchanged (still `string` key); only the argument passed changes.
- `EncounterCacheEntry` (`src/engine/encounterCache.ts`) gains one optional field — additive.

## kill criteria

- If the 30-tick CLI engine smoke shows a selection-distribution regression (e.g. agents stall, or
  one surface dominates harder than before), Phase 0 is wrong on its premise and reverts to the
  `templateId` keying at the two call sites (one-line revert each).
- If Phase 1 KPI measurement shows surface-granular novelty does **not** reduce top-share/raise
  entropy versus templateId keying, the surface-key axes are mis-chosen — revisit `SURFACE_KEY_AXES`
  before any Tier-2 authoring investment (cheap to change; it's one constant).
- If `computeSurfaceKey` cardinality is found unbounded in practice (it shouldn't be — all axes are
  closed enums), the bounded-cardinality unit test fails and the change does not ship.

## explicit user sign-off

N/A — Reversible impact class. Director endorsed THR-467 Phase 0 as the night's target via the
AskUserQuestion selection above (2026-06-22).

## author notes for the judge

The single judgment call worth scrutiny: Phase 0 re-keys novelty onto axes that exist *today*
(sublocation type, reach, social role) rather than waiting for Tier-2 context slots. This is
deliberate — it harvests a THR-464 concentration win immediately and de-risks Phase 1 by proving
the surface-key plumbing under real selection before any content is authored. The risk is that the
Phase-0 axes differ from the eventual Tier-2 context axes; mitigated by `SURFACE_KEY_AXES` being a
single tunable constant and by the explicit kill criterion above. I considered scoping Phase 0 to
*only* the schema (no novelty re-key) to keep it inert, but an inert foundation with no measurable
signal is exactly the "module only in test files = not integrated" anti-pattern the process warns
against — wiring the key into novelty is what makes Phase 0 verifiable. Test-suite instability on
main is a real risk flagged to the executor with a required CLI engine smoke.
