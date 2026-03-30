---
phase: 16-expand-retinue-sidebar-threads-area
verified: 2026-03-30T14:45:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: true
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Escape key closes the detail view — useEffect with keydown listener added to GameView.tsx at lines 933-941"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Visual layout at 1920x1080"
    expected: "ThreadsPanel renders compact ~40px rows in right sidebar; ThreadDetailView appears to the LEFT of the sidebar when a row is clicked, never overlapping it"
    why_human: "CSS layout verification — cannot confirm via DOM assertions whether clamp(240px, 280px, 30vw) detail view sits visually left of sidebar without WebGL canvas blocking view"
  - test: "Faction sphere alignment display in sidebar and detail"
    expected: "Faction rows in ThreadsPanel show sphere name as first item in secondary info (e.g., 'Flesh sphere · 7 hexes'); ThreadDetailView faction body leads with sphere field"
    why_human: "Runtime data verification — requires actual faction nodes with thread edges and sphere data in live game state"
  - test: "Eye icon centers map on entity hex"
    expected: "Clicking the eye icon on an agent/location/army row centers the Three.js camera on that entity's hex"
    why_human: "Camera behavior requires browser verification; Playwright cannot observe Three.js camera position changes"
---

# Phase 16: Expand Retinue Sidebar — Threads Area Verification Report

