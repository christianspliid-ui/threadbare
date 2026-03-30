---
phase: 17-add-action-description-fields-and-player-feedback-on-action-activation
plan: "03"
subsystem: ActionCard UI + useAgentInteraction feedback pipeline
tags: [ui, feedback, animation, action-card, mtg-frame, glow-burst, toast, audio]
dependency_graph:
  requires: [17-01, 17-02]
  provides: [MTG frame ActionCard, glow burst animation, target_action audio+toast+narrative feedback]
  affects: [ActionCard.tsx, useAgentInteraction.ts, ActionDrawer, NarrativeLog]
tech_stack:
  added: []
  patterns:
    - MTG frame layout (spell name + art placeholder + type line + description + flavor + stats)
    - Differentiating animation classes by slot type (card-pulse vs card-glow-burst)
    - onPushToast callback pattern for cross-hook notification delivery
key_files:
  created: []
  modified:
    - src/components/Game/ActionCard.tsx
    - src/components/Game/__tests__/ActionCard.test.tsx
    - src/components/Game/__tests__/ActionCard-feedback.test.tsx
    - src/components/Game/hooks/useAgentInteraction.ts
    - src/components/Game/__tests__/useAgentInteraction-effects.test.tsx
decisions:
  - "Hand cards replaced with art-only layout: sphere gradient background, name overlay at bottom, centered glyph at 40% opacity — no description text visible"
  - "Focused cards use MTG frame: spell name zone (36px), art placeholder (112px), type line with reach+CRUD, technicalDescription box, italic flavor text, stats row"
  - "Type line parsing: slot id suffix split on '.', parts[1]=reach, parts[2]=crud, uppercase both"
  - "Glow burst uses card-glow-burst CSS class (600ms, scale 1.02, sphere box-shadow); cardPulse kept for intervention slots"
  - "target_action audio plays synchronously in click handler (Web Audio API user gesture requirement)"
  - "Toast delivery uses optional onPushToast callback on useAgentInteraction — avoids adding notifications field to GameState and keeps notification state in useNotifications"
  - "Consequence message priority: consequenceMessage.success > narrativeTemplates.success > fallback string"
  - "recentEvents entry uses isInterventionBeat:true so NarrativeLog styles it with sphere color accent"
metrics:
  duration: 10min
  completed: "2026-03-30"
  tasks_completed: 3
  files_modified: 5
---

# Phase 17 Plan 03: ActionCard MTG Frame + Feedback Pipeline Summary

ActionCard redesigned to MTG-classic frame in focused mode, art-only layout in hand mode. Glow burst animation added for target_action activation. Target action feedback pipeline wired: sphere audio + toast + narrative feed entry on dispatch.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Redesign ActionCard focused layout to MTG frame + hand to art-only | 039dd65 | ActionCard.tsx, ActionCard.test.tsx |
| 2 | Add glow burst animation + update feedback tests | 5ab740c | ActionCard-feedback.test.tsx |
| 3 | Wire target_action feedback: sphere audio + toast + narrative feed | efbc31a | useAgentInteraction.ts, useAgentInteraction-effects.test.tsx |

## What Was Built

### Task 1: ActionCard MTG Frame Layout

**Focused layout (MTG frame):**
- Spell name zone (36px): `slot.spellName ?? slot.label` in display font 18px
- Art frame placeholder (112px): sphere-colored gradient with centered glyph at 60% opacity
- Type line: gold divider + `REACH · CRUD` extracted from slot id suffix, sphere glyph prefix
- Description box: `slot.technicalDescription` in 14px body font (omitted when absent)
- Flavor text: `slot.description` in italic 14px body font, separated by subtle border when description present
- Stats row: detection risk + hex distance (unchanged)

**Hand layout (art-only):**
- Full-card sphere gradient background (replaces `--bg-raised`)
- Name overlay: absolute at bottom, dark background, display font, 2-line clamp
- Centered glyph at 40% opacity as subtle background element
- No description, type line, or stats row rendered

### Task 2: Glow Burst Animation

- `cardGlowBurst` keyframe: 0%→scale(1), 40%→scale(1.02) + 24px sphere box-shadow, 100%→fade
- `card-glow-burst` CSS class applied when `playing && slot.type === 'target_action'`
- `card-pulse` CSS class kept for intervention slots (no regression)
- 5 new glow burst tests covering differentiation, keyframe presence, 600ms duration

### Task 3: Target Action Feedback Pipeline

**Wiring in `useAgentInteraction.handleWheelSlotClick`:**
- Detects `slot.type === 'target_action'` branch before intervention path
- Calls `playCastSound(slot.sphere, false)` synchronously (Web Audio API gesture requirement)
- Sets `playingCardId` immediately (triggers glow burst)
- 600ms `setTimeout` → `createUnifiedAction` + consequence message build + `onPushToast` + `setGameState` (narrative event) + close drawer
- Consequence message chain: `consequenceMessage.success ?? narrativeTemplates.success ?? fallback`

**`onPushToast` callback:**
- Optional parameter added to `UseAgentInteractionParams`
- Called with `ToastItem` (sphere-colored, 4s expiry) after action dispatch
- GameView can wire `notificationState` setter without GameState coupling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `notifications.toasts` not in GameState — routed via callback**
- **Found during:** Task 3
- **Issue:** Plan specified pushing to `notifications.toasts` via `setGameState`, but `GameState` has no `notifications` field — toasts are managed by `useNotifications` hook with its own state
- **Fix:** Added `onPushToast?: (toast: ToastItem) => void` optional callback parameter to `UseAgentInteractionParams`. GameView can pass `setState` from its own `notificationState` when wiring. This preserves separation of concerns and avoids architectural changes.
- **Files modified:** `src/components/Game/hooks/useAgentInteraction.ts`
- **Commit:** efbc31a

**2. [Rule 1 - Bug] Mock GameState missing `encounterProgress` and `familiarityMap` type**
- **Found during:** Task 3 (test fixes)
- **Issue:** Test mock used `familiarityMap: {}` (plain object) but engine expects `Map.get()`. Also missing `encounterProgress: []`.
- **Fix:** Updated mock to use `familiarityMap: new Map() as any` and added `encounterProgress: []`, `actionsInProgress: []`, `agentKnowledge: new Map()`
- **Files modified:** `useAgentInteraction-effects.test.tsx`
- **Commit:** efbc31a

## Self-Check: PASSED

All files created/modified confirmed present. All 3 task commits confirmed in git log.
