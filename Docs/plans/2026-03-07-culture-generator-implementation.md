# Culture Generator (Pass 1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate 2–4 cultures at world seeding time with composed identities (foundation × creation sphere × biome), assign them to actors and locations via graph edges.

**Architecture:** New type file (`src/types/culture.ts`) for identity and edge types, new engine module (`src/engine/cultureGenerator.ts`) with pure functions, wired into `seedWorld()` between location creation and faction creation. Foundation balances passed as optional param to seedWorld (defaults to neutral on first cycle).

**Tech Stack:** TypeScript, vitest, existing WorldGraph + culture-content.ts data.

---

### Task 1: Add `belongs_to` Edge Type

**Files:**
- Modify: `src/types/graph.ts` (line ~67, EdgeType union)
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (new file — first test)

**Step 1: Write the failing test**

Create `src/engine/__tests__/cultureGenerator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';

describe('culture graph edges', () => {
  it('supports belongs_to edge type for culture assignment', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
    graph.addNode({ id: 'culture_1', type: 'actor', name: 'Culture', properties: { actorType: 'culture' } });
    graph.addEdge({
      id: 'edge_bt_1',
      source: 'actor_1',
      target: 'culture_1',
      type: 'belongs_to',
      properties: { culturalStrength: 0.7 },
    });
    const edges = graph.getEdgesByType('belongs_to');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.culturalStrength).toBe(0.7);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts`
Expected: FAIL — TypeScript error, `'belongs_to'` is not assignable to type `EdgeType`.

**Step 3: Add `belongs_to` to EdgeType**

In `src/types/graph.ts`, add `'belongs_to'` to the `EdgeType` union after `'member_of'`:

```typescript
  | 'member_of'        // individual is member of group/faction
  | 'belongs_to'       // actor/location belongs to culture (culturalStrength, cultureLayer)
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/graph.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): add belongs_to edge type for culture assignment"
```

---

### Task 2: Create Culture Type File

**Files:**
- Create: `src/types/culture.ts`
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (extend)

**Step 1: Write the failing test**

Add to `cultureGenerator.test.ts`:

```typescript
import type { CultureIdentity, CultureEdgeProperties } from '../../types/culture';
import {
  CULTURE_COUNT,
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
} from '../../types/culture';

describe('culture types', () => {
  it('CultureIdentity has all required fields', () => {
    const identity: CultureIdentity = {
      foundationBias: 'chaos',
      veneratedSpheres: ['force'],
      primaryBiome: 'desert',
      socialStructure: 'Fluid hierarchy',
      accountability: 'Personal honor',
      behavioralKeywords: ['storm-born'],
      materialVocabulary: ['heavy metals'],
      metaphorPalette: ['the unbroken wave'],
      formativeTraitSeedIds: ['weapon_mastery'],
      behavioralTraitSeedIds: ['challenge_compulsion'],
    };
    expect(identity.foundationBias).toBe('chaos');
    expect(identity.veneratedSpheres).toHaveLength(1);
  });

  it('CultureEdgeProperties has strength and optional layer', () => {
    const edge: CultureEdgeProperties = {
      culturalStrength: 0.7,
      cultureLayer: 'historical',
    };
    expect(edge.culturalStrength).toBe(0.7);
    expect(edge.cultureLayer).toBe('historical');
  });

  it('constants have expected ranges', () => {
    expect(CULTURE_COUNT.min).toBe(2);
    expect(CULTURE_COUNT.max).toBe(4);
    expect(CULTURE_STRENGTH_INDIVIDUAL.min).toBeGreaterThan(0);
    expect(CULTURE_STRENGTH_INDIVIDUAL.max).toBeLessThanOrEqual(1);
    expect(CULTURE_STRENGTH_FACTION.min).toBeGreaterThan(0);
    expect(DUAL_CULTURE_PROBABILITY).toBeGreaterThan(0);
    expect(DUAL_CULTURE_PROBABILITY).toBeLessThan(1);
    expect(CULTURELESS_PROBABILITY).toBeGreaterThan(0);
    expect(CULTURELESS_PROBABILITY).toBeLessThan(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts`
Expected: FAIL — cannot find module `../../types/culture`.

**Step 3: Create `src/types/culture.ts`**

```typescript
// src/types/culture.ts

import type { SphereName, TerrainType } from './index';

/**
 * Composed culture identity — merged from foundation + creation sphere + biome modifiers.
 * Generated at world seeding time by cultureGenerator.ts.
 */
export interface CultureIdentity {
  foundationBias: string;            // 'chaos' | 'order' | 'light' | 'darkness'
  veneratedSpheres: SphereName[];    // 1-2 creation spheres
  primaryBiome: TerrainType;
  socialStructure: string;           // from foundation modifier
  accountability: string;            // from foundation modifier
  behavioralKeywords: string[];      // merged from all 3 layers
  materialVocabulary: string[];      // merged from creation sphere + biome
  metaphorPalette: string[];         // merged from foundation + biome
  formativeTraitSeedIds: string[];   // which formative traits this culture grants
  behavioralTraitSeedIds: string[];  // which behavioral traits this culture carries
}

/**
 * Properties stored on belongs_to edges between actors/locations and culture nodes.
 */
export interface CultureEdgeProperties {
  culturalStrength: number;          // 0.0–1.0
  cultureLayer?: 'historical' | 'current';  // for locations only
}

// ─── Tunable Constants ──────────────────────────────────────────

export const CULTURE_COUNT = { min: 2, max: 4 };
export const CULTURE_STRENGTH_INDIVIDUAL = { min: 0.5, max: 0.9 };
export const CULTURE_STRENGTH_FACTION = { min: 0.6, max: 0.95 };
export const DUAL_CULTURE_PROBABILITY = 0.2;
export const CULTURELESS_PROBABILITY = 0.1;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/culture.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): add CultureIdentity type and tunable constants"
```

