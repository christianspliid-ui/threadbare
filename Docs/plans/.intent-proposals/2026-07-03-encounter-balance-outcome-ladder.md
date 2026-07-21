# Action Proposal — 2026-07-03-encounter-balance-outcome-ladder

## intent_quote

> "Encounter balance systemic redesign — attack the 89% failure / 0 branching baseline" (THR-571, filed from Christian's 2026-07-02 audit ask: "come up with a set of improvements in our backlog to work on. I have fable for 5 days and would like to use the model to tackle some hairy problems")

> Framing verdict (Christian, AskUserQuestion 2026-07-03): "Split: ~60% succeed, failure = story — Recalibrate so agents succeed ~55–65% of the time, AND convert the remaining failures into cool failure — pressure, complications, branching — so no outcome is dead air."

## scope (what this plan does)

Revives the five-level outcome ladder in unified action resolution: floored low-capability successes become success_at_cost instead of clean success (E1); the local/personal critical-failure boolean gate becomes a consequence-severity map so the tail exists at every scale with scale-appropriate damage (E2); final-outcome aggregation preserves crit tails and records mid-action crits as metadata (E3); KPI thresholds are retuned to encode Christian's 55–65% verdict as named constants (E4); every failure emits ≥1 story artifact via an aftermath post-pass with a fallback table (C1, folds THR-448 scope); critical afterimages authored for the top-20 hot templates via a follow-on content issue (C2); chronicle/DebugPanel/CLI/__DEBUG expose the distribution (U1). Touches resolution mapping layers only — the pure resolver (resolutionService.ts) is untouched.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT change roll generation, the doubles crit model, or RNG consumption (determinism preserved).
- Does NOT retune MIN_PROBABILITY_BY_SCALE values or capability curves — floor frequency stays; only what floored success *means* changes.
- Does NOT touch branching-encounter fire rates (already green at 4+/30t post-THR-465).
- Does NOT address encounter volume (THR-573) or template migration (Encounter Format Migration project).
- Does NOT redesign the complication system — reuses existing severity tiers.

## impact_class

Reversible (engine mapping constants + additive fields; every change is a named constant or additive trace/field; one boolean-map export replaced with call-site migration in-PR).

## evidence cited

- **Linear issue:** THR-571 (verdict recorded as comment 2026-07-03)
- **Vision premises invoked:** narrative-over-mechanical (NFP #5); narrative-tiebreaker (living/unpredictable over flat) — memory + CLAUDE.md NFP table
- **UL terms touched:** outcome ladder terms (success_at_cost, near_miss, critical bands) — existing UL usage, no new terms; `story artifact` used descriptively in traces — flag to UL if shard lacks it (open UL-proposal if so at implementation)
- **Canon pages consulted:** rulebook impact identified — `Docs/canon/rulebook.md` resolution-outcomes section must update in the same PR (stated in plan §Wiring)
- **Prior plan docs this builds on:** `2026-04-02-agent-success-redesign-roadmap.md` (phases 5–8), THR-451 scale-adjust design (resolutionScaleAdjust.ts header), `2026-06-22-thr-465-branching-fire-rate-tuning.md`
- **Rejected approaches considered and dismissed:** deleting the probability floor (would re-open the 89% crisis); keeping the boolean crit gate with authored exceptions (still erases the tail from KPI/prose); raising clean-success via difficulty cuts (flattens further, against verdict)

## load-bearing decisions touched

- "Ascendants use the same prerequisite system as agents" — untouched (player actions short-circuit before this layer, unifiedActionResolution.ts:234).
- No graph schema, node types, or edge types touched. `hadCriticalStep` is a property internal to the UnifiedAction record (not a relationship — property-bag use is correct here).

## high-impact files touched (from Codesight)

None ≥100 importers. unifiedActionResolution.ts / unifiedActionLifecycle.ts / resolutionScaleAdjust.ts / kpiConstants.ts / gameplayKpi.ts are all below threshold (checked against CLAUDE.md high-impact list; types/unifiedAction.ts gains one optional field — it IS on the 278-importer list, but the change is a single additive optional property; Blast Radius section covers engine-smoke gating).

## kill criteria

Post-implementation gameplay-report (3 seeds × 120t) must show: total success 0.55–0.65, both crit tails ≥0.02, failure_story_rate ≥0.90, branching still ≥1/30t. If clean success falls below 0.15 (over-rotation to at-cost), revert E1's constant to a graded band instead of full reclassification. If crit_failure tail exceeds 0.08 or play-feel reads as punitive at personal scale, raise severity thresholds — the severity map makes this a constants change. If the aftermath post-pass measurably slows resolution (engine smoke regression), artifact table moves to aftermath-time lazy evaluation.

## explicit user sign-off

Not required (Reversible class). Framing verdict quoted above; Christian is reviewing the handoff in-session.

## author notes for the judge

The issue's stated premise (89% failure / 0 branching) was verified stale — fresh baseline run in-session shows 33.6% failure and healthy branching. Rather than "fix" numbers already inside the verdict band, the plan targets the evidenced structural problems (dead crit tails, flat floor masquerading as balance, failure-as-dead-air). This is a deliberate reshape of the issue's letter to honor its intent; the verdict comment on THR-571 is the anchor. One field addition touches types/unifiedAction.ts (278 importers) — judged acceptable as optional+additive, but flag if you disagree.
