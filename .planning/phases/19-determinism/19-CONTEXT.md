# Phase 19: Determinism - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all unseeded Math.random() and Date.now() calls in engine tick-phase code with seeded PRNG and tick-local sequence numbers. Same seed must produce identical output for 100 ticks. The previously-skipped determinism integration test must pass.

</domain>

<decisions>
## Implementation Decisions

### PRNG threading
- Use existing `mulberry32` from `src/lib/prng.ts` — already used in 132 files
- Each module that currently calls `Math.random()` should receive the RNG via parameter (consistent with existing patterns like `deterministicRoll` in agentSelection.ts, dream.ts, rival.ts)
- `resolution.ts:39` has a bare `Math.random()` with no fallback parameter — needs refactoring to accept RNG
- `meetingEncounter.ts:422` uses `Math.random()` for agent ID generation — replace with tick+sequence counter
- Math.random() in UI-only code (avatar names, particle colors) is acceptable and out of scope

### Event ID scheme
- Replace `Date.now()` in event IDs with tick-local sequence format: `{prefix}_{tick}_{seq}`
- Existing patterns already use counters (phaseMandate, phaseDoom, phaseControlEffects have `eventCounter++`) — just remove the `Date.now()` prefix
- `interventionEffects.ts:141` uses `di_${Date.now()}_${counter}` — change to `di_${tick}_${counter}`
- Counter resets are per-tick (not global) to ensure determinism across runs

### Boundary scope — in-scope vs out-of-scope Date.now()
- **In scope (determinism-breaking):** Event IDs and timestamps in orchestrator.ts, phaseMandate.ts, phaseDoom.ts, phaseControlEffects.ts, interventionEffects.ts, controlEffectSpawn.ts, encounterFilterPipeline.ts, encounterScoring.ts, unifiedActionResolution.ts, unifiedActionPhases.ts
- **Out of scope (real-time instrumentation):** traceBuffer.ts (diagnostic timestamps), tickHealthMonitor.ts (performance monitoring), worldgen/WorldGenPipeline.ts (perf timing). These use Date.now() for real wall-clock measurement, not game state
- **Timestamps in TickEvents:** Replace with tick number, not wall-clock time. Events are ordered by tick, not by milliseconds

### Verification approach
- Un-skip the existing determinism integration test in content-layer1-integration.test.ts
- "Byte-identical" means: JSON.stringify of tick event arrays for 100 ticks must be equal across two runs with the same seed
- Event ordering within a tick must be stable (deterministic iteration order)

### Claude's Discretion
- Whether to create a shared `TickContext` object that carries the RNG vs threading RNG as a bare parameter
- Counter reset mechanism (module-level reset function vs per-tick fresh counter)
- Whether to add a lint rule or grep-based CI check for future Math.random() regressions
- Exact test assertion style for the integration test

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRNG implementation
- `src/lib/prng.ts` — mulberry32 seeded PRNG, single shared implementation (RC-218)
- `src/lib/__tests__/prng.test.ts` — PRNG determinism tests

### Files with Math.random() to fix (DTRM-01)
- `src/engine/resolution.ts:39` — bare Math.random() roll, no fallback
- `src/engine/meetingEncounter.ts:422` — Math.random() for agent ID
- `src/engine/agentSelection.ts:108,282` — has deterministicRoll fallback, needs wiring
- `src/engine/dream.ts:254` — has detectionRoll fallback, needs wiring
- `src/engine/rival.ts:134` — has deterministicRoll fallback, needs wiring

### Files with Date.now() event IDs to fix (DTRM-02)
- `src/engine/orchestrator.ts:1326,1346` — event timestamps
- `src/engine/phaseMandate.ts:32` — mandate event IDs
- `src/engine/phaseDoom.ts:28` — doom event IDs
- `src/engine/phaseControlEffects.ts:53` — control effect event IDs
- `src/engine/interventionEffects.ts:141` — divine influence IDs
- `src/engine/controlEffectSpawn.ts:100` — spawn timestamps
- `src/engine/encounterFilterPipeline.ts:438` — pipeline timestamps
- `src/engine/encounterScoring.ts:640` — scoring timestamps
- `src/engine/unifiedActionResolution.ts:205` — action timestamps
- `src/engine/unifiedActionPhases.ts:135` — phase timestamps

### Existing determinism test (DTRM-03)
- `src/engine/__tests__/content-layer1-integration.test.ts:228` — TODO comment about non-determinism from Date.now()

### Requirements
- `.planning/REQUIREMENTS.md` — DTRM-01, DTRM-02, DTRM-03 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mulberry32()` in `src/lib/prng.ts`: Production-ready seeded PRNG, already used across 132 files
- `deterministicRoll` parameter pattern: Used in agentSelection.ts, dream.ts, rival.ts — provides fallback to Math.random() when no seeded value passed
- Per-module event counters: phaseMandate, phaseDoom, phaseControlEffects already have incrementing counters — just need Date.now() removed from the prefix

### Established Patterns
- RNG is passed as parameter to engine functions, not stored as module state
- Event IDs follow `{prefix}_evt_{unique}` convention
- World seed flows from `GameState.worldSeed` through `gameInit.ts`
- Worldgen already fully deterministic — only tick-phase code has gaps

### Integration Points
- `orchestrator.ts` is the tick loop entry point — RNG must be derived from world seed + tick number here and threaded to all phase functions
- `gameInit.ts` creates the initial RNG from world seed
- Test infrastructure: vitest with determinism test patterns established in worldgen tests

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the success criteria in ROADMAP.md are precise enough. This is a mechanical correctness fix, not a design decision.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-determinism*
*Context gathered: 2026-03-30*