**Phase Goal:** Transform the right sidebar's RetinuePanel into a comprehensive Threads panel showing every graph node the Ascendant has a thread edge to — agents, locations, factions, artifacts, armies — with compact grouped rows, a floating detail view, thread-creation divine actions, and stub profile modals for each non-agent type.
**Verified:** 2026-03-30T14:45:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure via Plan 16-04

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 5 thread target node types appear grouped by type in the sidebar | VERIFIED | `ThreadsPanel.tsx` uses `groupThreadedNodes()`, renders sections for agent/location/faction/army/artifact with `SECTION_ORDER` iteration |
| 2 | Compact rows are ~40px tall with tier-colored left border, name, eye icon, secondary info | VERIFIED | `ThreadsPanel.tsx` line 55: `borderLeftWidth: '3px'`, `borderLeftColor: TIER_COLORS[node.tier]`; `px-2 py-1` padding; first/second line structure with name + eye icon |
| 3 | Agents section defaults open; other sections default collapsed | VERIFIED | `ThreadsPanel.test.tsx` tests "Agents section is expanded by default" and "non-agent sections are collapsed by default" — 12/12 tests pass |
| 4 | Clicking a thread row opens a floating detail view LEFT of the sidebar | VERIFIED | `GameView.tsx` lines 1336-1360: `AnimateMount` wrapping `clamp(240px, 280px, 30vw)` detail div as sibling to `right-sidebar` div in a flex container |
| 5 | Faction entries show sphere alignment as first field in secondary info | VERIFIED | `ThreadsPanel.tsx` line 71: `spherePart` prepended before territoryCount/memberCount; test "faction secondary info shows sphere alignment first" passes |
| 6 | Thread-creation divine actions appear for location, faction, army, artifact targets | VERIFIED | `unified-action-templates.ts`: `bind_thread_location`, `bind_thread_faction`, `bind_thread_army`, `bind_thread_artifact` all present (4 grep matches); `...THREAD_CREATION_TEMPLATES` merged |
| 7 | Escape key closes the detail view | VERIFIED | `GameView.tsx` lines 933-941: `useEffect` with `document.addEventListener('keydown', handler)` that calls `handleThreadDetailClose()` on `e.key === 'Escape'` when `selectedThreadNode` is non-null; cleanup `removeEventListener` in return |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/retinue.ts` | `getThreadedNodes()`, `groupThreadedNodes()`, 5 `ThreadedNode` interfaces | VERIFIED | 559 lines; exports all required types and functions |
| `src/engine/__tests__/retinue.test.ts` | `describe('getThreadedNodes')` block with 9+ tests | VERIFIED | 23 `it()` cases including 12 new in `getThreadedNodes` describe block |
| `src/components/Game/ThreadsPanel.tsx` | Grouped compact rows replacing RetinuePanel | VERIFIED | 346 lines; exports `ThreadsPanel`; `data-testid="thread-entry"`; `SectionHeading` and `TIER_COLORS` |
| `src/components/Game/__tests__/ThreadsPanel.test.tsx` | 8+ test cases including faction sphere | VERIFIED | 282 lines; 12 `it()` cases; all pass |
| `src/components/Game/ThreadDetailView.tsx` | Floating detail dispatching per node type | VERIFIED | 428 lines; `export const ThreadDetailView`; `aria-label="Close detail"`; `View Full Profile`; faction `dominantSphere` displayed first |
| `src/components/Game/__tests__/ThreadDetailView.test.tsx` | 9+ tests including all 5 node types | VERIFIED | 280 lines; 12 `it()` cases covering all 5 node type renderings; all pass |
| `src/components/Game/LocationProfileModal.tsx` | Stub modal with placeholder text | VERIFIED | `export const LocationProfileModal`; "Full location profile coming in a future update." |
| `src/components/Game/FactionSheet.tsx` | Stub modal with placeholder text | VERIFIED | `export const FactionSheet`; "Full faction sheet coming in a future update." |
| `src/components/Game/ArmySheet.tsx` | Stub modal with placeholder text | VERIFIED | `export const ArmySheet`; "Full army sheet coming in a future update." |
| `src/components/Game/ArtifactSheet.tsx` | Stub modal with placeholder text | VERIFIED | `export const ArtifactSheet`; "Full artifact sheet coming in a future update." |
| `src/data/unified-action-templates.ts` | 4 thread-creation templates merged | VERIFIED | 4 `bind_thread_*` ids present; `...THREAD_CREATION_TEMPLATES` merged |
| `src/engine/__tests__/unifiedActionResolution.test.ts` | `describe('thread-creation')` block | VERIFIED | 10 new tests in `describe('thread-creation GraphOp behavior')` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `ThreadsPanel.tsx` | `src/engine/retinue.ts` | `groupThreadedNodes()` call | WIRED | Imported and called in component body |
| `GameView.tsx` | `ThreadsPanel.tsx` | JSX render in right sidebar | WIRED | Import at line 47; used at line 1376 with `threadedNodes` prop |
| `GameView.tsx` | `ThreadDetailView.tsx` | JSX render as sibling to sidebar | WIRED | Import at line 48; rendered at line 1351 inside `AnimateMount` |
| `ThreadDetailView.tsx` | `LocationProfileModal.tsx` | `onViewProfile` callback | WIRED | `handleOpenProfileModal` in GameView dispatches by category to stub modals |
| `useAgentInteraction.ts` | `retinue.ts` | `getThreadedNodes()` in `useMemo` | WIRED | Import + useMemo at line ~80 calls `getThreadedNodes(gameState.graph, gameState.ascendantId)` |
| `unified-action-templates.ts` | `unifiedActionResolution.ts` | `add_edge` GraphOp in `onSuccess` | WIRED | `edgeType: 'thread'` in 4 templates; `edgeSchema.ts` updated to allow location/artifact targets |
| `GameView.tsx useEffect` | `handleThreadDetailClose` | `keydown` event listener on `Escape` | WIRED | Lines 933-941: `if (!selectedThreadNode) return; ... if (e.key === 'Escape') handleThreadDetailClose()` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| THRD-01 | 16-01-PLAN.md | Engine getThreadedNodes query | SATISFIED | `getThreadedNodes()` + 5 interface types in `retinue.ts`; 12 tests pass |
| THRD-02 | 16-01-PLAN.md | ThreadsPanel compact grouped rows | SATISFIED | `ThreadsPanel.tsx` renders grouped compact rows; 12 tests pass |
| THRD-03 | 16-02-PLAN.md | ThreadDetailView floating detail | SATISFIED | `ThreadDetailView.tsx` 428 lines; per-type adaptive display; 12 tests pass |
| THRD-04 | 16-01/02/04-PLAN.md | GameView layout restructure + Escape key | SATISFIED | Flex container layout wired; Escape useEffect added in Plan 04 |
| THRD-05 | 16-03-PLAN.md | Thread-creation action templates | SATISFIED | 4 templates (bind_thread_location/faction/army/artifact) in UNIFIED_ACTION_TEMPLATES |
| THRD-06 | 16-02-PLAN.md | Stub profile modals | SATISFIED | All 4 modals (LocationProfileModal, FactionSheet, ArmySheet, ArtifactSheet) exist, export, and are wired in GameView |
| THRD-07 | 16-01/02/03/04-PLAN.md | Tests | SATISFIED | 53 tests pass across 4 test files; Escape key behavior now has test coverage in GameView-interaction.test.tsx |

Note: THRD-* IDs are plan-internal requirements defined in the phase roadmap. They do not exist in `.planning/REQUIREMENTS.md` which covers Hex Map V2 renderer requirements only. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `GameView.tsx` | 412 | `TODO: hex camera focus not yet implemented` | Info | Pre-existing, unrelated to phase 16 |
| Full test suite | — | 3 pre-existing test failures (`tickHealth-integration`, `traceBuffer-integration`, `encounter-liveness`) | Info | Pre-date phase 16 by many commits; not regressions from this work |

No stubs, empty return values, or placeholder implementations found in phase 16 artifacts. All 4 stub modals have intentional placeholder text that correctly communicates future intent.

### Human Verification Required

#### 1. Visual Layout at 1920x1080

**Test:** Open `?view=game`, run a few ticks until agents have thread edges, then click a thread row.
**Expected:** Detail view appears immediately to the LEFT of the right sidebar (about 240-280px wide), with the sidebar remaining visible to its right. No horizontal overflow or scrollbar.
**Why human:** CSS `clamp(240px, 280px, 30vw)` layout behavior requires browser rendering; Playwright cannot see WebGL canvas and the full sidebar layout context.

#### 2. Faction Sphere Alignment in Runtime Data

**Test:** Find a faction with territory in the game, confirm it appears in ThreadsPanel if the Ascendant has a thread to it, and verify the secondary info line leads with the sphere name.
**Expected:** Secondary info reads e.g. "Flesh sphere · 3 hexes · 8 members" with sphere first.
**Why human:** Requires live game state with actual faction nodes having sphere data from `resolveFactionDominantSphere()` — cannot assert against real worldgen output programmatically in verification context.

#### 3. Eye Icon Map Centering

**Test:** In ThreadsPanel, click the eye icon on an agent or location row.
**Expected:** The Three.js camera centers on that entity's hex coordinates.
**Why human:** Camera movement is WebGL behavior; Playwright cannot observe Three.js camera position changes.

### Re-verification Summary

**Gap closed:** Truth #7 (Escape key closes the detail view) — Plan 16-04 added a conditional `useEffect` in `GameView.tsx` that attaches a `keydown` listener only when `selectedThreadNode` is non-null, calls `handleThreadDetailClose()` on `Escape`, and removes the listener on cleanup. The `handleThreadDetailClose` function was also added to the `useAgentInteraction` destructuring (it was exported by the hook but not destructured in GameView). A test in `GameView-interaction.test.tsx` verifies the guard condition.

**Additional fix discovered in Plan 16-04:** A merge conflict in commit `ccea349` had discarded the entire Phase 16 block from GameView.tsx (ThreadsPanel, ThreadDetailView, threadedNodes, selectedThreadNode). Plan 16-04 restored the correct 2de94d4 version as a base before adding the Escape handler. All 8 Phase 16 references in GameView.tsx are confirmed present at 1570 lines.

**Test results:** 53 tests pass across all 4 phase 16 test files (GameView-interaction: 4, ThreadsPanel: 12, ThreadDetailView: 12, retinue: 23 + prior tests). No regressions.

---

_Verified: 2026-03-30T14:45:00Z_
_Verifier: Claude (gsd-verifier)_