---

### Task 3: Add Culture Name Fragments to culture-content.ts

**Files:**
- Modify: `src/data/culture-content.ts` (append at end, before lookup functions section)
- Test: `src/data/__tests__/culture-content.test.ts` (extend)

**Step 1: Write the failing test**

Add to `src/data/__tests__/culture-content.test.ts`:

```typescript
import { CULTURE_NAME_FRAGMENTS } from '../culture-content';

describe('CULTURE_NAME_FRAGMENTS', () => {
  it('has foundation fragments for all 4 foundations', () => {
    expect(Object.keys(CULTURE_NAME_FRAGMENTS.foundation)).toEqual(
      expect.arrayContaining(['chaos', 'order', 'light', 'darkness'])
    );
    for (const frags of Object.values(CULTURE_NAME_FRAGMENTS.foundation)) {
      expect(frags.length).toBeGreaterThanOrEqual(3);
      for (const f of frags) {
        expect(typeof f).toBe('string');
        expect(f.length).toBeGreaterThan(0);
      }
    }
  });

  it('has sphere fragments for all 8 creation spheres', () => {
    const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
    for (const sphere of spheres) {
      expect(CULTURE_NAME_FRAGMENTS.sphere[sphere]).toBeDefined();
      expect(CULTURE_NAME_FRAGMENTS.sphere[sphere].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('has biome fragments for common terrain types', () => {
    const terrains = ['desert', 'mountains', 'grassland', 'jungle', 'tundra', 'swamp'];
    for (const t of terrains) {
      expect(CULTURE_NAME_FRAGMENTS.biome[t]).toBeDefined();
      expect(CULTURE_NAME_FRAGMENTS.biome[t].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('has at least 3 name patterns', () => {
    expect(CULTURE_NAME_FRAGMENTS.patterns.length).toBeGreaterThanOrEqual(3);
    for (const p of CULTURE_NAME_FRAGMENTS.patterns) {
      expect(p).toContain('{');
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts -- -t "CULTURE_NAME_FRAGMENTS"`
Expected: FAIL — `CULTURE_NAME_FRAGMENTS` is not exported.

**Step 3: Add name fragments to culture-content.ts**

Append before the `// ─── Lookup Functions` section (around line 775):

```typescript
// ─── Culture Name Fragments ─────────────────────────────────────

export const CULTURE_NAME_FRAGMENTS: {
  foundation: Record<string, string[]>;
  sphere: Record<string, string[]>;
  biome: Record<string, string[]>;
  patterns: string[];
} = {
  foundation: {
    chaos: ['Storm-Born', 'Untamed', 'Wild', 'Shifting', 'Unchained'],
    order: ['Stone-Set', 'Codex', 'Lawbound', 'Pillar', 'Measured'],
    light: ['Sun-Sworn', 'Open', 'Radiant', 'Witness', 'Bright'],
    darkness: ['Veiled', 'Shadow-Kept', 'Hidden', 'Inner', 'Masked'],
  },
  sphere: {
    force: ['Iron', 'War', 'Blade', 'Hammer', 'Shield'],
    matter: ['Stone', 'Craft', 'Forge', 'Earth', 'Anvil'],
    energy: ['Spark', 'Storm', 'Lightning', 'Flame', 'Current'],
    life: ['Root', 'Bloom', 'Seed', 'Grove', 'Green'],
    mind: ['Thought', 'Lore', 'Cipher', 'Ink', 'Scroll'],
    spirit: ['Ghost', 'Dream', 'Whisper', 'Veil', 'Prayer'],
    time: ['Hour', 'Tide', 'Dust', 'Ruin', 'Memory'],
    entropy: ['Ash', 'Hollow', 'Fade', 'Bone', 'Rust'],
  },
  biome: {
    desert: ['Sands', 'Dunes', 'Wastes', 'Oasis'],
    mountains: ['Peaks', 'Heights', 'Crags', 'Summit'],
    hills: ['Ridges', 'Slopes', 'Hollows', 'Downs'],
    grassland: ['Plains', 'Meadows', 'Fields', 'Steppe'],
    savanna: ['Savanna', 'Dry Fields', 'Sun-Lands', 'Flatlands'],
    steppe: ['Steppe', 'Windlands', 'Dry Reaches', 'Barrens'],
    deciduous_forest: ['Groves', 'Canopy', 'Glades', 'Timberlands'],
    dense_forest: ['Deepwood', 'Thickets', 'Dark Timber', 'Old Growth'],
    taiga: ['Pinelands', 'Frost-Wood', 'Northern Trees', 'Cold Forest'],
    jungle: ['Tangles', 'Green Depths', 'Rain Canopy', 'Overgrowth'],
    swamp: ['Mires', 'Bog-Lands', 'Still Waters', 'Fenlands'],
    bog: ['Marshes', 'Peatlands', 'Dark Pools', 'Fen'],
    tundra: ['Frost', 'Ice Fields', 'Cold Reach', 'Permafrost'],
    glacier: ['Glacier', 'Ice Wall', 'Frozen Reach', 'Rime'],
    volcanic: ['Cinder', 'Ember Fields', 'Ash Slopes', 'Crater'],
    broken_lands: ['Shatter', 'Ruin-Fields', 'Scarlands', 'Breach'],
    plateau: ['Mesa', 'High Table', 'Flatrock', 'Skyfield'],
    badlands: ['Badlands', 'Gulch', 'Dry Canyons', 'Cracked Earth'],
    farmland: ['Furrows', 'Tilth', 'Harvest-Lands', 'Homesteads'],
    forested_hills_evergreen: ['Pine Ridges', 'Green Heights', 'Evergreen Slopes', 'Needle Hills'],
    forested_hills_deciduous: ['Leaf Hollows', 'Autumn Ridges', 'Rustling Heights', 'Dappled Hills'],
    forested_hills_jungle: ['Vine Ridges', 'Green Crests', 'Canopy Hills', 'Humid Heights'],
  },
  patterns: [
    'The {foundation} {sphere} of the {biome}',
    'The {sphere} {biome}',
    'Children of the {foundation} {biome}',
    '{foundation} {sphere}',
    'The {foundation} {biome}',
    'Keepers of the {sphere} {biome}',
  ],
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/culture-content.test.ts -- -t "CULTURE_NAME_FRAGMENTS"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/culture-content.ts src/data/__tests__/culture-content.test.ts
git commit -m "feat(culture): add name fragment pools for culture name generation"
```

