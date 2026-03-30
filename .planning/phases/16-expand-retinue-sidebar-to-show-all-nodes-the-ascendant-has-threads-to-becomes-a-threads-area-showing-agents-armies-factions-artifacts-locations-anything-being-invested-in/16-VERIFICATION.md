---
phase: 16-expand-retinue-sidebar-threads-area
verified: 2026-03-30T14:20:00Z
status: gaps_found
score: 6/7 must-haves verified
re_verification: false
gaps:
  - truth: "Escape key closes the detail view"
    status: failed
    reason: "No Escape key handler added to GameView or ThreadDetailView. Plan 02 Task 1 Step 4 required adding Escape handling to GameView's key handler, but no keydown listener was wired. The only way to close ThreadDetailView is via the X button."
    artifacts:
      - path: "src/components/Game/GameView.tsx"
        issue: "No useEffect with document.addEventListener('keydown') targeting selectedThreadNode + handleThreadDetailClose"
      - path: "src/components/Game/ThreadDetailView.tsx"
        issue: "No Escape key handler — not a Modal, so it does not inherit Modal's built-in Escape handling"
    missing:
      - "Add a useEffect in GameView.tsx: when selectedThreadNode is non-null, listen for Escape key and call handleThreadDetailClose()"
human_verification:
  - test: "Visual layout at 1920x1080"
    expected: "ThreadsPanel renders compact ~40px rows in right sidebar; ThreadDetailView appears to the LEFT of the sidebar when a row is clicked, never overlapping it"
    why_human: "CSS layout verification — cannot confirm via DOM assertions whether clamp(240px, 280px, 30vw) detail view sits visually left of sidebar without WebGL canvas blocking view"
  - test: "Faction sphere alignment display in sidebar and detail"
    expected: "Faction rows in ThreadsPanel show sphere name as first item in secondary info (e.g., 'Flesh sphere · 7 hexes'); ThreadDetailView faction body leads with sphere field"
    why_human: "Runtime data verification — requires actual faction nodes with thread edges and sphere data in live game state"
  - test: "Eye icon centers map on entity hex"
    expected: "Clicking the eye icon on an agent/location/army row centers the Three.js camera on that entity's hex"
    why_human: "Camera behavior requires browser verification; Playwright cannot see WebGL canvas movement"
---

# Phase 16: Expand Retinue Sidebar — Threads Area Verification Report

**Phase Goal:** Transform the right sidebar's RetinuePanel into a comprehensive Threads panel showing every graph node the Ascendant has a thread edge to — agents, locations, factions, artifacts, armies — with compact grouped rows, a floating detail view, thread-creation divine actions, and stub profile modals for each non-agent type.
**Verified:** 2026-03-30T14:20:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 5 thread target node types appear grouped by type in the sidebar | VERIFIED | `ThreadsPanel.tsx` uses `groupThreadedNodes()`, renders sections for agent/location/faction/army/artifact with `SECTION_ORDER` iteration |
| 2 | Compact rows are ~40px tall with tier-colored left border, name, eye icon, secondary info | VERIFIED | `ThreadsPanel.tsx` line 55: `borderLeftWidth: '3px'`, `borderLeftColor: TIER_COLORS[node.tier]`; `px-2 py-1` padding; first/second line structure with name + eye icon |
| 3 | Agents section defaults open; other sections default collapsed | VERIFIED | `ThreadsPanel.test.tsx` test "Agents section is expanded by default" and "non-agent sections are collapsed by default" — 12/12 tests pass |
| 4 | Clicking a thread row opens a floating detail view LEFT of the sidebar | VERIFIED | `GameView.tsx` lines 1326-1360: `AnimateMount` wrapping `clamp(240px, 280px, 30vw)` detail div as sibling to `right-sidebar` div in a flex container |
| 5 | Faction entries show sphere alignment as first field in secondary info | VERIFIED | `ThreadsPanel.tsx` line 71: `spherePart` prepended before territoryCount/memberCount; test "faction secondary info shows sphere alignment first" passes |
| 6 | Thread-creation divine actions appear for location, faction, army, artifact targets | VERIFIED | `unified-action-templates.ts` lines 2538-2735: `bind_thread_location`, `bind_thread_faction`, `bind_thread_army`, `bind_thread_artifact` all present with `add_edge` GraphOps and correct `targetCategories` |
| 7 | Escape key closes the detail view | FAILED | No Escape key handler in `GameView.tsx` or `ThreadDetailView.tsx`. Plan 02 Task 1 Step 4 was not implemented. Only X button closes the view. |

