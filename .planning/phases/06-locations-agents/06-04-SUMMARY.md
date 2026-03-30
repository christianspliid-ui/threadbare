---
phase: 06-locations-agents
plan: 04
subsystem: HexMapV2 agent animation + trail system
tags: [agents, animation, bezier, trails, indicators, three-js, render-loop]
dependency_graph:
  requires: ["06-03"]
  provides: ["agent-animation-state", "activity-indicators", "event-indicators", "movement-trails", "hexmapv2-agent-wiring"]
  affects: ["HexMapV2.tsx", "HexV2View.tsx"]
tech_stack:
  added: ["agentAnimationState.ts", "activityIndicatorRegistry.ts", "eventIndicatorRegistry.ts", "MovementTrailMesh.ts"]
  patterns: ["TDD (RED→GREEN)", "render-loop integrated animation", "ref-based mutable state", "Three.js Line disposal pattern"]
key_files:
  created:
    - src/components/HexMapV2/agents/agentAnimationState.ts
    - src/components/HexMapV2/agents/activityIndicatorRegistry.ts
    - src/components/HexMapV2/agents/eventIndicatorRegistry.ts
    - src/components/HexMapV2/scene/MovementTrailMesh.ts
    - src/components/HexMapV2/agents/__tests__/agentAnimationState.test.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx
    - src/components/HexMapV2/HexV2View.tsx
decisions:
  - "Agent animation state stored in useRef — mutated by render loop without triggering React re-renders"
  - "Trail group stored in trailGroupRef so agents useEffect can add segments without closure over stale values"
  - "startMoveAnimation overrides bezier p0/p2 with Y-flipped world positions after getSegmentBezier call"
  - "Pre-existing test failures in signifierRegistry and engine integration tests logged to deferred-items.md — not caused by Plan 06-04"
metrics:
  duration: "9 minutes"
  completed: "2026-03-22"
  tasks: 2
  files: 7
---

# Phase 6 Plan 4: Agent Animation, Indicators, and HexMapV2 Wiring Summary

**One-liner:** Bezier hop animation (800ms move + 150ms settle bounce), six activity icon SVGs, five event indicator SVGs, and Two.js movement trail system with 2-second fade — all render-loop integrated with no external tween library.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| TDD RED | Failing tests for animation state | 67d8b7c | agentAnimationState.test.ts |
| 1 | Animation state, activity/event indicators, movement trails | d5fa851 | agentAnimationState.ts, activityIndicatorRegistry.ts, eventIndicatorRegistry.ts, MovementTrailMesh.ts |
| 2 | Wire agents into HexMapV2 | 24d6c0d | HexMapV2.tsx, HexV2View.tsx |

## What Was Built

### agentAnimationState.ts

State machine for per-agent bezier hop movement:

- `AgentAnimState`: carries bezier, timing, fromHex/toHex for tracing
- `startMoveAnimation()`: converts hex coords to Y-flipped world positions, uses `getSegmentBezier` for deterministic wobble, returns state with `phase='moving'`
- `tickAgentAnimations()`: called once per frame — advances positions via `evalBezierAtArcLength`, transitions 'moving' → 'settling' at t=1, applies 1.05→1.0 scale bounce during settle phase, removes completed animations from map
- 16 unit tests, all passing

### activityIndicatorRegistry.ts

Six activity icon SVGs rasterized as CanvasTextures:
- boot (traveling), swords (combat), hourglass (waiting), coin (trade), hammer (construction), bandage (healing)
- Same multi-layer Path2D pattern as signifierTextures.ts
- `buildActivityIconTextureCache()` builds all 6 textures once at scene init

### eventIndicatorRegistry.ts

Five event indicator types with per-type fade parameters:
- battle (150/300ms), construction (150/300ms), divine_intervention (200/500ms), corruption (300/0ms), trade_route (150/300ms)
- `EVENT_ANIMATION_PARAMS` holds all timing constants (NFP #1)
- `buildEventIconTextureCache()` builds all 5 textures once at scene init

### MovementTrailMesh.ts

Three.js Line-based trail system:
- `TRAIL_FADE_DURATION = 2000` ms
- `createMovementTrailMesh()`: empty THREE.Group at RENDER_ORDER.AGENTS
- `addTrailSegment()`: creates THREE.Line with LineBasicMaterial at TRAIL_OPACITY_MAX, stores startTime in userData
- `updateTrails()`: called each frame — lerps opacity to TRAIL_OPACITY_MIN over fade duration, disposes expired lines; skips non-Line children (NFP #4)

### HexMapV2.tsx + HexV2View.tsx

Full wiring:
- `HexMapV2Props` and `HexV2ViewProps`: add `agents?: AgentRenderData[]`
- Scene init: `createAgentSpriteMesh`, `createMovementTrailMesh`, `loadAgentPortraits` (fire-and-forget)
- Stored in refs: `agentSpriteGroupRef`, `trailGroupRef`, `animStatesRef`, `prevAgentPositionsRef`
- Render loop: `tickAgentAnimations(animStates, spriteGroup.spriteMap)` + `updateTrails(trailGroup)` before `renderer.render()`
- Zoom handler: `updateZoomVisibility(agentSpriteGroup, k)`, `trailGroup.visible = k >= REGIONAL`
- agents useEffect: diffs old vs new positions, calls `startMoveAnimation` + `addTrailSegment` for movers, calls `updateAgentPositions` for all
- Cleanup: `agentSpriteGroup.dispose()`, trail line geometry+material disposal

## Verification

- `npm run build`: passes (zero TypeScript errors)
- `npx vitest run src/components/HexMapV2/agents/`: 39 tests, all passing
- `npm test`: 5667 tests pass; 12 pre-existing failures (none in Plan 06-04 files)

## Deviations from Plan

None — plan executed exactly as written.

Pre-existing failures logged to `deferred-items.md`:
- signifierRegistry.test.ts (2 failures): test expectations outdated after Plan 05-03/04 absorbed hardened_clay into badlands
- SignifierMesh.test.ts (9 failures): cascade from signifierRegistry transform error in vitest context
- Engine integration tests (~8 failures): familiarity-integration, movement-p2-integration, MovementTrails, MandateTracker

## Self-Check: PASSED

All created files exist. All commits present in git log.
