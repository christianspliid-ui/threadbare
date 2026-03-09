# Prose Generator Framework — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a generic graph-walking prose generator that composes rich, unique descriptions for any entity (location, agent, artifact) by walking its graph edges and layering content from the game's interconnected systems.

**Architecture:** Registry of ProseResolver functions per node type. Each resolver walks a specific edge type and returns ProseLayer fragments. The composer sorts, caps, and joins layers into final prose. All template strings live in a content data file.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph API, existing content packages (culture-content, chronicler-content, archetype-content, narrative-content, encounter-content)

---

### Task 1: ProseLayer Types + Constants

**Files:**
- Create: `src/types/prose.ts`
- Test: `src/types/__tests__/prose.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/prose.test.ts
import { describe, it, expect } from 'vitest';
import type { ProseLayer, ProseCategory, ProseMode } from '../prose';
import {
  MAX_LAYERS_PER_CATEGORY,
  SUMMARY_MAX_CHARS,
  FULL_MAX_PARAGRAPHS,
  PROSE_CATEGORIES,
} from '../prose';

describe('Prose types', () => {
  it('exports tunable constants', () => {
    expect(MAX_LAYERS_PER_CATEGORY).toBe(2);
    expect(SUMMARY_MAX_CHARS).toBe(200);
    expect(FULL_MAX_PARAGRAPHS).toBe(6);
  });

  it('defines all prose categories', () => {
    expect(PROSE_CATEGORIES).toContain('origin');
    expect(PROSE_CATEGORIES).toContain('atmosphere');
    expect(PROSE_CATEGORIES).toContain('character');
    expect(PROSE_CATEGORIES).toContain('tension');
    expect(PROSE_CATEGORIES).toContain('history');
    expect(PROSE_CATEGORIES.length).toBe(5);
  });

  it('ProseLayer shape is usable', () => {
    const layer: ProseLayer = {
      text: 'A quiet town on the edge of the world.',
      priority: 100,
      category: 'origin',
      source: 'subtypeResolver',
    };
    expect(layer.text).toBeTruthy();
    expect(layer.priority).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/prose.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/types/prose.ts

/** A single prose fragment produced by a resolver */
export interface ProseLayer {
  text: string;
  priority: number;
  category: ProseCategory;
  source: string;  // resolver name for debug tracing
}

/** Grouping categories for prose layers (max 2 per category in composed output) */
export type ProseCategory = 'origin' | 'atmosphere' | 'character' | 'tension' | 'history';

export const PROSE_CATEGORIES: ProseCategory[] = ['origin', 'atmosphere', 'character', 'tension', 'history'];

/** Output mode */
export type ProseMode = 'summary' | 'full';

/** Resolver function signature */
export type ProseResolver = (
  nodeId: string,
  graph: import('../engine/graph').WorldGraph,
  seed: number,
) => ProseLayer[];

/** Registry entry: node type → list of resolvers */
export type ResolverRegistry = Record<string, ProseResolver[]>;

// ─── Tunable Constants ────────────────────────────────────────
export const MAX_LAYERS_PER_CATEGORY = 2;
export const SUMMARY_MAX_CHARS = 200;
export const FULL_MAX_PARAGRAPHS = 6;
export const CULTURE_FLAVOR_CHANCE = 0.4;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/prose.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/prose.ts src/types/__tests__/prose.test.ts
git commit -m "feat: add ProseLayer types and constants for prose generator framework"
```

---

### Task 2: Prose Composer Engine (sort + cap + join)

