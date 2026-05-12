# Blender Export Contract — Hex Vignette Landmarks

This document specifies the requirements for GLB landmark models used in the hex vignette system (`ChunkedLandmarkLayer`).

## Material Slots

- **Maximum 3 material slots per model** (`LANDMARK_MAX_MATERIAL_SLOTS = 3`)
- Models with more than 3 submeshes will be truncated; a `warn`-severity `LandmarkValidationReport` is emitted and visible in the browser console
- Each submesh color is extracted from the source material's `color` property at load time

## Geometry

- Models must be **Y-up** (standard Blender default)
- The `ChunkedLandmarkLayer` does **not** auto-rotate or auto-scale; the placement `scale` and `rotationDegrees` fields control size and orientation
- Apply transforms in Blender before export (Ctrl+A → Apply All Transforms)
- Origin should be at the base center of the model

## Scale Reference

The hex radius is 78 world units. A `scale=1` placement fills roughly 1 world unit of footprint. Typical landmark scales:

| Model type | Suggested scale |
|------------|----------------|
| Village    | 2.9            |
| Town       | 3.3            |
| City       | 5.4            |
| Temple     | 2.8            |

## GLB Export Settings (Blender 4.x)

- Format: **glTF 2.0 (.glb)**
- Include: Mesh data, Materials (color only — no textures required)
- Exclude: Animations, armatures, lights, cameras
- Draco compression: off (not needed at this scale)

## Validation

After export, `validateLandmarkExport` checks submesh count against `LANDMARK_MAX_MATERIAL_SLOTS`. The console logs a warning if truncation occurs. Check via:

```js
window.__TERRAIN_LAB.clickRegistry.list().length
window.__TERRAIN_LAB.landmarkBatchCount
```
