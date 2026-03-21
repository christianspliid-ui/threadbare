# Requirements: Hex Map V2

**Defined:** 2026-03-21
**Core Value:** Beautiful, readable, performant hex map at 60K hexes — the player's window into the world.

## v1 Requirements

Requirements for the Hex Map V2 milestone. Each maps to roadmap phases.

### Renderer (RNDR)

- [ ] **RNDR-01**: Three.js orthographic camera renders a 200x300 hex grid (60K hexes) at 60fps
- [x] **RNDR-02**: Hex fills use InstancedMesh with per-instance color attributes (one draw call for all hex fills) ✅ 01-01
- [x] **RNDR-03**: Frustum culling skips off-screen hexes from all render passes ✅ 01-02
- [x] **RNDR-04**: Camera supports pan (drag), zoom (scroll/pinch), and jump-to (click notification -> snap to hex) ✅ 01-02
- [x] **RNDR-05**: HTML overlay tooltips positioned via Three.js project() (world -> screen coords) ✅ 01-02
- [x] **RNDR-06**: 13-layer render order implemented (hex fill -> coastline -> grid -> ticks -> rivers -> roads -> borders -> signifiers -> locations -> agents -> events -> labels -> fog) ✅ 01-01

### World Generation (WGEN)

- [x] **WGEN-01**: Multi-octave simplex noise produces continuous heightmap function from world seed
- [x] **WGEN-02**: Sea level threshold classifies land vs ocean from continuous heightmap
- [ ] **WGEN-03**: Latitude-based temperature function with elevation cooling and maritime moderation
- [ ] **WGEN-04**: Precipitation/moisture function with prevailing wind, orographic effect (rain shadow), and temperature influence
- [ ] **WGEN-05**: River generation via flow accumulation on hex grid — precipitation-driven sources, steepest-descent routing, lake formation in depressions
- [ ] **WGEN-06**: Temperature reassessment pass incorporating lake effect and river valley cooling
- [x] **WGEN-07**: Hex grid overlay samples all continuous fields at 7 points per hex (center + 6 corners)
- [ ] **WGEN-08**: Whittaker diagram maps temperature x moisture to one of 27 base terrain types
- [ ] **WGEN-09**: Elevation overrides assign highland types (hills, mountains, plateau, mountain_pass) based on elevation thresholds
- [ ] **WGEN-10**: Wetland overrides assign marsh/swamp/moor_bog/floodplain based on low elevation + high moisture
- [ ] **WGEN-11**: Desert sub-type selection (sand_desert, sand_dunes, rocky_desert, hardened_clay, badlands) from local noise
- [ ] **WGEN-12**: Drainage guarantee pass ensures every land hex has downhill path to sea
- [ ] **WGEN-13**: Volcanic hex placement via hotspot noise (rare)
- [ ] **WGEN-14**: Fantasy overlay pass converts base biomes to magical variants based on sphere alignment

### Coastline & Water (WATR)

- [ ] **WATR-01**: Coastal hexes retain inland biome — coastline rendered as mask, not terrain type
- [ ] **WATR-02**: Marching-squares interpolation within coastal hexes produces organic shoreline from 7-point samples
- [ ] **WATR-03**: Water depth bands render as shallows / mid-ocean / deep-ocean based on elevation below sea level
- [ ] **WATR-04**: Rivers rendered as curved blue overlay lines through hexes (entry edge -> exit edge), not as terrain type
- [ ] **WATR-05**: River width proportional to flow accumulation (thin streams near source, wide near coast)
- [ ] **WATR-06**: Lakes rendered as filled hex regions where drainage pass filled depressions

### Terrain Types & Palette (TERR)

- [x] **TERR-01**: Type system defines exactly 27 base terrain types (lowland 4, forest 5, wet 3, highland 6, desert 5, cold 3, volcanic 2, special 2) ✅ 01-01
- [x] **TERR-02**: Tait-derived hex color palette maps each terrain type to a distinct, readable hex color ✅ 01-01
- [x] **TERR-03**: Water palette (shallows, ocean, deep_ocean, lake, river) separate from terrain palette ✅ 01-01
- [x] **TERR-04**: Hard terrain transitions at hex boundaries — no blending, no gradients between adjacent types ✅ 01-01
- [x] **TERR-05**: Optional per-hex brightness noise (+/-5%) to break up large uniform regions ✅ 01-01

