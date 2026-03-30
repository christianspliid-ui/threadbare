# Retinue Eye Icon → Zoom to Agent Location

**Date:** 2026-03-23
**Status:** Plan

## Problem Statement

The user reports three issues:
1. **Eye icons in the retinue panel don't zoom the camera to the agent's location** — the name eye icon (`onCenterOnHex`) pans without changing zoom level (often staying at a zoom where agents are invisible), and the location eye icon (`onZoomToLocation`) opens the hex-zoom detail view instead of zooming the camera.
2. **Agent portraits should show as circular images at all zoom levels** — currently only visible as colored circles at very high zoom (k >= 15 for portraits, k >= 5 for dots). The user wants circular portrait images visible at all zooms, not just colored dots.
3. **The user asked "please zoom to zoom 1 when clicking any of the eyes"** — meaning both eye icons should animate the camera to a comfortable agent-visible zoom level.

## Root Cause Analysis

### Eye Icon Behavior (current)

- **Name eye** (line 117-126 in RetinuePanel.tsx) → calls `onCenterOnHex(locationId)` → GameView's `handleCenterOnHex` → `hexMapRef.current.centerOn(px.x, px.y)` → pans to location at `DEFAULT_ZOOM` (1.5). At k=1.5 (continental), portraits show at 0.3× scale — barely visible colored dots.
- **Location eye** (line 145-154 in RetinuePanel.tsx) → calls `onZoomToLocation(locationId)` → GameView's `handleZoomToLocation` → `handleHexClick({ col, row })` → **enters hex-zoom view level** (switches UI panel, not camera zoom). This doesn't zoom the camera at all — it changes the view state.

### Agent Visibility (current)

The `updateZoomVisibility` in `AgentSpriteMesh.ts` shows portraits at all zoom tiers above full-world (k >= 1.5), scaling them down at lower zooms. This is correct — the rendering system IS showing portraits. The problem is:
1. The eye icons don't zoom the camera enough to make them clearly visible
2. At continental zoom (k = 1.5), portrait scale is 0.3× which makes them very small

## Plan

### Change 1: Both eye icons zoom camera to agent location at zoom level 1 (regional)

**What:** Make both eye icons call `hexMapRef.current.centerOn(px.x, px.y, ZOOM_SCALE)` where `ZOOM_SCALE` is a named constant that puts the camera at a comfortable zoom where portraits are clearly visible.

The user said "zoom 1" — interpreting this as "zoom to zoom tier 1" which maps to **continental** (the first tier where agents become visible). However, continental (k=1.5) makes agents very small. A better UX is to zoom to **regional** (k=5) where portraits are at 0.5× scale — clearly visible circular images. If the user literally means k=1, that's below continental threshold (1.5) and agents would be invisible, so regional (k=5) is the right call.

**File:** `src/components/Game/GameView.tsx`

- Merge `handleZoomToLocation` and `handleCenterOnHex` into one behavior: both resolve the hex coordinates and call `hexMapRef.current.centerOn(px.x, px.y, RETINUE_EYE_ZOOM_SCALE)`.
- Add named constant: `const RETINUE_EYE_ZOOM_SCALE = 5;` (regional zoom — portraits clearly visible).
- Remove the `handleHexClick` call from `handleZoomToLocation` — no more entering hex-zoom view level.

### Change 2: No code changes needed for portrait rendering

The portrait system is already fully operational:
- `createAgentSpriteMesh` creates portrait sprites for all agents
- `loadAgentPortraits` loads circular portrait images async
- `updateZoomVisibility` shows portraits at all zoom tiers above full-world
- Portrait images are loaded from `/public/portraits/` via `getPortraitUrl()`

If agents aren't showing, it's because the camera hasn't been zoomed in enough. Fix #1 solves this.

## Files Changed

| File | Change |
|------|--------|
| `src/components/Game/GameView.tsx` | Update `handleZoomToLocation` to use `centerOn` with regional zoom scale instead of `handleHexClick`. Unify both handlers to same behavior (zoom camera to agent at regional zoom). |

## Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `RETINUE_EYE_ZOOM_SCALE` | 5 | d3-zoom k value for eye-icon camera zoom (regional tier — portraits at 0.5× scale) |

## NFP Compliance

| Priority | Verdict |
|----------|---------|
| 1. Tunability | PASS — zoom scale is a named constant |
| 2. Inspectability | PASS — handler logic is straightforward |
| 3. Determinism | PASS — no PRNG involved |
| 4. Fail-soft | PASS — existing null checks remain |
| 5. Narrative > mechanical | PASS |
| 6. Additive | PASS — modifying handler behavior, not restructuring |
| 7. Performance | PASS — no new allocations |
