# Phase 2: Shared Resolution and Quintessence Foundation — Implementation Plan

> **Status:** Ready for implementation (revised 2026-04-02)
>
> **For the coding agent:** Implement this plan in order. Keep behavior changes intentional and localized. Phase 2 is the first redesign phase that is allowed to change runtime gameplay behavior, but it should do so behind a single shared contract and with phase-1 balance evaluation running throughout.

### Document hierarchy

- **Roadmap** (`2026-04-02-agent-success-redesign-roadmap.md`) governs phase ordering and scope boundaries.
- **Encounter redesign guidelines** (`2026-04-02-encounter-redesign-guidelines.md`) define the target encounter feel, authoring contract, and content-level expectations.
- **This document** implements the shared runtime foundation (resolution math, quintessence model, forecast parity) required before broad content retuning or migration. It does not migrate the encounter catalog or retune early-game content — those are Phase 5 work per the roadmap.

**Goal:** Replace the split between legacy encounter math, unified action math, and planner forecast math with one shared resolution contract, while also turning quintessence into a coherent current/max resilience-and-power system that later phases can build on.

**Design docs:**

- `Docs/plans/2026-04-02-agent-success-redesign-roadmap.md`
- `Docs/plans/2026-04-02-phase1-balance-eval-foundation-plan.md`
- `Docs/plans/2026-04-02-phase1-balance-eval-foundation-implementation.md`
- `Docs/plans/2026-04-02-encounter-redesign-guidelines.md`
- `Docs/plans/2026-04-02-sovereignty-vs-consumption-design.md`

**Expected phase-1 foundation already in place:**

- versioned balance targets
- runtime-owned balance telemetry
- run summaries and evaluator output
- CLI/debug/eval runner support
- baseline reports for current behavior

If any of those are still missing, do the minimum needed to unblock phase 2 first. Do not quietly bypass them.

**Current code to build on:**

- `src/engine/resolution.ts` — current low-level roll logic and crit behavior
- `src/engine/encounter.ts` — legacy encounter step resolution
- `src/engine/unifiedActionResolution.ts` — unified action resolution seam
- `src/engine/unifiedActionLifecycle.ts` — action-level semantics and fail behavior
- `src/engine/encounterScoring.ts` — current planner forecast logic for encounters
- `src/engine/phaseAgentDecision.ts` and `src/engine/agentSelection.ts` — current option selection seams
- `src/types/quintessence.ts` — current quintessence model
- `src/engine/phaseQuintessence.ts` — quintessence update pipeline
- `src/engine/orchestrator.ts` — tick orchestration and system threading
- `src/types/gameState.ts` — actor/state typing, encounter progress, unified action progress
- any phase-1 telemetry hooks that now observe these systems

**Hard constraints:**

1. Phase 2 may change gameplay behavior, but only by consolidating onto one shared resolution contract.
2. Do not migrate the encounter catalog to unified actions. That is Phase 5. Phase 2 may add one or two pilot migration tests to validate the runtime contract, but no broad content refactoring.
3. Do not normalize threat labels across content packs. That is Phase 5.
4. Do not retune early-game content or difficulty curves. That is Phase 5.
5. Do not redesign the full reward/attachment economy. That is Phase 6.
6. Forecast and live resolution must use the same math source by the end of this phase.
7. Balance evaluation must keep working throughout this phase.
8. Quintessence semantics should change here, but the implementation should stay additive enough that later phases can layer richer spendable resilience on top.
9. Preserve the narrative doctrine: low quintessence means lower integrity of self and easier indirect manipulation; high quintessence means greater sovereignty and difficulty of being owned.

---

## Architecture

Phase 2 should produce five concrete runtime assets:

1. **One shared resolver** — one authoritative way to turn capability, normalized difficulty (`0..1`), modifiers, and random roll into outcome
2. **One shared forecast surface** — one authoritative way to estimate outcome probabilities for planners and content previews, using the same math as live resolution
3. **One canonical outcome ladder** — `critical_success | success | success_at_cost | failure | critical_failure`
4. **One real quintessence reserve/capacity model** — current reserve, durable max capacity, regen toward max, threshold states, and additive spend/resist hooks
5. **Preserved balance telemetry/eval continuity** — Phase-1 eval infrastructure keeps working and captures Phase-2 semantic changes

