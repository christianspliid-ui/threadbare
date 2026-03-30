# The Fantasy World Simulator — Hex Map V2

## What This Is

A systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite. The player is an Ascendant — a powerful former mortal — who guides a retinue of agents through a procedurally generated fantasy world. The hex map is the primary interface for spatial gameplay, exploration, and narrative discovery.

## Core Value

The hex map must be **beautiful, readable, and performant at 60K hexes** — it is the window into the world and the player's primary tool for understanding geography, politics, agents, and events at a glance.

## Current Milestone: v1.0 Hex Map V2

**Goal:** Complete rewrite of the hex map system — from world generation through rendering — based on the bottom-up 15-layer design in `Design/brainstorm-hexmap-v2.md`.

**Target features:**
- Three.js orthographic renderer with InstancedMesh (60K hexes in one draw call)
- Continuous-field world generation (heightmap → temperature → moisture → rivers → biome)
- 27 base terrain types with Tait-derived bright palette
- Coastline-as-mask and rivers-as-overlay (not terrain types)
- 7-point sub-hex sampling for organic coastlines and river crossings
- Data-driven hex composition system (slot-based visual manifest per entity)
- Hierarchical regions: geographic (terrain-driven) + political (travel-time from capital)
- Red-only political overlay with border rendering
- Landscape signifiers (3-5 SVG variants per terrain type, dark silhouettes)
- Location signifiers (settlement icons, POI markers)
- Agent rendering with faction coats of arms, tiered by zoom level
- Fog of war as culling (unexplored = dark, explored = full color, visible = dynamic content)
- 4-tier zoom LOD (hero-local, regional, continental, full world)
- Content assets: terrain signifier sprites, location icon sprites, faction heraldry

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

See: `.planning/REQUIREMENTS.md`

### Out of Scope

- **WebGL/3D hex map (Three.js perspective, GLTF models)** — rejected 2026-03-21. Investing in 2D orthographic rendering.
- **Animated terrain effects (swaying grass, flowing water)** — performance budget says no continuous terrain animation
- **Terrain blending between adjacent hexes** — hard edges, Tait style. Coastline mask is the ONE exception.
- **Border geometry changes (territory expansion/splitting)** — deferred to V2/V3. V1 has fixed geometry, changeable ownership.
- **Real-time 3D perspective camera** — orthographic only

## Context

- Existing engine: ~323 modules, ~70,600+ lines, ~5,111+ tests
- Current hex map: SVG-based, ~400 hexes max. Needs complete replacement for 60K target.
- Existing systems to preserve: tick loop, agent movement, encounter resolution, narrative engine, game state
- Existing `regionDetection.ts` flood-fill is fundamentally sound — upgrade for v2
- Design document: `Design/brainstorm-hexmap-v2.md` (15 layers, all LOCKED)
- Palette reference: `Design/hex-terrain-palette-v2.html`
- Style guide: `STYLE.md` (Threadbare dark aesthetic for UI chrome; bright map)

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite + Three.js (orthographic). No React Three Fiber — direct Three.js for control.
- **Performance**: 60K hexes at 60fps. InstancedMesh, GPU instancing, frustum culling mandatory.
- **Determinism**: Seeded PRNG for all generation. Same seed = same world.
- **Viewport**: 1920×1080 base. Nothing scrolls below fold.
- **Asset format**: SVG-defined vector signifiers rendered as Three.js sprites. Not raster.
- **Dependency budget**: Three.js + simplex-noise (already have). No additional heavy deps.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three.js Orthographic (not perspective 3D) | 2D map beauty > 3D novelty. Dual renderer maintenance rejected 2026-03-21. | — Pending |
| Continuous fields first, hex grid second | Organic coastlines, diagonal ridges, natural rivers. Hex grid is sampling layer. | — Pending |
| Coastline as mask, not terrain type | Coastal hexes keep inland biome. Water cuts through at organic angles. | — Pending |
| Rivers as overlay, not terrain type | Forest hex with river = forest hex + blue line. Rivers don't replace biomes. | — Pending |
| 27 base terrain types (Tait-derived) | Replaces current 43 types that conflated water, climate, composite. Clean taxonomy. | — Pending |
| Hard terrain transitions, no blending | Readability at small hex sizes. Classic hex map feel. Coastline mask is sole exception. | — Pending |
| Fog as culling, not visual overlay | Performance win: skip rendering for unexplored hexes. No dimming for explored hexes. | — Pending |
| Explored hexes at full brightness | ~95% of map is explored-but-not-visible. Dimming makes map ugly. Information-only distinction. | — Pending |
| Default sight = own hex only (range 0) | 10 km² hexes. Can't see beyond own hex without special abilities. | — Pending |
| Red reserved for political overlay | Terrain palette has no strong reds. Clear visual channel for borders/capitals. | — Pending |
| Political regions by travel-time from capital | Mixed terrain is normal. "Heartshire" spans whatever land is governable from its seat. | — Pending |

---
*Last updated: 2026-03-21 after milestone v1.0 initialization*
