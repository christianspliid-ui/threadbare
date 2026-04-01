# HexMapV2 Directory Structure

Load this when you need to locate a specific file or understand module ownership.

## src/components/HexMapV2/

```
HexMapV2.tsx              # Main component (canvas ref, lifecycle, render loop)
HexV2View.tsx             # Standalone debug route
camera/
├── D3ZoomCamera.ts       # d3-zoom ↔ Three.js camera sync, custom wheel handler
├── CameraAnimator.ts     # Smooth panning/zooming via rAF
└── FollowMode.ts         # Agent follow-mode state
scene/
├── HexSceneSetup.ts      # Renderer, scene, orthographic camera init
├── RenderLayers.ts       # Named render-order constants (13 layers)
├── ZoomVisibilityMatrix.ts # 4-tier zoom thresholds + per-layer visibility
├── HexFillMesh.ts        # Dual InstancedMesh (land + water) with stencil clipping
├── CoastlineMesh.ts      # Organic coastline contours (stencil write + shallow fills)
├── HexGridLines.ts       # Hex grid line overlay
├── ElevationTicks.ts     # Elevation tick marks between hex pairs
├── RiverMesh.ts          # River quad-strip geometry
├── RoadMesh.ts           # Trade route lines
├── BorderMesh.ts         # Kingdom + barony political borders
├── SignifierMesh.ts       # Terrain signifier sprites (1 per land hex)
├── LocationIconMesh.ts   # Settlement/location icon sprites
├── CapitalMarkers.ts     # Red ring markers for capitals
├── AgentSpriteMesh.ts    # Agent portrait/dot sprites (3-tier zoom)
├── MovementTrailMesh.ts  # Agent movement path trails
└── FogCulling.ts         # Fog-of-war color overrides + visibility
interaction/
├── HexRaycaster.ts       # Screen→hex and world↔screen coordinate conversion
└── HexTooltip.tsx        # React overlay for hex hover info
palette/
├── terrainPalette.ts     # 30 terrain types → hex color strings
├── waterPalette.ts       # Water terrain colors + depth-band system
└── colorUtils.ts         # Hex↔RGB conversion, brightness noise, water depth bands
signifiers/
├── signifierRegistry.ts  # TerrainType → SVG path variants mapping
├── signifierTextures.ts  # CanvasTexture builder from SVG paths
├── compositionResolver.ts # Multi-layer composition logic
├── compositionTypes.ts   # Composition type definitions
├── bogPathData.ts        # Hand-drawn SVG path data
└── steppesPathData.ts    # Hand-drawn SVG path data
agents/
├── agentSpriteTypes.ts   # AgentRenderData type, zoom thresholds, faction colors
├── agentAnimationState.ts # Animation state machine
├── agentPortraitTextures.ts # Portrait thumbnail builder
├── activityIndicatorRegistry.ts # Activity/event icons
└── eventIndicatorRegistry.ts # Event notification icons
locations/
├── locationIconRegistry.ts # LocationSubtype → icon sprites
└── locationIconTextures.ts # CanvasTexture builder for icons
overlay/
├── RegionLabelOverlay.tsx # Region name labels (HTML overlay, collision detection)
├── LocationLabelOverlay.tsx # Location name labels
└── labelCollision.ts     # Label collision avoidance algorithm
diagnostics/
└── WebGLDiagnostics.ts   # FPS, draw calls, context loss tracking, debug panel integration
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