**Files:**
- Create: `src/engine/proseComposer.ts`
- Test: `src/engine/__tests__/proseComposer.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/engine/__tests__/proseComposer.test.ts
import { describe, it, expect } from 'vitest';
import { composeProse, composeSummary } from '../proseComposer';
import type { ProseLayer } from '../../types/prose';

const makeLayers = (): ProseLayer[] => [
  { text: 'A capital built on ancient foundations.', priority: 100, category: 'origin', source: 'subtypeResolver' },
  { text: 'The grasslands stretch endlessly.', priority: 90, category: 'atmosphere', source: 'biomeResolver' },
  { text: 'Order-Light culture shaped every wall.', priority: 80, category: 'character', source: 'cultureResolver' },
  { text: 'Life threads pulse in the soil.', priority: 70, category: 'atmosphere', source: 'sphereResolver' },
  { text: 'The Iron Covenant rules with discipline.', priority: 60, category: 'character', source: 'factionResolver' },
  { text: 'Kael the folk hero holds court.', priority: 50, category: 'character', source: 'populationResolver' },
  { text: 'A great beast was slain here.', priority: 40, category: 'history', source: 'historyResolver' },
];

describe('composeProse (full mode)', () => {
  it('sorts by priority descending', () => {
    const result = composeProse(makeLayers());
    const paragraphs = result.split('\n\n');
    expect(paragraphs[0]).toContain('capital');
    expect(paragraphs[1]).toContain('grasslands');
  });

  it('caps at 2 per category', () => {
    const result = composeProse(makeLayers());
    // 3 character layers → only 2 should survive
    // origin(1) + atmosphere(2) + character(2) + history(1) = 6 paragraphs
    const paragraphs = result.split('\n\n');
    expect(paragraphs.length).toBeLessThanOrEqual(6);
    // The 3rd character layer (populationResolver, priority 50) should be dropped
    expect(result).not.toContain('folk hero');
  });

  it('returns empty string for empty layers', () => {
    expect(composeProse([])).toBe('');
  });

  it('respects MAX_PARAGRAPHS', () => {
    const manyLayers: ProseLayer[] = Array.from({ length: 20 }, (_, i) => ({
      text: `Layer ${i}`,
      priority: 100 - i,
      category: (['origin', 'atmosphere', 'character', 'tension', 'history'] as const)[i % 5],
      source: `resolver_${i}`,
    }));
    const paragraphs = composeProse(manyLayers).split('\n\n');
    expect(paragraphs.length).toBeLessThanOrEqual(6);
  });
});

describe('composeSummary', () => {
  it('returns highest priority layer text', () => {
    const result = composeSummary(makeLayers());
    expect(result).toContain('capital');
  });

  it('truncates at SUMMARY_MAX_CHARS', () => {
    const longLayer: ProseLayer = {
      text: 'A'.repeat(300),
      priority: 100,
      category: 'origin',
      source: 'test',
    };
    const result = composeSummary([longLayer]);
    expect(result.length).toBeLessThanOrEqual(203); // 200 + '...'
  });

  it('returns empty string for empty layers', () => {
    expect(composeSummary([])).toBe('');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/proseComposer.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/engine/proseComposer.ts
/**
 * Prose Composer — sorts, caps, and joins ProseLayer fragments into final prose.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { ProseLayer, ProseCategory } from '../types/prose';
import { MAX_LAYERS_PER_CATEGORY, SUMMARY_MAX_CHARS, FULL_MAX_PARAGRAPHS } from '../types/prose';

/**
 * Compose full prose from layers: sort by priority, cap per category, join.
 */
export function composeProse(layers: ProseLayer[]): string {
  if (layers.length === 0) return '';

  // Sort by priority descending
  const sorted = [...layers].sort((a, b) => b.priority - a.priority);

  // Cap per category
  const categoryCounts = new Map<ProseCategory, number>();
  const selected: ProseLayer[] = [];

  for (const layer of sorted) {
    if (selected.length >= FULL_MAX_PARAGRAPHS) break;
    const count = categoryCounts.get(layer.category) ?? 0;
    if (count >= MAX_LAYERS_PER_CATEGORY) continue;
    selected.push(layer);
    categoryCounts.set(layer.category, count + 1);
  }

  return selected.map(l => l.text).join('\n\n');
}

/**
 * Compose summary prose: take highest-priority layer, truncate if needed.
 */
export function composeSummary(layers: ProseLayer[]): string {
  if (layers.length === 0) return '';

  const sorted = [...layers].sort((a, b) => b.priority - a.priority);
  const text = sorted[0].text;

  if (text.length <= SUMMARY_MAX_CHARS) return text;
  return text.slice(0, SUMMARY_MAX_CHARS) + '...';
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/proseComposer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/proseComposer.ts src/engine/__tests__/proseComposer.test.ts
git commit -m "feat: add prose composer engine (sort, cap, join)"
```

---

### Task 3: Content Data Package (prose-layer-content.ts)

**Files:**
- Create: `src/data/prose-layer-content.ts`
- Test: `src/data/__tests__/prose-layer-content.test.ts`

This is the big content file. Each resolver has a content table keyed by the relevant property value. Templates use `{name}`, `{terrain}`, `{sphere}`, `{culture}` placeholders resolved at generation time.

**Step 1: Write the failing tests**

