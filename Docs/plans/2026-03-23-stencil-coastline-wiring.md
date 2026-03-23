# Stencil Coastline Wiring — Implementation Plan

**Date:** 2026-03-23
**Status:** Ready for Claude Code
**Scope:** Wire the stencil pipeline that Phase 7.1 scaffolded but never completed
**Prereqs:** None — all infrastructure already landed

---

## Problem

Phase 7.1 built the scaffolding (split land/water mesh, `stencil: true` in renderer, `STENCIL_WRITE` render order, fog routing via `globalToMeshMap`) but **never wired the actual stencil properties**. The result:

- Land mesh material is a plain `MeshBasicMaterial` with zero stencil config → renders unconditionally as full hexagons
- `CoastlineMesh.ts` still uses the old colored overlay approach (Impediment #6) → flat green/blue fills that occlude terrain

The coastline engine (`computeCoastline`) works fine. The integration in `HexMapV2.tsx` is already correct. This plan completes the last two files.

---

## What's Already Done (DO NOT REDO)

| File | Status |
|------|--------|
| `HexSceneSetup.ts` | ✅ `stencil: true` in WebGLRenderer |
| `RenderLayers.ts` | ✅ `STENCIL_WRITE: -1` constant |
| `HexFillMesh.ts` | ✅ Split into `HexFillMeshResult` with `landMesh` + `waterMesh` + tile index arrays |
| `HexMapV2.tsx` | ✅ Both meshes added to scene, `globalToMeshMap` for fog routing, cleanup handles both |

---

## Changes Required

### Change 1: Add stencil test to land mesh material (`HexFillMesh.ts`)

**File:** `src/components/HexMapV2/scene/HexFillMesh.ts`
**What:** Add stencil properties to the land mesh material so it only renders where stencil buffer = 1.

On line 98, the land material is created as:
```typescript
const landMat = new THREE.MeshBasicMaterial({ vertexColors: false });
```

Change to:
```typescript
const landMat = new THREE.MeshBasicMaterial({ vertexColors: false });
landMat.stencilWrite = false;             // Land does NOT write to stencil — only reads
landMat.stencilFunc = THREE.EqualStencilFunc;  // Only render where stencil === ref
landMat.stencilRef = 1;                   // Match the value written by coastline stencil pass
landMat.stencilFuncMask = 0xFF;
landMat.stencilFail = THREE.KeepStencilOp;
landMat.stencilZFail = THREE.KeepStencilOp;
landMat.stencilZPass = THREE.KeepStencilOp;
```

**Also fix stale comments:**
- Line 22-24: Replace "ocean mask overlay" comment with stencil description
- Line 96-97: Replace "ocean mask overlay" comment with stencil description

### Change 2: Rewrite CoastlineMesh for stencil write + depth bands (`CoastlineMesh.ts`)

**File:** `src/components/HexMapV2/scene/CoastlineMesh.ts`
**What:** Replace the colored overlay approach with: (a) invisible stencil write geometry from land `loops`, (b) visible depth band fills from `shallowLoops`/`lakeLoops`.

#### 2a. Add stencil threshold constant

```typescript
/** Lower than COASTLINE_DEFAULTS.threshold (0.35) so the contour extends past
 *  the outer land hex edges. This ensures land hex pixels near the coast are
 *  fully enclosed by the stencil region. */
export const STENCIL_THRESHOLD = 0.30;
```

#### 2b. Add a `loopToStencilMesh` helper (alongside existing `loopToMesh`)

Reuses the same Y-flip + winding logic as `loopToMesh`, but with an invisible stencil write material:

```typescript
/** Shared stencil write material — one instance for all stencil shapes. */
const stencilWriteMaterial = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
  depthTest: false,
  stencilWrite: true,
  stencilWriteMask: 0xFF,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilRef: 1,
  stencilFuncMask: 0xFF,
  stencilFail: THREE.ReplaceStencilOp,
  stencilZFail: THREE.ReplaceStencilOp,
  stencilZPass: THREE.ReplaceStencilOp,
  side: THREE.DoubleSide,
});

function loopToStencilMesh(loop: ContourLoop): THREE.Mesh | null {
  if (loop.length < 3) return null;
  const flippedPoints: THREE.Vector2[] = loop.map(p => new THREE.Vector2(p.x, -p.y));
  const svgArea = signedArea(loop);
  if (svgArea > 0) flippedPoints.reverse();
  const shape = new THREE.Shape(flippedPoints);
  const geometry = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geometry, stencilWriteMaterial);
  return mesh;
}
```

#### 2c. Rewrite `createCoastlineMesh`

The function should:

1. Call `computeCoastline` with a modified config using `STENCIL_THRESHOLD`:
   ```typescript
   const stencilConfig = { ...COASTLINE_DEFAULTS, threshold: STENCIL_THRESHOLD };
   coastlineData = computeCoastline(tiles, HEX_CONSTANTS.HEX_SIZE, cols, rows, seed, stencilConfig);
   ```

2. For each loop in `coastlineData.loops` — create stencil write mesh:
   ```typescript
   const stencilMesh = loopToStencilMesh(loop);
   if (stencilMesh) {
     stencilMesh.renderOrder = RENDER_ORDER.STENCIL_WRITE; // -1
     group.add(stencilMesh);
   }
   ```

3. For each loop in `coastlineData.shallowLoops` — create visible depth band fill:
   ```typescript
   const shallowMesh = loopToMesh(loop, COASTLINE_SHALLOW_COLOR, COASTLINE_SHALLOW_Z);
   if (shallowMesh) {
     shallowMesh.renderOrder = RENDER_ORDER.COASTLINE; // 1
     group.add(shallowMesh);
   }
   ```

4. For lake loops — create visible lake fill:
   ```typescript
   if (coastlineData.lakeLoops?.length) {
     for (const loop of coastlineData.lakeLoops) {
       const lakeMesh = loopToMesh(loop, WATER_PALETTE['lake'], COASTLINE_SHALLOW_Z);
       if (lakeMesh) {
         lakeMesh.renderOrder = RENDER_ORDER.COASTLINE;
         group.add(lakeMesh);
       }
     }
   }
   ```

5. **Remove** the old "Layer 2: Land boundary" section that creates colored overlays using `COASTLINE_LAND_COLOR`. The stencil write replaces this entirely.

6. **Do NOT set `group.renderOrder`** to a single value — children have their own renderOrder set individually (-1 for stencil writes, 1 for depth bands).

#### 2d. Clean up exports

- `COASTLINE_LAND_COLOR` and `COASTLINE_LAND_Z` can be removed (no longer used — land boundary is invisible stencil write, not a colored overlay).
- Export `STENCIL_THRESHOLD` for tests.
- Keep `COASTLINE_SHALLOW_COLOR` and `COASTLINE_SHALLOW_Z` (still used for depth bands).

### Change 3: Update tests (`CoastlineMesh.test.ts`)

**File:** `src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts`

Tests that need updating:

1. **"returns a THREE.Group with renderOrder = RENDER_ORDER.COASTLINE"** — The group no longer has a meaningful single renderOrder. Update to check that the group is a THREE.Group and that its children have correct individual renderOrders.

2. **"land boundary meshes use COASTLINE_LAND_COLOR"** — This test checks for colored land overlays which no longer exist. **Replace** with: "stencil write meshes have colorWrite false and stencilWrite true":
   ```typescript
   it('stencil write meshes have colorWrite false and stencilWrite true', () => {
     vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });
     const group = createCoastlineMesh(tiles, 10, 10, 42);
     const stencilMeshes = group.children.filter(c =>
       c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).colorWrite === false
     );
     expect(stencilMeshes.length).toBeGreaterThan(0);
     const mat = (stencilMeshes[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
     expect(mat.stencilWrite).toBe(true);
     expect(mat.stencilRef).toBe(1);
     expect(mat.stencilFunc).toBe(THREE.AlwaysStencilFunc);
   });
   ```

3. **"land boundary meshes have renderOrder = RENDER_ORDER.COASTLINE"** — Update to: "stencil write meshes have renderOrder = RENDER_ORDER.STENCIL_WRITE":
   ```typescript
   it('stencil write meshes have renderOrder = RENDER_ORDER.STENCIL_WRITE', () => {
     vi.mocked(computeCoastline).mockReturnValue({ loops: [SQUARE_LOOP], shallowLoops: [], midLoops: [], lakeLoops: [] });
     const group = createCoastlineMesh(tiles, 10, 10, 42);
     const stencilMeshes = group.children.filter(c =>
       c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).colorWrite === false
     );
     for (const mesh of stencilMeshes) {
       expect(mesh.renderOrder).toBe(RENDER_ORDER.STENCIL_WRITE);
     }
   });
   ```

4. **Update import** — Remove `COASTLINE_LAND_COLOR` import, add `STENCIL_THRESHOLD` if testing the threshold value.

5. **Keep unchanged:** "non-zero vertex count", "all-ocean empty", "Y-flip", "shallow band uses WATER_PALETTE.shallows", "accepts optional lakeIds" — these should all still pass since stencil write meshes still have geometry and shallow bands still use the same color.

---

## Verification Checklist

After implementation, verify in this order:

1. **TypeScript compiles:** `npx tsc --noEmit` — zero errors
2. **Tests pass:** `npm test -- --run` — all green
3. **Visual check (CRITICAL):** Load `?view=hexv2` on user's machine
   - [ ] Coastal land hexes show per-hex terrain colors (green forest, tan desert, etc.) with organic (non-hexagonal) edges at the shoreline
   - [ ] Water hexes are full hexagons with water colors
   - [ ] No flat green/brown overlay covering terrain (the old Impediment #6 bug)
   - [ ] Fog of war still darkens both land and water hexes
   - [ ] Stencil threshold: land hex edges near coast are fully enclosed (no clipped corners). If corners are missing, increase `STENCIL_THRESHOLD` slightly toward 0.35

---

## Threshold Tuning Note

`STENCIL_THRESHOLD = 0.30` is a starting point. The contour must fully enclose all land hex pixel interiors at the coast. If after visual verification coastal land hexes have clipped corners or missing edges, nudge the threshold up (try 0.32, 0.33). If the coastline feels too far out into water, nudge down (0.28). This is the single most likely thing that needs visual tuning.

---

## Files Modified (complete list)

| File | Change |
|------|--------|
| `src/components/HexMapV2/scene/HexFillMesh.ts` | Add stencil test properties to land material + fix comments |
| `src/components/HexMapV2/scene/CoastlineMesh.ts` | Replace colored overlay with stencil write pass + depth bands |
| `src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts` | Update tests for stencil behavior |

**Files NOT modified** (already correct): `HexSceneSetup.ts`, `RenderLayers.ts`, `HexMapV2.tsx`, `FogCulling.ts`, `coastline.ts`

---

## Failed Approaches (DO NOT RETRY)

- ❌ Land contour fill overlay at z > 0 → flat color covers terrain (Impediment #6)
- ❌ Ocean mask with 65+ land contour holes → earcut triangulation fails
- ❌ Depth band fill shapes with land holes → earcut fails
- ❌ depthTest tricks → GPU-dependent, not portable
- ❌ Coastal hex scaling → creates gaps
