# Culture Detail Page & Generic Entity Detail System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a generic two-tier entity detail system (sidebar card → full-screen codex page), implement culture-specific content within it, add cultural insight tracking, and generate procedural culture flags.

**Architecture:** Extract the existing agent two-tier pattern (AgentInfoCard → AgentProfileModal) into generic `EntityCard` and `EntityCodexPage` components driven by `EntityDetailConfig<T>`. Culture becomes the second entity type using this framework. Cultural insight is a parallel system to agent familiarity, stored as `culturalInsightMap` on GameState.

**Tech Stack:** React + TypeScript, existing WorldGraph, existing familiarity engine pattern, SVG generation for flags, CSS variables for Threadbare styling.

**Design doc:** `Docs/plans/2026-03-09-culture-detail-page-design.md`

---

## Task 1: Generic Entity Detail Types

**Files:**
- Create: `src/types/entityDetail.ts`
- Test: `src/types/__tests__/entityDetail.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/entityDetail.test.ts
import { describe, it, expect } from 'vitest';
import type {
  ProseVoice,
  EntitySection,
  StructuredBlock,
  EntityHeader,
  EntityDetail,
  EntityDetailConfig,
  MemberEntry,
  TraitEntry,
  LocationEntry,
  TimelineEntry,
} from '../entityDetail';
import { KNOWLEDGE_LEVELS } from '../familiarity';

describe('entityDetail types', () => {
  it('EntitySection has required fields', () => {
    const section: EntitySection = {
      id: 'origins',
      title: 'Origins',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: 'Test prose text',
    };
    expect(section.id).toBe('origins');
    expect(section.insightTier).toBe('stranger');
    expect(section.proseVoice).toBe('chronicle');
    expect(section.structuredData).toBeUndefined();
  });

  it('StructuredBlock discriminated union covers all types', () => {
    const memberList: StructuredBlock = {
      type: 'member_list',
      members: [{ id: 'a1', name: 'Kael', role: 'leader', tier: 3 }],
    };
    const traitGrid: StructuredBlock = {
      type: 'trait_grid',
      traits: [{ name: 'Resilient', category: 'behavioral' }],
    };
    const territorySummary: StructuredBlock = {
      type: 'territory_summary',
      locations: [{ id: 'loc1', name: 'Ashen Peak', biome: 'mountain' }],
    };
    const keywordCloud: StructuredBlock = {
      type: 'keyword_cloud',
      keywords: ['bone', 'ash', 'iron'],
      accent: '#d4a040',
    };
    const timeline: StructuredBlock = {
      type: 'timeline',
      events: [{ tick: 10, label: 'Founded the outpost', significance: 0.8 }],
    };
    expect(memberList.type).toBe('member_list');
    expect(traitGrid.type).toBe('trait_grid');
    expect(territorySummary.type).toBe('territory_summary');
    expect(keywordCloud.type).toBe('keyword_cloud');
    expect(timeline.type).toBe('timeline');
  });

  it('EntityHeader has required and optional fields', () => {
    const header: EntityHeader = {
      name: 'The Keepers of Ashen Lore',
      accentColor: '#d4a040',
    };
    expect(header.name).toBe('The Keepers of Ashen Lore');
    expect(header.iconSvg).toBeUndefined();
    expect(header.badges).toBeUndefined();
  });

  it('EntityDetail has card and codex sections', () => {
    const detail: EntityDetail = {
      header: { name: 'Test', accentColor: '#fff' },
      cardSections: [],
      codexSections: [],
    };
    expect(detail.cardSections).toEqual([]);
    expect(detail.heroImageUrl).toBeUndefined();
  });

  it('EntityDetailConfig maps data to EntityDetail', () => {
    type TestData = { label: string };
    const config: EntityDetailConfig<TestData> = {
      getDetail: (data, insightLevel) => ({
        header: { name: data.label, accentColor: '#000' },
        cardSections: [],
        codexSections: [],
      }),
    };
    const result = config.getDetail({ label: 'X' }, 'stranger');
    expect(result.header.name).toBe('X');
  });

  it('all 5 knowledge levels are valid insightTier values', () => {
    for (const level of KNOWLEDGE_LEVELS) {
      const section: EntitySection = {
        id: 'test',
        title: 'Test',
        insightTier: level,
        proseVoice: 'chronicle',
        prose: '',
      };
      expect(section.insightTier).toBe(level);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/entityDetail.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/types/entityDetail.ts
import type { KnowledgeLevel } from './familiarity';

// ─── Prose Voice ──────────────────────────────────────────────────

/** Prose voice for entity sections */
export type ProseVoice = 'chronicle' | 'oral' | 'rumor' | 'divine';

// ─── Structured Block Entries ─────────────────────────────────────

export interface MemberEntry {
  id: string;
  name: string;
  role?: string;
  tier?: number;
}

export interface TraitEntry {
  name: string;
  category?: string;
}

export interface LocationEntry {
  id: string;
  name: string;
  biome?: string;
}

export interface TimelineEntry {
  tick: number;
  label: string;
  significance?: number;
}

export interface EntityBadge {
  label: string;
  color: string;
  tooltip?: string;
}

// ─── Structured Block (discriminated union) ───────────────────────

export type StructuredBlock =
  | { type: 'member_list'; members: MemberEntry[] }
  | { type: 'trait_grid'; traits: TraitEntry[] }
  | { type: 'territory_summary'; locations: LocationEntry[] }
  | { type: 'keyword_cloud'; keywords: string[]; accent: string }
  | { type: 'bond_list'; bonds: { name: string; sentiment: string; strength: string }[] }
  | { type: 'domain_grid'; domains: { domain: string; word: string }[] }
  | { type: 'timeline'; events: TimelineEntry[] };

// ─── Entity Section ───────────────────────────────────────────────

/** A single section in an entity detail view */
export interface EntitySection {
  id: string;
  title: string;
  insightTier: KnowledgeLevel;
  proseVoice: ProseVoice;
  prose: string;
  structuredData?: StructuredBlock;
}

// ─── Entity Header ────────────────────────────────────────────────

/** Entity header data — common across all entity types */
export interface EntityHeader {
  name: string;
  subtitle?: string;
  iconSvg?: string;
  accentColor: string;
  badges?: EntityBadge[];
}

// ─── Entity Detail ────────────────────────────────────────────────

/** Full entity detail descriptor — what the generic components render */
export interface EntityDetail {
  header: EntityHeader;
  cardSections: EntitySection[];
  codexSections: EntitySection[];
  heroImageUrl?: string;
  heroImageTier?: KnowledgeLevel;
}

// ─── Entity Detail Config ─────────────────────────────────────────

/** Config that maps raw entity data to EntityDetail */
export interface EntityDetailConfig<TData> {
  getDetail: (data: TData, insightLevel: KnowledgeLevel) => EntityDetail;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/entityDetail.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/entityDetail.ts src/types/__tests__/entityDetail.test.ts
git commit -m "feat: add generic entity detail types (EntitySection, StructuredBlock, EntityDetailConfig)"
```