**Score:** 6/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/retinue.ts` | `getThreadedNodes()`, `groupThreadedNodes()`, 5 `ThreadedNode` interfaces | VERIFIED | 559 lines; exports all required types and functions at lines 180-559 |
| `src/engine/__tests__/retinue.test.ts` | `describe('getThreadedNodes')` block with 9+ tests | VERIFIED | 23 `it()` cases including 12 new in `getThreadedNodes` describe block at line 418 |
| `src/components/Game/ThreadsPanel.tsx` | Grouped compact rows replacing RetinuePanel | VERIFIED | 346 lines; exports `ThreadsPanel`; `data-testid="thread-entry"`; `SectionHeading` and `TIER_COLORS` imports |
| `src/components/Game/__tests__/ThreadsPanel.test.tsx` | 8+ test cases including faction sphere | VERIFIED | 282 lines; 12 `it()` cases; faction sphere alignment test passes |
| `src/components/Game/ThreadDetailView.tsx` | Floating detail dispatching per node type | VERIFIED | 428 lines; `export const ThreadDetailView`; `aria-label="Close detail"`; `View Full Profile`; faction `dominantSphere` displayed first |
| `src/components/Game/__tests__/ThreadDetailView.test.tsx` | 9+ tests including all 5 node types | VERIFIED | 280 lines; 12 `it()` cases covering all 5 node type renderings |
| `src/components/Game/LocationProfileModal.tsx` | Stub modal with placeholder text | VERIFIED | `export const LocationProfileModal`; "Full location profile coming in a future update." |
| `src/components/Game/FactionSheet.tsx` | Stub modal with placeholder text | VERIFIED | `export const FactionSheet`; "Full faction sheet coming in a future update." |
| `src/components/Game/ArmySheet.tsx` | Stub modal with placeholder text | VERIFIED | `export const ArmySheet`; "Full army sheet coming in a future update." |
| `src/components/Game/ArtifactSheet.tsx` | Stub modal with placeholder text | VERIFIED | `export const ArtifactSheet`; "Full artifact sheet coming in a future update." |
| `src/data/unified-action-templates.ts` | 4 thread-creation templates merged | VERIFIED | `THREAD_CREATION_TEMPLATES` array at line 2538; `...THREAD_CREATION_TEMPLATES` merged at line 2735 |
| `src/engine/__tests__/unifiedActionResolution.test.ts` | `describe('thread-creation')` block | VERIFIED | 10 new tests in `describe('thread-creation GraphOp behavior')` at line 422 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `ThreadsPanel.tsx` | `src/engine/retinue.ts` | `groupThreadedNodes()` call | WIRED | `groupThreadedNodes` imported and called in component body |
| `GameView.tsx` | `ThreadsPanel.tsx` | JSX render in right sidebar | WIRED | Import at line 47; used at line 1365 with `threadedNodes` prop |
| `GameView.tsx` | `ThreadDetailView.tsx` | JSX render as sibling to sidebar | WIRED | Import at line 48; rendered at line 1340 inside `AnimateMount` |
| `ThreadDetailView.tsx` | `LocationProfileModal.tsx` | `onViewProfile` callback | WIRED | `handleOpenProfileModal` in GameView dispatches by category to `LocationProfileModal` at line 1447 |
| `useAgentInteraction.ts` | `retinue.ts` | `getThreadedNodes()` in `useMemo` | WIRED | Line 7 import; useMemo at line 80 calls `getThreadedNodes(gameState.graph, gameState.ascendantId)` |
| `unified-action-templates.ts` | `unifiedActionResolution.ts` | `add_edge` GraphOp in `onSuccess` | WIRED | `edgeType: 'thread'` in 4 templates; `edgeSchema.ts` updated to allow location/artifact targets |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| THRD-01 | 16-01-PLAN.md | Engine getThreadedNodes query | SATISFIED | `getThreadedNodes()` + 5 interface types in `retinue.ts`; 12 tests pass |
| THRD-02 | 16-01-PLAN.md | ThreadsPanel compact grouped rows | SATISFIED | `ThreadsPanel.tsx` renders grouped compact rows; 12 tests pass |
| THRD-03 | 16-02-PLAN.md | ThreadDetailView floating detail | SATISFIED | `ThreadDetailView.tsx` 428 lines; per-type adaptive display; 12 tests pass |
| THRD-04 | 16-01/02-PLAN.md | GameView layout restructure | SATISFIED | Flex container with `data-testid="thread-detail-scroll"` + `data-testid="right-sidebar"` as siblings |
| THRD-05 | 16-03-PLAN.md | Thread-creation action templates | SATISFIED | 4 templates (bind_thread_location/faction/army/artifact) in UNIFIED_ACTION_TEMPLATES |
| THRD-06 | 16-02-PLAN.md | Stub profile modals | SATISFIED | All 4 modals (LocationProfileModal, FactionSheet, ArmySheet, ArtifactSheet) exist, export, and are wired in GameView |
| THRD-07 | 16-01/02/03-PLAN.md | Tests | SATISFIED (partial) | 73 tests pass across 4 test files; Escape key behavior not tested (mirrors implementation gap) |

Note: THRD-* IDs are plan-internal requirements defined in ROADMAP.md. They do not exist in `.planning/REQUIREMENTS.md` which covers Hex Map V2 renderer requirements only.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `GameView.tsx` | 412 | `TODO: hex camera focus not yet implemented` | Info | Pre-existing, unrelated to phase 16 |
| Full test suite | - | 3 pre-existing test failures (`tickHealth-integration`, `traceBuffer-integration`, `encounter-liveness`) | Info | Pre-date phase 16; confirmed via `git log` — introduced before commit `8d42709` |

No stubs, empty return values, or placeholder implementations found in phase 16 artifacts.

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

### Gaps Summary

One gap was found blocking the stated plan requirement:

**Escape key not wired for ThreadDetailView.** Plan 02 Task 1 Step 4 specified adding an Escape key handler to GameView to close the detail view when `selectedThreadNode` is non-null. This was not implemented. The detail view can only be dismissed via the X close button. This is a minor UX gap — the core feature (grouped thread rows, floating detail, thread-creation actions, stub modals) is fully functional.

The fix is small: add a `useEffect` in `GameView.tsx` that attaches a `keydown` listener when `selectedThreadNode` is non-null, calling `handleThreadDetailClose()` on `Escape`. Approximately 8 lines of code.

The 3 failing tests in the full suite (`tickHealth-integration`, `traceBuffer-integration`, `encounter-liveness`) predate phase 16 by many commits and are not regressions from this work.

---

_Verified: 2026-03-30T14:20:00Z_
_Verifier: Claude (gsd-verifier)_