The intended flow after this phase is:

`capability + difficulty + modifiers -> shared resolver -> canonical outcome -> telemetry + downstream consequences`

---

## Dependency Order

Follow this exact order:

1. Freeze the phase-1 eval baseline and add phase-2 guard tests.
2. Add shared resolution types and canonical outcome contract.
3. Implement the shared forecast/resolution service.
4. Port unified actions to the shared service.
5. Port legacy encounters to the shared service.
6. Port planner/forecast logic to the shared service.
7. Add quintessence current/max fields and migration helpers.
8. Implement quintessence threshold and spend/resist hooks.
9. Thread telemetry updates through the new semantics.
10. Re-run eval profiles and capture a phase-2 baseline delta.

Do not change planner behavior before the shared resolver exists. Do not add quintessence gameplay hooks before current/max semantics are real.

---

## Sprint Overview

| Sprint | Focus | Deliverable |
|---|---|---|
| 1 | Shared contract and resolver scaffolding | Canonical resolution types, forecast helpers, and parity tests exist |
| 2 | Runtime adoption | Unified actions and legacy encounters both resolve through the same service |
| 3 | Quintessence current/max foundation | Current/max semantics, thresholds, and additive spend/resist hooks are live |
| 4 | Planner parity, telemetry polish, and eval delta | Forecast/live parity restored, phase-2 baselines captured |

---

## Sprint 1: Shared Contract and Resolver Scaffolding

**Goal:** Establish the canonical resolution contract without yet touching every caller.

### Task 1.1: Extend shared resolution types

**Files:**

- Extend: `src/types/resolution.ts` (already exists — do not recreate)
- Test: `src/engine/__tests__/resolutionService.test.ts`

**Already landed in `src/types/resolution.ts`:**

- `OutcomeType` — `critical_success | success | failure | critical_failure`
- `ResolutionInput` — `actorId`, `domain`, `difficulty` (0.0–1.0), `sphereFactor`, `actionModifiers`, `influenceNudge`
- `FateForecast`, `ForecastTier`
- `ResolutionResult` — `outcome`, `roll`, `probability`, `margin`, `marginalFactor`, `forecast`
- `ContestedResolutionResult`

**Already landed in `src/engine/resolution.ts`:**

- `computeProbability()`, `classifyForecast()`, `resolveAction()`, `resolveContestedAction()`
- Flat crit rules (crit fail at roll >= 96, crit success at roll <= P*10) — these are the Phase 2 replacement targets

**Still needed — add or refine:**

- Add `success_at_cost` to `OutcomeType` (currently missing from the union)
- Add `ResolutionMode` — `live | forecast`
- Add `ResolutionModifiers` — structured modifier breakdown (replaces bare `actionModifiers` number)
- Add `ResolutionRollBreakdown` — structured roll decomposition (threshold, crit classification, near-miss flag)
- Add `ResolutionProbabilitySummary` — forecast-side probability bands for planners
- Add `QuintessenceSpendKind` — `push | resist | overreach`
- Add `QuintessenceThresholdState` — `healthy | strained | weakened | critical | broken`
- Add `sourceSystem` field to `ResolutionResult` (or a wrapper) for telemetry attribution

**Canonical difficulty normalization rule:**

All callers of the shared resolver must provide `difficulty` as a normalized value in the range `0..1`. This is already the contract in `ResolutionInput.difficulty`. Legacy encounter callers that currently use integer-like step difficulty values (e.g. `12`, `25`, `30`) must normalize before calling the shared resolver. Unified actions already operate in normalized form and should pass through without semantic drift. The normalization function (mapping authored integer difficulty to `0..1`) belongs at the caller boundary, not inside the resolver.

**Requirements:**

- Keep forecast and live result types intentionally aligned.
- `success_at_cost` should exist in the contract even if some callers still collapse it temporarily.
- Do not duplicate types that already exist — extend them.

### Task 1.2: Implement the shared resolution service

**Files:**

- Create: `src/engine/resolutionService.ts` (new service wrapping/replacing functions in `resolution.ts`)
- Keep: `src/engine/resolution.ts` — preserve as low-level implementation; service delegates to it
- Test: `src/engine/__tests__/resolutionService.test.ts`

