# Hex Map V2 — Bottom-Up Design Brainstorm

> Started 2026-03-21. Working document — captures brainstorming, not final spec.

## Design Stack (15 Layers)

| # | Layer | Status |
|---|-------|--------|
| 1 | Core rendering technology | LOCKED: Three.js Orthographic |
| 2 | Zoom contract & readability | LOCKED |
| 3 | Landscape constraints (heightmap, temperature, moisture) | LOCKED |
| 4 | Water systems (coast, lakes, rivers) | LOCKED |
| 5 | Hex type distribution | LOCKED |
| 6 | Regions | LOCKED |
| 7 | Hex coloring / palette | LOCKED (Tait-derived, see palette HTML) |
| 8 | Elevation visual language | LOCKED |
| 9 | Terrain transitions | LOCKED |
| 10 | Landscape signifiers | LOCKED |
| 11 | Location signifiers | LOCKED |
| 12 | Borders, edges, grid | LOCKED |
| 13 | Agents and icons | LOCKED |
| 14 | Fog of war | LOCKED |
| 15 | Zoom-level rendering | LOCKED |

Cross-cutting: Hex Content Composition System (slot-based, data-driven)

---

## Layer 1: Core Rendering Technology

**Decision: Three.js Orthographic Camera**

Why not the alternatives:
- **SVG (current)**: ~400 hexes OK, 60K impossible. DOM node per hex = death.
- **Canvas 2D**: CPU-bound. Redraws entire scene on pan/zoom. Feasible up to ~5K hexes with tiling tricks, painful at 60K.
- **Raw WebGL shaders**: Maximum performance but massive implementation cost for every feature.
- **Pixi.js**: Good 2D engine, but we'd outgrow its abstraction. Three.js ortho gives us the same flat rendering with more headroom.

Three.js Orthographic advantages:
- `InstancedMesh` renders 60K hex fills in **one draw call**
- GPU does the work — CPU only uploads data on change
- Orthographic camera = pixel-perfect 2D, no perspective distortion
- Built-in frustum culling (off-screen hexes = free to skip)
- d3-zoom compatible (we keep the same pan/zoom UX)
- Sprites, text, particles all available when needed
- HTML overlay for tooltips via `project()` world-to-screen

Scale target: **200×300 hexes (~60,000 total)**

### Animation Budget

- NO animated terrain effects (no swaying grass, flowing water, etc.)
- YES: agent movement trails (sprites translating across hexes)
- YES: event indicators (crossing swords, activity pulses) — sprite pop-in, not continuous
- YES: notification badges (appear/fade, no loop)
- Fog of war as **culling layer**: skip rendering signifiers/agents/events for unexplored hexes entirely (performance win, not just visual overlay)

### Tooltips

HTML overlay positioned via Three.js `project()` (world → screen coords). This gives us full CSS/React control for tooltip content while Three.js handles the map rendering.

---

## Layer 2: Zoom Contract & Readability

Four zoom tiers:

| Tier | Hex size | Visible hexes | Shows |
|------|----------|---------------|-------|
| Hero-local | ~300px | ~20-30 | Full composition: terrain signifiers, all locations, sublocations as markers, agent sprites, event indicators |
| Regional | ~100px | ~300 | Terrain color + major locations + city names. Agents as dots. |
| Continental | ~30px | ~5,000 | Terrain color + region labels + major cities as icons |
| Full world | ~10px | ~60,000 | Terrain color only. Region boundaries. Political overlays. |

**Default zoom: Hero-local** — the game is about following a hero locally in a huge living world. You see multiple locations per hex, other character icons, activity indicators. This drives you into the hex chronicle.

The world is large to support narrative scaling: scattered heroes at start → continent-spanning politics at endgame.

---

## Hex Content Composition System (Data-Driven)

Each hex contains multiple visual entities (terrain features, locations, sublocations, events, agents). The composition system manages what shows where.

### Hex Slots

```
        N
   NW       NE
      CENTER
   SW       SE
        S

FILL — background layer (terrain signifiers)
RING — orbital positions around edge (agents)
```

### Visual Manifest (per entity type)

```typescript
interface HexVisualManifest {
  preferredSlot: HexSlot;           // CENTER, N, NE, SE, S, SW, NW
  footprint: 'full' | 'large' | 'medium' | 'small' | 'tiny';
  suppresses: SuppressRule[];
  visibleAt: ZoomTier[];
  priority: number;
  fallbackSlots?: HexSlot[];
}

interface SuppressRule {
  target: 'terrain-signifier' | 'minor-location' | 'sublocation-markers';
  when: 'always' | 'same-slot' | 'footprint-overlap';
}
```

### Examples

- **Major city**: CENTER, full footprint, suppresses terrain-signifier always, visible at hero-local + regional + continental, priority 90
- **Small shrine**: NW preferred, small footprint, suppresses nothing, hero-local only, priority 20, fallbacks NE/SW
- **Forest terrain**: FILL slot, full footprint, suppresses nothing, hero-local + regional, priority 10

### Resolution

1. Collect all entities for the hex
2. Sort by priority (desc)
3. Assign slots: preferred → fallback → hidden
4. Evaluate suppression rules
5. Output: `{ entity, slot, visible }[]`

NFP compliance: tunability (data rows not render code), inspectability (dump composition for any hex), content-driven hierarchy.

### Agent RING Layout

Agents occupy RING positions around the hex edge. When many agents are present:
- Sorted by ID for stable positioning
- Evenly distributed around the ring
- At hero-local: individual sprites with identity
- At regional+: dots with count badge if >4

---

## Layers 3 & 4: World Generation Pipeline

> These two layers are tightly coupled and documented together. The key architectural insight is: **continuous fields first, hex grid second.** Geography is generated as continuous mathematical functions. The hex grid is overlaid afterward as a discretization/sampling layer. This produces organic coastlines, diagonal mountain ridges, and rivers that cut through hexes at natural angles.

### Architectural Principle: Continuous Fields → Hex Sampling

The noise functions are mathematically continuous — they can be evaluated at *any* (x, y) point, not just hex centers. The generation pipeline:

```
Seed
  → continuous heightmap function (simplex noise)
    → sea level classification (continuous)
      → continuous temperature function
        → continuous moisture function
          → river routing (continuous paths, steepest descent)
            → lake formation (continuous depressions)
              → temperature reassessment (continuous)
                → OVERLAY HEX GRID
                  → sample all fields at hex centers + 6 corners (7 per hex)
                    → classify hexes (biome, coastal mask, river crossings)
                      → drainage verification (hex-level)
```

The hex grid is a **discretization layer** on top of a continuous world. Game mechanics operate on hexes. Geography operates on continuous math.

### Sub-Hex Sampling (7 points per hex)

For each hex, evaluate all continuous fields at:
- **1 center point** → primary classification (biome, elevation, temperature, moisture)
- **6 corner points** → edge-level detail (coastline shape, river entry/exit, elevation gradient)

60K hexes × 7 samples = 420K noise evaluations. Simplex noise is fast — sub-second on modern CPU.

The corner samples enable:
- Which edges of a coastal hex are water vs. land
- Where a river enters and exits a hex
- The elevation gradient across the hex (for hillshade rendering in Layer 8)

---

### Pass 1: Heightmap (Continuous)

**Input:** World seed (PRNG)
**Output:** Continuous function `elevation(x, y) → [0.0, 1.0]` (0.0 = deep ocean, 1.0 = peak)

**Approach: Multi-octave noise + drainage guarantee**

Evaluated three options:
- ❌ **Tectonic simulation** — most realistic mountain shapes but complex
- ✅ **Multi-octave noise + drainage guarantee** — organic ridge shapes, minimal channel carving ensures all water reaches sea. Best balance of realism vs. complexity.
- ❌ **Coast-first + ridge injection** — guaranteed drainage but mountains look "piled in the middle," not tectonic

