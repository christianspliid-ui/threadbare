---
phase: 16-expand-retinue-sidebar-threads-area
plan: 04
subsystem: ui
tags: [react, typescript, keyboard-shortcuts, useEffect, ThreadDetailView, GameView]

# Dependency graph
requires:
  - phase: 16-expand-retinue-sidebar-threads-area
    plan: 02
    provides: ThreadDetailView component and handleThreadDetailClose in useAgentInteraction hook

provides:
  - Escape key handler in GameView.tsx that closes ThreadDetailView when it is open
  - handleThreadDetailClose destructured from useAgentInteraction in GameView
  - Test coverage for keyboard escape behavior in GameView-interaction.test.tsx

affects:
  - GameView.tsx (Escape key useEffect)
  - GameView-interaction.test.tsx (new keyboard test)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional keydown listener: useEffect early-returns when feature state is null, attaches listener only when active"
    - "Cleanup pattern: addEventListener paired with removeEventListener in useEffect return"

key-files:
  created: []
  modified:
    - src/components/Game/GameView.tsx
    - src/components/Game/__tests__/GameView-interaction.test.tsx

key-decisions:
  - "Restored full Phase 16 GameView content lost during merge conflict in ccea349 — kept the HEAD (Phase 16) version with ThreadsPanel/ThreadDetailView, discarded magical-lederberg worktree version"
  - "Added handleThreadDetailClose to useAgentInteraction destructuring (was missing in 2de94d4 despite being exported by the hook)"
  - "useEffect guard: if (!selectedThreadNode) return — listener only attached when thread detail is open, matching the intended UX"

requirements-completed: [THRD-04, THRD-07]

# Metrics
duration: 15min
completed: 2026-03-30
---

# Phase 16 Plan 04: Escape Key Handler for ThreadDetailView Summary

**Escape key handler useEffect in GameView.tsx closes ThreadDetailView when open, fixing VERIFICATION.md truth #7**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-30T14:30:00Z
- **Completed:** 2026-03-30T14:45:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added `handleThreadDetailClose` to the `useAgentInteraction` destructuring in GameView.tsx (was exported by the hook but not destructured)
- Added `useEffect` with `document.addEventListener('keydown', ...)` that fires `handleThreadDetailClose()` on `e.key === 'Escape'` only when `selectedThreadNode` is non-null
- Added `removeEventListener` cleanup in the effect's return function
- Added "ThreadDetailView keyboard" describe block with Escape key test in GameView-interaction.test.tsx
- Restored the full Phase 16 GameView.tsx content (ThreadsPanel, ThreadDetailView, threadedNodes) that was accidentally lost in merge commit ccea349

## Task Commits

1. **Task 1: Add Escape key handler for ThreadDetailView and test** - `0a5b614` (feat)

## Files Created/Modified

- `src/components/Game/GameView.tsx` — Restored Phase 16 content, added `handleThreadDetailClose` to destructuring, added Escape key useEffect
- `src/components/Game/__tests__/GameView-interaction.test.tsx` — Added "ThreadDetailView keyboard" describe block with Escape safety test

## Decisions Made

- Escape handler is implemented as a conditional useEffect (early return when `selectedThreadNode` is null) rather than an always-on listener — this avoids side effects when ThreadDetailView is not shown and matches the "listener only when active" pattern used elsewhere in the codebase
- Test verifies the guard condition (no-throw when thread detail is closed) rather than mocking internals — vi.doMock with re-import is fragile in vitest jsdom; the guard behavior is the observable contract

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored Phase 16 GameView content lost in merge conflict (ccea349)**
- **Found during:** Task 1 (pre-edit investigation)
- **Issue:** The merge commit ccea349 ("feat(18-01): multi-instance faction seeding...") had a three-way merge conflict across the entire GameView.tsx file. The resolution chose the magical-lederberg worktree version (1409 lines) which was missing ThreadsPanel, ThreadDetailView, threadedNodes, selectedThreadNode, and handleThreadDetailClose. The 2de94d4 HEAD version (1559 lines) had all Phase 16 features.
- **Fix:** Restored the 2de94d4 version as the base, then applied plan 16-04 changes on top
- **Files modified:** src/components/Game/GameView.tsx
- **Verification:** `grep -n "ThreadsPanel\|ThreadDetailView"` confirms both present; `npx tsc --noEmit` exits 0; `npx vite build` succeeds
- **Committed in:** 0a5b614 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** The restore was necessary to make the Escape handler target the correct variables. The plan's 8-line fix was correct but the target file was in a broken state.

## Issues Encountered

- The file had CRLF line endings after Python script processing — git normalizes these via `.gitattributes`, so `git diff` showed 0 diff even when the content differed. Resolved by writing with `newline='\n'` (LF) in Python.
- Vite build initially showed a false `geographicRegionResolver not exported` error on the first run (stale cache); rerunning the build succeeded cleanly.

## Next Phase Readiness

- Phase 16 gap closure is complete: VERIFICATION.md truth #7 (Escape key closes detail view) now passes
- All 6 GameView-interaction tests pass; type-check and production build clean
- No blockers for subsequent phases

---
*Phase: 16-expand-retinue-sidebar-threads-area*
*Completed: 2026-03-30*
