# Phase 4 Context: Regions & Borders

## Phase Goal
The world is divided into named geographic and political regions with visible borders, labels, and capital markers on the Three.js hex map.

## Decisions

### Label Rendering: HTML Overlay with Viewport Culling
**Choice:** CSS-styled DOM elements positioned via Three.js `project()` world-to-screen mapping.
**Why:** Max ~80 labels visible at any zoom tier. HTML gives full typographic control — serif fonts, small-caps, letter-spacing, `text-shadow` halo — matching Mystara cartographic quality. DOM overhead is negligible at these counts with viewport culling.
**How to apply:**
- Labels are `<div>` elements in an overlay container (same pattern as existing tooltips)
- Each frame: project label world positions to screen, hide labels outside viewport
- Zoom-tier filtering: only create/show labels appropriate to current zoom
- CSS transitions for fade in/out between zoom tiers

### Label Style: Dark Text with Light Halo (Mystara Cartographic)
**Choice:** All three label tiers use dark (near-black) text with subtle light halo via `text-shadow`. Classic cartographic style throughout.
**Why:** Mystara Known World reference. Dark text + halo reads against any terrain color. Consistent across all label types — no color-coding by feature type.
**How to apply:**
- Kingdom labels: bold, all-caps or small-caps, 18-24px, serif
- Barony labels: regular weight, title case, 12-16px, serif
- Geographic feature labels: italic, 10-14px, serif
- Halo: `text-shadow` with 4-8 white shadows offset 1-2px in each direction

### Zoom Tiers Serve Player Intent
**Choice:** What labels appear is driven by what the player is DOING at each zoom level, not just visual density.
**Why:** Each zoom tier corresponds to a different gameplay activity. Labels should support that activity, not clutter it.
**How to apply:**

| Zoom Tier | Player Intent | Labels Shown |
|-----------|--------------|-------------|
| Hero-local (1 region) | Planning movement, observing agents | Cities, villages, towns, POIs, current region name |
| Regional (multi-region) | Assessing a faction's kingdom, internal politics | Faction-linked POIs (guild cities, forts with armies), region/barony names |
| Continental | Grand strategy overview | Kingdom/province names, seats of power, faction centers only |
| Full world | Orientation | Kingdom names only (largest text) |

### Label Density: Graduated Reveal
**Choice:** Labels appear/disappear based on zoom-tier intent matrix above, not a single size threshold.
**Why:** Mystara maps are spacious — large empty stretches with only narratively important labels. The map should feel like a real cartographer chose what to label.
**How to apply:**
- `REGION_MAP_LABEL_MIN_SIZE` (30 hexes) still applies as floor — regions below this never get map labels regardless of zoom
- Geographic feature labels only appear at regional zoom when the player is "in" that area
- Barony/kingdom labels respect the graduated matrix above

### Curved Text: Deferred
**Choice:** Flat centered text for all labels in Phase 4. Curved text along mountain ranges and coastlines is a future polish item.
**Why:** Curved text adds label-placement complexity (SVG `<textPath>` or per-glyph positioning). Flat centered is functional and clean. Curved treatment can be added later without changing the label data model.
**How to apply:** Place all labels at region centroid with horizontal text. No path-following.

## Design Doc Defaults (Not Discussed — Using As-Is)

### Region Generation Strategy
- Border-cost watershed approach per Layer 6 of `Design/brainstorm-hexmap-v2.md`
- Upgrade existing `regionDetection.ts` flood-fill with border-cost splitting, size capping, natural boundary snapping
- Update `TERRAIN_TO_FEATURE` mapping for the new 27-type terrain list
- Constants: `REGION_TARGET_SIZE=120`, `REGION_MIN_SIZE=20`, `REGION_MAX_SIZE=200`
- Border costs: mountain=0.9, river=0.7, biome=0.4, coast=1.0, same-terrain=0.1

### Political Hierarchy
- Two tiers: kingdoms (groups of baronies) and baronies (groups of geographic regions)
- Political regions defined by travel-time from capital, not terrain type
- Boundaries follow geographic region boundaries (political borders always lie on geographic borders)
- Border geometry fixed at worldgen (dynamic borders deferred to V2/V3)
- Existing provinces from worldgen pass01 provide seed data (capital hexes, culture IDs)

### River Labels (GRID-02)
- Blue italic text along major rivers at regional zoom
- Per requirements, implementation details left to researcher/planner

### Border Rendering
- Red polylines along hex edges: 3px kingdom borders, 1.5px barony borders
- Geographic features get NO border lines — text labels only (REGN-06)
- Continuous polyline per border segment (not per-hex), walked from boundary edges
- Capital markers: large red dot (6px) for kingdom capitals, small red dot (3px) for barony seats

## Code Context

### Existing Assets to Reuse
- `src/engine/regionDetection.ts` — flood-fill, `TERRAIN_TO_FEATURE`, `RegionCluster` interface. Fundamentally sound, needs border-cost upgrade.
- `src/engine/worldgen/types.ts` — `WorldGenContext` has `provinceIds`, `provinceRoles`, `provinces[]`, `provinceCapitalHexes`
- `src/engine/hexGrid.ts` — `WorldGenResult` needs region data threaded through (currently: tiles, riverPaths, lakeIds)
- `src/components/HexMapV2/` — Three.js renderer with InstancedMesh, coastline mesh, river overlay, elevation ticks
- HTML tooltip overlay already uses `project()` for world-to-screen positioning — same pattern for labels

### Integration Points
- Region detection runs AFTER worldgen pipeline (uses tiles + river data + province data)
- Region data must be added to `WorldGenResult` so the renderer can access it
- Border rendering adds a new mesh layer (polylines) to the HexMapV2 scene
- Label overlay adds a new DOM layer alongside existing tooltip overlay
- Capital markers add to the existing hex-element rendering pipeline

## Deferred Ideas
- Curved text along elongated regions (mountain ranges, coastlines) — polish pass
- Color-coded geographic labels (green for forests, blue for water) — rejected in favor of consistent dark-text style
