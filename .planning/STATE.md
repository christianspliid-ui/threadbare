---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Low-Hanging Fruit Optimization
status: executing
stopped_at: Completed 21-01-PLAN.md (prose cache)
last_updated: "2026-03-31T09:58:56.742Z"
last_activity: "2026-03-31 — Plan 02 complete: CACHE_REBUILD_THRESHOLD documented as design placeholder, redundant import removed"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 7
  completed_plans: 7
  percent: 10
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** The world must feel alive — every hex, agent, faction, and location has unique sphere character
**Current focus:** Phase 19 — Determinism (v1.1 first phase)

## Current Position

Phase: 21 of 22 (Performance)
Plan: 2 of 3 in current phase
Status: In progress — Plans 01 and 02 complete, Plan 03 pending
Last activity: 2026-03-31 — Plan 02 complete: CACHE_REBUILD_THRESHOLD documented as design placeholder, redundant import removed

Progress: [█░░░░░░░░░] 10% (v1.1 — 1/? plans complete)

## Accumulated Context

### Decisions

- v1.0 shipped: 22 phases, 81 plans, 1,055 files, 85K LOC
- Last phase number in v1.0: 18 (mercenary pipeline)
- v1.1 phases 19-22; phases 20/21/22 are independent and can parallelize after Phase 19
- Math.random() acceptable only in UI flavor code (avatar names, particle colors); all engine phases must use seeded mulberry32
- PERF-02 encounter cache threshold: RESOLVED — constant is a design placeholder; EncounterCacheManager uses per-location incremental updates with no dirty-count gate
- [19-01] rollD100 accepts rng param; resolveAction gains optional rng (third param) preserving deterministicRoll backward compat
- [19-01] Per-encounter seeded roll: mulberry32(seed + tick*43 + hashString(actorId)) — no shared RNG state between encounters
- [19-01] Per-module reset functions over single global counter to keep module boundaries clean
- [19-01] Trace timestamps use tick number not wall-clock ms — ordering by tick is semantically correct
- [19-01] agentSelection/dream/rival Math.random() fallbacks documented as @deprecated — full wiring deferred to DTRM-03
- [Phase 19]: Test structure must be sequential (not interleaved) with resetDecisionCache() between runs — interleaved runs share the encounterCache singleton
- [Phase 19]: resetEventCounters() is the canonical per-tick reset location; lifecycle/unifiedAction counters excluded (they generate persistent graph node IDs)
- [Phase 20-wiring]: Both WIRE-01 and WIRE-02 chains were already fully wired — tests confirm correctness with no source changes
- [Phase 20-wiring]: dilemma_resolved uses event.actorId ?? actor.id — prefers propagated actorId from source event, falls back to name-matched actor
- [Phase 20-wiring]: NarrativeLog renders actor-attributed entries as button elements vs div — structural distinction for keyboard accessibility
- [21-02]: CACHE_REBUILD_THRESHOLD is a design placeholder; EncounterCacheManager rebuilds per-location (no dirty-count gate); threshold is reserved for future incremental vs full rebuild decision point
- [21-02]: Unused local import of CACHE_REBUILD_THRESHOLD in encounterCache.ts removed (re-export kept for consumers)
- [Phase 21-performance]: manualChunks used instead of dynamic imports for data files — data needed at startup, parallel static chunks provide network efficiency without async complexity
- [Phase 21-performance]: [21-03] data-encounter (377 kB) + data-action-templates (141 kB) + data-culture (64 kB) split from main bundle — main reduced from 3277 kB to 2695 kB (-582 kB, -17.8%)
- [Phase 21-performance]: tick param optional with default 0 in generateEntityProse — no breaking change for existing callers
- [Phase 21-performance]: [PERF-01] Module-level Map cache key is (nodeId, tick, mode) — seed excluded because it's constant per session

### Pending Todos

None.

### Blockers/Concerns

- DTRM-03 depends on DTRM-01 + DTRM-02 completing first (test un-skip after fixes)
- PERF-03 circular import risk: unified-action-templates.ts imports encounter-content.ts; add validateTemplateRegistry() at game start after split
- PERF-03 circular import risk: unified-action-templates.ts imports encounter-content.ts; add validateTemplateRegistry() at game start after split

## Session Continuity

Last session: 2026-03-31T09:58:56.740Z
Stopped at: Completed 21-01-PLAN.md (prose cache)
Resume file: None
