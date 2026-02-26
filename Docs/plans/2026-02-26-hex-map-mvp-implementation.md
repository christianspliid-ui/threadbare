# Hex Map MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based hex map generator where the player configures a cosmology (5 force weights) and the system generates a visually rich hex grid with force-driven terrain coloring and a force overlay mode.

**Architecture:** React + TypeScript app built with Vite. Pure engine layer (no React dependencies) handles cosmology math, noise-based force field generation, terrain classification, and color blending. SVG-based hex rendering in React components. Simple useState/useReducer state management.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS (UI only), simplex-noise, Vitest (testing)

**Design Doc:** `Docs/plans/2026-02-26-hex-map-mvp-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `src/` directory tree via Vite
- Create: `vitest.config.ts`
- Modify: `package.json` (add test script)

**Step 1: Scaffold Vite + React + TypeScript project**

Run inside the repo root:
```bash
npm create vite@latest app -- --template react-ts
```

Then move the generated contents from `app/` into the repo root (so `src/`, `index.html`, etc. live at top level, not nested).

**Step 2: Install dependencies**

```bash
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install simplex-noise
```

**Step 3: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Verify the scaffold works**

```bash
npm run build
npm test -- --passWithNoTests
```

Expected: Both pass with zero errors.

**Step 5: Create engine directory structure**

```bash
mkdir -p src/engine src/lib src/types src/components/HexMap src/components/Cosmology src/components/UI src/test
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project with Vitest"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types/index.ts`

**Step 1: Write the shared types**

Create `src/types/index.ts`:
```typescript
/** The five governing forces of the world */
export const FORCE_NAMES = ['aether', 'verdance', 'ignis', 'umbra', 'terra'] as const;
export type ForceName = typeof FORCE_NAMES[number];

/** A vector of force saturations — one value per force */
export type ForceVector = Record<ForceName, number>;

/** The player's cosmology configuration — force weights summing to 1.0 */
export type CosmologyProfile = ForceVector;

/** Offset hex coordinates */
export interface HexCoord {
  col: number;
  row: number;
}

/** Cube hex coordinates (used for distance/neighbor math) */
export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

/** Terrain types derived from dominant force + secondary modifier */
export type TerrainType =
  // Aether-dominant
  | 'crystal_wastes' | 'enchanted_grove' | 'runed_mountains'
  // Verdance-dominant
  | 'deep_forest' | 'haunted_wood' | 'volcanic_jungle'
  // Ignis-dominant
  | 'scorched_plains' | 'lightning_fields' | 'forge_mountains'
  // Umbra-dominant
  | 'shadow_marsh' | 'fungal_forest' | 'void_rift'
  // Terra-dominant
  | 'stone_highlands' | 'obsidian_peaks' | 'buried_ruins'
  // No dominant force
  | 'contested_ground';

/** A single hex tile with all computed properties */
export interface HexTile {
  coord: HexCoord;
  forces: ForceVector;
  terrain: TerrainType;
  elevation: number;
  moisture: number;
  magicDensity: number;
}

/** Force overlay display modes */
export type OverlayMode = 'none' | 'single' | 'all';

/** Grid dimensions */
export interface GridSize {
  cols: number;
  rows: number;
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add core type definitions for forces, hexes, and terrain"
```

---

## Task 3: Cosmology Engine

**Files:**
- Create: `src/engine/cosmology.ts`
- Create: `src/engine/__tests__/cosmology.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/cosmology.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  createBalancedCosmology,
  normalizeCosmology,
  COSMOLOGY_PRESETS,
} from '../cosmology';
import { FORCE_NAMES, type CosmologyProfile } from '../../types';

describe('createBalancedCosmology', () => {
  it('returns equal weights summing to 1.0', () => {
    const c = createBalancedCosmology();
    const sum = FORCE_NAMES.reduce((s, f) => s + c[f], 0);
    expect(sum).toBeCloseTo(1.0);
    expect(c.aether).toBeCloseTo(0.2);
    expect(c.verdance).toBeCloseTo(0.2);
  });
});

describe('normalizeCosmology', () => {
  it('normalizes weights to sum to 1.0', () => {
    const raw: CosmologyProfile = { aether: 2, verdance: 3, ignis: 1, umbra: 2, terra: 2 };
    const n = normalizeCosmology(raw);
    const sum = FORCE_NAMES.reduce((s, f) => s + n[f], 0);
    expect(sum).toBeCloseTo(1.0);
    expect(n.verdance).toBeCloseTo(0.3);
  });

  it('handles all-zero input by returning balanced', () => {
    const raw: CosmologyProfile = { aether: 0, verdance: 0, ignis: 0, umbra: 0, terra: 0 };
    const n = normalizeCosmology(raw);
    expect(n.aether).toBeCloseTo(0.2);
  });
});

describe('COSMOLOGY_PRESETS', () => {
  it('all presets sum to 1.0', () => {
    for (const [name, preset] of Object.entries(COSMOLOGY_PRESETS)) {
      const sum = FORCE_NAMES.reduce((s, f) => s + preset[f], 0);
      expect(sum, `Preset "${name}" doesn't sum to 1.0`).toBeCloseTo(1.0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/cosmology.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement cosmology engine**