```typescript
// src/data/__tests__/prose-layer-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  BIOME_PROSE,
  CULTURE_LOCATION_PROSE,
  SPHERE_LOCATION_PROSE,
  SUBTYPE_ESTABLISHING_PROSE,
  FACTION_CONTROL_PROSE,
  ARCHETYPE_PROSE,
  DISPOSITION_PROSE,
  POPULATION_PROSE_TEMPLATES,
} from '../prose-layer-content';
import { SPHERE_NAMES } from '../../types/index';

describe('BIOME_PROSE', () => {
  it('has entries for common terrain types', () => {
    const requiredTerrains = ['grassland', 'mountains', 'desert', 'jungle', 'swamp', 'tundra', 'hills', 'volcanic'];
    for (const terrain of requiredTerrains) {
      expect(BIOME_PROSE[terrain], `missing biome prose for ${terrain}`).toBeDefined();
      expect(BIOME_PROSE[terrain].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all entries are non-empty strings', () => {
    for (const [terrain, templates] of Object.entries(BIOME_PROSE)) {
      for (const t of templates) {
        expect(t.length, `empty biome prose in ${terrain}`).toBeGreaterThan(20);
      }
    }
  });
});

describe('CULTURE_LOCATION_PROSE', () => {
  it('has entries for all 4 foundation pairs', () => {
    expect(CULTURE_LOCATION_PROSE['order_light']).toBeDefined();
    expect(CULTURE_LOCATION_PROSE['order_darkness']).toBeDefined();
    expect(CULTURE_LOCATION_PROSE['chaos_light']).toBeDefined();
    expect(CULTURE_LOCATION_PROSE['chaos_darkness']).toBeDefined();
  });

  it('each entry has at least 2 templates', () => {
    for (const [key, templates] of Object.entries(CULTURE_LOCATION_PROSE)) {
      expect(templates.length, `too few templates for ${key}`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('SPHERE_LOCATION_PROSE', () => {
  const creationSpheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
  it('has entries for all 8 creation spheres', () => {
    for (const sphere of creationSpheres) {
      expect(SPHERE_LOCATION_PROSE[sphere], `missing sphere prose for ${sphere}`).toBeDefined();
      expect(SPHERE_LOCATION_PROSE[sphere].length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('SUBTYPE_ESTABLISHING_PROSE', () => {
  const requiredSubtypes = ['hamlet', 'town', 'city', 'capital', 'camp', 'fort', 'shrine', 'temple', 'ruins', 'mining'];
  it('has entries for core location subtypes', () => {
    for (const sub of requiredSubtypes) {
      expect(SUBTYPE_ESTABLISHING_PROSE[sub], `missing subtype prose for ${sub}`).toBeDefined();
      expect(SUBTYPE_ESTABLISHING_PROSE[sub].length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('ARCHETYPE_PROSE', () => {
  it('has entries for common archetypes', () => {
    const archetypes = ['tragic_hero', 'trickster', 'folk_hero', 'schemer', 'true_believer'];
    for (const a of archetypes) {
      expect(ARCHETYPE_PROSE[a], `missing archetype prose for ${a}`).toBeDefined();
      expect(ARCHETYPE_PROSE[a].length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('FACTION_CONTROL_PROSE', () => {
  it('has at least 4 templates', () => {
    expect(FACTION_CONTROL_PROSE.length).toBeGreaterThanOrEqual(4);
  });

  it('templates use {faction} placeholder', () => {
    for (const t of FACTION_CONTROL_PROSE) {
      expect(t).toContain('{faction}');
    }
  });
});

describe('POPULATION_PROSE_TEMPLATES', () => {
  it('has templates with {agent} and {archetype} placeholders', () => {
    expect(POPULATION_PROSE_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const t of POPULATION_PROSE_TEMPLATES) {
      expect(t).toContain('{agent}');
    }
  });
});

describe('DISPOSITION_PROSE', () => {
  it('has entries for all 5 cooperation strategies', () => {
    const strategies = ['tit_for_tat', 'generous_tit_for_tat', 'always_cooperate', 'always_defect', 'grudger'];
    for (const s of strategies) {
      expect(DISPOSITION_PROSE[s], `missing disposition prose for ${s}`).toBeDefined();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/prose-layer-content.test.ts`
Expected: FAIL

**Step 3: Write the content data**

Create `src/data/prose-layer-content.ts` with all content tables. This is the largest file — expect ~600-900 lines of prose templates. Each table should have 2-4 entries per key to allow seeded variety.

Content tables to populate:
- `BIOME_PROSE`: ~15 terrain types × 2-3 templates each
- `CULTURE_LOCATION_PROSE`: 4 foundation pairs × 3 templates each
- `SPHERE_LOCATION_PROSE`: 8 creation spheres × 2-3 templates each
- `SUBTYPE_ESTABLISHING_PROSE`: ~15 location subtypes × 2-3 templates each
- `FACTION_CONTROL_PROSE`: 6 generic templates with `{faction}` placeholder
- `ARCHETYPE_PROSE`: 19 archetypes × 2 templates each
- `DISPOSITION_PROSE`: 5 strategies × 1 template each
- `POPULATION_PROSE_TEMPLATES`: 6 generic templates with `{agent}` and `{archetype}` placeholders