**Implement core functions:**

- `resolveAction(inputs, rng)`
- `forecastAction(inputs)`
- `classifyResolutionRoll(inputs, roll)`
- `computeResolutionThreshold(inputs)`
- `computeOutcomeProbabilities(inputs)`

**Design requirements:**

- Use one threshold/curve function for both forecast and live resolution.
- Replace the current flat crit-fail tail with a competence-scaled rule such as `d100 + doubles`.
- Keep the model deterministic and inspectable:
  - forecast should be derivable from the same threshold and crit rules as live
  - no hidden planner-only offsets

**Recommended phase-2 rule set:**

- base roll: `d100`
- success when roll is at or under the computed threshold
- doubles under threshold = `critical_success`
- doubles over threshold = `critical_failure`
- optional near-miss support may be captured in the result breakdown, but do not make it authoritative gameplay outcome until phase 3 unless needed

**Important:**

- The exact threshold formula can evolve, but it must be centralized.
- Do not hide old mismatch under conversion glue.

### Task 1.3: Add forecast/live parity tests

**Files:**

- Test: `src/engine/__tests__/resolutionParity.test.ts`

**Implement tests for:**

- forecast/live agreement on success probability for representative capability/difficulty pairs
- crit probability scaling with competence
- no fixed 5% catastrophic-failure tail for high-competence actors
- stable behavior at edge cases:
  - very low capability
  - very high capability
  - extreme modifiers
  - threshold clamps

**Acceptance criteria:**

- There is now one place to inspect the game’s resolution math.
- Forecast and live use the same contract.

---

## Sprint 2: Runtime Adoption

**Goal:** Move the real runtime onto the shared resolver while minimizing unrelated churn.

### Task 2.1: Port unified action step resolution

**Files:**

- Modify: `src/engine/unifiedActionResolution.ts`
- Modify: `src/engine/unifiedActionLifecycle.ts`
- Test: `src/engine/__tests__/unifiedActionResolution.test.ts`
- Test: `src/engine/__tests__/balanceTelemetry-unified-actions.test.ts`

**Implement:**

- Replace local roll logic with `resolutionService`
- Preserve full `ResolutionResult` for each step
- Pass through:
  - threshold
  - roll
  - crit classification
  - outcome
- Keep current action-level semantics conservative for now if needed, but do not throw away the richer step outcome data

**Important:**

- Phase 2 is allowed to improve correctness, but not yet to fully redesign action-level fail-forward semantics.
- If lifecycle still collapses `success_at_cost` to `failure`, preserve enough metadata so phase 3 can expand cleanly.

### Task 2.2: Port legacy encounter resolution

**Files:**

- Modify: `src/engine/encounter.ts`
- Test: `src/engine/__tests__/encounter.test.ts`
- Test: `src/engine/__tests__/balanceTelemetry-encounters.test.ts`

**Implement:**

- Replace encounter-local probability and crit logic with calls to `resolutionService`
- Add a difficulty normalization adapter at the encounter caller boundary: legacy integer step difficulty (e.g. `12`, `25`, `30`) must be mapped to `0..1` before reaching the shared resolver. The adapter belongs in `encounter.ts`, not in the resolver. Document the mapping formula as a named constant/function.
- Preserve current encounter-level flow shape where possible
- Emit richer telemetry from the shared `ResolutionResult`

**Scope guard:** This task ports the resolution *math*, not the encounter content. Do not normalize threat labels, retune difficulty numbers, or refactor `failBehavior` defaults across the catalog. That is Phase 5.

**Critical requirement:**

- The same actor facing the same capability/difficulty context must now resolve with the same math whether the content is still in the legacy encounter system or already in unified actions.

### Task 2.3: Remove planner/runtime probability drift

**Files:**

- Modify: `src/engine/encounterScoring.ts`
- Modify: `src/engine/phaseAgentDecision.ts`
- Modify: `src/engine/agentSelection.ts`
- Test: `src/engine/__tests__/encounterForecastParity.test.ts`

**Implement:**

- Replace custom planner success estimates with `forecastAction(...)`
- Remove hidden constants or offsets that do not exist in live resolution
- Record forecast values in telemetry where helpful for parity debugging

