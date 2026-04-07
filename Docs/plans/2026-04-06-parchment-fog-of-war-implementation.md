# Parchment Fog of War Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the near-black fog-of-war hex darkening with a parchment texture for unexplored hexes and sepia-tinted terrain for remembered hexes, make fog on by default, and add debug toggle commands.

**Architecture:** Custom ShaderMaterial on hex fill meshes replaces MeshBasicMaterial. A per-instance float attribute (`aFogState`) tells the fragment shader whether to sample a parchment texture (unexplored) or use the instance color (remembered/visible). Sepia tint is computed CPU-side. Existing fog engine logic (visibility.ts) is unchanged.

**Tech Stack:** Three.js (ShaderMaterial, InstancedMesh, InstancedBufferAttribute), React hooks, vitest

**Design spec:** `Docs/plans/2026-04-06-parchment-fog-of-war-design.md`

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `src/components/HexMapV2/scene/fogShader.ts` | New — vertex + fragment shader source strings and constants | Create |
| `src/components/HexMapV2/scene/HexFillMesh.ts` | Hex geometry + InstancedMesh creation | Modify — add UVs, use ShaderMaterial, add aFogState attribute |
| `src/components/HexMapV2/scene/FogCulling.ts` | Fog color/state update logic | Modify — add sepia tint, update fog state attribute |
| `src/components/HexMapV2/hooks/useFogCulling.ts` | React hook wiring fog to meshes | Modify — write fog state attribute alongside colors |
| `src/components/HexMapV2/HexV2View.tsx` | Debug hex view | Modify — flip fog default |
| `src/components/Game/GameView.tsx` | Game view | Modify — flip fog default, wire toggle |
| `src/debug-bridge.ts` | Debug API on window.__DEBUG | Modify — add toggleFog, setFog |
| `src/debug-bridge.d.ts` | Type declarations for debug bridge | Modify — add toggleFog, setFog types |
| `src/engine/debugCommands.ts` | CLI command parser | Modify — add `fog` command |
| `src/components/Game/debug/CommandTab.tsx` | CLI command executor | Modify — handle `fog` command |
| `public/textures/parchment-512.png` | Parchment texture asset | Create (generated) |
| `src/components/HexMapV2/scene/__tests__/FogCulling.test.ts` | Fog unit tests | Modify — add sepia + fog state tests |
| `src/components/HexMapV2/scene/__tests__/fogShader.test.ts` | Shader constant tests | Create |
| `CLAUDE.md` | Project documentation | Modify — add fog commands |

---

### Task 1: Generate Parchment Texture Asset

**Files:**
- Create: `public/textures/parchment-512.png`

This task creates the pre-baked parchment texture using the image generation tool. The texture must be a seamless-tiling 512x512 dark parchment.

- [ ] **Step 1: Generate the parchment texture**

Use the `mcp__mcp-image__generate_image` tool with this prompt:

```
Seamless tileable dark parchment paper texture, 512x512. Aged weathered paper with visible fiber grain, subtle ink stains, and faint foxing marks. Very dark — the paper sits in the 10-40% brightness range. Color range from #3d3025 to #4a3d2e (dark burnt umber). No text, no writing, no symbols, no drawings. Just the raw paper surface. Macro photography of ancient manuscript paper. Muted desaturated palette. Must tile seamlessly in all directions.
```

Settings: 1:1 aspect ratio, 1K resolution, quality: "quality"

Save the output to `public/textures/parchment-512.png`.

- [ ] **Step 2: Verify the asset exists**

```bash
ls -la public/textures/parchment-512.png
```

Expected: File exists, ~100KB-500KB PNG.

- [ ] **Step 3: Commit**

```bash
git add public/textures/parchment-512.png
git commit -m "asset: add parchment texture for fog of war (512x512)"
```

---

### Task 2: Create Fog Shader Module

**Files:**
- Create: `src/components/HexMapV2/scene/fogShader.ts`
- Create: `src/components/HexMapV2/scene/__tests__/fogShader.test.ts`

New module containing the vertex/fragment shader source strings and parchment fog constants. Separated from HexFillMesh to keep shader code isolated and testable.

- [ ] **Step 1: Write the failing test for fog shader constants**

Create `src/components/HexMapV2/scene/__tests__/fogShader.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  PARCHMENT_FOG_CONSTANTS,
  FOG_VERTEX_SHADER,
  FOG_FRAGMENT_SHADER,
} from '../fogShader';

describe('PARCHMENT_FOG_CONSTANTS', () => {
  it('has parchment texture path', () => {
    expect(PARCHMENT_FOG_CONSTANTS.PARCHMENT_TEXTURE_PATH).toBe('/textures/parchment-512.png');
  });

  it('has sepia strength between 0 and 1', () => {
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_STRENGTH).toBeGreaterThan(0);
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_STRENGTH).toBeLessThanOrEqual(1);
  });

  it('has sepia brightness scale between 0 and 1', () => {
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_BRIGHTNESS_SCALE).toBeGreaterThan(0);
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_BRIGHTNESS_SCALE).toBeLessThanOrEqual(1);
  });

  it('has fog state values for all three states', () => {
    expect(PARCHMENT_FOG_CONSTANTS.FOG_STATE_UNEXPLORED).toBe(0.0);
    expect(PARCHMENT_FOG_CONSTANTS.FOG_STATE_REMEMBERED).toBe(0.5);
    expect(PARCHMENT_FOG_CONSTANTS.FOG_STATE_VISIBLE).toBe(1.0);
  });

  it('has parchment fallback color', () => {
    expect(PARCHMENT_FOG_CONSTANTS.PARCHMENT_FALLBACK_COLOR).toBe('#3d3025');
  });
});

describe('FOG_VERTEX_SHADER', () => {
  it('is a non-empty string containing vFogState varying', () => {
    expect(FOG_VERTEX_SHADER.length).toBeGreaterThan(0);
    expect(FOG_VERTEX_SHADER).toContain('vFogState');
  });

  it('contains instanceMatrix for instanced rendering', () => {
    expect(FOG_VERTEX_SHADER).toContain('instanceMatrix');
  });
});

describe('FOG_FRAGMENT_SHADER', () => {
  it('is a non-empty string containing uParchmentTex uniform', () => {
    expect(FOG_FRAGMENT_SHADER.length).toBeGreaterThan(0);
    expect(FOG_FRAGMENT_SHADER).toContain('uParchmentTex');
  });

  it('contains fog state branching logic', () => {
    expect(FOG_FRAGMENT_SHADER).toContain('vFogState');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/HexMapV2/scene/__tests__/fogShader.test.ts
```

