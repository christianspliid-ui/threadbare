# Phase 8: Integration - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire HexMapV2 into GameView, replacing the old SVG hex map with full game system connectivity. Remove all V1 SVG map code. Ensure all existing game systems (hex chronicle, location view, agent interaction, fog toggle, avatar movement) work with the new renderer without engine changes.

</domain>

<decisions>
## Implementation Decisions

### V1 code removal
- Full delete of all V1 SVG hex map components: HexMap.tsx, HexTile.tsx, AgentDots.tsx, MovementTrails.tsx, CoastlineOverlay.tsx, RiverOverlay.tsx, RegionLabels.tsx, GhostDots.tsx
- Delete V1-only hooks (useCoastline.ts, useRivers.ts) if not referenced by HexMapV2
- Clean break, no archived/disabled code left behind
- CLAUDE.md explicitly mandated this removal

### URL routing
- `?view=game` keeps its current behavior (skips worldgen, enters game directly) but now renders HexMapV2 instead of the SVG map. No URL breaking change.
- `?view=hexv2` remains as a standalone test harness — bare HexMapV2 without game chrome (no sidebar, hex chronicle, or game UI). Useful for renderer-only testing.
- Both routes coexist: `?view=game` = full game + HexMapV2, `?view=hexv2` = renderer sandbox

### Documentation cleanup
- Update CLAUDE.md, STYLE.md, and all docs that reference V1 SVG map, HexMap.tsx, or the old renderer
- Remove "V1 hex map development is stopped" notes — V1 no longer exists
- Update the rejected approaches list and dev quick-start URLs table

### Claude's Discretion
- Data threading approach for new HexMapV2 props (riverPaths, lakeIds, regionData, locations, agents) — researcher/planner decides how to get WorldGenResult data through useSimulation into GameView
- Agent click handling — whether agents are clickable on the Three.js canvas directly or routed through hex click + hex chronicle
- Fantasy overlay pass (WGEN-14) implementation approach — how sphere alignment transforms base biomes into magical variants
- Which V1 tests need updating vs deleting vs keeping as-is

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Integration surface
- `src/components/Game/GameView.tsx` — Primary integration target. Lines 554-579 render old HexMap with click handlers.
- `src/components/HexMapV2/HexMapV2.tsx` — New renderer entry point. Props interface and HexMapV2Handle at top.
- `src/components/HexMap/HexMap.tsx` — Old SVG map to be deleted. Read for prop interface compatibility reference.

### Navigation and click flow
- `src/components/Game/useViewNavigation.ts` — View level state machine (world/hex-zoom/location). handleHexClickMove at line 114.
- `src/components/Game/useAvatarData.ts` — Derives avatar position, location overlays, route data from graph.
- `src/components/Game/useAgentInteraction.ts` — Agent selection handler.

### URL routing
- `src/App.tsx` — Route switch for ?view=hexv2, ?view=game, etc. Lines 38-61.

### HexMapV2 scene layers
- `src/components/HexMapV2/scene/` — All Three.js scene layer modules (FogCulling, ZoomVisibilityMatrix, AgentSpriteMesh, etc.)
- `src/components/HexMapV2/camera/D3ZoomCamera.ts` — Camera sync with d3-zoom
- `src/components/HexMapV2/camera/FollowMode.ts` — Camera follow agent

### Requirements
- `.planning/REQUIREMENTS.md` §Integration (INTG) — INTG-01 through INTG-06 + WGEN-14

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HexMapV2` component: Already renders all visual layers (terrain, coastlines, rivers, roads, borders, signifiers, locations, agents, fog). Prop interface largely compatible with old HexMap.
- `useViewNavigation` hook: View state machine (world/hex-zoom/location) and click handlers — works with any map component that calls `onHexClick(HexCoord)`.
- `useAvatarData` hook: Derives avatar position, sphere color, location overlays from graph — output feeds both old and new map.
- `useSimulation` hook: Runs tick loop and produces `gameState` including `WorldGenResult` data.

### Established Patterns
- Click event signature: `onHexClick(coord: HexCoord)` — identical between V1 and V2
- Handle interface: `centerOn(x, y, scale)` — identical between V1 and V2
- Fog toggle: `visibilityMap` prop undefined = fog disabled, VisibilityMap = fog enabled
- URL params: parsed in App.tsx with `new URLSearchParams(window.location.search)`

### Integration Points
- GameView line ~554: Replace `<HexMap>` with `<HexMapV2>` + new props
- GameView line ~99: `fogDisabled` state → invert to `fogEnabled` for HexMapV2
- GameView fog toggle button (line ~525): Already works, just needs prop name adjustment
- App.tsx line ~45: `?view=game` route — no change needed, GameView already renders here
- useSimulation: Must expose WorldGenResult fields (riverPaths, lakeIds, regionData) that currently only flow to HexV2View

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard swap + wiring + cleanup. The integration is primarily mechanical: replace component, thread props, delete old code, update docs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-integration*
*Context gathered: 2026-03-22*