Algorithm:
- Multi-octave simplex noise (existing `simplex-noise` library)
  - 4-6 octaves, each at half amplitude and double frequency
  - Octave 1: continental shapes (huge blobs of land/sea)
  - Octave 2-3: mountain ranges and valleys (medium-scale ridges)
  - Octave 4-6: local terrain variation (hills, depressions)
- **Sea level threshold** (tunable, default ~0.35): everything below = ocean
- **Power redistribution** to create expansive lowlands with restricted peaks:
  `elevation = 1 - (1 - raw)^2` (compresses high elevations, expands lowlands)
- **Drainage guarantee pass**: after sampling onto hexes, run depression-filling to ensure every land hex has a downhill path to the sea. Modifies minimal hexes. We already have this algorithm in our current river system.

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `NOISE_OCTAVES` | 5 | Number of noise layers |
| `NOISE_PERSISTENCE` | 0.5 | Amplitude decay per octave |
| `NOISE_LACUNARITY` | 2.0 | Frequency multiplier per octave |
| `SEA_LEVEL` | 0.35 | Elevation threshold for ocean |
| `ELEVATION_POWER` | 2.0 | Redistribution exponent (higher = more lowlands) |
| `BASE_FREQUENCY` | 0.005 | Scale of largest noise features (lower = bigger continents) |

---

### Pass 2: Temperature (first pass, continuous)

**Input:** Heightmap + world-space y-coordinate (latitude)
**Output:** Continuous function `temperature(x, y) → [0.0, 1.0]` (0.0 = frozen, 1.0 = scorching)

Three factors combined:
1. **Latitude gradient**: warmest at equator (map center-y), coldest at poles (top/bottom edges)
   - Sinusoidal curve: `baseTemp = cos(latitude * PI)`
2. **Elevation cooling**: higher points are colder regardless of latitude
   - `tempModifier = -elevation(x,y) * LAPSE_RATE`
   - Real lapse rate: ~6.5C per 1000m, normalized to 0-1 scale
3. **Maritime moderation**: points near ocean have milder temperatures
   - Coastal points pulled toward the mean temperature
   - Effect decreases with distance from ocean (exponential falloff)

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `LAPSE_RATE` | 0.3 | Temperature reduction per unit elevation |
| `MARITIME_INFLUENCE_RADIUS` | 8 | Distance (in hex units) ocean moderates temperature |
| `MARITIME_STRENGTH` | 0.4 | How strongly ocean pulls temp toward mean |
| `EQUATOR_POSITION` | 0.5 | Y-position of warmest latitude (0-1, default center) |

---

### Pass 3: Precipitation & Moisture (continuous)

**Input:** Temperature + heightmap + ocean positions
**Output:** Continuous function `moisture(x, y) → [0.0, 1.0]` (0.0 = arid, 1.0 = saturated)

Factors:
1. **Prevailing wind**: dominant wind direction (tunable, default: west-to-east)
   - Moisture starts high at the windward ocean edge
   - Decreases as air moves inland (continental effect)
2. **Orographic effect (rain shadow)**: mountains force air up, causing rain on windward side and drought on leeward
   - Rising elevation: moisture dumps as precipitation
   - Past the ridge: dry air descends (rain shadow)
3. **Temperature influence**: warm air holds more moisture than cold
   - Hot + wet = tropical rainforest conditions
   - Cold + wet = snow/tundra conditions

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `WIND_DIRECTION` | 270 | Prevailing wind in degrees (270 = west-to-east) |
| `CONTINENTAL_DRYNESS` | 0.04 | Moisture loss per hex-unit distance from windward coast |
| `OROGRAPHIC_MULTIPLIER` | 2.5 | How strongly mountains dump moisture on windward side |
| `RAIN_SHADOW_FACTOR` | 0.6 | Moisture reduction on leeward side of mountains |

---

### Pass 4: River Generation & Lake Formation

**Input:** Heightmap + precipitation (sampled onto hex grid for pathfinding)
**Output:** River paths (as sequences of hex-edge crossings) + lake hexes

Rivers are driven by precipitation, not random placement:

1. **Source selection**: Hexes with high precipitation AND high elevation become potential river sources
   - Threshold: `precipitation > RIVER_SOURCE_PRECIP_MIN && elevation > RIVER_SOURCE_ELEV_MIN`
2. **Flow accumulation**: Each hex accumulates the precipitation of all hexes that drain through it. When accumulation exceeds `RIVER_FLOW_THRESHOLD`, a visible river forms.
3. **Downhill routing**: Water flows to the lowest adjacent hex (steepest descent). The drainage guarantee from Pass 1 ensures this always reaches the sea.
4. **River width**: Proportional to accumulated flow. Tiny streams near sources, major rivers near coast.
5. **Lake formation**:
   - **Depression lakes**: Where the drainage pass filled a depression, the filled area becomes a lake
   - **Flow convergence lakes**: Where many tributaries converge into a flat area

**Rivers are NOT a terrain type** — they are a line drawn *through* hexes of whatever terrain they cross. A river through a forest hex is still a forest hex with a blue line crossing it. River entry/exit points come from the continuous flow path intersecting hex edges.

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `RIVER_SOURCE_PRECIP_MIN` | 0.6 | Minimum precipitation for a river source |
| `RIVER_SOURCE_ELEV_MIN` | 0.5 | Minimum elevation for a river source |
| `RIVER_FLOW_THRESHOLD` | 5.0 | Accumulated flow units before river becomes visible |
| `RIVER_WIDTH_SCALE` | 0.3 | How quickly river width grows with flow |
| `LAKE_DEPRESSION_MIN_SIZE` | 3 | Minimum hexes for a depression to become a lake |
| `TARGET_RIVER_SYSTEMS` | 20 | Approximate number of major river systems for 60K hex world |

---

### Pass 5: Temperature Reassessment

**Input:** Pass 2 temperature + river/lake positions from Pass 4
**Output:** Final temperature values

Light adjustment pass (most hexes change < 5%):
- **Lake effect**: large lakes moderate nearby temperatures (weaker version of maritime effect)
- **River valley cooling**: river hexes slightly cooler (evaporative effect)
- **Moisture feedback**: very wet areas (marshes, rainforest) slightly cooler due to evapotranspiration

---

### Hex Sampling & Classification

After all continuous passes complete, the hex grid is overlaid and each hex is sampled:

#### Per-hex data structure

```typescript
interface HexSample {
  // Sampled from continuous fields
  centerElevation: number;        // elevation at hex center
  cornerElevations: number[6];    // elevation at each corner
  temperature: number;            // final temperature (after reassessment)
  moisture: number;               // precipitation/moisture value

  // Derived from samples
  landRatio: number;              // 0.0 = fully ocean, 1.0 = fully land
  coastlineMask: CoastlineMask | null;  // shape of land/water boundary within hex
  riverCrossings: RiverCrossing[];     // where rivers enter/exit this hex
  elevationGradient: [number, number]; // dx, dy slope for hillshade rendering

  // Classified
  biome: BiomeType;               // from Whittaker mapping
  isLake: boolean;
}
```

#### Coastline as Mask (not terrain type)

**There is no "coast" terrain type.** Every coastal hex retains its inland biome. The coastline is a rendering mask that cuts through the hex.

Classification from the 7 sample points (center + 6 corners):

| Condition | Classification |
|-----------|----------------|
| All 7 points above sea level | Fully land — no coast rendering |
| All 7 points below sea level | Fully ocean |
| Mixed | **Coastal hex** — interpolate shoreline within hex |

For mixed (coastal) hexes:
1. For each hex edge, check if the two corner elevations straddle sea level
2. If yes, interpolate *where* on that edge the coastline crosses: `t = (SEA_LEVEL - elev_A) / (elev_B - elev_A)`
3. Connect all crossing points → coastline curve within the hex
4. This is a **2D marching-squares** approach applied per hex