---

## Task 2: ClimateGroup Type & BIOME_CLIMATE_MAP

**Files:**
- Create: `src/types/climate.ts`
- Test: `src/types/__tests__/climate.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/climate.test.ts
import { describe, it, expect } from 'vitest';
import {
  BIOME_CLIMATE_MAP,
  DEFAULT_CLIMATE,
  getClimateGroup,
  type ClimateGroup,
} from '../climate';

describe('climate types', () => {
  it('has 4 climate groups', () => {
    const groups = new Set(Object.values(BIOME_CLIMATE_MAP));
    expect(groups.size).toBe(4);
    expect(groups.has('cold')).toBe(true);
    expect(groups.has('temperate')).toBe(true);
    expect(groups.has('warm_dry')).toBe(true);
    expect(groups.has('warm_wet')).toBe(true);
  });

  it('DEFAULT_CLIMATE is temperate', () => {
    expect(DEFAULT_CLIMATE).toBe('temperate');
  });

  it('getClimateGroup returns correct group for known biomes', () => {
    expect(getClimateGroup('tundra')).toBe('cold');
    expect(getClimateGroup('forest')).toBe('temperate');
    expect(getClimateGroup('desert')).toBe('warm_dry');
    expect(getClimateGroup('jungle')).toBe('warm_wet');
  });

  it('getClimateGroup falls back to temperate for unknown biomes', () => {
    expect(getClimateGroup('mythical_realm' as any)).toBe('temperate');
  });

  it('every mapped biome has a valid climate group', () => {
    const validGroups: ClimateGroup[] = ['cold', 'temperate', 'warm_dry', 'warm_wet'];
    for (const group of Object.values(BIOME_CLIMATE_MAP)) {
      expect(validGroups).toContain(group);
    }
  });

  it('cold biomes include tundra, ice_field, glacier, mountain', () => {
    expect(BIOME_CLIMATE_MAP['tundra']).toBe('cold');
    expect(BIOME_CLIMATE_MAP['ice_field']).toBe('cold');
    expect(BIOME_CLIMATE_MAP['glacier']).toBe('cold');
    expect(BIOME_CLIMATE_MAP['mountain']).toBe('cold');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/climate.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Copy the `ClimateGroup`, `BIOME_CLIMATE_MAP`, `DEFAULT_CLIMATE`, `getClimateGroup` exactly from the design doc §7 (lines 90-128).

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/climate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/climate.ts src/types/__tests__/climate.test.ts
git commit -m "feat: add ClimateGroup type and BIOME_CLIMATE_MAP lookup table"
```

---

## Task 3: Cultural Insight Map on GameState + Insight Gains

**Files:**
- Modify: `src/types/gameState.ts` — add `culturalInsightMap`
- Modify: `src/types/familiarity.ts` — add `CULTURAL_INSIGHT_GAINS` constants
- Create: `src/engine/culturalInsight.ts` — insight gain/query functions
- Test: `src/engine/__tests__/culturalInsight.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/culturalInsight.test.ts
import { describe, it, expect } from 'vitest';
import {
  getCulturalInsight,
  addCulturalInsight,
  getCulturalKnowledgeLevel,
  CULTURAL_INSIGHT_GAINS,
} from '../culturalInsight';

describe('culturalInsight', () => {
  it('getCulturalInsight returns 0 for unknown cultures', () => {
    const map = new Map<string, number>();
    expect(getCulturalInsight(map, 'culture-1')).toBe(0);
  });

  it('addCulturalInsight returns new map with increased value', () => {
    const map = new Map<string, number>();
    const newMap = addCulturalInsight(map, 'culture-1', 0.1);
    expect(newMap.get('culture-1')).toBeCloseTo(0.1);
    expect(map.get('culture-1')).toBeUndefined(); // immutable
  });

  it('addCulturalInsight clamps at 1.0', () => {
    const map = new Map<string, number>([['c1', 0.95]]);
    const newMap = addCulturalInsight(map, 'c1', 0.2);
    expect(newMap.get('c1')).toBe(1.0);
  });

  it('getCulturalKnowledgeLevel maps score to tier', () => {
    expect(getCulturalKnowledgeLevel(0)).toBe('stranger');
    expect(getCulturalKnowledgeLevel(0.1)).toBe('stranger');
    expect(getCulturalKnowledgeLevel(0.2)).toBe('recognised');
    expect(getCulturalKnowledgeLevel(0.4)).toBe('known');
    expect(getCulturalKnowledgeLevel(0.6)).toBe('intimate');
    expect(getCulturalKnowledgeLevel(0.8)).toBe('transparent');
  });

  it('CULTURAL_INSIGHT_GAINS has all 5 sources', () => {
    expect(CULTURAL_INSIGHT_GAINS.territory_visit).toBe(0.02);
    expect(CULTURAL_INSIGHT_GAINS.member_familiarity_factor).toBe(0.1);
    expect(CULTURAL_INSIGHT_GAINS.scry_on_member).toBe(0.15);
    expect(CULTURAL_INSIGHT_GAINS.intervention_in_territory).toBe(0.10);
    expect(CULTURAL_INSIGHT_GAINS.worshipper_per_tick).toBe(0.05);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/culturalInsight.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/engine/culturalInsight.ts
/**
 * Cultural Insight Engine — Knowledge Fog of War for cultures.
 *
 * Tracks how much the player knows about each culture.
 * Parallel system to familiarity engine but with culture-specific gain sources.
 */

import type { KnowledgeLevel } from '../types/familiarity';
import { FAMILIARITY_THRESHOLDS, KNOWLEDGE_LEVELS } from '../types/familiarity';

// Re-use the same threshold table as agent familiarity (same 5-tier scale).
// culturalInsightMap uses the exact same 0.0-1.0 range.

/** Cultural insight gain amounts per source. */
export const CULTURAL_INSIGHT_GAINS = {
  /** Per visible hex in a culture's territory */
  territory_visit: 0.02,
  /** Multiplier × aggregate belongs_to agent familiarities */
  member_familiarity_factor: 0.1,
  /** Per scry action targeting a culture member */
  scry_on_member: 0.15,
  /** Per divine intervention in a culture's territory */
  intervention_in_territory: 0.10,
  /** Per tick per worshipper who belongs to the culture */
  worshipper_per_tick: 0.05,
} as const;

/** Get cultural insight score for a culture. Returns 0 if unknown. */
export function getCulturalInsight(
  map: Map<string, number>,
  cultureId: string,
): number {
  return map.get(cultureId) ?? 0;
}

/** Add cultural insight. Returns new map (immutable). */
export function addCulturalInsight(
  map: Map<string, number>,
  cultureId: string,
  amount: number,
): Map<string, number> {
  const current = map.get(cultureId) ?? 0;
  const newVal = Math.min(1.0, current + amount);
  const newMap = new Map(map);
  newMap.set(cultureId, newVal);
  return newMap;
}

/** Derive knowledge level from cultural insight score. */
export function getCulturalKnowledgeLevel(insight: number): KnowledgeLevel {
  for (let i = KNOWLEDGE_LEVELS.length - 1; i >= 0; i--) {
    if (insight >= FAMILIARITY_THRESHOLDS[KNOWLEDGE_LEVELS[i]]) {
      return KNOWLEDGE_LEVELS[i];
    }
  }
  return 'stranger';
}
```

