---
phase: 08-integration
plan: "01"
subsystem: game-view
tags: [integration, hexmap, rendering, worldgen]
dependency_graph:
  requires: [07-fog-zoom-grid]
  provides: [hexmapv2-in-gameview, worldgen-data-threading]
  affects: [GameView, useSimulation, gameInit]
tech_stack:
  added: []
  patterns: [graph-adapter-pattern, worldgen-result-threading]
key_files:
  created: []
  modified:
    - src/engine/gameInit.ts
    - src/components/Game/hooks/useSimulation.ts
    - src/components/Game/hooks/useViewNavigation.ts
    - src/components/Game/GameView.tsx
decisions:
  - "HexMapV2 is a drop-in replacement; HexMap ref type updated via HexMapV2Handle (same centerOn signature)"
  - "Agent adapter maps graph actor nodes to AgentRenderData[] with modulo faction coloring"
  - "Location adapter maps graph location nodes to LocationNode[] with subtype priority over type"
  - "fogDisabled state inverts to fogEnabled prop (! operator)"
  - "Unused HexMap props (avatarHex, graph, currentTick, onAgentClick) simply omitted — HexMapV2 handles agents via its own AgentRenderData path"
metrics:
  duration: "3 minutes"
  completed: "2026-03-22"
  tasks_completed: 2
  files_modified: 4
requirements: [INTG-01, INTG-02, INTG-03, INTG-04, INTG-05]
---

# Phase 8 Plan 01: HexMapV2 Integration into GameView Summary

HexMapV2 (Three.js renderer) wired into GameView as a drop-in replacement for the old SVG HexMap, with full WorldGenResult data threading (riverPaths, lakeIds, regionData), graph-to-AgentRenderData adapters, graph-to-LocationNode adapters, and fog toggle inversion.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Thread WorldGenResult through gameInit and useSimulation | 4fbf3b5 | gameInit.ts, useSimulation.ts |
| 2 | Swap HexMap for HexMapV2 in GameView with adapters and fog wiring | 73a0734 | GameView.tsx, useViewNavigation.ts |

## What Was Built

**Task 1 — WorldGenResult threading:**
- `gameInit.ts`: captures full `WorldGenResult` from `generateWorld()` rather than extracting `.tiles` inline; return type extended with `riverPaths: RiverPath[]`, `lakeIds: Int16Array`, `regionData?: RegionData`
- `useSimulation.ts`: adds `RiverPath`, `RegionData` imports; stores `riverPaths`, `lakeIds`, `regionData` as `useState` values initialized from `initial`; exposes all three in the hook return

**Task 2 — HexMapV2 swap:**
- `useViewNavigation.ts`: `hexMapRef` type updated from `HexMapHandle` to `HexMapV2Handle` (same `centerOn` signature, no call-site changes needed)
- `GameView.tsx`: imports swapped (`HexMap` → `HexMapV2` default import + `AgentRenderData`, `LocationNode`, `getRetinueAgents`); `useSimulation` destructure extended with `riverPaths`, `lakeIds`, `regionData`; `agentRenderData` memo (retinue detection via `getRetinueAgents`, modulo faction coloring); `locationNodes` memo (subtype-priority mapping); `<HexMapV2>` replaces `<HexMap>` with all WorldGenResult props, adapter props, and inverted fog prop

## Verification

- `npx tsc --noEmit` — zero errors
- `npm test -- --run src/engine/__tests__/gameInit.test.ts` — 21/21 passing
- Opening `?view=game` will render HexMapV2 (Three.js canvas) instead of old SVG HexMap

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files confirmed modified:
- src/engine/gameInit.ts — contains `const worldGenResult = generateWorld(`
- src/components/Game/hooks/useSimulation.ts — contains `const [riverPaths] = useState<RiverPath[]>`
- src/components/Game/hooks/useViewNavigation.ts — contains `import type { HexMapV2Handle }`
- src/components/Game/GameView.tsx — contains `<HexMapV2`

Commits confirmed:
- 4fbf3b5 — feat(08-01): thread WorldGenResult fields through gameInit and useSimulation
- 73a0734 — feat(08-01): swap HexMap for HexMapV2 in GameView with adapters and fog wiring