**Acceptance criteria:**

- The previously known planner/runtime mismatch is gone.
- Decision code consumes shared forecast helpers instead of hand-rolled probability math.

---

## Sprint 3: Quintessence Current/Max Foundation

**Goal:** Turn quintessence into a coherent reserve/capacity system that can support both survival pressure and long-term growth.

### Task 3.1: Add current/max quintessence semantics

**Files:**

- Modify: `src/types/quintessence.ts`
- Modify: `src/types/gameState.ts`
- Modify: `src/engine/phaseQuintessence.ts`
- Modify: any actor/node typing that stores quintessence
- Test: `src/engine/__tests__/quintessenceModel.test.ts`

**Already landed in `src/types/quintessence.ts`:**

- `QuintessenceEvent` interface with `targetNodeId`, `delta`, `source`, `tick`
- Threshold constants: `WEAKENED: 0.25`, `CRITICAL: 0.10`, `DISSOLUTION: 0.0`
- Tuning constants: `QUINTESSENCE_PASSIVE_REGEN: 0.002`, `QUINTESSENCE_DEFAULT: 1.0`, overchannel/encounter erosion amounts
- `quintessenceToWord()` prose helper

**Already landed in `src/engine/phaseQuintessence.ts`:**

- Full tick phase: accumulate pending events, apply deltas, passive regen, dissolution check
- Balance telemetry for `quintessence_changed` and `state_transition` (dissolution)
- Regen currently fills toward `1.0` (hardcoded universal cap — this is the replacement target)

**Still needed:**

- Add `quintessenceMax` as a durable capacity field on actor/location nodes
- Add migration/defaulting helpers for actors created without explicit max
- Modify `phaseQuintessence.ts` so passive regen fills toward `quintessenceMax` instead of `1.0`
- Add helper functions:
  - `getQuintessenceRatio(node)` — current / max
  - `clampQuintessence(node)` — clamp to [0, quintessenceMax]
  - `getQuintessenceThresholdState(node)` — returns `QuintessenceThresholdState`

**Requirements:**

- `quintessenceMax` must be durable capacity / power ceiling
- passive regen fills toward `quintessenceMax`, not a universal fixed cap
- defaults must preserve compatibility for existing saves/content where possible

### Task 3.2: Implement threshold states and breaking-point semantics

**Files:**

- Modify: `src/types/quintessence.ts`
- Modify: `src/engine/phaseQuintessence.ts`
- Modify: `src/engine/orchestrator.ts`
- Test: `src/engine/__tests__/phaseQuintessence.test.ts`
- Test: `src/engine/__tests__/balanceTelemetry-quintessence.test.ts`

**Already landed:** `QUINTESSENCE_THRESHOLDS` has `WEAKENED: 0.25`, `CRITICAL: 0.10`, `DISSOLUTION: 0.0`. The tick phase checks dissolution and emits telemetry. There is no `healthy`/`strained`/`broken` state enum yet, and threshold-crossing events are only emitted for dissolution.

**Extend to full threshold bands:**

- `healthy`: above 50% of `quintessenceMax`
- `strained`: 25% to 50%
- `weakened`: 10% to 25%
- `critical`: above 0% and below 10%
- `broken`: 0%

**Behavior for phase 2:**

- at minimum, thresholds must be observable and queryable via `getQuintessenceThresholdState()`
- crossing any threshold (not just dissolution) should emit telemetry and state-transition events
- current content does not yet need all downstream reactions, but the state must exist for planners and later phases

### Task 3.3: Add canonical spend/resist/overreach hooks

**Files:**

- Create or modify: `src/engine/quintessenceActions.ts`
- Modify: `src/engine/resolutionService.ts`
- Modify: current high-value callers only
- Test: `src/engine/__tests__/quintessenceActions.test.ts`

**Implement additive hooks:**

- `canSpendQuintessence(node, spendKind)`
- `spendQuintessence(node, spendKind, amount, source)`
- `getPushModifier(...)`
- `canResistOutcome(...)`
- `applyResistOutcome(...)`

**Phase-2 scope rule:**

- do not wire this into every action/content path yet
- do implement the hooks and at least one narrow runtime seam so the contract is real and testable