Create `src/engine/cosmology.ts`:
```typescript
import { FORCE_NAMES, type CosmologyProfile, type ForceName } from '../types';

/** Create a balanced cosmology with equal force weights */
export function createBalancedCosmology(): CosmologyProfile {
  const weight = 1.0 / FORCE_NAMES.length;
  return Object.fromEntries(FORCE_NAMES.map(f => [f, weight])) as CosmologyProfile;
}

/** Normalize a cosmology so all weights sum to 1.0 */
export function normalizeCosmology(profile: CosmologyProfile): CosmologyProfile {
  const sum = FORCE_NAMES.reduce((s, f) => s + profile[f], 0);
  if (sum === 0) return createBalancedCosmology();
  return Object.fromEntries(
    FORCE_NAMES.map(f => [f, profile[f] / sum])
  ) as CosmologyProfile;
}

/** Adjust one force and proportionally rebalance the others */
export function adjustForce(
  profile: CosmologyProfile,
  force: ForceName,
  newValue: number
): CosmologyProfile {
  const clamped = Math.max(0, Math.min(1, newValue));
  const remaining = 1.0 - clamped;
  const othersSum = FORCE_NAMES
    .filter(f => f !== force)
    .reduce((s, f) => s + profile[f], 0);

  const result = { ...profile, [force]: clamped };
  if (othersSum === 0) {
    // Distribute remaining equally among others
    const share = remaining / (FORCE_NAMES.length - 1);
    FORCE_NAMES.filter(f => f !== force).forEach(f => { result[f] = share; });
  } else {
    FORCE_NAMES.filter(f => f !== force).forEach(f => {
      result[f] = (profile[f] / othersSum) * remaining;
    });
  }
  return result;
}

/** Force relationship data */
export const FORCE_ALLIES: Record<ForceName, ForceName | null> = {
  aether: 'umbra',
  umbra: 'aether',
  verdance: 'terra',
  terra: 'verdance',
  ignis: null,
};

export const FORCE_OPPOSITES: Record<ForceName, ForceName | null> = {
  aether: 'terra',
  terra: 'aether',
  verdance: 'umbra',
  umbra: 'verdance',
  ignis: null,
};

/** Preset cosmology profiles */
export const COSMOLOGY_PRESETS: Record<string, CosmologyProfile> = {
  balanced:          { aether: 0.20, verdance: 0.20, ignis: 0.20, umbra: 0.20, terra: 0.20 },
  arcane_dominance:  { aether: 0.40, verdance: 0.10, ignis: 0.15, umbra: 0.25, terra: 0.10 },
  wild_growth:       { aether: 0.10, verdance: 0.40, ignis: 0.10, umbra: 0.10, terra: 0.30 },
  scorched:          { aether: 0.10, verdance: 0.05, ignis: 0.45, umbra: 0.15, terra: 0.25 },
  shadowed:          { aether: 0.20, verdance: 0.10, ignis: 0.10, umbra: 0.45, terra: 0.15 },
  fortress_world:    { aether: 0.10, verdance: 0.15, ignis: 0.15, umbra: 0.10, terra: 0.50 },
};
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/cosmology.test.ts
```

Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
git add src/engine/cosmology.ts src/engine/__tests__/cosmology.test.ts
git commit -m "feat: cosmology engine with normalization, presets, and force relationships"
```

---

## Task 4: Hex Math Utilities

**Files:**
- Create: `src/lib/hexMath.ts`
- Create: `src/lib/__tests__/hexMath.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/__tests__/hexMath.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  offsetToCube,
  cubeToOffset,
  hexNeighbors,
  hexDistance,
  hexToPixel,
  generateHexGrid,
} from '../hexMath';

describe('offsetToCube / cubeToOffset', () => {
  it('round-trips offset → cube → offset', () => {
    const offset = { col: 3, row: 5 };
    const cube = offsetToCube(offset);
    const back = cubeToOffset(cube);
    expect(back).toEqual(offset);
  });

  it('converts origin correctly', () => {
    const cube = offsetToCube({ col: 0, row: 0 });
    expect(cube).toEqual({ q: 0, r: 0, s: 0 });
  });
});

describe('hexNeighbors', () => {
  it('returns 6 neighbors', () => {
    const neighbors = hexNeighbors({ col: 2, row: 2 });
    expect(neighbors).toHaveLength(6);
  });
});

describe('hexDistance', () => {
  it('returns 0 for same hex', () => {
    expect(hexDistance({ col: 3, row: 3 }, { col: 3, row: 3 })).toBe(0);
  });

  it('returns 1 for adjacent hexes', () => {
    const neighbors = hexNeighbors({ col: 3, row: 3 });
    for (const n of neighbors) {
      expect(hexDistance({ col: 3, row: 3 }, n)).toBe(1);
    }
  });
});

describe('hexToPixel', () => {
  it('returns pixel coordinates for origin hex', () => {
    const px = hexToPixel({ col: 0, row: 0 }, 30);
    expect(px.x).toBeCloseTo(0);
    expect(px.y).toBeCloseTo(0);
  });

  it('offsets columns correctly', () => {
    const px0 = hexToPixel({ col: 0, row: 0 }, 30);
    const px1 = hexToPixel({ col: 1, row: 0 }, 30);
    expect(px1.x).toBeGreaterThan(px0.x);
  });
});