Then add `culturalInsightMap` to `GameState` in `src/types/gameState.ts`:

```typescript
// Add after familiarityMap line:
// Cultural Knowledge Fog of War
culturalInsightMap: Map<string, number>;  // culture ID -> insight score (0.0-1.0)
```

And initialize it in `src/engine/gameInit.ts` alongside `familiarityMap`:

```typescript
culturalInsightMap: new Map<string, number>(),
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/culturalInsight.test.ts`
Expected: PASS

**Step 5: Also run existing tests to confirm no breakage**

Run: `npx vitest run src/engine/__tests__/gameInit.test.ts`
Expected: PASS (GameState shape change needs the new field in init)

**Step 6: Commit**

```bash
git add src/engine/culturalInsight.ts src/engine/__tests__/culturalInsight.test.ts src/types/gameState.ts src/engine/gameInit.ts
git commit -m "feat: add culturalInsightMap to GameState and cultural insight engine"
```

---

## Task 4: Procedural Flag Generator

**Files:**
- Create: `src/engine/cultureFlag.ts`
- Test: `src/engine/__tests__/cultureFlag.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/cultureFlag.test.ts
import { describe, it, expect } from 'vitest';
import { generateCultureFlag } from '../cultureFlag';
import type { CultureIdentity } from '../../types/culture';

function makeMockIdentity(overrides?: Partial<CultureIdentity>): CultureIdentity {
  return {
    foundationBias: 'chaos',
    veneratedSpheres: ['force', 'entropy'],
    primaryBiome: 'mountain',
    socialStructure: 'warrior bands',
    accountability: 'trial by combat',
    behavioralKeywords: ['fierce', 'nomadic'],
    materialVocabulary: ['bone', 'iron'],
    metaphorPalette: ['storm', 'blade'],
    formativeTraitSeedIds: [],
    behavioralTraitSeedIds: [],
    ...overrides,
  };
}

describe('generateCultureFlag', () => {
  it('returns a valid SVG string', () => {
    const svg = generateCultureFlag(makeMockIdentity(), 42);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  it('is deterministic for the same seed', () => {
    const identity = makeMockIdentity();
    const svg1 = generateCultureFlag(identity, 42);
    const svg2 = generateCultureFlag(identity, 42);
    expect(svg1).toBe(svg2);
  });

  it('varies with different seeds', () => {
    const identity = makeMockIdentity();
    const svg1 = generateCultureFlag(identity, 42);
    const svg2 = generateCultureFlag(identity, 99);
    expect(svg1).not.toBe(svg2);
  });

  it('uses sphere colors from veneratedSpheres', () => {
    const svg = generateCultureFlag(makeMockIdentity({ veneratedSpheres: ['force'] }), 1);
    // Force sphere color is red-ish (#ff3333 or similar) — SVG should contain it
    expect(svg).toMatch(/#[0-9a-fA-F]{6}/);
  });

  it('chaos foundation produces asymmetric/jagged shapes', () => {
    const svg = generateCultureFlag(makeMockIdentity({ foundationBias: 'chaos' }), 1);
    // Chaos uses asymmetric polygons — just verify it has path or polygon elements
    expect(svg).toMatch(/<(path|polygon)/);
  });

  it('order foundation produces geometric/symmetric shapes', () => {
    const svg = generateCultureFlag(makeMockIdentity({ foundationBias: 'order' }), 1);
    expect(svg).toMatch(/<(rect|circle|polygon)/);
  });

  it('biome motif glyph varies by primaryBiome', () => {
    const mountainSvg = generateCultureFlag(makeMockIdentity({ primaryBiome: 'mountain' }), 1);
    const jungleSvg = generateCultureFlag(makeMockIdentity({ primaryBiome: 'jungle' }), 1);
    expect(mountainSvg).not.toBe(jungleSvg);
  });

  it('includes a biome motif element', () => {
    const svg = generateCultureFlag(makeMockIdentity(), 1);
    // Should have a motif group
    expect(svg).toContain('class="motif"');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureFlag.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/engine/cultureFlag.ts` — a pure function `generateCultureFlag(identity: CultureIdentity, seed: number): string` that:

1. Uses `mulberry32(seed)` for deterministic PRNG
2. Looks up sphere colors via `getSphereColor(identity.veneratedSpheres[0])`
3. Selects foundation shape vocabulary:
   - **chaos**: asymmetric polygons, jagged edges, rotated elements
   - **order**: geometric shapes (rect, circle), symmetric arrangement
   - **light**: radial patterns, open space, bright center
   - **darkness**: layered/enclosed shapes, concentric elements
4. Adds a biome motif glyph (mountain peak ▲, wave ~, tree ♣, sun ☀, etc.) from a `BIOME_MOTIFS` lookup
5. Composes into an SVG string with `viewBox="0 0 100 100"` and 100×100 coordinate space

Key implementation details:
- Module-level `BIOME_MOTIFS: Record<string, string>` mapping terrain types to SVG path snippets
- Module-level `FOUNDATION_SHAPES` with 4 shape generators (one per foundation)
- Output is a self-contained SVG string stored on the culture graph node
- The `class="motif"` attribute on the biome glyph element enables test assertions

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureFlag.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureFlag.ts src/engine/__tests__/cultureFlag.test.ts
git commit -m "feat: procedural SVG culture flag generator (foundation shapes + sphere colors + biome motifs)"
```

---

## Task 5: Wire Flag Generation into World Seeding

**Files:**
- Modify: `src/engine/worldSeed.ts` — call `generateCultureFlag` during culture creation
- Modify: `src/engine/cultureGenerator.ts` — store flag SVG on culture node properties
- Test: `src/engine/__tests__/worldSeed-cultureFlag.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/worldSeed-cultureFlag.test.ts
import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';

