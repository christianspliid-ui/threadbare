---
phase: 16-expand-retinue-sidebar-threads-area
plan: "02"
subsystem: ui-threads-detail
tags: [threads, sidebar, detail-view, modals, gameview-layout]
dependency_graph:
  requires: [16-01]
  provides: [ThreadDetailView, LocationProfileModal, FactionSheet, ArmySheet, ArtifactSheet]
  affects: [GameView, sidebar-layout]
tech_stack:
  added: []
  patterns: [flex-container-sibling-scroll, per-category-detail-dispatch, stub-modal-shell]
key_files:
  created:
    - src/components/Game/ThreadDetailView.tsx
    - src/components/Game/__tests__/ThreadDetailView.test.tsx
    - src/components/Game/LocationProfileModal.tsx
    - src/components/Game/FactionSheet.tsx
    - src/components/Game/ArmySheet.tsx
    - src/components/Game/ArtifactSheet.tsx
  modified:
    - src/components/Game/GameView.tsx
    - src/components/Game/__tests__/GameView-interaction.test.tsx
    - src/components/Game/__tests__/GameView-progressive.test.tsx
decisions:
  - "ThreadDetailView floats LEFT of sidebar — detail and sidebar are sibling divs with independent overflow-y auto scroll contexts"
  - "handleOpenProfileModal dispatches by category: agent uses existing AgentProfileModal flow, non-agent types open stub modals"
  - "Faction sphere alignment shown FIRST per CONTEXT.md locked decision"
  - "Escape key closes detail view via AnimateMount show binding (selectedThreadNode null)"
  - "Test fix for GameView tests: /Retinue|No agents/ regex updated to /Threads|No agents|Agents/ after Plan 16-01 panel rename"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 6
  files_modified: 3
---

# Phase 16 Plan 02: ThreadDetailView + Stub Profile Modals Summary

**One-liner:** Floating ThreadDetailView with per-type data fields (faction shows sphere first), 4 stub modals, and GameView flex sidebar layout for independent scroll contexts.

## What Was Built

### ThreadDetailView (`src/components/Game/ThreadDetailView.tsx`)
- Floating detail panel that renders to the LEFT of the sidebar
- Dispatches per category: agent, location, faction, army, artifact
- Header: type badge (small caps), entity name, tier badge, close button with `aria-label="Close detail"`
- Body: adaptive fields — only non-null values rendered
- Faction detail shows sphere alignment as FIRST field per CONTEXT.md locked decision
- Agent detail uses `agentInfoCard.domains` grid (2-col) + sphere + quintessence + activity
- Footer: "View Full Profile" link calling `onViewProfile(nodeId, category)`

### GameView Layout Restructure (`src/components/Game/GameView.tsx`)
- Sidebar div replaced by `flex` container with two sibling divs:
  1. `data-testid="thread-detail-scroll"` — `width: clamp(240px, 280px, 30vw)`, `overflowY: auto`, wrapped in `AnimateMount show={selectedThreadNode !== null}`
  2. `data-testid="right-sidebar"` — existing sidebar content with `overflowY: auto`
- Both are siblings = independent scroll contexts (no child/parent overflow issues)
- `handleOpenProfileModal` callback routes to agent modal or stub modal by category
- `stubModalState` state manages which stub modal is open

### Stub Profile Modals
- `LocationProfileModal` — "Full location profile coming in a future update."
- `FactionSheet` — "Full faction sheet coming in a future update."
- `ArmySheet` — "Full army sheet coming in a future update."
- `ArtifactSheet` — "Full artifact sheet coming in a future update."

All 4 use `Modal` component with `Modal.Header` + `Modal.Body` pattern.

## Tests

`src/components/Game/__tests__/ThreadDetailView.test.tsx` — 12 tests:
1. Agent detail with domain capabilities grid (agentInfoCard provided)
2. Agent detail fallback fields (agentInfoCard null)
3. Location detail with prosperity + controlling faction
4. Faction detail with sphere alignment as FIRST field
5. Faction detail without sphere when dominantSphere null
6. Army detail with strength and objective
7. Artifact detail with bearer name
8. Artifact detail "(location unknown)"
9. Close button calls onClose
10. View Full Profile calls onViewProfile with correct args
11. Scroll context isolation DOM assertion
12. Category badge shows for agent nodes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GameView tests failing after Plan 16-01 panel rename**
- **Found during:** Full test suite run after implementation
- **Issue:** `GameView-interaction.test.tsx` and `GameView-progressive.test.tsx` both checked `rightSidebar?.textContent` against `/Retinue|No agents/` — but Plan 16-01 renamed RetinuePanel to ThreadsPanel, so the sidebar now shows "Threads" not "Retinue"
- **Fix:** Updated both test regexes to `/Threads|No agents|Agents/`
- **Files modified:** `src/components/Game/__tests__/GameView-interaction.test.tsx`, `src/components/Game/__tests__/GameView-progressive.test.tsx`
- **Commit:** 1a38255

## Self-Check

Files created/modified:
- `src/components/Game/ThreadDetailView.tsx` — FOUND
- `src/components/Game/__tests__/ThreadDetailView.test.tsx` — FOUND
- `src/components/Game/LocationProfileModal.tsx` — FOUND
- `src/components/Game/FactionSheet.tsx` — FOUND
- `src/components/Game/ArmySheet.tsx` — FOUND
- `src/components/Game/ArtifactSheet.tsx` — FOUND
- `src/components/Game/GameView.tsx` — modified, FOUND

Commits:
- b5c53f3 — feat(16-02): ThreadDetailView, stub modals, and GameView sidebar flex layout
- 1a38255 — fix(16-02): update GameView tests for ThreadsPanel rename from Plan 16-01

## Self-Check: PASSED
