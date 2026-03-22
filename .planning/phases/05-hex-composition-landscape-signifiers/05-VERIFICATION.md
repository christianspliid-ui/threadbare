---
phase: 05-hex-composition-landscape-signifiers
verified: 2026-03-22T13:00:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification: false
human_verification:
  - test: "Open game at ?view=game, zoom into regional level (k >= 5), observe land hexes"
    expected: "Each land hex displays a dark silhouette signifier (grass tufts, tree clusters, mountain peaks, etc.) with visible variation between adjacent hexes of the same terrain type. Water hexes show no signifiers."
    why_human: "Visual appearance and art quality cannot be verified programmatically. Terrain recognition (grass tufts look like grass, trees look like trees) requires human judgement."
  - test: "Zoom out to continental view (k < 5), observe hex map"
    expected: "All signifier sprites disappear — only terrain color fills remain visible. No signifier flicker on zoom transition."
    why_human: "Zoom threshold behavior requires a live browser session to observe the visibility toggle at k=5."
  - test: "Zoom back in to regional, compare adjacent hexes of the same terrain type (e.g. a grassland cluster)"
    expected: "Adjacent grassland hexes show different variants (tufts vs wildflowers vs clean) with slight position/rotation variation — never a uniform grid pattern."
    why_human: "Per-hex variant distribution and jitter feel requires visual inspection."
---

# Phase 05: Hex Composition and Landscape Signifiers Verification Report

