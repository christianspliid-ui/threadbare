# Phase 3: Coastlines, Water & Elevation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Source:** PRD Express Path (Docs/plans/2026-03-20-world-generation-v2-design.md)

<domain>
## Phase Boundary

This phase delivers the visual rendering layer for water and elevation features on the Three.js hex map. Phase 2 produced the world generation data (elevation fields, biome classification, river paths, lake regions, drainage). Phase 3 makes that data visible:

- Organic coastlines via marching-squares interpolation (not hex-edge-aligned)
- River overlays as curved blue lines through terrain hexes
- Lake fill rendering
- Elevation visual language (color, tick marks, altitude labels)
- Water depth bands for ocean hexes
- Thin hex grid lines at appropriate zoom levels

This is purely a rendering/visual phase — no new simulation logic. All data comes from Phase 2's world generation pipeline.

</domain>

<decisions>
## Implementation Decisions

### Coastline Rendering
- Coastal hexes retain their inland biome color — the coastline is a mask/overlay, not a terrain type change
- Use marching-squares interpolation within coastal hexes using the existing 7-point sub-hex elevation sampling from Phase 2
- Produce organic shoreline curves that cut through hexes at natural angles, not along hex edges
- Coastline geometry rendered as a Three.js mesh/overlay on top of the base hex InstancedMesh

### River Rendering
- Rivers are curved blue overlay lines through hexes (entry edge → exit edge), NOT terrain type changes
- A forest hex with a river still renders as forest + blue line on top
- River width proportional to flow accumulation: thin streams near source, wide near coast/confluence
- River paths come from Phase 2 hydrology data (`hasRiver`, river segment data on tiles)
- Use Three.js line geometry or mesh strips for river rendering

### Lake Rendering
- Lakes rendered as filled hex regions where Phase 2's drainage pass filled depressions
- Lake hexes get water color fill (distinct from ocean)
- Lake shore edges should look organic (similar coastline treatment if feasible)

### Water Depth Bands
- Ocean hexes render in 3 depth bands: shallows / mid-ocean / deep-ocean
- Based on elevation below sea level from Phase 2 data
- Distinct blue palette for each depth band

### Elevation Visual Language
- Terrain color passively communicates elevation (browns/golds = elevated, greens/teal = low)
- This is an enhancement to the existing biome palette, not a replacement
- Edge tick marks ("caterpillar marks") on hex edges where elevation difference exceeds threshold
- Tick density scales with steepness: 3-8 ticks per edge
- Altitude text labels on named peaks and notable elevations at hero-local + regional zoom only

### Grid Lines
- Thin hex grid lines (0.5-1px equivalent, ~12% opacity black) at all zoom levels except full-world
- Grid lines must not obscure terrain color or overlays
- Rendered as a separate layer on top of terrain but below rivers/labels

### Claude's Discretion
- Specific Three.js geometry approach for coastline masks (ShaderMaterial vs geometry clipping vs stencil buffer)
- River curve interpolation method (Catmull-Rom, Bezier, etc.)
- Exact color values for water depth bands (should harmonize with existing biome palette)
- How to integrate with the existing InstancedMesh hex rendering from Phase 1
- Performance approach for 60K hex grid (instancing, LOD culling, draw call budget)
- Whether tick marks use line geometry or instanced quads

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Renderer Foundation (Phase 1 output)
- `src/components/HexMap/HexMap.tsx` — Main Three.js scene, InstancedMesh hex fill, camera controls
- `src/components/HexMap/HexTile.tsx` — Hex tile component/types
- `src/components/HexMap/RiverOverlay.tsx` — Existing river overlay (SVG-based, may need Three.js port)
- `src/components/HexMap/RegionLabels.tsx` — Label rendering approach

### World Generation (Phase 2 output)
- `src/engine/worldSeed.ts` — World generation pipeline, hex data structure
- `src/engine/worldGen/` — Generation passes (elevation, climate, biome, hydrology)
- `src/types/gameState.ts` — HexTile type with elevation, biome, hasRiver, river data fields

### Design References
- `Docs/plans/2026-03-20-world-generation-v2-design.md` — Full pipeline architecture, hydrology constants
- `.planning/REQUIREMENTS.md` — WATR-01 through WATR-06, ELEV-01 through ELEV-04, GRID-01 definitions
- `STYLE.md` — Visual style guide (Threadbare aesthetic)
- `Docs/ui-patterns.md` — UI pattern conventions
- `src/data/game-config.ts` — Existing tunable constants location

</canonical_refs>

<specifics>
## Specific Ideas

- Marching squares is the specified algorithm for coastline interpolation — use the 7-point sub-hex sampling that Phase 2 already computes
- "Caterpillar tick marks" is the specific visual metaphor for elevation edges — short perpendicular lines along hex edges, like topographic map hatch marks
- River width scaling should be visually dramatic: 1-2px at mountain streams, 4-6px at major lowland rivers
- The Phase 2 hydrology data includes flow accumulation per river hex — use this directly for width scaling
- Grid lines at 12% opacity is a specific design target — enough to see hex boundaries without competing with terrain

</specifics>

<deferred>
## Deferred Ideas

- River labels (blue italic text along major rivers) — GRID-02, assigned to later phase
- Road network rendering — GRID-03, Phase 7+
- Bridge icons where roads cross rivers — GRID-04, Phase 7+
- Animated water effects (flowing rivers, wave shorelines) — future polish
- Fog-of-war interaction with water features — Phase 7

</deferred>

---

*Phase: 03-coastlines-water-elevation*
*Context gathered: 2026-03-21 via PRD Express Path*
