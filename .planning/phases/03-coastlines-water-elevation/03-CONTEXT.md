# Phase 3: Coastlines, Water & Elevation - Context

**Gathered:** 2026-03-21
**Updated:** 2026-03-21 (user discussion)
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the visual rendering layer for water and elevation features on the Three.js hex map. Phase 2 produced the world generation data (elevation fields, biome classification, river paths, lake regions, drainage). Phase 3 makes that data visible:

- Organic coastlines via marching-squares interpolation (not hex-edge-aligned)
- River overlays as curved blue lines through terrain hexes
- Lake fill rendering
- Elevation visual language (color, tick marks)
- Water depth bands for ocean hexes
- Thin hex grid lines at appropriate zoom levels

This is purely a rendering/visual phase — no new simulation logic. All data comes from Phase 2's world generation pipeline.

**Scope change:** ELEV-04 (altitude text labels on peaks) is CUT from Phase 3 — deferred to a later phase.

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
- Use Three.js mesh quad strips for river rendering (NOT linewidth — WebGL limitation)

### Lake Rendering
- Lakes rendered as filled hex regions where Phase 2's drainage pass filled depressions
- Lake hexes get water color fill (distinct from ocean)
- Lake shore treatment: Claude's discretion (organic vs hex-aligned, depending on what looks good at small scales)

### Water Color Palette
- **Canonical color reference:** `Design/hexmap macro-reference.png` — extract water colors from this image
- STYLE.md water ranges are outdated — update STYLE.md to reference the macro-reference image
- Water palette should be extracted from the reference image, not invented or carried forward from SVG renderer
- Three depth bands still required: shallows / mid-ocean / deep-ocean — but actual hex values come from reference

### Water Depth Bands
- Ocean hexes render in 3 depth bands: shallows / mid-ocean / deep-ocean
- Based on elevation below sea level from Phase 2 data
- Colors extracted from `Design/hexmap macro-reference.png`

### Elevation Visual Language
- Terrain color passively communicates elevation (browns/golds = elevated, greens/teal = low)
- This is an enhancement to the existing biome palette, not a replacement
- Edge tick marks ("caterpillar marks") on hex edges where elevation difference exceeds threshold
- Tick density scales with steepness: 3-8 ticks per edge
- **ELEV-04 CUT** — No altitude text labels in this phase

### Grid Lines
- Thin hex grid lines (0.5-1px equivalent, ~12% opacity black) at all zoom levels except full-world
- Grid lines must not obscure terrain color or overlays
- Rendered as a separate layer on top of terrain but below rivers/labels
- **GRID-01 already implemented** in Phase 1 (`createHexGridLines()`) — verify only

### Claude's Discretion
- Specific Three.js geometry approach for coastline masks (ShaderMaterial vs geometry clipping vs stencil buffer)
- River curve interpolation method (Catmull-Rom, Bezier, etc.)
- How to integrate with the existing InstancedMesh hex rendering from Phase 1
- Performance approach for 60K hex grid (instancing, LOD culling, draw call budget)
- Whether tick marks use line geometry or instanced quads
- Lake shore treatment (organic vs hex-aligned)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Color Reference (CRITICAL — user-specified)
- `Design/hexmap macro-reference.png` — **Canonical color source for ALL hex map colors including water.** Extract water depth band colors from this image. STYLE.md water values are outdated.

### Renderer Foundation (Phase 1 output)
- `src/components/HexMapV2/HexMapV2.tsx` — Main Three.js component, owns scene lifecycle
- `src/components/HexMapV2/scene/HexFillMesh.ts` — InstancedMesh for hex fills, `updateHexColors()`
- `src/components/HexMapV2/scene/HexGridLines.ts` — Grid lines (GRID-01 already implemented)
- `src/components/HexMapV2/scene/RenderLayers.ts` — RENDER_ORDER constants (13 layers)

### SVG Renderer Reference (port source)
- `src/components/HexMap/HexMap.tsx` — SVG-based hex map with working coastline/river implementations
- `src/components/HexMap/RiverOverlay.tsx` — Catmull-Rom river curves, width scaling
- `src/engine/coastline.ts` — `computeCoastline()` marching squares + Chaikin smoothing
- `src/components/HexMap/useCoastline.ts` — Coastline hook with memoization pattern

### World Generation (Phase 2 output)
- `src/engine/worldSeed.ts` — World generation pipeline, hex data structure
- `src/engine/worldGen/` — Generation passes (elevation, climate, biome, hydrology)
- `src/types/gameState.ts` — HexTile type with elevation, biome, hasRiver, river data fields

### Design References
- `Docs/plans/2026-03-20-world-generation-v2-design.md` — Full pipeline architecture, hydrology constants
- `.planning/REQUIREMENTS.md` — WATR-01 through WATR-06, ELEV-01 through ELEV-03, GRID-01 definitions
- `STYLE.md` — Visual style guide (Threadbare aesthetic) — NEEDS UPDATE for water palette reference
- `src/data/game-config.ts` — Existing tunable constants location

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeCoastline()` in `engine/coastline.ts`: Complete marching-squares + Chaikin smoothing pipeline. Returns ContourLoop[] in SVG pixel space — apply Y-flip for Three.js.
- `riverPathToSvgPath()` in `RiverOverlay.tsx`: Catmull-Rom river curve generation with meander noise.
- `createHexGridLines()` in `scene/HexGridLines.ts`: Grid lines already done (GRID-01). Includes edge deduplication pattern reusable for tick marks.
- `hexToPixel()` in `lib/hexMath.ts`: Hex-to-pixel coordinate conversion used everywhere.
- `getWaterColor()` in `palette/waterPalette.ts`: Water terrain classification (needs palette update).

### Established Patterns
- Scene Module Factory: Each visual layer is a standalone factory in `scene/` returning Object3D with correct renderOrder.
- Y-flip convention: `worldY = -svgY` applied in all geometry creation.
- InstancedMesh color update: `updateHexColors()` in HexFillMesh.ts for per-hex color changes without mesh recreation.

### Integration Points
- `HexMapV2.tsx` setup `useEffect`: Where new meshes get added to scene.
- `RENDER_ORDER`: Slots already reserved (COASTLINE=1, ELEVATION_TICKS=3, RIVERS=4).
- River data threading: `HexMapV2` currently has NO `riverPaths` prop — must be threaded from WorldGenPipeline context.

</code_context>

<specifics>
## Specific Ideas

- Marching squares is the specified algorithm for coastline interpolation — use the 7-point sub-hex sampling that Phase 2 already computes
- "Caterpillar tick marks" is the specific visual metaphor for elevation edges — short perpendicular lines along hex edges, like topographic map hatch marks
- River width scaling should be visually dramatic: 1-2px at mountain streams, 4-6px at major lowland rivers
- The Phase 2 hydrology data includes flow accumulation per river hex — use this directly for width scaling
- Grid lines at 12% opacity is a specific design target — enough to see hex boundaries without competing with terrain
- **Water colors must be extracted from `Design/hexmap macro-reference.png`** — this is the single source of truth for hex map colors

</specifics>

<deferred>
## Deferred Ideas

- **ELEV-04: Altitude text labels on peaks** — cut from Phase 3, defer to later phase
- River labels (blue italic text along major rivers) — GRID-02, assigned to later phase
- Road network rendering — GRID-03, Phase 7+
- Bridge icons where roads cross rivers — GRID-04, Phase 7+
- Animated water effects (flowing rivers, wave shorelines) — future polish
- Fog-of-war interaction with water features — Phase 7

</deferred>

---

*Phase: 03-coastlines-water-elevation*
*Context gathered: 2026-03-21, updated after user discussion*
