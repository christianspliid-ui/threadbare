# Coastline System — Deep Dive

Load this when actively working on `src/engine/coastline.ts` or `src/components/HexMapV2/scene/CoastlineMesh.ts`.

## Pipeline: Engine → Renderer

```
Engine (src/engine/coastline.ts)                     Renderer (scene/CoastlineMesh.ts)
┌─────────────────────────────┐                      ┌────────────────────────────┐
│ 1. buildScalarField()       │                      │ 1. Stencil write pass      │
│    Metaball field from land  │                      │    contour → ShapeGeometry │
│    hex positions (quartic    │  CoastlineData       │    colorWrite: false       │
│    falloff: (1-d²/r²)²)     │  ─────────────►      │    stencilRef: 1           │
│ 2. extractContours()        │  .loops               │                            │
│    Marching squares at       │  .midLoops            │ 2. Land InstancedMesh      │
│    threshold                 │  .shallowLoops        │    stencilFunc: Equal      │
│ 3. chainSegmentsIntoLoops() │  .lakeLoops           │    Only where stencil = 1  │
│ 4. chaikinSmooth()           │                      │                            │
│ 5. displaceContour() (noise)│                      │ 3. Water InstancedMesh     │
│ 6. shiftLoops() (un-margin) │                      │    No stencil test         │
└─────────────────────────────┘                      └────────────────────────────┘
```

## Scalar Field (`buildScalarField`)

- Each **land hex** emits a quartic falloff: `(1 - d²/r²)²` with radius `blobRadius * hexSize`
- **Lake hexes** (lakeId >= 0) are treated as LAND for the field — coastline wraps around land+lakes together
- **Margin** around the field must be >= blobRadius to avoid triangular contour artifacts at edges
- Field resolution (`fieldResolution: 4`) controls grid granularity — lower = finer but slower

## Marching Squares Contour Extraction

- 16-case lookup table (`MARCHING_CASES`) for segment generation
- Linear interpolation at cell edges for smooth iso-contour
- Segments chained into closed loops via endpoint snapping (`SNAP_DISTANCE = 0.5`)
- Safety limit of 50,000 iterations prevents infinite loops

## Contour Processing Pipeline

For each threshold level (land boundary, mid-depth, shallows):

1. **Extract** raw segments via marching squares
2. **Chain** segments into closed loops
3. **Smooth** via Chaikin corner-cutting (2 passes default)
4. **Ensure winding** — consistent CCW in screen space
5. **Displace** with seeded Simplex noise for organic irregularity
6. **Filter** loops < `minLoopPoints` (20) to remove noise artifacts
7. **Shift** coordinates back from field-space to hexToPixel-space (subtract margin)

## CoastlineConfig Constants (COASTLINE_DEFAULTS)

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `blobRadius` | 1.8 | Quartic falloff radius (× hexSize) |
| `threshold` | 0.35 | Iso-contour level for land boundary |
| `smoothPasses` | 2 | Chaikin smoothing iterations |
| `displacement` | 0.02 | Noise amplitude for organic irregularity |
| `noiseScale` | 0.02 | Noise frequency |
| `midWidth` | 0.15 | Threshold offset for mid-depth band |
| `shallowWidth` | 0.28 | Threshold offset for shallows band |
| `fieldResolution` | 4 | Scalar field grid cell size (px) |
| `minLoopPoints` | 20 | Minimum points to keep a loop |

## Stencil Threshold Tuning

- `STENCIL_THRESHOLD = 0.30` in CoastlineMesh.ts — slightly lower than the contour threshold (0.35)
- Lower value extends the stencil past outer land hex edges, ensuring full coverage of land hex interiors
- **Caution**: Using the lower threshold for `shallowLoops` causes them to cover the entire map — use `COASTLINE_DEFAULTS.threshold` for all visual contours

## Lake Handling

- Lake scalar field built separately (`buildLakeScalarField`) with lake hexes as blob emitters
- Lake displacement = 50% of coastline displacement (calmer shores)
- Lake seed offset = `seed + 7` so shores don't mirror coastline noise patterns
- Lake hexes render in the **water** InstancedMesh (below stencil) — hexagonal lake-blue fills

## Known Limitation: Shallow Band Disabled

The shallow band and lake shore overlays are currently **DISABLED** because:

- Stencil write uses contour loops that trace the coastline **boundary**, not a filled land interior
- Stencil = 1 only near the coast, not for inland hexes
- An inverse stencil test (`NotEqualStencilFunc`) on the shallow band would incorrectly render over inland hexes

**To fix** (future work): Either (a) add a separate full-land stencil fill pass using hex geometry, or (b) generate a filled polygon covering all land area.

## Failed Approaches (DO NOT Retry)

| Approach | Why It Failed |
|----------|---------------|
| Ocean mask with 65+ land contour holes | earcut triangulation silently fails at this complexity |
| Land contour fill overlay at z > 0 | Covers terrain with flat color despite z-ordering |
| Depth band fill shapes with land holes | earcut fails again |
| depthTest tricks | GPU-dependent, not portable |
| Coastal hex scaling (shrinking coastal hexes) | Creates white/colored gaps between hexes |

## Winding Order After Y-Flip

```
SVG y-down:   positive signedArea = CCW
After Y-flip: positive SVG area → CW in Three.js y-up → REVERSE to make CCW
              negative SVG area → CCW in Three.js y-up → KEEP
```

THREE.Shape expects CCW outer loops. The `loopToMesh` and `loopToStencilMesh` helpers handle this automatically.

## Key Source Files

| File | Purpose |
|------|---------|
| `src/engine/coastline.ts` | Full pipeline: scalar field, marching squares, chaining, smoothing, displacement |
| `src/types/coastline.ts` | Types (CoastlineData, CoastlineConfig, ContourLoop), COASTLINE_DEFAULTS |
| `src/components/HexMapV2/scene/CoastlineMesh.ts` | Three.js rendering: stencil write, Y-flip, ShapeGeometry |
| `src/components/HexMapV2/scene/HexFillMesh.ts` | Dual InstancedMesh (land with stencil test, water without) |
