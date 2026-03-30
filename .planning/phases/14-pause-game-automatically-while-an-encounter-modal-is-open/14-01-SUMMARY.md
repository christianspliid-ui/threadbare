---
phase: 14-pause-game-automatically-while-an-encounter-modal-is-open
plan: "01"
subsystem: game-loop-encounter-ui
tags: [encounter, auto-pause, simulation, useEffect, useRef]
dependency_graph:
  requires: []
  provides: [encounter-auto-pause]
  affects: [GameView, tick-loop, TieredEncounterModal, MeetingEncounterModal]
tech_stack:
  added: []
  patterns: [useRef-for-pre-modal-state, useEffect-derived-boolean-pause, conditional-resume-on-close]
key_files:
  created:
    - src/components/Game/__tests__/encounterAutoPause.test.ts
  modified:
    - src/components/Game/GameView.tsx
decisions:
  - Used useRef (not useState) for wasRunningBeforeEncounterPause to avoid re-render churn
  - Computed encounterModalOpen as a derived boolean from both modal states to keep one unified useEffect
  - handleMeetingClose extracted from inline lambda so it can access the wasRunning ref
  - Removed courtPosition !== 'the_first' filter so ALL encounters auto-interrupt
  - Focused unit test (renderHook) instead of full GameView render — 1300+ line component has too many deps for isolation testing
metrics:
  duration: 3min
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 2
---

# Phase 14 Plan 01: Auto-Pause Encounter Modals Summary

**One-liner:** Auto-pause tick loop on encounter modal open using wasRunningBeforeEncounterPause ref with conditional resume on close.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add auto-pause/resume logic for encounter modals | aa676b1 | src/components/Game/GameView.tsx |
| 2 | Add tests for auto-pause/resume behavior | ac402f2 | src/components/Game/__tests__/encounterAutoPause.test.ts |

## What Was Built

### Task 1: GameView.tsx changes

Added to `src/components/Game/GameView.tsx`:

- `import { useRef }` added to React imports
- `const wasRunningBeforeEncounterPause = useRef<boolean>(false)` — tracks pre-modal running state
- `const encounterModalOpen = tieredEncounterState !== null || meetingState !== null` — unified derived boolean
- `useEffect` that watches `encounterModalOpen && running` → sets `wasRunning` ref and calls `setRunning(false)`
- `handleEncounterClose` updated to check `wasRunningBeforeEncounterPause.current` and call `setRunning(true)` on close
- `handleMeetingClose` new callback with same resume pattern
- `MeetingEncounterModal` JSX updated from `onClose={() => setMeetingState(null)}` to `onClose={handleMeetingClose}`
- Auto-interrupt effect: removed `courtPosition !== 'the_first'` filter and `setRunning(false)` call (now handled by general useEffect)

### Task 2: Unit tests

Created `src/components/Game/__tests__/encounterAutoPause.test.ts` with 5 tests in `describe('encounter auto-pause')`:

1. pauses when encounter modal opens while running
2. resumes when encounter modal closes if game was running before
3. stays paused after encounter close if manually paused before
4. does not set wasRunning when game was already paused before modal opens
5. handles rapid open/close without stale wasRunning state

Tests use `renderHook` with a minimal hook mirroring the production useEffect/useRef pattern.

## Verification

- `npx tsc --noEmit` — passes (0 errors)
- `npm test` — 7013 tests pass, 469 test files, no regressions
- `npx vite build` — production build succeeds

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/components/Game/GameView.tsx` — exists and contains all required patterns
- `src/components/Game/__tests__/encounterAutoPause.test.ts` — exists with 5 tests
- Commit aa676b1 — exists (Task 1)
- Commit ac402f2 — exists (Task 2)