A coastal hex renders as:
1. Fill entire hex with water color (base layer)
2. Draw the land portion clipped to the coastline shape, colored by the hex's biome
3. Apply terrain signifiers (trees, etc.) only on the land portion

The hex's biome is whatever the Whittaker mapping says for its center point — forest, grassland, swamp, etc. Being on the coast doesn't change the terrain type, it just means part of the hex is underwater.

#### Water depth bands

Same principle for the ocean side:

| Depth | Condition | Visual |
|-------|-----------|--------|
| Shallows | Ocean hex adjacent to any land hex | Light blue |
| Mid-ocean | Elevation between `SEA_LEVEL - DEEP_THRESHOLD` and shallows | Medium blue |
| Deep ocean | Elevation below `SEA_LEVEL - DEEP_THRESHOLD` | Dark blue |

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `DEEP_OCEAN_THRESHOLD` | 0.15 | Elevation below which ocean is "deep" |
| `SHALLOWS_DEPTH` | 0.30 | Elevation above which ocean hex is "shallows" (close to SEA_LEVEL) |

#### River crossings (not terrain type)

Rivers are also rendered as overlays, not terrain types. Each hex stores where rivers cross its edges:

```typescript
interface RiverCrossing {
  entryEdge: HexEdge;           // which of the 6 edges the river enters from
  exitEdge: HexEdge;            // which edge it exits through
  entryPosition: number;         // 0-1 position along the entry edge
  exitPosition: number;          // 0-1 position along the exit edge
  flowAccumulation: number;      // determines rendered width
}
```

The renderer draws a curved line from entry point to exit point, with width proportional to flow. The hex underneath keeps its biome color and signifiers — the river is just drawn on top.

---

### Biome Assignment: Two-Pass System

**Base pass: Whittaker mapping** — temperature × moisture → realistic biome

```
              Hot          Warm         Cool         Cold
           ┌────────────┬────────────┬────────────┬────────────┐
Wet        │  Tropical   │  Temperate │   Boreal   │   Tundra   │
           │  Rainforest │  Forest    │   Forest   │   (wet)    │
           ├────────────┼────────────┼────────────┼────────────┤
Moderate   │  Savanna    │  Woodland  │   Taiga    │   Tundra   │
           │             │            │            │            │
           ├────────────┼────────────┼────────────┼────────────┤
Dry        │  Desert     │  Grassland │   Steppe   │   Ice      │
           │  (hot)      │  / Prairie │            │   Sheet    │
           └────────────┴────────────┴────────────┴────────────┘
```

Elevation overrides: highest elevations → mountain/snow regardless of moisture.

**Fantasy overlay pass** (separate system, runs later): Sphere alignment, narrative rules, or explicit placement convert base biomes to magical variants:
- Temperate Forest → Enchanted Forest (high Nature sphere alignment)
- Mountain → Crystal Caves (high Earth sphere alignment)
- Marsh → Shadow Marshes (high Shadow sphere alignment)

This keeps geography realistic while making fantasy elements feel *placed* rather than random. The overlay can hard-overwrite small areas for special narrative locations.

---

### Key Design Decisions

1. **Continuous first, hex second** — geography ignores the grid. The grid is just a sampling resolution for game mechanics.
2. **Noise + drainage guarantee** — not "elevation = distance from coast" (boring mountains) or full tectonic sim (complex). Noise gives organic ridges, drainage pass ensures rivers work.
3. **Coastline is a mask, not a type** — coastal hexes keep their inland biome. Water cuts through at whatever angle the continuous shoreline dictates.
4. **Rivers are overlays, not types** — a forest hex with a river is still a forest hex. The river is drawn on top.
5. **Fantasy is an overlay on realism** — base world is geographically plausible. Magical variants are applied as a second pass, driven by narrative/cosmology.
6. **Regular hex grid, not Voronoi** — our engine is built on hex coordinates. Organic feel comes from sub-hex rendering (coastline masks, diagonal rivers, terrain transitions) not cell shape.

## Layer 5: Hex Type Distribution

### 27 Base Terrain Types

Refined from Thorfinn Tait legend analysis. Each type is visually distinct at zoomed-out scale, maps cleanly from the continuous fields, and nothing is redundant.

```
Lowland (4):    grassland, savanna, steppe, floodplain
Forest (5):     woodland, temperate_forest, dense_forest, boreal_forest, tropical_forest
Wet (3):        marsh, swamp, moor_bog
Highland (6):   hills, forested_hills, mountains, high_mountains, plateau, mountain_pass
Desert (5):     sand_desert, sand_dunes, rocky_desert, hardened_clay, badlands
Cold (3):       tundra, snow_fields, glacier
Volcanic (2):   volcanic, lava
Special (2):    broken_lands, dead_forest
```

Water types (`ocean`, `deep_ocean`, `shallows`, `lake`, `river`) are NOT terrain types — they are overlay/mask data on the hex (see Layers 3-4).

### Whittaker Mapping → Type Assignment

```
                Hot (>0.7)    Warm (0.4-0.7)     Cool (0.2-0.4)    Cold (<0.2)
             ┌──────────────┬─────────────────┬─────────────────┬───────────────┐
Wet (>0.7)   │ tropical_     │ dense_forest /   │ boreal_forest   │ tundra        │
             │ forest        │ temperate_forest │                 │               │
             ├──────────────┼─────────────────┼─────────────────┼───────────────┤
Mod (0.3-    │ savanna       │ woodland         │ steppe          │ tundra        │
  0.7)       │               │                  │                 │               │
             ├──────────────┼─────────────────┼─────────────────┼───────────────┤
Dry (<0.3)   │ sand_desert / │ grassland        │ steppe          │ snow_fields   │
             │ sand_dunes /  │                  │                 │               │
             │ rocky_desert  │                  │                 │               │
             └──────────────┴─────────────────┴─────────────────┴───────────────┘
```

### Elevation Overrides (applied after Whittaker)

| Elevation | Override |
|-----------|----------|
| > 0.85 | `high_mountains` (always, regardless of moisture/temp) |
| > 0.70 | `mountains` |
| > 0.55 + moisture > 0.5 | `forested_hills` |
| > 0.55 + moisture <= 0.5 | `hills` |
| > 0.45 + low local variance | `plateau` |

### Wetland Overrides (low elevation + high moisture)

| Condition | Type |
|-----------|------|
| elev < 0.40 && moisture > 0.80 && temp > 0.5 | `swamp` |
| elev < 0.40 && moisture > 0.80 && temp 0.3-0.5 | `marsh` |
| elev < 0.40 && moisture > 0.80 && temp < 0.3 | `moor_bog` |
| elev < 0.40 && moisture > 0.75 && near river | `floodplain` |

### Desert Sub-type Selection (hot + dry)

Within the desert zone, local noise determines variant:

| Condition | Type |
|-----------|------|
| Flat + low elevation variance | `sand_desert` or `sand_dunes` (noise toggle) |
| High local elevation variance | `rocky_desert` |
| Near volcanic | `hardened_clay` |
| Medium elevation + dry | `badlands` |

### Special Types (not climate-driven)

| Type | Placement |
|------|-----------|
| `mountain_pass` | Saddle point detection: local elevation minimum between two mountain hexes along a ridge |
| `volcanic` | Placed by dedicated volcanic system (hotspot noise, rare) |
| `lava` | Adjacent to active volcanic hexes |
| `broken_lands` | Fantasy overlay pass — corruption, divine catastrophe |
| `dead_forest` | Fantasy overlay pass — blight, curse, war damage |

### Fantasy Overlay Pass (separate system, runs after base generation)

Sphere alignment, narrative rules, or explicit placement convert base biomes to magical variants. These are NOT part of the 27 base types — they're runtime transformations:

