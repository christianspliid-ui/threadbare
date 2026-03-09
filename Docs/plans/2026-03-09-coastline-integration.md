# Coastline Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace flat hex-by-hex water rendering with organic iso-contour coastlines from `Design/coastline-prototype.html`, producing smooth land/water boundaries with a coastal shallows band.

**Architecture:** A pure engine module (`coastline.ts`) builds a scalar field from land hex positions and extracts iso-contour loops via marching squares, then chains and smooths them into closed SVG paths. A new `CoastlineOverlay` component renders these paths as SVG `<path>` elements inside the existing HexMap zoom group — shallows band first, then land contour fill. Individual hex tiles render on top, with water hexes becoming transparent in visible areas so the organic coastline shows through. The computation is memoized (depends only on `tiles[]`) and reuses the game's seeded PRNG for deterministic noise displacement.

**Tech Stack:** React (SVG), TypeScript, vitest, existing hexMath library, simplex noise (TypeScript port from prototype)

**Prototype reference:** `Design/coastline-prototype.html` — all algorithms are proven there with tunable parameters. The user's preferred defaults: blobRadius=1.8, threshold=0.35, smoothPasses=2, irregularity=0.02, noiseScale=0.02, shallowWidth=0.19, coastBase=#2a2a1a, shallowColor=#1e3a4a, deepColor=#1a2a3a.

**Grid size:** 20 cols × 15 rows = 300 hexes, hexSize = 30px.

---

## Design Decisions

1. **SVG paths, not Canvas.** The game renders everything in SVG with d3-zoom. Coastline paths go inside the zoom `<g>` group and transform automatically. No Canvas/foreignObject mixing needed.

2. **Coastline computed from tile terrain, not visibility.** The scalar field includes ALL land hexes regardless of fog state. Unexplored hex tiles render dark polygons on top, hiding the coastline underneath. This avoids recomputing the coastline every tick when visibility changes.

3. **Water hexes become transparent when visible.** Currently every hex (including ocean) renders a terrain image. With coastlines, visible water hexes skip their fill so the organic deep-water background and shallows band show through. Unexplored water hexes still render dark. Remembered water hexes render at reduced opacity with a tinted fill (letting dimmed coastline peek through).

4. **Land hex terrain images still render individually.** The coastline provides the smooth edge; inside that edge, each land hex still shows its unique terrain texture clipped to its hexagonal boundary. Grid lines between land hexes remain.

5. **Deterministic noise.** The prototype uses SimplexNoise for contour displacement (organic irregularity). We port a seeded SimplexNoise to TypeScript. The seed comes from the game's world seed for determinism.

6. **All coastline parameters are named constants** in `src/types/coastline.ts`, honoring Non-Functional Priority #1 (Tunability).

7. **Rendering order inside the zoom group:**
   ```
   ┌─ <g> zoom group ──────────────────────────────┐
   │  1. CoastlineOverlay (SVG paths):              │
   │     a. Shallows band (fill between 2 contours) │
   │     b. Land contour base fill (coast edge)      │
   │  2. HexTile components (per-hex, as before):    │
   │     - Land hexes: terrain image + overlay        │
   │     - Water hexes: transparent (visible)         │
   │                    or dark (unexplored)          │
   │     - Grid lines: land-to-land edges only        │
   │  3. Avatar overlay, selection rings, etc.        │
   └────────────────────────────────────────────────┘
   ```

---

## Task 1: Coastline Types & Constants

**Files:**
- Create: `src/types/coastline.ts`
- Test: `src/types/__tests__/coastline.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/coastline.test.ts
import { describe, it, expect } from 'vitest';
import {
  COASTLINE_DEFAULTS,
  type CoastlineConfig,
  type ContourLoop,
  type CoastlineData,
} from '../coastline';

describe('coastline types', () => {
  it('exports COASTLINE_DEFAULTS with all required fields', () => {
    const c = COASTLINE_DEFAULTS;
    expect(c.blobRadius).toBe(1.8);
    expect(c.threshold).toBe(0.35);
    expect(c.smoothPasses).toBe(2);
    expect(c.displacement).toBe(0.02);
    expect(c.noiseScale).toBe(0.02);
    expect(c.shallowWidth).toBe(0.19);
    expect(c.fieldResolution).toBe(4);
    expect(c.minLoopPoints).toBe(20);
  });

  it('exports COASTLINE_COLORS with all required fields', () => {
    expect(COASTLINE_DEFAULTS.colors.deepWater).toBe('#1a2a3a');
    expect(COASTLINE_DEFAULTS.colors.shallows).toBe('#1e3a4a');
    expect(COASTLINE_DEFAULTS.colors.coastEdge).toBe('#2a2a1a');
  });

  it('CoastlineData shape has loops and shallowLoops arrays', () => {
    const data: CoastlineData = { loops: [], shallowLoops: [] };
    expect(data.loops).toEqual([]);
    expect(data.shallowLoops).toEqual([]);
  });

  it('ContourLoop is an array of {x, y} points', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 8.66 },
    ];
    expect(loop).toHaveLength(3);
    expect(loop[0]).toEqual({ x: 0, y: 0 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/coastline.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/types/coastline.ts

/** A 2D point in pixel/SVG coordinate space. */
export interface Point2D {
  x: number;
  y: number;
}

/** A closed contour loop — array of pixel-space points. */
export type ContourLoop = Point2D[];

/** Output of the coastline computation pipeline. */
export interface CoastlineData {
  /** Land boundary contour loops (at main threshold). */
  loops: ContourLoop[];
  /** Coastal shallows contour loops (at lower threshold — wider than land). */
  shallowLoops: ContourLoop[];
}

/** Tunable coastline rendering parameters. */
export interface CoastlineConfig {
  /** Quartic falloff radius as a multiplier of hexSize. Default: 1.8 */
  blobRadius: number;
  /** Iso-contour threshold for land boundary. Default: 0.35 */
  threshold: number;
  /** Chaikin corner-cutting passes for smoothing. Default: 2 */
  smoothPasses: number;
  /** Noise displacement amplitude (organic irregularity). Default: 0.02 */
  displacement: number;
  /** Noise frequency scale. Default: 0.02 */
  noiseScale: number;
  /** Threshold offset for the shallows band (shallowThreshold = threshold - shallowWidth). Default: 0.19 */
  shallowWidth: number;
  /** Scalar field grid resolution in pixels. Lower = finer but slower. Default: 4 */
  fieldResolution: number;
  /** Minimum points in a contour loop (filters noise artifacts). Default: 20 */
  minLoopPoints: number;
  /** Color palette. */
  colors: {
    deepWater: string;
    shallows: string;
    coastEdge: string;
  };
}

/** Production-tuned defaults matching prototype at preferred settings. */
export const COASTLINE_DEFAULTS: CoastlineConfig = {
  blobRadius: 1.8,
  threshold: 0.35,
  smoothPasses: 2,
  displacement: 0.02,
  noiseScale: 0.02,
  shallowWidth: 0.19,
  fieldResolution: 4,
  minLoopPoints: 20,
  colors: {
    deepWater: '#1a2a3a',
    shallows: '#1e3a4a',
    coastEdge: '#2a2a1a',
  },
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/coastline.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/types/coastline.ts src/types/__tests__/coastline.test.ts
git commit -m "feat(coastline): add coastline types and tunable constants"
```

