---
phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests
plan: "04"
subsystem: ui
tags: [three.js, hexmapv2, instanced-mesh, army, battle, siege, zoom-visibility]

# Dependency graph
requires:
  - phase: 06-locations-agents
    provides: AgentSpriteMesh and SignifierMesh patterns for InstancedMesh construction
  - phase: 07-fog-zoom-grid
    provides: ZOOM_VISIBILITY_MATRIX, useZoomLayerVisibility, ZoomTier types
  - phase: 08-integration
    provides: HexMapV2 integration wiring, agent adapter pattern
provides:
  - ArmySpriteMesh.ts — InstancedMesh army shield sprites with faction color and size scaling
  - BattleIndicatorMesh.ts — Pulsing battle crossed-swords sprite with tickBattlePulse animation
  - SiegeIndicatorMesh.ts — Siege ring of 6 shield icons around besieged settlements
  - RenderLayers.ts additions — ARMIES (z=0.090) and BATTLE_INDICATOR (z=6.050) Z constants
  - ZoomVisibilityMatrix.ts additions — armies, battle_indicator, siege_ring layer entries
  - HexMapV2.tsx wiring — useEffect rebuild on tick, animation loop pulse, zoom visibility hooks
affects:
  - Phase 13 remaining plans (deferred tests)
  - Any future military/faction UI work on HexMapV2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "InstancedMesh army sprites follow SignifierMesh atlas pattern — canvas 2D shield silhouette per faction color"
    - "BattleIndicatorMesh uses Sprite with SpriteMaterial for simple per-battle opacity animation"
    - "tickBattlePulse exported as pure function — called from HexMapV2 animation loop with elapsed time"
    - "Military mesh refs (armyGroupRef, battleGroupRef, siegeGroupRef) follow existing agentGroupRef pattern"
    - "extractMilitaryRenderData reads actor nodes with armyState/battleState properties — fail-soft skips missing coords"

key-files:
  created:
    - src/components/HexMapV2/scene/ArmySpriteMesh.ts
    - src/components/HexMapV2/scene/BattleIndicatorMesh.ts
    - src/components/HexMapV2/scene/SiegeIndicatorMesh.ts
  modified:
    - src/components/HexMapV2/scene/RenderLayers.ts
    - src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts
    - src/components/HexMapV2/HexMapV2.tsx
    - src/components/HexMapV2/hooks/useZoomLayerVisibility.ts
    - src/views/GameView.tsx

key-decisions:
  - "Army shields use per-faction-color InstancedMesh groups (one mesh per color) — simpler than shader tinting, follows SignifierMesh variant pattern"
  - "BattleIndicatorMesh uses Sprite not InstancedMesh — single instance per battle, simpler opacity animation"
  - "LAYER_Z.ARMIES = 0.090 (between TRAILS 0.085 and AGENTS 6.000) — armies render on hex surface below agents"
  - "LAYER_Z.BATTLE_INDICATOR = 6.050 (between AGENTS 6.000 and EVENTS 6.100) — battle icon floats above agents"
  - "SiegeIndicatorMesh places 6 shield icons at hex edge midpoints (N/NE/SE/S/SW/NW) — follows hex geometry ring pattern"
  - "useZoomLayerVisibility extended to accept optional group refs for new military layers"

patterns-established:
  - "Military render data extracted via extractMilitaryRenderData(gameState) — reads actor nodes with armyState/battleState properties"
  - "Mesh groups rebuilt on gameState?.tick change — same pattern as agent sprite rebuild"
  - "All magic numbers (scales, pulse period, atlas size) exported as named constants per NFP #1"

requirements-completed:
  - GAP-06
  - GAP-07

# Metrics
duration: ~30min
completed: 2026-03-30
---

# Phase 13 Plan 04: Army Visual Layers Summary

**Three.js InstancedMesh army shield sprites, pulsing battle crossed-swords indicators, and siege ring icons added to HexMapV2 with zoom-tier visibility gating and animation loop integration**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-30T10:00:00Z
- **Completed:** 2026-03-30T10:33:07Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint, approved)
- **Files modified:** 7

## Accomplishments

- Created three new HexMapV2 scene modules (ArmySpriteMesh, BattleIndicatorMesh, SiegeIndicatorMesh) following established InstancedMesh patterns
- Extended RenderLayers.ts with ARMIES (z=0.090) and BATTLE_INDICATOR (z=6.050) Z constants
- Extended ZoomVisibilityMatrix.ts with armies, battle_indicator, and siege_ring layer entries (hidden at full-world)
- Wired all three layers into HexMapV2.tsx with useEffect rebuild on tick, tickBattlePulse in animation loop, and useZoomLayerVisibility integration
- Human verification passed: code compiles, builds clean, tests pass, no console errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RenderLayers/ZoomVisibility constants + create ArmySpriteMesh, BattleIndicatorMesh, SiegeIndicatorMesh** - `5f78d2a` (feat)
2. **Task 2: Wire army visual layers into HexMapV2.tsx** - `427d4de` (feat)
3. **Task 3: Visual verification checkpoint** — approved by user (no code commit)

## Files Created/Modified

- `src/components/HexMapV2/scene/ArmySpriteMesh.ts` — InstancedMesh army shield sprites; exports createArmySpriteMesh, ArmyRenderData, getArmySizeScale
- `src/components/HexMapV2/scene/BattleIndicatorMesh.ts` — Pulsing battle icon; exports createBattleIndicatorMesh, tickBattlePulse, BattleRenderData
- `src/components/HexMapV2/scene/SiegeIndicatorMesh.ts` — Siege ring icons; exports createSiegeIndicatorMesh, getSiegedHexKeys, SiegeRenderData
- `src/components/HexMapV2/scene/RenderLayers.ts` — Added ARMIES and BATTLE_INDICATOR to LAYER_Z
- `src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts` — Added armies, battle_indicator, siege_ring layer entries
- `src/components/HexMapV2/HexMapV2.tsx` — Wired military mesh refs, extractMilitaryRenderData, useEffect, tickBattlePulse in animation loop
- `src/components/HexMapV2/hooks/useZoomLayerVisibility.ts` — Extended to handle optional military group refs
- `src/views/GameView.tsx` — Minor integration update

## Decisions Made

- Army shields use per-faction-color InstancedMesh groups rather than a shader tinting approach — simpler and consistent with the SignifierMesh variant pattern established in Phase 5
- BattleIndicatorMesh uses Three.js Sprite (not InstancedMesh) — battles are rare, single-instance-per-battle animation is simpler
- SiegeIndicatorMesh places 6 shield icons at hex edge midpoints using the same hex geometry ring offsets used by other ring-layout features
- useZoomLayerVisibility extended to accept optional group refs for the new military layers — avoids breaking existing callers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Army, battle, and siege visual layers are complete and wired into HexMapV2
- All three layers respect the zoom visibility matrix (hidden at full-world zoom)
- Battle pulse animation runs at 1200ms period via tickBattlePulse in the Three.js render loop
- Ready for Phase 13 remaining plans (deferred tests)

---
*Phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests*
*Completed: 2026-03-30*