- Temperate Forest → Enchanted Forest (high Nature sphere)
- Mountain → Crystal Caves (high Earth sphere)
- Marsh → Shadow Marshes (high Shadow sphere)
- Any → Broken Lands (corruption event)
- Forest → Dead Forest (blight event)

The hex remembers its `baseTerrain` for recovery when the overlay condition ends.

---

## Layer 7: Hex Coloring / Palette

### Tait-Derived Palette

Full interactive reference: `Design/hex-terrain-palette-v2.html`

Palette extracted from Thorfinn Tait base tile legend, adapted for our 27 types. Each color is instantly distinguishable at small hex sizes (10-30px, continental/full-world zoom).

#### Color System

| Category | Hue Range | Logic |
|----------|-----------|-------|
| Greens (10 types) | `#2E6E2C` → `#8EB852` | Darkest = densest vegetation, lightest = open grassland |
| Browns/Golds (6 types) | `#8A6828` → `#C8A850` | Elevation hierarchy: darkest = highest mountains |
| Tans (3 types) | `#C09050` → `#D4B878` | Desert variants: warmth indicates sand vs rock |
| Pink (1 type) | `#D0A090` | Hardened clay — unique, unmistakable |
| Orange/Red (2 types) | `#C07844`, `#D06830` | Badlands + lava — heat/danger |
| Greys (4 types) | `#8A8890` → `#A8B0A0` | Volcanic, broken, dead, tundra — lifeless/barren |
| White (2 types) | `#D0DDE8`, `#E8E8E8` | Snow + glacier — cold |
| Blues (5 types) | `#3870B0` → `#88C0E0` | Water depth: dark = deep, light = shallow |

#### Full Palette Map

```typescript
const TERRAIN_PALETTE: Record<TerrainType, string> = {
  // Lowland
  grassland:        '#8EB852',
  savanna:          '#B8B44E',
  steppe:           '#A0A048',
  floodplain:       '#7EA04A',
  // Forest
  woodland:         '#6A9E3A',
  temperate_forest: '#4E8830',
  dense_forest:     '#3A6E24',
  boreal_forest:    '#3A6830',
  tropical_forest:  '#2E6E2C',
  // Wet
  marsh:            '#8A9850',
  swamp:            '#6E8838',
  moor_bog:         '#5A7840',
  // Highland
  hills:            '#C8A850',
  forested_hills:   '#5C8234',
  mountains:        '#9E7830',
  high_mountains:   '#8A6828',
  plateau:          '#B89848',
  mountain_pass:    '#A89060',
  // Desert
  sand_desert:      '#D4B878',
  sand_dunes:       '#CCAC60',
  rocky_desert:     '#C09050',
  hardened_clay:    '#D0A090',
  badlands:         '#C07844',
  // Cold
  tundra:           '#A8B0A0',
  snow_fields:      '#E8E8E8',
  glacier:          '#D0DDE8',
  // Volcanic
  volcanic:         '#8A8890',
  lava:             '#D06830',
  // Special
  broken_lands:     '#A09888',
  dead_forest:      '#98988A',
};

const WATER_PALETTE = {
  shallows:         '#88C0E0',
  ocean:            '#5898D0',
  deep_ocean:       '#3870B0',
  lake:             '#5888B8',
  river:            '#4878A8',
};
```

#### Hue Shifting Rule (from research doc)

For elevation shading and lighting effects:
- **Shadows**: shift hue toward blue/purple (never darken with pure black)
- **Highlights**: shift hue toward yellow/orange (never lighten with pure white)

This creates richer, more natural depth than simple brightness adjustment.

#### Dark Mode Adaptation

The Tait palette is a "light map" style (bright, saturated colors on white). For our Threadbare dark aesthetic, we have two options:

1. **Use as-is** — the map is a bright window into the world, contrasting with the dark UI chrome around it. The reference map image the user shared uses this approach.
2. **Desaturate + darken** — multiply all colors by ~0.6 brightness for a moodier map. Risk: colors become hard to distinguish.

<AI>Recommendation: use the bright palette as-is for the map surface. The dark UI panels (hex chronicle, retinue, topbar) provide enough contrast. A bright, readable map surrounded by dark chrome is a classic strategy game look.</AI>

---

## Layer 6: Regions

Regions give the landscape political and cultural meaning. They're hierarchical: geographic sub-regions nest inside political regions, just like the Known World map where "Heartshire" sits inside "The Five Shires."

### Two-Level Hierarchy

**Level 1: Geographic Regions** (auto-detected, terrain-driven)
- Contiguous areas of similar terrain bounded by natural features
- "The Thornwood" (a forest), "The Ashenmoor" (a wetland), "The Spine" (a mountain range)
- Size target: 50-200 hexes each. Larger clusters are subdivided.
- Named by dominant terrain + historical culture influence
- Each hex belongs to exactly ONE geographic region

**Level 2: Political Regions** (kingdoms, baronies, territories)
- Defined by **travel-time from a center of power**, not terrain type. A barony covers whatever land is governable from its capital — mixed terrain is expected and normal. "Heartshire" (like Yorkshire) spans whatever landscape surrounds its seat.
- Groups of geographic regions under one faction/culture
- "The Five Shires" contains Heartshire + Southshire + Seashire, etc.
- Boundaries follow geographic region boundaries (political borders always lie on geographic borders)
- **V1**: Ownership (faction/culture) can change (conquest, diplomacy). Borders and names change with ownership. Border *geometry* is fixed at worldgen.
- **Future (V2/V3)**: Border geometry changes (territory expansion, splitting, merging)

### Natural Boundary Detection

Region edges snap to natural features. The algorithm assigns a **border cost** to each hex edge based on how different the neighboring hexes are:

| Feature at edge | Border cost | Effect |
|-----------------|-------------|--------|
| Mountain range crossing | Very high (0.9) | Hard boundary — regions almost never cross mountain spines |
| Major river crossing | High (0.7) | Strong boundary — rivers naturally divide territories |
| Coastline | Absolute (1.0) | Hard boundary — land regions stop at coast |
| Elevation change > threshold | Medium (0.5) | Highland/lowland transitions tend to split |
| Biome transition | Medium (0.4) | Forest-to-grassland edge is a natural break |
| Same terrain, no features | Low (0.1) | Regions extend freely across homogeneous terrain |

Algorithm:
1. Build border cost field across all hex edges
2. Watershed segmentation — flood-fill from seed points, stop at high-cost edges
3. Large regions (>200 hexes) are subdivided along highest-cost internal edges
4. Undersized regions (<20 hexes) are merged into the neighbor with the lowest border cost
5. Each region gets a centroid (for label placement) and a dominant terrain type (for naming)

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `REGION_TARGET_SIZE` | 120 | Target hex count per geographic region |
| `REGION_MIN_SIZE` | 20 | Below this, merge into neighbor |
| `REGION_MAX_SIZE` | 200 | Above this, subdivide |
| `MOUNTAIN_BORDER_COST` | 0.9 | How strongly mountains divide regions |
| `RIVER_BORDER_COST` | 0.7 | How strongly rivers divide regions |
| `BIOME_BORDER_COST` | 0.4 | How strongly biome changes divide regions |
| `REGION_MAP_LABEL_MIN_SIZE` | 30 | Minimum hexes for a region to get a map label (smaller regions named in hex chronicle only) |

### Rendering: Red Political Overlay

**Red is reserved exclusively for political information.** The terrain palette has no strong reds, making it a clear visual channel for borders and control markers.

#### Border rendering

| Level | Line style | Color |
|-------|-----------|-------|
| Kingdom / major political | Thick (3px), solid | `#C83030` (strong red) |
| Barony / sub-region | Thin (1.5px), solid | `#C83030` (same red, thinner) |
| Geographic feature (forest, mountain range) | **No border** — text label only | n/a |