---

### Task 4: Implement `composeCultureIdentity`

**Files:**
- Create: `src/engine/cultureGenerator.ts`
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (extend)

**Step 1: Write the failing test**

Add to `cultureGenerator.test.ts`:

```typescript
import { composeCultureIdentity } from '../cultureGenerator';

describe('composeCultureIdentity', () => {
  it('merges foundation + sphere + biome into a CultureIdentity', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'desert');
    expect(identity.foundationBias).toBe('chaos');
    expect(identity.veneratedSpheres).toEqual(['force']);
    expect(identity.primaryBiome).toBe('desert');
    expect(identity.socialStructure).toBeTruthy();
    expect(identity.accountability).toBeTruthy();
    expect(identity.behavioralKeywords.length).toBeGreaterThan(0);
    expect(identity.materialVocabulary.length).toBeGreaterThan(0);
    expect(identity.metaphorPalette.length).toBeGreaterThan(0);
    expect(identity.formativeTraitSeedIds.length).toBeGreaterThan(0);
    expect(identity.behavioralTraitSeedIds.length).toBeGreaterThan(0);
  });

  it('merges keywords from all three layers without duplicates', () => {
    const identity = composeCultureIdentity('order', ['matter', 'mind'], 'mountains');
    const uniqueKeywords = new Set(identity.behavioralKeywords);
    expect(uniqueKeywords.size).toBe(identity.behavioralKeywords.length);
  });

  it('supports 2 venerated spheres', () => {
    const identity = composeCultureIdentity('light', ['life', 'spirit'], 'jungle');
    expect(identity.veneratedSpheres).toEqual(['life', 'spirit']);
    // Should have trait seeds from both spheres
    expect(identity.formativeTraitSeedIds.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back gracefully for unknown foundation', () => {
    const identity = composeCultureIdentity('unknown_foundation', ['force'], 'desert');
    // Should still produce a valid identity with sphere + biome data
    expect(identity.veneratedSpheres).toEqual(['force']);
    expect(identity.primaryBiome).toBe('desert');
    expect(identity.socialStructure).toBeTruthy(); // fallback value
  });

  it('falls back gracefully for unknown biome', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'ocean' as any);
    expect(identity.foundationBias).toBe('chaos');
    // materialVocabulary comes from sphere even if biome has no modifier
    expect(identity.materialVocabulary.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "composeCultureIdentity"`
Expected: FAIL — cannot find module `../cultureGenerator`.

**Step 3: Create `src/engine/cultureGenerator.ts` with `composeCultureIdentity`**

```typescript
// src/engine/cultureGenerator.ts

/**
 * Culture Generator — composes culture identities and assigns them at world seeding time.
 *
 * Pure functions called from seedWorld(). Each culture is generated from:
 * 1. Foundation bias (chaos/order/light/darkness)
 * 2. 1-2 venerated creation spheres
 * 3. Primary biome from origin location terrain
 *
 * Source: Docs/plans/2026-03-07-culture-generator-design.md
 */

import type { SphereName, TerrainType } from '../types/index';
import type { CultureIdentity } from '../types/culture';
import {
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
} from '../data/culture-content';

// ─── Helpers ─────────────────────────────────────────────────────

/** Merge arrays and deduplicate */
function mergeUnique(...arrays: string[][]): string[] {
  return [...new Set(arrays.flat())];
}

// ─── Composition ─────────────────────────────────────────────────

/**
 * Compose a culture identity from foundation + creation sphere + biome modifiers.
 * Merges keyword pools, material vocabulary, metaphor palettes, and trait seed IDs.
 */
export function composeCultureIdentity(
  foundationId: string,
  spheres: SphereName[],
  biome: TerrainType,
): CultureIdentity {
  const foundation = getFoundationModifier(foundationId);
  const sphereMods = spheres
    .map(s => getCreationSphereModifier(s))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const biomeMod = getBiomeModifier(biome);

  // Foundation data (with fallbacks)
  const socialStructure = foundation?.socialStructure ?? 'Mixed traditions';
  const accountability = foundation?.accountability ?? 'Community consensus';
  const foundationKeywords = foundation?.behavioralKeywords ?? [];
  const foundationMetaphors = foundation?.metaphorSeeds ?? [];

  // Sphere data
  const sphereKeywords = sphereMods.flatMap(m => m.behavioralKeywords);
  const sphereMaterial = sphereMods.flatMap(m => m.materialVocabulary);
  const sphereFormative = sphereMods.flatMap(m => m.formativeTraitSeeds);
  const sphereBehavioral = sphereMods.flatMap(m => m.behavioralTraitSeeds);

  // Biome data
  const biomeKeywords = biomeMod?.survivalTraitKeywords ?? [];
  const biomeMaterial = biomeMod?.materialCulture ?? [];
  const biomeMetaphors = biomeMod?.metaphorPalette ?? [];

  return {
    foundationBias: foundationId,
    veneratedSpheres: spheres,
    primaryBiome: biome,
    socialStructure,
    accountability,
    behavioralKeywords: mergeUnique(foundationKeywords, sphereKeywords, biomeKeywords),
    materialVocabulary: mergeUnique(sphereMaterial, biomeMaterial),
    metaphorPalette: mergeUnique(foundationMetaphors, biomeMetaphors),
    formativeTraitSeedIds: mergeUnique(sphereFormative),
    behavioralTraitSeedIds: mergeUnique(sphereBehavioral),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "composeCultureIdentity"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureGenerator.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): implement composeCultureIdentity with modifier merging"
```

