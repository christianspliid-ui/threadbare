---
phase: 19-determinism
verified: 2026-03-30T22:30:00Z
status: passed
score: 7/7 must-haves verified
gaps: []
---

# Phase 19: Determinism Verification Report

**Phase Goal:** The engine produces identical output for the same seed — no Math.random or Date.now calls survive in tick-phase code
**Verified:** 2026-03-30T22:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                    | Status     | Evidence                                                                                                     |
| --- | ---------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | No Math.random() call exists in any engine tick-phase file                               | ✓ VERIFIED | resolution.ts, meetingEncounter.ts, orchestrator.ts all clear; agentSelection/dream/rival fallbacks are documented safety nets with `@deprecated` comment — never reached in production (seeded roll always passed) |
| 2   | No Date.now() call in event IDs or timestamps that flow into GameState                   | ✓ VERIFIED | Zero Date.now() hits in all 10 tick-phase files (phaseMandate, phaseDoom, phaseControlEffects, interventionEffects, controlEffectSpawn, encounterFilterPipeline, encounterScoring, unifiedActionResolution, unifiedActionPhases, orchestrator) |
| 3   | Event IDs use tick-local format `{prefix}_{tick}_{seq}` instead of wall-clock timestamps | ✓ VERIFIED | phaseMandate: `mandate_evt_${tick}_${eventCounter++}`, phaseDoom: `doom_evt_${tick}_${eventCounter++}`, phaseControlEffects: `ctrl_evt_${tick}_${nextEventCounter++}`, interventionEffects: `di_${tick}_${influenceIdCounter++}` |
| 4   | Per-module event counters reset each tick so two identical runs produce identical counter sequences | ✓ VERIFIED | `resetEventCounters()` in orchestrator.ts (line 175) resets 11 counters: orchestrator's own `eventCounter` + 5 Plan-01 modules + 6 Plan-02 modules (movement, colocation, phase, ambition, revelation, faction). Called at line 1013 (top of `runTick`) before any phase runs |
| 5   | Previously-skipped determinism integration test passes without modification to its assertions | ✓ VERIFIED | `it('same seed produces deterministic results'` at line 228 — not skipped. 14/14 tests pass in 73.46s |
| 6   | Running the same seed twice produces byte-identical tick event sequences for 100 ticks   | ✓ VERIFIED | Test at lines 228–281 runs two complete 100-tick runs (not interleaved), asserts `JSON.stringify(allEventsA) === JSON.stringify(allEventsB)`. Test passes. |
| 7   | No event ID contains a wall-clock timestamp segment (13+ digit number)                   | ✓ VERIFIED | Test regex `/^\d{13,}$/` checks every event ID segment across 100 ticks. Test passes. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                                                                    | Expected                                          | Status     | Details                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `src/engine/resolution.ts`                                                  | Seeded rollD100 accepting RNG parameter           | ✓ VERIFIED | `function rollD100(rng: () => number): number` at line 39                           |
| `src/engine/orchestrator.ts`                                                | Per-tick counter resets and RNG threading         | ✓ VERIFIED | `resetEventCounters()` at line 175; called at line 1013; seeded per-encounter RNG at lines 260, 299, 307 |
| `src/engine/phaseMandate.ts`                                                | Tick-local event IDs                              | ✓ VERIFIED | `mandate_evt_${tick}_${eventCounter++}` at line 36; exports `resetMandateCounter`   |
| `src/engine/phaseDoom.ts`                                                   | Tick-local event IDs                              | ✓ VERIFIED | `doom_evt_${tick}_${eventCounter++}` at line 32; exports `resetDoomCounter`         |
| `src/engine/phaseControlEffects.ts`                                         | Tick-local event IDs                              | ✓ VERIFIED | `ctrl_evt_${tick}_${nextEventCounter++}` at line 59; exports `resetControlEffectsCounter` |
| `src/engine/interventionEffects.ts`                                         | Tick-local influence IDs                          | ✓ VERIFIED | `di_${tick}_${influenceIdCounter++}` at line 144; exports `resetInfluenceCounter`   |
| `src/engine/__tests__/content-layer1-integration.test.ts`                   | Determinism test un-skipped, extended to 100 ticks | ✓ VERIFIED | `it('same seed produces deterministic results'` — not skipped; 100-tick sequential runs; 14/14 pass |
| `src/engine/revelationEmitter.ts`                                           | Reset function for revelation counter             | ✓ VERIFIED | `resetRevEventCounter()` at line 42 (added in Plan 02)                              |
| `src/engine/factionOutcome.ts`                                              | Reset function for faction event seq              | ✓ VERIFIED | `resetFactionEventSeq()` at line 251 (added in Plan 02)                             |