describe('generateHexGrid', () => {
  it('generates correct number of hexes', () => {
    const grid = generateHexGrid(5, 4);
    expect(grid).toHaveLength(20);
  });

  it('first hex is (0,0)', () => {
    const grid = generateHexGrid(3, 3);
    expect(grid[0]).toEqual({ col: 0, row: 0 });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/hexMath.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement hex math**

Create `src/lib/hexMath.ts`:
```typescript
import type { HexCoord, CubeCoord } from '../types';

/** Convert offset (flat-top, even-col) to cube coordinates */
export function offsetToCube(hex: HexCoord): CubeCoord {
  const q = hex.col;
  const r = hex.row - (hex.col + (hex.col & 1)) / 2;
  const s = -q - r;
  return { q, r, s: Math.round(s * 1e10) / 1e10 }; // avoid floating-point drift
}

/** Convert cube coordinates back to offset (flat-top, even-col) */
export function cubeToOffset(cube: CubeCoord): HexCoord {
  const col = cube.q;
  const row = cube.r + (cube.q + (cube.q & 1)) / 2;
  return { col, row };
}

/** Get the 6 neighbor coordinates of a hex (offset coords) */
export function hexNeighbors(hex: HexCoord): HexCoord[] {
  const isEvenCol = hex.col % 2 === 0;
  const directions = isEvenCol
    ? [
        { col: +1, row:  0 }, { col: +1, row: -1 },
        { col:  0, row: -1 }, { col: -1, row: -1 },
        { col: -1, row:  0 }, { col:  0, row: +1 },
      ]
    : [
        { col: +1, row: +1 }, { col: +1, row:  0 },
        { col:  0, row: -1 }, { col: -1, row:  0 },
        { col: -1, row: +1 }, { col:  0, row: +1 },
      ];
  return directions.map(d => ({ col: hex.col + d.col, row: hex.row + d.row }));
}

/** Manhattan distance between two hexes (via cube coords) */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
}

/** Convert offset hex to pixel center (flat-top hexagon layout) */
export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = hex.col * (w * 3 / 4);
  const y = hex.row * h + (hex.col % 2 === 1 ? h / 2 : 0);
  return { x, y };
}

/** Generate a flat array of hex coordinates for a grid */
export function generateHexGrid(cols: number, rows: number): HexCoord[] {
  const hexes: HexCoord[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      hexes.push({ col, row });
    }
  }
  return hexes;
}

/** Get the SVG polygon points for a flat-top hexagon centered at (cx, cy) */
export function hexPolygonPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/hexMath.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/hexMath.ts src/lib/__tests__/hexMath.test.ts
git commit -m "feat: hex math utilities — coordinates, neighbors, distance, pixel conversion"
```

---

## Task 5: Force Field Generation

**Files:**
- Create: `src/engine/forceField.ts`
- Create: `src/engine/__tests__/forceField.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/forceField.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateForceField } from '../forceField';
import { createBalancedCosmology } from '../cosmology';
import { FORCE_NAMES } from '../../types';

describe('generateForceField', () => {
  const cosmology = createBalancedCosmology();
  const coords = [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: 5, row: 5 },
  ];

  it('returns a ForceVector for each input coordinate', () => {
    const field = generateForceField(coords, cosmology, 42);
    expect(field).toHaveLength(coords.length);
  });

  it('each ForceVector sums to approximately 1.0', () => {
    const field = generateForceField(coords, cosmology, 42);
    for (const fv of field) {
      const sum = FORCE_NAMES.reduce((s, f) => s + fv[f], 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('all force values are between 0 and 1', () => {
    const field = generateForceField(coords, cosmology, 42);
    for (const fv of field) {
      for (const f of FORCE_NAMES) {
        expect(fv[f]).toBeGreaterThanOrEqual(0);
        expect(fv[f]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateForceField(coords, cosmology, 42);
    const b = generateForceField(coords, cosmology, 42);
    expect(a).toEqual(b);
  });

  it('varies with different seeds', () => {
    const a = generateForceField(coords, cosmology, 42);
    const b = generateForceField(coords, cosmology, 99);
    const same = a.every((fv, i) =>
      FORCE_NAMES.every(f => Math.abs(fv[f] - b[i][f]) < 0.001)
    );
    expect(same).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/forceField.test.ts
```

Expected: FAIL.

**Step 3: Implement force field generation**

Create `src/engine/forceField.ts`:
```typescript
import { createNoise2D } from 'simplex-noise';
import { FORCE_NAMES, type CosmologyProfile, type ForceVector, type HexCoord, type ForceName } from '../types';
import { FORCE_ALLIES, FORCE_OPPOSITES } from './cosmology';

/** Seeded PRNG (simple mulberry32) */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE_SCALE = 0.08;
const NOISE_OCTAVES = 3;
const NOISE_PERSISTENCE = 0.5;
const NOISE_LACUNARITY = 2.0;
const NOISE_AMPLITUDE = 0.3;
const ALLY_BOOST = 0.05;
const OPPOSE_PENALTY = 0.03;

/** Multi-octave simplex noise */
function fractalNoise(
  noise2D: (x: number, y: number) => number,
  x: number,
  y: number,
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let o = 0; o < NOISE_OCTAVES; o++) {
    value += noise2D(x * frequency * NOISE_SCALE, y * frequency * NOISE_SCALE) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= NOISE_PERSISTENCE;
    frequency *= NOISE_LACUNARITY;
  }

  return value / maxAmplitude; // normalized to [-1, 1]
}

/**
 * Generate a force field — one ForceVector per hex coordinate.
 * Uses simplex noise seeded per-force to create regional variation,
 * then applies force interaction modifiers and normalizes.
 */
export function generateForceField(
  coords: HexCoord[],
  cosmology: CosmologyProfile,
  seed: number,
): ForceVector[] {
  // Create one noise function per force, each with a unique seed offset
  const rng = mulberry32(seed);
  const noisePerForce: Record<string, (x: number, y: number) => number> = {};
  for (const f of FORCE_NAMES) {
    const forceSeed = Math.floor(rng() * 2147483647);
    const forceRng = mulberry32(forceSeed);
    noisePerForce[f] = createNoise2D(() => forceRng());
  }

  return coords.map(coord => {
    const raw: Partial<ForceVector> = {};

    // Pass 1: base + noise
    for (const f of FORCE_NAMES) {
      const base = cosmology[f];
      const noise = fractalNoise(noisePerForce[f], coord.col, coord.row) * NOISE_AMPLITUDE;
      raw[f] = base + noise;
    }

    // Pass 2: force interactions
    for (const f of FORCE_NAMES) {
      const ally = FORCE_ALLIES[f];
      const opposite = FORCE_OPPOSITES[f];
      if (ally && raw[ally] !== undefined) {
        raw[f]! += raw[ally]! * ALLY_BOOST;
      }
      if (opposite && raw[opposite] !== undefined) {
        raw[f]! -= raw[opposite]! * OPPOSE_PENALTY;
      }
    }

    // Clamp and normalize
    const clamped: Partial<ForceVector> = {};
    for (const f of FORCE_NAMES) {
      clamped[f] = Math.max(0, raw[f]!);
    }
    const sum = FORCE_NAMES.reduce((s, f) => s + clamped[f]!, 0);
    const normalized: Partial<ForceVector> = {};
    for (const f of FORCE_NAMES) {
      normalized[f] = sum > 0 ? clamped[f]! / sum : 1 / FORCE_NAMES.length;
    }

    return normalized as ForceVector;
  });
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/forceField.test.ts
```

Expected: All 5 tests PASS.

**Step 5: Commit**

```bash
git add src/engine/forceField.ts src/engine/__tests__/forceField.test.ts
git commit -m "feat: force field generation with simplex noise and force interactions"
```

---

## Task 6: Terrain Classification

**Files:**
- Create: `src/engine/terrain.ts`
- Create: `src/engine/__tests__/terrain.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/terrain.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { classifyTerrain, deriveTileProperties } from '../terrain';
import type { ForceVector } from '../../types';

describe('classifyTerrain', () => {
  it('returns crystal_wastes for aether-dominant', () => {
    const fv: ForceVector = { aether: 0.6, verdance: 0.1, ignis: 0.1, umbra: 0.1, terra: 0.1 };
    expect(classifyTerrain(fv)).toBe('crystal_wastes');
  });

  it('returns enchanted_grove for aether + verdance secondary', () => {
    const fv: ForceVector = { aether: 0.4, verdance: 0.25, ignis: 0.1, umbra: 0.1, terra: 0.15 };
    expect(classifyTerrain(fv)).toBe('enchanted_grove');
  });

  it('returns contested_ground when no force dominates', () => {
    const fv: ForceVector = { aether: 0.20, verdance: 0.20, ignis: 0.20, umbra: 0.20, terra: 0.20 };
    expect(classifyTerrain(fv)).toBe('contested_ground');
  });

  it('returns deep_forest for verdance-dominant', () => {
    const fv: ForceVector = { aether: 0.05, verdance: 0.7, ignis: 0.05, umbra: 0.1, terra: 0.1 };
    expect(classifyTerrain(fv)).toBe('deep_forest');
  });
});

describe('deriveTileProperties', () => {
  it('returns elevation, moisture, and magicDensity in [0,1]', () => {
    const fv: ForceVector = { aether: 0.3, verdance: 0.2, ignis: 0.1, umbra: 0.1, terra: 0.3 };
    const props = deriveTileProperties(fv);
    expect(props.elevation).toBeGreaterThanOrEqual(0);
    expect(props.elevation).toBeLessThanOrEqual(1);
    expect(props.moisture).toBeGreaterThanOrEqual(0);
    expect(props.moisture).toBeLessThanOrEqual(1);
    expect(props.magicDensity).toBeGreaterThanOrEqual(0);
    expect(props.magicDensity).toBeLessThanOrEqual(1);
  });

  it('terra-heavy hex has high elevation', () => {
    const fv: ForceVector = { aether: 0.05, verdance: 0.05, ignis: 0.05, umbra: 0.05, terra: 0.8 };
    const props = deriveTileProperties(fv);
    expect(props.elevation).toBeGreaterThan(0.5);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/terrain.test.ts
```

Expected: FAIL.

**Step 3: Implement terrain classification**

Create `src/engine/terrain.ts`:
```typescript
import { FORCE_NAMES, type ForceVector, type ForceName, type TerrainType } from '../types';

/** Threshold: a force must exceed this to be "dominant" */
const DOMINANCE_THRESHOLD = 0.25;
/** Threshold: secondary force must exceed this to modify terrain */
const SECONDARY_THRESHOLD = 0.20;

/** Base terrain for each dominant force */
const BASE_TERRAIN: Record<ForceName, TerrainType> = {
  aether: 'crystal_wastes',
  verdance: 'deep_forest',
  ignis: 'scorched_plains',
  umbra: 'shadow_marsh',
  terra: 'stone_highlands',
};

/** Modified terrain when dominant + secondary pair up */
const MODIFIED_TERRAIN: Record<ForceName, Partial<Record<ForceName, TerrainType>>> = {
  aether: { verdance: 'enchanted_grove', terra: 'runed_mountains' },
  verdance: { umbra: 'haunted_wood', ignis: 'volcanic_jungle' },
  ignis: { aether: 'lightning_fields', terra: 'forge_mountains' },
  umbra: { verdance: 'fungal_forest', aether: 'void_rift' },
  terra: { ignis: 'obsidian_peaks', umbra: 'buried_ruins' },
};

/** Get the dominant force (highest value) and its value */
function getDominant(fv: ForceVector): { force: ForceName; value: number } {
  let best: ForceName = 'aether';
  let bestVal = -1;
  for (const f of FORCE_NAMES) {
    if (fv[f] > bestVal) {
      bestVal = fv[f];
      best = f;
    }
  }
  return { force: best, value: bestVal };
}

/** Get the second-highest force */
function getSecondary(fv: ForceVector, dominant: ForceName): { force: ForceName; value: number } {
  let best: ForceName = FORCE_NAMES.find(f => f !== dominant)!;
  let bestVal = -1;
  for (const f of FORCE_NAMES) {
    if (f !== dominant && fv[f] > bestVal) {
      bestVal = fv[f];
      best = f;
    }
  }
  return { force: best, value: bestVal };
}

/** Classify a hex's terrain from its force vector */
export function classifyTerrain(fv: ForceVector): TerrainType {
  const dom = getDominant(fv);
  if (dom.value < DOMINANCE_THRESHOLD) return 'contested_ground';

  const sec = getSecondary(fv, dom.force);
  if (sec.value >= SECONDARY_THRESHOLD) {
    const modified = MODIFIED_TERRAIN[dom.force]?.[sec.force];
    if (modified) return modified;
  }

  return BASE_TERRAIN[dom.force];
}

/** Derive elevation, moisture, and magic density from force vector */
export function deriveTileProperties(fv: ForceVector): {
  elevation: number;
  moisture: number;
  magicDensity: number;
} {
  // Elevation: terra and ignis push up, umbra and verdance push down
  const elevation = Math.min(1, Math.max(0,
    fv.terra * 0.5 + fv.ignis * 0.3 + fv.aether * 0.2 - fv.umbra * 0.1 - fv.verdance * 0.05
  ));

  // Moisture: verdance and umbra are wet, ignis and terra are dry
  const moisture = Math.min(1, Math.max(0,
    fv.verdance * 0.5 + fv.umbra * 0.3 - fv.ignis * 0.3 + fv.aether * 0.1 + fv.terra * 0.05
  ));

  // Magic density: aether and umbra are magic-rich
  const magicDensity = Math.min(1, Math.max(0,
    fv.aether * 0.5 + fv.umbra * 0.3 + fv.ignis * 0.1 + fv.verdance * 0.05 + fv.terra * 0.05
  ));

  return { elevation, moisture, magicDensity };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/terrain.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/engine/terrain.ts src/engine/__tests__/terrain.test.ts
git commit -m "feat: terrain classification from force vectors with modified terrain variants"
```

---

## Task 7: Color Engine

**Files:**
- Create: `src/engine/color.ts`
- Create: `src/engine/__tests__/color.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/color.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { blendForceColors, FORCE_COLORS, hexToRgb, rgbToHex } from '../color';
import type { ForceVector } from '../../types';

describe('hexToRgb / rgbToHex', () => {
  it('round-trips correctly', () => {
    expect(rgbToHex(hexToRgb('#6B5CE7'))).toBe('#6b5ce7');
  });
});

describe('blendForceColors', () => {
  it('returns pure force color when one force dominates completely', () => {
    const fv: ForceVector = { aether: 1, verdance: 0, ignis: 0, umbra: 0, terra: 0 };
    const color = blendForceColors(fv);
    expect(color).toBe(FORCE_COLORS.aether.primary.toLowerCase());
  });

  it('returns a valid hex color string', () => {
    const fv: ForceVector = { aether: 0.2, verdance: 0.2, ignis: 0.2, umbra: 0.2, terra: 0.2 };
    const color = blendForceColors(fv);
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/color.test.ts
```

Expected: FAIL.

**Step 3: Implement color engine**

Create `src/engine/color.ts`:
```typescript
import { FORCE_NAMES, type ForceVector, type ForceName } from '../types';

export const FORCE_COLORS: Record<ForceName, { primary: string; secondary: string; accent: string }> = {
  aether:   { primary: '#6B5CE7', secondary: '#A8D8EA', accent: '#E8E0FF' },
  verdance: { primary: '#2D8F4E', secondary: '#7BC950', accent: '#D4F5D4' },
  ignis:    { primary: '#E84830', secondary: '#FF9F43', accent: '#FFE0D0' },
  umbra:    { primary: '#4A2080', secondary: '#1A1A2E', accent: '#C8A0E8' },
  terra:    { primary: '#C8A850', secondary: '#8B6914', accent: '#F0E8C8' },
};

export interface RGB { r: number; g: number; b: number }

/** Parse a hex color string to RGB */
export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/** Convert RGB to hex color string */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.min(255, Math.max(0, rgb.r)));
  const g = Math.round(Math.min(255, Math.max(0, rgb.g)));
  const b = Math.round(Math.min(255, Math.max(0, rgb.b)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Blend force primary colors weighted by force vector */
export function blendForceColors(fv: ForceVector): string {
  let r = 0, g = 0, b = 0;
  for (const f of FORCE_NAMES) {
    const rgb = hexToRgb(FORCE_COLORS[f].primary);
    const w = fv[f];
    r += rgb.r * w;
    g += rgb.g * w;
    b += rgb.b * w;
  }
  return rgbToHex({ r, g, b });
}

/** Darken a hex color by a factor (0 = black, 1 = unchanged) */
export function darkenColor(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  return rgbToHex({
    r: rgb.r * factor,
    g: rgb.g * factor,
    b: rgb.b * factor,
  });
}

/** Get a force overlay color at a given opacity (for heatmaps) */
export function forceOverlayColor(force: ForceName, intensity: number): string {
  const rgb = hexToRgb(FORCE_COLORS[force].primary);
  // Return as rgba string for SVG fill-opacity usage
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.7})`;
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/color.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/engine/color.ts src/engine/__tests__/color.test.ts
git commit -m "feat: color engine with force blending, darkening, and overlay support"
```

---

## Task 8: Hex Grid Generation Pipeline

**Files:**
- Create: `src/engine/hexGrid.ts`
- Create: `src/engine/__tests__/hexGrid.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/__tests__/hexGrid.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateWorld } from '../hexGrid';
import { createBalancedCosmology } from '../cosmology';
import { FORCE_NAMES } from '../../types';

describe('generateWorld', () => {
  const cosmology = createBalancedCosmology();

  it('generates the correct number of tiles', () => {
    const tiles = generateWorld(cosmology, 10, 8, 42);
    expect(tiles).toHaveLength(80);
  });

  it('every tile has valid forces summing to ~1.0', () => {
    const tiles = generateWorld(cosmology, 5, 5, 42);
    for (const tile of tiles) {
      const sum = FORCE_NAMES.reduce((s, f) => s + tile.forces[f], 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('every tile has a terrain type', () => {
    const tiles = generateWorld(cosmology, 5, 5, 42);
    for (const tile of tiles) {
      expect(tile.terrain).toBeTruthy();
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateWorld(cosmology, 5, 5, 42);
    const b = generateWorld(cosmology, 5, 5, 42);
    expect(a).toEqual(b);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/engine/__tests__/hexGrid.test.ts
```

Expected: FAIL.

**Step 3: Implement the pipeline**

Create `src/engine/hexGrid.ts`:
```typescript
import type { CosmologyProfile, HexTile } from '../types';
import { generateHexGrid } from '../lib/hexMath';
import { generateForceField } from './forceField';
import { classifyTerrain, deriveTileProperties } from './terrain';

/**
 * Generate a complete hex world: coordinates → force field → terrain → tile properties.
 * This is the main pipeline function that combines all engine modules.
 */
export function generateWorld(
  cosmology: CosmologyProfile,
  cols: number,
  rows: number,
  seed: number,
): HexTile[] {
  const coords = generateHexGrid(cols, rows);
  const forceField = generateForceField(coords, cosmology, seed);

  return coords.map((coord, i) => {
    const forces = forceField[i];
    const terrain = classifyTerrain(forces);
    const { elevation, moisture, magicDensity } = deriveTileProperties(forces);

    return {
      coord,
      forces,
      terrain,
      elevation,
      moisture,
      magicDensity,
    };
  });
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/hexGrid.test.ts
```

Expected: All 4 tests PASS.

**Step 5: Run ALL engine tests to verify nothing is broken**

```bash
npx vitest run
```

Expected: All tests across all files PASS.

**Step 6: Commit**

```bash
git add src/engine/hexGrid.ts src/engine/__tests__/hexGrid.test.ts
git commit -m "feat: hex grid generation pipeline — cosmology to fully classified tiles"
```

---

## Task 9: HexTile SVG Component

**Files:**
- Create: `src/components/HexMap/HexTile.tsx`
- Create: `src/components/HexMap/__tests__/HexTile.test.tsx`

**Step 1: Write the failing test**

Create `src/components/HexMap/__tests__/HexTile.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexTileComponent } from '../HexTile';
import type { HexTile } from '../../../types';

const mockTile: HexTile = {
  coord: { col: 0, row: 0 },
  forces: { aether: 0.4, verdance: 0.2, ignis: 0.1, umbra: 0.1, terra: 0.2 },
  terrain: 'crystal_wastes',
  elevation: 0.5,
  moisture: 0.3,
  magicDensity: 0.6,
};

describe('HexTileComponent', () => {
  it('renders an SVG polygon', () => {
    const { container } = render(
      <svg>
        <HexTileComponent tile={mockTile} cx={100} cy={100} size={30} />
      </svg>
    );
    const polygon = container.querySelector('polygon');
    expect(polygon).toBeTruthy();
  });

  it('has a fill color', () => {
    const { container } = render(
      <svg>
        <HexTileComponent tile={mockTile} cx={100} cy={100} size={30} />
      </svg>
    );
    const polygon = container.querySelector('polygon');
    expect(polygon?.getAttribute('fill')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/HexMap/__tests__/HexTile.test.tsx
```

Expected: FAIL.

**Step 3: Implement HexTile component**

Create `src/components/HexMap/HexTile.tsx`:
```tsx
import type { HexTile } from '../../types';
import { blendForceColors, darkenColor } from '../../engine/color';
import { hexPolygonPoints } from '../../lib/hexMath';

interface HexTileProps {
  tile: HexTile;
  cx: number;
  cy: number;
  size: number;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HexTileComponent({
  tile,
  cx,
  cy,
  size,
  isHovered = false,
  isSelected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: HexTileProps) {
  const fillColor = blendForceColors(tile.forces);
  const strokeColor = darkenColor(fillColor, 0.7);
  const points = hexPolygonPoints(cx, cy, size);

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.8}
        opacity={isHovered ? 0.9 : 1}
      />
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
    </g>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/HexMap/__tests__/HexTile.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/HexMap/HexTile.tsx src/components/HexMap/__tests__/HexTile.test.tsx
git commit -m "feat: HexTile SVG component with force-blended colors and selection states"
```

---

## Task 10: HexMap Component

**Files:**
- Create: `src/components/HexMap/HexMap.tsx`

**Step 1: Implement HexMap**

Create `src/components/HexMap/HexMap.tsx`:
```tsx
import { useMemo } from 'react';
import type { HexTile, HexCoord, ForceName, OverlayMode } from '../../types';
import { hexToPixel, hexPolygonPoints } from '../../lib/hexMath';
import { HexTileComponent } from './HexTile';
import { forceOverlayColor } from '../../engine/color';

interface HexMapProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  hexSize?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  overlayMode: OverlayMode;
  selectedForce: ForceName | null;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
}

export function HexMap({
  tiles,
  cols,
  rows,
  hexSize = 30,
  hoveredHex,
  selectedHex,
  overlayMode,
  selectedForce,
  onHexClick,
  onHexHover,
}: HexMapProps) {
  // Compute SVG viewBox dimensions
  const { width, height } = useMemo(() => {
    const w = cols * hexSize * 1.5 + hexSize * 0.5;
    const h = rows * Math.sqrt(3) * hexSize + Math.sqrt(3) * hexSize * 0.5;
    return { width: w + hexSize, height: h + hexSize };
  }, [cols, rows, hexSize]);

  const padding = hexSize;

  return (
    <svg
      viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
      className="w-full h-full"
      style={{ background: '#0a0a1a' }}
    >
      <g transform={`translate(${padding + hexSize}, ${padding + hexSize * 0.8})`}>
        {/* Base terrain layer */}
        {tiles.map((tile) => {
          const { x, y } = hexToPixel(tile.coord, hexSize);
          const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
          const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;

          return (
            <HexTileComponent
              key={`${tile.coord.col}-${tile.coord.row}`}
              tile={tile}
              cx={x}
              cy={y}
              size={hexSize}
              isHovered={isHovered}
              isSelected={isSelected}
              onClick={() => onHexClick(tile.coord)}
              onMouseEnter={() => onHexHover(tile.coord)}
              onMouseLeave={() => onHexHover(null)}
            />
          );
        })}

        {/* Force overlay layer */}
        {overlayMode === 'single' && selectedForce && tiles.map((tile) => {
          const { x, y } = hexToPixel(tile.coord, hexSize);
          const intensity = tile.forces[selectedForce];
          return (
            <polygon
              key={`overlay-${tile.coord.col}-${tile.coord.row}`}
              points={hexPolygonPoints(x, y, hexSize)}
              fill={forceOverlayColor(selectedForce, intensity)}
              pointerEvents="none"
            />
          );
        })}
      </g>
    </svg>
  );
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/HexMap/HexMap.tsx
git commit -m "feat: HexMap SVG component with overlay support"
```

---

## Task 11: Cosmology Panel Component

**Files:**
- Create: `src/components/Cosmology/ForceSlider.tsx`
- Create: `src/components/Cosmology/CosmologyPanel.tsx`

**Step 1: Implement ForceSlider**

Create `src/components/Cosmology/ForceSlider.tsx`:
```tsx
import type { ForceName } from '../../types';
import { FORCE_COLORS } from '../../engine/color';

const FORCE_LABELS: Record<ForceName, string> = {
  aether: 'Aether',
  verdance: 'Verdance',
  ignis: 'Ignis',
  umbra: 'Umbra',
  terra: 'Terra',
};

const FORCE_ICONS: Record<ForceName, string> = {
  aether: '✦',
  verdance: '🌿',
  ignis: '🔥',
  umbra: '🌑',
  terra: '⛰',
};

interface ForceSliderProps {
  force: ForceName;
  value: number;
  onChange: (force: ForceName, value: number) => void;
}

export function ForceSlider({ force, value, onChange }: ForceSliderProps) {
  const color = FORCE_COLORS[force].primary;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-lg w-6 text-center">{FORCE_ICONS[force]}</span>
      <span
        className="text-sm font-medium w-20"
        style={{ color }}
      >
        {FORCE_LABELS[force]}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(force, parseInt(e.target.value) / 100)}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          accentColor: color,
          background: `linear-gradient(to right, ${color} ${value * 100}%, #333 ${value * 100}%)`,
        }}
      />
      <span className="text-xs text-gray-400 w-10 text-right font-mono">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}
```

**Step 2: Implement CosmologyPanel**

Create `src/components/Cosmology/CosmologyPanel.tsx`:
```tsx
import { FORCE_NAMES, type CosmologyProfile, type ForceName } from '../../types';
import { COSMOLOGY_PRESETS, adjustForce } from '../../engine/cosmology';
import { ForceSlider } from './ForceSlider';

interface CosmologyPanelProps {
  cosmology: CosmologyProfile;
  seed: number;
  onCosmologyChange: (cosmology: CosmologyProfile) => void;
  onSeedChange: (seed: number) => void;
  onGenerate: () => void;
}

export function CosmologyPanel({
  cosmology,
  seed,
  onCosmologyChange,
  onSeedChange,
  onGenerate,
}: CosmologyPanelProps) {
  const handleForceChange = (force: ForceName, value: number) => {
    onCosmologyChange(adjustForce(cosmology, force, value));
  };

  const handlePreset = (presetName: string) => {
    onCosmologyChange(COSMOLOGY_PRESETS[presetName]);
  };

  const handleRandomSeed = () => {
    onSeedChange(Math.floor(Math.random() * 999999));
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-5">
      <h2 className="text-lg font-bold text-gray-100 tracking-wide">
        ✧ Cosmology
      </h2>

      {/* Force sliders */}
      <div className="space-y-1">
        {FORCE_NAMES.map(force => (
          <ForceSlider
            key={force}
            force={force}
            value={cosmology[force]}
            onChange={handleForceChange}
          />
        ))}
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Presets</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COSMOLOGY_PRESETS).map(name => (
            <button
              key={name}
              onClick={() => handlePreset(name)}
              className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-600"
            >
              {name.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Seed input */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 uppercase tracking-widest">Seed</label>
        <input
          type="number"
          value={seed}
          onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 font-mono"
        />
        <button
          onClick={handleRandomSeed}
          className="px-3 py-1.5 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
          title="Random seed"
        >
          🎲
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={onGenerate}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
      >
        Generate World
      </button>
    </div>
  );
}
```

**Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/components/Cosmology/
git commit -m "feat: CosmologyPanel with force sliders, presets, seed input, and generate button"
```

---

## Task 12: Info Panel Component

**Files:**
- Create: `src/components/UI/InfoPanel.tsx`

**Step 1: Implement InfoPanel**

Create `src/components/UI/InfoPanel.tsx`:
```tsx
import { FORCE_NAMES, type HexTile, type ForceName } from '../../types';
import { FORCE_COLORS } from '../../engine/color';

const TERRAIN_DISPLAY: Record<string, string> = {
  crystal_wastes: 'Crystal Wastes',
  enchanted_grove: 'Enchanted Grove',
  runed_mountains: 'Runed Mountains',
  deep_forest: 'Deep Forest',
  haunted_wood: 'Haunted Wood',
  volcanic_jungle: 'Volcanic Jungle',
  scorched_plains: 'Scorched Plains',
  lightning_fields: 'Lightning Fields',
  forge_mountains: 'Forge Mountains',
  shadow_marsh: 'Shadow Marsh',
  fungal_forest: 'Fungal Forest',
  void_rift: 'Void Rift',
  stone_highlands: 'Stone Highlands',
  obsidian_peaks: 'Obsidian Peaks',
  buried_ruins: 'Buried Ruins',
  contested_ground: 'Contested Ground',
};

interface InfoPanelProps {
  tile: HexTile | null;
}

export function InfoPanel({ tile }: InfoPanelProps) {
  if (!tile) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-gray-500 text-sm italic">
        Hover over a hex to see details
      </div>
    );
  }

  // Sort forces by value descending
  const sortedForces = [...FORCE_NAMES].sort((a, b) => tile.forces[b] - tile.forces[a]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest">Terrain</p>
        <p className="text-base font-bold text-gray-100">
          {TERRAIN_DISPLAY[tile.terrain] || tile.terrain}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          Hex ({tile.coord.col}, {tile.coord.row})
        </p>
      </div>

      {/* Force breakdown */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1.5">Forces</p>
        <div className="space-y-1">
          {sortedForces.map(force => (
            <ForceBar key={force} force={force} value={tile.forces[force]} />
          ))}
        </div>
      </div>

      {/* Properties */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox label="Elevation" value={tile.elevation} />
        <StatBox label="Moisture" value={tile.moisture} />
        <StatBox label="Magic" value={tile.magicDensity} />
      </div>
    </div>
  );
}

function ForceBar({ force, value }: { force: ForceName; value: number }) {
  const color = FORCE_COLORS[force].primary;
  const pct = Math.round(value * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-16 capitalize" style={{ color }}>{force}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right font-mono">{pct}%</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 rounded-lg p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-200">{(value * 100).toFixed(0)}%</p>
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/UI/InfoPanel.tsx
git commit -m "feat: InfoPanel showing terrain, force breakdown, and hex properties"
```

---

## Task 13: App Shell — Wire Everything Together

**Files:**
- Modify: `src/App.tsx` (replace Vite default)
- Modify: `src/index.css` (add Tailwind if not already)

**Step 1: Set up Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Update `vite.config.ts` to include the Tailwind plugin:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

**Step 2: Wire up App.tsx**

Replace `src/App.tsx`:
```tsx
import { useState, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexCoord, HexTile, ForceName, OverlayMode } from './types';
import { FORCE_NAMES } from './types';
import { createBalancedCosmology } from './engine/cosmology';
import { generateWorld } from './engine/hexGrid';
import { HexMap } from './components/HexMap/HexMap';
import { CosmologyPanel } from './components/Cosmology/CosmologyPanel';
import { InfoPanel } from './components/UI/InfoPanel';

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 15;

function App() {
  const [cosmology, setCosmology] = useState<CosmologyProfile>(createBalancedCosmology);
  const [seed, setSeed] = useState(42);
  const [tiles, setTiles] = useState<HexTile[]>(() =>
    generateWorld(createBalancedCosmology(), DEFAULT_COLS, DEFAULT_ROWS, 42)
  );
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedForce, setSelectedForce] = useState<ForceName | null>(null);

  const handleGenerate = useCallback(() => {
    setTiles(generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, seed));
    setSelectedHex(null);
    setHoveredHex(null);
  }, [cosmology, seed]);

  const hoveredTile = useMemo(() => {
    if (!hoveredHex) return null;
    return tiles.find(t => t.coord.col === hoveredHex.col && t.coord.row === hoveredHex.row) ?? null;
  }, [tiles, hoveredHex]);

  const selectedTile = useMemo(() => {
    if (!selectedHex) return null;
    return tiles.find(t => t.coord.col === selectedHex.col && t.coord.row === selectedHex.row) ?? null;
  }, [tiles, selectedHex]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-gray-800">
        <h1 className="text-xl font-bold tracking-wide text-center">
          ✧ Fantasy World Simulator ✧
        </h1>

        <CosmologyPanel
          cosmology={cosmology}
          seed={seed}
          onCosmologyChange={setCosmology}
          onSeedChange={setSeed}
          onGenerate={handleGenerate}
        />

        {/* Overlay controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Force Overlay</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setOverlayMode('none')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                overlayMode === 'none'
                  ? 'bg-gray-600 text-white border-gray-500'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
            >
              Off
            </button>
            {FORCE_NAMES.map(force => (
              <button
                key={force}
                onClick={() => {
                  setOverlayMode('single');
                  setSelectedForce(force);
                }}
                className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
                  overlayMode === 'single' && selectedForce === force
                    ? 'bg-gray-600 text-white border-gray-500'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                }`}
              >
                {force}
              </button>
            ))}
          </div>
        </div>

        <InfoPanel tile={selectedTile ?? hoveredTile} />
      </div>

      {/* Map area */}
      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <HexMap
          tiles={tiles}
          cols={DEFAULT_COLS}
          rows={DEFAULT_ROWS}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          overlayMode={overlayMode}
          selectedForce={selectedForce}
          onHexClick={setSelectedHex}
          onHexHover={setHoveredHex}
        />
      </div>
    </div>
  );
}

export default App;
```

**Step 3: Clean up Vite defaults**

Delete `src/App.css` if it exists. Ensure `src/main.tsx` imports `./index.css` and renders `<App />`.

**Step 4: Verify it builds and runs**

```bash
npm run build
```

Expected: Build succeeds with zero errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up App shell — sidebar with cosmology panel, hex map, info panel, overlay controls"
```

---

## Task 14: Visual Polish and Final Verification

**Step 1: Start dev server and take a screenshot**

```bash
npm run dev -- --host 0.0.0.0 &
```

Navigate to the app in a browser and verify:
- Hex grid renders with force-colored tiles
- Sliders adjust cosmology weights
- "Generate" button creates a new map
- Hovering hexes shows info panel data
- Force overlay buttons work

**Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Run build**

```bash
npm run build
```

Expected: Clean build.

**Step 5: Commit any polish fixes**

```bash
git add -A
git commit -m "chore: visual polish and final verification"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Project scaffolding (Vite + React + TS + Vitest) | Config files |
| 2 | Type definitions | `src/types/index.ts` |
| 3 | Cosmology engine | `src/engine/cosmology.ts` + tests |
| 4 | Hex math utilities | `src/lib/hexMath.ts` + tests |
| 5 | Force field generation (noise) | `src/engine/forceField.ts` + tests |
| 6 | Terrain classification | `src/engine/terrain.ts` + tests |
| 7 | Color blending engine | `src/engine/color.ts` + tests |
| 8 | Grid generation pipeline | `src/engine/hexGrid.ts` + tests |
| 9 | HexTile SVG component | `src/components/HexMap/HexTile.tsx` + test |
| 10 | HexMap SVG component | `src/components/HexMap/HexMap.tsx` |
| 11 | CosmologyPanel + ForceSlider | `src/components/Cosmology/` |
| 12 | InfoPanel | `src/components/UI/InfoPanel.tsx` |
| 13 | App shell wiring | `src/App.tsx` |
| 14 | Visual polish + verification | All |
