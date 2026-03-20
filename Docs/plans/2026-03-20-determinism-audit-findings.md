# Determinism Audit Findings

**Date:** 2026-03-20
**Status:** Findings documented, fixes pending

The simulation is designed to be fully deterministic (NFP #3: same seed + same inputs = same outputs). This audit found violations across the engine.

---

## Critical: Math.random() Fallbacks

These bypass the seeded PRNG entirely. Each has a `deterministicRoll` parameter that callers don't always provide.

| File | Line | Pattern |
|------|------|---------|
| `src/engine/resolution.ts` | 39 | `rollD100()` uses `Math.floor(Math.random() * 100) + 1` |
| `src/engine/agentSelection.ts` | 108, 282 | `deterministicRoll ?? Math.random()` |
| `src/engine/rival.ts` | 134 | `Math.random()` fallback in `selectRivalAction()` |
| `src/engine/dream.ts` | 254 | `Math.random()` fallback in `executeIntervention()` |

**Fix:** Replace all `Math.random()` fallbacks with explicit PRNG. Every production code path must receive a seeded RNG or derive one from the tick seed.

---

## Critical: Date.now() in Game State

| File | Line | Pattern |
|------|------|---------|
| `src/engine/interventionEffects.ts` | 141 | `generateInfluenceId()` uses `di_${Date.now()}_${counter++}` |

This ID is stored in actor properties as part of divine influences and used for decay calculations. Two identical simulations with the same seed generate different influence IDs.

**Fix:** Replace with deterministic ID: `di_${tick}_${counter}` or `di_${seed}_${counter}`.

---

## Medium: Mutable Module-Level Counters (13 files)

Auto-incrementing event ID counters that persist across game restarts. Each has a `resetXCounter()` export, but no central reset function.

| File | Counter |
|------|---------|
| `src/engine/actionLifecycle.ts` | `actionCounter` |
| `src/engine/unifiedActionLifecycle.ts` | `actionCounter` |
| `src/engine/agentLifecycle.ts` | `lifecycleCounter` |
| `src/engine/ambitionTick.ts` | `ambitionEventCounter` |
| `src/engine/cycleEnd.ts` | `twilightCounter` |
| `src/engine/graphOpExecutor.ts` | `opCounter` |
| `src/engine/interventionEffects.ts` | `influenceIdCounter` |
| `src/engine/orchestrator.ts` | `eventCounter` |
| `src/engine/phaseColocationDetection.ts` | `colocationEventCounter` |
| `src/engine/unifiedActionPhases.ts` | `phaseEventCounter` |
| `src/engine/phaseMovement.ts` | `eventCounterPhaseMovement` |

**Fix:** Add a single `resetSimulationState()` function called by the orchestrator at game start that resets all counters atomically.

---

## Low: Date.now() in Debug Traces (5 files)

`Date.now()` used as `timestamp` in trace emissions. Only affects determinism if tracing is enabled during gameplay (currently debug-only).

| File | Context |
|------|---------|
| `src/engine/traceBuffer.ts` | `emitTrace()` |
| `src/engine/encounterScoring.ts` | Scoring trace |
| `src/engine/encounterFilterPipeline.ts` | Filter trace |
| `src/engine/unifiedActionResolution.ts` | Resolution trace |
| `src/engine/unifiedActionPhases.ts` | Phase trace |

---

## Recommended Implementation Order

1. Fix `Math.random()` fallbacks (critical — affects gameplay divergence)
2. Fix `Date.now()` in `interventionEffects.ts` (critical — affects state)
3. Add central `resetSimulationState()` (medium — affects test isolation and game restart)
4. Document trace `Date.now()` as acceptable (low — debug-only)
