# Roadmap: Hex Map V2

## Overview

Bottom-up construction of a complete hex map system: start with the Three.js renderer and terrain palette, layer in world generation, water systems, regions, then signifier art and composition, agents, fog/zoom, and finally integrate into the live game. Each phase delivers a verifiable visual capability that builds on the previous. The old SVG map continues working until Phase 8 swaps it out.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Renderer Foundation** - Three.js orthographic renderer displays 60K colored hexes at 60fps with camera controls ✅ 2026-03-21
- [x] **Phase 2: World Generation** - Continuous-field worldgen produces realistic heightmap, climate, rivers, and biome assignment (completed 2026-03-21)
- [x] **Phase 3: Coastlines, Water & Elevation** - Organic coastlines, river overlays, water depth, and elevation visual language (completed 2026-03-21)
- [ ] **Phase 4: Regions & Borders** - Geographic and political regions with borders, labels, and capital markers
- [ ] **Phase 5: Hex Composition & Landscape Signifiers** - Slot-based composition system with all 27 terrain signifier sets rendered on map
- [ ] **Phase 6: Locations & Agents** - Settlement icons, POI markers, agent portraits, faction colors, and movement animation
- [ ] **Phase 7: Fog, Zoom & Grid** - Fog-of-war culling, 4-tier zoom LOD with visibility matrix, and road network
- [ ] **Phase 8: Integration** - New map replaces SVG map in GameView with full game system wiring

## Phase Details

### Phase 1: Renderer Foundation
**Goal**: Player sees a 200x300 hex grid rendered via Three.js with correct terrain colors and smooth camera controls
**Depends on**: Nothing (first phase)
**Requirements**: RNDR-01, RNDR-02, RNDR-03, RNDR-04, RNDR-05, RNDR-06, TERR-01, TERR-02, TERR-03, TERR-04, TERR-05
**Success Criteria** (what must be TRUE):
  1. A 200x300 hex grid renders in the browser at 60fps with no visible jank during pan/zoom
  2. Each hex displays a distinct color matching its terrain type from the 27-type Tait palette
  3. Camera pans with drag, zooms with scroll/pinch, and jumps to a specific hex via API call
  4. Hovering a hex shows an HTML tooltip with hex coordinates and terrain type
  5. Water hexes (shallows, ocean, deep_ocean, lake) use a separate blue palette from terrain
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Scene scaffold, palette, InstancedMesh hex fill, grid lines, ?view=hexv2 route ✅ 2026-03-21
- [x] 01-02-PLAN.md — Camera controls (d3-zoom pan/zoom, fly-to), raycasting, tooltip, selected/hovered hex states ✅ 2026-03-21

### Phase 2: World Generation
**Goal**: A seeded world generator produces organic continents with realistic climate zones, rivers, and biome distribution via a province-first multi-pass pipeline
**Depends on**: Phase 1
**Requirements**: WGEN-01, WGEN-02, WGEN-03, WGEN-04, WGEN-05, WGEN-06, WGEN-07, WGEN-08, WGEN-09, WGEN-10, WGEN-11, WGEN-12, WGEN-13
**Success Criteria** (what must be TRUE):
  1. Given the same seed, the generator produces an identical world every time
  2. The world has coherent continents with inland biomes transitioning naturally (tropical near equator, cold at poles, dry in rain shadows)
  3. Rivers flow from high elevation to the sea, growing wider downstream, with lakes forming in depressions
  4. Highland areas (hills, mountains, plateaus) form mountain ranges and ridgelines, not random scattered peaks
  5. Every land hex has a drainage path to the sea (no isolated inland sinks except intentional lakes)
**Plans:** 3/3 plans complete

Plans:
- [ ] 02-01-PLAN.md — Pipeline scaffold, types, province seeding, elevation with ridges/canyons/coastline, 7-point sampling
- [ ] 02-02-PLAN.md — Climate fields (temp/moisture/rain shadow), biome classification with all overrides, adjacency smoothing
- [ ] 02-03-PLAN.md — Hydrology integration (rivers/lakes/drainage/deltas/wetlands), validation pass, game entry point wiring