All prose must follow the Threadbare aesthetic: dark world, hidden magic, threads breaking through. No bright/cheerful tone. Read STYLE.md for voice reference.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/prose-layer-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/prose-layer-content.ts src/data/__tests__/prose-layer-content.test.ts
git commit -m "feat: add prose layer content package (~700 lines of Threadbare prose templates)"
```

---

### Task 4: Location Resolvers (biome, subtype, culture, sphere, faction, population)

**Files:**
- Create: `src/engine/proseResolvers.ts`
- Test: `src/engine/__tests__/proseResolvers.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/engine/__tests__/proseResolvers.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  subtypeResolver,
  biomeResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  populationResolver,
} from '../proseResolvers';

function buildTestGraph(): { graph: WorldGraph; locationId: string } {
  const graph = new WorldGraph();

  // Location node
  graph.addNode({
    id: 'loc_0',
    type: 'location',
    name: 'Thornhaven',
    properties: {
      locationSubtype: 'town',
      terrain: 'grassland',
      sphereInfluence: { life: 0.8, mind: 0.2, force: 0.1, matter: 0.05, energy: 0.0, spirit: 0.0, time: 0.0, entropy: 0.0 },
    },
  });

  // Culture node with identity
  graph.addNode({
    id: 'culture_0',
    type: 'actor',
    name: 'The Verdant Accord',
    properties: {
      actorType: 'culture',
      cultureIdentity: {
        foundationPair: 'order_light',
        creationSphere: 'life',
        biomeName: 'grassland',
      },
    },
  });

  // belongs_to edge (culture → location)
  graph.addEdge({
    id: 'edge_culture_loc',
    source: 'loc_0',
    target: 'culture_0',
    type: 'belongs_to',
    properties: { culturalStrength: 0.7 },
  });

  // Faction that controls location
  graph.addNode({
    id: 'faction_0',
    type: 'actor',
    name: 'The Iron Covenant',
    properties: { actorType: 'faction' },
  });
  graph.addEdge({
    id: 'edge_controls_0',
    source: 'faction_0',
    target: 'loc_0',
    type: 'controls',
    properties: { influence: 0.6 },
  });

  // Individual at location
  graph.addNode({
    id: 'ind_0',
    type: 'actor',
    name: 'Brynn',
    properties: {
      actorType: 'individual',
      narrativeArchetype: 'folk_hero',
    },
  });
  graph.addEdge({
    id: 'edge_at_0',
    source: 'ind_0',
    target: 'loc_0',
    type: 'located_at',
    properties: {},
  });

  return { graph, locationId: 'loc_0' };
}

