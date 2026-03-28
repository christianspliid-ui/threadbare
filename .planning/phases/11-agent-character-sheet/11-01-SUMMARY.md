---
phase: 11-agent-character-sheet
plan: "01"
subsystem: engine
tags: [agent-knowledge, revelation-system, interaction-depth, tracing, types]
dependency_graph:
  requires: [familiarity-system, gameState]
  provides: [AgentKnowledge type, phaseInteractionDepth, revelationHooks, trace types]
  affects: [GameState, orchestrator, trace buffer]
tech_stack:
  added: []
  patterns: [idempotent pure functions, lazy-init map pattern, TDD red-green]
key_files:
  created:
    - src/types/agentKnowledge.ts
    - src/engine/revelationHooks.ts
    - src/engine/phaseInteractionDepth.ts
    - src/engine/__tests__/revelationHooks.test.ts
    - src/engine/__tests__/phaseInteractionDepth.test.ts
  modified:
    - src/types/gameState.ts
    - src/types/trace.ts
    - src/engine/orchestrator.ts
    - src/engine/gameInit.ts
    - src/types/__tests__/trace.test.ts
decisions:
  - "AgentKnowledge uses Set/Map for all facet collections — O(1) has() checks for idempotency"
  - "phaseInteractionDepth mutates agentKnowledge in place (same pattern as phaseFamiliarityGain)"
  - "BondRevelationSource is a distinct type (not reusing FamiliarityGainSource) — different semantics"
  - "addChronicleEvent evicts oldest via Array.from slice rather than LRU — simplicity over performance at CHRONICLE_MAX_ENTRIES=30"
  - "InteractionDepthTrace and RevelationTrace added as new categories (not reusing revelation) — distinct trace semantics"
  - "phaseInteractionDepth uses avatar's located_at edges (not locationId property) for consistency with visibility module"
metrics:
  duration_seconds: 485
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_created: 5
  files_modified: 5
---

# Phase 11 Plan 01: AgentKnowledge Foundation Summary

Per-facet agent knowledge model and interaction depth accumulator — 13-facet AgentKnowledge type, 18 constants, 12 idempotent revelation hooks, and phaseInteractionDepth wired at Phase 2.76.

## What Was Built

### Task 1: AgentKnowledge Types and Revelation Hooks

Created `src/types/agentKnowledge.ts` with:
- `AgentKnowledge` interface with 13 facet fields: `revealedValues`, `revealedDomains`, `revealedBonds`, `revealedAmbitions`, `knownEvents`, `dispositionRevealed`, `interactionDepth`, `revealedPossessions`, `revealedPowers`, `revealedConditions`, `revealedAgreements`, `threatRevealed`, `coLocationTicks`
- `BondRevelationSource` union type: `'witnessed' | 'gossip' | 'divine' | 'faction'`
- 18 named constants for depth accumulation thresholds (DEPTH_DILEMMA, DEPTH_COLOCATION_PER_TICK, CHRONICLE_MAX_ENTRIES, etc.)
- `createEmptyAgentKnowledge()` factory returning zeroed/empty knowledge record

Created `src/engine/revelationHooks.ts` with 12 exported pure functions:
- `getOrCreateKnowledge` — lazy Map entry creation
- `revealValue`, `revealDomain`, `revealBond`, `revealAmbition`, `revealPossession`, `revealPower`, `revealCondition`, `revealAgreement` — idempotent set/map writers
- `revealThreat`, `revealDisposition` — boolean setters
- `addChronicleEvent` — capped at CHRONICLE_MAX_ENTRIES with oldest-first eviction

28 tests covering all functions, idempotency, and the chronicle eviction behavior.

### Task 2: GameState Integration and Orchestrator Wiring

- Added `agentKnowledge: Map<string, AgentKnowledge>` to `GameState` interface
- Added `RevelationTrace` (category: `'agent_revelation'`) and `InteractionDepthTrace` (category: `'interaction_depth'`) to `trace.ts` union type and `TRACE_CATEGORIES`
- Created `phaseInteractionDepth.ts` — runs each tick, accumulates `coLocationTicks += 1` and `interactionDepth += DEPTH_COLOCATION_PER_TICK` for co-located agents, `interactionDepth += DEPTH_FACTION_PER_TICK` for faction co-members; emits `InteractionDepthTrace` via `emitTrace`
- Wired `phaseInteractionDepth(s)` into `orchestrator.ts` at Phase 2.76 (after Phase 2.75 Familiarity Gain)
- Initialized `agentKnowledge: new Map()` in `gameInit.ts` alongside `familiarityMap`

8 tests for phaseInteractionDepth covering co-location, faction ambient, linear accumulation, and GameState initialization.

## Verification Results

- `npx tsc --noEmit` — clean (0 errors)
- `npx vite build` — succeeds (2774 modules, no new errors)
- `npx vitest run` — 9 pre-existing failing test files (unchanged), 448 passing files (up from 447 before), 6754 passing tests (up from 6753)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] trace.test.ts category count was stale**
- **Found during:** Task 2 verification
- **Issue:** `src/types/__tests__/trace.test.ts` asserted `TRACE_CATEGORIES` has 35 categories; adding `'agent_revelation'` and `'interaction_depth'` made it 37
- **Fix:** Updated assertion to `toHaveLength(37)` and added two new `toContain()` assertions
- **Files modified:** `src/types/__tests__/trace.test.ts`
- **Commit:** ecf5706

**2. [Rule 1 - Bug] gameInit.ts stash-restore — agentKnowledge not auto-propagated**
- **Found during:** Task 2 stash verification check
- **Issue:** During pre-existing failure check via git stash, the agentKnowledge field was temporarily missing from gameInit.ts; verified and confirmed field was correctly in place after stash pop
- **Fix:** No action needed — confirmed correct after pop
- **Files modified:** None

## Self-Check: PASSED

All files created, all commits verified:
- FOUND: src/types/agentKnowledge.ts
- FOUND: src/engine/revelationHooks.ts
- FOUND: src/engine/phaseInteractionDepth.ts
- FOUND: src/engine/__tests__/revelationHooks.test.ts
- FOUND: src/engine/__tests__/phaseInteractionDepth.test.ts
- FOUND: commit 4079927 (feat(11-01): define AgentKnowledge types, constants, and revelation hook functions)
- FOUND: commit ecf5706 (feat(11-01): wire AgentKnowledge into GameState, orchestrator, and traces)