### Phase 3: Coastlines, Water & Elevation
**Goal**: Coastlines look organic (not hex-shaped), rivers flow as blue overlays through terrain, and elevation is visually readable
**Depends on**: Phase 2
**Requirements**: WATR-01, WATR-02, WATR-03, WATR-04, WATR-05, WATR-06, ELEV-01, ELEV-02, ELEV-03, GRID-01
**Note**: ELEV-04 (altitude text labels) CUT from this phase -- deferred to later phase.
**Success Criteria** (what must be TRUE):
  1. Coastal hexes show their inland biome color with an organic shoreline cutting through (not hex-edge aligned)
  2. Rivers appear as blue curved lines overlaid on terrain (a forest hex with a river still looks like forest + blue line)
  3. River width visibly increases from thin mountain streams to wide lowland rivers
  4. Mountain edges display caterpillar tick marks that get denser on steeper slopes
  5. Thin hex grid lines are visible at hero-local and regional zoom without obscuring terrain
**Plans:** 3/3 plans complete

Plans:
- [x] 03-01-PLAN.md — Coastline mask rendering, water depth bands, lake fill, worldgen data threading, STYLE.md color update ✅ 2026-03-21
- [ ] 03-02-PLAN.md — River overlay rendering with mesh quad strips, width scaling
- [ ] 03-03-PLAN.md — Elevation tick marks, grid line verification, visual checkpoint

### Phase 4: Regions & Borders
**Goal**: The world is divided into named geographic and political regions with visible borders and labels
**Depends on**: Phase 3
**Requirements**: REGN-01, REGN-02, REGN-03, REGN-04, REGN-05, REGN-06, REGN-07, REGN-08, REGN-09, GRID-02
**Success Criteria** (what must be TRUE):
  1. Geographic regions form naturally around terrain features (a forest valley is one region, mountains around it are another)
  2. Political borders render as red polylines along hex edges, with thicker lines for kingdoms and thinner for baronies
  3. Region labels appear at region centers: kingdoms bold all-caps, baronies title case, geographic features italic
  4. Labels do not overlap each other
  5. Capital cities are marked with red dots distinguishable from terrain at regional zoom
**Plans**: TBD

Plans:
- [ ] 04-01: Geographic region detection (flood-fill, border cost, watershed segmentation)
- [ ] 04-02: Political regions, border rendering, capital markers
- [ ] 04-03: Region labels, collision detection, river labels

### Phase 5: Hex Composition & Landscape Signifiers
**Goal**: Every terrain hex displays characteristic dark-silhouette signifiers (trees, mountains, dunes, etc.) placed via a slot-based composition system
**Depends on**: Phase 3
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, LSIG-01, LSIG-02, LSIG-03, LSIG-04, LSIG-05, LART-01, LART-02, LART-03, LART-04, LART-05, LART-06, LART-07, LART-08, LART-09, LART-10, LART-11, LART-12, LART-13, LART-14, LART-15, LART-16, LART-17, LART-18, LART-19, LART-20, LART-21, LART-22, LART-23, LART-24, LART-25, LART-26, LART-27, LART-28, LART-29, LART-30
**Success Criteria** (what must be TRUE):
  1. Every terrain type on the map displays a recognizable dark silhouette signifier (trees for forests, peaks for mountains, dunes for deserts, etc.)
  2. Adjacent hexes of the same terrain show different signifier variants (no two neighboring forests look identical)
  3. Signifiers have subtle position jitter and rotation, creating an organic hand-placed feel
  4. Signifiers scale with zoom and disappear below regional zoom threshold
  5. The composition system correctly assigns signifiers to CENTER slots and handles suppression rules
**Plans**: TBD

Plans:
- [ ] 05-01: Hex composition system (slots, manifest, resolver, suppression)
- [ ] 05-02: Landscape signifier rendering pipeline (SVG to Three.js sprites)
- [ ] 05-03: SVG signifier assets — lowland, forest, wet terrain types (LART-01 through LART-12)
- [ ] 05-04: SVG signifier assets — highland, desert, cold, volcanic, special types (LART-13 through LART-30)