### Regions (REGN)

- [ ] **REGN-01**: Geographic regions auto-detected by flood-fill of similar terrain, bounded by natural features (mountains, rivers, coastline)
- [ ] **REGN-02**: Border cost field assigns weights to hex edges based on terrain difference, elevation change, rivers, mountains
- [ ] **REGN-03**: Watershed segmentation from seed points with size capping (20-200 hexes per geographic region)
- [ ] **REGN-04**: Political regions group geographic regions under factions, defined by travel-time from capital
- [ ] **REGN-05**: Political borders rendered as red polylines along hex edges (3px kingdom, 1.5px barony)
- [ ] **REGN-06**: Geographic features have NO border lines — text labels only
- [ ] **REGN-07**: Region labels placed at centroids with hierarchy: kingdom (bold all-caps), barony (title case), geographic (italic)
- [ ] **REGN-08**: Label collision detection prevents overlapping labels
- [ ] **REGN-09**: Capital markers rendered as red dots/icons at political region seats of power

### Elevation Visual Language (ELEV)

- [ ] **ELEV-01**: Terrain color passively communicates elevation (browns/golds = elevated, greens = low)
- [ ] **ELEV-02**: Edge tick marks ("caterpillar" marks) on hex edges where elevation difference exceeds threshold
- [ ] **ELEV-03**: Tick density scales with steepness (3-8 ticks per edge)
- [ ] **ELEV-04**: Altitude text labels on named peaks and notable elevations (hero-local + regional zoom only)

### Landscape Signifiers (LSIG)

- [ ] **LSIG-01**: Each of 27 terrain types has 2-5 SVG signifier variants (dark silhouette icons)
- [ ] **LSIG-02**: Signifier variant selected deterministically per hex (seeded by hex coordinates)
- [ ] **LSIG-03**: Signifiers rendered with slight position jitter (+/-10%) and rotation (+/-15deg) for organic feel
- [ ] **LSIG-04**: Signifier size scales with hex render size (hidden below regional zoom threshold)
- [ ] **LSIG-05**: All signifiers share consistent stroke weight, detail level, and color treatment (stylistic unity)

### Landscape Signifier Content (LART)