---

### Task 5: Implement `generateCultureName`

**Files:**
- Modify: `src/engine/cultureGenerator.ts`
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (extend)

**Step 1: Write the failing test**

```typescript
import { generateCultureName } from '../cultureGenerator';

describe('generateCultureName', () => {
  const mockRng = (() => {
    let i = 0;
    return () => (i++ % 10) / 10;
  })();

  it('generates a non-empty string', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'desert');
    const name = generateCultureName(identity, mockRng);
    expect(name.length).toBeGreaterThan(0);
  });

  it('is deterministic with same rng sequence', () => {
    const rng1 = (() => { let i = 0; return () => (i++ % 10) / 10; })();
    const rng2 = (() => { let i = 0; return () => (i++ % 10) / 10; })();
    const identity = composeCultureIdentity('order', ['matter'], 'mountains');
    expect(generateCultureName(identity, rng1)).toBe(generateCultureName(identity, rng2));
  });

  it('handles unknown biome gracefully', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'ocean' as any);
    const name = generateCultureName(identity, mockRng);
    expect(name.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "generateCultureName"`
Expected: FAIL — `generateCultureName` not exported.

**Step 3: Add `generateCultureName` to cultureGenerator.ts**

```typescript
import { CULTURE_NAME_FRAGMENTS } from '../data/culture-content';

/** Pick a random element from an array using the provided rng */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generate a culture name from modifier fragments.
 * Uses pattern templates filled with foundation/sphere/biome name fragments.
 */
export function generateCultureName(
  identity: CultureIdentity,
  rng: () => number,
): string {
  const foundFrags = CULTURE_NAME_FRAGMENTS.foundation[identity.foundationBias];
  const foundFrag = foundFrags ? pick(rng, foundFrags) : identity.foundationBias;

  const sphereFrags = CULTURE_NAME_FRAGMENTS.sphere[identity.veneratedSpheres[0]];
  const sphereFrag = sphereFrags ? pick(rng, sphereFrags) : identity.veneratedSpheres[0];

  const biomeFrags = CULTURE_NAME_FRAGMENTS.biome[identity.primaryBiome];
  const biomeFrag = biomeFrags ? pick(rng, biomeFrags) : identity.primaryBiome;

  const pattern = pick(rng, CULTURE_NAME_FRAGMENTS.patterns);

  return pattern
    .replace('{foundation}', foundFrag)
    .replace('{sphere}', sphereFrag)
    .replace('{biome}', biomeFrag);
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "generateCultureName"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureGenerator.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): implement generateCultureName with template patterns"
```

---

### Task 6: Implement `generateCultures`

**Files:**
- Modify: `src/engine/cultureGenerator.ts`
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (extend)

**Step 1: Write the failing test**

```typescript
import { generateCultures } from '../cultureGenerator';
import { WorldGraph } from '../graph';
import { CULTURE_COUNT } from '../../types/culture';
import type { CosmologyProfile, HexTile, TerrainType } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  return { force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
           mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125 };
}

function mockLocationNodes(graph: WorldGraph, terrains: TerrainType[]): string[] {
  const ids: string[] = [];
  for (let i = 0; i < terrains.length; i++) {
    const id = `loc_${i}`;
    graph.addNode({
      id,
      type: 'location',
      name: `Location ${i}`,
      properties: { terrain: terrains[i] },
    });
    ids.push(id);
  }
  return ids;
}

describe('generateCultures', () => {
  it('creates between CULTURE_COUNT.min and CULTURE_COUNT.max culture nodes', () => {
    const graph = new WorldGraph();
    const locIds = mockLocationNodes(graph, ['desert', 'mountains', 'jungle', 'grassland']);
    const rng = (() => { let i = 0; return () => (i++ * 0.1) % 1; })();
    const cultureIds = generateCultures(graph, balancedCosmology(), locIds, rng);
    expect(cultureIds.length).toBeGreaterThanOrEqual(CULTURE_COUNT.min);
    expect(cultureIds.length).toBeLessThanOrEqual(CULTURE_COUNT.max);
  });

  it('creates culture nodes with type actor and actorType culture', () => {
    const graph = new WorldGraph();
    const locIds = mockLocationNodes(graph, ['desert', 'mountains', 'jungle']);
    const rng = (() => { let i = 0; return () => (i++ * 0.17) % 1; })();
    const cultureIds = generateCultures(graph, balancedCosmology(), locIds, rng);
    for (const id of cultureIds) {
      const node = graph.getNode(id);
      expect(node).toBeDefined();
      expect(node!.type).toBe('actor');
      expect(node!.properties.actorType).toBe('culture');
      expect(node!.properties.cultureIdentity).toBeDefined();
    }
  });

  it('assigns location culture edges (historical + current)', () => {
    const graph = new WorldGraph();
    const locIds = mockLocationNodes(graph, ['desert', 'mountains', 'jungle', 'grassland']);
    const rng = (() => { let i = 0; return () => (i++ * 0.13) % 1; })();
    const cultureIds = generateCultures(graph, balancedCosmology(), locIds, rng);

    // Each location should have at least one belongs_to edge
    for (const locId of locIds) {
      const edges = graph.getAllEdgesForNode(locId)
        .filter(e => e.type === 'belongs_to');
      expect(edges.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('is deterministic with same rng', () => {
    const makeGraph = () => {
      const g = new WorldGraph();
      mockLocationNodes(g, ['desert', 'mountains', 'jungle']);
      return g;
    };
    const locIds = ['loc_0', 'loc_1', 'loc_2'];
    const rng1 = (() => { let i = 0; return () => (i++ * 0.13) % 1; })();
    const rng2 = (() => { let i = 0; return () => (i++ * 0.13) % 1; })();
    const g1 = makeGraph();
    const g2 = makeGraph();
    const ids1 = generateCultures(g1, balancedCosmology(), locIds, rng1);
    const ids2 = generateCultures(g2, balancedCosmology(), locIds, rng2);
    expect(ids1).toEqual(ids2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "generateCultures"`
