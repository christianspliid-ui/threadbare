# Phase 2: World Generation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

A seeded world generator produces organic continents with realistic climate zones, rivers, biome distribution, and culture-ready provinces. The generator takes a culture roster as input and prepares geographically distinct homeland provinces for each culture. Player-facing worldgen parameters are exposed as code-level inputs (UI deferred). The existing worldgen pipeline is replaced with a multi-pass architecture that produces continuous field functions (persisting for Phase 3 coastline rendering) and per-hex classified terrain.

</domain>

<decisions>
## Implementation Decisions

### Terminology hierarchy
- **Hex** — single tile (1 hex)
- **Region** — cluster of similar terrain, flood-fill detected (20-200 hexes)
- **Province** — group of related regions forming one cultural or wilderness zone (3-15 regions, 200-2000+ hexes)
- **World** — all provinces together (60K hexes)

A culture's province has internal structure:
- **Capital region** — 1 region, seat of power
- **Heartland regions** — surrounding capital, core territory
- **Borderland regions** — transition zones at edges, mixed biomes
- Beyond all provinces: **wilderness** (unclaimed hexes/regions)

### Province-first generation (top-down macro structure)
- Before detailed noise, seed provinces across the map — one per living culture, 3+ for lost cultures, remainder as pure wilderness
- Each province has a **terrain identity** driven by its assigned culture's biome preferences
- Province identity strength: ~70% dominant terrain family, ~30% natural inclusions (rivers, lakes, outcrops, clearings)
- Home region: ~70% preferred biomes
- Heartland: ~50% preferred biomes minimum
- Borderland: transition biomes based on neighboring province identities
- Wilderness provinces: anything the model produces, no culture bias
- Province placement considers climate logic (desert cultures near equator/rain shadows, forest cultures in temperate wet zones, etc.)

### Culture roster drives generation
- Culture roster determined BEFORE terrain generation (pseudo-random from content pool now, player-picked later)
- Every culture needs expanded biome data: 3 core/preferred biomes + up to 5 tolerated biomes
- Current `CultureIdentity.primaryBiome` (single TerrainType) must expand to `preferredBiomes: TerrainType[]` and `toleratedBiomes: TerrainType[]`
- Current `HistoricalCultureTemplate.biomePreference` (single optional TerrainType) needs same expansion
- Worldgen uses this data to flood-fill provinces with culture-appropriate terrain
- The map is generated KNOWING what cultures must be placed, preparing a homeland for each

### Lost culture provinces
- At least 3 provinces allocated to lost/dead cultures
- Lost culture provinces have the same structure (capital → heartland → borderlands) but everything is ruins and overgrowth
- Lost culture province sizes vary by seed — huge dead empires and small overrun baronies
- These provide exploration content in wilderness areas (ruins, echoes, things to find)
- Pure wilderness provinces (no culture, no lost culture) serve as expansion space or threat source