- [ ] **LART-01**: SVG signifier set for grassland (3 variants: clean, light tufts, wildflowers)
- [ ] **LART-02**: SVG signifier set for savanna (3 variants: single tree, two trees, dry grass)
- [ ] **LART-03**: SVG signifier set for steppe (3 variants: scrub, bent grass, bare)
- [ ] **LART-04**: SVG signifier set for floodplain (2 variants: dry, wet-season marks)
- [ ] **LART-05**: SVG signifier set for woodland (4 variants: 2-tree, 3-tree, single large, mixed)
- [ ] **LART-06**: SVG signifier set for temperate_forest (4 variants: tight cluster, mixed sizes, clearing, full canopy)
- [ ] **LART-07**: SVG signifier set for dense_forest (3 variants: solid canopy, deep shade, ancient trunks)
- [ ] **LART-08**: SVG signifier set for boreal_forest (4 variants: tight conifers, mixed height, snow-dusted, sparse)
- [ ] **LART-09**: SVG signifier set for tropical_forest (3 variants: dense canopy, palms mixed, vine-draped)
- [ ] **LART-10**: SVG signifier set for marsh (3 variants: reeds, water lines, mixed)
- [ ] **LART-11**: SVG signifier set for swamp (3 variants: standing water, dead trees, dense reeds)
- [ ] **LART-12**: SVG signifier set for moor_bog (3 variants: heather, peat, sparse scrub)
- [ ] **LART-13**: SVG signifier set for hills (4 variants: single hill, double hill, rolling, steep)
- [ ] **LART-14**: SVG signifier set for forested_hills (3 variants: deciduous-topped, conifer-topped, mixed)
- [ ] **LART-15**: SVG signifier set for mountains (4 variants: single peak, double peak, ridge, cliff face)
- [ ] **LART-16**: SVG signifier set for high_mountains (3 variants: snow peak, twin peaks, massive single)
- [ ] **LART-17**: SVG signifier set for plateau (3 variants: mesa, cliff edge, stepped)
- [ ] **LART-18**: SVG signifier set for mountain_pass (2 variants: narrow pass, broad saddle)
- [ ] **LART-19**: SVG signifier set for sand_desert (3 variants: clean, wind ripples, scattered dots)
- [ ] **LART-20**: SVG signifier set for sand_dunes (3 variants: rolling dunes, crescent, tall dune)
- [ ] **LART-21**: SVG signifier set for rocky_desert (3 variants: scattered rocks, rock pile, flat rocks)
- [ ] **LART-22**: SVG signifier set for hardened_clay (2 variants: fine cracks, deep cracks)
- [ ] **LART-23**: SVG signifier set for badlands (3 variants: spires, layered, eroded pillars)
- [ ] **LART-24**: SVG signifier set for tundra (3 variants: lichen, scrub, bare)
- [ ] **LART-25**: SVG signifier set for snow_fields (2 variants: clean, drift patterns)
- [ ] **LART-26**: SVG signifier set for glacier (2 variants: crevassed, smooth)
- [ ] **LART-27**: SVG signifier set for volcanic (3 variants: active crater, dormant, vent)
- [ ] **LART-28**: SVG signifier set for lava (2 variants: fresh flow, cooling)
- [ ] **LART-29**: SVG signifier set for broken_lands (2 variants: cracked, rubble)
- [ ] **LART-30**: SVG signifier set for dead_forest (3 variants: standing dead, fallen, charred)

### Location Signifiers (LOCI)

- [ ] **LOCI-01**: Location icons rendered as black silhouettes on hex via composition system slots
- [ ] **LOCI-02**: Location icon catalog covers: capital, city, town, hamlet, castle, fort, tower, temple, shrine, ruins variants, mining, camp, battleground, unexplored_poi
- [ ] **LOCI-03**: Location name labels rendered below icons with font size scaling by importance
- [ ] **LOCI-04**: Black text with white halo for readability against all terrain colors
- [ ] **LOCI-05**: Capital markers rendered with red ring/dot per political hierarchy

### Location Icon Content (LIART)

- [ ] **LIART-01**: SVG icon for capital (large castle with banner)
- [ ] **LIART-02**: SVG icon for city (castle/walled town silhouette)
- [ ] **LIART-03**: SVG icon for town (building cluster with spire)
- [ ] **LIART-04**: SVG icon for hamlet (small house cluster)
- [ ] **LIART-05**: SVG icon for castle (fortified tower with crenellations)
- [ ] **LIART-06**: SVG icon for fort (square fortification)
- [ ] **LIART-07**: SVG icon for tower (single tall tower)
- [ ] **LIART-08**: SVG icon for temple (domed/spired building)
- [ ] **LIART-09**: SVG icon for shrine (small arch or standing stone)
- [ ] **LIART-10**: SVG icon for ruins (broken building)
- [ ] **LIART-11**: SVG icon for ruined_city (broken castle)
- [ ] **LIART-12**: SVG icon for ruined_tower (broken tower)
- [ ] **LIART-13**: SVG icon for ruined_village (broken houses)
- [ ] **LIART-14**: SVG icon for mining (pick/mine entrance)
- [ ] **LIART-15**: SVG icon for camp (tent silhouette)
- [ ] **LIART-16**: SVG icon for battleground (crossed swords)
- [ ] **LIART-17**: SVG icon for unexplored_poi (question mark / generic marker)

### Hex Composition System (COMP)

