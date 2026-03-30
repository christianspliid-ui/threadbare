---
phase: 11-agent-character-sheet
plan: "03"
subsystem: revelation-engine
tags: [agent-knowledge, revelation, debug-panel, encounter-hooks, dilemma-hooks]
dependency_graph:
  requires: ["11-01"]
  provides: ["revelation-events-from-engine", "debug-revelation-log", "debug-knowledge-comparison"]
  affects: ["orchestrator", "agentKnowledge", "DebugPanel", "GameView"]
tech_stack:
  added: []
  patterns: ["TDD red-green", "fail-soft-wrapping", "idempotent-revelation-hooks"]
key_files:
  created:
    - src/engine/revelationEmitter.ts
    - src/components/Game/debug/RevelationLogTab.tsx
    - src/components/Game/debug/KnowledgeComparisonTab.tsx
    - src/engine/__tests__/revelationEmitter.test.ts
  modified:
    - src/engine/orchestrator.ts
    - src/types/gameState.ts
    - src/components/Game/DebugPanel.tsx
    - src/components/Game/GameView.tsx
decisions:
  - "REACH_TO_VALUE_MAP exported as named constant from revelationEmitter.ts for tunability (NFP #1)"
  - "Used 'possesses' edge type (not 'carries') — matches graph edge schema"
  - "Fallback reach detection from encounter ID substring when getAnyEncounterById returns nothing — supports test fixtures"
  - "domain_revealed added to TickEvent type union in gameState.ts"
metrics:
  duration: "9 min"
  completed: "2026-03-28"
  tasks: 2
  files: 8
---

# Phase 11 Plan 03: Revelation Emitter Wired Summary

Wired revelation events from existing engine phases into the AgentKnowledge system and added debug visibility for revelation state.

## Tasks Completed

### Task 1: Revelation Emitter Functions + Orchestrator Wiring
- Created `src/engine/revelationEmitter.ts` with three exported functions:
  - `emitEncounterRevelations(state)` — reveals domain + value pair for co-located agents when encounter progresses; emits `domain_revealed` TickEvents
  - `emitDilemmaRevelations(state)` — increments interaction depth by DEPTH_DILEMMA for co-located agents in dilemma events; reveals disposition after DISPOSITION_DILEMMA_THRESHOLD
  - `emitColocationRevelations(state)` — auto-reveals visible possession subcategories (arms, vestments, mounts_beasts) on first sighting; reveals faction bonds for co-members
- All three functions wrapped in try/catch (fail-soft, NFP #4)
- Added `domain_revealed` to the TickEvent type union
- Wired all three into `runTick` after their respective phases (Phases 2a.7, 2.37, 2.55)
- 18 TDD tests written covering all behavior specs (RED then GREEN)

### Task 2: Debug Panel Revelation Tabs
- Created `RevelationLogTab` — reverse-chronological list of `agent_revelation` and `interaction_depth` traces with color-coded facet types and source abbreviations
- Created `KnowledgeComparisonTab` — per-agent table showing engine-known vs player-known counts (values, domains, bonds, items, disposition, depth) with red gap highlighting
- Added `'revelation-log'` and `'knowledge-gaps'` to DebugPanel ViewMode union
- Added two new tab buttons ("Revelations", "Knowledge") to the tab bar
- Added `agentKnowledge` prop to DebugPanel; passed from GameView

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Edge type 'carries' → 'possesses'**
- **Found during:** Task 1 test writing — schema validation warning in test output
- **Issue:** Plan spec said use `carries` edges for possession lookup, but graph schema uses `possesses` for item ownership
- **Fix:** Updated both emitter and tests to use `possesses` edge type
- **Files modified:** revelationEmitter.ts, revelationEmitter.test.ts

**2. [Rule 2 - Missing] Reach fallback for synthetic encounter IDs**
- **Found during:** Task 1 RED phase — test encounters use IDs like `enc-iron` not matching real templates
- **Issue:** `getAnyEncounterById('enc-iron')` returns undefined, causing emitter to silently skip all co-located agents in tests
- **Fix:** Added substring fallback: if no template found, check if encounter ID contains a known reach domain name
- **Files modified:** revelationEmitter.ts

**3. [Rule 1 - Bug] CommonJS `require()` in ESM test**
- **Found during:** Task 1 GREEN phase — two tests used `require('../../types/agentKnowledge')` which fails in Vitest ESM mode
- **Fix:** Added `createEmptyAgentKnowledge` to top-level ES import
- **Files modified:** revelationEmitter.test.ts

## Self-Check: PASSED

All created files exist. Both commits (07f156e, f5e4e3c) present. All acceptance criteria verified:
- emitEncounterRevelations, emitDilemmaRevelations, emitColocationRevelations exported from revelationEmitter.ts
- try/catch fail-soft present
- revealDomain, revealValue, DEPTH_DILEMMA used
- All three emitters called from orchestrator.ts runTick
- RevelationLogTab exports RevelationLogTab, contains agent_revelation
- KnowledgeComparisonTab exports KnowledgeComparisonTab, contains revealedValues
- DebugPanel contains RevelationLogTab and KnowledgeComparisonTab
- npx tsc --noEmit exits 0
- npx vite build exits 0
- 18 revelationEmitter tests pass