describe('worldSeed culture flags', () => {
  it('every culture node has a flagSvg property', () => {
    const result = seedWorld(42);
    const cultureNodes = result.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    expect(cultureNodes.length).toBeGreaterThan(0);
    for (const node of cultureNodes) {
      const props = node.properties as Record<string, unknown>;
      expect(typeof props.flagSvg).toBe('string');
      expect(props.flagSvg as string).toContain('<svg');
    }
  });

  it('flag SVGs are deterministic per seed', () => {
    const result1 = seedWorld(42);
    const result2 = seedWorld(42);
    const cultures1 = result1.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    const cultures2 = result2.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    for (let i = 0; i < cultures1.length; i++) {
      expect((cultures1[i].properties as any).flagSvg)
        .toBe((cultures2[i].properties as any).flagSvg);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/worldSeed-cultureFlag.test.ts`
Expected: FAIL — flagSvg is undefined on culture nodes

**Step 3: Write implementation**

In `cultureGenerator.ts`, after creating the culture node with `graph.addNode(...)`, call `generateCultureFlag(identity, subSeed)` and store the result in the node's properties as `flagSvg`. The `subSeed` is derived from the culture's PRNG to ensure determinism.

Alternatively, in `worldSeed.ts` where `generateCultures` is called, iterate over the returned culture IDs and add flagSvg as a second pass. Either approach works — choose the one that keeps `cultureGenerator.ts` as the single owner of culture node creation.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/worldSeed-cultureFlag.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureGenerator.ts src/engine/__tests__/worldSeed-cultureFlag.test.ts
git commit -m "feat: wire procedural flag SVG generation into culture creation"
```

---

## Task 6: Culture Detail Aggregator

**Files:**
- Create: `src/engine/cultureDetail.ts`
- Test: `src/engine/__tests__/cultureDetail.test.ts`

This is the culture equivalent of `agentDetail.ts`. It provides:
- `getCultureDetail()` — raw data (internal use)
- `getCultureInfoCard()` — sidebar card data, gated by cultural insight
- `getCultureCodexData()` — codex page data, gated by cultural insight

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/cultureDetail.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getCultureDetail,
  getCultureInfoCard,
  getCultureCodexData,
  type CultureDetailData,
  type CultureInfoCardData,
  type CultureCodexData,
} from '../cultureDetail';

function buildGraphWithCulture(): { graph: WorldGraph; cultureId: string } {
  const graph = new WorldGraph();

  // Culture node
  const cultureId = 'culture-keepers';
  graph.addNode({
    id: cultureId,
    type: 'actor',
    name: 'Keepers of Ashen Lore',
    properties: {
      actorType: 'culture',
      cultureIdentity: {
        foundationBias: 'order',
        veneratedSpheres: ['mind', 'time'],
        primaryBiome: 'mountain',
        socialStructure: 'council of elders',
        accountability: 'public shaming',
        behavioralKeywords: ['stoic', 'scholarly', 'patient'],
        materialVocabulary: ['stone tablets', 'ink', 'brass instruments'],
        metaphorPalette: ['mountain that remembers', 'ink that never fades'],
        formativeTraitSeedIds: ['resilient', 'cautious'],
        behavioralTraitSeedIds: ['scholarly', 'traditional'],
      },
      flagSvg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
    },
  });

  // Location in territory
  const locId = 'loc-peak';
  graph.addNode({ id: locId, type: 'location', name: 'Ashen Peak', properties: { terrain: 'mountain' } });
  graph.addEdge({ source: locId, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 0.8 } });

  // Member agent
  const agentId = 'agent-kael';
  graph.addNode({ id: agentId, type: 'actor', name: 'Kael the Inscriber', properties: { actorType: 'individual', locationId: locId } });
  graph.addEdge({ source: agentId, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 0.7 } });

  return { graph, cultureId };
}

describe('getCultureDetail', () => {
  it('returns CultureDetailData for a valid culture', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const detail = getCultureDetail(graph, cultureId);
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Keepers of Ashen Lore');
    expect(detail!.identity.foundationBias).toBe('order');
    expect(detail!.flagSvg).toContain('<svg');
    expect(detail!.members.length).toBe(1);
    expect(detail!.territoryLocations.length).toBe(1);
  });

  it('returns null for non-existent culture', () => {
    const graph = new WorldGraph();
    expect(getCultureDetail(graph, 'nope')).toBeNull();
  });
});

describe('getCultureInfoCard', () => {
  it('returns header + flag at stranger tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const card = getCultureInfoCard(graph, cultureId, 'stranger');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Keepers of Ashen Lore');
    expect(card!.flagSvg).toContain('<svg');
    expect(card!.knowledgeLevel).toBe('stranger');
    // Stranger should NOT have social structure
    expect(card!.socialStructure).toBeUndefined();
  });

  it('reveals social structure at recognised tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const card = getCultureInfoCard(graph, cultureId, 'recognised');
    expect(card!.socialStructure).toBe('council of elders');
  });

  it('reveals material vocabulary at known tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const card = getCultureInfoCard(graph, cultureId, 'known');
    expect(card!.materialVocabulary).toBeDefined();
    expect(card!.materialVocabulary!.length).toBeGreaterThan(0);
  });
});

