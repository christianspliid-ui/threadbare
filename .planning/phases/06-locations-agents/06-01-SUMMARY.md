---
phase: 06-locations-agents
plan: 01
subsystem: hex-renderer/locations
tags: [locations, icons, labels, composition, ring-slot, three-js]
dependency_graph:
  requires:
    - 05-hex-composition-landscape-signifiers (signifier rendering pattern)
    - 04-regions-borders (RegionLabelOverlay pattern)
  provides:
    - location icon rendering pipeline (registry → textures → sprites)
    - location name label overlay with importance-based font hierarchy
    - RING slot multi-occupant support in composition resolver
  affects:
    - HexMapV2.tsx (locations prop, locationGroup scene object)
    - HexV2View.tsx (locations prop passthrough)
    - compositionResolver.ts (RING unlimited capacity, ringIndex)
    - compositionTypes.ts (CompositionResult.ringIndex)
tech_stack:
  added:
    - locationIconRegistry.ts (17 LocationType placeholder SVGs)
    - locationIconTextures.ts (CanvasTexture rasterizer, one texture per type)
    - LocationIconMesh.ts (THREE.Sprite factory at renderOrder=8, capital ring)
    - LocationLabelOverlay.tsx (RAF-driven HTML label overlay, removeOverlaps)
  patterns:
    - signifierTextures.ts → locationIconTextures.ts (exact pattern reuse)
    - SignifierMesh.ts → LocationIconMesh.ts (factory pattern)
    - RegionLabelOverlay.tsx → LocationLabelOverlay.tsx (RAF + camera.project)
key_files:
  created:
    - src/components/HexMapV2/locations/locationIconRegistry.ts
    - src/components/HexMapV2/locations/locationIconTextures.ts
    - src/components/HexMapV2/scene/LocationIconMesh.ts
    - src/components/HexMapV2/overlay/LocationLabelOverlay.tsx
    - src/components/HexMapV2/locations/__tests__/locationIconRegistry.test.ts
    - src/components/HexMapV2/scene/__tests__/LocationIconMesh.test.ts
    - src/components/HexMapV2/overlay/__tests__/LocationLabelOverlay.test.ts
  modified:
    - src/components/HexMapV2/signifiers/compositionTypes.ts (ringIndex field)
    - src/components/HexMapV2/signifiers/compositionResolver.ts (RING multi-occupant)
    - src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts (Tests 8-9)
    - src/components/HexMapV2/HexMapV2.tsx (locations prop, locationGroup, LocationLabelOverlay)
    - src/components/HexMapV2/HexV2View.tsx (locations prop passthrough)
decisions:
  - LOCATION_ICON_THRESHOLD=5 matches SIGNIFIER_ZOOM_THRESHOLD — both show at regional+
  - Capital ring overlay uses red (#cc3333) circle stroke on separate sprite (z+0.001)
  - RING slot uses ringCounter (not occupiedSlots) — purely additive with no limit
  - importanceToTier() shim maps location importance to labelCollision.ts tier for collision detection
  - locationIconTextures.ts keys by LocationType string (no variants, unlike signifiers which use terrain:variantIndex)
metrics:
  duration: ~8 minutes
  completed: 2026-03-22
  tasks_completed: 2
  files_created: 7
  files_modified: 5
  tests_added: 26
requirements_satisfied:
  - LOCI-01
  - LOCI-02
  - LOCI-03
  - LOCI-04
  - LOCI-05
  - COMP-05
---

# Phase 6 Plan 01: Location Rendering Pipeline Summary

**One-liner:** Location icon pipeline from registry through CanvasTexture sprites to HTML labels, with COMP-05 RING slot multi-occupant extension for agent coexistence.

## What Was Built

### Task 1: Location Icon Registry, Texture Cache, and LocationIconMesh

**locationIconRegistry.ts** — Complete registry for all 17 LocationType values with placeholder SVG path data. Each entry has 2-3 opacity-layered paths (0.4/0.7/1.0) following the multi-layer signifier style. Four size classes (full=0.80, medium=0.60, small=0.40, tiny=0.25) govern sprite scale on the hex. LOCATION_IMPORTANCE_MAP drives label font hierarchy.

**locationIconTextures.ts** — CanvasTexture rasterizer following the signifierTextures.ts pattern exactly. One texture per location type (no variants). buildLocationIconTextureCache() builds all 17 textures once at scene init.

**LocationIconMesh.ts** — THREE.Sprite factory at renderOrder=8 (RENDER_ORDER.LOCATIONS). Capital locations get a second red ring sprite at z+0.001. Fail-soft: unknown locationType and missing textures silently skip. LOCATION_ICON_Z=0.08, LOCATION_ICON_THRESHOLD=5.

### Task 2: LocationLabelOverlay, COMP-05 RING Extension, HexMapV2 Wiring

**LocationLabelOverlay.tsx** — RAF-driven HTML label overlay following RegionLabelOverlay.tsx pattern. Importance-based font sizes (capital=13px/bold, city/town=11px/regular, small=9px/regular). Zoom-tier visibility: all at hero-local, capital/city/town at regional, none at continental/full-world. White halo text-shadow, removeOverlaps collision detection, pointer-events: none.

**compositionTypes.ts** — Added `ringIndex?: number` to CompositionResult for RING-slot position tracking.

**compositionResolver.ts** — COMP-05 fix: RING slot entities bypass occupiedSlots check entirely, always get visible=true, and receive sequential ringIndex starting at 0. Non-RING slot behavior is unchanged. CENTER + RING coexist naturally.

**HexMapV2.tsx + HexV2View.tsx** — `locations?: LocationNode[]` prop added, locationGroup created and managed, zoom.labels handler updated, LocationLabelOverlay added to JSX render tree.

## Test Coverage

| File | Tests |
|------|-------|
| locationIconRegistry.test.ts | 5 tests — all 17 types, non-empty paths, valid viewBox, valid sizeClass, LOCATION_SIZE_SCALE |
| LocationIconMesh.test.ts | 7 tests — renderOrder=8, empty group, valid types, fail-soft, capital ring |
| LocationLabelOverlay.test.ts | 5 tests — font sizes, font weights, LOCATION_MIN_ZOOM, interface shape |
| compositionResolver.test.ts | 2 new tests (8-9) — RING multi-occupant, CENTER+RING coexistence |

**Total new tests: 26** | **All pass**

## Deviations from Plan

**None — plan executed exactly as written.**

Pre-existing CoastlineMesh.test.ts failures (3 tests) logged to deferred-items.md. These are caused by uncommitted changes to CoastlineMesh.ts from a prior session, not by this plan's changes.

## Self-Check

### Files Created
- src/components/HexMapV2/locations/locationIconRegistry.ts: EXISTS
- src/components/HexMapV2/locations/locationIconTextures.ts: EXISTS
- src/components/HexMapV2/scene/LocationIconMesh.ts: EXISTS
- src/components/HexMapV2/overlay/LocationLabelOverlay.tsx: EXISTS
- src/components/HexMapV2/locations/__tests__/locationIconRegistry.test.ts: EXISTS
- src/components/HexMapV2/scene/__tests__/LocationIconMesh.test.ts: EXISTS
- src/components/HexMapV2/overlay/__tests__/LocationLabelOverlay.test.ts: EXISTS

### Commits
- eb31761: feat(06-01): location icon registry, texture cache, and LocationIconMesh
- d0ce1b2: feat(06-01): LocationLabelOverlay, RING slot extension, HexMapV2 wiring

## Self-Check: PASSED