### Mountain range generation (ridge overlay)
- 3-5 ridge spines per world (default, player-tunable)
- Ridges have directional orientation (enabling rain shadows on the moisture pass)
- Ridges can fork/split (variety — some maps they do, some they don't, seed-driven)
- Ridge falloff curve produces 3-4 hex wide foothills transition band (lowland → hills → mountains → peaks)
- Falloff width is a named tunable constant
- Mountain passes via saddle detection (natural low points along ridges) + river-carved passes where rivers flow through mountain terrain

### Canyon generation
- **River-carved canyons** — rivers flowing through highland/plateau terrain carve elevation depressions along their path. Produces canyon-with-river features.
- **Dry rift canyons** — linear low-elevation gashes through high terrain, independent of rivers. Generated similar to ridges but inverted.
- Both types coexist. If one doesn't produce good results during iteration, it can be dropped.

### Coastline and island generation
- **High-frequency noise near sea level** — extra detail noise layer that only activates near the land/sea boundary. Produces fine inlets, peninsulas, bays, promontories.
- **Island chain generator** — explicit feature, not just noise artifacts. Generates archipelagos with varied island sizes. Islands large enough to host locations and terrain variety.
- **Larger islands get internal elevation variation** — mini-ridges, varied terrain within. Not flat single-biome blobs.
- **Peninsula/land bridge generator** — intentional long narrow land features, similar approach to ridge generation but for coastline geometry.
- **Bay/inland sea carver** — occasionally cuts deep inlets into coastlines, creating natural harbor geography.

### Terrain scale gradient (coast → inland)
- High-frequency noise near coasts → more terrain variety per hex, more settlement potential
- Low-frequency noise inland → vast wilderness biome patches
- Frontier/wilderness patches: 20-30 hexes across
- Heartland/settled patches: 3-8 hexes across
- Frontier terrain skews harsher (desert, tundra, mountains, dense jungle)
- Heartland terrain looks cultivated (grassland, woodland, temperate forest, hills, farmland)
- Tunable constants for all scale thresholds

### Climate system
- **Temperature:** latitude gradient + altitude penalty + noise (existing) + maritime moderation
- **Moisture:** prevailing wind direction + orographic effect (rain shadow from directional ridges) + coastal proximity + noise
- **Temperature reassessment after hydrology (moderate effect):**
  - Large lakes create 2-3 hex band of moderated temperature (can flip borderline biomes — e.g., boreal → temperate forest near a great lake)
  - Rivers make their hexes warmer + wetter, creating green strips through arid terrain (Dol-Anur effect — ~1 hex wide along river path)
- **Single biome classification pass** — runs AFTER all fields are finalized (post-hydrology, post-temperature reassessment)

### Biome classification and smoothing
- Whittaker-style classification from temperature × moisture × elevation (existing approach, enhanced)
- **Biome adjacency smoothing pass** — post-classification pass eliminates impossible adjacencies (desert next to jungle, tundra next to tropical). Replaces outlier hexes with valid transition biomes.

### Hydrology
- Existing river/lake/depression code integrated into the multi-pass pipeline
- **River delta generation** — rivers fan out near coast/lake entry points
- **Wetlands spawn specifically at river mouths and lake shores** — not just generic low+wet hexes
- Rivers flow from high elevation to sea, growing wider downstream
- Lakes form in depressions (existing depression filling system)
- Every land hex has drainage path to sea (existing guarantee)

### Player worldgen parameters
- Exposed as code-level params now (constants/function args), player-facing UI deferred to later phase
- **Predetermined templates** — selectable presets (e.g., "Continental", "Archipelago", "Landlocked")
- **Advanced mode** — individual parameters with descriptive dropdown values:
  - Height difference: flat / wavy / spiky
  - Temperature distribution: cold world / hot world / extreme difference
  - Land shape: continent / continents / islands / landlocked / archipelago
  - Mountain density: few / moderate / many
  - River density, culture count, etc.
- Parameters translate to named constants that the generator consumes

### Pipeline architecture
Follows the multi-pass design from `Docs/plans/2026-03-20-world-generation-v2-design.md`:
1. Determine culture roster (with expanded biome preferences)
2. Seed province centers (one per living culture + lost cultures + wilderness)
3. Assign biome identity to each province (matching culture preferences, climate-aware placement)
4. Generate elevation within provinces (ridge overlay, canyon carving, province-biased noise)
5. Generate coastline detail (high-frequency coastal noise, peninsulas, bays, island chains)
6. Generate climate fields (temperature, moisture — ridge-direction-aware rain shadows)
7. Hydrology (rivers, lakes, depression filling, deltas, wetland placement)
8. Temperature reassessment (lake effect, river valley moderation)
9. Biome classification (single pass after all fields finalized)
10. Adjacency smoothing + borderland transitions
11. Validation (determinism check, drainage guarantee, province coverage)

Each pass gets its own PRNG stream (per-pass seed offsets from design doc).

### Continuous field persistence
- The noise functions (elevation, temperature, moisture) plus overlay features (ridges, canyons) persist as callable functions after worldgen
- Phase 3 needs `sampleElevation(worldX, worldY): number` for sub-hex coastline rendering (marching squares)
- WorldGenData stores per-hex classified results AND exposes continuous sampling functions

### Claude's Discretion
- Exact noise parameters (scale, octaves, persistence, lacunarity) — tune to produce convincing terrain
- Ridge generation algorithm details (Voronoi boundaries, random walk, or other approach)
- Province flood-fill algorithm (weighted Voronoi, growth from seeds, or other)
- Exact falloff curves for ridges and canyons
- Island chain generation algorithm
- Peninsula/land bridge generation details
- Bay carving algorithm
- Delta fan-out implementation
- Biome adjacency rules (which transitions are "impossible")
- Province placement algorithm (how to spatially distribute culture homelands)
- Performance optimization approach for 60K hex generation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### World generation design
- `Docs/plans/2026-03-20-world-generation-v2-design.md` — Full 17-pass pipeline architecture, pass contracts, PRNG discipline, cosmology templates, settlement attractors, trade routes, historical culture traces, validation. Phase 2 implements Passes 0-4 (grid → continental → climate → biome → hydrology) with province-first approach.

### Existing worldgen code (to enhance/replace)
- `src/engine/forceField.ts` — Current elevation/temperature/moisture noise generation. Multi-octave simplex with named constants. Will be replaced by province-aware generation.
- `src/engine/terrain.ts` — Whittaker biome classification with ELEV/TEMP/MOIST threshold constants. Enhance with adjacency smoothing.
- `src/engine/worldGenData.ts` — WorldGenData typed-array pipeline, RiverPath interface, createWorldGenData factory. Extend with province data and continuous field functions.
- `src/engine/hexGrid.ts` — generateWorld() entry point. Will be replaced by new pipeline.
- `src/engine/riverGeneration.ts` — Steepest-descent river routing with forking, merging, coastal continuation. Integrate into pipeline, add delta generation.
- `src/engine/depressionLakes.ts` — Depression filling for drainage guarantee. Integrate into pipeline.
- `src/engine/lakeOutflow.ts` — Lake outflow river generation. Integrate into pipeline.

### Culture schema (to expand)
- `src/types/culture.ts` — CultureIdentity interface (has `primaryBiome: TerrainType` — needs expansion to preferred/tolerated arrays). CultureEdgeProperties, tunable constants.
- `src/data/culture-content.ts` — BiomeModifier interface, FoundationModifier, CreationSphereModifier. 22 terrain biome modifiers with traits/vocabulary. Need to add biome preference arrays per culture archetype.
- `src/data/historical-culture-content.ts` — HistoricalCultureTemplate (has `biomePreference?: TerrainType` — needs same expansion). 7 lost culture templates.

### Hex math (reuse)
- `src/lib/hexMath.ts` — Hex coordinate math (offset/cube conversion, hexToPixel, neighbors, distance). Fully reusable.
- `src/lib/prng.ts` — Mulberry32 seeded PRNG. Used throughout worldgen.

### Phase 1 renderer (integration target)
- `src/components/HexMapV2/` — Three.js renderer that displays worldgen output. Phase 2 output must produce HexTile[] compatible with the existing renderer's consumption pattern.
- `src/components/HexMapV2/palette/terrainPalette.ts` — 30-entry TERRAIN_PALETTE. New terrain subtypes may need palette entries.

### Project constraints
- `CLAUDE.md` — NFP priorities (tunability, inspectability, determinism, fail-soft), rejected approaches, viewport contract.
- `.planning/phases/01-renderer-foundation/01-CONTEXT.md` — Phase 1 decisions, established patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/forceField.ts`: fractalNoise() function, noise constant pattern. The function is reusable; the generation logic will be replaced by province-aware generation.
- `src/engine/terrain.ts`: classifyBiome() function and ELEV/TEMP/MOIST threshold constants. Reusable as-is, add adjacency smoothing on top.
- `src/engine/worldGenData.ts`: WorldGenData interface with typed arrays (Float32Array for fields, Uint8Array for flags). Extend with province arrays and continuous field references.
- `src/engine/riverGeneration.ts`: routeRiver() and full river routing system (~400 lines). Integrate into pipeline, add delta generation at river mouths.
- `src/engine/depressionLakes.ts` + `src/engine/lakeOutflow.ts`: Depression filling and lake outflow. Integrate into pipeline.
- `src/lib/prng.ts`: mulberry32() — seeded PRNG used throughout.
- `src/lib/hexMath.ts`: hexToPixel, hexNeighbors, hexDistance, offsetToCube — all hex coordinate math.

### Established Patterns
- Typed arrays for per-hex data (Float32Array for continuous, Uint8Array for boolean flags, Int16Array for IDs)
- Named tunable constants at module top (NFP #1)
- Per-pass PRNG streams via seed offsets
- `simplex-noise` library for noise generation (createNoise2D)
- Map<string, GeoParams> keyed by "col,row" for geo field lookup

### Integration Points
- `src/components/HexMapV2/HexMapV2.tsx` consumes HexTile[] from game state — Phase 2 output must produce compatible HexTile[]
- `src/components/HexMapV2/palette/colorUtils.ts` uses tile.terrain and tile.geoParams for rendering — these fields must remain
- `src/components/HexMapV2/interaction/HexTooltip.tsx` displays geoParams (elevation, temperature, moisture, hasRiver) — these must remain in output
- Game state flows through `src/engine/worldSeed.ts` → `generateWorld()` — new pipeline must slot in here

</code_context>

<specifics>
## Specific Ideas

- **Mystara reference quality bar** — The Mystara hex maps (provided as reference images) are the visual quality target. Coherent mountain spines with foothills, dramatic terrain transitions, vast wilderness with exploration content, settled areas with terrain patchwork, river valleys greening arid terrain, lake-effect zones, island chains with varied terrain.
- **"Larger than life" landscapes** — Grand canyons, enormous mountain ranges, gigantic forests in the wilderness. The world should feel dramatic and explorable.
- **Settled vs wild contrast** — The heartland should feel like civilization has shaped the land (variety, roads, passes). The wilderness should feel vast, dangerous, and unknown. Lost culture ruins provide discovery content in wild areas.
- **Culture homeland distinctiveness** — Each culture's province should be visually distinct on the map. A horse-rider steppe looks completely different from an elven forest homeland or a dwarven mountain province. No "everything is a similar mix" problem.
- **Lost culture storytelling** — "This desert was once a vibrant civilization, now desolate. This jungle was once filled with cities, now overgrown ruins." Lost culture provinces tell environmental stories.
- **River as life-giver** — Rivers should visibly make terrain more hospitable (Dol-Anur reference: green strip through yellow steppe). Settlements cluster near rivers and coasts.

</specifics>

<deferred>
## Deferred Ideas

- **Fantasy overlay pass (WGEN-14)** — Converts base biomes to magical variants based on sphere alignment. B+C hybrid: individual magical hexes (modifier layer) in heartland/central regions, full magical regions in borderlands/wilderness. Rare (5-10%). Player expands through gameplay. Gameplay-affecting (spawns locations, encounters, resources). Deferred until cosmology + culture systems are ready.
- **Player-facing worldgen UI** — Templates + advanced mode with dropdown sliders. Phase 2 exposes params as code-level inputs only.
- **Cosmology-driven continental templates** — Design doc's sphere-based template modifiers (Force = jagged, Matter = massive, etc.). Replaced by player-facing params for now; cosmology influence may return as a separate concern.
- **Settlement placement (Pass 9+)** — Geographic attractor model from design doc. Separate from terrain generation.
- **Trade routes, population seeding, faction generation** — Later passes in the design doc pipeline.
- **Cultural terrain modification** — Agrarian cultures clearing forests to farmland, etc. Post-settlement pass.
- **Player culture picker UI** — Manual culture selection. Start with pseudo-random, build picker later.

</deferred>

---

*Phase: 02-world-generation*
*Context gathered: 2026-03-21*