Expected: FAIL — module `fogShader` does not exist yet.

- [ ] **Step 3: Write the fog shader module**

Create `src/components/HexMapV2/scene/fogShader.ts`:

```typescript
/**
 * fogShader.ts — Vertex and fragment shader sources for parchment fog-of-war hex fill.
 *
 * The shader supports three visual states via a per-instance float attribute (aFogState):
 * - 0.0 (unexplored): samples a parchment texture
 * - 0.5 (remembered): uses instance color (sepia-tinted CPU-side)
 * - 1.0 (visible): uses instance color (full terrain color)
 *
 * NFP #1: All magic numbers are named constants in PARCHMENT_FOG_CONSTANTS.
 * NFP #4: Fail-soft — if parchment texture fails to load, shader uses fallback color uniform.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const PARCHMENT_FOG_CONSTANTS = {
  /** Path to the pre-baked parchment texture asset. */
  PARCHMENT_TEXTURE_PATH: '/textures/parchment-512.png',
  /** Blend factor for sepia tint: 0 = original color, 1 = full sepia. */
  SEPIA_STRENGTH: 0.7,
  /** Brightness multiplier for remembered hexes (slight dimming vs visible). */
  SEPIA_BRIGHTNESS_SCALE: 0.85,
  /** Per-instance fog state value: unexplored (parchment texture). */
  FOG_STATE_UNEXPLORED: 0.0,
  /** Per-instance fog state value: remembered (sepia-tinted terrain). */
  FOG_STATE_REMEMBERED: 0.5,
  /** Per-instance fog state value: visible (full terrain color). */
  FOG_STATE_VISIBLE: 1.0,
  /** Solid color fallback if parchment texture fails to load. */
  PARCHMENT_FALLBACK_COLOR: '#3d3025',
} as const;

// ── Vertex Shader ────────────────────────────────────────────────────────────

/**
 * Vertex shader for parchment fog hex fill.
 *
 * Reads per-instance: instanceMatrix (position), instanceColor (terrain color),
 * aFogState (fog state float). Passes UVs, color, and fog state to fragment shader.
 *
 * Uses Three.js built-in uniforms: modelViewMatrix, projectionMatrix.
 * Uses Three.js built-in attributes: position, uv.
 * InstancedMesh provides: instanceMatrix, instanceColor (via USE_INSTANCING).
 */
export const FOG_VERTEX_SHADER = /* glsl */ `
  attribute float aFogState;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vFogState;

  void main() {
    vUv = uv;
    vColor = instanceColor;
    vFogState = aFogState;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ── Fragment Shader ──────────────────────────────────────────────────────────

/**
 * Fragment shader for parchment fog hex fill.
 *
 * Uniforms:
 * - uParchmentTex: sampler2D — the tiling parchment texture
 * - uParchmentFallback: vec3 — solid color fallback if texture not loaded
 * - uHasTexture: float — 1.0 if texture is loaded, 0.0 if using fallback
 *
 * Branching on vFogState:
 * - < 0.25 → unexplored: sample parchment texture (or fallback color)
 * - >= 0.25 → remembered/visible: use instance color (sepia applied CPU-side)
 */
export const FOG_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uParchmentTex;
  uniform vec3 uParchmentFallback;
  uniform float uHasTexture;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vFogState;

  void main() {
    if (vFogState < 0.25) {
      // Unexplored: parchment texture or solid fallback
      if (uHasTexture > 0.5) {
        gl_FragColor = texture2D(uParchmentTex, vUv);
      } else {
        gl_FragColor = vec4(uParchmentFallback, 1.0);
      }
    } else {
      // Remembered (0.5) or Visible (1.0): instance color
      gl_FragColor = vec4(vColor, 1.0);
    }
  }
`;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/HexMapV2/scene/__tests__/fogShader.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/HexMapV2/scene/fogShader.ts src/components/HexMapV2/scene/__tests__/fogShader.test.ts
git commit -m "feat(fog): add parchment fog shader module with constants and GLSL sources"
```

---

### Task 3: Add UVs to Hex Geometry

**Files:**
- Modify: `src/components/HexMapV2/scene/HexFillMesh.ts` (function `buildHexGeometry`, lines 39-55)

Add UV coordinates to the hex BufferGeometry so the fragment shader can sample the parchment texture. Each vertex maps to 0-1 UV space based on its position relative to the hex center.

- [ ] **Step 1: Add UV attribute to buildHexGeometry**

In `src/components/HexMapV2/scene/HexFillMesh.ts`, replace the `buildHexGeometry` function (lines 39-55):

```typescript
/**
 * Builds a flat-top hexagonal BufferGeometry with the given radius.
 * Constructed as 6 triangles fanning from the center.
 * Angle formula: angle_i = 60deg * i (flat-top: first vertex at 0deg = rightmost).
 *
 * Includes UV coordinates mapping each vertex to 0-1 space for texture sampling.
 * Center = (0.5, 0.5), vertices mapped by: u = 0.5 + x/(2*size), v = 0.5 + y/(2*size).
 */
export function buildHexGeometry(size: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < 6; i++) {
    const a0 = (Math.PI / 180) * (60 * i);
    const a1 = (Math.PI / 180) * (60 * ((i + 1) % 6));

    const x0 = size * Math.cos(a0);
    const y0 = size * Math.sin(a0);
    const x1 = size * Math.cos(a1);
    const y1 = size * Math.sin(a1);

    // Triangle: center -> v[i] -> v[i+1]
    positions.push(0, 0, 0);
    positions.push(x0, y0, 0);
    positions.push(x1, y1, 0);

    // UVs: map position to 0-1 range (center = 0.5, 0.5)
    const invDiam = 1 / (2 * size);
    uvs.push(0.5, 0.5);                               // center
    uvs.push(0.5 + x0 * invDiam, 0.5 + y0 * invDiam); // vertex i
    uvs.push(0.5 + x1 * invDiam, 0.5 + y1 * invDiam); // vertex i+1
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geo;
}
```

- [ ] **Step 2: Run existing tests to verify no regression**

```bash
npx vitest run src/components/HexMapV2/scene/__tests__/FogCulling.test.ts
```

Expected: All existing tests still PASS. (buildHexGeometry is not directly tested but is used by createHexFillMesh which the fog tests exercise indirectly.)

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/HexMapV2/scene/HexFillMesh.ts
git commit -m "feat(fog): add UV coordinates to hex geometry for texture sampling"
```

---

### Task 4: Replace MeshBasicMaterial with ShaderMaterial

**Files:**
- Modify: `src/components/HexMapV2/scene/HexFillMesh.ts` (function `createHexFillMesh`, lines 73-154)

Replace `MeshBasicMaterial` on land and water meshes with the custom `ShaderMaterial` from fogShader.ts. Add the `aFogState` InstancedBufferAttribute to both meshes.

- [ ] **Step 1: Add imports at top of HexFillMesh.ts**

Add to the imports section at the top of `src/components/HexMapV2/scene/HexFillMesh.ts`:

```typescript
import {
  PARCHMENT_FOG_CONSTANTS,
  FOG_VERTEX_SHADER,
  FOG_FRAGMENT_SHADER,
} from './fogShader';
```

- [ ] **Step 2: Add a helper to create the parchment ShaderMaterial**

Add this function after `buildHexGeometry` and before `createHexFillMesh` in `HexFillMesh.ts`:

```typescript
/**
 * Creates the ShaderMaterial for parchment fog hex fill.
 * Accepts an optional parchment texture — if null, the shader uses a solid fallback color.
 *
 * NFP #4: Fail-soft — null texture → solid parchment color fallback.
 */
export function createFogHexMaterial(parchmentTexture: THREE.Texture | null): THREE.ShaderMaterial {
  const fallbackColor = new THREE.Color(PARCHMENT_FOG_CONSTANTS.PARCHMENT_FALLBACK_COLOR);
  return new THREE.ShaderMaterial({
    uniforms: {
      uParchmentTex: { value: parchmentTexture },
      uParchmentFallback: { value: fallbackColor },
      uHasTexture: { value: parchmentTexture ? 1.0 : 0.0 },
    },
    vertexShader: FOG_VERTEX_SHADER,
    fragmentShader: FOG_FRAGMENT_SHADER,
    // Required for InstancedMesh instanceColor to work with custom shaders
    // Three.js injects the instanceColor attribute when this is true
  });
}
```

- [ ] **Step 3: Update createHexFillMesh to accept texture and use ShaderMaterial**

Update the `HexFillMeshResult` interface to include fog state arrays, and update `createHexFillMesh` signature and body.

First, update the interface (lines 25-32):

```typescript
/**
 * Result of createHexFillMesh — two InstancedMeshes for land and water.
 * Land mesh uses stencil testing (only renders where stencil buffer = 1, written by CoastlineMesh).
 * Water mesh renders normally as full hexagonal shapes.
 */
export interface HexFillMeshResult {
  landMesh: THREE.InstancedMesh;
  waterMesh: THREE.InstancedMesh;
  /** Global tile index (into tiles[]) for each land mesh instance */
  landTileIndices: number[];
  /** Global tile index (into tiles[]) for each water mesh instance */
  waterTileIndices: number[];
  /** Per-instance fog state buffer for land mesh */
  landFogState: Float32Array;
  /** Per-instance fog state buffer for water mesh */
  waterFogState: Float32Array;
}
```

Then update `createHexFillMesh` — add `parchmentTexture` parameter and replace material creation:

```typescript
export function createHexFillMesh(
  tiles: HexTile[],
  seed: number,
  lakeIds?: Int16Array,
  parchmentTexture?: THREE.Texture | null,
): HexFillMeshResult {
  const geo = buildHexGeometry(HEX_CONSTANTS.HEX_SIZE);

  // First pass: classify each tile as land or water
  const landTileIndices: number[] = [];
  const waterTileIndices: number[] = [];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const lakeId = lakeIds ? lakeIds[i] : -1;
    const isWater = isWaterTerrain(tile.terrain) || (lakeIds !== undefined && lakeId >= 0);
    if (isWater) {
      waterTileIndices.push(i);
    } else {
      landTileIndices.push(i);
    }
  }

  // Create ShaderMaterial (replaces MeshBasicMaterial)
  const landMat = createFogHexMaterial(parchmentTexture ?? null);
  const waterMat = createFogHexMaterial(parchmentTexture ?? null);

  const landMesh = new THREE.InstancedMesh(geo, landMat, landTileIndices.length);
  landMesh.renderOrder = RENDER_ORDER.HEX_FILL;
  landMesh.frustumCulled = true;

  const waterMesh = new THREE.InstancedMesh(geo, waterMat, waterTileIndices.length);
  waterMesh.renderOrder = RENDER_ORDER.HEX_FILL;
  waterMesh.frustumCulled = true;

  // Create per-instance fog state buffers (default: visible = 1.0)
  const landFogState = new Float32Array(landTileIndices.length).fill(
    PARCHMENT_FOG_CONSTANTS.FOG_STATE_VISIBLE,
  );
  const waterFogState = new Float32Array(waterTileIndices.length).fill(
    PARCHMENT_FOG_CONSTANTS.FOG_STATE_VISIBLE,
  );

  // Attach fog state as instanced buffer attribute
  landMesh.geometry.setAttribute(
    'aFogState',
    new THREE.InstancedBufferAttribute(landFogState, 1),
  );
  waterMesh.geometry.setAttribute(
    'aFogState',
    new THREE.InstancedBufferAttribute(waterFogState, 1),
  );

  const matrix = new THREE.Matrix4();
  const color  = new THREE.Color();

  // Populate land mesh instances
  for (let i = 0; i < landTileIndices.length; i++) {
    const globalIdx = landTileIndices[i];
    const tile = tiles[globalIdx];
    const { x, y } = hexToWorld(tile.coord, HEX_CONSTANTS.HEX_SIZE);
    matrix.setPosition(x, y, 0);
    landMesh.setMatrixAt(i, matrix);

    const lakeId = lakeIds ? lakeIds[globalIdx] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    landMesh.setColorAt(i, color);
  }

  // Populate water mesh instances
  for (let i = 0; i < waterTileIndices.length; i++) {
    const globalIdx = waterTileIndices[i];
    const tile = tiles[globalIdx];
    const { x, y } = hexToWorld(tile.coord, HEX_CONSTANTS.HEX_SIZE);
    matrix.setPosition(x, y, 0);
    waterMesh.setMatrixAt(i, matrix);

    const lakeId = lakeIds ? lakeIds[globalIdx] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
      elevation: tile.geoParams.elevation,
      lakeId,
    });
    color.setRGB(r, g, b);
    waterMesh.setColorAt(i, color);
  }

  landMesh.instanceMatrix.needsUpdate = true;
  if (landMesh.instanceColor) landMesh.instanceColor.needsUpdate = true;

  waterMesh.instanceMatrix.needsUpdate = true;
  if (waterMesh.instanceColor) waterMesh.instanceColor.needsUpdate = true;

  return { landMesh, waterMesh, landTileIndices, waterTileIndices, landFogState, waterFogState };
}
```

- [ ] **Step 4: Update updateHexColors to match new interface**

The `updateHexColors` function (lines 160-195) doesn't change — it only touches instance colors, not fog state. But verify it still compiles.

- [ ] **Step 5: Fix all call sites of createHexFillMesh**

Search for all callers of `createHexFillMesh` — they need to handle the new `parchmentTexture` parameter (optional, so existing calls should still compile) and the new `landFogState`/`waterFogState` fields in the result.

```bash
grep -rn "createHexFillMesh" src/ --include="*.ts" --include="*.tsx"
```

Update each call site to destructure the new fields if needed. The parameter is optional so existing calls won't break, but callers that destructure the result may need updating.

- [ ] **Step 6: Run type check**

```bash
npx tsc --noEmit
```

Expected: Clean. Fix any type errors from callers not expecting new result fields.

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS. The FogCulling tests use `makeMeshMock()` which doesn't exercise the real material, so they should be unaffected.

- [ ] **Step 8: Commit**

```bash
git add src/components/HexMapV2/scene/HexFillMesh.ts
git commit -m "feat(fog): replace MeshBasicMaterial with ShaderMaterial, add aFogState attribute"
```

---

### Task 5: Add Sepia Tint Logic to FogCulling

**Files:**
- Modify: `src/components/HexMapV2/scene/FogCulling.ts` (add sepia function, update updateFogColors)
- Modify: `src/components/HexMapV2/scene/__tests__/FogCulling.test.ts` (add sepia tests)

Add a `toSepia()` color transform function and update `updateFogColors()` to apply sepia tint to remembered hexes and write the `aFogState` attribute.

- [ ] **Step 1: Write the failing sepia tint tests**

Add to `src/components/HexMapV2/scene/__tests__/FogCulling.test.ts`, after the existing `updateFogColors` describe block:

```typescript
import { toSepia } from '../FogCulling';