**Required live quintessence pressure seam (acceptance criterion):**

At least one real non-player quintessence erosion source must be wired into `pendingQuintessenceEvents` by the end of Sprint 3. This ensures the quintessence model produces meaningful runtime pressure, not just structural/observational data.

Preferred seam: **encounter failure.** When an encounter step resolves as `failure` or `critical_failure` through the shared resolver, emit a `QuintessenceEvent` with `source: 'encounter_failure'` and a magnitude governed by the encounter guidelines' band-based cost table. The constant `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION` (currently `0.03`) already exists in `src/types/quintessence.ts` and should be used or refined.

Fallback if encounter failure proves too risky in the first pass: wire **unified action step failure** as the live erosion source instead, using the same `pendingQuintessenceEvents` pipeline. Either way, one real non-player erosion seam must be live and producing telemetry.

**Recommended first integration seam for spend/resist hooks:**

- direct player-god or tracked-agent support path if one already exists
- otherwise one contained runtime seam in unified actions where the hook can be exercised without broad content migration

### Task 3.4: Align telemetry and summaries with the new semantics

**Files:**

- Modify: phase-1 telemetry and summary files
- Tests: update relevant balance summary/evaluator tests

**Implement:**

- telemetry now records current/max values and threshold transitions
- summaries use `quintessenceMax`-aware metrics
- evaluator can reason about:
  - loss cadence
  - recovery cadence
  - time in strained/weakened/critical states
  - break frequency

**Acceptance criteria:**

- Quintessence is now a real reserve/capacity system, not an implicit single number with a hidden universal cap.

---

## Sprint 4: Planner Parity, Telemetry Polish, and Eval Delta

**Goal:** Lock in parity, stabilize observability, and produce the baseline delta that confirms phase 2 is really landing.

### Task 4.1: Add forecast/live parity reporting

**Files:**

- Modify: balance summary/evaluator layer
- Test: `src/engine/__tests__/forecastLiveParitySummary.test.ts`

**Implement:**

- metric(s) for forecast/live parity by threat band and source system
- findings when planner confidence diverges materially from live outcomes

**Why:**

- This is the main regression risk of the whole redesign.

### Task 4.2: Add phase-2 eval profile or profile notes

**Files:**

- Modify: `scripts/balance-eval.ts`
- Modify: `package.json`

**Add support for:**

- one profile or flag optimized for phase-2 parity checks
- examples:
  - `--focus resolution`
  - `phase2`
  - `parity`

**Outputs should make it easy to inspect:**

- step success by threat band
- crit shares
- quintessence threshold occupancy
- forecast/live deltas

### Task 4.3: Capture baseline delta artifacts

**Files:**

- Output under `Docs/playtests/balance/`
- Optional note in the roadmap or phase-2 implementation doc after the run

**Run at minimum:**

- one `smoke` profile
- one `cadence` profile
- one parity-focused profile

**Capture:**

- before vs after deltas from phase-1 baseline
- known intentional shifts
- known unresolved semantic collapses reserved for phase 3

**Acceptance criteria:**

- We can demonstrate, with machine-readable outputs, that:
  - forecast/live mismatch is materially reduced or eliminated
  - crit tails now scale with competence
  - quintessence data is meaningful under current/max semantics

---

## Tests

Add or update the following focused tests.

### Unit tests

- `src/engine/__tests__/resolutionService.test.ts`
- `src/engine/__tests__/resolutionParity.test.ts`
- `src/engine/__tests__/quintessenceModel.test.ts`
- `src/engine/__tests__/quintessenceActions.test.ts`

### Integration-style tests

- `src/engine/__tests__/encounterForecastParity.test.ts`
- `src/engine/__tests__/forecastLiveParitySummary.test.ts`
- update:
  - `src/engine/__tests__/encounter.test.ts`
  - `src/engine/__tests__/unifiedActionResolution.test.ts`
  - `src/engine/__tests__/balanceTelemetry-unified-actions.test.ts`
  - `src/engine/__tests__/balanceTelemetry-encounters.test.ts`
  - `src/engine/__tests__/balanceTelemetry-quintessence.test.ts`

### Contract expectations

