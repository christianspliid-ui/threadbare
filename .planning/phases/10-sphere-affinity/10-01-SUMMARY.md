---
phase: 10-sphere-affinity
plan: "01"
subsystem: sphere-affinity
tags: [sphere-affinity, data-model, types, initialization, engine]
dependency_graph:
  requires: []
  provides:
    - SphereAffinity type definition
    - Triangle math functions (triangleCost, triangleTotal)
    - Terrain sphere table and lookup
    - Entity seeding during game initialization
    - pendingSpherePressures accumulator in GameState
  affects:
    - src/engine/gameInit.ts (wired seeding)
    - src/types/gameState.ts (new field)
    - All graph nodes now have sphereAffinity property after init
tech_stack:
  added:
    - src/types/sphereAffinity.ts
    - src/engine/sphereAffinity.ts
  patterns:
    - TDD RED-GREEN: tests written first, implementation made them pass
    - Sparse Record pattern for TERRAIN_SPHERE_TABLE (only non-zero entries)
    - Accumulator pattern (pendingSpherePressures) matching existing pendingHexMutations
    - Fail-soft: getTerrainSphereScores returns empty object for unknown terrain
key_files:
  created:
    - src/types/sphereAffinity.ts
    - src/engine/sphereAffinity.ts
    - src/engine/__tests__/sphereAffinity.test.ts
  modified:
    - src/engine/gameInit.ts
    - src/types/gameState.ts
decisions:
  - "SphereName reused from existing types/index.ts (not aliased to CreationSphereName) — keeps type system simple, no new type needed"
  - "Seeding in gameInit.ts rather than worldSeed.ts — seeding happens after graph build, hex-affinity-by-key map enables location seeding without graph traversal"
  - "Faction/culture actors get default (all-zero) affinity at init — derived aggregation deferred to phaseSphereAggregation in later plans"
  - "getTerrainSphereScores covers all 42+ TerrainType values via bucket mapping"
  - "No thematic sphere bias for locations at init time — location subtype theming can be added later without breaking existing seeding"
metrics:
  duration: "6 minutes"
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_changed: 5
---

# Phase 10 Plan 01: Sphere Affinity Data Model and Entity Seeding

SphereAffinity type system, triangle math, terrain-to-sphere table, and entity seeding for all graph nodes during game initialization.

## Summary

Defined the SphereAffinity per-entity data model with integer scores on the triangle number scale, seeded all entity graph nodes (hexes via terrain lookup, agents via sphere alignment, locations via hex inheritance) during game initialization, and added a pendingSpherePressures accumulator to GameState for future pressure resolution phases.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Define SphereAffinity types and triangle math | a305840 (RED), 23de9c9 (GREEN) | src/types/sphereAffinity.ts, src/engine/__tests__/sphereAffinity.test.ts |
| 2 | Seed sphere affinity on all entities during game initialization | ce6b253 | src/engine/sphereAffinity.ts, src/engine/gameInit.ts, src/types/gameState.ts |

## Verification

- `npx vitest run src/engine/__tests__/sphereAffinity.test.ts` — 36/36 tests pass
- `npx tsc --noEmit` — clean
- `npx vite build` — succeeds
- Pre-existing test failures (9 test files): confirmed pre-existing, not introduced by this plan

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/types/sphereAffinity.ts: FOUND
- src/engine/sphereAffinity.ts: FOUND
- src/engine/__tests__/sphereAffinity.test.ts: FOUND
- Commit ce6b253: FOUND
- Commit 23de9c9: FOUND
- Commit a305840: FOUND
