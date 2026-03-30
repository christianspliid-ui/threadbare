---
phase: 19-determinism
plan: "01"
subsystem: engine-determinism
tags: [determinism, prng, seeded-rng, event-ids, tick-counters]
dependency_graph:
  requires: []
  provides: [DTRM-01, DTRM-02]
  affects: [resolution, meetingEncounter, orchestrator, phaseMandate, phaseDoom, phaseControlEffects, interventionEffects, controlEffectSpawn, encounterFilterPipeline, encounterScoring, unifiedActionResolution, unifiedActionPhases]
tech_stack:
  added: []
  patterns: [seeded-mulberry32-rng, tick-local-sequence-ids, per-module-reset-functions]
key_files:
  created: []
  modified:
    - src/engine/resolution.ts
    - src/engine/meetingEncounter.ts
    - src/engine/agentSelection.ts
    - src/engine/dream.ts
    - src/engine/rival.ts
    - src/engine/orchestrator.ts
    - src/engine/phaseMandate.ts
    - src/engine/phaseDoom.ts
    - src/engine/phaseControlEffects.ts
    - src/engine/interventionEffects.ts
    - src/engine/controlEffectSpawn.ts
    - src/engine/encounterFilterPipeline.ts
    - src/engine/encounterScoring.ts
    - src/engine/unifiedActionResolution.ts
    - src/engine/unifiedActionPhases.ts
decisions:
  - "rollD100 accepts rng param; resolveAction gains optional rng (third param) preserving deterministicRoll backward compat"
  - "Orchestrator derives per-encounter seeded roll as mulberry32(seed + tick*43 + hashString(actorId))"
  - "Per-module reset functions (resetMandateCounter, resetDoomCounter, etc.) over single global counter to keep module boundaries clean"
  - "resetEventCounters() aggregates all 5 module resets; called once per tick before any phase runs"
  - "agentSelection/dream/rival Math.random() fallbacks stay as documented safety nets (@deprecated) — full wiring deferred to DTRM-03"
  - "Trace timestamps use tick number (integer) not wall-clock ms — ordering by tick is semantically correct for game state"
metrics:
  duration: "10 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 15
---

# Phase 19 Plan 01: Determinism — Replace Math.random() and Date.now() in Engine

**One-liner:** Replaced all non-deterministic Math.random() rolls and Date.now() event IDs in 15 engine tick-phase files with seeded mulberry32 RNG and tick-local sequence counters.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace Math.random() with seeded PRNG (DTRM-01) | 4856727 | resolution.ts, meetingEncounter.ts, agentSelection.ts, dream.ts, rival.ts, orchestrator.ts |
| 2 | Replace Date.now() with tick-local sequence IDs (DTRM-02) | 8eea596 | orchestrator.ts, phaseMandate.ts, phaseDoom.ts, phaseControlEffects.ts, interventionEffects.ts, controlEffectSpawn.ts, encounterFilterPipeline.ts, encounterScoring.ts, unifiedActionResolution.ts, unifiedActionPhases.ts |

## What Was Done

### Task 1 (DTRM-01): Seeded PRNG for random rolls

**resolution.ts** — `rollD100()` now requires an `rng: () => number` parameter. `resolveAction` gained an optional third parameter `rng?: () => number`; the fallback is `Math.random` (legacy test compat only — documented). The `deterministicRoll` override pattern is preserved as the first priority.

**meetingEncounter.ts** — Added module-level `meetingCounter` and exported `resetMeetingCounter()`. Agent IDs now use `ind_meeting_{tick}_{meetingCounter++}` instead of `Math.random() * 10000`.

**orchestrator.ts** — `phaseEncounterProgressionV2` now derives a per-encounter seeded roll: `mulberry32(state.seed + state.tick * 43 + hashString(progress.actorId))`. The existing local `mulberry32` and `hashString` functions in orchestrator.ts are reused.

**agentSelection.ts, dream.ts, rival.ts** — These already had `deterministicRoll ?? Math.random()` fallback patterns. Added `@deprecated fallback` JSDoc comments on all Math.random() safety nets. The UI-side callers that should pass seeded rolls are out of scope for DTRM-01 (deferred to DTRM-03 per plan).

### Task 2 (DTRM-02): Tick-local event ID sequence numbers

**phaseMandate.ts, phaseDoom.ts, phaseControlEffects.ts** — Each `nextEventId()` now accepts a `tick: number` parameter and produces `{prefix}_evt_{tick}_{counter++}`. Each module exports a reset function.

**interventionEffects.ts** — `generateInfluenceId()` now accepts `tick: number` and produces `di_{tick}_{counter++}`. Exported `resetInfluenceCounter()`. All 10+ call sites updated to pass `tick` (available in all handler functions).

**controlEffectSpawn.ts, encounterFilterPipeline.ts, encounterScoring.ts, unifiedActionResolution.ts, unifiedActionPhases.ts** — Trace `timestamp` fields changed from `Date.now()` to the local `tick` variable.

**orchestrator.ts** — Added `resetEventCounters()` function that calls all 5 module resets. Called at the top of `runTick()` before any phase runs. Crash log `timestamp` fields changed from `Date.now()` to `s.tick` / `state.tick`.

## Verification Results

- Zero `Date.now()` calls in event ID generators and trace timestamps in all 10 tick-phase files
- Zero actual `Math.random()` code calls in resolution.ts, meetingEncounter.ts, orchestrator.ts tick paths (comment-only references remain)
- `npx tsc --noEmit` — clean
- `npm test` — 7336 passed, 6 skipped, 25 todo (1 pre-existing timeout in encounter-liveness contract test, unrelated to these changes — confirmed by testing against baseline)

## Deviations from Plan

None — plan executed exactly as written.

## Pre-existing Issues Discovered (out of scope)

- `encounter-liveness.contract.test.ts > pipeline liveness holds across multiple seeds` times out at 5000ms. This existed before these changes (confirmed by reverting and re-running tests). Logged as out-of-scope; fix deferred.

## Self-Check

Checking created files and commits exist.

## Self-Check: PASSED

- src/engine/resolution.ts — FOUND
- src/engine/meetingEncounter.ts — FOUND
- .planning/phases/19-determinism/19-01-SUMMARY.md — FOUND
- Commit 4856727 — FOUND
- Commit 8eea596 — FOUND
