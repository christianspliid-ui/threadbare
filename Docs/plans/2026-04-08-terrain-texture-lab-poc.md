# Terrain Texture Lab POC

Date: 2026-04-08

## Goal

Create a standalone WebGL playground for terrain texturing experiments so we can tune hex-surface materials without touching the live HexMapV2 renderer.

Route: `?view=terrain-lab`

Scope:
- Separate scene, camera, shader, and controls
- No dependency on live `GameState`
- No changes to `HexFillMesh` or the production hex renderer
- Fast iteration on terrain recipes, color ramps, and noise parameters

## What Shipped

- A dedicated `TerrainTextureLab` route in `src/App.tsx`
- A standalone Three.js scene using `InstancedMesh` + `ShaderMaterial`
- Six terrain presets:
  - Grassland
  - Temperate Forest
  - Mountains
  - Sand Dunes
  - Coast Water
  - Swamp
- Live controls for:
  - recipe
  - base / highlight / shadow colors
  - primary scale
  - detail scale
  - warp scale
  - warp strength
  - pattern mix
  - contrast
  - ridge sharpness
  - banding
  - animation speed
- Global controls for seed, time scale, and animation enable/disable
- Local persistence via `localStorage`
- JSON export for presets

## Recipe Notes

These are starting points, not final art direction.

| Terrain | Recipe | Why this pattern |
|---|---|---|
| Grassland | `grain` | Low-contrast layered fBM with rotated detail noise gives soft breakup without reading as stone or fabric |
| Temperate Forest | `canopy` | Cellular clumps suggest canopy masses better than smooth continuous noise |
| Mountains | `ridges` | Ridged fractal noise plus directional striation reads as rock faces and geological seams |
| Sand Dunes | `dunes` | Banded sine fields warped by noise create wind-shaped dune rhythm |
| Coast Water | `ripples` | Animated banding provides water motion; cellular breakup suggests foam/churn |
| Swamp | `marsh` | Cellular pools + muddy fBM produce patchy wetland surfaces rather than clean water |

## Research Notes

Primary references used for the POC:

- Three.js `ShaderMaterial`: <https://threejs.org/docs/pages/ShaderMaterial.html>
- Three.js `InstancedMesh`: <https://threejs.org/docs/pages/InstancedMesh.html>
- Three.js `DataArrayTexture`: <https://threejs.org/docs/pages/DataArrayTexture.html>
- The Book of Shaders, Noise: <https://thebookofshaders.com/11/>
- The Book of Shaders, More Noise / Cellular Noise: <https://thebookofshaders.com/12/>
- The Book of Shaders, Fractal Brownian Motion: <https://thebookofshaders.com/13/>

Practical takeaways:

- Use `ShaderMaterial` when we want per-fragment procedural terrain instead of flat material colors.
- Keep per-hex differences in instanced attributes rather than separate meshes.
- Use fBM for broad natural variation, not just one octave of noise.
- Use cellular/Worley-style distance fields for clustered or pooled forms like canopy, marsh, foam.
- Rotate or warp coordinates to avoid obvious axis-aligned grid artifacts.
- If we later move to authored textures, `DataArrayTexture` is the cleanest path for same-sized terrain layers.

## Tunability

The playground keeps all user-facing controls as named config fields rather than burying numbers inside the UI:

- `primaryScale`
- `detailScale`
- `warpScale`
- `warpStrength`
- `mixAmount`
- `contrast`
- `ridgeStrength`
- `banding`
- `animationSpeed`

The app-level constants live in `TERRAIN_TEXTURE_LAB_CONSTANTS`.

## Fail-Soft Notes

| Case | Fallback |
|---|---|
| Invalid saved preset JSON | Revert to default presets |
| Clipboard API unavailable | Keep export in visible JSON panel and show failure state |
| Animation disabled | Time uniform locks to `0` |
| Browser resize | Camera refits to bounds via `ResizeObserver` |

## What To Evaluate Tomorrow

1. Which recipes feel closest to Threadbare: subtle/painterly, graphic/stylized, or more map-physical.
2. Whether water should stay shader-only or eventually move to a texture-array workflow.
3. Whether forests should read as canopy masses, undergrowth texture, or symbolic top-down tree clusters.
4. How much intra-hex variation is desirable before the map starts looking too noisy.

## Next Safe Steps

1. Add preset save/load slots and side-by-side comparisons.
2. Add a single-hex zoom mode for close inspection.
3. Add optional texture-array branch for hand-painted experiments.
4. Only after the recipes feel right, port the winning approach into `HexFillMesh`.

## NFP Check

| Priority | Status | Note |
|---|---|---|
| Tunability | PASS | Every texture control is a named field |
| Inspectability | PASS with note | No trace surface yet; JSON export and visible controls cover POC needs |
| Determinism | PASS | Seeded per-instance variation |
| Fail-soft | PASS | Invalid saved data falls back cleanly |
| Narrative over perfection | PASS | This is an art-direction sandbox, not a physically-correct terrain system |
| Additive over destructive | PASS | No production renderer changes |
| Performance budget | PASS | Small instanced preview scene; no engine coupling |
