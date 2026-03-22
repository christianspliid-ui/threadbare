---
phase: 07-fog-zoom-grid
plan: "01"
subsystem: fog-zoom-logic
tags: [fog-of-war, zoom-tiers, visibility, pure-logic, tdd]
dependency_graph:
  requires: []
  provides: [ZoomVisibilityMatrix, FogCulling]
  affects: [HexMapV2, Plan-03-wiring]
tech_stack:
  added: []
  patterns: [TDD red-green, pure-logic modules, BFS visibility, InstancedMesh color override]
key_files:
  created:
    - src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts
    - src/components/HexMapV2/scene/__tests__/ZoomVisibilityMatrix.test.ts
    - src/components/HexMapV2/scene/FogCulling.ts
    - src/components/HexMapV2/scene/__tests__/FogCulling.test.ts
  modified: []
decisions:
  - "ZOOM_VISIBILITY_MATRIX uses 16 layer keys (not just 12) to cover all agent sub-tiers (portrait/dot/retinue) and border sub-tiers (kingdom/barony) explicitly"
  - "updateFogColors uses module-level reusable THREE.Color objects to avoid per-call allocation"
  - "computeVisibilityFromSources returns visible-set only; caller diffs against stored VisibilityMap for state transitions"
  - "agentSpriteTypes.ts AGENT_ZOOM_THRESHOLDS left as-is; note added in ZoomVisibilityMatrix for Plan 03 cleanup"
metrics:
  duration: 3min
  completed: "2026-03-22"
  tasks: 2
  files: 4
---

# Phase 7 Plan 01: Fog & Zoom Pure Logic Modules Summary

**One-liner:** TDD-built pure logic modules — zoom tier thresholds + 16-layer visibility matrix (ZoomVisibilityMatrix) and fog color override + BFS visibility computation (FogCulling) — establishing contracts for Plan 03 scene wiring.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ZoomVisibilityMatrix — tier logic, visibility matrix, fade alpha | cfbdc8d | ZoomVisibilityMatrix.ts, ZoomVisibilityMatrix.test.ts |
| 2 | FogCulling — color override, layer gating, visibility computation | 122c836 | FogCulling.ts, FogCulling.test.ts |

## Modules Delivered

### ZoomVisibilityMatrix.ts
Exports: `ZOOM_TIER_THRESHOLDS`, `ZOOM_VISIBILITY_MATRIX`, `ZoomTier`, `getZoomTier`, `getFadeAlpha`, `FADE_RANGE`

- Four zoom tiers: hero-local (k≥15), regional (k≥5), continental (k≥1.5), full-world (k<1.5)
- 16 layer keys in ZOOM_VISIBILITY_MATRIX — every layer x tier combination explicit
- getFadeAlpha provides smooth cross-fade at tier boundaries (clamped 0–1 linear interpolation)
- 44 unit tests covering all tier boundaries, matrix entries, and fade edge cases

### FogCulling.ts
Exports: `FOG_CONSTANTS`, `FogLayer`, `isLayerVisibleForHex`, `buildOriginalColorCache`, `updateFogColors`, `computeVisibilityFromSources`

- FOG_CONSTANTS.UNEXPLORED_HEX_COLOR = '#0a0a0c' (matches V1 HexTile fog color)
- isLayerVisibleForHex gating: unexplored=terrain-only, remembered=static layers, visible=all
- buildOriginalColorCache pre-computes Float32Array+Map at scene init (zero per-frame cost)
- updateFogColors batches setColorAt calls with fail-soft skip for unknown tile keys
- computeVisibilityFromSources BFS with bounds-checking, returns visible-set Map
- 39 unit tests covering all fog states, layer types, cache structure, and BFS edge cases

## Test Results

83 tests total, all passing.

```
✓ ZoomVisibilityMatrix.test.ts (44 tests)
✓ FogCulling.test.ts (39 tests)
```

## Decisions Made

1. **16 layer keys in ZOOM_VISIBILITY_MATRIX** — The plan specified 12+ keys; expanded to 16 to cover all agent sub-tiers (portrait/dot/retinue) and border sub-tiers (kingdom/barony) as distinct explicit entries. This matches the full UI-SPEC and makes Plan 03 wiring straightforward.

2. **Module-level reusable THREE.Color objects** — `FOG_COLOR` and `_restoreColor` allocated once at module load in FogCulling.ts, avoiding per-setColorAt allocation in the hot path.

3. **computeVisibilityFromSources returns visible-set only** — Caller (HexMapV2.tsx in Plan 03) will diff against stored VisibilityMap to determine which hexes transition states. This keeps FogCulling.ts pure and stateless.

4. **agentSpriteTypes.ts AGENT_ZOOM_THRESHOLDS not modified** — ZoomVisibilityMatrix.ts uses the same threshold values (15/5/1.5) and adds a code comment noting the duplication for Plan 03 cleanup. Avoiding change to agentSpriteTypes.ts reduces risk during this pure-logic plan.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files verified:
- src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts — FOUND
- src/components/HexMapV2/scene/__tests__/ZoomVisibilityMatrix.test.ts — FOUND
- src/components/HexMapV2/scene/FogCulling.ts — FOUND
- src/components/HexMapV2/scene/__tests__/FogCulling.test.ts — FOUND

Commits verified:
- cfbdc8d — feat(07-01): ZoomVisibilityMatrix — FOUND
- 122c836 — feat(07-01): FogCulling — FOUND
