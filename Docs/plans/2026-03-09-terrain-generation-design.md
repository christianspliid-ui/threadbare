# Terrain Generation Upgrade — Multi-Pass Geological Simulation

**Date:** 2026-03-09
**Status:** Approved design, pending implementation

## Problem

Current terrain generation uses 3 independent Perlin noise fields on a 20×15 grid (300 hexes) with a Whittaker-style biome lookup. This produces:
- Random terrain confetti — no spatial coherence (swamps inland, isolated hills)
- Mountains as random blobs, not linear ranges
- No rivers (type exists but never generated)
- No rain shadow or climate simulation
- No multi-hex lakes
- Only 27 of 34 available terrain types used (7 reserve tiles unused)
- No geographic region naming (mountain ranges, forests, rivers are unnamed)

## Solution

Replace the single-pass noise approach with an **8-pass geological simulation pipeline** on a **60×45 grid (~2,700 hexes)** producing **40 terrain types** with named geographic regions.

## Decisions

### Decision 1: Grid Size — 60×45 (~2,700 hexes)
- **Why:** 4× current area provides enough space for realistic continent shapes, mountain ranges, and river systems
- **Rejected:** 40×30 (too small for meaningful rain shadow), 80×60 (performance risk with 6,400 hexes)

### Decision 2: Multi-Pass Geological Simulation (Approach A)
- **Why:** Each pass builds on previous pass output, producing causally coherent terrain (mountains → elevation falloff → temperature → moisture → rain shadow → rivers → biomes)
- **Rejected:** Template+Noise hybrid (less realistic), Enhanced current system (still noise-driven, can't produce linear mountain ranges or rain shadow)

### Decision 3: Rivers as Overlay Traits, Not Terrain Types
- **Why:** Rivers cross grassland, forest, hills etc. — they're a property of a hex, not a replacement for its terrain. Rendered as SVG overlay path like the reference map.
- **Rejected:** River terrain type (loses underlying biome), river as edge between hexes (doesn't render well)

### Decision 4: Lake-Specific Coastline Parameters
- **Why:** Small lakes (1-5 hexes) with standard ocean coastline params would be all shore and no water. Separate coastline pipeline invocation with reduced blobRadius (0.6×) and no shallows layer.
- **Impact on coastline.ts:** Zero code changes — `computeCoastline` already accepts config params. Caller passes different config for lake hexes.

### Decision 5: 40 Terrain Types (27 active + 7 reserve + 6 new)
- **Why:** Reference legend analysis identified 6 clear gaps: moor_bog, dead_forest, oasis, glacier, reef, mountain_pass. Each fills a distinct visual and gameplay niche.
- **Rejected additions:** Fen (too similar to marsh), mud_flats (coast covers this), caves/geyser/maelstrom (better as location overlays)

### Decision 6: Region Naming via Flood-Fill Cluster Detection
- **Why:** Named geographic features (mountain ranges, forests, rivers, lakes) add narrative weight and are essential for culture territory claims
- **Implementation:** Post-biome flood-fill of related hex types → Region graph nodes with `contains` edges → seeded name generation from fragment pools

### Decision 7: Preserve Existing Coastline System
- **Why:** The organic coastline rendering (metaball scalar field → marching squares → chaikin smoothing → simplex displacement) already produces excellent results. Rivers and lakes must integrate without breaking it.
- **How:** Rivers are SVG overlay paths (no coastline interaction). Lakes use `isWaterTerrain` (already includes 'lake') so they automatically get coastline treatment with tighter params.

## 8-Pass Pipeline

### Pass 1: Ocean Mask
- Place 2-4 continent seed points via seeded PRNG
- Each seed emits a Perlin-warped distance field
- Union of fields → land/ocean classification
- Target: 55-65% land coverage
- Constants: `CONTINENT_COUNT_MIN`, `CONTINENT_COUNT_MAX`, `LAND_COVERAGE_TARGET`, `CONTINENT_WARP_SCALE`

### Pass 2: Tectonics
- Generate 1-3 random Bezier curves across continent area (tectonic fault lines)
- Hexes within `FAULT_WIDTH` of a curve become mountain candidates
- Fault lines determine mountain range orientation (linear spines, not noise blobs)
- Constants: `FAULT_COUNT_MIN`, `FAULT_COUNT_MAX`, `FAULT_WIDTH`, `FAULT_CURVATURE`

### Pass 3: Elevation
- Mountain spine hexes get max elevation
- Propagate elevation outward with distance falloff: `elevation = base × (1 - distance / falloff)^power`
- Hills band: 3-6 hexes from mountains
- Foothills: 6-10 hexes
- Elevation basins: low points far from mountains (future lake candidates)
- Plateaus: elevated flat areas from secondary noise
- Constants: `ELEVATION_FALLOFF_DISTANCE`, `ELEVATION_FALLOFF_POWER`, `HILLS_BAND_MIN/MAX`, `PLATEAU_NOISE_SCALE`, `BASIN_DEPTH`

### Pass 4: Temperature
- Base: latitude gradient (hot at equator/bottom, cold at top)
- Altitude modifier: -6°C per 1000m equivalent (higher elevation = colder)
- Cosmology modifier: Foundation sphere bias shifts temperature bands ±10%
- Constants: `LATITUDE_TEMP_RANGE`, `ALTITUDE_TEMP_RATE`, `COSMOLOGY_TEMP_BIAS`

### Pass 5: Moisture
- Base: Perlin noise field for regional variation
- Rain shadow: choose prevailing wind direction per world (seeded from 8 cardinals)
- For each hex, trace wind direction — if path crosses mountains, reduce moisture on leeward side
- Coastal moisture bonus: hexes near ocean get +moisture
- Constants: `MOISTURE_NOISE_SCALE`, `RAIN_SHADOW_STRENGTH`, `COASTAL_MOISTURE_BONUS`, `COASTAL_MOISTURE_RANGE`

### Pass 6: Rivers & Lakes

**Rivers:**
- Find N highest-elevation land hexes as river sources (seeded selection)
- From each source, route river via steepest-descent neighbor selection
- River terminates when reaching ocean or lake
- Each traversed hex gets `hasRiver: true` trait
- River rendered as SVG overlay path (like coastline overlay)
- Constants: `RIVER_SOURCE_COUNT`, `RIVER_MIN_LENGTH`, `RIVER_SOURCE_ELEVATION_THRESHOLD`

**Lakes:**
- Identify elevation basins (local minima surrounded by higher terrain)
- Flood-fill from basin center up to pour point
- Size cap: 1-5 hexes for normal lakes, max 1 "great lake" of 6-12 hexes per world
- Lake hexes get terrain type `lake`
- Coastline pipeline runs separately for lakes with tighter params: `blobRadius × 0.6`, `shallowWidth: 0`
- Constants: `LAKE_SIZE_MIN`, `LAKE_SIZE_MAX`, `GREAT_LAKE_SIZE_MAX`, `GREAT_LAKE_COUNT`, `LAKE_BLOB_RADIUS_FACTOR`

### Pass 7: Biome Classification

Enhanced Whittaker-style lookup using elevation + temperature + moisture + proximity rules.

**40 terrain types:**

*Existing 27 (active):*
ocean, coastal_shallows, deep_ocean, lake, river, grassland, savanna, steppe, desert, rocky_desert, sand_dunes, tundra, arctic, dense_forest, temperate_forest, tropical_forest, boreal_forest, jungle, hills, forested_hills, mountains, high_mountains, plateau, badlands, swamp, floodplain, farmland

*7 reserve (activating):*
coast, evergreen_forest, light_forest, marsh, snow_fields, tropical_ocean, volcano

*6 new:*
- **moor_bog** — mid-elevation + high moisture + cool temp, highland wetland
- **dead_forest** — rare, near volcanic activity or doom corruption zones
- **oasis** — rare in desert zones, low elevation pockets within desert
- **glacier** — high mountains + arctic temperature band
- **reef** — adjacent to coast tiles, warm-temperate water only
- **mountain_pass** — between mountain hexes, lower elevation saddle points

**Proximity clustering rules (post-classification pass):**
- Swamp/marsh only within 3 hexes of water (ocean, lake, river)
- Light_forest on edges of dense_forest clusters
- Farmland within 4 hexes of settlements
- Volcano only in high_mountains, max 1-2 per world
- Oasis only surrounded by desert, max 2-3 per world
- Reef only adjacent to coast, warm water
- Mountain_pass requires mountains on at least 2 sides

### Pass 8: Geographic Regions & Naming

**Detection:** Flood-fill contiguous same-type or related-type hexes.

| Feature | Hex types | Min size | Name pattern |
|---------|-----------|----------|-------------|
| Mountain Range | mountains, high_mountains, glacier, volcano | 3 | "The [Adj] [Noun] Mountains" |
| Hill Country | hills, forested_hills, moor_bog | 4 | "[Adj] [Noun] Hills" |
| Forest | all 7 forest types + jungle | 5 | "The [Noun] Forest" / "[Adj]wood" |
| Plains | grassland, savanna, steppe, farmland | 6 | "The [Adj] [Noun] Plains" |
| Desert | desert, rocky_desert, sand_dunes, badlands | 4 | "The [Noun] Desert" / "[Adj] Wastes" |
| Wetland | swamp, marsh, moor_bog, floodplain | 3 | "The [Noun] Marshes" |
| Tundra | tundra, arctic, snow_fields, glacier | 4 | "The [Adj] Wastes" |
| River | contiguous hasRiver hexes | 5 | "The [Noun] River" |
| Lake | contiguous lake hexes | 1 | "Lake [Noun]" |
| Sea/Ocean | ocean, deep_ocean, tropical_ocean | — | "The [Adj] Sea" |

**Implementation:**
- Each cluster → Region node in world graph with `contains` edges to hexes
- Name fragments in `region-content.ts` data package
- Seeded PRNG selection, collision retry for uniqueness
- Mountain passes always individually named
- Rivers named end-to-end (source to mouth), not per-hex

## Art Pipeline

**13 hex tile assets needed:**

7 reserve tiles already have art on disk — activate in `hex-tile-assets.ts` TERRAIN_TILE_MAP.

6 new tiles need generation via `generate-hex-tile.py`:
- Add BIOME_REGISTRY entries for: moor_bog, dead_forest, oasis, glacier, reef, mountain_pass
- Run `npm run generate-hex:terrain` batch generation
- Art follows STYLE.md Threadbare aesthetic
- Hex masking applied automatically by pipeline

**River rendering:**
- New SVG overlay component (similar to CoastlineOverlay)
- Draws river paths as curved SVG polylines through hex centers
- River width scales with hex size (thin at source, wider downstream)

## Testing Strategy

**Map gallery approach:**
1. Generate 20 worlds from seeds 1-20
2. Save JSON snapshot + visual inspection per seed
3. Automated sanity assertions:
   - Land coverage 50-70%
   - At least 1 river per continent
   - No isolated single-hex mountains (must be cluster ≥2)
   - Mountains form elongated shapes (aspect ratio check)
   - Temperature decreases with latitude and altitude
   - Rain shadow visible (moisture asymmetry across mountain ranges)
   - No terrain type entirely absent across 20 seeds
   - Lakes ≤5 hexes (except max 1 great lake ≤12)
4. Tune constants until all 20 seeds pass visual inspection
5. Performance: full pipeline must complete in <2 seconds for 60×45 grid

## Integration Notes

- **Coastline system:** Zero changes to `coastline.ts`. Two separate `computeCoastline` calls — one for ocean hexes (current params), one for lake hexes (tighter params).
- **Fog of war:** Works unchanged — visibility operates on hex coordinates regardless of terrain type.
- **Culture territories:** Post-generation, cultures claim contiguous regions via existing `belongs_to` edges. Region naming provides the geographic vocabulary.
- **World graph:** New Region nodes + contains edges. HexTile gains `hasRiver`, `regionId` fields.
- **Determinism:** All passes use seeded PRNG. Same seed = identical world.
