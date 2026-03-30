# World-Soul → Encounter Engine Wiring Plan

> Implementation plan for the encounter-related parts of TB-072 M1.2.
> Created 2026-03-28 by Cowork audit.
>
> **Parent design:** `Docs/plans/2026-03-28-world-soul-connection-design.md` → Phase M1.2
> **Problem:** M1.1 (tick integration) was completed, but M1.2's encounter wiring was designed and never implemented. The world soul computes global sphere balance each tick, but encounters don't consume it.

## What's Missing

Three pieces from M1.2 affect the encounter engine. None are currently wired:

### 1. Encounter Sphere Resonance (global, not local)

**What the design says:** `computeEncounterResonance(encounterSphere, fundament)` — additive score bonus in `scoreAndSelect()` based on global sphere weights. When a sphere is globally dominant, encounters aligned with it score higher.

**What exists today:** `computeResonance()` at line 86 of `encounterScoring.ts` computes *local* hex-vs-encounter resonance. It IS called (lines 361–364) and added to the final score. But there is NO global resonance from `worldSoul.fundament`.

**What to implement:**
- Add `computeEncounterResonance()` as specified in the design doc (lines 377–395 of the design doc)
- New constants: `ENCOUNTER_RESONANCE_SCALE = 2.0`, `ENCOUNTER_RESONANCE_FLOOR = -0.15`
- Call it in `scoreAndSelect()` after the existing local resonance (line ~367)
- Add the result as an additive component to `finalScore`
- Extend the `ScoringTrace` type with a `globalResonance` field

**Phase ordering note:** `scoreAndSelect()` runs during `phaseAgentDecision` (Phase 2b), which is before `phaseSphereAggregation` (Phase 6.6395). This means encounters read the *previous tick's* `worldSoul.aggregate`. This is correct and expected — the world soul is a slowly-drifting global state, one tick of latency is imperceptible.

**Access pattern:** `scoreAndSelect()` currently receives `(candidates, agentId, agentLocationId, graph, distanceMatrix, tick)`. It needs `state.worldSoul.fundament` — either:
- (a) Pass `fundament` as an additional parameter, or
- (b) Pass the full `GameState` (but this is a wider interface change)

Option (a) is preferred — minimal surface change, explicit dependency.

### 2. Agent Axiological Drift from World-Soul

**What the design says:** `computeWorldSoulValueDrift(fundament)` returns a `Partial<AxiologicalProfile>` applied additively in `resolveProfile()` after divine influence overlays.

**What exists today:** `resolveProfile()` (around line 203 of `encounterScoring.ts`) applies sphere-derived axiological shift from the *agent's personal* dominant sphere via `SPHERE_AXIOLOGICAL_MAP`. No global drift.

**What to implement:**
- Add `computeWorldSoulValueDrift()` as specified in the design doc (lines 443–473)
- Add `SPHERE_DRIFT_MAP` constant mapping each sphere to its axiological pair + direction
- New constants: `AXIOLOGICAL_DRIFT_SCALE = 1.5`, `AXIOLOGICAL_DRIFT_MAX = 0.15`, `DRIFT_ACTIVATION_THRESHOLD = 0.03`
- Call in `resolveProfile()` after the existing divine overlay
- Apply drift values additively to the profile
- Extend `ScoringTrace` with a `worldSoulDrift` field

**Same access pattern issue** — `resolveProfile()` needs `fundament` passed down.

### 3. `computeResonance()` — Already Wired (No Action Needed)

The existing local resonance function IS called at lines 361–364. This is the *local* hex affinity resonance, which is distinct from the new *global* resonance in item 1. Both should coexist — local resonance captures "this hex favors this encounter" while global resonance captures "the cosmos favors this sphere."

## Implementation Steps

### Step 1: Add fundament to scoring pipeline

File: `encounterScoring.ts`

- Add `fundament?: FundamentState` parameter to `scoreAndSelect()` signature
- Add `fundament?: FundamentState` parameter to `resolveProfile()` signature (internal)
- Update all callers of `scoreAndSelect()` to pass `state.worldSoul?.fundament`
- Fail-soft: if `fundament` is undefined, skip both global resonance and axiological drift (return 0)

### Step 2: Implement `computeEncounterResonance()`

File: `encounterScoring.ts`

- Add the function per design doc spec
- Add constants `ENCOUNTER_RESONANCE_SCALE`, `ENCOUNTER_RESONANCE_FLOOR`
- Call after line 364 (existing local resonance), store result
- Update final score formula: `finalScore = valuePerTick * desireMultiplier + factionScoringBoost + resonance + globalResonance`
- Add `globalResonance` to the per-candidate trace object

### Step 3: Implement `computeWorldSoulValueDrift()`

File: `encounterScoring.ts` (or new file `worldSoulDrift.ts` if it grows)

- Add the function per design doc spec
- Add `SPHERE_DRIFT_MAP` constant table
- Add constants `AXIOLOGICAL_DRIFT_SCALE`, `AXIOLOGICAL_DRIFT_MAX`, `DRIFT_ACTIVATION_THRESHOLD`
- Call in `resolveProfile()` after divine overlay, apply additively
- Add `worldSoulDrift` to the scoring trace

### Step 4: Update callers

Files: `phaseAgentDecision.ts` (or wherever `scoreAndSelect` is called from), `encounterFilterPipeline.ts` if it calls scoring

- Thread `state.worldSoul?.fundament` through to the scoring call
- This is a signature change — find all callers with grep

### Step 5: Tests

- Unit test `computeEncounterResonance()` — dominant sphere → positive bonus, recessive → negative, neutral → ~0, undefined → 0
- Unit test `computeWorldSoulValueDrift()` — force-dominant → ambition drift, below threshold → no drift, clamping at max
- Contract test: real `phaseSphereAggregation` output → `computeEncounterResonance` input (validates the aggregate shape feeds the resonance function)
- Integration test: run 30+ ticks, verify `encounter_scoring` traces contain `globalResonance` and `worldSoulDrift` fields with non-zero values
- Verify existing tests still pass (no regression from signature change)

### Step 6: Verify in CLI

- `npm run cli`, `tick 30`, `eval state.worldSoul.fundament` — confirm fundament has non-uniform weights
- Check `events` for encounter scoring traces with new fields
- Verify encounters aligned with the dominant sphere are being selected more frequently

## Wiring Verification

| Surface | Status |
|---------|--------|
| Orchestrator | No new phase needed — wires into existing `phaseAgentDecision` |
| UI rendering | No change — encounter selection is engine-internal |
| GameState flow | Reads `worldSoul.fundament` (already written by M1.1) |
| Traces | Extends existing `encounter_scoring` trace |
| Debug visibility | New fields visible in existing encounter scoring debug |
| Prose pipeline | No change |
| Player controls | No change — this is a passive downstream effect |

## Constants Summary

| Constant | Default | File |
|----------|---------|------|
| `ENCOUNTER_RESONANCE_SCALE` | 2.0 | `encounterScoring.ts` |
| `ENCOUNTER_RESONANCE_FLOOR` | -0.15 | `encounterScoring.ts` |
| `AXIOLOGICAL_DRIFT_SCALE` | 1.5 | `encounterScoring.ts` |
| `AXIOLOGICAL_DRIFT_MAX` | 0.15 | `encounterScoring.ts` |
| `DRIFT_ACTIVATION_THRESHOLD` | 0.03 | `encounterScoring.ts` |
