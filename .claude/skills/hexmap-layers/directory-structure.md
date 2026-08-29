# HexMapV2 Directory Structure

Load this when you need to locate a specific file or understand module ownership.

> Regenerated 2026-08-29 (THR-1355) against the live tree. When a module is added, update this
> file in the same PR — a ~45%-stale map sends agents green-fielding modules that already exist.

## src/components/HexMapV2/

```
HexMapV2.tsx              # Main component (canvas ref, lifecycle, render loop)
HexV2View.tsx             # Standalone debug route
camera/
├── D3ZoomCamera.ts       # d3-zoom ↔ Three.js camera sync, custom wheel handler
├── CameraAnimator.ts     # Smooth panning/zooming via rAF
└── FollowMode.ts         # Agent follow-mode state
hooks/
├── useAgentAnimations.ts # Agent move/settle animation lifecycle
├── useFogCulling.ts      # Fog culling wiring
└── useZoomLayerVisibility.ts # Zoom-tier visibility of layer groups (register new groups here)
scene/  (40 modules — grouped by concern)
├── HexSceneSetup.ts      # Renderer, scene, orthographic camera init
├── RenderLayers.ts       # RENDER_ORDER (26 layers) + LAYER_Z — the layer authority
├── ZoomVisibilityMatrix.ts # 4-tier zoom thresholds + per-layer visibility
│   — terrain & water —
├── HexFillMesh.ts        # Dual InstancedMesh (land + water) with stencil clipping
├── CoastlineMesh.ts      # Organic coastline contours (stencil write + shallow fills)
├── HexGridLines.ts       # Hex grid line overlay
├── ElevationTicks.ts     # Elevation tick marks between hex pairs
├── RiverMesh.ts          # River quad-strip geometry
├── RoadMesh.ts           # Road/trail quad-strips
├── TradeRouteMesh.ts     # Trade-route lines
├── BorderMesh.ts         # Kingdom + barony political borders
├── GeoBorderMesh.ts      # Geographic/region borders
│   — signifiers & locations —
├── SignifierMesh.ts      # Terrain signifier sprites (1 per land hex)
├── LocationIconMesh.ts   # Settlement/location icon sprites
├── CapitalMarkers.ts     # Red ring markers for capitals
├── CityModelMesh.ts      # 3D GLB city/capital models
├── SettlementModelMesh.ts # 3D settlement models
├── LocationRaritySignifierMesh.ts + rarityVisualConstants.ts   # Rarity halo rings
├── ReachSignatureSignifierMesh.ts + reachSignatureVisualConstants.ts # Ascendant footprints
├── AnomalyShimmerMesh.ts + anomalyConstants.ts # Anomaly hint glow / discovered halo
├── HexPulseMesh.ts       # Ambient tense/volatile hex glow
│   — agents, armies & battle —
├── AgentSpriteMesh.ts    # Agent portrait/dot sprites (zoom-tiered)
├── MovementTrailMesh.ts  # Agent movement path trails
├── ThreadLineMesh.ts     # Relationship thread lines
├── CompanyClusterMesh.ts # Company ring + bond glyph (THR-74)
├── ArmyLayer.ts + ArmySpriteMesh.ts # Army rendering
├── BattleIndicatorLayer.ts + BattleIndicatorMesh.ts + SiegeIndicatorMesh.ts # Combat indicators
├── ActivityIconMesh.ts   # Reach micro-icons on agents
├── ParticleBurstMesh.ts  # Sphere-colored particle effects
├── StrategicMarkerMesh.ts # Strategic action markers
├── RivalInfluenceMesh.ts # Rival influence overlays
│   — fog —
├── FogCulling.ts         # Fog-of-war color overrides + visibility
├── FogOverlayMesh.ts + fogShader.ts # Parchment fog overlay shader
interaction/
├── HexRaycaster.ts       # Screen→hex and world↔screen coordinate conversion
└── HexTooltip.tsx        # React overlay for hex hover info
palette/
├── terrainPalette.ts     # 32 terrain types → hex color strings
├── waterPalette.ts       # Water terrain colors + depth-band system
├── colorUtils.ts         # Hex↔RGB conversion, brightness noise, water depth bands
├── paletteTheme.ts + activePalette.ts # Palette theming
signifiers/
├── signifierRegistry.ts  # TerrainType → SVG path variants mapping
├── signifierTextures.ts  # CanvasTexture builder from SVG paths
├── compositionResolver.ts / compositionTypes.ts # Multi-layer composition
├── bogPathData.ts / steppesPathData.ts # Hand-drawn SVG path data
agents/
├── agentSpriteTypes.ts   # AgentRenderData type, zoom thresholds, faction colors
├── agentAnimationState.ts # Animation state machine
├── agentPortraitTextures.ts # Portrait thumbnail builder
├── activityIndicatorRegistry.ts / eventIndicatorRegistry.ts # Icon registries
locations/
├── locationIconRegistry.ts # LocationSubtype → icon sprites
└── locationIconTextures.ts # CanvasTexture builder for icons
overlay/
├── RegionLabelOverlay.tsx # Region name labels (HTML overlay, collision detection)
├── LocationLabelOverlay.tsx # Location name labels
├── AgentPulseOverlay.tsx # Agent pulse HTML overlay
└── labelCollision.ts     # Label collision avoidance algorithm
diagnostics/
└── WebGLDiagnostics.ts   # FPS, draw calls, context loss tracking, debug panel integration
lab/                      # Vignette prototyping sandbox (not shipped surfaces)
```

## Test File Locations

```
scene/__tests__/          # ~12 test files for mesh factories
camera/__tests__/         # D3ZoomCamera.test.ts
interaction/__tests__/    # HexRaycaster.test.ts
palette/__tests__/        # terrainPalette.test.ts, waterPalette.test.ts
signifiers/__tests__/     # signifierRegistry.test.ts, compositionResolver.test.ts
agents/__tests__/         # agentSpriteTypes, agentAnimationState, agentPortraitTextures
locations/__tests__/      # locationIconRegistry.test.ts
overlay/__tests__/        # labelCollision.test.ts, LocationLabelOverlay.test.ts
```

## Related Files Outside HexMapV2/

| File | Purpose |
|------|---------|
| `src/lib/hexMath.ts` | Coordinate conversion: offset↔cube, pixel↔hex, neighbors, distance |
| `src/engine/coastline.ts` | Marching squares contour generation, `isWaterTerrain()` |
| `src/engine/regionLabels.ts` | Region + river label generation |
| `src/types/index.ts` | HexCoord, HexTile, TerrainType definitions |
| `src/types/visibility.ts` | VisibilityMap, fog states |
| `src/types/coastline.ts` | ContourLoop, COASTLINE_DEFAULTS |
| `src/data/agent-visual-content.ts` | Agent visual constants (ring radius, token radius, portrait size) |
| `src/components/CMS/tunableConstants.ts` | All named constants cataloged for editor inspection |