Expected: FAIL — `generateCultures` not exported.

**Step 3: Implement `generateCultures`**

Add to `cultureGenerator.ts`:

```typescript
import type { CosmologyProfile } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { CULTURE_COUNT } from '../types/culture';
import type { WorldGraph } from './graph';
import type { FoundationBalances } from '../types/worldSoul';
import { DEFAULT_FOUNDATION_BALANCES } from '../types/worldSoul';

// ─── Foundation Selection ────────────────────────────────────────

const FOUNDATION_IDS = ['chaos', 'order', 'light', 'darkness'] as const;

/**
 * Select a foundation bias weighted by current World-Soul foundation balances.
 * Negative chaos_order favors chaos, positive favors order. Same for light_darkness.
 */
function selectFoundation(
  rng: () => number,
  foundations: FoundationBalances,
): string {
  // Convert axis balances to per-foundation weights
  const weights: Record<string, number> = {
    chaos: Math.max(0.1, 1.0 - foundations.chaos_order),   // negative = more chaos
    order: Math.max(0.1, 1.0 + foundations.chaos_order),    // positive = more order
    light: Math.max(0.1, 1.0 - foundations.light_darkness), // negative = more light
    darkness: Math.max(0.1, 1.0 + foundations.light_darkness), // positive = more darkness
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const [id, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return id;
  }
  return 'chaos'; // fallback
}

/**
 * Select 1-2 creation spheres weighted by cosmology profile.
 */
function selectSpheres(
  rng: () => number,
  cosmology: CosmologyProfile,
): SphereName[] {
  const spheres = [...SPHERE_NAMES];
  const weights = spheres.map(s => Math.max(0.01, cosmology[s]));
  const total = weights.reduce((a, b) => a + b, 0);

  const pickWeighted = (): SphereName => {
    let roll = rng() * total;
    for (let i = 0; i < spheres.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return spheres[i];
    }
    return spheres[0];
  };

  const first = pickWeighted();
  // 50% chance of a second sphere
  if (rng() < 0.5) {
    let second = pickWeighted();
    let attempts = 0;
    while (second === first && attempts < 5) {
      second = pickWeighted();
      attempts++;
    }
    if (second !== first) return [first, second];
  }
  return [first];
}

/**
 * Generate all cultures for the world and add as graph nodes.
 * Also assigns each location a culture (historical + current layers).
 *
 * @param foundations Optional World-Soul foundation balances. Defaults to neutral (0,0).
 */
export function generateCultures(
  graph: WorldGraph,
  cosmology: CosmologyProfile,
  locationIds: string[],
  rng: () => number,
  foundations?: FoundationBalances,
): string[] {
  const founds = foundations ?? DEFAULT_FOUNDATION_BALANCES;
  const cultureCount = CULTURE_COUNT.min + Math.floor(
    rng() * (CULTURE_COUNT.max - CULTURE_COUNT.min + 1)
  );

  const cultureIds: string[] = [];
  const usedBiomes = new Set<string>();

  for (let i = 0; i < cultureCount; i++) {
    const id = `culture_${i}`;

    // Select foundation bias (weighted by World-Soul)
    const foundationId = selectFoundation(rng, founds);

    // Select 1-2 venerated creation spheres (weighted by cosmology)
    const spheres = selectSpheres(rng, cosmology);

    // Select biome from a location's terrain, preferring variety
    let biome: TerrainType = 'grassland';
    const shuffledLocs = [...locationIds].sort(() => rng() - 0.5);
    for (const locId of shuffledLocs) {
      const node = graph.getNode(locId);
      if (node) {
        const terrain = node.properties.terrain as TerrainType;
        if (!usedBiomes.has(terrain) || i >= locationIds.length) {
          biome = terrain;
          usedBiomes.add(terrain);
          break;
        }
      }
    }

    // Compose identity
    const identity = composeCultureIdentity(foundationId, spheres, biome);
    const name = generateCultureName(identity, rng);

    // Add culture node
    graph.addNode({
      id,
      type: 'actor',
      name,
      properties: {
        actorType: 'culture',
        cultureIdentity: identity,
      },
    });
    cultureIds.push(id);
  }

  // Assign cultures to locations (round-robin with historical + current)
  for (let i = 0; i < locationIds.length; i++) {
    const cultureId = cultureIds[i % cultureIds.length];
    assignCultureToLocation(graph, locationIds[i], cultureId, 'historical');
    assignCultureToLocation(graph, locationIds[i], cultureId, 'current');
  }

  return cultureIds;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "generateCultures"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureGenerator.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): implement generateCultures with foundation/sphere/biome selection"
```