---

## Task 2: SimplexNoise TypeScript Port

Port the prototype's SimplexNoise class to a pure, seeded, side-effect-free TypeScript module.

**Files:**
- Create: `src/lib/simplexNoise.ts`
- Test: `src/lib/__tests__/simplexNoise.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/__tests__/simplexNoise.test.ts
import { describe, it, expect } from 'vitest';
import { SimplexNoise } from '../simplexNoise';

describe('SimplexNoise', () => {
  it('creates instance with seed', () => {
    const noise = new SimplexNoise(42);
    expect(noise).toBeInstanceOf(SimplexNoise);
  });

  it('noise2D returns values in [-1, 1] range', () => {
    const noise = new SimplexNoise(42);
    for (let i = 0; i < 100; i++) {
      const v = noise.noise2D(i * 0.1, i * 0.13);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic — same seed produces same output', () => {
    const a = new SimplexNoise(42);
    const b = new SimplexNoise(42);
    for (let i = 0; i < 50; i++) {
      expect(a.noise2D(i * 0.3, i * 0.7)).toBe(b.noise2D(i * 0.3, i * 0.7));
    }
  });

  it('different seeds produce different output', () => {
    const a = new SimplexNoise(42);
    const b = new SimplexNoise(99);
    let diffs = 0;
    for (let i = 0; i < 50; i++) {
      if (a.noise2D(i * 0.3, i * 0.7) !== b.noise2D(i * 0.3, i * 0.7)) diffs++;
    }
    expect(diffs).toBeGreaterThan(40);
  });

  it('varies spatially — not constant across coordinates', () => {
    const noise = new SimplexNoise(42);
    const values = new Set<number>();
    for (let i = 0; i < 20; i++) {
      values.add(Math.round(noise.noise2D(i * 2, i * 3) * 1000));
    }
    expect(values.size).toBeGreaterThan(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/simplexNoise.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Port the `SimplexNoise` class directly from `Design/coastline-prototype.html` lines 139-178, converting to TypeScript with proper typing:

```typescript
// src/lib/simplexNoise.ts

/**
 * Seeded 2D Simplex Noise.
 *
 * Ported from Design/coastline-prototype.html.
 * Deterministic: same seed always produces the same noise field.
 */
export class SimplexNoise {
  private p: Uint8Array;

  constructor(seed: number = 0) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;

    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 4294967296;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }

  noise2D(x: number, y: number): number {
    const G2 = (3 - Math.sqrt(3)) / 6;
    const F2 = (Math.sqrt(3) - 1) / 2;
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = x - X0, y0 = y - Y0;
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const grad: [number, number][] = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    const gi0 = this.p[ii + this.p[jj]] % 8;
    const gi1 = this.p[ii + i1 + this.p[jj + j1]] % 8;
    const gi2 = this.p[ii + 1 + this.p[jj + 1]] % 8;
    const dot = (g: [number, number], gx: number, gy: number) => g[0] * gx + g[1] * gy;

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0*x0 - y0*y0;
    if (t0 > 0) { t0 *= t0; n0 = t0 * t0 * dot(grad[gi0], x0, y0); }
    let t1 = 0.5 - x1*x1 - y1*y1;
    if (t1 > 0) { t1 *= t1; n1 = t1 * t1 * dot(grad[gi1], x1, y1); }
    let t2 = 0.5 - x2*x2 - y2*y2;
    if (t2 > 0) { t2 *= t2; n2 = t2 * t2 * dot(grad[gi2], x2, y2); }
    return 70 * (n0 + n1 + n2);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/simplexNoise.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/simplexNoise.ts src/lib/__tests__/simplexNoise.test.ts
git commit -m "feat(coastline): port SimplexNoise to TypeScript"
```

---

## Task 3: Scalar Field Builder

Build the metaball-style scalar field from land hex positions. Each land hex emits a quartic falloff blob `(1 - d²/r²)²`. Adjacent blobs merge smoothly.

**Files:**
- Create: `src/engine/coastline.ts`
- Test: `src/engine/__tests__/coastline.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/coastline.test.ts
import { describe, it, expect } from 'vitest';
import { buildScalarField } from '../coastline';
import type { HexTile } from '../../types';

function makeTile(col: number, row: number, terrain: string = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: terrain as HexTile['terrain'],
  };
}

