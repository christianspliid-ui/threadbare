# Encounter Balance — Outcome-Ladder Revival (THR-571)

**Date:** 2026-07-03
**Linear:** THR-571 (Agent Success Redesign)
**Status:** Design complete, three-pillar compliant → Ready for Dev
**Author:** Cowork (interactive Fable session, creative verdict from Christian in-session)

---

## TL;DR

The issue premise ("89% failure, 0 branching") is stale — THR-451/464/465 fixed the crisis. Fresh baseline (2026-07-03, seeds 42/99/7 × 120 ticks, 217 resolved): **failure 33.6%, success_at_cost 39.6%, clean success 26.7%, critical outcomes 0.0%.** Christian's target split (**~55–65% success, remainder converted to story**) is numerically met — but it is met by a **flat probability floor**, not by capability expression, and **both critical tails are structurally dead**. This plan revives the five-level outcome ladder, makes low-skill success read as *scraping through* rather than clean wins, converts failure into story per the creative verdict, and retunes the KPI thresholds to encode that verdict as named constants.

**Creative verdict (Christian, 2026-07-03, recorded on THR-571):** target ~55–65% total success; remaining failures become cool failure — pressure, complications, branching — no outcome reads as dead air.

---

## Fresh baseline (evidence)

`npm run gameplay-report` 2026-07-03 (defaults: seeds 42/99/7 × 120 ticks, medium map). Output JSON `Docs/playtests/kpi/2026-07-03-kpi-report.json` exists **untracked** in the authoring working tree — Cowork cannot commit; **executor step 0 regenerates and commits it** as the canonical baseline artifact. The command above is the reproducible source of truth (deterministic per seed, NFP #3):

| Outcome | Count | Share |
|---|---|---|
| success | 58 | 26.7% |
| success_at_cost | 86 | 39.6% |
| failure | 73 | 33.6% |
| critical_success | 0 | 0.0% |
| critical_failure | 0 | 0.0% |

Branching fires 16–19 per 120t (threshold ✓). Template entropy 0.87–0.93 (✓). The only red threshold is `clean_success_rate ≥ 0.40` — which this plan retires as mis-specified (see KPI retune).

**Step-level check** (CLI seed 42, 120t): 153 step outcomes — 87 success / 55 failure / 10 near_miss / 1 at_cost / **0 crits**. The tails die *before* aggregation.

**Roll-trace check** (362 `resolution.input` traces, 28 doubles rolls): crit classification fires at the resolver exactly as designed (~9% doubles) — and is then erased downstream. Sampled: `roll=44 P=0.70 cap=1.00 → critical_success` (survives, capable actor); `roll=66 P=0.65 cap=1.00 → failure` (crit-fail suppressed by local-scale gate); `roll=11 P=0.65 cap=0.02 → success` (crit erased by floor upgrade).

## Root causes (verified, file:line)

1. **Local/personal crit-failure gate kills the failure tail.** `applyScaleCritFailureGate` (`resolutionScaleAdjust.ts:135`) maps `critical_failure → failure` when `CRIT_FAILURE_PERMITTED_BY_SCALE[scale]` is false (`:69` — false for personal AND local). Nearly all encounter templates in play are `scale=local` → tail suppressed ~100%. Live-confirmed: every sampled doubles-over-threshold printed `→ failure`.
2. **Probability-floor upgrade erases crits for low-cap actors and flattens the curve.** `unifiedActionResolution.ts:329-347`: when raw P < `MIN_PROBABILITY_BY_SCALE[scale]`, failing rolls under the floor are rewritten to plain `'success'` — including doubles that classified as crits against raw P. Half the live sample runs at cap≈0.02 → flat P=0.65. The file's own doc comment (`resolutionScaleAdjust.ts:50-52`) says the floor is "a capable-actor guarantee, **not a global minimum for all actors**" — the implementation drifted into exactly that. Consequence: **failure rate ≈ 1 − floor = 35%; skill barely expresses; clean success does not signal capability.**
3. **Final-outcome aggregation makes surviving crits nearly unreachable.** `computeFinalActionOutcome` (`unifiedActionLifecycle.ts:274-296`): `critical_success` requires all-crit or last-step-crit with a clean run; any failed/at-cost step forces `success_at_cost`; `critical_failure` can never be returned (only the terminal gate at `:158` preserves it). With step-crit ≈ 1% post-suppression, final crits ≈ 0.
4. Secondary tail-eaters (keep, but account for): resist downgrade `critical_failure → failure` (`unifiedActionResolution.ts:396-402`); both are quintessence-gated and deterministic — fine, they're *story* (the actor resists disaster), unlike the silent gate/floor.

## Design principle

**From "flat floor + suppression" to "graded expression + story conversion."** Nothing here makes agents fail more or succeed more overall — the verdict's 55–65% success band is already met. The work is in *what kind* of success and failure occur, and what they leave behind.

---

## Engine pillar

### E1 — Floored success becomes success_at_cost (capability expression)

In the floor upgrade path (`unifiedActionResolution.ts:339-347`), rewrite upgraded outcomes to **`success_at_cost`**, not `'success'`. An incapable actor scraping through on a guaranteed floor *is* the definition of success-at-cost. Clean `success` again signals genuine capability. Doubles that classified `critical_success` against raw P are **preserved** through the floor path (a fluke of brilliance from an incapable actor is exactly the drama we want); doubles that classified `critical_failure` under the floor upgrade to `success_at_cost` like other failures (the floor still guarantees progress).

Expected distribution shift: clean success ↓ toward ~20–25%, at_cost ↑ toward ~40–45%, total success unchanged. Within verdict bands.

### E2 — Un-gate critical_failure; scale the consequence, not the existence

Replace the boolean `CRIT_FAILURE_PERMITTED_BY_SCALE` with **`CRIT_FAILURE_SEVERITY_BY_SCALE`**: the outcome *classification* survives at every scale (it reaches prose, aftermath, KPI, chronicle), while the *mechanical consequence tier* scales — a personal-scale social fumble is a humiliation (complication severity `minor`), a cosmic-scale one is a catastrophe (`major`). This honors the original THR-451 rationale ("drama must read as drama") without erasing the tail. Severity keys into the existing complication system (`complicationEffects.ts` apply path).

```ts
// resolutionScaleAdjust.ts — replaces CRIT_FAILURE_PERMITTED_BY_SCALE
export const CRIT_FAILURE_SEVERITY_BY_SCALE: Record<ActionScale, ComplicationSeverity> = {
  personal: 'minor', local: 'minor', regional: 'moderate', cosmic: 'major',
};
```

`applyScaleCritFailureGate` is deleted; its call site (`unifiedActionResolution.ts:350-353`) passes severity into the consequence context instead. Back-compat: any other caller of the gate migrates in the same PR (grep first).

### E3 — Aggregation preserves the tails

Amend `computeFinalActionOutcome` (`unifiedActionLifecycle.ts:274`):
- `critical_success`: relax to "≥1 crit-success step AND no failure/at-cost steps" (drop the last-step requirement).
- Add **`hadCriticalStep: 'success' | 'failure' | null`** metadata on the resolved action (additive field) so prose/aftermath can reference a mid-action crit even when the final outcome is `success_at_cost` — the story of the crit is not lost to aggregation.
- Terminal crit-failure path (`:158`) already preserves `critical_failure` — untouched, now actually reachable post-E2.

### E4 — KPI retune (encodes the creative verdict)

`kpiConstants.ts` changes, all named (NFP #1):

| Constant | Old | New | Rationale |
|---|---|---|---|
| `KPI_TOTAL_SUCCESS_MIN` / `_MAX` | — | 0.55 / 0.65 | The verdict band, measured on success+at_cost+crit_success |
| `KPI_CLEAN_SUCCESS_MIN` | 0.40 | 0.20 | Clean success is a skill signal, not the bulk |
| `KPI_AT_COST_SHARE_MIN` / `_MAX` | — | 0.25 / 0.45 | At-cost is the texture of the world |
| `KPI_CRIT_TAIL_MIN` | — | 0.02 | Each tail must fire ≥2% — "the dice can still astonish" |
| `KPI_FAILURE_RATE_MAX` | 0.35 | 0.40 | Verdict: failure 35–45% is fine *if converted to story* |
| `KPI_FAILURE_STORY_MIN` | — | 0.90 | ≥90% of failures must emit ≥1 story artifact (see C1 + tracing) |

`buildOutcomes`/`buildThresholds` (`gameplayKpi.ts:222,392`) extend accordingly; report gains `total_success_rate`, `at_cost_share`, `crit_success_rate`, `crit_failure_rate`, `failure_story_rate` rows.

### Constants table (full, NFP #1)

| Constant | Default | Purpose | File |
|---|---|---|---|
| `CRIT_FAILURE_SEVERITY_BY_SCALE` | minor/minor/moderate/major | Consequence tier per scale (replaces boolean gate) | `resolutionScaleAdjust.ts` |
| `FLOOR_UPGRADE_OUTCOME` | `'success_at_cost'` | What floored failures become (was `'success'`) | `unifiedActionResolution.ts` |
| `MIN_PROBABILITY_BY_SCALE` | unchanged | Per-scale floor — values untouched by this plan | `resolutionScaleAdjust.ts` |
| KPI constants | table above | Threshold suite | `kpiConstants.ts` |

### Tracing (NFP #2)

- Extend `ResolutionInputTrace` (additive fields): `rawOutcome` (pre-floor/pre-severity), `critClassification`, `floorUpgradeApplied: boolean` — so the exact erasure this plan fixes stays observable forever.
- New trace `outcome_story_artifact` `{ tick, actionId, actorId, outcome, artifactKind: 'complication'|'pressure'|'seed'|'mark', refId }` — emitted whenever a failure band produces a story artifact; feeds `failure_story_rate`.

### Fail-soft table (NFP #4)

| Failure case | Fallback |
|---|---|
| Scale missing from severity map | `'moderate'`, warn once per process (mirrors existing gate fallback) |
| `hadCriticalStep` absent on old saves | `null` — prose/aftermath treat as no-crit (optional field) |
| Story-artifact emission throws | Caught per-artifact; failure resolves normally without artifact; trace notes `artifactKind:'none'` |
| KPI report on runs without new traces | New rates computed as `null`/omitted, thresholds skip (no false reds on old data) |

### Determinism note (NFP #3)

Same seed still produces identical rolls and identical outcomes — this plan changes deterministic *mappings*, not RNG consumption. `--seed 42` remains reproducible; expected distributions shift by design (that's the point). The resist path already consumes RNG deterministically and is untouched.

---

## Content pillar

### C1 — Cool-failure conversion (the verdict's second half)

Every `failure`/`critical_failure` final outcome must leave ≥1 story artifact, using existing engine capabilities (systemic wiring guide): a **complication effect**, a **pressure/omen delta**, an **encounter seed**, or a **hidden mark**. Implementation: an aftermath post-pass in the unified resolution path that consults the template's `aftermathConfig.variants` failure bands and falls back to a scale-appropriate default artifact table when the template authored none. This resurrects the THR-448 pilot (`aftermathConfig.variants` for linear-template families) as a live dependency — fold its scope in here rather than leaving it parked.

### C2 — Critical afterimages for the hot pool

`criticalSuccessAfterimage` / `criticalFailureAfterimage` **fields already exist in the ActionStep schema** — consumed at `encounter.ts:100-103` (`selectBandAfterimage`); no schema change in this plan — but they are sparsely authored. Author both bands for the **top ~20 templates by selection share** (from the KPI funnel), plainer readable voice per `Docs/canon/prose.md`, meeting-encounter eval as the bar. Follow-on content issue (parallel-safe, content lane) — not a blocker for the engine PR.

---

## UI pillar

- **Chronicle / encounter cards:** outcome band rendered distinctly — crit outcomes get the existing rare-tier visual treatment (gold/red accent per `debugPanelStyles` tokens in game surfaces); `success_at_cost` shows its cost artifact inline ("won, but…"). No new panel.
- **DebugPanel:** add outcome-distribution row (last N ticks histogram + KPI threshold badges) to the existing balance/KPI debug surface.
- **`__DEBUG.getOutcomeDistribution(windowTicks?)`** — returns the live histogram + threshold verdicts (debug-bridge + `.d.ts`).
- **CLI:** extend `status` output with the outcome distribution line; `gameplay-report` gains the new threshold rows (E4).
- **Browser-verify (Definition of Done):** DOM surfaces → Playwright at 1920×1080: chronicle card with at-cost artifact + DebugPanel distribution row screenshot, console block, and a `__DEBUG.getOutcomeDistribution()` assertion.

## Wiring section

| Module | Orchestrator | UI | GameState | Traces | Debug |
|---|---|---|---|---|---|
| Floor upgrade (E1) | in step resolution | chronicle band | none | `resolution.input.floorUpgradeApplied` | `getOutcomeDistribution` |
| Severity map (E2) | consequence context | chronicle/aftermath prose | none | `resolution.input.critClassification` | DebugPanel row |
| Aggregation (E3) | action finalization | prose reads `hadCriticalStep` | additive field on UnifiedAction | — | `getOutcomeDistribution` |
| Story artifacts (C1) | aftermath post-pass | chronicle inline artifact | via existing artifact systems | `outcome_story_artifact` | DebugPanel row |

Update `Docs/plans/wiring-checklist.md` (new trace `outcome_story_artifact`; extended `resolution.input`). Update the **systemic wiring guide** (content-facing capability: guaranteed failure-artifact fallback table). **Rulebook impact: yes** — outcome ladder semantics change (`Docs/canon/rulebook.md` §resolution outcomes + quick-reference card row) in the same PR.

## Blast radius

No ≥100-importer file is touched. Hot files: `unifiedActionResolution.ts`, `unifiedActionLifecycle.ts`, `resolutionScaleAdjust.ts`, `gameplayKpi.ts`/`kpiConstants.ts` — engine-smoke gate applies (30-tick CLI smoke pre-commit). `resolutionService.ts` (classifier) is **untouched**.

## Implementation breakdown (executor sequence)

0. **Baseline provenance:** run `npm run gameplay-report` (defaults), confirm the distribution matches the table above (±1 count per seed — deterministic), and **commit the generated JSON** as the canonical pre-change baseline.
1. E4 KPI constants + report rows (measurement first — re-baseline before/after each step against the step-0 artifact).
2. E1 floor-upgrade outcome change + trace fields. Re-run `gameplay-report`, confirm clean/at-cost shift stays in bands.
3. E2 severity map replaces boolean gate + consequence wiring.
4. E3 aggregation amendments + `hadCriticalStep`.
5. C1 aftermath post-pass + default artifact table (+ fold THR-448 scope).
6. U1 chronicle band + DebugPanel row + `__DEBUG` + CLI status line.
7. Verification: full `gameplay-report` (3 seeds) — **all thresholds green including both crit tails ≥2% and failure_story ≥90%**; paste table. Browser-verify per UI pillar.
8. C2 afterimage authoring → separate content issue (filed at handoff, `relatedTo` this one — NOT a child).

## NFP compliance

| NFP | Verdict | Note |
|---|---|---|
| 1 Tunability | PASS | Every mapping/band is a named constant |
| 2 Inspectability | PASS | Erasure paths now traced; story artifacts traced; distribution queryable |
| 3 Determinism | PASS | Mapping changes only; no RNG consumption change |
| 4 Fail-soft | PASS | Table above; artifact emission never blocks resolution |
| 5 Narrative > mechanical | PASS (this is the point) | Failure converts to story; at-cost becomes texture; tails astonish |
| 6 Additive > destructive | PASS with note | Boolean gate replaced by severity map (one deleted export, call sites migrated in-PR) |
| 7 Performance budget | PASS | One post-pass per resolved action; no per-tick cost |

## Open decisions made in-session

- Verdict on the split (55–65% / cool failure) is Christian's, recorded on THR-571 2026-07-03.
- Floored crit_success **preserved** (not downgraded) — rare brilliance from the incapable is desirable drama. Revisit only if crit tail exceeds `KPI_CRIT_TAIL_MIN`×4.
- `MIN_PROBABILITY_BY_SCALE` values deliberately untouched — this plan changes what floored success *means*, not how often it happens. Retuning floor values is a follow-on if capability expression still reads flat after E1.

## Forked-audit verdicts (2026-07-03)

- **Intent-judge:** Revise → fixed (baseline provenance anchored to reproducible command + executor step 0 commit) → **Allow**. "The reshape honors intent — it is not scope drift… the four root causes are independently verified accurate against the source files."
- **NFP audit:** **PASS.** All 7 NFPs verified against plan content; one note (afterimage-field existence ambiguity) resolved inline in C2 above.
- **Three-pillar audit:** **PASS.** All pillars concrete, wiring table connects every engine change to a UI reader and a trace, browser-verify tool named (Playwright).
- **Vision audit:** **PASS.** No premise contradicted; no numbers leak to player surfaces; rulebook obligation correctly scoped in-PR; THR-448 fold-in verified as correctly scoped.