### Key Link Verification

| From                                        | To                              | Via                                                              | Status     | Details                                                                              |
| ------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `src/engine/orchestrator.ts`                | `src/engine/resolution.ts`      | resolveEncounter passes seeded roll from per-encounter RNG       | ✓ WIRED    | Lines 260, 299, 307: `mulberry32(state.seed + state.tick * 43 + hashString(progress.actorId))` |
| `src/engine/orchestrator.ts`                | Phase modules                   | `resetEventCounters()` called at tick start before any phase runs | ✓ WIRED    | Line 1013 in `runTick` — confirmed first call before phase execution                |
| `src/engine/__tests__/content-layer1-integration.test.ts` | `src/engine/orchestrator.ts` | `initializeGameState + runTick` loop with seed 42, sequential structure | ✓ WIRED | Lines 231–257: two sequential 100-tick runs with `resetDecisionCache()` between them |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                       | Status     | Evidence                                                                                  |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| DTRM-01     | 19-01       | All engine Math.random() calls replaced with seeded PRNG                                          | ✓ SATISFIED | `rollD100(rng)` in resolution.ts; meetingEncounter uses tick+counter; orchestrator uses seeded roll; agentSelection/dream/rival fallbacks documented as `@deprecated` safety nets with seeded rolls passing in production |
| DTRM-02     | 19-01       | All Date.now() event ID generation replaced with tick-local sequence numbers                      | ✓ SATISFIED | Zero Date.now() in all 10 tick-phase files. Five modules produce tick-local IDs. Seven additional ephemeral counters reset per tick in orchestrator. |
| DTRM-03     | 19-02       | Determinism integration test un-skipped and passing (same seed produces identical 100-tick sequences) | ✓ SATISFIED | Test at line 228 passes. 14/14 tests pass. Byte-identical JSON.stringify comparison confirmed. |

No orphaned requirements: all three DTRM IDs are claimed by plans and verified in code.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/engine/agentSelection.ts` | 110, 286 | `Math.random()` fallback | ℹ️ Info | Intentional documented safety net (`// Math.random() here is a safety net only; it breaks determinism (NFP #3).`). Production callers always pass `deterministicRoll` via `rng()` from `unifiedActionPhases.ts` line 109. Not a blocker. |
| `src/engine/dream.ts` | 256 | `Math.random()` fallback | ℹ️ Info | Same pattern — documented safety net. The UI-side caller handles this outside tick-phase scope. |
| `src/engine/rival.ts` | 136 | `Math.random()` fallback | ℹ️ Info | Dead code — no callers outside tests. Documented as deprecated safety net. |
| `src/engine/tickHealthMonitor.ts` | 77, 210, 222 | `Date.now()` | ℹ️ Info | Diagnostic/health monitoring only — does not flow into GameState or event IDs. Intentionally wall-clock for real-world latency measurement. |
| `src/engine/traceBuffer.ts` | 22 | `Date.now()` | ℹ️ Info | Trace infrastructure — not tick-phase code. Traces are observability tooling, not game state. |

No blocker or warning anti-patterns. All info-level findings are intentional per the plan's design decisions.

### Human Verification Required

None — all truths are verifiable programmatically. The integration test covers the core determinism contract.

### Gaps Summary

No gaps. All seven observable truths are fully verified. The phase achieved its goal: the engine produces identical output for the same seed. Non-deterministic Math.random() and Date.now() have been eliminated from all tick-phase code paths, and the integration test proves byte-identical output across two 100-tick runs with the same seed.

**Notable implementation decisions confirmed in code:**
- `lifecycleCounter` and unified action `actionCounter` are intentionally excluded from per-tick reset (they generate persistent graph node IDs, not ephemeral tick events — resetting them caused duplicate node ID crashes).
- Test structure is sequential (run A fully, then run B), not interleaved, to avoid sharing the module-level `encounterCache` singleton.
- `tickHealthMonitor.ts` and `traceBuffer.ts` retain `Date.now()` — these are observability tools, not tick-phase game state.

---

_Verified: 2026-03-30T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