describe('toSepia', () => {
  it('returns an RGB triple in [0,1] range', () => {
    const [r, g, b] = toSepia(0.5, 0.3, 0.2);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThanOrEqual(1);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThanOrEqual(1);
  });

  it('clamps values that would exceed 1.0', () => {
    // Pure white input — sepia matrix can produce >1.0 before clamping
    const [r, g, b] = toSepia(1.0, 1.0, 1.0);
    expect(r).toBeLessThanOrEqual(1);
    expect(g).toBeLessThanOrEqual(1);
    expect(b).toBeLessThanOrEqual(1);
  });

  it('produces warmer (higher r, lower b) output than input', () => {
    const [r, , b] = toSepia(0.4, 0.4, 0.4);
    // Sepia shifts toward warm — red channel should be >= blue channel
    expect(r).toBeGreaterThanOrEqual(b);
  });

  it('is deterministic — same input produces same output', () => {
    const a = toSepia(0.3, 0.5, 0.2);
    const b = toSepia(0.3, 0.5, 0.2);
    expect(a).toEqual(b);
  });

  it('applies brightness scale — output is dimmer than full sepia', () => {
    const [r, g, b] = toSepia(0.5, 0.5, 0.5);
    // With SEPIA_BRIGHTNESS_SCALE = 0.85, result should be < pure sepia
    // Pure sepia of (0.5,0.5,0.5): R'=0.676, G'=0.601, B'=0.469
    // After strength blend (0.7) and brightness (0.85):
    // Result should be noticeably less than 0.676
    expect(r).toBeLessThan(0.65);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/HexMapV2/scene/__tests__/FogCulling.test.ts
```

Expected: FAIL — `toSepia` is not exported from FogCulling.

- [ ] **Step 3: Add toSepia function to FogCulling.ts**

Add after the `_restoreColor` declaration (line 55) in `src/components/HexMapV2/scene/FogCulling.ts`:

```typescript
import { PARCHMENT_FOG_CONSTANTS } from './fogShader';

// ── Sepia Tint ──────────────────────────────────────────────────────────────

/**
 * Converts an RGB color to sepia-tinted version for remembered hexes.
 * Uses the standard photographic sepia matrix, blended with original color
 * at SEPIA_STRENGTH, then dimmed by SEPIA_BRIGHTNESS_SCALE.
 *
 * NFP #1: Strength and brightness constants are in PARCHMENT_FOG_CONSTANTS.
 * NFP #3: Pure function — deterministic, no side effects.
 *
 * @param r - Red channel (0-1)
 * @param g - Green channel (0-1)
 * @param b - Blue channel (0-1)
 * @returns [r, g, b] sepia-tinted color, each in [0, 1]
 */
export function toSepia(r: number, g: number, b: number): [number, number, number] {
  const { SEPIA_STRENGTH, SEPIA_BRIGHTNESS_SCALE } = PARCHMENT_FOG_CONSTANTS;

  // Standard sepia matrix
  const sr = Math.min(1, r * 0.393 + g * 0.769 + b * 0.189);
  const sg = Math.min(1, r * 0.349 + g * 0.686 + b * 0.168);
  const sb = Math.min(1, r * 0.272 + g * 0.534 + b * 0.131);

  // Blend: lerp(original, sepia, strength) * brightness
  const outR = (r + (sr - r) * SEPIA_STRENGTH) * SEPIA_BRIGHTNESS_SCALE;
  const outG = (g + (sg - g) * SEPIA_STRENGTH) * SEPIA_BRIGHTNESS_SCALE;
  const outB = (b + (sb - b) * SEPIA_STRENGTH) * SEPIA_BRIGHTNESS_SCALE;

  return [outR, outG, outB];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/HexMapV2/scene/__tests__/FogCulling.test.ts
```

Expected: All tests PASS (existing + new sepia tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/HexMapV2/scene/FogCulling.ts src/components/HexMapV2/scene/__tests__/FogCulling.test.ts
git commit -m "feat(fog): add sepia tint transform for remembered hex state"
```

---

### Task 6: Update useFogCulling to Write Fog State + Sepia Colors

**Files:**
- Modify: `src/components/HexMapV2/hooks/useFogCulling.ts`

Update the fog culling hook to:
1. Write `aFogState` attribute values alongside instance colors
2. Apply sepia tint to remembered hex colors instead of using the original color

- [ ] **Step 1: Update UseFogCullingParams interface**

In `src/components/HexMapV2/hooks/useFogCulling.ts`, add fog state refs to the params interface:

```typescript
export interface UseFogCullingParams {
  visibilityMap: VisibilityMap | undefined;
  fogEnabled: boolean;
  landMesh: React.MutableRefObject<THREE.InstancedMesh | null>;
  waterMesh: React.MutableRefObject<THREE.InstancedMesh | null>;
  globalToMeshMap: React.MutableRefObject<Map<number, { mesh: THREE.InstancedMesh; instanceIdx: number }> | null>;
  originalColors: React.MutableRefObject<Float32Array | null>;
  tileIndexByKey: React.MutableRefObject<Map<string, number> | null>;
  signifierGroup: React.MutableRefObject<THREE.Group | null>;
  locationGroup: React.MutableRefObject<THREE.Group | null>;
  /** Per-instance fog state buffer for land mesh (from HexFillMeshResult) */
  landFogState: React.MutableRefObject<Float32Array | null>;
  /** Per-instance fog state buffer for water mesh (from HexFillMeshResult) */
  waterFogState: React.MutableRefObject<Float32Array | null>;
}
```

- [ ] **Step 2: Update the hook body to write fog state and sepia colors**

Add the import at the top:

```typescript
import { toSepia } from '../scene/FogCulling';
import { PARCHMENT_FOG_CONSTANTS } from '../scene/fogShader';
```

Replace the fog color application block (lines 90-111) inside the `useEffect`:

```typescript
    // Apply fog state + colors to both meshes
    const { FOG_STATE_UNEXPLORED, FOG_STATE_REMEMBERED, FOG_STATE_VISIBLE } = PARCHMENT_FOG_CONSTANTS;
    const parchmentFallback = new THREE.Color(PARCHMENT_FOG_CONSTANTS.PARCHMENT_FALLBACK_COLOR);

    for (const [key, hexVis] of visibilityMap) {
      const idx = indexByKey.get(key);
      if (idx === undefined) continue;
      const entry = meshMap.get(idx);
      if (!entry) continue;

      if (hexVis.state === 'unexplored') {
        // Parchment fallback color (shader will use texture, but set color for fail-soft)
        entry.mesh.setColorAt(entry.instanceIdx, parchmentFallback);
        // Write fog state
        setFogStateForInstance(entry, idx, FOG_STATE_UNEXPLORED, landFogState.current, waterFogState.current, land, water);
      } else if (hexVis.state === 'remembered') {
        // Sepia-tinted terrain color
        const r = colors[idx * 3 + 0];
        const g = colors[idx * 3 + 1];
        const b = colors[idx * 3 + 2];
        const [sr, sg, sb] = toSepia(r, g, b);
        color.setRGB(sr, sg, sb, THREE.SRGBColorSpace);
        entry.mesh.setColorAt(entry.instanceIdx, color);
        setFogStateForInstance(entry, idx, FOG_STATE_REMEMBERED, landFogState.current, waterFogState.current, land, water);
      } else {
        // Visible: full terrain color
        color.setRGB(
          colors[idx * 3 + 0],
          colors[idx * 3 + 1],
          colors[idx * 3 + 2],
          THREE.SRGBColorSpace,
        );
        entry.mesh.setColorAt(entry.instanceIdx, color);
        setFogStateForInstance(entry, idx, FOG_STATE_VISIBLE, landFogState.current, waterFogState.current, land, water);
      }
    }

    if (land.instanceColor) land.instanceColor.needsUpdate = true;
    if (water.instanceColor) water.instanceColor.needsUpdate = true;

    // Mark fog state attributes for GPU upload
    const landFogAttr = land.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
    const waterFogAttr = water.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
    if (landFogAttr) landFogAttr.needsUpdate = true;
    if (waterFogAttr) waterFogAttr.needsUpdate = true;
```

And add a helper function before the hook export:

```typescript
/**
 * Writes fog state value to the correct mesh's fog state buffer.
 * Determines which mesh (land vs water) owns this instance and writes to the correct buffer index.
 */
function setFogStateForInstance(
  entry: { mesh: THREE.InstancedMesh; instanceIdx: number },
  _globalIdx: number,
  fogState: number,
  landFogState: Float32Array | null,
  waterFogState: Float32Array | null,
  landMesh: THREE.InstancedMesh,
  waterMesh: THREE.InstancedMesh,
): void {
  if (entry.mesh === landMesh && landFogState) {
    landFogState[entry.instanceIdx] = fogState;
  } else if (entry.mesh === waterMesh && waterFogState) {
    waterFogState[entry.instanceIdx] = fogState;
  }
}
```

- [ ] **Step 3: Update the fog-disabled restore block**

Also update the fog-disabled block (lines 63-88) to reset fog state to visible:

```typescript
    if (!visibilityMap || !fogEnabled) {
      // Fog disabled: restore all instance colors and fog states to defaults
      for (let i = 0; i < colors.length / 3; i++) {
        const entry = meshMap.get(i);
        if (!entry) continue;
        color.setRGB(
          colors[i * 3 + 0],
          colors[i * 3 + 1],
          colors[i * 3 + 2],
          THREE.SRGBColorSpace,
        );
        entry.mesh.setColorAt(entry.instanceIdx, color);
        setFogStateForInstance(entry, i, PARCHMENT_FOG_CONSTANTS.FOG_STATE_VISIBLE, landFogState.current, waterFogState.current, land, water);
      }
      if (land.instanceColor) land.instanceColor.needsUpdate = true;
      if (water.instanceColor) water.instanceColor.needsUpdate = true;

      // Mark fog state attributes for upload
      const landFogAttr = land.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
      const waterFogAttr = water.geometry.getAttribute('aFogState') as THREE.InstancedBufferAttribute | undefined;
      if (landFogAttr) landFogAttr.needsUpdate = true;
      if (waterFogAttr) waterFogAttr.needsUpdate = true;

      // Reset signifier fog alphas to fully visible
      const sigGroupReset = signifierGroup.current as (THREE.Group & { meta?: SignifierGroupMeta }) | null;
      if (sigGroupReset?.meta) {
        for (const hexKey of sigGroupReset.meta.hexInstanceMap.keys()) {
          sigGroupReset.meta.setFogAlpha(hexKey, 1.0);
        }
        sigGroupReset.meta.flushFogAlpha();
      }
      return;
    }
```

- [ ] **Step 4: Update the useEffect dependency list**

Add `landFogState` and `waterFogState` to the destructuring in the hook params.

- [ ] **Step 5: Run type check**

```bash
npx tsc --noEmit
```

Expected: Clean, or errors from callers of `useFogCulling` not passing the new params (fix in next task).

- [ ] **Step 6: Commit**

```bash
git add src/components/HexMapV2/hooks/useFogCulling.ts
git commit -m "feat(fog): update useFogCulling to write fog state attribute and sepia-tinted colors"
```

---

### Task 7: Wire Parchment Texture and Fog State into HexMapV2 + GameView

**Files:**
- Modify: `src/components/HexMapV2/HexV2View.tsx`
- Modify: `src/components/Game/GameView.tsx`

Load the parchment texture, pass it to `createHexFillMesh`, wire the fog state refs to `useFogCulling`, and flip the fog default.

- [ ] **Step 1: Update HexV2View.tsx — flip fog default and load texture**

In `src/components/HexMapV2/HexV2View.tsx`, change the fog default from off to on:

Replace (lines 14-18):
```typescript
const fogEnabled = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).has('fog')
  : false;
```

With:
```typescript
// Fog is ON by default. Use ?nofog to disable for testing.
const fogEnabled = typeof window !== 'undefined'
  ? !new URLSearchParams(window.location.search).has('nofog')
  : true;
```

- [ ] **Step 2: Update GameView.tsx — flip fog default**

In `src/components/Game/GameView.tsx`, find the fogDisabled state initialization and flip it:

Replace:
```typescript
const [fogDisabled, setFogDisabled] = useState(
  () => !new URLSearchParams(window.location.search).has('fog')
);
```

With:
```typescript
const [fogDisabled, setFogDisabled] = useState(
  () => new URLSearchParams(window.location.search).has('nofog')
);
```

- [ ] **Step 3: Load parchment texture in scene setup**

Find where `createHexFillMesh` is called in HexMapV2 / GameView and add texture loading before it. The texture should be loaded once at scene init using `THREE.TextureLoader`.

Add near the top of the scene setup:

```typescript
import { PARCHMENT_FOG_CONSTANTS } from './scene/fogShader';

// Load parchment texture (once, at scene init)
const parchmentTextureRef = useRef<THREE.Texture | null>(null);
useEffect(() => {
  const loader = new THREE.TextureLoader();
  loader.load(
    PARCHMENT_FOG_CONSTANTS.PARCHMENT_TEXTURE_PATH,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      parchmentTextureRef.current = tex;
      // Update material uniforms if meshes already exist
      // (texture may load after mesh creation)
      updateParchmentUniform(tex);
    },
    undefined, // onProgress (unused)
    () => {
      // Fail-soft: texture load failed, shader uses fallback color
      console.warn('[FoW] Parchment texture failed to load, using solid fallback color');
    },
  );
}, []);
```

- [ ] **Step 4: Pass parchmentTexture to createHexFillMesh calls**

Update the `createHexFillMesh(tiles, seed, lakeIds)` call to:
```typescript
createHexFillMesh(tiles, seed, lakeIds, parchmentTextureRef.current)
```

- [ ] **Step 5: Wire landFogState/waterFogState refs to useFogCulling**

Add refs for the fog state buffers and pass them:

```typescript
const landFogStateRef = useRef<Float32Array | null>(null);
const waterFogStateRef = useRef<Float32Array | null>(null);

// After createHexFillMesh returns:
landFogStateRef.current = result.landFogState;
waterFogStateRef.current = result.waterFogState;
```

Pass to `useFogCulling`:
```typescript
useFogCulling({
  ...existingParams,
  landFogState: landFogStateRef,
  waterFogState: waterFogStateRef,
});
```

- [ ] **Step 6: Run type check + build**

```bash
npx tsc --noEmit && npx vite build
```

Expected: Clean type check and build.

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/HexMapV2/HexV2View.tsx src/components/Game/GameView.tsx
git commit -m "feat(fog): wire parchment texture and fog state into renderer, fog on by default"
```

---

### Task 8: Add Debug Bridge toggleFog / setFog

**Files:**
- Modify: `src/debug-bridge.ts`
- Modify: `src/debug-bridge.d.ts`

Add `toggleFog()` and `setFog(enabled)` methods to `window.__DEBUG`. GameView registers a callback that updates its `fogDisabled` state.

- [ ] **Step 1: Add types to debug-bridge.d.ts**

Add to the `DebugBridge` interface in `src/debug-bridge.d.ts`:

```typescript
/** Toggle fog of war on/off. Returns the new enabled state. */
toggleFog(): boolean;
/** Explicitly set fog of war enabled state. */
setFog(enabled: boolean): void;
/** @internal GameView registers its fog toggle callback here */
_registerFogToggle(fn: (enabled?: boolean) => boolean): void;
```

- [ ] **Step 2: Add implementation to debug-bridge.ts**

Add before the closing of `window.__DEBUG = { ... }` in `src/debug-bridge.ts`:

```typescript
  // Fog state provider — registered by GameView
  let _fogToggle: ((enabled?: boolean) => boolean) | null = null;
```

And inside the `window.__DEBUG` object:

```typescript
    toggleFog: () => _fogToggle?.() ?? false,
    setFog: (enabled: boolean) => { _fogToggle?.(enabled); },
    _registerFogToggle: (fn: (enabled?: boolean) => boolean) => { _fogToggle = fn; },
```

- [ ] **Step 3: Register fog toggle from GameView**

In `src/components/Game/GameView.tsx`, add a registration effect:

```typescript
useEffect(() => {
  if (import.meta.env.DEV && window.__DEBUG) {
    window.__DEBUG._registerFogToggle((enabled?: boolean) => {
      if (enabled === undefined) {
        // Toggle
        setFogDisabled(prev => !prev);
        return fogDisabled; // returns new state (inverted)
      }
      setFogDisabled(!enabled);
      return enabled;
    });
  }
}, [fogDisabled]);
```

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```

Expected: Clean.

- [ ] **Step 5: Commit**

```bash
git add src/debug-bridge.ts src/debug-bridge.d.ts src/components/Game/GameView.tsx
git commit -m "feat(fog): add toggleFog/setFog to debug bridge"
```

---

### Task 9: Add Debug CLI `fog` Command

**Files:**
- Modify: `src/engine/debugCommands.ts`
- Modify: `src/components/Game/debug/CommandTab.tsx`

Add `fog` command to the in-game debug CLI: `fog` (toggle), `fog on`, `fog off`.

- [ ] **Step 1: Add fog command to parser**

In `src/engine/debugCommands.ts`, add a new command kind to the `ParsedDebugCommand` union type:

```typescript
| { kind: 'fog'; mode: 'toggle' | 'on' | 'off' }
```

Add parsing logic in `parseDebugCommand()` for the `fog` token:

```typescript
    case 'fog': {
      const mode = tokens[1]?.toLowerCase();
      if (mode === 'on') return { kind: 'fog', mode: 'on' };
      if (mode === 'off') return { kind: 'fog', mode: 'off' };
      return { kind: 'fog', mode: 'toggle' };
    }
```

- [ ] **Step 2: Add execution handler in CommandTab.tsx**

In `src/components/Game/debug/CommandTab.tsx`, add a case for `fog` in `executeCommand()`:

```typescript
      case 'fog': {
        if (!window.__DEBUG) return 'Debug bridge not available';
        if (parsed.mode === 'toggle') {
          const newState = window.__DEBUG.toggleFog();
          return `Fog of war: ${newState ? 'ON' : 'OFF'}`;
        }
        const enabled = parsed.mode === 'on';
        window.__DEBUG.setFog(enabled);
        return `Fog of war: ${enabled ? 'ON' : 'OFF'}`;
      }
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add src/engine/debugCommands.ts src/components/Game/debug/CommandTab.tsx
git commit -m "feat(fog): add 'fog' debug CLI command for toggling fog of war"
```

---

### Task 10: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

Document the new `fog` CLI command and `toggleFog()`/`setFog()` debug bridge methods.

- [ ] **Step 1: Add fog to CLI commands**

In `CLAUDE.md`, find the "Key commands at the `fws>` prompt" list and add:

```
`fog` (toggle fog of war on/off), `fog on`, `fog off`
```

- [ ] **Step 2: Add fog to Debug Bridge section**

In the `window.__DEBUG` code block in CLAUDE.md, add:

```javascript
// Fog of war control:
window.__DEBUG.toggleFog()                // toggle fog on/off, returns new state
window.__DEBUG.setFog(true)               // explicitly enable fog
window.__DEBUG.setFog(false)              // explicitly disable fog
```

- [ ] **Step 3: Update the URL param table**

In the "Dev Quick-Start URLs" table, update the fog entry:

Replace `?fog` row with:
```
| `?nofog` | Disable fog of war (fog is ON by default). Combinable: `?view=game&nofog` |
```

Remove the old `?fog` row if present.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add fog toggle commands to CLAUDE.md debug reference"
```

---

### Task 11: Final Integration Test + Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: Clean.

- [ ] **Step 3: Production build**

```bash
npx vite build
```

Expected: Build succeeds (confirms Vercel will deploy).

- [ ] **Step 4: Visual verification**

Start the dev server and verify in browser at `?view=game`:
1. Fog is ON by default — unexplored hexes show parchment texture (or fallback color)
2. As agents move, parchment reveals terrain underneath
3. Hexes that lose LOS transition to sepia-tinted terrain
4. `?view=game&nofog` disables fog — all hexes show full color
5. Open debug panel (F1), type `fog` — fog toggles off/on
6. No grid lines visible on unexplored (parchment) hexes
7. ActionDrawer cards render normally on top of fogged areas

- [ ] **Step 5: Commit any fixes from visual verification**

If any issues found during visual verification, fix and commit.

---

## Summary

| Task | What | Commit message |
|------|------|---------------|
| 1 | Parchment texture asset | `asset: add parchment texture for fog of war (512x512)` |
| 2 | Fog shader module (GLSL + constants) | `feat(fog): add parchment fog shader module` |
| 3 | Add UVs to hex geometry | `feat(fog): add UV coordinates to hex geometry` |
| 4 | ShaderMaterial + aFogState attribute | `feat(fog): replace MeshBasicMaterial with ShaderMaterial` |
| 5 | Sepia tint logic | `feat(fog): add sepia tint transform for remembered hex state` |
| 6 | useFogCulling writes fog state + sepia | `feat(fog): update useFogCulling for fog state and sepia` |
| 7 | Wire texture + fog state into views | `feat(fog): wire parchment texture, fog on by default` |
| 8 | Debug bridge toggleFog/setFog | `feat(fog): add toggleFog/setFog to debug bridge` |
| 9 | Debug CLI `fog` command | `feat(fog): add 'fog' debug CLI command` |
| 10 | CLAUDE.md docs | `docs: add fog toggle commands to CLAUDE.md` |
| 11 | Final verification | (fixes only if needed) |