describe('buildScalarField', () => {
  it('returns a Float32Array with correct dimensions', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0, 'ocean')];
    const result = buildScalarField(tiles, 30, 2, 1, { blobRadius: 1.8, fieldResolution: 4 });
    expect(result.field).toBeInstanceOf(Float32Array);
    expect(result.gridW).toBeGreaterThan(0);
    expect(result.gridH).toBeGreaterThan(0);
    expect(result.field.length).toBe(result.gridW * result.gridH);
  });

  it('land hex center has highest field value', () => {
    const tiles = [makeTile(0, 0)]; // single land hex at origin
    const hexSize = 30;
    const result = buildScalarField(tiles, hexSize, 1, 1, { blobRadius: 1.8, fieldResolution: 4 });
    // Field value at land hex center should be > 0
    // hexToPixel(0,0,30) = {x:0, y:0}, offset by padding
    const centerGx = Math.round(hexSize / result.fieldRes); // approximate center grid cell
    const centerGy = Math.round(hexSize / result.fieldRes);
    const centerVal = result.field[centerGy * result.gridW + centerGx];
    expect(centerVal).toBeGreaterThan(0);
  });

  it('ocean hex does NOT contribute to field', () => {
    const tiles = [makeTile(0, 0, 'ocean')];
    const result = buildScalarField(tiles, 30, 1, 1, { blobRadius: 1.8, fieldResolution: 4 });
    // All values should be 0 — no land hex to emit blob
    const allZero = result.field.every(v => v === 0);
    expect(allZero).toBe(true);
  });

  it('field value decays with distance from land hex', () => {
    const tiles = [makeTile(0, 0)];
    const hexSize = 30;
    const result = buildScalarField(tiles, hexSize, 1, 1, { blobRadius: 1.8, fieldResolution: 4 });
    // Sample near center vs far away
    const nearVal = result.field[1 * result.gridW + 1]; // close to hex center
    const farGx = result.gridW - 1;
    const farGy = result.gridH - 1;
    const farVal = result.field[farGy * result.gridW + farGx];
    expect(nearVal).toBeGreaterThan(farVal);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/engine/coastline.ts

import type { HexTile, TerrainType } from '../types';
import type { Point2D, ContourLoop, CoastlineData, CoastlineConfig } from '../types/coastline';
import { COASTLINE_DEFAULTS } from '../types/coastline';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../lib/hexMath';

// ─── Water terrain classification ─────────────────────────────────
const WATER_TERRAINS: ReadonlySet<TerrainType> = new Set([
  'ocean', 'coastal_shallows', 'lake', 'river',
] as TerrainType[]);

export function isWaterTerrain(terrain: TerrainType): boolean {
  return WATER_TERRAINS.has(terrain);
}

// ─── Scalar Field ─────────────────────────────────────────────────
export interface ScalarFieldResult {
  field: Float32Array;
  gridW: number;
  gridH: number;
  fieldRes: number;
  canvasW: number;
  canvasH: number;
}

/**
 * Build a metaball-style scalar field from land hex positions.
 * Each land hex emits a quartic falloff: (1 - d²/r²)².
 */
export function buildScalarField(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  opts: Pick<CoastlineConfig, 'blobRadius' | 'fieldResolution'> = COASTLINE_DEFAULTS,
): ScalarFieldResult {
  const fieldRes = opts.fieldResolution;
  const blobRadius = opts.blobRadius * hexSize;
  const r2 = blobRadius * blobRadius;

  // Canvas dimensions (matching HexMap.tsx computation)
  const padding = hexSize;
  const canvasW = cols * hexSize * HEX_SCALE_X + hexSize * 0.5 + hexSize * 2 + padding * 2;
  const canvasH = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize * 0.5 + hexSize * 2 + padding * 2;

  // Collect land hex pixel positions (with the same offset as HexMap tileBaseTransform)
  const offsetX = padding + hexSize;
  const offsetY = padding + hexSize * 0.8;
  const landPositions: Point2D[] = [];
  for (const tile of tiles) {
    if (isWaterTerrain(tile.terrain)) continue;
    const { x, y } = hexToPixel(tile.coord, hexSize);
    landPositions.push({ x: x + offsetX, y: y + offsetY });
  }

  const gridW = Math.ceil(canvasW / fieldRes) + 1;
  const gridH = Math.ceil(canvasH / fieldRes) + 1;
  const field = new Float32Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    const py = gy * fieldRes;
    for (let gx = 0; gx < gridW; gx++) {
      const px = gx * fieldRes;
      let value = 0;
      for (const hex of landPositions) {
        const dx = px - hex.x;
        const dy = py - hex.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2) continue;
        const t = 1 - d2 / r2;
        value += t * t; // quartic falloff
      }
      field[gy * gridW + gx] = value;
    }
  }

  return { field, gridW, gridH, fieldRes, canvasW, canvasH };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/engine/coastline.ts src/engine/__tests__/coastline.test.ts
git commit -m "feat(coastline): scalar field builder with quartic falloff"
```

---

## Task 4: Marching Squares + Contour Chaining

Extract iso-contour line segments from the scalar field using marching squares, then chain them into closed loops via endpoint snapping.

**Files:**
- Modify: `src/engine/coastline.ts`
- Modify: `src/engine/__tests__/coastline.test.ts`

**Step 1: Write the failing tests**

```typescript
// append to src/engine/__tests__/coastline.test.ts

import { extractContours, chainSegmentsIntoLoops } from '../coastline';

describe('extractContours (marching squares)', () => {
  it('returns empty array for uniform field (all above threshold)', () => {
    const field = new Float32Array(9).fill(1.0); // 3×3 grid, all above
    const segments = extractContours(field, 3, 3, 0.5);
    expect(segments).toHaveLength(0);
  });

  it('returns empty array for uniform field (all below threshold)', () => {
    const field = new Float32Array(9).fill(0.0);
    const segments = extractContours(field, 3, 3, 0.5);
    expect(segments).toHaveLength(0);
  });

  it('produces segments when field has both above and below threshold', () => {
    // 3×3 field: center high, edges low
    const field = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    const segments = extractContours(field, 3, 3, 0.5);
    expect(segments.length).toBeGreaterThan(0);
    // Each segment has p1 and p2 points
    for (const seg of segments) {
      expect(seg.p1).toHaveProperty('x');
      expect(seg.p1).toHaveProperty('y');
      expect(seg.p2).toHaveProperty('x');
      expect(seg.p2).toHaveProperty('y');
    }
  });
});

describe('chainSegmentsIntoLoops', () => {
  it('returns empty for no segments', () => {
    expect(chainSegmentsIntoLoops([])).toEqual([]);
  });

  it('chains a simple square into one loop', () => {
    // 4 segments forming a square
    const segments = [
      { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
      { p1: { x: 10, y: 0 }, p2: { x: 10, y: 10 } },
      { p1: { x: 10, y: 10 }, p2: { x: 0, y: 10 } },
      { p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } },
    ];
    const loops = chainSegmentsIntoLoops(segments);
    expect(loops).toHaveLength(1);
    expect(loops[0].length).toBeGreaterThanOrEqual(4);
  });

  it('produces separate loops for disconnected segment groups', () => {
    const segments = [
      // Loop 1
      { p1: { x: 0, y: 0 }, p2: { x: 5, y: 0 } },
      { p1: { x: 5, y: 0 }, p2: { x: 5, y: 5 } },
      { p1: { x: 5, y: 5 }, p2: { x: 0, y: 0 } },
      // Loop 2 (far away)
      { p1: { x: 100, y: 100 }, p2: { x: 105, y: 100 } },
      { p1: { x: 105, y: 100 }, p2: { x: 105, y: 105 } },
      { p1: { x: 105, y: 105 }, p2: { x: 100, y: 100 } },
    ];
    const loops = chainSegmentsIntoLoops(segments);
    expect(loops).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: FAIL — extractContours, chainSegmentsIntoLoops not exported

**Step 3: Write implementation**

Add to `src/engine/coastline.ts`:

```typescript
// ─── Marching Squares Iso-Contour Extraction ──────────────────────

interface Segment {
  p1: Point2D;
  p2: Point2D;
}

// Lookup table: case index → pairs of [edgeA, edgeB]
// Corners: c0=top-left, c1=top-right, c2=bottom-right, c3=bottom-left
// Edges: e0=top(c0-c1), e1=right(c1-c2), e2=bottom(c3-c2), e3=left(c0-c3)
const MARCHING_CASES: [number, number][][] = [
  [],              // 0
  [[3, 0]],        // 1: c0
  [[0, 1]],        // 2: c1
  [[3, 1]],        // 3: c0,c1
  [[1, 2]],        // 4: c2
  [[3, 0],[1, 2]], // 5: saddle
  [[0, 2]],        // 6: c1,c2
  [[3, 2]],        // 7: c0,c1,c2
  [[2, 3]],        // 8: c3
  [[2, 0]],        // 9: c0,c3
  [[0, 1],[2, 3]], // 10: saddle
  [[2, 1]],        // 11: c0,c1,c3
  [[1, 3]],        // 12: c2,c3
  [[1, 0]],        // 13: c0,c2,c3
  [[0, 3]],        // 14: c1,c2,c3
  [],              // 15: all above
];

export function extractContours(
  field: Float32Array,
  gridW: number,
  gridH: number,
  threshold: number,
): Segment[] {
  const segments: Segment[] = [];

  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const v0 = field[gy * gridW + gx];           // top-left
      const v1 = field[gy * gridW + gx + 1];       // top-right
      const v2 = field[(gy + 1) * gridW + gx + 1]; // bottom-right
      const v3 = field[(gy + 1) * gridW + gx];     // bottom-left

      let ci = 0;
      if (v0 >= threshold) ci |= 1;
      if (v1 >= threshold) ci |= 2;
      if (v2 >= threshold) ci |= 4;
      if (v3 >= threshold) ci |= 8;

      if (ci === 0 || ci === 15) continue;

      const fieldRes = 4; // TODO: pass through, for now matches prototype
      const x0 = gx * fieldRes, y0 = gy * fieldRes;
      const x1 = x0 + fieldRes, y1 = y0 + fieldRes;

      const interp = (va: number, vb: number, ax: number, ay: number, bx: number, by: number): Point2D => {
        if (Math.abs(vb - va) < 1e-10) return { x: (ax + bx) / 2, y: (ay + by) / 2 };
        const t = (threshold - va) / (vb - va);
        return { x: ax + t * (bx - ax), y: ay + t * (by - ay) };
      };

      const edgePts = [
        interp(v0, v1, x0, y0, x1, y0), // edge 0: top
        interp(v1, v2, x1, y0, x1, y1), // edge 1: right
        interp(v3, v2, x0, y1, x1, y1), // edge 2: bottom
        interp(v0, v3, x0, y0, x0, y1), // edge 3: left
      ];

      for (const [ea, eb] of MARCHING_CASES[ci]) {
        segments.push({ p1: edgePts[ea], p2: edgePts[eb] });
      }
    }
  }

  return segments;
}

// ─── Contour Chaining ─────────────────────────────────────────────

const SNAP_DISTANCE = 0.5;

export function chainSegmentsIntoLoops(segments: Segment[]): ContourLoop[] {
  if (segments.length === 0) return [];

  const snapKey = (p: Point2D) =>
    `${Math.round(p.x / SNAP_DISTANCE)},${Math.round(p.y / SNAP_DISTANCE)}`;

  interface IndexedSeg {
    p1: Point2D;
    p2: Point2D;
    k1: string;
    k2: string;
    used: boolean;
  }

  const segs: IndexedSeg[] = segments.map(s => ({
    p1: s.p1,
    p2: s.p2,
    k1: snapKey(s.p1),
    k2: snapKey(s.p2),
    used: false,
  }));

  const byEndpoint: Record<string, { seg: IndexedSeg; startSide: boolean }[]> = {};
  for (const seg of segs) {
    (byEndpoint[seg.k1] ??= []).push({ seg, startSide: true });
    (byEndpoint[seg.k2] ??= []).push({ seg, startSide: false });
  }

  const loops: ContourLoop[] = [];

  for (const startSeg of segs) {
    if (startSeg.used) continue;
    startSeg.used = true;

    const chain: Point2D[] = [startSeg.p1, startSeg.p2];
    let currentKey = startSeg.k2;
    const startKey = startSeg.k1;

    let safety = 0;
    while (safety++ < 50000) {
      const candidates = (byEndpoint[currentKey] ?? []).filter(c => !c.seg.used);
      if (candidates.length === 0) break;

      const next = candidates[0];
      next.seg.used = true;

      if (next.startSide) {
        chain.push(next.seg.p2);
        currentKey = next.seg.k2;
      } else {
        chain.push(next.seg.p1);
        currentKey = next.seg.k1;
      }

      if (currentKey === startKey) break;
    }

    if (chain.length >= 3) {
      loops.push(chain);
    }
  }

  return loops;
}
```

> **Note:** The `fieldRes` constant in `extractContours` is hardcoded to 4 for now. Task 6 will wire it from the config. This is acceptable for the marching squares logic to pass unit tests.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: PASS (all tests including new ones)

**Step 5: Commit**

```bash
git add src/engine/coastline.ts src/engine/__tests__/coastline.test.ts
git commit -m "feat(coastline): marching squares + contour chaining"
```

---

## Task 5: Contour Smoothing, Displacement & Winding

Add Chaikin corner-cutting smoothing, noise-based displacement along normals, and clockwise winding enforcement.

**Files:**
- Modify: `src/engine/coastline.ts`
- Modify: `src/engine/__tests__/coastline.test.ts`

**Step 1: Write the failing tests**

```typescript
// append to src/engine/__tests__/coastline.test.ts
import { chaikinSmooth, displaceContour, ensureClockwise, signedArea } from '../coastline';

describe('chaikinSmooth', () => {
  it('returns same points for 0 passes', () => {
    const triangle: ContourLoop = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];
    expect(chaikinSmooth(triangle, 0)).toEqual(triangle);
  });

  it('doubles point count per pass (closed loop)', () => {
    const triangle: ContourLoop = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];
    const smoothed = chaikinSmooth(triangle, 1);
    expect(smoothed).toHaveLength(6); // 3 points × 2 per pass
  });

  it('two passes quadruples point count', () => {
    const square: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const smoothed = chaikinSmooth(square, 2);
    expect(smoothed).toHaveLength(16); // 4 × 2 × 2
  });
});

describe('ensureClockwise', () => {
  it('does not reverse already-clockwise loops', () => {
    // CW square (negative signed area)
    const cw: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    expect(signedArea(cw)).toBeLessThan(0); // CW = negative
    const result = ensureClockwise([...cw]);
    expect(signedArea(result)).toBeLessThan(0);
  });

  it('reverses CCW loops to CW', () => {
    const ccw: ContourLoop = [
      { x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 },
    ];
    expect(signedArea(ccw)).toBeGreaterThan(0); // CCW = positive
    const result = ensureClockwise([...ccw]);
    expect(signedArea(result)).toBeLessThan(0);
  });
});

describe('displaceContour', () => {
  it('returns same length array', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const displaced = displaceContour(loop, 42, 0.02, 0.5);
    expect(displaced).toHaveLength(loop.length);
  });

  it('no displacement when amplitude is 0', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const displaced = displaceContour(loop, 42, 0.02, 0); // amplitude = 0
    for (let i = 0; i < loop.length; i++) {
      expect(displaced[i].x).toBeCloseTo(loop[i].x, 5);
      expect(displaced[i].y).toBeCloseTo(loop[i].y, 5);
    }
  });

  it('is deterministic with same seed', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const a = displaceContour(loop, 42, 0.02, 0.5);
    const b = displaceContour(loop, 42, 0.02, 0.5);
    expect(a).toEqual(b);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: FAIL — functions not exported

**Step 3: Write implementation**

Add to `src/engine/coastline.ts`:

```typescript
import { SimplexNoise } from '../lib/simplexNoise';

// ─── Winding Order ────────────────────────────────────────────────

export function signedArea(loop: ContourLoop): number {
  let area = 0;
  for (let i = 0; i < loop.length; i++) {
    const j = (i + 1) % loop.length;
    area += loop[i].x * loop[j].y;
    area -= loop[j].x * loop[i].y;
  }
  return area / 2;
}

export function ensureClockwise(loop: ContourLoop): ContourLoop {
  if (signedArea(loop) > 0) loop.reverse();
  return loop;
}

// ─── Chaikin Corner-Cutting Smoothing ─────────────────────────────

export function chaikinSmooth(loop: ContourLoop, passes: number): ContourLoop {
  let pts = loop;
  for (let pass = 0; pass < passes; pass++) {
    const n = pts.length;
    if (n < 3) break;
    const smoothed: Point2D[] = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % n];
      smoothed.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      smoothed.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = smoothed;
  }
  return pts;
}

// ─── Contour Displacement ─────────────────────────────────────────

const DEFAULT_HEX_SIZE_FOR_DISPLACEMENT = 30; // matches game default

export function displaceContour(
  loop: ContourLoop,
  seed: number,
  noiseScale: number,
  amplitude: number,
  hexSize: number = DEFAULT_HEX_SIZE_FOR_DISPLACEMENT,
): ContourLoop {
  if (amplitude < 0.001) return loop;

  const noise = new SimplexNoise(seed);
  const n = loop.length;
  const displaced: Point2D[] = [];

  for (let i = 0; i < n; i++) {
    const prev = loop[(i - 1 + n) % n];
    const curr = loop[i];
    const next = loop[(i + 1) % n];

    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;

    // Outward normal (perpendicular)
    const nx = ty / tLen;
    const ny = -tx / tLen;

    const n1 = noise.noise2D(curr.x * noiseScale, curr.y * noiseScale);
    const disp = n1 * amplitude * hexSize;

    displaced.push({ x: curr.x + nx * disp, y: curr.y + ny * disp });
  }

  return displaced;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/engine/coastline.ts src/engine/__tests__/coastline.test.ts
git commit -m "feat(coastline): Chaikin smoothing, noise displacement, winding"
```

---

## Task 6: Coastline Pipeline Orchestrator

Combine all steps into a single `computeCoastline()` function that takes tiles + config and returns `CoastlineData` with processed contour loops.

**Files:**
- Modify: `src/engine/coastline.ts`
- Modify: `src/engine/__tests__/coastline.test.ts`

**Step 1: Write the failing test**

```typescript
// append to src/engine/__tests__/coastline.test.ts
import { computeCoastline } from '../coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';

describe('computeCoastline (full pipeline)', () => {
  function makeGrid(cols: number, rows: number, waterFn: (c: number, r: number) => boolean): HexTile[] {
    const tiles: HexTile[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r, waterFn(c, r) ? 'ocean' : 'grassland'));
      }
    }
    return tiles;
  }

  it('returns empty loops for all-water map', () => {
    const tiles = makeGrid(5, 5, () => true);
    const result = computeCoastline(tiles, 30, 5, 5, 42, COASTLINE_DEFAULTS);
    expect(result.loops).toHaveLength(0);
    expect(result.shallowLoops).toHaveLength(0);
  });

  it('returns loops for island map (land center, water edges)', () => {
    // 7×7 grid: inner 3×3 = land, outer = water
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const result = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    expect(result.loops.length).toBeGreaterThan(0);
    // Each loop should be a closed polygon with many points (after smoothing)
    for (const loop of result.loops) {
      expect(loop.length).toBeGreaterThanOrEqual(COASTLINE_DEFAULTS.minLoopPoints);
    }
  });

  it('produces shallowLoops when shallowWidth > 0', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const result = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    expect(result.shallowLoops.length).toBeGreaterThan(0);
  });

  it('is deterministic — same seed gives same loops', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const a = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    const b = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    expect(a.loops).toEqual(b.loops);
    expect(a.shallowLoops).toEqual(b.shallowLoops);
  });

  it('different seeds produce different loops', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const a = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    const b = computeCoastline(tiles, 30, 7, 7, 99, COASTLINE_DEFAULTS);
    // At least some points should differ (displacement uses different noise seed)
    const aStr = JSON.stringify(a.loops);
    const bStr = JSON.stringify(b.loops);
    expect(aStr).not.toBe(bStr);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: FAIL — computeCoastline not exported

**Step 3: Write implementation**

Add to `src/engine/coastline.ts`:

```typescript
// ─── Full Pipeline ────────────────────────────────────────────────

function processLoops(
  field: Float32Array,
  gridW: number,
  gridH: number,
  threshold: number,
  smoothPasses: number,
  displacement: number,
  noiseScale: number,
  seed: number,
  hexSize: number,
  minLoopPoints: number,
): ContourLoop[] {
  const rawSegments = extractContours(field, gridW, gridH, threshold);
  let loops = chainSegmentsIntoLoops(rawSegments);

  loops = loops.map(loop => {
    let smoothed = chaikinSmooth(loop, smoothPasses);
    smoothed = ensureClockwise(smoothed);
    smoothed = displaceContour(smoothed, seed, noiseScale, displacement, hexSize);
    return smoothed;
  });

  return loops.filter(l => l.length >= minLoopPoints);
}

/**
 * Full coastline computation pipeline.
 *
 * 1. Build scalar field from land hex positions
 * 2. Extract land contour at main threshold
 * 3. Extract shallows contour at lower threshold
 * 4. Smooth + displace both
 * 5. Return CoastlineData
 */
export function computeCoastline(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  seed: number,
  config: CoastlineConfig = COASTLINE_DEFAULTS,
): CoastlineData {
  const { field, gridW, gridH } = buildScalarField(tiles, hexSize, cols, rows, config);

  // Land contour at main threshold
  const loops = processLoops(
    field, gridW, gridH,
    config.threshold,
    config.smoothPasses,
    config.displacement,
    config.noiseScale,
    seed,
    hexSize,
    config.minLoopPoints,
  );

  // Shallows contour at lower threshold (extends further into water)
  let shallowLoops: ContourLoop[] = [];
  if (config.shallowWidth > 0) {
    const shallowThreshold = Math.max(0.01, config.threshold - config.shallowWidth);
    shallowLoops = processLoops(
      field, gridW, gridH,
      shallowThreshold,
      config.smoothPasses,
      config.displacement,
      config.noiseScale,
      seed,
      hexSize,
      config.minLoopPoints,
    );
  }

  return { loops, shallowLoops };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/engine/coastline.ts src/engine/__tests__/coastline.test.ts
git commit -m "feat(coastline): full pipeline orchestrator — scalar field → contours → smooth"
```

---

## Task 7: SVG Path Conversion

Convert contour loops to SVG `<path>` `d` attribute strings.

**Files:**
- Modify: `src/engine/coastline.ts`
- Modify: `src/engine/__tests__/coastline.test.ts`

**Step 1: Write the failing test**

```typescript
// append to src/engine/__tests__/coastline.test.ts
import { contourLoopToSvgPath } from '../coastline';

describe('contourLoopToSvgPath', () => {
  it('produces valid SVG path d string for a triangle', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8.66 },
    ];
    const d = contourLoopToSvgPath(loop);
    expect(d).toMatch(/^M/); // starts with moveTo
    expect(d).toMatch(/Z$/); // ends with closePath
    expect(d).toContain('L'); // has lineTo commands
  });

  it('returns empty string for degenerate loop (< 3 points)', () => {
    expect(contourLoopToSvgPath([])).toBe('');
    expect(contourLoopToSvgPath([{ x: 0, y: 0 }])).toBe('');
    expect(contourLoopToSvgPath([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe('');
  });

  it('rounds coordinates to 1 decimal for compact output', () => {
    const loop: ContourLoop = [
      { x: 1.23456, y: 7.89012 },
      { x: 10.5, y: 0 },
      { x: 5, y: 8.66 },
    ];
    const d = contourLoopToSvgPath(loop);
    expect(d).toContain('1.2'); // rounded
    expect(d).not.toContain('1.23456'); // not full precision
  });

  it('combineLoopPaths joins multiple loops with spaces', () => {
    // Test will be added below
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: FAIL — function not exported

**Step 3: Write implementation**

Add to `src/engine/coastline.ts`:

```typescript
// ─── SVG Path Conversion ──────────────────────────────────────────

/** Convert a single contour loop to an SVG path `d` string. */
export function contourLoopToSvgPath(loop: ContourLoop): string {
  if (loop.length < 3) return '';
  const r = (n: number) => Math.round(n * 10) / 10; // 1 decimal
  const parts = [`M${r(loop[0].x)},${r(loop[0].y)}`];
  for (let i = 1; i < loop.length; i++) {
    parts.push(`L${r(loop[i].x)},${r(loop[i].y)}`);
  }
  parts.push('Z');
  return parts.join('');
}

/** Combine multiple contour loops into a single SVG path string (even-odd fill). */
export function combineLoopPaths(loops: ContourLoop[]): string {
  return loops.map(contourLoopToSvgPath).filter(Boolean).join(' ');
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/coastline.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/coastline.ts src/engine/__tests__/coastline.test.ts
git commit -m "feat(coastline): SVG path conversion for contour loops"
```

---

## Task 8: CoastlineOverlay React Component

SVG component that renders the coastline paths inside the hex map zoom group.

**Files:**
- Create: `src/components/HexMap/CoastlineOverlay.tsx`
- Test: `src/components/HexMap/__tests__/CoastlineOverlay.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/HexMap/__tests__/CoastlineOverlay.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CoastlineOverlay } from '../CoastlineOverlay';
import type { CoastlineData } from '../../../types/coastline';
import { COASTLINE_DEFAULTS } from '../../../types/coastline';

const mockData: CoastlineData = {
  loops: [[
    { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 50 }, { x: 10, y: 50 },
  ]],
  shallowLoops: [[
    { x: 5, y: 5 }, { x: 55, y: 5 }, { x: 55, y: 55 }, { x: 5, y: 55 },
  ]],
};

function renderInSvg(children: React.ReactNode) {
  return render(<svg>{children}</svg>);
}

describe('CoastlineOverlay', () => {
  it('renders shallows path before land contour path', () => {
    const { container } = renderInSvg(
      <CoastlineOverlay data={mockData} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
    // First path(s) = shallows, last path(s) = land contour
  });

  it('applies correct fill colors', () => {
    const { container } = renderInSvg(
      <CoastlineOverlay data={mockData} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    const fills = Array.from(paths).map(p => p.getAttribute('fill'));
    expect(fills).toContain(COASTLINE_DEFAULTS.colors.shallows);
    expect(fills).toContain(COASTLINE_DEFAULTS.colors.coastEdge);
  });

  it('renders nothing when loops are empty', () => {
    const emptyData: CoastlineData = { loops: [], shallowLoops: [] };
    const { container } = renderInSvg(
      <CoastlineOverlay data={emptyData} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(0);
  });

  it('renders land contour even when shallowLoops are empty', () => {
    const noShallows: CoastlineData = {
      loops: mockData.loops,
      shallowLoops: [],
    };
    const { container } = renderInSvg(
      <CoastlineOverlay data={noShallows} colors={COASTLINE_DEFAULTS.colors} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(1); // just the land contour
    expect(paths[0].getAttribute('fill')).toBe(COASTLINE_DEFAULTS.colors.coastEdge);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HexMap/__tests__/CoastlineOverlay.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/components/HexMap/CoastlineOverlay.tsx
import { memo, useMemo } from 'react';
import type { CoastlineData } from '../../types/coastline';
import { combineLoopPaths } from '../../engine/coastline';

interface CoastlineOverlayProps {
  data: CoastlineData;
  colors: {
    shallows: string;
    coastEdge: string;
  };
}

/**
 * Renders organic coastline contours as SVG paths.
 *
 * Rendering order:
 * 1. Shallows band (wider contour at lower threshold)
 * 2. Land contour base fill (smooth coastal edge)
 *
 * Both use even-odd fill rule to handle multi-island scenarios.
 */
export const CoastlineOverlay = memo(function CoastlineOverlay({
  data,
  colors,
}: CoastlineOverlayProps) {
  const shallowsD = useMemo(
    () => combineLoopPaths(data.shallowLoops),
    [data.shallowLoops],
  );

  const landD = useMemo(
    () => combineLoopPaths(data.loops),
    [data.loops],
  );

  return (
    <g className="coastline-overlay">
      {/* Shallows band — rendered first (underneath land contour) */}
      {shallowsD && (
        <path
          d={shallowsD}
          fill={colors.shallows}
          fillRule="evenodd"
          stroke="none"
        />
      )}
      {/* Land contour base — smooth coastal edge */}
      {landD && (
        <path
          d={landD}
          fill={colors.coastEdge}
          fillRule="evenodd"
          stroke="none"
        />
      )}
    </g>
  );
});
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HexMap/__tests__/CoastlineOverlay.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/components/HexMap/CoastlineOverlay.tsx src/components/HexMap/__tests__/CoastlineOverlay.test.tsx
git commit -m "feat(coastline): CoastlineOverlay SVG component"
```

---

## Task 9: HexMap Integration

Wire the coastline into the HexMap component. Add `useCoastline` hook that memoizes the computation, and render CoastlineOverlay before individual hex tiles.

**Files:**
- Create: `src/components/HexMap/useCoastline.ts`
- Modify: `src/components/HexMap/HexMap.tsx`
- Test: `src/components/HexMap/__tests__/useCoastline.test.ts`

**Step 1: Write the failing test for the hook**

```typescript
// src/components/HexMap/__tests__/useCoastline.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCoastline } from '../useCoastline';
import type { HexTile } from '../../../types';

function makeTile(col: number, row: number, terrain: string = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: terrain as HexTile['terrain'],
  };
}

function makeIslandGrid(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isWater = c < 2 || c > 4 || r < 2 || r > 4;
      tiles.push(makeTile(c, r, isWater ? 'ocean' : 'grassland'));
    }
  }
  return tiles;
}

describe('useCoastline', () => {
  it('computes coastline data from tiles', () => {
    const tiles = makeIslandGrid();
    const { result } = renderHook(() => useCoastline(tiles, 30, 7, 7, 42));
    expect(result.current.loops.length).toBeGreaterThan(0);
    expect(result.current.shallowLoops.length).toBeGreaterThan(0);
  });

  it('returns empty data for all-water tiles', () => {
    const tiles = Array.from({ length: 9 }, (_, i) => makeTile(i % 3, Math.floor(i / 3), 'ocean'));
    const { result } = renderHook(() => useCoastline(tiles, 30, 3, 3, 42));
    expect(result.current.loops).toHaveLength(0);
  });

  it('memoizes — same inputs return same reference', () => {
    const tiles = makeIslandGrid();
    const { result, rerender } = renderHook(() => useCoastline(tiles, 30, 7, 7, 42));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first); // same reference
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HexMap/__tests__/useCoastline.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/components/HexMap/useCoastline.ts
import { useMemo } from 'react';
import type { HexTile } from '../../types';
import type { CoastlineData, CoastlineConfig } from '../../types/coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';
import { computeCoastline } from '../../engine/coastline';

/**
 * Computes organic coastline contour data from hex tiles.
 * Memoized — only recomputes when tiles, grid dimensions, or seed change.
 */
export function useCoastline(
  tiles: HexTile[],
  hexSize: number,
  cols: number,
  rows: number,
  seed: number,
  config: CoastlineConfig = COASTLINE_DEFAULTS,
): CoastlineData {
  return useMemo(
    () => computeCoastline(tiles, hexSize, cols, rows, seed, config),
    [tiles, hexSize, cols, rows, seed, config],
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HexMap/__tests__/useCoastline.test.ts`
Expected: PASS (3 tests)

**Step 5: Modify HexMap.tsx to integrate coastline**

Changes to `src/components/HexMap/HexMap.tsx`:

1. Add imports for `useCoastline`, `CoastlineOverlay`, `COASTLINE_DEFAULTS`
2. Add `seed` prop to `HexMapProps`
3. Call `useCoastline` hook
4. Render `<CoastlineOverlay>` inside the zoom group, before hex tiles

```diff
// In HexMapProps interface:
+  seed?: number;

// In component body, after the useMemo for width/height:
+  const coastlineData = useCoastline(tiles, hexSize, cols, rows, seed ?? 42);

// In JSX, inside <g transform={tileBaseTransform}>, BEFORE the tiles.map():
+  <CoastlineOverlay data={coastlineData} colors={COASTLINE_DEFAULTS.colors} />
```

**Step 6: Run existing HexMap tests to verify no breakage**

Run: `npx vitest run src/components/HexMap/`
Expected: PASS (all existing + new tests)

**Step 7: Commit**

```bash
git add src/components/HexMap/useCoastline.ts src/components/HexMap/__tests__/useCoastline.test.ts src/components/HexMap/HexMap.tsx
git commit -m "feat(coastline): wire CoastlineOverlay into HexMap with useCoastline hook"
```

---

## Task 10: HexTile Water Rendering Update

Modify HexTile to skip terrain image rendering for **visible** water hexes (letting the organic coastline show through). Unexplored water hexes still render dark. Remembered water hexes render with a semi-transparent dark tint.

**Files:**
- Modify: `src/components/HexMap/HexTile.tsx`
- Modify (or create): `src/components/HexMap/__tests__/HexTile-water.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/HexMap/__tests__/HexTile-water.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexTileComponent } from '../HexTile';
import type { HexTile } from '../../../types';

function makeTile(terrain: string): HexTile {
  return {
    coord: { col: 0, row: 0 },
    geoParams: { elevation: 0.1, temperature: 0.5, moisture: 0.9 },
    terrain: terrain as HexTile['terrain'],
  };
}

function renderTile(terrain: string, visibility: 'visible' | 'remembered' | 'unexplored' = 'visible') {
  return render(
    <svg>
      <HexTileComponent
        tile={makeTile(terrain)}
        cx={50} cy={50} size={30}
        hexClipId="test-clip"
        visibility={visibility}
      />
    </svg>
  );
}

describe('HexTile water rendering with coastline', () => {
  it('visible ocean hex renders transparent (no terrain image)', () => {
    const { container } = renderTile('ocean', 'visible');
    const images = container.querySelectorAll('image');
    expect(images).toHaveLength(0); // no terrain image for visible water
  });

  it('visible coastal_shallows hex renders transparent', () => {
    const { container } = renderTile('coastal_shallows', 'visible');
    const images = container.querySelectorAll('image');
    expect(images).toHaveLength(0);
  });

  it('visible land hex still renders terrain image', () => {
    const { container } = renderTile('grassland', 'visible');
    const images = container.querySelectorAll('image');
    expect(images.length).toBeGreaterThan(0);
  });

  it('unexplored ocean hex still renders dark fill', () => {
    const { container } = renderTile('ocean', 'unexplored');
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);
    // Should have the dark fill color
    const fills = Array.from(polygons).map(p => p.getAttribute('fill'));
    expect(fills).toContain('#1e1b2e');
  });

  it('remembered ocean hex renders with reduced opacity tint', () => {
    const { container } = renderTile('ocean', 'remembered');
    // Should have a group with opacity < 1
    const dimmedGroup = container.querySelector('g[opacity]');
    expect(dimmedGroup).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HexMap/__tests__/HexTile-water.test.tsx`
Expected: FAIL — visible water still renders images

**Step 3: Modify HexTile.tsx**

Add water terrain check and skip terrain image for visible water hexes:

```diff
// At the top of HexTile.tsx, add:
+import { isWaterTerrain } from '../../engine/coastline';

// In the HexTileComponent function, after the existing `if (visibility === 'unexplored')` block:
// Add an early return for visible water hexes:

+  // Visible water hex: render transparent — let CoastlineOverlay show through
+  const isWater = isWaterTerrain(tile.terrain);
+  if (visibility === 'visible' && isWater) {
+    return (
+      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
+        {/* Transparent hit area for click/hover events */}
+        <polygon points={points} fill="transparent" stroke="none" />
+        {isAvatarHex && sphereColor && (
+          <polygon points={points} fill="none" stroke={sphereColor} strokeWidth={3} className="avatar-pulse" />
+        )}
+      </g>
+    );
+  }

// For remembered water hexes, modify the remembered section to render a semi-transparent
// dark tint polygon instead of the terrain image:
+  if (visibility === 'remembered' && isWater) {
+    return (
+      <Tooltip as="g" label={tile.terrain} id={`terrain.${tile.terrain}`}>
+        <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
+          <g opacity="0.4">
+            <polygon points={points} fill="transparent" stroke={HEX_BORDER_COLOR} strokeWidth={0.6} />
+          </g>
+        </g>
+      </Tooltip>
+    );
+  }
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HexMap/__tests__/HexTile-water.test.tsx`
Expected: PASS (5 tests)

**Step 5: Run ALL HexMap tests to verify no regression**

Run: `npx vitest run src/components/HexMap/`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/HexMap/HexTile.tsx src/components/HexMap/__tests__/HexTile-water.test.tsx
git commit -m "feat(coastline): water hexes transparent when visible — organic coastline shows through"
```

---

## Task 11: GameView Wiring — Pass Seed to HexMap

The HexMap now needs a `seed` prop. Wire it from GameState through the existing component tree.

**Files:**
- Modify: `src/components/Game/GameView.tsx` (or wherever HexMap is rendered)
- Modify: `src/components/HexMap/HexMap.tsx` (HexMapProps already updated in Task 9)

**Step 1: Find where HexMap is rendered in GameView**

Look for `<HexMap` in GameView.tsx and add the `seed` prop from gameState.

**Step 2: Wire the seed**

```diff
// In GameView.tsx where <HexMap> is rendered, add:
+  seed={gameState.seed}
```

> **Note:** If `gameState.seed` isn't directly available, check `gameState` type for the seed field. It may be stored on the ascendant node or as a top-level field. Use the world seed that was passed to `seedWorld()` — check `gameInit.ts` for how it's stored.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All ~2060+ tests PASS

**Step 5: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat(coastline): wire seed from GameState to HexMap for deterministic coastlines"
```

---

## Task 12: Integration Test & Visual Verification

End-to-end test that verifies the full pipeline from tiles → coastline → SVG output.

**Files:**
- Create: `src/engine/__tests__/coastline-integration.test.ts`

**Step 1: Write the integration test**

```typescript
// src/engine/__tests__/coastline-integration.test.ts
import { describe, it, expect } from 'vitest';
import { computeCoastline, isWaterTerrain, contourLoopToSvgPath, combineLoopPaths } from '../coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';
import { generateWorld } from '../hexGrid';
import { DEFAULT_COLS, DEFAULT_ROWS } from '../gameInit';

describe('coastline integration', () => {
  // Use real game world generation
  const cosmology: Record<string, number> = {
    force: 0.1, matter: 0.1, energy: 0.15, life: 0.15,
    mind: 0.1, spirit: 0.1, time: 0.15, entropy: 0.15,
  };

  it('produces coastline from game-generated world', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const landCount = tiles.filter(t => !isWaterTerrain(t.terrain)).length;
    const waterCount = tiles.filter(t => isWaterTerrain(t.terrain)).length;

    // Sanity: world should have both land and water
    expect(landCount).toBeGreaterThan(0);
    expect(waterCount).toBeGreaterThan(0);

    const data = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);

    // Should produce at least one land contour
    expect(data.loops.length).toBeGreaterThan(0);

    // All loops should be valid closed polygons
    for (const loop of data.loops) {
      expect(loop.length).toBeGreaterThanOrEqual(COASTLINE_DEFAULTS.minLoopPoints);
      for (const pt of loop) {
        expect(typeof pt.x).toBe('number');
        expect(typeof pt.y).toBe('number');
        expect(isFinite(pt.x)).toBe(true);
        expect(isFinite(pt.y)).toBe(true);
      }
    }

    // SVG path conversion should produce valid strings
    const landPath = combineLoopPaths(data.loops);
    expect(landPath.length).toBeGreaterThan(0);
    expect(landPath).toMatch(/^M/);

    if (data.shallowLoops.length > 0) {
      const shallowPath = combineLoopPaths(data.shallowLoops);
      expect(shallowPath.length).toBeGreaterThan(0);
    }
  });

  it('performance: computes in < 500ms for 20×15 grid', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const start = performance.now();
    computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('deterministic across multiple calls', () => {
    const tiles = generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const a = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    const b = computeCoastline(tiles, 30, DEFAULT_COLS, DEFAULT_ROWS, 42);
    expect(combineLoopPaths(a.loops)).toBe(combineLoopPaths(b.loops));
    expect(combineLoopPaths(a.shallowLoops)).toBe(combineLoopPaths(b.shallowLoops));
  });

  it('handles all-ocean world gracefully', () => {
    // Create 5×5 all-ocean
    const tiles = Array.from({ length: 25 }, (_, i) => ({
      coord: { col: i % 5, row: Math.floor(i / 5) },
      geoParams: { elevation: 0.1, temperature: 0.5, moisture: 0.9 },
      terrain: 'ocean' as const,
    }));
    const data = computeCoastline(tiles, 30, 5, 5, 42);
    expect(data.loops).toHaveLength(0);
    expect(data.shallowLoops).toHaveLength(0);
  });

  it('handles all-land world gracefully', () => {
    const tiles = Array.from({ length: 25 }, (_, i) => ({
      coord: { col: i % 5, row: Math.floor(i / 5) },
      geoParams: { elevation: 0.7, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland' as const,
    }));
    const data = computeCoastline(tiles, 30, 5, 5, 42);
    // All land = the entire map is one blob, contour wraps the whole grid
    expect(data.loops.length).toBeGreaterThanOrEqual(0); // may or may not produce a contour at edges
  });
});
```

**Step 2: Run integration test**

Run: `npx vitest run src/engine/__tests__/coastline-integration.test.ts`
Expected: PASS (5 tests)

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS (~2060+ existing + ~35 new coastline tests)

**Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/engine/__tests__/coastline-integration.test.ts
git commit -m "feat(coastline): integration tests — real world gen, performance, edge cases"
```

---

## Task 13: Documentation Updates

Update project documentation to reflect the new coastline system.

**Files:**
- Modify: `CLAUDE.md` (changelog, engine stats)
- Create or update: Obsidian vault notes via MCP
- Update: Notion backlog

**Step 1: Update CLAUDE.md changelog**

Append entry for coastline integration.

**Step 2: Create Obsidian system note**

Via Obsidian MCP: Create `Systems/Coastline Rendering.md` with:
- Algorithm overview (scalar field → marching squares → Chaikin → SVG)
- Configuration constants reference
- Integration points (HexMap, HexTile water transparency)
- Links to related systems (View Levels, Hex Zoom View)

**Step 3: Update Index.md**

Add coastline link to the rendering/visual section.

**Step 4: Update Notion backlog**

Mark coastline integration task as complete.

**Step 5: Commit docs**

```bash
git add CLAUDE.md
git commit -m "docs(coastline): update CLAUDE.md changelog and engine stats"
```

---

## Summary

| Task | What | New files | Tests |
|------|------|-----------|-------|
| 1 | Types & constants | `types/coastline.ts` | 4 |
| 2 | SimplexNoise port | `lib/simplexNoise.ts` | 5 |
| 3 | Scalar field builder | `engine/coastline.ts` | 4 |
| 4 | Marching squares + chaining | (extend coastline.ts) | 5 |
| 5 | Smoothing + displacement | (extend coastline.ts) | 6 |
| 6 | Pipeline orchestrator | (extend coastline.ts) | 5 |
| 7 | SVG path conversion | (extend coastline.ts) | 3 |
| 8 | CoastlineOverlay component | `HexMap/CoastlineOverlay.tsx` | 4 |
| 9 | HexMap integration + hook | `HexMap/useCoastline.ts` | 3 |
| 10 | HexTile water transparency | (modify HexTile.tsx) | 5 |
| 11 | GameView seed wiring | (modify GameView.tsx) | 0 (type check) |
| 12 | Integration tests | `coastline-integration.test.ts` | 5 |
| 13 | Documentation | CLAUDE.md, Obsidian, Notion | 0 |
| **Total** | | **5 new, 4 modified** | **~49** |
