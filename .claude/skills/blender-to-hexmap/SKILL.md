---
name: blender-to-hexmap
description: Build 3D models in Blender via MCP and import them into the HexMapV2 Three.js hex renderer. Use this skill EVERY TIME you create, modify, or re-export a 3D model for the hex map — including city models, fortress models, landmark models, or any GLTF/GLB asset destined for HexMapV2. Triggers on "blender", "3D model", "city model", "GLB", "GLTF", "import model", "hex signifier model", "build in blender", or any task involving creating 3D assets for the game map.
---

# Blender → HexMap Pipeline

This skill encodes the complete workflow for building 3D models in Blender (via the Blender MCP) and importing them into the HexMapV2 Three.js renderer. It captures hard-won lessons from the city model build — follow these steps exactly to avoid the pitfalls we already hit.

## Pipeline Overview

```
Blender (MCP)                    Export                     Three.js (HexMapV2)
┌──────────────────┐   GLB    ┌────────────────────┐     ┌─────────────────────┐
│ 1. Build model   │ ──────► │ public/models/*.glb │ ──► │ GLTFLoader          │
│ 2. Threadbare    │         └────────────────────┘     │ → MeshBasicMaterial  │
│    palette       │                                     │ → hexToWorld position│
│ 3. Merge by mat  │                                     │ → zoom visibility    │
│ 4. Bake rotation │                                     └─────────────────────┘
│ 5. Export GLB    │
└──────────────────┘
```

## Step 1: Build the Model in Blender

Use `mcp__blender__execute_blender_code` to build models procedurally. Break the build into multiple code blocks (materials → helpers → structures → details → lighting/viewport).

### Threadbare Palette (mandatory)

All models must use colors from the style tile (`Design/style-tile.html`). Convert hex colors to RGBA for Blender materials:

```python
def hex_to_rgba(h):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i+2], 16)/255 for i in (0, 2, 4))
    return (r, g, b, 1.0)

def make_mat(name, hex_color, metallic=0.0, roughness=0.8):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_to_rgba(hex_color)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat
```

Key palette colors:
| Use | Hex | Material settings |
|-----|-----|-------------------|
| Dark base | `#0a0a0e` | metallic=0, roughness=1 |
| Stone walls | `#4a4540` | metallic=0.05, roughness=0.85 |
| Grey outer wall | `#7a7a80` | metallic=0.05, roughness=0.85 |
| Slate roofs | dark — `rgb(0.07, 0.075, 0.10)` | metallic=0.15, roughness=0.6 |
| Wood | `#463828` | metallic=0, roughness=0.95 |
| Gold accents | `#d4a040` | metallic=0.9, roughness=0.2 |
| Purple (sigil) | `#4a3a8a` | metallic=0.3, roughness=0.5 |
| Parchment | `#e8dcc8` | metallic=0, roughness=1 |

## Step 2: Merge Objects by Material

Before export, merge all objects that share a material into a single mesh. This dramatically reduces primitive count and file size.

```python
from collections import defaultdict

mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
by_mat = defaultdict(list)
for obj in mesh_objs:
    mat_name = obj.data.materials[0].name if obj.data.materials else "__none__"
    by_mat[mat_name].append(obj)

for mat_name, objs in by_mat.items():
    if len(objs) < 2:
        objs[0].name = f"Model_{mat_name}"
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    bpy.context.active_object.name = f"Model_{mat_name}"
```

After joining, collapse to one material slot per mesh:

```python
for obj in bpy.data.objects:
    if obj.type != 'MESH' or len(obj.material_slots) <= 1:
        continue
    for poly in obj.data.polygons:
        poly.material_index = 0
    while len(obj.material_slots) > 1:
        obj.active_material_index = len(obj.material_slots) - 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.material_slot_remove()
```

## Step 3: Bake Rotation BEFORE Export (Critical)

The hex map camera looks straight down the −Z axis. Blender uses Z-up, GLTF uses Y-up. If you export without adjusting, the model's "up" will point sideways on the map.

**NEVER rotate in Three.js** — it corrupts geometry and causes face culling issues. Instead, bake the rotation into the vertex data in Blender:

```python
import math

# Apply all current transforms
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# Rotate 90° around X so towers point toward camera after GLTF Y-up export
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.rotation_euler.x = math.radians(90)

# Apply the rotation into geometry
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
```

After this, the GLB imports flat — no runtime rotation needed.

## Step 4: Export as GLB

Export to `public/models/` in the game project:

```python
import os

export_path = r"C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\public\models\<name>.glb"
os.makedirs(os.path.dirname(export_path), exist_ok=True)

bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
    export_normals=True,
    export_lights=False,
)
```

Target file size: under 400 KB for a hex signifier model.

## Step 5: Wire into HexMapV2

Follow the `CityModelMesh.ts` pattern in `src/components/HexMapV2/scene/`.