---

### Task 7: Implement Actor Culture Assignment Functions

**Files:**
- Modify: `src/engine/cultureGenerator.ts`
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (extend)

**Step 1: Write the failing test**

```typescript
import {
  assignCultureToActor,
  assignCultureToLocation,
  assignCulturesToActors,
} from '../cultureGenerator';
import {
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
} from '../../types/culture';

describe('assignCultureToActor', () => {
  it('creates a belongs_to edge with culturalStrength', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'ind_0', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'culture_0', type: 'actor', name: 'Culture', properties: { actorType: 'culture' } });
    assignCultureToActor(graph, 'ind_0', 'culture_0', 0.7);
    const edges = graph.getEdgesByType('belongs_to');
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('ind_0');
    expect(edges[0].target).toBe('culture_0');
    expect(edges[0].properties.culturalStrength).toBe(0.7);
  });
});

describe('assignCultureToLocation', () => {
  it('creates a belongs_to edge with cultureLayer', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Place', properties: {} });
    graph.addNode({ id: 'culture_0', type: 'actor', name: 'Culture', properties: { actorType: 'culture' } });
    assignCultureToLocation(graph, 'loc_0', 'culture_0', 'historical');
    const edges = graph.getEdgesByType('belongs_to');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.cultureLayer).toBe('historical');
  });
});

describe('assignCulturesToActors', () => {
  it('assigns cultures to individuals following budget model', () => {
    const graph = new WorldGraph();
    const cultureIds = ['culture_0', 'culture_1'];
    for (const id of cultureIds) {
      graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'culture' } });
    }
    const indIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const id = `ind_${i}`;
      graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
      indIds.push(id);
    }
    const facIds = ['fac_0'];
    graph.addNode({ id: 'fac_0', type: 'actor', name: 'Faction', properties: { actorType: 'faction' } });

    const rng = (() => { let i = 0; return () => (i++ * 0.07) % 1; })();
    assignCulturesToActors(graph, indIds, facIds, cultureIds, rng);

    // All factions should have exactly 1 culture
    const facEdges = graph.getAllEdgesForNode('fac_0')
      .filter(e => e.type === 'belongs_to');
    expect(facEdges).toHaveLength(1);
    expect(facEdges[0].properties.culturalStrength).toBeGreaterThanOrEqual(CULTURE_STRENGTH_FACTION.min);
    expect(facEdges[0].properties.culturalStrength).toBeLessThanOrEqual(CULTURE_STRENGTH_FACTION.max);

    // Count individual culture assignments
    let singleCulture = 0;
    let dualCulture = 0;
    let cultureless = 0;
    for (const id of indIds) {
      const edges = graph.getAllEdgesForNode(id)
        .filter(e => e.type === 'belongs_to');
      if (edges.length === 0) cultureless++;
      else if (edges.length === 1) singleCulture++;
      else dualCulture++;
    }
    // At least some should be in each category (with 20 individuals)
    expect(singleCulture + dualCulture + cultureless).toBe(20);
    // Strength values should be within range
    for (const id of indIds) {
      const edges = graph.getAllEdgesForNode(id).filter(e => e.type === 'belongs_to');
      for (const e of edges) {
        expect(e.properties.culturalStrength).toBeGreaterThanOrEqual(CULTURE_STRENGTH_INDIVIDUAL.min);
        expect(e.properties.culturalStrength).toBeLessThanOrEqual(CULTURE_STRENGTH_INDIVIDUAL.max);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "assignCulture"`
Expected: FAIL — functions not exported.

**Step 3: Implement assignment functions**

Add to `cultureGenerator.ts`:

```typescript
import {
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
} from '../types/culture';

/**
 * Assign a culture to an actor with strength.
 * Creates a belongs_to edge from actor → culture.
 */
export function assignCultureToActor(
  graph: WorldGraph,
  actorId: string,
  cultureId: string,
  strength: number,
): void {
  graph.addEdge({
    id: `edge_culture_${actorId}_${cultureId}`,
    source: actorId,
    target: cultureId,
    type: 'belongs_to',
    properties: { culturalStrength: strength },
  });
}

/**
 * Assign culture to a location (historical or current layer).
 * Creates a belongs_to edge with cultureLayer property.
 */
export function assignCultureToLocation(
  graph: WorldGraph,
  locationId: string,
  cultureId: string,
  layer: 'historical' | 'current',
): void {
  graph.addEdge({
    id: `edge_culture_${locationId}_${cultureId}_${layer}`,
    source: locationId,
    target: cultureId,
    type: 'belongs_to',
    properties: { culturalStrength: 1.0, cultureLayer: layer },
  });
}

/**
 * Assign cultures to all actors based on budget model:
 * - 70% of individuals get 1 culture (strength 0.5–0.9)
 * - 20% get 2 cultures (strengths sum ≤1.0)
 * - 10% get 0 cultures
 * - Factions always get 1 culture (strength 0.6–0.95)
 */
export function assignCulturesToActors(
  graph: WorldGraph,
  individualIds: string[],
  factionIds: string[],
  cultureIds: string[],
  rng: () => number,
): void {
  if (cultureIds.length === 0) return;

  const pickCulture = () => cultureIds[Math.floor(rng() * cultureIds.length)];
  const randInRange = (min: number, max: number) => min + rng() * (max - min);

  // Assign factions: always 1 culture
  for (const facId of factionIds) {
    const strength = randInRange(CULTURE_STRENGTH_FACTION.min, CULTURE_STRENGTH_FACTION.max);
    assignCultureToActor(graph, facId, pickCulture(), strength);
  }

  // Assign individuals per budget model
  for (const indId of individualIds) {
    const roll = rng();

    if (roll < CULTURELESS_PROBABILITY) {
      // 10% — cultureless
      continue;
    } else if (roll < CULTURELESS_PROBABILITY + DUAL_CULTURE_PROBABILITY) {
      // 20% — dual culture
      const c1 = pickCulture();
      let c2 = pickCulture();
      let attempts = 0;
      while (c2 === c1 && cultureIds.length > 1 && attempts < 5) {
        c2 = pickCulture();
        attempts++;
      }
      const s1 = randInRange(CULTURE_STRENGTH_INDIVIDUAL.min, CULTURE_STRENGTH_INDIVIDUAL.max * 0.6);
      const s2 = Math.min(
        randInRange(CULTURE_STRENGTH_INDIVIDUAL.min, CULTURE_STRENGTH_INDIVIDUAL.max * 0.6),
        1.0 - s1,
      );
      assignCultureToActor(graph, indId, c1, s1);
      if (c2 !== c1) {
        assignCultureToActor(graph, indId, c2, s2);
      }
    } else {
      // 70% — single culture
      const strength = randInRange(CULTURE_STRENGTH_INDIVIDUAL.min, CULTURE_STRENGTH_INDIVIDUAL.max);
      assignCultureToActor(graph, indId, pickCulture(), strength);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -- -t "assignCulture"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureGenerator.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): implement actor/location culture assignment with budget model"
```