describe('subtypeResolver', () => {
  it('returns an origin layer for a valid subtype', () => {
    const { graph, locationId } = buildTestGraph();
    const layers = subtypeResolver(locationId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('origin');
    expect(layers[0].priority).toBe(100);
    expect(layers[0].text.length).toBeGreaterThan(10);
  });

  it('returns empty for missing node', () => {
    const { graph } = buildTestGraph();
    expect(subtypeResolver('nonexistent', graph, 42)).toEqual([]);
  });
});

describe('biomeResolver', () => {
  it('returns an atmosphere layer', () => {
    const { graph, locationId } = buildTestGraph();
    const layers = biomeResolver(locationId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('atmosphere');
    expect(layers[0].priority).toBe(90);
  });
});

describe('cultureResolver', () => {
  it('returns a character layer when culture edge exists', () => {
    const { graph, locationId } = buildTestGraph();
    const layers = cultureResolver(locationId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('character');
    expect(layers[0].priority).toBe(80);
  });

  it('returns empty when no culture edge', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_x', type: 'location', name: 'Nowhere', properties: { locationSubtype: 'camp', terrain: 'desert' } });
    expect(cultureResolver('loc_x', graph, 42)).toEqual([]);
  });
});

describe('sphereResolver', () => {
  it('returns atmosphere layer for dominant sphere', () => {
    const { graph, locationId } = buildTestGraph();
    const layers = sphereResolver(locationId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('atmosphere');
    expect(layers[0].priority).toBe(70);
    expect(layers[0].source).toBe('sphereResolver');
  });
});

describe('factionResolver', () => {
  it('returns character layer when faction controls location', () => {
    const { graph, locationId } = buildTestGraph();
    const layers = factionResolver(locationId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('character');
    expect(layers[0].text).toContain('Iron Covenant');
  });
});

describe('populationResolver', () => {
  it('returns character layer with notable inhabitants', () => {
    const { graph, locationId } = buildTestGraph();
    const layers = populationResolver(locationId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('character');
    expect(layers[0].text).toContain('Brynn');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/proseResolvers.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

Create `src/engine/proseResolvers.ts` — each resolver walks the graph from the given nodeId, looks up content from `prose-layer-content.ts`, picks templates via seeded PRNG, resolves placeholders, and returns `ProseLayer[]`.

Key implementation patterns for each resolver:
- **subtypeResolver**: Read `properties.locationSubtype` → look up `SUBTYPE_ESTABLISHING_PROSE[subtype]` → pick via PRNG → replace `{name}` with node name
- **biomeResolver**: Read `properties.terrain` → look up `BIOME_PROSE[terrain]` → pick via PRNG
- **cultureResolver**: Walk incoming `belongs_to` edges → get culture node → read `cultureIdentity.foundationPair` → look up `CULTURE_LOCATION_PROSE[pair]` → pick via PRNG → replace `{culture}` with culture name
- **sphereResolver**: Read `properties.sphereInfluence` → find highest sphere (> 0.3 threshold) → look up `SPHERE_LOCATION_PROSE[sphere]` → pick via PRNG
- **factionResolver**: Walk incoming `controls` edges → get faction node → look up `FACTION_CONTROL_PROSE` → pick via PRNG → replace `{faction}` with faction name
- **populationResolver**: Walk incoming `located_at` edges → filter to individuals → for each (up to 2), get archetype → look up `POPULATION_PROSE_TEMPLATES` → replace `{agent}` and `{archetype}`

Each resolver returns `[]` if the required data is missing (fail-soft).

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/proseResolvers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/proseResolvers.ts src/engine/__tests__/proseResolvers.test.ts
git commit -m "feat: add 6 location prose resolvers (subtype, biome, culture, sphere, faction, population)"
```

---

### Task 5: Agent Resolvers (archetype, culture, faction, disposition)

**Files:**
- Modify: `src/engine/proseResolvers.ts` (add agent resolvers)
- Test: `src/engine/__tests__/proseResolvers-agent.test.ts`

**Step 1: Write failing tests**

```typescript
// src/engine/__tests__/proseResolvers-agent.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  dispositionResolver,
} from '../proseResolvers';

function buildAgentTestGraph(): { graph: WorldGraph; agentId: string } {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'ind_0',
    type: 'actor',
    name: 'Kael',
    properties: {
      actorType: 'individual',
      narrativeArchetype: 'tragic_hero',
      cooperationStrategy: 'tit_for_tat',
    },
  });

  graph.addNode({
    id: 'culture_0',
    type: 'actor',
    name: 'The Ashen Kin',
    properties: {
      actorType: 'culture',
      cultureIdentity: { foundationPair: 'chaos_darkness', creationSphere: 'entropy', biomeName: 'volcanic' },
    },
  });
  graph.addEdge({ id: 'e1', source: 'ind_0', target: 'culture_0', type: 'belongs_to', properties: {} });

  graph.addNode({ id: 'fac_0', type: 'actor', name: 'The Obsidian Watch', properties: { actorType: 'faction' } });
  graph.addEdge({ id: 'e2', source: 'ind_0', target: 'fac_0', type: 'member_of', properties: { role: 'leader' } });

  return { graph, agentId: 'ind_0' };
}

describe('archetypeResolver', () => {
  it('returns origin layer with archetype prose', () => {
    const { graph, agentId } = buildAgentTestGraph();
    const layers = archetypeResolver(agentId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('origin');
    expect(layers[0].priority).toBe(100);
  });
});

describe('agentCultureResolver', () => {
  it('returns character layer when agent has culture', () => {
    const { graph, agentId } = buildAgentTestGraph();
    const layers = agentCultureResolver(agentId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('character');
  });
});

describe('agentFactionResolver', () => {
  it('returns character layer when agent has faction', () => {
    const { graph, agentId } = buildAgentTestGraph();
    const layers = agentFactionResolver(agentId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('character');
    expect(layers[0].text).toContain('Obsidian Watch');
  });
});

describe('dispositionResolver', () => {
  it('returns character layer with disposition prose', () => {
    const { graph, agentId } = buildAgentTestGraph();
    const layers = dispositionResolver(agentId, graph, 42);
    expect(layers.length).toBe(1);
    expect(layers[0].category).toBe('character');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/proseResolvers-agent.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Add 4 agent resolvers to `proseResolvers.ts`:
- **archetypeResolver**: Read `properties.narrativeArchetype` → look up `ARCHETYPE_PROSE[archetype]` → pick via PRNG → replace `{name}` with agent name
- **agentCultureResolver**: Walk outgoing `belongs_to` edges → get culture node → read `cultureIdentity.foundationPair` → look up `CULTURE_LOCATION_PROSE[pair]` → adapt template for agent context
- **agentFactionResolver**: Walk outgoing `member_of` edges → get faction node → compose "{name} serves {faction}" template
- **dispositionResolver**: Read `properties.cooperationStrategy` → look up `DISPOSITION_PROSE[strategy]` → replace `{name}`

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/proseResolvers-agent.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/proseResolvers.ts src/engine/__tests__/proseResolvers-agent.test.ts
git commit -m "feat: add 4 agent prose resolvers (archetype, culture, faction, disposition)"
```

---

### Task 6: Prose Generator Public API + Registry

**Files:**
- Create: `src/engine/proseGenerator.ts`
- Test: `src/engine/__tests__/proseGenerator.test.ts`

**Step 1: Write failing tests**

```typescript
// src/engine/__tests__/proseGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateEntityProse } from '../proseGenerator';

function buildFullGraph(): WorldGraph {
  const graph = new WorldGraph();

  // Location with full connections
  graph.addNode({
    id: 'loc_0', type: 'location', name: 'Thornhaven',
    properties: {
      locationSubtype: 'town', terrain: 'grassland',
      sphereInfluence: { life: 0.8, mind: 0.1, force: 0.05, matter: 0.05, energy: 0, spirit: 0, time: 0, entropy: 0 },
    },
  });
  graph.addNode({
    id: 'culture_0', type: 'actor', name: 'The Verdant Accord',
    properties: { actorType: 'culture', cultureIdentity: { foundationPair: 'order_light', creationSphere: 'life', biomeName: 'grassland' } },
  });
  graph.addEdge({ id: 'e1', source: 'loc_0', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
  graph.addNode({ id: 'fac_0', type: 'actor', name: 'The Iron Covenant', properties: { actorType: 'faction' } });
  graph.addEdge({ id: 'e2', source: 'fac_0', target: 'loc_0', type: 'controls', properties: { influence: 0.6 } });
  graph.addNode({ id: 'ind_0', type: 'actor', name: 'Brynn', properties: { actorType: 'individual', narrativeArchetype: 'folk_hero', cooperationStrategy: 'generous_tit_for_tat' } });
  graph.addEdge({ id: 'e3', source: 'ind_0', target: 'loc_0', type: 'located_at', properties: {} });

  return graph;
}

describe('generateEntityProse', () => {
  it('generates full prose for a location with multiple paragraphs', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('loc_0', graph, 42, 'full');
    expect(result).toBeTruthy();
    const paragraphs = result.split('\n\n');
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  it('generates summary prose (single paragraph)', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('loc_0', graph, 42, 'summary');
    expect(result).toBeTruthy();
    expect(result.split('\n\n').length).toBe(1);
  });

  it('is deterministic for same seed', () => {
    const graph = buildFullGraph();
    const a = generateEntityProse('loc_0', graph, 42, 'full');
    const b = generateEntityProse('loc_0', graph, 42, 'full');
    expect(a).toBe(b);
  });

  it('varies with different seeds', () => {
    const graph = buildFullGraph();
    const a = generateEntityProse('loc_0', graph, 42, 'full');
    const b = generateEntityProse('loc_0', graph, 99, 'full');
    // At least some variation (not guaranteed to be totally different, but likely)
    // This is a soft assertion — we mainly want to ensure it doesn't crash
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });

  it('generates prose for agents', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('ind_0', graph, 42, 'full');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(20);
  });

  it('returns empty for nonexistent node', () => {
    const graph = buildFullGraph();
    expect(generateEntityProse('nonexistent', graph, 42, 'full')).toBe('');
  });

  it('returns empty for unsupported node types', () => {
    const graph = buildFullGraph();
    graph.addNode({ id: 'cosm_0', type: 'cosmology', name: 'Force', properties: {} });
    expect(generateEntityProse('cosm_0', graph, 42, 'full')).toBe('');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/proseGenerator.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// src/engine/proseGenerator.ts
/**
 * Graph-Walking Prose Generator — public API.
 *
 * Walks graph edges from any node and composes rich, unique descriptions
 * by layering content from the game's interconnected systems.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { WorldGraph } from './graph';
import type { ProseMode, ProseResolver } from '../types/prose';
import { composeProse, composeSummary } from './proseComposer';
import { emitTrace } from './traceBuffer';
import {
  subtypeResolver,
  biomeResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  populationResolver,
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  dispositionResolver,
} from './proseResolvers';

// ─── Resolver Registry ──────────────────────────────────────────────

const LOCATION_RESOLVERS: ProseResolver[] = [
  subtypeResolver,
  biomeResolver,
  cultureResolver,
  sphereResolver,
  factionResolver,
  populationResolver,
];

const ACTOR_RESOLVERS: ProseResolver[] = [
  archetypeResolver,
  agentCultureResolver,
  agentFactionResolver,
  dispositionResolver,
];

const RESOLVER_REGISTRY: Record<string, ProseResolver[]> = {
  location: LOCATION_RESOLVERS,
  actor: ACTOR_RESOLVERS,
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Generate prose for any graph entity by walking its edges and composing layers.
 *
 * @param nodeId - The graph node to describe
 * @param graph - The world graph
 * @param seed - World seed for deterministic PRNG
 * @param mode - 'summary' (1 paragraph) or 'full' (multi-paragraph)
 */
export function generateEntityProse(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
  mode: ProseMode,
): string {
  const node = graph.getNode(nodeId);
  if (!node) return '';

  const resolvers = RESOLVER_REGISTRY[node.type];
  if (!resolvers) return '';

  // For actors, only resolve individuals (not factions, cultures, gods yet)
  if (node.type === 'actor') {
    const actorType = node.properties?.actorType as string | undefined;
    if (actorType !== 'individual') return '';
  }

  // Hash nodeId into a per-entity seed offset
  let idHash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    idHash = ((idHash << 5) - idHash + nodeId.charCodeAt(i)) | 0;
  }
  const entitySeed = seed + Math.abs(idHash);

  // Run all resolvers, collect layers
  const allLayers = resolvers.flatMap(resolver => resolver(nodeId, graph, entitySeed));

  // Compose based on mode
  const result = mode === 'summary'
    ? composeSummary(allLayers)
    : composeProse(allLayers);

  // Trace
  emitTrace({
    tick: 0,
    category: 'narrative_generation',
    summary: `Prose [${mode}] for ${node.name}: ${allLayers.length} layers → ${result.length} chars`,
    tier: 'notable',
    sphereWords: [],
    culturalFlavorApplied: false,
    finalProse: result.slice(0, 120),
  });

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/proseGenerator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/proseGenerator.ts src/engine/__tests__/proseGenerator.test.ts
git commit -m "feat: add prose generator public API with resolver registry"
```

---

### Task 7: Integration Test — Full Location + Agent Prose

**Files:**
- Create: `src/engine/__tests__/proseGenerator-integration.test.ts`

**Step 1: Write integration tests**

```typescript
// src/engine/__tests__/proseGenerator-integration.test.ts
import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { generateEntityProse } from '../proseGenerator';
import type { CosmologyProfile, HexTile } from '../../types/index';

function makeTestTiles(): HexTile[] {
  const terrains = ['grassland', 'mountains', 'desert', 'jungle', 'swamp', 'hills'] as const;
  return terrains.map((terrain, i) => ({
    coord: { col: i, row: 0 },
    terrain,
  })) as HexTile[];
}

function makeCosmology(): CosmologyProfile {
  return {
    force: 0.3, matter: 0.2, energy: 0.15, life: 0.5,
    mind: 0.25, spirit: 0.3, time: 0.1, entropy: 0.15,
  };
}

describe('Prose Generator Integration', () => {
  it('generates unique full prose for each location from a real seeded world', () => {
    const { graph, locationIds } = seedWorld(makeCosmology(), makeTestTiles(), 42);

    const proseResults = locationIds.map(id =>
      generateEntityProse(id, graph, 42, 'full')
    );

    // Every location gets prose
    for (const prose of proseResults) {
      expect(prose.length).toBeGreaterThan(50);
    }

    // Prose is not identical across locations (they have different subtypes/terrains)
    const unique = new Set(proseResults);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('generates prose for agents that reflects their archetype and culture', () => {
    const { graph, individualIds } = seedWorld(makeCosmology(), makeTestTiles(), 42);

    const proseResults = individualIds.map(id =>
      generateEntityProse(id, graph, 42, 'full')
    );

    // Every agent gets prose
    for (const prose of proseResults) {
      expect(prose.length).toBeGreaterThan(20);
    }

    // At least some agents have distinct prose
    const unique = new Set(proseResults);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('summary mode produces short single-paragraph prose', () => {
    const { graph, locationIds } = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const summary = generateEntityProse(locationIds[0], graph, 42, 'summary');
    expect(summary.length).toBeLessThanOrEqual(203);
    expect(summary.split('\n\n').length).toBe(1);
  });

  it('same seed produces same prose (determinism)', () => {
    const w1 = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const w2 = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const p1 = generateEntityProse(w1.locationIds[0], w1.graph, 42, 'full');
    const p2 = generateEntityProse(w2.locationIds[0], w2.graph, 42, 'full');
    expect(p1).toBe(p2);
  });

  it('different seeds produce different prose', () => {
    const w1 = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const w2 = seedWorld(makeCosmology(), makeTestTiles(), 99);
    const p1 = generateEntityProse(w1.locationIds[0], w1.graph, 42, 'full');
    const p2 = generateEntityProse(w2.locationIds[0], w2.graph, 99, 'full');
    // Different worlds → likely different prose (soft assertion)
    expect(p1).toBeTruthy();
    expect(p2).toBeTruthy();
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/engine/__tests__/proseGenerator-integration.test.ts`
Expected: PASS (if previous tasks are correct)

**Step 3: Commit**

```bash
git add src/engine/__tests__/proseGenerator-integration.test.ts
git commit -m "test: add prose generator integration tests with real seeded worlds"
```

---

### Task 8: Wire into LocationView + AgentInfoCard

**Files:**
- Modify: `src/components/Game/LocationView.tsx`
- Modify: `src/components/Game/AgentInfoCard.tsx`
- Test: `src/engine/__tests__/proseGenerator-ui-integration.test.ts`

**Step 1: Write failing test for UI integration**

```typescript
// src/engine/__tests__/proseGenerator-ui-integration.test.ts
import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { generateEntityProse } from '../proseGenerator';
import type { CosmologyProfile, HexTile } from '../../types/index';

/**
 * Verify that the prose generator produces output compatible with UI expectations.
 */
describe('UI Integration Requirements', () => {
  const tiles: HexTile[] = [
    { coord: { col: 0, row: 0 }, terrain: 'grassland' },
    { coord: { col: 1, row: 0 }, terrain: 'mountains' },
    { coord: { col: 2, row: 0 }, terrain: 'desert' },
  ] as HexTile[];

  const cosmo: CosmologyProfile = {
    force: 0.3, matter: 0.2, energy: 0.15, life: 0.5,
    mind: 0.25, spirit: 0.3, time: 0.1, entropy: 0.15,
  };

  it('location full prose has no undefined or null strings', () => {
    const { graph, locationIds } = seedWorld(cosmo, tiles, 42);
    for (const id of locationIds) {
      const prose = generateEntityProse(id, graph, 42, 'full');
      expect(prose).not.toContain('undefined');
      expect(prose).not.toContain('null');
      expect(prose).not.toContain('{name}');
      expect(prose).not.toContain('{faction}');
      expect(prose).not.toContain('{agent}');
    }
  });

  it('agent full prose has no unresolved placeholders', () => {
    const { graph, individualIds } = seedWorld(cosmo, tiles, 42);
    for (const id of individualIds) {
      const prose = generateEntityProse(id, graph, 42, 'full');
      expect(prose).not.toContain('{');
      expect(prose).not.toContain('}');
    }
  });
});
```

**Step 2: Run test to verify it passes** (should already pass if content is correct)

Run: `npx vitest run src/engine/__tests__/proseGenerator-ui-integration.test.ts`

**Step 3: Wire into LocationView**

Modify `LocationView.tsx`:
- Import `generateEntityProse`
- Add a prose section below the location header, before agents list
- Call `generateEntityProse(locationId, graph, seed, 'full')`
- Render as `<div className="prose-section">` with paragraph breaks

Modify `AgentInfoCard.tsx`:
- Import `generateEntityProse`
- Add a description section below the agent header
- Call `generateEntityProse(agentId, graph, seed, 'summary')` for the info card
- Render as a prose paragraph in the card body

**Note:** The exact UI wiring depends on how `graph` and `seed` are passed through React props/context. Check existing patterns in `LocationView.tsx` and `AgentInfoCard.tsx` for how they access the game state. The `GameState` type has `graph` and `seed` fields. Components that need them typically receive them via props from `GameView.tsx` or hooks.

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/Game/LocationView.tsx src/components/Game/AgentInfoCard.tsx src/engine/__tests__/proseGenerator-ui-integration.test.ts
git commit -m "feat: wire prose generator into LocationView and AgentInfoCard"
```

---

### Task 9: Run Full Test Suite + Verification

**Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All ~2,200+ existing tests pass, plus ~50+ new prose generator tests.

**Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Build check**

```bash
npx vite build
```

Expected: Clean build.

**Step 4: Final commit**

If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix: prose generator verification fixes"
```
