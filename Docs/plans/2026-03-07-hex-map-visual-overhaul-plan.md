# Hex Map Visual Overhaul — Consolidated Plan

**Date:** 2026-03-07
**Status:** Plan — awaiting approval
**Scope:** Three interconnected design tasks for the hex map system

---

## Context

The current hex map implementation uses:
- Custom SVG hex rendering via React components (`HexMap.tsx`, `HexTile.tsx`, `HexDefs.tsx`)
- Flat-top hex orientation with odd-q offset coordinates
- AI-generated terrain tile PNGs clipped into hexagons (22 biome types)
- d3-zoom for pan/scroll
- Custom `hexMath.ts` (80 lines: coordinate conversion, pixel mapping, polygon generation)
- Fog of war via visibility states (unexplored/remembered/visible)
- Avatar overlay with pulsing sphere-colored border

The user wants to move toward a **Mystara-style** hex map aesthetic — the classic D&D/BECMI hex cartography look with symbolic terrain icons, layered features, and a more traditional tabletop RPG feel.

---

## Task 1: Revert to Mystara Map Style

### Goal
Replace the current AI-generated terrain tile approach with a Mystara-inspired symbolic hex style: solid terrain colors with overlaid icons/symbols for features (trees, mountains, buildings, etc.), matching the classic D&D overland hex map aesthetic.

### Current State
- 22 AI-generated terrain PNGs in `public/hex-tiles/`
- Terrain tiles are photorealistic aerial-view landscapes clipped to hex shapes
- No icon overlay system — the entire hex is a single image