---

### Task 8: Wire Culture Generation into seedWorld

**Files:**
- Modify: `src/engine/worldSeed.ts`
- Test: `src/engine/__tests__/worldSeed.test.ts` (extend)

**Step 1: Write the failing test**

Add to `worldSeed.test.ts`:

```typescript
import { CULTURE_COUNT } from '../../types/culture';

describe('seedWorld culture integration', () => {
  it('SeedResult includes cultureIds', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(result.cultureIds).toBeDefined();
    expect(result.cultureIds.length).toBeGreaterThanOrEqual(CULTURE_COUNT.min);
    expect(result.cultureIds.length).toBeLessThanOrEqual(CULTURE_COUNT.max);
  });

  it('creates culture nodes in the graph', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const id of result.cultureIds) {
      const node = result.graph.getNode(id);
      expect(node).toBeDefined();
      expect(node!.type).toBe('actor');
      expect(node!.properties.actorType).toBe('culture');
      expect(node!.properties.cultureIdentity).toBeDefined();
    }
  });

  it('assigns cultures to locations with historical and current layers', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const locId of result.locationIds) {
      const edges = result.graph.getAllEdgesForNode(locId)
        .filter(e => e.type === 'belongs_to');
      expect(edges.length).toBeGreaterThanOrEqual(1);
      const layers = edges.map(e => e.properties.cultureLayer);
      expect(layers).toContain('historical');
      expect(layers).toContain('current');
    }
  });

  it('assigns cultures to individual actors', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    // At least some individuals should have culture edges
    let withCulture = 0;
    for (const id of result.individualIds) {
      const edges = result.graph.getAllEdgesForNode(id)
        .filter(e => e.type === 'belongs_to');
      if (edges.length > 0) withCulture++;
    }
    // Budget model: ~90% should have at least one culture
    expect(withCulture).toBeGreaterThan(result.individualIds.length * 0.5);
  });

  it('assigns cultures to factions', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const facId of result.factionIds) {
      const edges = result.graph.getAllEdgesForNode(facId)
        .filter(e => e.type === 'belongs_to');
      expect(edges).toHaveLength(1);
    }
  });

  it('culture generation is deterministic', () => {
    const a = seedWorld(balancedCosmology(), mockTiles(), 42);
    const b = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(a.cultureIds).toEqual(b.cultureIds);
    for (let i = 0; i < a.cultureIds.length; i++) {
      expect(a.graph.getNode(a.cultureIds[i])!.name)
        .toBe(b.graph.getNode(b.cultureIds[i])!.name);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts -- -t "culture"`
Expected: FAIL — `result.cultureIds` is undefined.

**Step 3: Wire culture generation into seedWorld**

In `src/engine/worldSeed.ts`:

1. Add imports at top:

```typescript
import type { FoundationBalances } from '../types/worldSoul';
import { generateCultures, assignCulturesToActors } from './cultureGenerator';
```

2. Extend `SeedResult` interface:

```typescript
export interface SeedResult {
  graph: WorldGraph;
  individualIds: string[];
  factionIds: string[];
  locationIds: string[];
  artifactIds: string[];
  cultureIds: string[];
}
```

3. Add optional `foundations` parameter to `seedWorld`:

```typescript
export function seedWorld(
  cosmology: CosmologyProfile,
  tiles: HexTile[],
  seed: number,
  injections?: ActiveInjection[],
  foundations?: FoundationBalances,
): SeedResult {
```

4. Add `cultureIds` array initialization alongside others:

```typescript
  const cultureIds: string[] = [];
```

5. Add culture generation phase **after** the Locations section and **before** the Factions section. Insert between the location adjacency edges block and the `// ── Factions` comment:

```typescript
  // ── Cultures ──────────────────────────────────────────────
  const generatedCultureIds = generateCultures(graph, cosmology, locationIds, rng, foundations);
  cultureIds.push(...generatedCultureIds);
```

6. After individuals section (after the individual loop closes), add actor culture assignment:

```typescript
  // ── Culture assignment to actors ──────────────────────────
  assignCulturesToActors(graph, individualIds, factionIds, cultureIds, rng);
```

7. Update return:

```typescript
  return { graph, individualIds, factionIds, locationIds, artifactIds, cultureIds };
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts -- -t "culture"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/worldSeed.ts src/engine/__tests__/worldSeed.test.ts
git commit -m "feat(culture): wire culture generation into seedWorld between locations and factions"
```