- one actor/context pair resolves with the same math in:
  - unified actions
  - legacy encounters
  - planner forecast
- crit-fail frequency for high competence is no longer flat 5%
- current/max quintessence clamps and thresholds are deterministic
- passive regen respects `quintessenceMax`
- telemetry and summaries still work after the semantic changes

---

## Verification Commands

Run these incrementally, not only at the end.

### During sprint 1

```powershell
npx vitest run src/engine/__tests__/resolutionService.test.ts src/engine/__tests__/resolutionParity.test.ts
npx tsc -b
```

### During sprint 2

```powershell
npx vitest run src/engine/__tests__/encounter.test.ts src/engine/__tests__/unifiedActionResolution.test.ts src/engine/__tests__/encounterForecastParity.test.ts
npx vitest run src/engine/__tests__/balanceTelemetry-unified-actions.test.ts src/engine/__tests__/balanceTelemetry-encounters.test.ts
```

### During sprint 3

```powershell
npx vitest run src/engine/__tests__/quintessenceModel.test.ts src/engine/__tests__/quintessenceActions.test.ts src/engine/__tests__/balanceTelemetry-quintessence.test.ts
npx tsc -b
```

### During sprint 4

```powershell
npx vitest run src/engine/__tests__/forecastLiveParitySummary.test.ts
npx vitest run
npm run balance:smoke
```

If the full suite is too expensive, still run all new phase-2 tests plus the most relevant encounter, unified-action, and balance-eval tests before finishing.

---

## Acceptance Criteria

Phase 2 is complete when all of the following are true:

1. **One shared resolver** — the game has one shared resolution service used by live runtime and planner forecast.
2. **One shared forecast surface** — unified actions and legacy encounters resolve with the same math for the same context.
3. **One canonical outcome ladder** — `critical_success | success | success_at_cost | failure | critical_failure` exists in the type contract, even if `success_at_cost` is not yet fully wired in all callers.
4. **Canonical difficulty normalization** — all callers provide `difficulty` in `0..1`; legacy encounter callers normalize at the boundary.
5. **Competence-scaled crits** — crit frequency scales with competence instead of using a flat catastrophic-failure tail.
6. **One real quintessence reserve/capacity model** — quintessence is modeled as current reserve plus durable max capacity (`quintessenceMax`).
7. **Quintessence threshold states** are explicit, queryable, and visible in telemetry.
8. **At least one real non-player quintessence erosion source** is live and emitting into `pendingQuintessenceEvents` (encounter failure or unified action failure).
9. **At least one real spend/resist seam** exists on top of the new quintessence contract.
10. **Preserved balance telemetry/eval continuity** — Phase-1 balance evaluation continues to work and captures the phase-2 changes.
11. **Forecast/live parity** is good enough that later tuning can be intentional instead of compensating for hidden drift.

---

## Non-Goals For This Phase

Do **not** do the following in this implementation:

- fully redesign unified action outcome semantics end-to-end (Phase 3)
- migrate the encounter catalog into unified actions (Phase 5)
- normalize threat labels across content packs (Phase 5)
- retune early-game difficulty or starter content (Phase 5)
- refactor `failBehavior` defaults across the encounter catalog (Phase 5)
- deeply retune quintessence regen rates or encounter magnitudes against the guidelines' band tables (Phase 5 content work — the guidelines define the *target*, not the Phase 2 deliverable)
- redesign the attachment economy (Phase 6)
- implement the full ascension ladder (Phase 7)
- hide unresolved semantics under one-off planner heuristics

Phase 2 may add one or two pilot encounter migrations or tests to validate that the runtime contract works end-to-end. These are contract validation, not content migration.

If something clearly belongs to Phase 3 or later, leave a short note and stop at the clean seam.

---

## Suggested Final Deliverable Summary

When this phase is done, the coding agent should report:

- files created and modified
- what now uses the shared resolver
- what still temporarily collapses richer outcomes and is reserved for phase 3
- how crit behavior changed
- how quintessence current/max semantics changed
- where spend/resist hooks are live
- which parity and balance evals were run
- before/after baseline notes
- any known follow-up risks for phase 3

That should leave the next phase with a stable base for expanding `success_at_cost`, weakened completion, and real fail-forward semantics across unified actions.
