---
phase: 11-agent-character-sheet
plan: 06
subsystem: engine
tags: [typescript, type-hygiene, test-mocks, trace-types]

# Dependency graph
requires:
  - phase: 11-agent-character-sheet/11-05
    provides: phaseInteractionDepth.ts and agentKnowledge system wired into engine

provides:
  - Zero TypeScript errors in phaseInteractionDepth.ts (TS2353 fixed with explicit cast)
  - Zero TS2741 agentKnowledge errors across 11 engine test files
  - Type-clean Phase 11 codebase

affects: [11-agent-character-sheet]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use explicit Omit<SpecificTrace, 'id' | 'timestamp'> cast on emitTrace calls when emitting a discriminated union member with properties not in the base union"

key-files:
  created: []
  modified:
    - src/engine/phaseInteractionDepth.ts
    - src/engine/__tests__/ambitionTick.test.ts
    - src/engine/__tests__/ambitionTick-actorId.test.ts
    - src/engine/__tests__/avatarMove.test.ts
    - src/engine/__tests__/contestation-integration.test.ts
    - src/engine/__tests__/contestation.test.ts
    - src/engine/__tests__/controlEffectSpawn.test.ts
    - src/engine/__tests__/divineUnifiedAction.test.ts
    - src/engine/__tests__/unifiedActionPhases.test.ts
    - src/engine/__tests__/unifiedActionResolution.test.ts
    - src/engine/__tests__/unifiedIdleSelection.test.ts
    - src/engine/__tests__/unifiedPipeline-integration.test.ts

key-decisions:
  - "Cast emitTrace object literal as Omit<InteractionDepthTrace, 'id' | 'timestamp'> to resolve TS2353 excess property check on discriminated union Omit"
  - "Add agentKnowledge: new Map() to all mock GameState objects — empty Map satisfies type and tests don't exercise agentKnowledge"

patterns-established:
  - "Discriminated union emitTrace pattern: always cast with Omit<SpecificTraceType, 'id' | 'timestamp'> when emitting union member with unique properties"

requirements-completed: [TB-070]

# Metrics
duration: 8min
completed: 2026-03-29
---

# Phase 11 Plan 06: Type Hygiene Gap Closure Summary

**Resolved final Phase 11 TypeScript gaps: TS2353 surplus-property cast on emitTrace in phaseInteractionDepth.ts and TS2741 missing agentKnowledge field in 11 engine test mock GameStates.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-29T00:10:00Z
- **Completed:** 2026-03-29T00:18:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Fixed TS2353 in phaseInteractionDepth.ts by importing InteractionDepthTrace and casting both emitTrace calls with `as Omit<InteractionDepthTrace, 'id' | 'timestamp'>`
- Fixed TS2741 in all 11 engine test files by adding `agentKnowledge: new Map()` to their mock GameState objects
- All 11 modified test files pass (99 tests)
- Production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix phaseInteractionDepth.ts TS2353 surplus property errors** - `73fb8ef` (fix)
2. **Task 2: Add agentKnowledge to mock GameState in 11 engine test files** - `7c18dc5` (fix)

## Files Created/Modified
- `src/engine/phaseInteractionDepth.ts` - Added InteractionDepthTrace import; cast both emitTrace calls with explicit union member type
- `src/engine/__tests__/ambitionTick.test.ts` - Added agentKnowledge: new Map() to makeState()
- `src/engine/__tests__/ambitionTick-actorId.test.ts` - Added agentKnowledge: new Map() to makeState()
- `src/engine/__tests__/avatarMove.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/contestation-integration.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/contestation.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/controlEffectSpawn.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/divineUnifiedAction.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/unifiedActionPhases.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/unifiedActionResolution.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/unifiedIdleSelection.test.ts` - Added agentKnowledge: new Map() to mock GameState
- `src/engine/__tests__/unifiedPipeline-integration.test.ts` - Added agentKnowledge: new Map() to mock GameState

## Decisions Made
- Cast emitTrace calls with `Omit<InteractionDepthTrace, 'id' | 'timestamp'>` rather than `as any` — preserves type safety while resolving the discriminated union excess property check limitation
- Empty Map is the correct value for agentKnowledge in tests that don't exercise interaction depth functionality

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - both fixes were straightforward and confirmed by tsc output.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 11 type hygiene complete; zero TS errors for all Phase 11 artifacts
- Pre-existing failures in socialOutcome, journeyEngine, content-layer1-integration, and UI component tests are out of scope — existed before this phase
- Phase 11 codebase ready for final verification

---
*Phase: 11-agent-character-sheet*
*Completed: 2026-03-29*