- [ ] **COMP-01**: Slot-based layout system (CENTER, N, NE, SE, S, SW, NW, FILL, RING) assigns visual entities to hex positions
- [ ] **COMP-02**: HexVisualManifest interface defines preferredSlot, footprint, suppression rules, zoom visibility, priority, fallbacks per entity type
- [ ] **COMP-03**: Composition resolver collects entities per hex, sorts by priority, assigns slots, evaluates suppression
- [ ] **COMP-04**: Major locations suppress terrain signifiers when occupying the same hex
- [ ] **COMP-05**: Agent RING layout distributes agents around hex edge, sorted by ID for stable positions

### Agents & Icons (AGNT)

- [ ] **AGNT-01**: Agent portraits rendered as circular thumbnails with colored status ring at hero-local zoom
- [ ] **AGNT-02**: Agents rendered as colored faction-color dots at regional zoom with count badge if >4 per hex
- [ ] **AGNT-03**: Agents hidden at continental and full-world zoom (retinue only at continental as tiny dots)
- [ ] **AGNT-04**: Faction heraldic colors are saturated/bright, distinct from terrain palette (red, blue, purple, magenta, cyan, orange)
- [ ] **AGNT-05**: Retinue agents use fixed gold/white border for instant recognition
- [ ] **AGNT-06**: Movement animation: bezier hop from source to destination hex (~800ms), 150ms settle
- [ ] **AGNT-07**: Activity indicator icons below agent (boot=moving, swords=fighting, hourglass=idle, coin=trading, hammer=building, bandage=injured)
- [ ] **AGNT-08**: Event indicators on hexes (battle, construction, divine intervention, corruption, trade route)

### Fog of War (FOG)

- [ ] **FOG-01**: Unexplored hexes render as solid dark fill only — no terrain, signifiers, icons, or grid lines
- [ ] **FOG-02**: Explored hexes render at full color with all static layers (terrain, signifiers, locations, labels) — NO agents or events
- [ ] **FOG-03**: Visible hexes (occupied by retinue agent) render everything including dynamic content (agents, events, activity)
- [ ] **FOG-04**: Default sight range = 0 (own hex only). Elevated positions add +1. Magic/scrying adds variable range.
- [ ] **FOG-05**: Fog implemented as per-hex culling (skip expensive render layers), not post-process overlay
- [ ] **FOG-06**: Reveal animation: unexplored->explored fade-in ~300ms, visible->explored dim-out ~500ms

### Zoom LOD (ZOOM)

- [ ] **ZOOM-01**: Four zoom tiers: hero-local (~300px/hex), regional (~100px), continental (~30px), full-world (~10px)
- [ ] **ZOOM-02**: Unified visibility matrix controls which render layers appear at each zoom tier
- [ ] **ZOOM-03**: Smooth fade transitions between zoom tiers (~20% overlap range, no hard pop-in/out)
- [ ] **ZOOM-04**: Elements below visibility threshold are not rendered (not just transparent) — performance skip
- [ ] **ZOOM-05**: Default camera position: centered on player's primary retinue agent, hero-local zoom
- [ ] **ZOOM-06**: Follow mode: camera auto-follows selected agent during movement (toggleable)

### Borders & Grid (GRID)

- [ ] **GRID-01**: Thin hex grid lines (0.5-1px, ~12% opacity black) at all zoom levels except full-world
- [ ] **GRID-02**: River labels (blue italic) along major rivers at regional zoom
- [ ] **GRID-03**: Road network connecting settlements via pathfinding (solid for major, dotted for trails)
- [ ] **GRID-04**: Bridge icons where roads cross rivers

### Integration (INTG)

- [ ] **INTG-01**: New hex map replaces current SVG hex map in GameView
- [ ] **INTG-02**: Hex click events wire to existing hex chronicle, location view, and agent interaction systems
- [ ] **INTG-03**: Existing game state (agents, locations, encounters) renders on new map without engine changes
- [ ] **INTG-04**: Debug panel fog-of-war toggle works with new renderer
- [ ] **INTG-05**: URL params (?view=game, ?fog) work with new map
- [ ] **INTG-06**: All existing tests pass after integration

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Dynamic Borders

- **DBRD-01**: Political border geometry changes in response to conquest, diplomacy, or faction collapse
- **DBRD-02**: Region splitting and merging when control shifts

### Fantasy Terrain