### Target State
- Each hex has a **base color fill** matching terrain type (solid or subtle gradient)
- **Symbolic icons** overlaid on the base: trees for forest, peaks for mountains, waves for ocean, etc.
- Style references: [Atlas of Mystara](https://mystara.thorfmaps.com/legend/), [Breath of Mystara legend](https://breathofmystara.blogspot.com/2013/04/mystara-legend-with-new-hex-symbols.html)
- Clean, readable at small sizes, scales well with zoom
- Still supports the Threadbare dark-world aesthetic (darker palette than classic Mystara)

### Implementation Steps

1. **Design a terrain icon set** — SVG icons for each terrain type (~22 icons)
   - Trees (deciduous, conifer, palm, swamp cypress)
   - Mountains, hills, plateaus
   - Water patterns (ocean waves, river lines, lake fill)
   - Special terrain (volcanic, glacier, badlands, bog)
   - All icons must work at 20-60px hex sizes

2. **Create base color palette** — Flat terrain colors in Threadbare dark-world range
   - Greens: dark forest → olive grassland → jungle deep green
   - Browns: desert tan → mountain grey-brown → badlands rust
   - Blues: deep ocean → coastal shallow → lake teal
   - White/grey: tundra, glacier, snow

3. **Modify HexTile.tsx** — Replace `<image>` with layered SVG approach:
   ```
   Layer 1: Solid color polygon (base terrain)
   Layer 2: Terrain icon/symbol SVG (centered, scaled)
   Layer 3: Feature overlays (rivers, roads, coast borders — future)
   Layer 4: Magic thread effects (from sphere influence)
   Layer 5: UI state overlays (fog, selection, avatar)
   ```

4. **Remove AI tile dependency** — Delete `hex-tile-assets.ts` and `public/hex-tiles/` PNGs (or keep as fallback/optional mode)

### Open Questions
- Do we want to support toggling between "symbolic" and "terrain image" modes?
- Should icons be hand-crafted SVG or generated programmatically?

---

## Task 2: Hex Type Content Plan — Mystara Legend System

### Goal
Create a systematic, data-driven approach to generating all hex terrain types, their visual layers, and their connection to the story engine. The system should be able to:
- Look at existing Mystara hex maps as reference input
- Generate all necessary visual layers per terrain type
- Connect terrain rendering to story engine state (sphere influence, culture, doom)

### Architecture: Layered Hex Rendering Model

```
┌─────────────────────────────────────────┐
│           Layer 5: UI State             │ ← fog, selection, avatar pulse
├─────────────────────────────────────────┤
│        Layer 4: Magic Threads           │ ← sphere influence, dynamic
├─────────────────────────────────────────┤
│      Layer 3: Feature Overlays          │ ← rivers, roads, coasts, borders
├─────────────────────────────────────────┤
│       Layer 2: Terrain Icons            │ ← trees, peaks, waves, buildings
├─────────────────────────────────────────┤
│       Layer 1: Base Color Fill          │ ← terrain type → flat color
└─────────────────────────────────────────┘
```

### Layer Specifications

**Layer 1 — Base Color Fill**
- Source: `terrain-colors.ts` content package
- Input: `TerrainType` enum
- Output: Hex color code (dark-world Threadbare palette)
- Dynamic: Can shift based on sphere influence (subtle tint toward sphere color)

**Layer 2 — Terrain Icons**
- Source: `terrain-icons.ts` content package (SVG path data or React components)
- Input: `TerrainType` + optional density/variant seed
- Output: One or more SVG symbol instances positioned within the hex
- Pattern: Mystara-style — 1-3 repeated small icons (e.g., 3 trees for forest, 2 peaks for mountains)
- Variation: PRNG-seeded rotation/offset for visual variety without randomness

**Layer 3 — Feature Overlays (future, needs separate technical solution)**
- Rivers: Edge-following lines between hex vertices
- Roads: Similar edge/vertex lines, different stroke style
- Coasts: Thick border on hex edges adjacent to water
- Borders: Political/cultural boundaries along hex edges
- **Technical approach:** These are hex-edge features, not hex-center features. They need a separate rendering pass that draws on edges between adjacent hexes.

**Layer 4 — Magic Threads**
- Source: Story engine sphere influence data
- Input: Active spheres on this hex, influence intensity
- Output: Sphere-specific SVG filter/overlay (form language from STYLE.md)
- Dynamic: Changes per tick based on narrative events

### Content Data Shape

```typescript
// terrain-visual-content.ts
interface TerrainVisualDef {
  terrain: TerrainType;
  baseColor: string;           // Threadbare dark palette
  baseColorLight: string;      // For highlights / zoom
  iconId: string;              // SVG symbol reference
  iconCount: [number, number]; // min-max icons per hex
  iconScale: number;           // relative to hex size
  label: string;               // Human-readable name
  mystara_equivalent?: string; // Reference to Mystara legend entry
}
```

### Mystara Reference Pipeline

To use existing Mystara maps as input:
1. **Manual legend extraction** — Create a mapping from Mystara terrain codes to our TerrainType enum
2. **Color sampling** — Extract the Mystara palette and create our dark-world equivalent
3. **Icon tracing** — Use Mystara legend icons as reference to draw our own SVG versions (avoid copyright by creating original icons inspired by the style, not copies)
4. **Map import** (future) — If hex map data is available in structured format (like HexJSON), write an importer that maps Mystara terrain codes to our types

### Story Engine Connection Points

Each hex terrain visual responds to these story engine states:

| Engine State | Visual Effect |
|-------------|--------------|
| Sphere influence | Subtle color tint + magic thread overlay |
| Cultural territory | Border edge highlighting |
| Doom progression | Desaturation + entropy thread overlays |
| Season/time | Color palette shift (future) |
| Active event | Temporary icon overlay (fire, army, ritual) |

---

## Task 3: Open Source Hex Map Library Assessment

### Research Summary

Six libraries were evaluated. Here's the assessment for our specific use case:

### Recommended: Keep Custom + Adopt Honeycomb.js for Math

**Decision: Don't replace the rendering — replace the math.**

Our current custom SVG rendering is well-suited to the Mystara symbolic style (SVG icons, layered rendering, CSS-styleable). What we could improve is the hex coordinate math by adopting **Honeycomb.js**.

#### Why Not Replace Everything?

| Library | Verdict | Reason |
|---------|---------|--------|
| **react-hexgrid** | ❌ Skip | Last updated 3 years ago, limited customization, no fog of war |
| **Phaser 3** | ❌ Skip | Full game engine — way too heavy for our needs, different rendering paradigm |
| **PixiJS** | ⚠️ Future option | Great performance but we don't need WebGL yet; would require rewriting all SVG rendering |
| **D3.js** | ✅ Already using | d3-zoom already integrated; could deepen D3 usage for data-driven hex rendering |
| **Leaflet.Hexagonal** | ❌ Skip | Geographic maps, not game worlds |
| **Open Innovations HexJSON** | ❌ Skip | Cartogram tool for data visualization, not game hex maps |

#### Why Honeycomb.js?

Our `hexMath.ts` (80 lines) handles: offset↔cube conversion, neighbors, distance, pixel mapping, polygon generation. Honeycomb.js provides all of this plus:
- Pathfinding (A* built-in)
- Field of view / line of sight calculation
- Ring/spiral traversal
- Multiple grid shapes
- Renderer-agnostic (works with our SVG approach)
- TypeScript native
- Actively maintained (v4.1.5)

**Migration path:** Replace our 80-line `hexMath.ts` with Honeycomb.js imports, keep everything else. Zero visual change, better math.

#### D3.js Deepening (Alternative/Complementary)

Instead of adding a new library, we could deepen our D3 usage:
- Use `d3.selection` data joins for hex rendering (data-driven updates instead of React re-renders)
- Use D3 SVG masks/filters for fog of war (more visually sophisticated)
- Use D3 force layouts for icon placement within hexes

This is complementary to Honeycomb — use Honeycomb for hex math, D3 for rendering.

### PixiJS Escape Hatch

If we later need performance for 500+ visible hexes with complex overlays, the migration path to PixiJS is:
1. Keep Honeycomb.js for hex math (renderer-agnostic)
2. Replace SVG rendering with PixiJS sprite-based rendering
3. Keep d3-zoom for camera control (works with any coordinate system)

This is a future option, not a current need. Our hex count (~100-200 visible at typical zoom) is well within SVG performance limits.

---

## Task 4: AI Art Generation Pipeline

### Goal
All visual assets for the hex map system are AI-generated via the Nano Banana / Imagen MCP. The user provides reference images (Mystara legend screenshots, style samples); Claude generates all production assets. No hand-drawing required.

### Asset Inventory — What We Need to Generate

| Asset Category | Count | Format | Size | Generation Method |
|---------------|-------|--------|------|-------------------|
| **Terrain icons** | 22 base + variants | SVG (traced from AI raster) | Scalable | AI raster → auto-trace to SVG |
| **Terrain base textures** (optional) | 22 | PNG, 1:1 | 512×512 | MCP `generate_image` |
| **Magic overlays** | 12 (one per sphere) | PNG, 1:1, transparent | 512×512 | MCP `generate_image` |
| **Terrain variant tiles** | ~44 (2 per terrain × sphere) | PNG, 1:1 | 512×512 | MCP `generate_image` |
| **Feature icons** | ~15 (rivers, roads, bridges, etc.) | SVG (traced from AI raster) | Scalable | AI raster → auto-trace to SVG |
| **Event overlay icons** | ~10 (fire, army, ritual, etc.) | PNG, transparent | 256×256 | MCP `generate_image` |

**Total: ~125 assets** (not counting variants)

### Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    ASSET GENERATION PIPELINE                      │
│                                                                   │
│  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌────────────┐ │
│  │Reference │───▶│  Prompt  │───▶│  Imagen   │───▶│   Post-    │ │
│  │ Input    │    │ Composer │    │  MCP API  │    │ Processing │ │
│  └─────────┘    └──────────┘    └───────────┘    └────────────┘ │
│       │              │                │                 │        │
│  Mystara legend  STYLE.md +      generate_image    Hex mask,    │
│  screenshots,    content-type    with quality +    SVG trace,   │
│  style samples   art direction   aspect params     color adj    │
│                                                                   │
│                          ┌───────────┐                           │
│                          │  Approve  │ ← user reviews each batch │
│                          └───────────┘                           │
│                               │                                   │
│                     ┌─────────▼─────────┐                        │
│                     │  public/hex-art/   │                        │
│                     │  (production dir)  │                        │
│                     └───────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### Icon Sourcing — Approach Comparison

The terrain icons are the core visual identity. There are **five viable approaches** to getting them, each with different tradeoffs:

#### Option 1: AI-Generated Raster → SVG Trace
Generate raster icons via Imagen MCP, then auto-trace to SVG using `potrace` or `vtracer`.

| Pro | Con |
|-----|-----|
| Full creative control over style | Two-step pipeline (generate + trace) |
| Matches Threadbare aesthetic exactly | Trace quality varies — may need manual cleanup |
| No licensing concerns (we own it) | AI sometimes struggles with clean flat iconography |
| Unlimited variants | Consistency across 22 icons harder to control |

**Best for:** Unique project-specific look, but requires iteration.

#### Option 2: Open Source Icon Libraries (Pre-Made SVG)
Use existing fantasy/RPG SVG icon collections.

**Key libraries found:**

| Library | Icons | License | Terrain Coverage | Quality |
|---------|-------|---------|-----------------|---------|
| [game-icons.net](https://game-icons.net/) | 4,170+ SVG | CC BY 3.0 (attribution) | Excellent — mountains, trees, castles, waves | High, consistent style |
| [RPG-Awesome](https://github.com/nagoshiashumari/Rpg-Awesome) | 495 font icons | SIL OFL 1.1 (open) | Good — covers most terrain/RPG concepts | Medium, font-optimized |
| [Public Domain Vectors](https://publicdomainvectors.org/en/free-vector-fantasy-map) | 1,756 fantasy map | Public domain (CC0) | Moderate — map elements, less terrain-specific | Varies widely |
| [Flaticon fantasy](https://www.flaticon.com/free-icons/fantasy) | 24,838+ | Mixed (check per icon) | Good coverage | Professional, but license per icon |

| Pro | Con |
|-----|-----|
| Instant — no generation needed | May not match Threadbare dark aesthetic |
| Professionally designed, consistent | Requires attribution (CC BY 3.0) |
| Already SVG — no tracing step | Style may clash with our painterly world |
| Community-tested at small sizes | Limited customization of existing icons |

**Best for:** Fast prototyping, consistent quality baseline. game-icons.net is the standout — 4,170 SVG icons, well-organized, CC BY 3.0.

#### Option 3: Procedurally Coded SVG (Pure Code)
Write SVG path data directly in TypeScript — define each icon as a function that returns SVG elements.

**Inspiration:** [Azgaar's Fantasy Map Generator](https://github.com/Azgaar/Fantasy-Map-Generator) generates relief icons procedurally in SVG. Their codebase (MIT license) shows how to draw terrain symbols with code: mountains as triangle clusters, forests as circle-topped stems, etc.

| Pro | Con |
|-----|-----|
| Total control — every pixel is intentional | Significant hand-coding time per icon |
| Perfectly scalable, no artifacts | Requires design skill to make them look good |
| Trivially parameterizable (size, color, density) | Harder to achieve organic/hand-drawn feel |
| Zero dependencies, zero file size | 22 icons × design + code = substantial effort |
| Deterministic — PRNG seed controls placement | Looks more "technical" than "artisan" |

**Best for:** Maximum tunability and determinism (aligns with project priority #1). Can look great if designed well — see Azgaar's generator.

#### Option 4: Hybrid — Open Source Base + AI Enhancement
Start with game-icons.net SVGs as structural base, then use AI to generate stylized raster versions that match our dark-world aesthetic. Trace those back to SVG.

| Pro | Con |
|-----|-----|
| Fast start with proven icons | More complex pipeline |
| AI step adds unique Threadbare style | Still needs trace step |
| Best of both: structure + aesthetic | Copyright consideration: derivative work of CC BY 3.0 |

#### Option 5: Hybrid — Procedural Code + AI Texture Fill
Code the icon shapes procedurally (like Option 3) but fill them with AI-generated micro-textures instead of flat colors.

| Pro | Con |
|-----|-----|
| Parameterizable shapes + rich visual detail | Most complex pipeline |
| Shapes react to game state, textures add mood | Over-engineered for map icons at 20-60px |
| Perfect scalability with visual richness | |

### Recommended Approach

**Start with Option 3 (Procedural Code) for core terrain icons, validated against Option 2 (game-icons.net) as reference.**

Rationale:
1. **Tunability** (project priority #1) — procedural icons can be parameterized: scale, color, density, rotation all controlled by code
2. **Determinism** (priority #3) — PRNG-seeded placement means same seed = same visual
3. **Inspectability** (priority #2) — every icon is a pure function: input terrain type → output SVG elements
4. **Zero dependencies** — no external files to load, no image pipeline
5. **Mystara reference** — Mystara icons ARE simple geometric shapes (triangles for mountains, circles for trees). This style is naturally suited to code generation
6. **Azgaar precedent** — a successful open-source fantasy map generator already proves this approach works well

Use game-icons.net (Option 2) as visual reference and fallback — if any procedural icon doesn't look right, we can substitute a pre-made SVG from their library (with attribution).

Reserve AI generation (Option 1) for **non-icon assets**: magic overlays, terrain variant tiles, event art, lore illustrations — things that need painterly richness, not clean scalable symbols.

### Icon Inventory (22 terrain types)

| Terrain | Icon Description | Procedural Shape | Mystara Ref |
|---------|-----------------|-----------------|-------------|
| ocean | Wavy horizontal lines | 3 sine curves, stacked | Open sea pattern |
| coastal_shallows | Lighter wavy lines | 2 sine curves, thinner | Shallow water |
| lake | Enclosed water shape | Ellipse + 1 sine curve | Lake symbol |
| river | Flowing line segment | Bezier curve | River (edge) |
| grassland | Low grass tufts | 3-5 short arc clusters | Clear/grassland |
| farmland | Small field rows | Parallel line grid | Farmland pattern |
| savanna | Scattered low trees + grass | Small circles on stems + grass arcs | Savanna/scrub |
| steppe | Wind-swept grass lines | Angled parallel strokes | Steppe pattern |
| deciduous_forest | 2-3 round-canopy trees | Circles on vertical lines | Light forest |
| dense_forest | 3-4 overlapping trees | Overlapping circles, dense | Heavy forest |
| taiga | 2-3 pointed conifers | Triangles on vertical lines | Conifer forest |
| jungle | Dense palms/broad leaves | Fan shapes + circles, dense | Jungle |
| swamp | Trees + water lines | Circles on lines + sine curves | Swamp |
| bog | Tufted wetland plants | Tufted arcs + horizontal lines | Bog/marsh |
| hills | Rolling hill curves | 2-3 overlapping half-ellipses | Hills |
| mountains | Sharp peaked triangles | 2-3 triangles, decreasing size | Mountains |
| plateau | Flat-topped mesa shape | Trapezoid with horizontal top | Plateau/mesa |
| badlands | Eroded jagged shapes | Irregular zigzag silhouette | Badlands |
| desert | Sand dune curves | 2-3 gentle wave curves | Desert |
| tundra | Sparse lichen/rock dots | Scattered small circles/dots | Tundra |
| glacier | Cracked ice sheet | Rectangle + crack lines | Glacier |
| volcanic | Cone with smoke/flame | Triangle + wavy top | Volcano |

#### B. Terrain Base Textures (Optional Enhancement)

If solid color fills feel too flat, we can generate subtle textures:

**Approach:** Generate a 512×512 seamless-ish texture per terrain type, used as SVG pattern fill instead of solid color.

**Prompt template:**
```
Seamless top-down texture of [terrain surface]: [specific texture details].
Flat overhead view, no perspective. Muted desaturated palette centered on [base color].
Subtle variation only — this is a background, not a feature.
Dark fantasy aesthetic, dim lighting. No objects, no icons, no features.
Fills the entire image uniformly edge to edge.
```

**Decision:** Start with solid colors. Add textures only if the map looks too flat after icon integration.

#### C. Magic Overlays (12 Sphere Effects)

Already defined in STYLE.md. Use the existing Magic Overlay Prompt Template:

```
Semi-transparent [sphere] magic on black/transparent background.
[Color hex] threads in [form language]. 10-20% coverage.
Intensely bright, concentrated. No terrain, no scenery.
```

Generate one per sphere (4 Foundation + 8 Creation = 12 total). These composite over any terrain hex via alpha blending.

#### D. Terrain Variant Tiles (Sphere-Transformed Terrain)

For hexes that have been under prolonged sphere influence, the terrain itself is physically changed. These are full hex tiles (not icons) showing transformed landscape.

**Approach:** Use the existing hex tile pipeline but with sphere-specific transformations:
- Life-touched forest → luminous overgrowth, bioluminescent fungi
- Entropy-touched mountains → crumbling peaks, scattered fragments
- Force-touched plains → impact craters, shattered earth
- etc.

**Generation scope:** Start with 2-3 high-impact combinations (Life+forest, Entropy+mountains, Energy+desert), expand based on gameplay needs. This is a large matrix (22 terrain × 12 spheres = 264 theoretical combinations) — only generate what the game actually uses.

#### E. Feature Icons (Rivers, Roads, etc.)

Same approach as terrain icons (AI raster → SVG trace), but these are line/edge features rather than center features.

**Prompt template:**
```
Clean line drawing of a [feature] segment for a fantasy hex map.
[Specific details: e.g., "winding river with small bank detail" or
"cobblestone road section"]

Single dark color on white background. Thin clean line work.
Tabletop RPG cartography style. No terrain, no background.
```

#### F. Event Overlay Icons

Temporary icons that appear on hexes during active events (battle, fire, ritual, plague, etc.).

**Approach:** AI-generated small transparent PNGs, composited as a hex overlay.

**Prompt template:**
```
Symbolic icon of [event] for a dark fantasy game map overlay.
[Specific details: e.g., "crossed swords for battle" or "flame pillar for fire"]

Slightly glowing [relevant sphere color] on transparent/black background.
Clean silhouette, readable at small sizes. Fantasy tabletop style.
No text, no background terrain.
```

### Post-Processing Pipeline

All AI-generated assets go through post-processing before becoming game-ready:

```
┌───────────┐     ┌────────────┐     ┌──────────────┐     ┌───────────┐
│ Raw AI    │────▶│ Category   │────▶│ Post-Process │────▶│ Game-     │
│ Output    │     │ Router     │     │ Step         │     │ Ready     │
└───────────┘     └────────────┘     └──────────────┘     └───────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       Icon/Symbol   Hex Tile   Overlay
            │           │           │
     ┌──────▼──────┐ ┌──▼───┐ ┌───▼────┐
     │ 1. Threshold│ │Hex   │ │Alpha   │
     │ 2. Trace    │ │mask  │ │extract │
     │ 3. Simplify │ │pipeline│ │+ clean│
     │ 4. Export   │ │      │ │        │
     │    as SVG   │ │      │ │        │
     └─────────────┘ └──────┘ └────────┘
```

**Icon post-processing (new script: `scripts/trace-icon.py`):**
1. Load AI-generated PNG
2. Convert to high-contrast B&W (threshold)
3. Run `potrace` or `vtracer` for SVG path extraction
4. Simplify paths (reduce point count for clean scaling)
5. Output as SVG `<path>` data string for embedding in `terrain-icons.ts`

**Hex tile post-processing (existing: `scripts/generate-hex-tile.py`):**
1. Load AI-generated PNG
2. Center-crop to square
3. Apply flat-top hexagonal alpha mask with feathered edges
4. Save as transparent PNG

**Overlay post-processing:**
1. Load AI-generated PNG
2. Extract alpha channel (black → transparent, bright → opaque)
3. Apply hex mask (same as terrain tiles)
4. Save as transparent PNG

### Batch Generation Workflow

For efficiency, generate assets in themed batches with user review between batches:

**Batch 1 — Icon Reference Sheets (22 terrains)**
- Generate 3-4 icon variants per terrain type
- User picks best variant for each
- Run SVG trace pipeline on approved icons
- Duration: ~1 session

**Batch 2 — Base Color Palette + Optional Textures**
- Define 22 terrain colors (code, no AI needed)
- If textures wanted: generate 22 seamless texture tiles
- User reviews palette against Mystara reference
- Duration: ~0.5 session

**Batch 3 — Magic Overlays (12 spheres)**
- Generate 12 sphere magic overlays
- User reviews for form language accuracy
- Duration: ~0.5 session

**Batch 4 — High-Priority Terrain Variants**
- Generate 6-8 most-used sphere×terrain combinations
- User reviews transformed landscapes
- Duration: ~1 session

**Batch 5 — Feature + Event Icons**
- Generate river, road, bridge, coast segment icons
- Generate 8-10 event overlay icons
- User reviews and approves
- Duration: ~1 session

### Automation Script: `scripts/generate-terrain-icons.ts`

A batch generation script that:
1. Reads the terrain type list from `terrain-visual-content.ts`
2. For each terrain, composes a prompt using the icon prompt template
3. Calls the Imagen MCP to generate 3 variants
4. Saves to `generated/icons/[terrain]/variant-[1-3].png`
5. After user approval, runs SVG trace on the approved variant
6. Outputs SVG path data to `terrain-icons.ts`

```typescript
// Pseudocode for the batch script
interface IconGenConfig {
  terrain: TerrainType;
  iconDescription: string;
  mystara_equivalent: string;
  variants: number; // how many to generate for selection
}

const ICON_CONFIGS: IconGenConfig[] = [
  { terrain: 'ocean', iconDescription: 'Wavy horizontal lines suggesting open water', mystara_equivalent: 'Open sea', variants: 3 },
  { terrain: 'deciduous_forest', iconDescription: 'Two or three round-canopy trees in a cluster', mystara_equivalent: 'Light forest', variants: 4 },
  // ... all 22 terrains
];
```

### Quality Assurance

Each generated asset must pass these checks before going into production:

| Check | Icons | Hex Tiles | Overlays |
|-------|-------|-----------|----------|
| Readable at 20px | ✅ Required | N/A | N/A |
| No text/labels | ✅ Required | ✅ Required | ✅ Required |
| Consistent visual weight | ✅ Required | N/A | N/A |
| Clean SVG paths (< 500 points) | ✅ Required | N/A | N/A |
| Hex mask applied | N/A | ✅ Required | ✅ Required |
| No magic in terrain | N/A | ✅ Required | N/A |
| Transparent background | N/A | N/A | ✅ Required |
| Matches STYLE.md palette | ✅ Required | ✅ Required | ✅ Required |
| User approved | ✅ Required | ✅ Required | ✅ Required |

---

## Implementation Sequence

### Phase A: Hex Math Upgrade (optional, low risk)
1. Install Honeycomb.js
2. Replace `hexMath.ts` functions with Honeycomb equivalents
3. Verify all 1,027 tests still pass
4. Benefit: pathfinding, FOV, ring traversal for free

### Phase B: Art Asset Generation (Batch 1-2)
1. Generate terrain icon reference sheets (22 terrains × 3-4 variants)
2. User reviews and picks best variant per terrain
3. Run SVG trace pipeline on approved icons
4. Define base color palette (code, no AI)
5. Optional: generate seamless texture tiles

### Phase C: Mystara Visual System (code)
1. Create `terrain-visual-content.ts` content package
2. Create `terrain-icons.ts` with SVG path data from Phase B
3. Modify `HexTile.tsx` to use layered rendering (color + icon + overlays)
4. Remove or optionalize AI terrain tile PNGs
5. Update fog of war rendering for new layer system
6. Integration test: verify map renders correctly with new assets

### Phase D: Art Asset Generation (Batch 3-5)
1. Generate magic overlays (12 sphere effects)
2. Generate high-priority terrain variants (6-8 combinations)
3. Generate feature + event icons
4. User reviews each batch

### Phase E: Feature Overlay System (future)
1. Design hex-edge data model for rivers, roads, coasts
2. Create edge-rendering pass in HexMap
3. Connect to story engine for dynamic features

### Phase F: Story Engine Integration (future)
1. Wire sphere influence to color tinting
2. Wire doom state to desaturation
3. Wire cultural territories to border rendering
4. Wire active events to temporary icon overlays

---

## Effort Estimates

| Phase | Tasks | Estimate | Dependencies |
|-------|-------|----------|-------------|
| A: Hex Math | 3 tasks | 1 session | None |
| B: Art Gen (Icons) | 5 tasks | 1-2 sessions | User review required |
| C: Visual System | 6 tasks | 1-2 sessions | Phase B (icons ready) |
| D: Art Gen (Overlays) | 4 tasks | 1-2 sessions | Phase C (rendering works) |
| E: Feature Overlays | 3 tasks | 1-2 sessions | Phase C |
| F: Story Integration | 4 tasks | 1-2 sessions | Phase C, E |

---

## References

- [Atlas of Mystara — Main Legend](https://mystara.thorfmaps.com/legend/)
- [Breath of Mystara — New Hex Symbols](https://breathofmystara.blogspot.com/2013/04/mystara-legend-with-new-hex-symbols.html)
- [Thorfinn Tait Cartography](https://www.thorfmaps.com/)
- [Honeycomb.js GitHub](https://github.com/flauwekeul/honeycomb)
- [react-hexgrid GitHub](https://github.com/Hellenic/react-hexgrid)
- [PixiJS GitHub](https://github.com/pixijs/pixijs)
- [D3 Hexbin Map Gallery](https://d3-graph-gallery.com/hexbinmap.html)
- [Open Innovations HexJSON Format](https://open-innovations.org/projects/hexmaps/hexjson.html)
- [Open Innovations Hex Map Builder (GitHub)](https://github.com/odileeds/hexmaps)
- [Red Blob Games — Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)