describe('getCultureCodexData', () => {
  it('returns codex sections gated by insight tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'transparent');
    expect(codex).not.toBeNull();
    expect(codex!.sections.length).toBeGreaterThan(0);
    // All sections should be visible at transparent
    for (const section of codex!.sections) {
      expect(section.prose).toBeTruthy();
    }
  });

  it('stranger tier only sees origins section', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'stranger');
    expect(codex).not.toBeNull();
    const visibleSections = codex!.sections;
    // Only header + whispered rumors at stranger
    expect(visibleSections.length).toBeLessThanOrEqual(2);
  });

  it('intimate tier has oral tradition voice', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'transparent');
    const oralSections = codex!.sections.filter(s => s.proseVoice === 'oral');
    expect(oralSections.length).toBeGreaterThan(0);
  });

  it('includes members at known+ tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'known');
    const memberSection = codex!.sections.find(s => s.id === 'figures_of_note');
    expect(memberSection).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureDetail.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `src/engine/cultureDetail.ts` following the same aggregator pattern as `agentDetail.ts`:

1. `getCultureDetail(graph, cultureId)` → walks graph for all culture data (identity, members via incoming `belongs_to` edges, territory locations via incoming `belongs_to` edges from locations, flag SVG)
2. `getCultureInfoCard(graph, cultureId, knowledgeLevel)` → sidebar card data with insight gating per design doc §3 sidebar table
3. `getCultureCodexData(graph, cultureId, knowledgeLevel)` → array of `EntitySection[]` following codex table, with prose generated from templates (chronicle/oral voices) and structured data blocks

Prose generation uses template slot-filling from CultureIdentity fields:
- Chronicle voice: `"The {name} trace their origins to the {primaryBiome}. Their society is built around {socialStructure}, with accountability enforced through {accountability}."`
- Oral voice: `"We are the children of the {metaphorPalette[0]}. Our {materialVocabulary[0]} carry the memories of our ancestors..."`

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureDetail.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureDetail.ts src/engine/__tests__/cultureDetail.test.ts
git commit -m "feat: culture detail aggregator with knowledge-gated info card and codex data"
```

---

## Task 7: Generic EntityCard Component

**Files:**
- Create: `src/components/shared/EntityCard.tsx`
- Test: `src/components/shared/__tests__/EntityCard.test.tsx`

This replaces `AgentInfoCard.tsx` as the generic sidebar card. It renders an `EntityHeader` + array of `EntitySection[]`. Each entity type provides its own sections via config.

**Step 1: Write the failing test**

```typescript
// src/components/shared/__tests__/EntityCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityCard } from '../EntityCard';
import type { EntityHeader, EntitySection } from '../../../types/entityDetail';

const mockHeader: EntityHeader = {
  name: 'Test Entity',
  accentColor: '#d4a040',
  subtitle: 'A test subtitle',
  iconSvg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="gold"/></svg>',
};

const mockSections: EntitySection[] = [
  {
    id: 'origins',
    title: 'Origins',
    insightTier: 'stranger',
    proseVoice: 'chronicle',
    prose: 'Long ago, in the time before reckoning...',
  },
  {
    id: 'ways',
    title: 'Ways & Materials',
    insightTier: 'known',
    proseVoice: 'chronicle',
    prose: 'They craft with bone and stone.',
    structuredData: { type: 'keyword_cloud', keywords: ['bone', 'stone', 'iron'], accent: '#d4a040' },
  },
];

describe('EntityCard', () => {
  it('renders header with name', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Test Entity')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('A test subtitle')).toBeTruthy();
  });

  it('renders flag/icon SVG when provided', () => {
    const { container } = render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(container.querySelector('.entity-icon')).toBeTruthy();
  });

  it('renders prose sections', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Long ago, in the time before reckoning...')).toBeTruthy();
  });

  it('renders keyword_cloud structured data', () => {
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('bone')).toBeTruthy();
    expect(screen.getByText('stone')).toBeTruthy();
  });

  it('calls onBack when back button clicked', () => {
    let called = false;
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => { called = true; }} onViewCodex={() => {}} />
    );
    fireEvent.click(screen.getByLabelText('back'));
    expect(called).toBe(true);
  });

  it('calls onViewCodex when view button clicked', () => {
    let called = false;
    render(
      <EntityCard header={mockHeader} sections={mockSections} onBack={() => {}} onViewCodex={() => { called = true; }} />
    );
    fireEvent.click(screen.getByText(/Codex|Sheet/i));
    expect(called).toBe(true);
  });

  it('renders member_list structured data', () => {
    const sections: EntitySection[] = [{
      id: 'members',
      title: 'Figures of Note',
      insightTier: 'known',
      proseVoice: 'chronicle',
      prose: 'Notable members include:',
      structuredData: {
        type: 'member_list',
        members: [{ id: 'm1', name: 'Kael the Inscriber', role: 'elder', tier: 3 }],
      },
    }];
    render(
      <EntityCard header={mockHeader} sections={sections} onBack={() => {}} onViewCodex={() => {}} />
    );
    expect(screen.getByText('Kael the Inscriber')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/__tests__/EntityCard.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `EntityCard.tsx` following the existing `AgentInfoCard.tsx` pattern (same visual structure: header with back button + name + codex link, scrollable content, footer with full codex button) but driven entirely by generic `EntityHeader` + `EntitySection[]` props.

Key renderers:
- `renderStructuredBlock(block: StructuredBlock)` — switch on `block.type` to render member_list, keyword_cloud, trait_grid, territory_summary, timeline
- Section prose rendered in italic for 'oral' voice, regular for 'chronicle'
- Uses `React.memo`, CSS variables, Threadbare dark aesthetic

**Props interface:**
```typescript
interface EntityCardProps {
  header: EntityHeader;
  sections: EntitySection[];
  onBack: () => void;
  onViewCodex: () => void;
  onZoomToLocation?: (locationId: string) => void;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/__tests__/EntityCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/EntityCard.tsx src/components/shared/__tests__/EntityCard.test.tsx
git commit -m "feat: generic EntityCard sidebar component with structured block renderers"
```

---

## Task 8: Generic EntityCodexPage Component

**Files:**
- Create: `src/components/shared/EntityCodexPage.tsx`
- Test: `src/components/shared/__tests__/EntityCodexPage.test.tsx`

Full-screen modal equivalent of `AgentProfileModal` but driven by generic entity data.

**Step 1: Write the failing test**

```typescript
// src/components/shared/__tests__/EntityCodexPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityCodexPage } from '../EntityCodexPage';
import type { EntityHeader, EntitySection } from '../../../types/entityDetail';

const mockHeader: EntityHeader = {
  name: 'Keepers of Ashen Lore',
  accentColor: '#d4a040',
  iconSvg: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="gold"/></svg>',
  badges: [{ label: 'Order', color: '#8080ff' }],
};

const mockSections: EntitySection[] = [
  { id: 'origins', title: 'Origins', insightTier: 'stranger', proseVoice: 'chronicle', prose: 'Founded in the Age of Ash...' },
  { id: 'inner_voice', title: 'The Inner Voice', insightTier: 'transparent', proseVoice: 'oral', prose: 'We are the children of stone...' },
];

describe('EntityCodexPage', () => {
  it('renders as a dialog', () => {
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('renders entity name', () => {
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    expect(screen.getByText('Keepers of Ashen Lore')).toBeTruthy();
  });

  it('renders flag/icon SVG in header', () => {
    const { container } = render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    expect(container.querySelector('.entity-icon')).toBeTruthy();
  });

  it('renders badges', () => {
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    expect(screen.getByText('Order')).toBeTruthy();
  });

  it('renders hero image when provided', () => {
    render(
      <EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}}
        heroImageUrl="/culture-art/order_mind_cold.png" />
    );
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('does not render hero image when not provided', () => {
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders all sections with titles', () => {
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    expect(screen.getByText('Origins')).toBeTruthy();
    expect(screen.getByText('The Inner Voice')).toBeTruthy();
  });

  it('oral voice prose is italic', () => {
    const { container } = render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={() => {}} />);
    const oralSection = container.querySelector('[data-voice="oral"]');
    expect(oralSection).toBeTruthy();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when close button clicked', () => {
    const onClose = vi.fn();
    render(<EntityCodexPage header={mockHeader} sections={mockSections} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/__tests__/EntityCodexPage.test.tsx`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `EntityCodexPage.tsx` following `AgentProfileModal.tsx` structure (fixed overlay + backdrop + centered modal + scrollable sections) but driven by `EntityHeader` + `EntitySection[]` + optional `heroImageUrl`.

**Props interface:**
```typescript
interface EntityCodexPageProps {
  header: EntityHeader;
  sections: EntitySection[];
  onClose: () => void;
  heroImageUrl?: string;
}
```

Uses the same `renderStructuredBlock` helper from Task 7 — extract it to `src/components/shared/StructuredBlockRenderer.tsx` so both EntityCard and EntityCodexPage can share it.

Key visual details:
- Large flag/icon at top of header (64×64 or larger)
- Badges rendered as small colored pills
- Hero image (full-width, 200px height, object-fit cover) between header and first section
- Oral voice prose: italic, slightly different color (`--text-tertiary`)
- Chronicle voice prose: regular weight, `--text-secondary`
- `data-voice` attribute on prose containers for testability

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/__tests__/EntityCodexPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/EntityCodexPage.tsx src/components/shared/__tests__/EntityCodexPage.test.tsx src/components/shared/StructuredBlockRenderer.tsx
git commit -m "feat: generic EntityCodexPage full-screen modal with hero image and structured block renderers"
```

---

## Task 9: Culture Detail Config (EntityDetailConfig for Cultures)

**Files:**
- Create: `src/engine/cultureDetailConfig.ts`
- Test: `src/engine/__tests__/cultureDetailConfig.test.ts`

Maps `CultureDetailData` → `EntityDetail` following the design doc §3 section layout tables.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/cultureDetailConfig.test.ts
import { describe, it, expect } from 'vitest';
import { cultureDetailConfig } from '../cultureDetailConfig';
import type { CultureDetailData } from '../cultureDetail';
import type { CultureIdentity } from '../../types/culture';

function makeMockCultureData(): CultureDetailData {
  return {
    id: 'culture-keepers',
    name: 'Keepers of Ashen Lore',
    identity: {
      foundationBias: 'order',
      veneratedSpheres: ['mind', 'time'],
      primaryBiome: 'mountain',
      socialStructure: 'council of elders',
      accountability: 'public shaming',
      behavioralKeywords: ['stoic', 'scholarly'],
      materialVocabulary: ['stone tablets', 'ink'],
      metaphorPalette: ['mountain that remembers', 'ink that never fades'],
      formativeTraitSeedIds: ['resilient'],
      behavioralTraitSeedIds: ['scholarly'],
    },
    flagSvg: '<svg></svg>',
    members: [{ id: 'a1', name: 'Kael', tier: 3 }],
    territoryLocations: [{ id: 'loc1', name: 'Ashen Peak', biome: 'mountain' }],
  };
}

describe('cultureDetailConfig', () => {
  it('getDetail returns an EntityDetail', () => {
    const data = makeMockCultureData();
    const detail = cultureDetailConfig.getDetail(data, 'transparent');
    expect(detail.header.name).toBe('Keepers of Ashen Lore');
    expect(detail.header.iconSvg).toContain('<svg');
    expect(detail.cardSections.length).toBeGreaterThan(0);
    expect(detail.codexSections.length).toBeGreaterThan(0);
  });

  it('stranger tier: card has header + whispered rumors only', () => {
    const data = makeMockCultureData();
    const detail = cultureDetailConfig.getDetail(data, 'stranger');
    // Only sections with insightTier <= stranger should be present
    for (const section of detail.cardSections) {
      expect(section.insightTier).toBe('stranger');
    }
  });

  it('transparent tier: codex has oral voice sections', () => {
    const data = makeMockCultureData();
    const detail = cultureDetailConfig.getDetail(data, 'transparent');
    const oralSections = detail.codexSections.filter(s => s.proseVoice === 'oral');
    expect(oralSections.length).toBeGreaterThan(0);
  });

  it('known tier: codex includes figures_of_note with member_list', () => {
    const data = makeMockCultureData();
    const detail = cultureDetailConfig.getDetail(data, 'known');
    const figuresSection = detail.codexSections.find(s => s.id === 'figures_of_note');
    expect(figuresSection).toBeDefined();
    expect(figuresSection!.structuredData?.type).toBe('member_list');
  });

  it('codex sections are filtered by insight tier', () => {
    const data = makeMockCultureData();
    const knownDetail = cultureDetailConfig.getDetail(data, 'known');
    const strangerDetail = cultureDetailConfig.getDetail(data, 'stranger');
    expect(knownDetail.codexSections.length).toBeGreaterThan(strangerDetail.codexSections.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureDetailConfig.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `cultureDetailConfig.ts` that exports `cultureDetailConfig: EntityDetailConfig<CultureDetailData>` implementing `getDetail()`:

1. Build `EntityHeader` from culture data (name, flagSvg as iconSvg, foundation + sphere badges, accent color from primary sphere)
2. Build `cardSections: EntitySection[]` following design doc §3 sidebar table (Header, Whispered Rumors, Social Structure, Material Culture)
3. Build `codexSections: EntitySection[]` following design doc §3 codex table (Origins, Social Order, Ways & Materials, Figures of Note, Living History, The Inner Voice)
4. Filter sections by insight tier using `KNOWLEDGE_RANK` lookup (same pattern as `hasKnowledge` in `AgentProfileModal.tsx`)
5. Switch prose voice from 'chronicle' to 'oral' for sections at intimate+ tier
6. Populate structured data blocks (keyword_cloud for materialVocabulary, member_list for members, territory_summary for locations, trait_grid for formative traits, timeline for events)

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureDetailConfig.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/cultureDetailConfig.ts src/engine/__tests__/cultureDetailConfig.test.ts
git commit -m "feat: cultureDetailConfig maps culture data to generic EntityDetail sections"
```

---

## Task 10: Cultural Insight Gain in Orchestrator

**Files:**
- Modify: `src/engine/orchestrator.ts` — add `phaseCulturalInsightGain` tick phase
- Test: `src/engine/__tests__/orchestrator-culturalInsight.test.ts`

Wire cultural insight gain from the 5 sources defined in the design doc.

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/orchestrator-culturalInsight.test.ts
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';

describe('cultural insight gain in orchestrator', () => {
  it('worshippers from a culture gain insight for that culture each tick', () => {
    const gs = initializeGameState(42);
    // Find a culture and a worshipper who belongs to it
    const cultures = gs.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    if (cultures.length === 0) return; // skip if no cultures (shouldn't happen with seed 42)

    const cultureId = cultures[0].id;
    const belongsToEdges = gs.graph.getIncomingEdges(cultureId, 'belongs_to');
    const memberIds = belongsToEdges.map(e => e.source);
    // Check if any member is a worshipper
    const worshippers = memberIds.filter(mid => {
      return gs.graph.getOutgoingEdges(mid, 'worships').some(e => e.target === gs.ascendantId);
    });

    if (worshippers.length === 0) return; // skip if no worshippers in this culture

    const insightBefore = gs.culturalInsightMap.get(cultureId) ?? 0;
    const newGs = runTick(gs);
    const insightAfter = newGs.culturalInsightMap.get(cultureId) ?? 0;
    expect(insightAfter).toBeGreaterThan(insightBefore);
  });

  it('culturalInsightMap is populated after ticks', () => {
    let gs = initializeGameState(42);
    for (let i = 0; i < 10; i++) {
      gs = runTick(gs);
    }
    // After 10 ticks, at least one culture should have some insight
    const totalInsight = Array.from(gs.culturalInsightMap.values()).reduce((sum, v) => sum + v, 0);
    expect(totalInsight).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/orchestrator-culturalInsight.test.ts`
Expected: FAIL — culturalInsightMap is always empty

**Step 3: Write implementation**

Add `phaseCulturalInsightGain(state: GameState): GameState` to `orchestrator.ts`:

1. **Worshipper source**: For each worshipper (agents with `worships` edge to ascendant), check `belongs_to` culture edges → gain `CULTURAL_INSIGHT_GAINS.worshipper_per_tick` per worshipper per culture
2. Wire into `runTick()` after `phaseFamiliarityGain`

The other 4 gain sources (territory visits, member familiarity, scry, interventions) are event-driven and will be wired incrementally:
- Territory visits: in visibility recalc (when new hexes become visible, check which cultures own them)
- Scry: in scry flow (when scrying a member of a culture)
- Interventions: in intervention effects (when intervening in culture territory)
- Member familiarity: aggregate existing familiarityMap values for culture members

For this task, implement only the **worshipper** source (per-tick, simplest to test). The other sources are wired in the existing flows and can be added as a follow-up.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/orchestrator-culturalInsight.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-culturalInsight.test.ts
git commit -m "feat: cultural insight gain from worshipper source in tick loop"
```

---

## Task 11: Culture Interaction Hook & GameView Wiring

**Files:**
- Create: `src/components/Game/hooks/useCultureInteraction.ts`
- Modify: `src/components/Game/GameView.tsx` — render EntityCard/EntityCodexPage for cultures
- Modify: `src/components/Game/AgentInfoCard.tsx` — make culture name clickable
- Test: `src/components/Game/hooks/__tests__/useCultureInteraction.test.ts`

**Step 1: Write the failing test**

```typescript
// src/components/Game/hooks/__tests__/useCultureInteraction.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCultureInteraction } from '../useCultureInteraction';
import { initializeGameState } from '../../../../engine/gameInit';

describe('useCultureInteraction', () => {
  it('starts with no selected culture', () => {
    const gs = initializeGameState(42);
    const { result } = renderHook(() =>
      useCultureInteraction({ gameState: gs })
    );
    expect(result.current.selectedCultureId).toBeNull();
    expect(result.current.cultureInfoCard).toBeNull();
  });

  it('handleCultureSelect sets selected culture', () => {
    const gs = initializeGameState(42);
    const cultures = gs.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    if (cultures.length === 0) return;

    const { result } = renderHook(() =>
      useCultureInteraction({ gameState: gs })
    );
    act(() => {
      result.current.handleCultureSelect(cultures[0].id);
    });
    expect(result.current.selectedCultureId).toBe(cultures[0].id);
    expect(result.current.cultureInfoCard).not.toBeNull();
  });

  it('handleCultureDeselect clears selection', () => {
    const gs = initializeGameState(42);
    const cultures = gs.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    if (cultures.length === 0) return;

    const { result } = renderHook(() =>
      useCultureInteraction({ gameState: gs })
    );
    act(() => {
      result.current.handleCultureSelect(cultures[0].id);
    });
    act(() => {
      result.current.handleCultureDeselect();
    });
    expect(result.current.selectedCultureId).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/hooks/__tests__/useCultureInteraction.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `useCultureInteraction.ts` following the `useAgentInteraction.ts` pattern:

```typescript
export function useCultureInteraction({ gameState }: { gameState: GameState }) {
  const [selectedCultureId, setSelectedCultureId] = useState<string | null>(null);
  const [cultureCodexOpen, setCultureCodexOpen] = useState(false);

  const cultureInfoCard = useMemo(() => {
    if (!selectedCultureId) return null;
    const insight = getCulturalInsight(gameState.culturalInsightMap, selectedCultureId);
    const knowledgeLevel = getCulturalKnowledgeLevel(insight);
    return getCultureInfoCard(gameState.graph, selectedCultureId, knowledgeLevel);
  }, [selectedCultureId, gameState.graph, gameState.culturalInsightMap]);

  const cultureCodexData = useMemo(() => { ... }, [...]);

  const handleCultureSelect = useCallback((cultureId: string) => { ... }, []);
  const handleCultureDeselect = useCallback(() => { ... }, []);
  const handleOpenCultureCodex = useCallback(() => { ... }, []);
  const handleCloseCultureCodex = useCallback(() => { ... }, []);

  return { selectedCultureId, cultureInfoCard, cultureCodexData, cultureCodexOpen, ... };
}
```

Then in `GameView.tsx`:
- Import `useCultureInteraction` and call it alongside `useAgentInteraction`
- When `selectedCultureId` is set, render `EntityCard` in the right sidebar (instead of agent info card)
- When `cultureCodexOpen`, render `EntityCodexPage` as full-screen overlay
- Pass `cultureDetailConfig.getDetail(cultureCodexData, knowledgeLevel)` to the generic components

In `AgentInfoCard.tsx`:
- Make the culture name a clickable link that calls a new `onCultureClick?: (cultureId: string) => void` prop
- Style as underlined gold text with cursor pointer

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/hooks/__tests__/useCultureInteraction.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useCultureInteraction.ts src/components/Game/hooks/__tests__/useCultureInteraction.test.ts src/components/Game/GameView.tsx src/components/Game/AgentInfoCard.tsx
git commit -m "feat: useCultureInteraction hook + culture click handlers + GameView wiring"
```

---

## Task 12: Integration Test — Full Culture Detail Flow

**Files:**
- Create: `src/engine/__tests__/culture-detail-integration.test.ts`

End-to-end test: world seed → culture exists → flag generated → insight gained → detail aggregated → sections gated by tier.

**Step 1: Write the test**

```typescript
// src/engine/__tests__/culture-detail-integration.test.ts
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { getCultureDetail, getCultureInfoCard, getCultureCodexData } from '../cultureDetail';
import { cultureDetailConfig } from '../cultureDetailConfig';
import { getCulturalInsight, getCulturalKnowledgeLevel, addCulturalInsight } from '../culturalInsight';
import { getClimateGroup } from '../../types/climate';

describe('culture detail integration', () => {
  it('full flow: seed → culture → flag → insight → detail → codex', () => {
    const gs = initializeGameState(42);

    // 1. Cultures exist
    const cultures = gs.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    expect(cultures.length).toBeGreaterThanOrEqual(2);

    const cultureId = cultures[0].id;
    const props = cultures[0].properties as Record<string, unknown>;

    // 2. Flag is generated
    expect(typeof props.flagSvg).toBe('string');
    expect(props.flagSvg as string).toContain('<svg');

    // 3. Cultural insight starts at 0
    expect(getCulturalInsight(gs.culturalInsightMap, cultureId)).toBe(0);

    // 4. Detail aggregator works
    const detail = getCultureDetail(gs.graph, cultureId);
    expect(detail).not.toBeNull();
    expect(detail!.identity).toBeDefined();

    // 5. Stranger tier: minimal info
    const strangerCard = getCultureInfoCard(gs.graph, cultureId, 'stranger');
    expect(strangerCard).not.toBeNull();
    expect(strangerCard!.socialStructure).toBeUndefined();

    // 6. Simulate gaining insight
    let insightMap = gs.culturalInsightMap;
    insightMap = addCulturalInsight(insightMap, cultureId, 0.5);
    const level = getCulturalKnowledgeLevel(getCulturalInsight(insightMap, cultureId));
    expect(level).toBe('known');

    // 7. Known tier: more sections visible
    const knownCard = getCultureInfoCard(gs.graph, cultureId, 'known');
    expect(knownCard!.materialVocabulary).toBeDefined();

    // 8. Config produces EntityDetail for generic components
    const entityDetail = cultureDetailConfig.getDetail(detail!, 'transparent');
    expect(entityDetail.header.iconSvg).toContain('<svg');
    expect(entityDetail.codexSections.length).toBeGreaterThan(entityDetail.cardSections.length);

    // 9. Oral voice sections exist at transparent tier
    const oralSections = entityDetail.codexSections.filter(s => s.proseVoice === 'oral');
    expect(oralSections.length).toBeGreaterThan(0);
  });

  it('climate group covers all culture primary biomes', () => {
    const gs = initializeGameState(42);
    const cultures = gs.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    for (const culture of cultures) {
      const identity = (culture.properties as Record<string, unknown>).cultureIdentity as any;
      const group = getClimateGroup(identity.primaryBiome);
      expect(['cold', 'temperate', 'warm_dry', 'warm_wet']).toContain(group);
    }
  });

  it('cultural insight increases over multiple ticks', () => {
    let gs = initializeGameState(42);
    const cultures = gs.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    if (cultures.length === 0) return;

    for (let i = 0; i < 20; i++) {
      gs = runTick(gs);
    }
    // At least one culture should have non-zero insight from worshipper gain
    const maxInsight = Math.max(
      ...cultures.map(c => getCulturalInsight(gs.culturalInsightMap, c.id))
    );
    expect(maxInsight).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/engine/__tests__/culture-detail-integration.test.ts`
Expected: PASS (all previous tasks complete)

**Step 3: Commit**

```bash
git add src/engine/__tests__/culture-detail-integration.test.ts
git commit -m "test: culture detail integration test — full seed-to-codex flow"
```

---

## Task 13: Documentation & Verification

**Files:**
- Modify: `CLAUDE.md` — update project status, engine stats, changelog
- Update Obsidian vault — create Culture Detail Page system note
- Update Notion backlog — mark task complete

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (2,200+ existing + ~80 new tests)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Run production build**

Run: `npx vite build`
Expected: Successful build

**Step 4: Documentation updates**

Use the `gamedocumenter` skill for:
1. Update CLAUDE.md changelog with all 12 task entries
2. Update project status section
3. Create Obsidian: `Systems/Culture Detail Page.md` with wikilinks to Culture, Entity Detail Framework, Familiarity
4. Update Obsidian: `Index.md` with Culture Detail Page link
5. Update Notion backlog: mark culture detail page implementation complete

**Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: culture detail page system complete — generic entity framework + cultural insight"
```

---

## Summary

| Task | What | Files | Tests |
|------|------|-------|-------|
| 1 | Generic entity detail types | 1 new | ~6 |
| 2 | ClimateGroup + BIOME_CLIMATE_MAP | 1 new | ~6 |
| 3 | Cultural insight engine + GameState | 2 new + 2 modified | ~6 |
| 4 | Procedural flag generator | 1 new | ~8 |
| 5 | Wire flags into world seeding | 1 modified | ~2 |
| 6 | Culture detail aggregator | 1 new | ~10 |
| 7 | Generic EntityCard component | 1 new (+ shared renderer) | ~8 |
| 8 | Generic EntityCodexPage component | 1 new | ~10 |
| 9 | Culture detail config | 1 new | ~5 |
| 10 | Cultural insight gain in orchestrator | 1 modified | ~2 |
| 11 | Culture interaction hook + GameView | 3 new + 2 modified | ~3 |
| 12 | Integration test | 1 new | ~3 |
| 13 | Documentation & verification | docs | — |
| **Total** | | **~15 new + ~7 modified** | **~69** |
