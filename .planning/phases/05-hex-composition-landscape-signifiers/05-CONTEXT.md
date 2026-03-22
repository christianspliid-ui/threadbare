# Phase 5: Hex Composition & Landscape Signifiers - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Every terrain hex displays characteristic dark-silhouette signifiers (trees, mountains, dunes, etc.) placed via a slot-based composition system. This phase delivers:

1. **Hex composition system** — slot-based layout (CENTER, N/NE/SE/S/SW/NW, FILL, RING), visual manifest interface, priority-based resolver, suppression rules
2. **Signifier rendering pipeline** — SVG assets rendered as Three.js sprites/textures, scaling with zoom, hidden below regional threshold
3. **All 27 terrain signifier asset sets** — 2-5 SVG variants per terrain type, ~80+ total SVGs, all in the hand-drawn silhouette style

Settlement/location icons and agent rendering are Phase 6. COMP-05 (agent RING layout) is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Signifier color treatment
- Pure black (#1a1a1a) silhouettes — NOT terrain-tinted
- Opacity can be used to let terrain color show through (multi-layer opacity approach: 0.2-0.7 range)
- This keeps the pipeline simple while allowing visual integration with terrain fills

### Lighting convention (sun-from-right)
- All signifiers have LEFT-SIDE SHADOW — the sun shines from the right
- Shadow treatment is BAKED INTO each SVG path, not applied as a post-process shader
- Left side of shapes: solid/darker fill (higher opacity layers)
- Right side: thinner/lighter/open (lower opacity layers)
- This matches the 4 existing hand-drawn SVGs (mountains, hills, deepforest, steppes) which all use this convention
- The AI-generated SVGs in hex-icon-preview.html have full symmetric silhouettes — these need a rework pass to add the sun-from-right shadow treatment

### Multi-layer opacity depth
- Signifiers use overlapping paths at different opacities to create depth
- Shadow/dark side: ~0.2-0.3 opacity layers
- Body/main shape: ~0.5-0.7 opacity layers
- This lets terrain color show through and creates a sense of volume
- Matches the established style in the 4 hand-drawn originals

### Art style standard
- The 4 hand-drawn SVGs in `Design/` (deepforest-hand-drawn.svg, hills-hand-drawn.svg, mountain-hand-drawn.svg, steppes-hand-drawn.svg) ARE the style standard
- All signifiers must match their line weight, detail level, and hand-drawn organic feel
- Key traits: irregular paths (not geometric), natural variation, cross-hatching for texture in some variants
- All signifiers must share consistent stroke weight, detail level, and color treatment (stylistic unity per design doc)

### Asset quality
- Final custom art ships in this phase — no placeholders
- All ~80+ SVG variants across 27 terrain types must be production quality
- Existing SVGs in hex-icon-preview.html need a rework pass to match the hand-drawn style (add sun-from-right shadow, reduce symmetry)
- Production method: Claude's discretion per terrain type (AI-gen + cleanup, algorithmic, manual SVG authoring — whatever produces best results matching the hand-drawn reference)

### Signifier rendering rules (from design doc, locked)
- Placement: centered on hex with ±10% position jitter (seeded by hex coordinates)
- Rotation: ±15° random rotation (seeded) for organic feel
- Size: scales with hex render size (~40-80px at hero-local ~300px, ~15-30px at regional ~100px)
- Hidden below regional zoom threshold
- Variant selection: deterministic per hex (seeded by hex coordinates) — adjacent hexes of same terrain show different variants
- Density: 1 primary signifier centered, optionally 1-2 smaller secondary in corners for dense terrain types

### Claude's Discretion
- SVG-to-Three.js rendering approach (texture atlas, individual sprites, or shader-drawn)
- Specific production method per terrain type
- Performance optimization for 60K hexes with signifiers
- Exact zoom threshold for signifier visibility/hiding
- Secondary signifier placement rules for dense terrain types
- How to validate readability at small sizes (~12px at regional zoom)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hex composition system design
- `Design/brainstorm-hexmap-v2.md` — "Hex Content Composition System" section defines slots (CENTER, N, NE, SE, S, SW, NW, FILL, RING), HexVisualManifest interface, SuppressRule interface, resolution algorithm, agent RING layout
- `Design/brainstorm-hexmap-v2.md` — "Layer 10: Landscape Signifiers" defines signifier catalog (all 27 terrain types with variant counts), rendering rules, asset format, pipeline, stylistic unity requirements

### Requirements
- `.planning/REQUIREMENTS.md` — COMP-01 through COMP-04 (composition system), LSIG-01 through LSIG-05 (signifier rendering), LART-01 through LART-30 (individual terrain type SVG sets)

### Art style references
- `Design/deepforest-hand-drawn.svg` — STYLE STANDARD: hand-drawn dense forest silhouette with sun-from-right shadow
- `Design/hills-hand-drawn.svg` — STYLE STANDARD: hand-drawn hills with layered opacity depth
- `Design/mountain-hand-drawn.svg` — STYLE STANDARD: hand-drawn mountain peaks with baked shadow
- `Design/steppes-hand-drawn.svg` — STYLE STANDARD: hand-drawn grass tufts with organic paths
- `Design/hex-icon-preview.html` — Existing SVG symbol library (~15 terrain + settlement icons). Terrain icons need rework pass for sun-from-right shadow treatment. Contains hex background coloring and size-scaling preview.

### Renderer integration
- `Design/brainstorm-hexmap-v2.md` — Layer 1 (Three.js orthographic, InstancedMesh), Layer 2 (zoom tiers and what's visible at each), Layer 9 (hard terrain transitions, signifier variation provides visual texture)

### Prior phase decisions
- `.planning/phases/01-renderer-foundation/01-CONTEXT.md` — Three.js setup, d3-zoom, InstancedMesh, 13-layer render order (signifiers are layer 8), flat-top hex orientation
- `.planning/phases/03-coastlines-water-elevation/03-CONTEXT.md` — Coastline as mask, rivers as overlay. Signifiers render on land portions of coastal hexes only.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/HexMap/HexTile.tsx` — Current SVG hex map tile (being replaced, but contains terrain-to-color mapping patterns)
- `Design/hex-icon-preview.html` — 15+ SVG symbol definitions ready for extraction and rework
- `Design/*-hand-drawn.svg` — 4 production-quality SVG signifiers (the style standard)
- `src/components/HexMap/CoastlineOverlay.tsx` — Three.js overlay rendering pattern (coastline mesh on top of InstancedMesh)
- `src/components/HexMap/RiverOverlay.tsx` — Three.js overlay rendering pattern (river lines on top of hex fills)

### Established Patterns
- Three.js orthographic camera with d3-zoom (Phase 1)
- InstancedMesh for hex fills with per-instance color attributes (Phase 1)
- 13-layer render order — signifiers are layer 8, between borders (7) and locations (9)
- Frustum culling for off-screen hexes (Phase 1)
- Seeded PRNG for deterministic generation (used throughout worldgen)

### Integration Points
- Signifier layer sits on top of hex fill InstancedMesh and below location/agent layers
- Composition system will be consumed by Phase 6 (locations/agents) and Phase 7 (fog culling)
- Zoom tier thresholds from Phase 1 camera system determine signifier visibility

</code_context>

<specifics>
## Specific Ideas

- "The hand-drawn ones have silhouette on the left side only to look like the sun is shining from the right side, where the AI-made ones have full silhouette" — this is THE key style differentiator. Every signifier must have this asymmetric shadow treatment baked into the SVG paths.
- The 4 hand-drawn SVGs (by Spliid in Inkscape) are the quality bar. They use complex organic paths, NOT geometric shapes.
- hex-icon-preview.html shows the icons at multiple sizes on hex backgrounds — use this as a visual validation tool during development.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-hex-composition-landscape-signifiers*
*Context gathered: 2026-03-22*