### Material Conversion (mandatory)

The hex renderer uses `THREE.NoToneMapping` and has NO scene lights. PBR materials (`MeshStandardMaterial` from GLTF) render pure black without lights. Convert to `MeshBasicMaterial`:

```typescript
gltf.scene.traverse(child => {
  if (!(child instanceof THREE.Mesh)) return;
  const orig = child.material as THREE.MeshStandardMaterial;
  child.material = new THREE.MeshBasicMaterial({
    color: orig.color.clone(),
    side: THREE.DoubleSide,  // Prevents face culling artifacts
  });
});
```

**Always use `DoubleSide`** — FrontSide culls faces that become back-facing after the baked rotation, causing half the model to disappear.

### Positioning

Use `hexToWorld()` for hex-to-world coordinate conversion (handles the Y-flip):

```typescript
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from './HexFillMesh';

const { x, y } = hexToWorld(
  { col: loc.hexCol, row: loc.hexRow },
  HEX_CONSTANTS.HEX_SIZE,  // 10
);
clone.position.set(x, y, LAYER_Z.LOCATIONS - 0.005);
```

### Scaling

`HEX_SIZE = 10` (hex center-to-vertex radius). To fill a hex:
- `scale = HEX_SIZE / model_radius`
- For 85% fill: `scale = HEX_SIZE / model_radius * 0.85`

### No Runtime Rotation

Since the rotation was baked in Blender (Step 3), the clone needs no rotation:

```typescript
const clone = gltf.scene.clone(true);
// No rotation — already baked into GLB geometry
clone.scale.setScalar(MODEL_SCALE);
clone.position.set(x, y, MODEL_Z);
```

### Zoom Visibility

Wire into `useZoomLayerVisibility` via a ref. Use the same tier as location icons (`locations` in the visibility matrix = regional+ zoom, k >= 5).

Add to the `UseZoomLayerVisibilityParams.groups` interface and toggle in the hook:

```typescript
if (groups.myModel.current) groups.myModel.current.visible = ZOOM_VISIBILITY_MATRIX.locations[tier];
```

### Disposal

Dispose geometries and materials on cleanup. Materials are shared across clones, so track what's already disposed:

```typescript
export function disposeModelMesh(group: THREE.Group): void {
  const disposed = new Set<THREE.Material>();
  group.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!disposed.has(mat)) { mat.dispose(); disposed.add(mat); }
    }
  });
}
```

## Integration Checklist

Before committing a new model:

- [ ] Colors match Threadbare palette (check `Design/style-tile.html`)
- [ ] Objects merged by material (one mesh per material)
- [ ] Material slots collapsed to 1 per mesh
- [ ] 90° X rotation baked in Blender (not applied in Three.js)
- [ ] Exported as GLB to `public/models/`
- [ ] File size under 400 KB
- [ ] Three.js materials converted to `MeshBasicMaterial` with `DoubleSide`
- [ ] Positioned via `hexToWorld()` (not manual coordinates)
- [ ] No runtime rotation on the clone
- [ ] Wired into `useZoomLayerVisibility` hook
- [ ] Disposal function implemented and called in cleanup
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vite build` succeeds

## Lessons Learned (Do Not Repeat)

| Mistake | What Happened | Fix |
|---------|---------------|-----|
| Runtime rotation in Three.js | Geometry corrupted, walls disappeared, half model invisible | Bake rotation in Blender before export |
| `FrontSide` material | Back-facing polygons culled after rotation, half model gone | Always use `DoubleSide` |
| Centering before rotation | `Box3.getCenter()` computed in pre-rotation space, shifted model off-hex after rotation | Either center in Blender, or don't center at all if model is already origin-centered |
| Not merging by material | 310 objects = 310 GLTF primitives, 546 KB bloat | Merge + collapse slots → 8 primitives, 345 KB |
| PBR materials without lights | Model rendered pure black (MeshStandardMaterial needs lights) | Convert to MeshBasicMaterial |
| Guessing hex alignment rotation | Tried π/12, π/6, π/3 — all wrong or corrupting | Bake correct rotation in Blender where you can verify visually |

## Reference Files

| File | Purpose |
|------|---------|
| `src/components/HexMapV2/scene/CityModelMesh.ts` | Reference implementation — city/capital model loader |
| `src/components/HexMapV2/scene/RenderLayers.ts` | Layer Z values and render order |
| `src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts` | Zoom tier thresholds and visibility matrix |
| `src/components/HexMapV2/hooks/useZoomLayerVisibility.ts` | Zoom visibility hook (add new groups here) |
| `src/components/HexMapV2/HexMapV2.tsx` | Main component — scene lifecycle, ref wiring |
| `Design/style-tile.html` | Threadbare color palette source of truth |
| `public/models/city.glb` | Existing city model (reference for scale and structure) |
