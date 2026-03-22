---
phase: 05-hex-composition-landscape-signifiers
plan: "03"
subsystem: signifierRegistry
tags: [svg, signifiers, terrain, art, lowland, forest, wetland]
dependency_graph:
  requires: ["05-01", "05-02"]
  provides: ["LSIG-01", "LART-01", "LART-02", "LART-03", "LART-04", "LART-05", "LART-06", "LART-07", "LART-08", "LART-09", "LART-10", "LART-11", "LART-12"]
  affects: ["05-04", "src/components/HexMapV2/scene/SignifierMesh.ts"]
tech_stack:
  added: []
  patterns: ["multi-layer SVG opacity depth", "asymmetric sun-from-right shadow baked into paths", "direct SVG path extraction from hand-drawn references"]
key_files:
  modified:
    - src/components/HexMapV2/signifiers/signifierRegistry.ts
decisions:
  - "Both tasks committed atomically in one commit (6d07680) since all edits targeted the same file — no behavioral difference, both sets of terrain types complete"
  - "Steppe variant 0 uses exact path data from Design/steppes-hand-drawn.svg — style standard preserved"
  - "Dense forest variant 0 uses exact path data from Design/deepforest-hand-drawn.svg — style standard preserved"
  - "Multi-path per variant approach: 2-4 paths per variant with staggered opacity gives depth and asymmetric shadow without post-processing"
  - "Left-side shadow rule: all left-side path layers use opacity 0.52-0.68, right-side layers use 0.25-0.40"
metrics:
  duration: "~12 minutes"
  completed: "2026-03-22"
  tasks_completed: 2
  files_modified: 1
---

# Phase 5 Plan 03: Lowland, Forest, and Wet Terrain Signifiers Summary

Production SVG path data for 12 terrain type signifiers — multi-layer organic paths with asymmetric sun-from-right shadow baked into each variant.

## What Was Built

Replaced all placeholder SVG paths in `SIGNIFIER_REGISTRY` for 12 terrain types across 3 terrain families:

### Lowland Terrain (LART-01 through LART-04)

**grassland** — 3 variants:
- Clean low grass: sparse left-heavy tufts radiating from 2-3 base points
- Light tufts: 5 grass clumps, left 3 denser (0.55 opacity), right 2 lighter (0.3)
- Wildflowers: grass base with diamond-shaped flower marks scattered through left side

**savanna** — 3 variants:
- Single acacia: flat-top canopy (left mass 0.6 opacity, right mass 0.35) on 3-layer trunk
- Two trees: large left tree with heavy shadow, smaller right tree at reduced opacity, ground grass
- Dry grass: tall windswept stalks (left 0.55, right 0.3), seed head marks

**steppe** — 3 variants:
- Scrub: **direct extraction from Design/steppes-hand-drawn.svg** path data (style standard)
- Bent grass: windswept stalks leaning right, left cluster dense (0.55), right light (0.3)
- Bare steppe: wavy ground base (0.25), pebble marks (0.45), sparse tiny grass (0.35)

**floodplain** — 2 variants:
- Dry season: crack network radiating from left (heavier left side), sparse grass tufts
- Wet-season: 3 wavy waterlines (0.25 opacity) + sediment deposit marks (0.4)

### Forest Terrain (LART-05 through LART-09)

**light_forest** — 4 variants: two-tree, three-tree cluster, single large, mixed height+grass

**temperate_forest** — 4 variants: tight cluster (3 overlapping canopy masses), mixed sizes, clearing ring, full canopy mass

**dense_forest** — 3 variants:
- Solid canopy: **direct extraction from Design/deepforest-hand-drawn.svg** path data (style standard)
- Deep shade: denser fill with 4 overlapping canopy masses, shadow ground layer
- Ancient trunks: wide gnarled trunk bases (0.58 opacity) with canopy above, 3 trunks at decreasing opacity

**boreal_forest** — 4 variants: tight 3-conifer row, mixed height (tall/medium/short), snow-dusted (snow highlight at 0.22-0.25 opacity), sparse 2-conifer

**tropical_forest** — 3 variants: dense broad-leaf canopy mass, palms mixed (curved palm trunks + frond radiations + broad-leaf), vine-draped (hanging Q-curve vines on left side)

### Wet Terrain (LART-10 through LART-12)

**marsh** — 3 variants: reeds with bulrush tops (4 left + 3 right), waterlines + reeds rising through water, mixed reeds + grass tufts + water dots

**swamp** — 3 variants: dead trees in standing water (water fill + thin trunks + broken branches), bare dead trunks with branches, dense reed mass (4 vertical filled bands decreasing right-to-left opacity)

**moor_bog** — 3 variants: heather mounds (rolling organic Q-curve shapes), peat ground (wavy base + crack lines + deposit marks), sparse scrub (tiny isolated bush shapes + bare ground dots)

## Art Style Compliance

All 38 variants follow the established style standard:
- Fill-only paths, no stroke
- viewBox: '0 0 100 100'
- Opacity range: 0.22-0.68 (within 0.2-0.7 spec)
- Asymmetric shadow: left side 0.52-0.68, right side 0.25-0.40
- Multi-layer depth: 2-6 paths per variant
- Organic irregular vertices (not circles/rectangles)
- Two variants extracted directly from hand-drawn SVG references

## Verification

All 17 signifier tests pass (10 registry + 7 composition resolver):
- Test 1: All 28 terrain types have direct registry entries
- Test 2: Correct variant counts (grassland=3, savanna=3, steppe=3, floodplain=2, light_forest=4, temperate_forest=4, dense_forest=3, boreal_forest=4, tropical_forest=3, marsh=3, swamp=3, moor_bog=3)
- Test 3: All path opacities within [0.2, 0.7]
- Test 4: All path d strings non-empty
- TypeScript: 0 errors

## Deviations from Plan

### Combined Task Commit

Both Task 1 (lowland) and Task 2 (forest/wet) were edited in the same file before committing. The commit `6d07680` contains all 12 terrain type replacements. This is a sequencing deviation only — both tasks are complete and verified.

### Path `d` Length Verification

The plan acceptance criteria requested `d` string length > 50 characters. Spot checks on all variants confirm:
- Shortest path in the new art: 51+ characters (steppe bare steppe ground layer)
- Typical path length: 120-400+ characters
- Hand-drawn reference paths (steppe, deepforest): 400-600+ characters

## Self-Check: PASSED

- [x] `src/components/HexMapV2/signifiers/signifierRegistry.ts` — modified, committed as `6d07680`
- [x] All 17 tests pass
- [x] TypeScript: 0 errors
- [x] `SIGNIFIER_REGISTRY['grassland'].length === 3`
- [x] `SIGNIFIER_REGISTRY['steppe'][0]` contains steppes-hand-drawn.svg path
- [x] `SIGNIFIER_REGISTRY['dense_forest'][0]` contains deepforest-hand-drawn.svg path
