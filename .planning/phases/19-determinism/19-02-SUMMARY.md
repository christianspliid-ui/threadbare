---
phase: 19-determinism
plan: "02"
subsystem: engine-determinism
tags: [determinism, integration-test, event-counters, seeded-rng, tick-local-ids]
dependency_graph:
  requires:
    - phase: 19-01
      provides: "Seeded PRNG replacing Math.random() + tick-local event IDs replacing Date.now()"
  provides: [DTRM-03]
  affects: [testing, orchestrator, encounter-pipeline]
tech_stack:
  added: []
  patterns: [sequential-test-run-with-cache-reset, comprehensive-per-tick-counter-reset]
key_files:
  created: []
  modified:
    - src/engine/__tests__/content-layer1-integration.test.ts
    - src/engine/orchestrator.ts
    - src/engine/revelationEmitter.ts
    - src/engine/factionOutcome.ts
key_decisions:
  - "Test runs must be sequential (not interleaved) with resetDecisionCache() between runs — interleaved runs share the module-level encounterCache singleton causing false non-determinism"
  - "Counters generating ephemeral TickEvent.id values (evt_N, movement, colocation, phase, ambition, revelation, faction) are reset each tick in resetEventCounters()"
  - "Counters generating persistent graph node IDs (lifecycleCounter -> born_lc_N, unifiedAction actionCounter -> ua_N) are intentionally excluded from per-tick reset"
  - "orchestrator.ts eventCounter (evt_N) was the primary missing reset — added to resetEventCounters() alongside 6 other module counters"
patterns_established:
  - "resetEventCounters() is the canonical location for all per-tick ephemeral ID counter resets"
  - "Determinism test structure: run A completes fully → resetDecisionCache() → run B completes fully → compare JSON.stringify of allEvents arrays"
requirements_completed: [DTRM-03]
duration: 25min
completed: "2026-03-30"
---

# Phase 19 Plan 02: Determinism Integration Test Summary

**Un-skipped and extended the determinism integration test to 100 ticks; fixed 7 missing per-tick event counter resets that caused byte-level divergence between same-seed runs.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-30T19:53:51Z
- **Completed:** 2026-03-30T20:19:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Removed `it.skip` and the TODO comment about non-determinism from `content-layer1-integration.test.ts`
- Extended the test to 100 ticks per run with byte-identical JSON.stringify comparison of all tick events
- Added wall-clock timestamp detection (regex `/^\d{13,}$/`) to catch any future Date.now() leakage in event IDs
- Discovered and fixed 7 module-level event counters that were not being reset per-tick: orchestrator's `eventCounter`, plus `revelationEmitter`, `factionOutcome`, `phaseMovement`, `phaseColocationDetection`, `unifiedActionPhases`, and `ambitionTick`
- Added `resetRevEventCounter()` to `revelationEmitter.ts` (previously had no reset function)
- Added `resetFactionEventSeq()` to `factionOutcome.ts` (previously had no reset function)

## Task Commits

1. **Task 1: Un-skip and extend determinism integration test (DTRM-03)** - `e0d6891` (feat)

**Plan metadata:** (final commit below)

## Files Created/Modified

- `src/engine/__tests__/content-layer1-integration.test.ts` — Un-skipped, extended to 100-tick sequential runs with byte-identical event comparison and timestamp leak detection
- `src/engine/orchestrator.ts` — Added `eventCounter = 0` to `resetEventCounters()`; imported and wired 4 additional module reset functions; added scope comment explaining which counters are excluded
- `src/engine/revelationEmitter.ts` — Added exported `resetRevEventCounter()` function
- `src/engine/factionOutcome.ts` — Added exported `resetFactionEventSeq()` function

## Decisions Made

- **Test structure must be sequential, not interleaved.** Two interleaved runs (`runTick(A), runTick(B), runTick(A), ...`) share the module-level `encounterCache` singleton — run B gets A's cache, causing false non-determinism. The test uses: run A fully (100 ticks) → `resetDecisionCache()` → run B fully (100 ticks).
- **`lifecycleCounter` and unified action `actionCounter` must NOT reset per-tick.** These generate persistent graph node IDs (`born_lc_N`, `ua_N`). Resetting them per-tick causes duplicate node ID errors when newly born agents get the same ID as existing ones. Only counters generating ephemeral `TickEvent.id` values are reset.
- **`resetEventCounters()` is the single authoritative location** for all per-tick ephemeral ID counter resets, documented with an explicit scope comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing per-tick counter resets caused non-deterministic event IDs**
- **Found during:** Task 1 (after un-skipping the test)
- **Issue:** `orchestrator.ts` `eventCounter` accumulated across runs, producing `evt_1` in run A vs `evt_6` in run B. Six other module counters had the same problem: `revelationEmitter`, `factionOutcome`, `phaseMovement`, `phaseColocationDetection`, `unifiedActionPhases`, `ambitionTick`.
- **Fix:** Added all 7 counters to `resetEventCounters()`. Added missing reset functions to `revelationEmitter.ts` and `factionOutcome.ts`. Excluded `lifecycleCounter` and unified action `actionCounter` from reset (they generate persistent node IDs — resetting them caused `Duplicate node ID: born_lc_1` crashes).
- **Files modified:** `src/engine/orchestrator.ts`, `src/engine/revelationEmitter.ts`, `src/engine/factionOutcome.ts`
- **Verification:** `npm test` — 7337 passed, 1 pre-existing timeout failure (encounter-liveness.contract.test.ts, documented in 19-01-SUMMARY)
- **Committed in:** e0d6891

**2. [Rule 1 - Bug] Test structure was interleaved, causing false cache divergence**
- **Found during:** Task 1 (first fix attempt with sequential counter reset still failed)
- **Issue:** The plan's test body ran two loops interleaved (`for i: runTick(A); runTick(B)`). This caused run B to use run A's module-level `encounterCache`, producing different destination choices.
- **Fix:** Restructured to: run A fully (100 ticks with `resetDecisionCache()` before start) → run B fully (100 ticks with `resetDecisionCache()` before start). This matches how the game actually runs (single-state, fresh cache per game).
- **Files modified:** `src/engine/__tests__/content-layer1-integration.test.ts`
- **Committed in:** e0d6891

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in engine and test design)
**Impact on plan:** Both fixes were required to prove determinism. The counter resets complete what Plan 01 began. The test structure fix ensures the test actually validates real gameplay determinism.

## Issues Encountered

- `encounter-liveness.contract.test.ts > pipeline liveness holds across multiple seeds` continues to time out at 5000ms. This is the same pre-existing issue documented in 19-01-SUMMARY. Not caused by Plan 02 changes.

## Next Phase Readiness

- DTRM-03 complete — determinism is now proven by passing integration test
- Phase 19 (Determinism) is fully complete (DTRM-01, DTRM-02, DTRM-03 all done)
- Phases 20-22 (independent) can proceed; they no longer depend on Phase 19 blockers

---
*Phase: 19-determinism*
*Completed: 2026-03-30*