Borders are drawn along hex edges where adjacent hexes have different regionIds. The renderer walks the boundary edges and draws a continuous line (not per-hex — one polyline per border segment).

#### Capital markers

The capital / seat of power within each political region is marked with a red dot or red-outlined settlement icon. This matches the Tait convention where the regional capital gets a distinct red marker.

| Level | Capital marker |
|-------|---------------|
| Kingdom capital | Large red dot (6px) or red-filled castle icon |
| Barony seat | Small red dot (3px) or red-outlined settlement icon |

#### Label rendering

Labels are placed at the centroid of the region. Font size and weight scale with political hierarchy:

| Level | Font size | Weight | Example |
|-------|-----------|--------|---------|
| Kingdom / major political | 18-24px | Bold, all-caps or small-caps | **THE FIVE SHIRES** |
| Barony / sub-region | 12-16px | Regular, title case | *Heartshire* |
| Geographic feature (named forest, mountain range) | 10-14px | Italic, title case | *The Thornwood* |

**Map label density**: Not every region gets a map label. Small clusters (<30 hexes) are named internally but their names only appear in the hex chronicle, not on the map itself. The map should feel spacious, not cluttered. Points of interest exist everywhere, but region labels on the map are reserved for regions large enough to matter narratively.

**Subdivision naming**: When a large contiguous terrain area (e.g., a huge forest) is split by a river or ridge, the resulting regions get related names: "West Thornwood" / "East Thornwood", or distinct names if culturally different.

Labels should:
- Follow the shape of the region when elongated (curved text along a mountain range or coastline)
- Avoid overlapping other labels (collision detection)
- Appear at appropriate zoom levels (kingdoms at continental, baronies at regional, geographic at regional only if large enough)
- Use a legible font with good contrast against all terrain colors (dark text with light halo/outline, or light text with dark halo depending on underlying terrain brightness)
- Only render on the map if the region exceeds `REGION_MAP_LABEL_MIN_SIZE` hexes

#### Zoom visibility

| Zoom tier | What shows |
|-----------|-----------|
| Full world | Kingdom borders (thick) + kingdom labels |
| Continental | Kingdom borders + barony borders (thin) + both label levels |
| Regional | All borders + all labels including geographic features |
| Hero-local | Borders fade to very subtle. Labels only for the current region. |

### Existing System: What We Keep

The current `regionDetection.ts` flood-fill approach is fundamentally sound. For v2:
- **Keep**: flood-fill by terrain similarity, graph integration (regions as nodes), culture-based naming
- **Upgrade**: add border-cost-based splitting, size capping, natural boundary snapping
- **Add**: political hierarchy (geographic regions grouped into political regions)
- **Update**: `TERRAIN_TO_FEATURE` mapping for the new 27-type terrain list

---

## Layer 8: Elevation Visual Language

> Reference: Tait Known World maps. No hillshade, no color gradients, no contour lines.

Elevation is communicated through four mechanisms only:

### 1. Terrain Color (passive)

The palette already encodes elevation: browns/golds = elevated, greens = low. At zoomed-out views where signifiers aren't visible, color alone communicates "these hexes are higher." No additional shading or color modulation is applied for elevation — the base terrain color does the job.

### 2. Signifier Icons (active, see Layer 10)

Mountain peak icons, hill bump icons drawn on the hex. These are the primary elevation signal at hero-local and regional zoom. Different icon variants for different elevation levels:
- Hills: gentle rounded bumps
- Mountains: jagged peaks
- High mountains: jagged peaks with snow caps

### 3. Edge Tick Marks ("caterpillar" marks)

Short hash marks radiating inward from hex edges where an elevated hex borders a lower hex. These are the classic Tait elevation indicator — a ring of small tick marks around the border of hill and mountain hexes.

Rules:
- Only drawn on edges where the elevation difference exceeds `ELEVATION_TICK_THRESHOLD`
- Tick marks point inward toward the higher hex
- Density of ticks scales with elevation difference (more ticks = steeper)
- Drawn in a dark shade of the terrain color (not black — matches the terrain)
- Visible at hero-local and regional zoom, hidden at continental+

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `ELEVATION_TICK_THRESHOLD` | 0.15 | Minimum elevation difference to draw edge ticks |
| `TICK_LENGTH` | 4px | Length of each tick mark at hero-local zoom |
| `TICK_DENSITY_MIN` | 3 | Minimum ticks per edge |
| `TICK_DENSITY_MAX` | 8 | Maximum ticks per edge |

### 4. Altitude Text Labels (rare, named peaks only)

Notable peaks and elevated features get altitude annotations: "Alt. 10,000 ft" or "Valley of Khyr — Alt. 3,000 ft". These are:
- Only placed on named/important elevations, not every mountain hex
- Small italic text, positioned near the signifier icon
- Visible at hero-local and regional zoom
- Driven by location data (a named mountain peak is a location with an altitude property), not raw elevation sampling

---

## Layer 9: Terrain Transitions

> Reference: Tait maps use NO blending between terrain types.

### Decision: Hard Edges, No Blending

Each hex is cleanly its own color with its own signifiers. Transitions between terrain types are **abrupt at hex boundaries**. There is no gradient, dithering, or cross-fade between adjacent hexes of different terrain.

Why this works:
- **Readability**: at small hex sizes, blending makes adjacent colors muddy and indistinct
- **Simplicity**: no edge-blending shader or transition logic needed
- **Classic hex map feel**: this is how hex maps have always worked — the hex IS the unit of terrain
- **Signifier variation** within a terrain type provides enough visual texture without needing inter-hex blending

The coastline mask (Layer 4) is the ONE exception — water cuts through hexes at organic angles. But land-to-land terrain transitions are hex-edge-sharp.

### What provides visual variety instead

- **Multiple signifier variants** per terrain type (3-5 unique icons, randomly selected per hex) prevent tiling repetition
- **Signifier placement variation** (slight position jitter within the hex) prevents rigid grid patterns
- **Elevation edge ticks** (Layer 8) add visual texture at terrain boundaries
- **Color variation** within a terrain type could be subtle (±5% brightness noise per hex) to break up large uniform regions — but this is optional and should be tested visually

---

## Layer 10: Landscape Signifiers

Small icons/patterns drawn on each hex to indicate terrain type. These are the primary terrain identification at hero-local and regional zoom. At continental+ zoom, only the base color is visible.

### Signifier Style

**Black or dark silhouette icons**, consistent with the Tait reference. Simple, high-contrast shapes that read at small sizes. Each terrain type has **3-5 variants** randomly selected per hex (seeded by hex coordinates for determinism) to prevent visible tiling.

### Signifier Catalog