**Phase Goal:** Every terrain hex displays characteristic dark-silhouette signifiers (trees, mountains, dunes, etc.) placed via a slot-based composition system
**Verified:** 2026-03-22T13:00:00Z
**Status:** human_needed — all automated checks pass, visual quality requires human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Composition resolver assigns entities to slots by priority and evaluates suppression rules | VERIFIED | `resolveHexComposition` in compositionResolver.ts: 7/7 tests pass covering priority sort, slot conflict, fallback, suppression |
| 2 | Major locations suppress terrain signifiers when both occupy the same hex | VERIFIED | Test 2 (compositionResolver.test.ts): `always` suppress rule verified; `HexVisualManifest.suppresses` field on HexVisualManifest interface |
| 3 | Per-hex signifier params (variant index, jitter, rotation) are deterministic from coordinates + seed | VERIFIED | `getSignifierParams` uses mulberry32 with formula `(col * 374761393 + row * 668265263 + worldSeed * 1274126177) | 0`; Test 5 and Test 10 confirm determinism and distribution |
| 4 | All signifier registry entries use fill-only paths with opacity in 0.2-0.7 range | VERIFIED | Test 3 passes: every SignifierPath.opacity in [0.2, 0.7] across all 258 path entries in 1023-line registry |
| 5 | Signifier sprites appear on every land hex at hero-local and regional zoom | VERIFIED (automated) | SignifierMesh.ts creates one Sprite per land tile; test "land-type tiles produce at least one sprite" passes; zoom visibility at k>=5 |
| 6 | Signifiers are hidden at continental and full-world zoom | VERIFIED | HexMapV2.tsx line 308: `signifierGroup.visible = event.transform.k >= SIGNIFIER_ZOOM_THRESHOLD` with SIGNIFIER_ZOOM_THRESHOLD=5; initial `visible = false` |
| 7 | Production SVG path data for all 30 LART terrain types | VERIFIED | 28 direct registry entries; LART-22 hardened_clay absorbed into badlands (variants 3-4); LART-28 lava absorbed into volcano (variants 3-4); 6 fallback entries cover remaining TerrainTypes |
| 8 | Texture cache built once at startup — no per-frame CPU cost | VERIFIED | `buildSignifierTextureCache` called once in `createSignifierMesh`; returns `Map<string, THREE.CanvasTexture>` keyed as `terrain:variantIndex` |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/HexMapV2/signifiers/compositionTypes.ts` | VERIFIED | 69 lines; exports HexSlot, FootprintSize, ZoomTier, SuppressRule, HexVisualManifest, CompositionResult |
| `src/components/HexMapV2/signifiers/compositionResolver.ts` | VERIFIED | 95 lines; exports `resolveHexComposition` pure function |
| `src/components/HexMapV2/signifiers/signifierRegistry.ts` | VERIFIED | 1023 lines; 258 path `d:` entries; exports SignifierPath, SignifierVariant, SignifierRegistry, SIGNIFIER_REGISTRY, TERRAIN_SIGNIFIER_FALLBACK, getSignifierParams |
| `src/components/HexMapV2/signifiers/signifierTextures.ts` | VERIFIED | 84 lines; exports buildSignifierTexture, buildSignifierTextureCache, SIGNIFIER_TEXTURE_SIZE, SIGNIFIER_FILL_COLOR |
| `src/components/HexMapV2/scene/SignifierMesh.ts` | VERIFIED | 119 lines; exports createSignifierMesh, SIGNIFIER_SPRITE_SCALE=0.7, SIGNIFIER_Z=0.07 |
| `src/components/HexMapV2/HexMapV2.tsx` | VERIFIED | createSignifierMesh imported, created, added to scene, zoom-visibility wired at SIGNIFIER_ZOOM_THRESHOLD=5 |
| `src/components/HexMapV2/signifiers/__tests__/compositionResolver.test.ts` | VERIFIED | 7 tests pass |
| `src/components/HexMapV2/signifiers/__tests__/signifierRegistry.test.ts` | VERIFIED | 10 tests pass |
| `src/components/HexMapV2/scene/__tests__/SignifierMesh.test.ts` | VERIFIED | 9 tests pass |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| compositionResolver.ts | compositionTypes.ts | `import type { HexVisualManifest, HexSlot, CompositionResult }` | WIRED | Line 16-19 |
| SignifierMesh.ts | signifierRegistry.ts | `import { SIGNIFIER_REGISTRY, TERRAIN_SIGNIFIER_FALLBACK, getSignifierParams }` | WIRED | Lines 22-26 |
| SignifierMesh.ts | signifierTextures.ts | `import { buildSignifierTextureCache }` | WIRED | Line 27 |
| HexMapV2.tsx | SignifierMesh.ts | `import { createSignifierMesh }` + `scene.add(signifierGroup)` | WIRED | Lines 21, 269-270 |
| signifierRegistry.ts | src/lib/prng.ts | `import { mulberry32 }` | WIRED | Line 22 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| COMP-01 | 05-01 | Slot-based layout system (CENTER, N, NE, SE, S, SW, NW, FILL, RING) | SATISFIED | HexSlot type in compositionTypes.ts |
| COMP-02 | 05-01 | HexVisualManifest interface | SATISFIED | Full interface in compositionTypes.ts |
| COMP-03 | 05-01 | Composition resolver with priority, slot assignment, suppression | SATISFIED | resolveHexComposition — 7 tests |
| COMP-04 | 05-01 | Major locations suppress terrain signifiers | SATISFIED | Suppression via `always` rule tested |
| LSIG-01 | 05-02/03/04 | Each terrain type has 2-5 SVG signifier variants | SATISFIED | 28 direct registry entries covering all terrain types; variant counts tested |
| LSIG-02 | 05-01 | Variant selected deterministically per hex | SATISFIED | mulberry32 seeded by col/row/worldSeed |
| LSIG-03 | 05-01 | Jitter +/-10% and rotation +/-15deg | SATISFIED | SIGNIFIER_JITTER_RANGE=0.2, SIGNIFIER_ROTATION_RANGE=PI/6 |
| LSIG-04 | 05-02 | Signifier size scales with hex; hidden below regional zoom | SATISFIED | SIGNIFIER_SPRITE_SCALE=0.7 * HEX_SIZE; SIGNIFIER_ZOOM_THRESHOLD=5 |
| LSIG-05 | 05-01 | Consistent style (fill-only, opacity 0.2-0.7, asymmetric shadow) | SATISFIED | Test 3 verifies opacity range; style contract enforced by SignifierPath type |
| LART-01 | 05-03 | grassland (3 variants) | SATISFIED | Registry test: `grassland.length === 3` |
| LART-02 | 05-03 | savanna (3 variants) | SATISFIED | Registry test confirms |
| LART-03 | 05-03 | steppe (3 variants, variant 0 from steppes-hand-drawn.svg) | SATISFIED | Registry test + SUMMARY confirms direct extraction |
| LART-04 | 05-03 | floodplain (2 variants) | SATISFIED | Registry test confirms |
| LART-05 | 05-03 | woodland/light_forest (4 variants) | SATISFIED | Registry key `light_forest` with 4 variants |
| LART-06 | 05-03 | temperate_forest (4 variants) | SATISFIED | Registry test confirms |
| LART-07 | 05-03 | dense_forest (3 variants, variant 0 from deepforest-hand-drawn.svg) | SATISFIED | Registry test + SUMMARY confirms direct extraction |
| LART-08 | 05-03 | boreal_forest (4 variants) | SATISFIED | Registry test confirms |
| LART-09 | 05-03 | tropical_forest (3 variants) | SATISFIED | Registry test confirms |
| LART-10 | 05-03 | marsh (3 variants) | SATISFIED | Registry test confirms |
| LART-11 | 05-03 | swamp (3 variants) | SATISFIED | Registry test confirms |
| LART-12 | 05-03 | moor_bog (3 variants) | SATISFIED | Registry test confirms |
| LART-13 | 05-04 | hills (4 variants, variant 0 from hills-hand-drawn.svg) | SATISFIED | Registry test confirms; SUMMARY documents extraction |
| LART-14 | 05-04 | forested_hills (3 variants) | SATISFIED | Registry test confirms |
| LART-15 | 05-04 | mountains (4 variants, variant 0 from mountain-hand-drawn.svg) | SATISFIED | Registry test confirms; SUMMARY documents extraction |
| LART-16 | 05-04 | high_mountains (3 variants) | SATISFIED | Registry test confirms |
| LART-17 | 05-04 | plateau (3 variants) | SATISFIED | Registry test confirms |
| LART-18 | 05-04 | mountain_pass (2 variants) | SATISFIED | Registry test confirms |
| LART-19 | 05-04 | sand_desert/desert (3 variants) | SATISFIED | Registry key `desert`, LART-19 mapping documented |
| LART-20 | 05-04 | sand_dunes (3 variants) | SATISFIED | Registry test confirms |
| LART-21 | 05-04 | rocky_desert (3 variants) | SATISFIED | Registry test confirms |
| LART-22 | 05-04 | hardened_clay (2 variants: fine cracks, deep cracks) | SATISFIED | Absorbed into badlands variants 3-4 (registry has 5 total); coverage comment documents this |
| LART-23 | 05-04 | badlands (3 variants: spires, layered, eroded pillars) | SATISFIED | badlands variants 0-2; registry has 5 total (LART-23 + LART-22) |
| LART-24 | 05-04 | tundra (3 variants) | SATISFIED | Registry test confirms |
| LART-25 | 05-04 | snow_fields (2 variants) | SATISFIED | Registry test confirms |
| LART-26 | 05-04 | glacier (2 variants) | SATISFIED | Registry test confirms |
| LART-27 | 05-04 | volcanic/volcano (3 variants: active crater, dormant, vent) | SATISFIED | volcano variants 0-2; coverage comment documents LART-27 mapping |
| LART-28 | 05-04 | lava (2 variants: fresh flow, cooling) | SATISFIED | Absorbed into volcano variants 3-4; coverage comment documents this |
| LART-29 | 05-04 | broken_lands (2 variants) | SATISFIED | Registry test confirms |
| LART-30 | 05-04 | dead_forest (3 variants) | SATISFIED | Registry test confirms |

**Note on COMP-05:** Not a Phase 5 requirement. REQUIREMENTS.md table assigns COMP-05 (agent RING layout) to Phase 6. The composition resolver is designed to accommodate this without changes.

---

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| signifierRegistry.ts | 17-19 | Stale "PLACEHOLDER NOTICE" comment claiming Plans 03/04 will replace paths — they already did | Info | None — comment is inaccurate but plans 03/04 executed successfully |
| signifierRegistry.ts | 61-72 | 12 `PLACEHOLDER_*` constants defined but never used (dead code) | Info | None — dead code does not affect runtime; can be removed in a future cleanup pass |

No blocker anti-patterns. No stubs. No `return null` / empty handler patterns in any implementation files.

---

### Human Verification Required

#### 1. Terrain Signifier Visual Quality

**Test:** Open `http://localhost:5173/?view=game`, zoom into regional level (click the map to zoom in until tile details are visible — approximately 5x zoom or more).
**Expected:** Each land hex shows a dark silhouette icon matching its terrain — grass tufts on grassland, tree clusters on forest hexes, mountain peaks on mountain hexes, dune shapes on desert hexes, etc. Adjacent hexes of the same terrain type show different variants with subtle position/rotation variation.
**Why human:** Visual recognition of terrain-appropriate shapes and art quality cannot be verified programmatically.

#### 2. Zoom-Based Signifier Visibility

**Test:** With signifiers visible at regional zoom, zoom out past the continental threshold. Observe the map.
**Expected:** Signifiers vanish cleanly when zoom scale drops below 5. No leftover sprites visible. No visual flicker.
**Why human:** Zoom transition smoothness requires a live browser session.

#### 3. Variant Diversity on Same-Terrain Clusters

**Test:** Find a large cluster of the same terrain type (e.g. a grassland plain or a forested region). Observe 6-8 adjacent hexes.
**Expected:** Visibly different variants and orientations — the map should feel organic, not tiled/repeated.
**Why human:** Perceptual quality of variation distribution requires visual inspection.

---

## Test Results

All automated tests pass:

- compositionResolver.test.ts: 7/7
- signifierRegistry.test.ts: 10/10
- SignifierMesh.test.ts: 9/9
- **Total: 26/26 tests pass**
- TypeScript: 0 compile errors

---

## Gaps Summary

No gaps. All automated checks pass. Phase goal is structurally achieved — the composition system, signifier registry (28 terrain types + 6 fallbacks), rendering pipeline, and zoom-based visibility are all implemented and wired. The only items requiring confirmation are visual quality questions that need a live browser session.

---

_Verified: 2026-03-22T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