---

### Task 9: Integration Test

**Files:**
- Create: `src/engine/__tests__/culture-integration.test.ts`

**Step 1: Write the integration test**

```typescript
import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import type { CosmologyProfile, HexTile, TerrainType } from '../../types/index';
import type { CultureIdentity } from '../../types/culture';
import { CULTURE_COUNT } from '../../types/culture';

function balancedCosmology(): CosmologyProfile {
  return { force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
           mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125 };
}

function skewedCosmology(): CosmologyProfile {
  return { force: 0.4, matter: 0.2, energy: 0.1, life: 0.1,
           mind: 0.05, spirit: 0.05, time: 0.05, entropy: 0.05 };
}

function diverseTiles(): HexTile[] {
  const terrains: TerrainType[] = [
    'desert', 'mountains', 'jungle', 'grassland', 'tundra',
    'swamp', 'hills', 'volcanic', 'deciduous_forest', 'steppe',
  ];
  return terrains.map((terrain, i) => ({
    coord: { col: i % 5, row: Math.floor(i / 5) },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  }));
}

describe('culture generation integration', () => {
  it('full flow: seed → cultures → actor assignment → location assignment', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);

    // Cultures exist
    expect(result.cultureIds.length).toBeGreaterThanOrEqual(CULTURE_COUNT.min);
    expect(result.cultureIds.length).toBeLessThanOrEqual(CULTURE_COUNT.max);

    // Each culture has a composed identity
    for (const cId of result.cultureIds) {
      const node = result.graph.getNode(cId)!;
      const identity = node.properties.cultureIdentity as CultureIdentity;
      expect(identity.foundationBias).toBeTruthy();
      expect(identity.veneratedSpheres.length).toBeGreaterThanOrEqual(1);
      expect(identity.behavioralKeywords.length).toBeGreaterThan(0);
      expect(identity.materialVocabulary.length).toBeGreaterThan(0);
      expect(identity.metaphorPalette.length).toBeGreaterThan(0);
    }

    // Locations have dual-layer culture assignment
    for (const locId of result.locationIds) {
      const edges = result.graph.getAllEdgesForNode(locId)
        .filter(e => e.type === 'belongs_to');
      const layers = edges.map(e => e.properties.cultureLayer);
      expect(layers).toContain('historical');
      expect(layers).toContain('current');
    }

    // Factions all have exactly 1 culture
    for (const facId of result.factionIds) {
      const edges = result.graph.getAllEdgesForNode(facId)
        .filter(e => e.type === 'belongs_to');
      expect(edges).toHaveLength(1);
    }

    // Most individuals have cultures (budget model)
    let withCulture = 0;
    for (const indId of result.individualIds) {
      const edges = result.graph.getAllEdgesForNode(indId)
        .filter(e => e.type === 'belongs_to');
      if (edges.length > 0) withCulture++;
    }
    expect(withCulture).toBeGreaterThan(0);
  });

  it('skewed cosmology biases sphere selection', () => {
    // With force at 0.4, cultures should tend toward force sphere
    const results: string[][] = [];
    for (let seed = 0; seed < 10; seed++) {
      const result = seedWorld(skewedCosmology(), diverseTiles(), seed);
      for (const cId of result.cultureIds) {
        const identity = result.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;
        results.push(identity.veneratedSpheres);
      }
    }
    const forceCount = results.filter(spheres => spheres.includes('force')).length;
    // Force should appear more often than entropy (which has weight 0.05)
    const entropyCount = results.filter(spheres => spheres.includes('entropy')).length;
    expect(forceCount).toBeGreaterThan(entropyCount);
  });

  it('foundation balances bias culture foundation selection', () => {
    // Strong order bias should produce more order cultures
    const orderFoundations = { chaos_order: 0.8, light_darkness: 0.0 };
    const results: string[] = [];
    for (let seed = 0; seed < 10; seed++) {
      const result = seedWorld(balancedCosmology(), diverseTiles(), seed, undefined, orderFoundations);
      for (const cId of result.cultureIds) {
        const identity = result.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;
        results.push(identity.foundationBias);
      }
    }
    const orderCount = results.filter(f => f === 'order').length;
    const chaosCount = results.filter(f => f === 'chaos').length;
    expect(orderCount).toBeGreaterThan(chaosCount);
  });

  it('cultures have unique names', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);
    const names = result.cultureIds.map(id => result.graph.getNode(id)!.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
```

**Step 2: Run integration test**

Run: `npx vitest run src/engine/__tests__/culture-integration.test.ts`
Expected: PASS (all prior tasks must be complete)

**Step 3: Commit**

```bash
git add src/engine/__tests__/culture-integration.test.ts
git commit -m "test(culture): add integration tests for full culture generation flow"
```

---

### Task 10: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All ~1,743+ tests pass. No regressions from `belongs_to` EdgeType addition or `SeedResult.cultureIds` extension.

**Step 2: If tests fail**

Check for:
- Tests that destructure `SeedResult` without `cultureIds` — add it
- Tests that assert exact edge counts — update to account for `belongs_to` edges
- TypeScript errors from the optional `foundations` param

**Step 3: Fix any failures and commit**

```bash
git add -A
git commit -m "fix: update existing tests for culture generator integration"
```

---

### Task 11: Documentation Updates

**Step 1: Update CLAUDE.md**

- Add culture generator to project status
- Update engine stats
- Add changelog entries

**Step 2: Update Obsidian vault**

- Create `Systems/Culture Generator.md` system note
- Update `Index.md` with link

**Step 3: Update Notion backlog**

- Mark culture generator Pass 1 as complete

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for culture generator Pass 1 completion"
```