| Terrain | Signifier | Variants |
|---------|-----------|----------|
| **grassland** | Small scattered grass tufts, or clean (just color) | 3: clean, light tufts, wildflowers |
| **savanna** | Scattered single trees with flat canopy | 3: single tree, two trees, dry grass |
| **steppe** | Low scrubby vegetation, wind-bent grass | 3: scrub, bent grass, bare |
| **floodplain** | Flat with water-line markings | 2: dry, wet-season marks |
| **woodland** | Scattered round-top trees, spacing visible | 4: 2-tree cluster, 3-tree, single large, mixed |
| **temperate_forest** | Dense round-top deciduous trees | 4: tight cluster, mixed sizes, clearing, full canopy |
| **dense_forest** | Very dense, overlapping dark canopy | 3: solid canopy, deep shade, ancient trunks |
| **boreal_forest** | Triangular evergreen/conifer trees | 4: tight conifers, mixed height, snow-dusted, sparse |
| **tropical_forest** | Dense round canopy, lush, broad leaves | 3: dense canopy, palms mixed, vine-draped |
| **marsh** | Horizontal wavy lines, reed tufts | 3: reeds, water lines, mixed |
| **swamp** | Dead trees in water, lily pads | 3: standing water, dead trees, dense reeds |
| **moor_bog** | Low heather/scrub, mist suggestion | 3: heather, peat, sparse scrub |
| **hills** | Rounded bump silhouettes | 4: single hill, double hill, rolling, steep |
| **forested_hills** | Hills with trees on top | 3: deciduous-topped, conifer-topped, mixed |
| **mountains** | Jagged peak silhouettes | 4: single peak, double peak, ridge, cliff face |
| **high_mountains** | Jagged peaks with snow caps | 3: snow peak, twin peaks, massive single |
| **plateau** | Flat-topped mesa silhouette | 3: mesa, cliff edge, stepped |
| **mountain_pass** | Gap between two peaks, path line | 2: narrow pass, broad saddle |
| **sand_desert** | Clean or tiny dot pattern | 3: clean, wind ripples, scattered dots |
| **sand_dunes** | Wavy dune line silhouettes | 3: rolling dunes, crescent, tall dune |
| **rocky_desert** | Small rock/boulder outlines | 3: scattered rocks, rock pile, flat rocks |
| **hardened_clay** | Crack pattern lines | 2: fine cracks, deep cracks |
| **badlands** | Jagged eroded spires/columns | 3: spires, layered, eroded pillars |
| **tundra** | Sparse low scrub, lichen dots | 3: lichen, scrub, bare |
| **snow_fields** | Clean white or wind-drift lines | 2: clean, drift patterns |
| **glacier** | Crevasse lines, blue-tinted | 2: crevassed, smooth |
| **volcanic** | Crater/caldera outline, smoke wisps | 3: active crater, dormant, vent |
| **lava** | Flow lines, glowing cracks | 2: fresh flow, cooling |
| **broken_lands** | Shattered/fractured ground pattern | 2: cracked, rubble |
| **dead_forest** | Bare trunk silhouettes, no canopy | 3: standing dead, fallen, charred |

### Signifier Rendering Rules

- **Placement**: centered on hex with slight random jitter (±10% of hex size, seeded)
- **Size**: scales with hex render size. At hero-local (~300px hex), signifiers are ~40-80px. At regional (~100px), they're ~15-30px. Below that, hidden.
- **Color**: dark silhouette (near-black or very dark shade of the terrain color). NOT colorful — the base hex fill carries the color information, signifiers carry the shape information.
- **Density**: 1 primary signifier centered, optionally 1-2 smaller secondary signifiers in corners for denser terrain types (dense_forest, jungle). Controlled by hex composition system slots.
- **Rotation**: slight random rotation (±15°, seeded) for organic feel
- **Suppression**: major locations suppress terrain signifiers (see Hex Content Composition System)

### Asset Format & Pipeline

**Format**: Simple vector paths (SVG-defined, rendered as Three.js sprites or shader-drawn shapes). NOT raster images — vectors scale cleanly across all zoom levels and can be colored procedurally.

**Stylistic unity is paramount** (from research): A coherent visual language across all signifiers matters far more than the fidelity of individual icons. Every signifier must share:
- Consistent stroke weight
- Consistent level of detail (all simple silhouettes, not some detailed and some schematic)
- Consistent color treatment (dark silhouettes on terrain fill)
- Same visual "generation" — never mix hand-drawn with geometric, or pixel art with vector

Since we generate our own sprites, we control this completely. The pipeline for adding new signifiers:

1. **Design** the icon as SVG at a reference size (e.g., 64×64 viewbox)
2. **Validate** it reads correctly at all target sizes (down to ~12px for regional zoom)
3. **Create 3-5 variants** with consistent style but different compositions
4. **Register** in the signifier catalog with terrain type mapping
5. **Test** adjacency — place several variants side by side to verify they read as "same terrain, different hex"

**Prototyping resource**: For initial development, consider using Kenney CC0 assets as placeholder signifiers. These are public domain, commercially safe, and provide mechanical clarity for prototyping before custom art is created. Replace with custom unified-style assets before release.

**Resolution rule**: Pick ONE resolution/detail level and stick to it across all signifiers. Mixing detail levels (e.g., a detailed city icon next to a simple tree icon) breaks the visual coherence immediately.

---

## Layer 11: Location Signifiers

Locations (settlements, structures, POIs) are drawn as icons on the hex, managed by the Hex Content Composition System (slot assignment, priority, suppression).

### Icon Style

**Black silhouette icons**, matching the Tait convention. Each location type has a distinct, recognizable shape that reads at small sizes (down to ~12px at regional zoom).

### Location Icon Catalog

| Location Type | Icon Shape | Size Class |
|---------------|-----------|------------|
| **capital** | Large castle with banner/flag | full |
| **city** | Castle/walled town silhouette | large |
| **town** | Building cluster with church spire | medium |
| **hamlet** | Small house cluster | small |
| **castle** | Fortified tower with crenellations | medium |
| **fort** | Square fortification | medium |
| **tower** | Single tall tower | small |
| **temple** | Domed/spired building | medium |
| **shrine** | Small arch or standing stone | small |
| **ruins** | Broken/crumbled version of building | small |
| **ruined_city** | Broken castle silhouette | medium |
| **ruined_tower** | Broken tower | small |
| **ruined_village** | Broken houses | small |
| **mining** | Pick/anvil or mine entrance | small |
| **camp** | Tent silhouette | small |
| **battleground** | Crossed swords | small |
| **unexplored_poi** | Question mark or generic marker | tiny |
| **wilderness** | No icon (terrain signifier only) | — |

### Location Label Rules

- Location name rendered as text below the icon
- Font size scales with location importance: capital > city > town > hamlet
- Black text with thin white/light halo for readability against all terrain colors
- Labels visible at hero-local and regional zoom
- At continental zoom, only capitals and cities show labels
- At full world zoom, only capitals show (as dots, no text)

### Special Markers

| Marker | Icon | Color | When |
|--------|------|-------|------|
| Capital of political region | Settlement icon with red ring/dot | Red `#C83030` | Always (at appropriate zoom) |
| Active battle/conflict | Crossed swords | Red `#C83030` | During active encounter |
| Historical battle | Crossed swords with date | Grey | Always |
| Named peak / altitude | Mountain icon + "Alt. X ft" text | Dark, italic | Always at hero-local |

---

## Layer 12: Borders, Edges, Grid

The full rendering stack of lines and edges, layered in this order (back to front):

### Rendering Order (back to front)

```
1. Hex fill (terrain color)
2. Coastline mask (water/land boundary within hex)
3. Hex grid lines
4. Elevation edge ticks
5. River lines
6. Roads and trails
7. Political borders (barony, then kingdom on top)
8. Terrain signifiers
9. Location icons + labels
10. Agent sprites
11. Event indicators
12. Region/feature name labels
13. Fog of war overlay
```

### Hex Grid Lines

- Thin lines (0.5-1px) along all hex edges
- Light grey: `#00000020` (black at ~12% opacity) on land, `#00000015` on water
- Always visible at all zoom levels (provides spatial reference)
- At full-world zoom, grid lines may be hidden entirely (too dense) — just hex fills

### Rivers

- Drawn as curved blue lines through hexes, following the `RiverCrossing` data (entry point → exit point)
- Width proportional to `flowAccumulation`: thin streams (1-2px) near sources, major rivers (4-8px) near coast
- Color: `#4878A8` (from water palette)
- Tributaries merge visually where two river lines enter the same hex
- River labels: blue italic text following the river path ("Red River", "Vesubian River")
- River labels visible at regional zoom and closer, placed along straight segments

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `RIVER_MIN_WIDTH` | 1.5 | Minimum rendered river width in px |
| `RIVER_MAX_WIDTH` | 8 | Maximum rendered river width in px |
| `RIVER_LABEL_MIN_FLOW` | 15 | Minimum flow accumulation to get a name label |