### Phase 6: Locations & Agents
**Goal**: Settlements, POIs, and agents are visible on the map with faction colors, status indicators, and movement animation
**Depends on**: Phase 5
**Requirements**: LOCI-01, LOCI-02, LOCI-03, LOCI-04, LOCI-05, LIART-01, LIART-02, LIART-03, LIART-04, LIART-05, LIART-06, LIART-07, LIART-08, LIART-09, LIART-10, LIART-11, LIART-12, LIART-13, LIART-14, LIART-15, LIART-16, LIART-17, COMP-05, AGNT-01, AGNT-02, AGNT-03, AGNT-04, AGNT-05, AGNT-06, AGNT-07, AGNT-08
**Success Criteria** (what must be TRUE):
  1. Cities, temples, ruins, and other locations display as recognizable black silhouette icons with name labels readable against any terrain
  2. Agents appear as circular portrait thumbnails at hero-local zoom and colored dots at regional zoom
  3. Retinue agents are instantly distinguishable from other agents by their gold/white border
  4. When an agent moves, it visually hops along a bezier curve from source to destination hex
  5. Major locations suppress terrain signifiers on their hex (a city replaces tree icons)
**Plans**: TBD

Plans:
- [ ] 06-01: Location signifier rendering, label system (white halo text), capital red markers
- [ ] 06-02: SVG location icon assets (LIART-01 through LIART-17)
- [ ] 06-03: Agent rendering (portraits, faction dots, RING layout, zoom-tier visibility)
- [ ] 06-04: Agent animation (bezier hop), activity indicators, event indicators

### Phase 7: Fog, Zoom & Grid
**Goal**: Fog of war hides unexplored territory, zoom levels show appropriate detail, and roads connect settlements
**Depends on**: Phase 6
**Requirements**: FOG-01, FOG-02, FOG-03, FOG-04, FOG-05, FOG-06, ZOOM-01, ZOOM-02, ZOOM-03, ZOOM-04, ZOOM-05, ZOOM-06, GRID-03, GRID-04
**Success Criteria** (what must be TRUE):
  1. Unexplored hexes appear as solid dark fill with no terrain detail leaking through
  2. Explored-but-not-visible hexes show full terrain, signifiers, and locations but NO agents or events
  3. Zooming smoothly transitions between hero-local, regional, continental, and full-world views with elements fading in/out
  4. At full-world zoom, only terrain colors and political borders are visible (no signifiers, no agents)
  5. Camera starts centered on the player's retinue agent and can auto-follow during movement
**Plans**: TBD

Plans:
- [ ] 07-01: Fog of war system (per-hex state, culling, reveal animation)
- [ ] 07-02: Zoom LOD tiers, visibility matrix, fade transitions
- [ ] 07-03: Road network rendering, bridge icons, follow mode

### Phase 8: Integration
**Goal**: The new hex map fully replaces the old SVG map in the live game with all existing systems working
**Depends on**: Phase 7
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04, INTG-05, INTG-06, WGEN-14
**Success Criteria** (what must be TRUE):
  1. Opening the game (?view=game) shows the new Three.js hex map instead of the old SVG map
  2. Clicking a hex opens the hex chronicle, clicking a location opens location view, clicking an agent opens agent interaction
  3. All existing agents, locations, and encounters from game state appear on the new map without engine changes
  4. The fog toggle in the debug panel works with the new renderer
  5. All pre-existing tests pass without modification
**Plans**: TBD

Plans:
- [ ] 08-01: GameView swap (replace SVG map component, wire click events)
- [ ] 08-02: Fantasy overlay pass, debug panel integration, URL params, test verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 (parallel: 5) -> 6 -> 7 -> 8

Note: Phase 5 can run in parallel with Phase 4 (both depend on Phase 3, not each other).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Renderer Foundation | 2/2 | Complete | 2026-03-21 |
| 2. World Generation | 3/3 | Complete   | 2026-03-21 |
| 3. Coastlines, Water & Elevation | 3/3 | Complete   | 2026-03-21 |
| 4. Regions & Borders | 0/3 | Not started | - |
| 5. Hex Composition & Landscape Signifiers | 0/4 | Not started | - |
| 6. Locations & Agents | 0/4 | Not started | - |
| 7. Fog, Zoom & Grid | 0/3 | Not started | - |
| 8. Integration | 0/2 | Not started | - |