- **FANT-01**: Enchanted forest, crystal caves, shadow marshes as runtime terrain transformations
- **FANT-02**: Corruption spreading visual (dark wisps on newly affected hexes)
- **FANT-03**: Hex remembers baseTerrain for recovery when overlay condition ends

### Advanced Roads

- **ROAD-01**: Shipping lanes across water
- **ROAD-02**: Road degradation over time without maintenance

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D perspective camera / WebGL 3D | Rejected 2026-03-21. 2D orthographic only. |
| Animated terrain (swaying grass, flowing water) | Performance budget. No continuous terrain animation. |
| Terrain blending between hex types | Hard edges per Tait style. Readability at small sizes. |
| React Three Fiber | Direct Three.js for full control at 60K hexes. |
| Voronoi/irregular cells | Engine built on hex coordinates. Organic feel from sub-hex rendering. |
| Hillshade / color gradients for elevation | Tait style uses signifiers + edge ticks, not shading. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RNDR-01 | Phase 1 | Pending (partial: renderer built, 60fps verified in Plan 02) |
| RNDR-02 | Phase 1 | Complete ✅ 01-01 |
| RNDR-03 | Phase 1 | Complete ✅ 01-02 |
| RNDR-04 | Phase 1 | Complete ✅ 01-02 |
| RNDR-05 | Phase 1 | Complete ✅ 01-02 |
| RNDR-06 | Phase 1 | Complete ✅ 01-01 |
| TERR-01 | Phase 1 | Complete ✅ 01-01 |
| TERR-02 | Phase 1 | Complete ✅ 01-01 |
| TERR-03 | Phase 1 | Complete ✅ 01-01 |
| TERR-04 | Phase 1 | Complete ✅ 01-01 |
| TERR-05 | Phase 1 | Complete ✅ 01-01 |
| WGEN-01 | Phase 2 | Complete |
| WGEN-02 | Phase 2 | Complete |
| WGEN-03 | Phase 2 | Pending |
| WGEN-04 | Phase 2 | Pending |
| WGEN-05 | Phase 2 | Pending |
| WGEN-06 | Phase 2 | Pending |
| WGEN-07 | Phase 2 | Complete |
| WGEN-08 | Phase 2 | Pending |
| WGEN-09 | Phase 2 | Pending |
| WGEN-10 | Phase 2 | Pending |
| WGEN-11 | Phase 2 | Pending |
| WGEN-12 | Phase 2 | Pending |
| WGEN-13 | Phase 2 | Pending |
| WATR-01 | Phase 3 | Pending |
| WATR-02 | Phase 3 | Pending |
| WATR-03 | Phase 3 | Pending |
| WATR-04 | Phase 3 | Pending |
| WATR-05 | Phase 3 | Pending |
| WATR-06 | Phase 3 | Pending |
| ELEV-01 | Phase 3 | Pending |
| ELEV-02 | Phase 3 | Pending |
| ELEV-03 | Phase 3 | Pending |
| ELEV-04 | Phase 3 | Pending |
| GRID-01 | Phase 3 | Pending |
| REGN-01 | Phase 4 | Pending |
| REGN-02 | Phase 4 | Pending |
| REGN-03 | Phase 4 | Pending |
| REGN-04 | Phase 4 | Pending |
| REGN-05 | Phase 4 | Pending |
| REGN-06 | Phase 4 | Pending |
| REGN-07 | Phase 4 | Pending |
| REGN-08 | Phase 4 | Pending |
| REGN-09 | Phase 4 | Pending |
| GRID-02 | Phase 4 | Pending |
| COMP-01 | Phase 5 | Pending |
| COMP-02 | Phase 5 | Pending |
| COMP-03 | Phase 5 | Pending |
| COMP-04 | Phase 5 | Pending |
| LSIG-01 | Phase 5 | Pending |
| LSIG-02 | Phase 5 | Pending |
| LSIG-03 | Phase 5 | Pending |
| LSIG-04 | Phase 5 | Pending |
| LSIG-05 | Phase 5 | Pending |
| LART-01 | Phase 5 | Pending |
| LART-02 | Phase 5 | Pending |
| LART-03 | Phase 5 | Pending |
| LART-04 | Phase 5 | Pending |
| LART-05 | Phase 5 | Pending |
| LART-06 | Phase 5 | Pending |
| LART-07 | Phase 5 | Pending |
| LART-08 | Phase 5 | Pending |
| LART-09 | Phase 5 | Pending |
| LART-10 | Phase 5 | Pending |
| LART-11 | Phase 5 | Pending |
| LART-12 | Phase 5 | Pending |
| LART-13 | Phase 5 | Pending |
| LART-14 | Phase 5 | Pending |
| LART-15 | Phase 5 | Pending |
| LART-16 | Phase 5 | Pending |
| LART-17 | Phase 5 | Pending |
| LART-18 | Phase 5 | Pending |
| LART-19 | Phase 5 | Pending |
| LART-20 | Phase 5 | Pending |
| LART-21 | Phase 5 | Pending |
| LART-22 | Phase 5 | Pending |
| LART-23 | Phase 5 | Pending |
| LART-24 | Phase 5 | Pending |
| LART-25 | Phase 5 | Pending |
| LART-26 | Phase 5 | Pending |
| LART-27 | Phase 5 | Pending |
| LART-28 | Phase 5 | Pending |
| LART-29 | Phase 5 | Pending |
| LART-30 | Phase 5 | Pending |
| LOCI-01 | Phase 6 | Pending |
| LOCI-02 | Phase 6 | Pending |
| LOCI-03 | Phase 6 | Pending |
| LOCI-04 | Phase 6 | Pending |
| LOCI-05 | Phase 6 | Pending |
| LIART-01 | Phase 6 | Pending |
| LIART-02 | Phase 6 | Pending |
| LIART-03 | Phase 6 | Pending |
| LIART-04 | Phase 6 | Pending |
| LIART-05 | Phase 6 | Pending |
| LIART-06 | Phase 6 | Pending |
| LIART-07 | Phase 6 | Pending |
| LIART-08 | Phase 6 | Pending |
| LIART-09 | Phase 6 | Pending |
| LIART-10 | Phase 6 | Pending |
| LIART-11 | Phase 6 | Pending |
| LIART-12 | Phase 6 | Pending |
| LIART-13 | Phase 6 | Pending |
| LIART-14 | Phase 6 | Pending |
| LIART-15 | Phase 6 | Pending |
| LIART-16 | Phase 6 | Pending |
| LIART-17 | Phase 6 | Pending |
| COMP-05 | Phase 6 | Pending |
| AGNT-01 | Phase 6 | Pending |
| AGNT-02 | Phase 6 | Pending |
| AGNT-03 | Phase 6 | Pending |
| AGNT-04 | Phase 6 | Pending |
| AGNT-05 | Phase 6 | Pending |
| AGNT-06 | Phase 6 | Pending |
| AGNT-07 | Phase 6 | Pending |
| AGNT-08 | Phase 6 | Pending |
| FOG-01 | Phase 7 | Pending |
| FOG-02 | Phase 7 | Pending |
| FOG-03 | Phase 7 | Pending |
| FOG-04 | Phase 7 | Pending |
| FOG-05 | Phase 7 | Pending |
| FOG-06 | Phase 7 | Pending |
| ZOOM-01 | Phase 7 | Pending |
| ZOOM-02 | Phase 7 | Pending |
| ZOOM-03 | Phase 7 | Pending |
| ZOOM-04 | Phase 7 | Pending |
| ZOOM-05 | Phase 7 | Pending |
| ZOOM-06 | Phase 7 | Pending |
| GRID-03 | Phase 7 | Pending |
| GRID-04 | Phase 7 | Pending |
| INTG-01 | Phase 8 | Pending |
| INTG-02 | Phase 8 | Pending |
| INTG-03 | Phase 8 | Pending |
| INTG-04 | Phase 8 | Pending |
| INTG-05 | Phase 8 | Pending |
| INTG-06 | Phase 8 | Pending |
| WGEN-14 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 136 total
- Mapped to phases: 136
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