### Roads and Trails

Roads connect settlements along optimal paths (following Delaunay edges / pathfinding through the hex grid).

| Type | Style | Color | Width |
|------|-------|-------|-------|
| Major road | Solid line | Black `#222222` | 2-3px |
| Trail / path | Dotted line | Black `#222222` | 1.5px |
| Shipping lane | Dotted line | Black `#222222` (over water) | 1.5px |

Roads are drawn as polylines through hex centers (or along hex edges for more organic paths). They follow the terrain — roads avoid mountains and water, preferring passes and bridges.

Road generation:
- Connect all cities/towns via minimum spanning tree on the hex graph
- Add ~15% additional connections for loops (prevents dead-end-only networks)
- Roads prefer low-cost terrain (grassland, hills) and use mountain passes
- Bridges are placed where roads cross rivers (small bridge icon at crossing point)

<AI>Roads could be deferred to a later phase if the implementation budget is tight. They're visually important but not gameplay-critical for v1. The settlement icons and terrain already communicate enough about the world. Consider: v1 without roads, v2 adds road network.</AI>

### Political Borders

As defined in Layer 6:

| Level | Line style | Color | Width |
|-------|-----------|-------|-------|
| Kingdom / major political | Solid | `#C83030` | 3px |
| Barony / sub-region | Solid | `#C83030` | 1.5px |

- Drawn along hex edges where adjacent hexes have different political regionIds
- Rendered as continuous polylines (one line per border segment, not per-hex)
- At hero-local zoom, political borders fade to subtle (50% opacity)
- Geographic feature boundaries have NO border lines — text labels only

### Coastline Rendering

The coastline within coastal hexes (from the marching-squares mask in Layer 4) is rendered as:
- A clean edge between the water fill and the land fill within the hex
- Optionally a thin dark line (1px, terrain-dark) along the shore for definition
- Shallows hexes get a lighter blue fill than open ocean
- No "beach" color band — the hex's terrain color IS the beach if it's a coastal grassland, etc.

### Elevation Edge Ticks

As defined in Layer 8:
- Short hash marks radiating inward from hex edges where elevation changes significantly
- Dark shade of the terrain color
- 3-8 ticks per edge depending on steepness
- Only on edges exceeding `ELEVATION_TICK_THRESHOLD`

## Layer 13: Agents and Icons

Agents are the living, moving elements on the map — retinue heroes, rivals, armies, creatures. They must be **instantly distinguishable** from static terrain signifiers (dark silhouettes) and location icons (black silhouettes).

### Visual distinction from static elements

- **Locations**: black silhouettes, static, part of the landscape
- **Agents**: colored circular portraits with status rings, animated, living entities

### Tiered agent rendering by zoom

| Zoom tier | Rendering | Detail |
|-----------|-----------|--------|
| Hero-local (~300px/hex) | **Portrait thumbnail** in circular frame + name label | Full identity: portrait, coat of arms ring, name, activity icon, health status |
| Regional (~100px/hex) | **Colored dot** with faction color ring | Identity on hover/tap only. Dot size = importance (hero vs. commoner). Count badge if >4 on hex. |
| Continental (~30px/hex) | **Tiny dot or hidden** | Only retinue agents and major rivals. Others hidden. |
| Full world (~10px/hex) | **Hidden** | No agents rendered. Faction presence via political overlay only. |

### Agent sprite anatomy (hero-local zoom)

```
    ╭──────────╮
    │ Status   │  ← colored ring: green=healthy, yellow=wounded, red=critical
    │ ╭──────╮ │
    │ │Portrt│ │  ← circular thumbnail (existing system)
    │ ╰──────╯ │
    ╰──────────╯
    ⚔ Activity    ← small icon: sword=fighting, boot=moving, zzz=idle
    Agent Name    ← text label below
```

### Faction identification

Factions have **coats of arms** which provide identity at all zoom levels:
- **Hero-local**: coat of arms visible as the border/frame decoration around the portrait
- **Regional**: the colored dot uses the faction's primary heraldic color
- **Retinue (player's agents)**: always use a fixed, high-visibility color (gold/white border) for instant recognition regardless of faction

Faction heraldic colors must be saturated and bright to stand out against the muted terrain palette. They should NOT overlap with terrain colors — use hues absent from the palette: bright red, royal blue, purple, magenta, cyan, bright orange.

### RING layout (from Composition System)

Agents occupy RING positions around the hex edge:
- Sorted by agent ID for stable, deterministic positioning
- Evenly distributed around the ring circumference
- When agents move between hexes, they animate along ring → edge → neighbor ring path
- At hero-local: full portrait sprites at ring positions
- At regional: colored dots at ring positions, badge count if crowded

### Movement animation

Adapted from existing system for Three.js:
- **Bezier hop**: smooth arc from source hex ring position to destination hex ring position
- **Duration**: ~800ms per hex traversal (tunable: `AGENT_MOVE_DURATION`)
- **Trail**: optional fading line behind moving agent (thin, faction color, fades over 2-3 seconds)
- **Settle**: 150ms ease into final ring position on arrival
- Fog of war: agents under fog are NOT animated (culled entirely, see Layer 14)

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `AGENT_MOVE_DURATION` | 800 | ms per hex traversal animation |
| `AGENT_SETTLE_DURATION` | 150 | ms ease into ring position |
| `AGENT_TRAIL_FADE` | 2000 | ms for movement trail to fade |
| `AGENT_DOT_RADIUS_HERO` | 4 | dot radius at regional zoom for heroes |
| `AGENT_DOT_RADIUS_MINOR` | 2 | dot radius at regional zoom for minor agents |
| `AGENT_CROWD_THRESHOLD` | 4 | agents on hex before showing count badge instead of individual dots |

### Activity indicators

Small icons overlaid below or beside the agent portrait:

| Activity | Icon | Color |
|----------|------|-------|
| Moving | Boot / footsteps | Neutral (dark) |
| In encounter | Crossed swords | Red |
| Idle | Hourglass / zzz | Grey |
| Trading | Coin | Gold |
| Building | Hammer | Brown |
| Injured / retreating | Bandage | Red |

### Event indicators (hex-level, non-agent)

Temporary icons that appear on hexes to signal activity. These are NOT continuous animations — sprite pop-ins that appear/disappear based on game state:

| Event | Icon | Behavior |
|-------|------|----------|
| Battle in progress | Crossed swords over hex | Pulse effect, disappears when encounter ends |
| Construction | Scaffolding icon | Static while building |
| Divine intervention | Star burst | Flash + fade over 2 seconds |
| Corruption spreading | Dark wisps | Fade in on newly affected hexes |
| Trade route active | Coin trail | Subtle dots along route |

---

## Layer 14: Fog of War

Fog of war is both a **gameplay system** (exploration matters, information is scarce) and a **performance optimization** (skip rendering expensive layers for hidden hexes).

### Hex scale context

Each hex represents ~10 km². At that scale, an agent on the ground cannot see into adjacent hexes — the default line of sight is **the hex you occupy, nothing more.**

### Hex visibility states

| State | How you get here | Visual treatment |
|-------|------------------|------------------|
| **Unexplored** | Default. Never visited, no intelligence. | Fully dark — solid dark fill, no terrain detail, no grid lines, no signifiers, no icons. The hex is a mystery. |
| **Explored** | Previously visited by a retinue agent, or received intelligence (spy, trade route, rumor, scrying). | **Full color, full beauty.** Terrain, signifiers, locations, labels — all rendered at full brightness and saturation. NO agents, NO events — you know the geography but not what's happening there right now. The visual difference from "visible" is the *absence of dynamic content*, not a color change. |
| **Visible** | A retinue agent currently occupies this hex. | Full color, full detail. Everything renders: terrain, signifiers, locations, agents, events, activity indicators, labels. |

**Design decision**: explored hexes are NOT dimmed or desaturated. Since ~95% of the map is explored-but-not-visible at any time, dimming would make the map dark and ugly. Instead, the distinction between explored and visible is purely informational: explored hexes show static geography, visible hexes also show dynamic activity (agents, events). The player intuits "I can see the forest but I don't know if anyone is there right now."

### Sight range rules

| Source | Sight range | Notes |
|--------|-------------|-------|
| **Default agent** | Own hex only (range 0) | 10 km² is too large to see beyond. This is the baseline. |
| **Elevated position** | Own hex + adjacent (range 1) | Agent at a watchtower, mountain peak, or elevated location |
| **Magic / scrying** | Variable (range 1-5+) | Ascendant abilities, magical equipment, scrying spells. Can target distant hexes. |
| **Ascendant (player)** | Own retinue hexes + divine sight range | Ascendants have broader awareness. Tunable per game stage. |
| **Intelligence network** | Transitions hexes to "explored" | Spy reports, trade route information, rumors. Not real-time visibility — just geographic knowledge. |

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `DEFAULT_SIGHT_RANGE` | 0 | Base agent sight (own hex only) |
| `ELEVATED_SIGHT_BONUS` | 1 | Additional hex range from elevated positions |
| `ASCENDANT_SIGHT_RANGE` | 2 | Base divine sight range for the player |
| `EXPLORED_DESATURATION` | — | **Removed**: explored hexes render at full color |
| `FOG_REVEAL_DURATION` | 300 | ms for fade-in when a hex is first revealed |

### Performance: Fog as Culling

The critical performance insight — fog isn't just a visual overlay, it's a **rendering skip**:

- **Unexplored hexes (~80% of map)**: render ONLY a solid dark hex fill. One instanced quad, cheapest possible. Skip ALL signifier sprites, location icons, agent sprites, event indicators, labels, edge ticks, river lines within the hex. At 60K hexes, ~48K are simple solid quads.
- **Explored hexes (~15% of map)**: render hex fill + terrain signifiers + location icons (all static, cacheable). Skip agents and events (you can't see current activity).
- **Visible hexes (~5-15 hexes)**: full rendering pipeline with agents, animations, events. This is the only place expensive dynamic rendering happens.

Implementation: **per-hex culling**, not post-process overlay. Check visibility state before rendering each hex's layers. Skip expensive layers for non-visible hexes. The whole point is to NOT render what's hidden.

### Reveal animation

When a hex transitions state:
- **Unexplored → Explored**: quick fade-in (~300ms) from dark to dimmed terrain view
- **Explored → Visible**: quick brightness/saturation increase (~200ms)
- **Visible → Explored**: gradual dim-out (~500ms) as agent leaves — "memory fading" feel
- No dramatic lifting-fog effects — just smooth brightness/saturation transitions

### Gameplay implications

Tight fog of war makes exploration a core gameplay loop:
- **Spreading your retinue** increases coverage but thins your forces
- **Investing in scrying/magic** provides remote visibility without physical risk
- **Trade routes and alliances** provide intelligence about distant regions (explored status)
- **The map is mostly dark** for most of the game — discovering what's over the next ridge IS the adventure

---

## Layer 15: Zoom-Level Rendering

The LOD (Level of Detail) system that governs what renders at each zoom tier. This consolidates all the per-layer zoom rules into one unified contract.

### Zoom Tiers (from Layer 2)

| Tier | Hex size | Visible hexes | Trigger |
|------|----------|---------------|---------|
| Hero-local | ~300px | ~20-30 | Default, closest zoom |
| Regional | ~100px | ~300 | One step out |
| Continental | ~30px | ~5,000 | Two steps out |
| Full world | ~10px | ~60,000 | Maximum zoom out |

### Unified Visibility Matrix

What renders at each zoom tier (assuming the hex is visible/explored — fog overrides everything):

| Render layer | Hero-local | Regional | Continental | Full world |
|-------------|-----------|----------|-------------|------------|
| **Hex fill** (terrain color) | Yes | Yes | Yes | Yes |
| **Coastline mask** | Yes | Yes | Simplified | Color only |
| **Hex grid lines** | Yes | Yes | Yes | Hidden |
| **Elevation edge ticks** | Yes | Yes | Hidden | Hidden |
| **River lines** | Yes | Yes | Major only | Hidden |
| **River labels** | Yes | Major only | Hidden | Hidden |
| **Roads** | Yes | Yes | Major only | Hidden |
| **Political borders (kingdom)** | Subtle (50% opacity) | Yes | Yes | Yes |
| **Political borders (barony)** | Subtle (50% opacity) | Yes | Yes | Hidden |
| **Terrain signifiers** | Full detail | Small, simplified | Hidden | Hidden |
| **Location icons** | Full detail | Major only | Capitals + cities only | Capitals as dots |
| **Location labels** | Full detail | Major only | Capitals + cities | Hidden |
| **Agent portraits** | Full (portrait + ring + name) | Colored dots | Retinue only (dots) | Hidden |
| **Agent movement animation** | Full bezier hop | Dot slide | Hidden | Hidden |
| **Event indicators** | Full icons | Small icons | Hidden | Hidden |
| **Activity indicators** | Below portrait | Hidden | Hidden | Hidden |
| **Region labels (kingdom)** | Current region only | Yes | Yes | Yes |
| **Region labels (barony)** | Yes | Yes | Yes | Hidden |
| **Geographic feature labels** | Yes | Large features only | Hidden | Hidden |
| **Altitude annotations** | Yes | Hidden | Hidden | Hidden |
| **Fog of war** | Dark (unexplored) or full color (explored/visible) | Same | Same | Same |

### Zoom Transition Behavior

- **Smooth interpolation**: as the camera zooms, elements don't pop in/out at hard thresholds. Instead, they fade in/out over a small zoom range around each threshold.
- **Fade range**: ~20% of the zoom range on either side of the threshold. An element that appears at regional zoom starts fading in when hex size reaches ~120px and is fully visible at ~100px.
- **Performance**: elements below their visibility threshold are not rendered at all (not just transparent). The fade is a brief transition window, not a permanent partial-opacity state.

Constants:
| Name | Default | Purpose |
|------|---------|---------|
| `ZOOM_HERO_LOCAL_THRESHOLD` | 200 | px per hex — above this = hero-local tier |
| `ZOOM_REGIONAL_THRESHOLD` | 60 | px per hex — above this = regional tier |
| `ZOOM_CONTINENTAL_THRESHOLD` | 20 | px per hex — above this = continental tier |
| `ZOOM_FADE_RANGE` | 0.2 | fraction of zoom range for fade transitions |
| `ZOOM_GRID_HIDE_THRESHOLD` | 12 | px per hex — below this, hide grid lines entirely |

### Camera Behavior

- **Default position**: centered on the player's primary retinue agent, hero-local zoom
- **Pan**: free pan via drag (d3-zoom style, adapted for Three.js orthographic camera)
- **Zoom**: scroll wheel or pinch, snapping toward the nearest tier center after release (optional — could also be free zoom)
- **Follow mode**: camera auto-follows the selected agent during movement. Can be toggled off for free exploration.
- **Jump-to**: clicking a notification or agent in the hex chronicle snaps the camera to that hex at hero-local zoom

### What makes this work at 60K hexes

The combination of fog culling (Layer 14) and zoom-level LOD means:
- At hero-local: ~20-30 hexes get full rendering. Of those, only ~5-15 are "visible" (full dynamic content). The rest are explored (static) or unexplored (solid fill).
- At continental: ~5,000 hexes visible on screen, but each only renders hex fill + maybe a location dot + political borders. No signifiers, no agents, no labels on most hexes.
- At full world: 60K hexes, but each is just a single colored quad. One instanced draw call.

The rendering cost scales with what the player can actually SEE and INTERACT WITH, not with world size.
