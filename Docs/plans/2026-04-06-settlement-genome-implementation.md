# Settlement Genome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settlements compose their identity from five additive passes (infrastructure, culture, spheres, reaches, archetype recognition) producing coherent sublocations, NPC rosters, and prose flavor driven by hex environment, cultural heritage, and economic activity.

**Architecture:** A `runSettlementGenome()` pipeline replaces `ensureSublocations()` for settlement-type locations at worldgen. Each pass reads authored data tables and hex/culture/reach context to accumulate sublocations and NPC roles. A `phaseSettlementReassessment` orchestrator phase re-runs the genome on discrete phase-change events (tier promotion/demotion, reach threshold crossings). Culture strength lives on `belongs_to` edge properties. All trait gating uses `has_trait` edge target IDs as the canonical key.

**Tech Stack:** TypeScript, Vitest, existing WorldGraph API, existing trace/orchestrator infrastructure

**Specs:**
- `Docs/plans/2026-04-06-settlement-genome-design.md`
- `Docs/plans/2026-04-06-culture-integration-design.md`

---

## Slice 1: Core Contracts and Wiring

### Task 1: Register Trace Categories

**Files:**
- Modify: `src/types/trace.ts:16-71` (TraceCategory union + TRACE_CATEGORIES array)
- Test: `src/types/__tests__/trace-categories.test.ts` (new)

- [ ] **Step 1: Write the failing test**

```typescript
// src/types/__tests__/trace-categories.test.ts
import { describe, it, expect } from 'vitest';
import { TRACE_CATEGORIES } from '../trace';
import type { TraceCategory } from '../trace';

describe('TraceCategory registration', () => {
  const requiredCategories: TraceCategory[] = [
    'settlement_genome',
    'settlement_reassessment',
    'culture_generation',
    'culture_sublocation',
  ];

  for (const cat of requiredCategories) {
    it(`includes ${cat} in TRACE_CATEGORIES array`, () => {
      expect(TRACE_CATEGORIES).toContain(cat);
    });
  }

  it('TRACE_CATEGORIES has no duplicates', () => {
    const unique = new Set(TRACE_CATEGORIES);
    expect(unique.size).toBe(TRACE_CATEGORIES.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/trace-categories.test.ts`
Expected: FAIL — categories not in union or array yet.

- [ ] **Step 3: Add trace categories to union and array**

In `src/types/trace.ts`, add to the `TraceCategory` union (after `'slot_expansion'`):

```typescript
  | 'settlement_genome'
  | 'settlement_reassessment'
  | 'culture_generation'
  | 'culture_sublocation';
```

Add to the `TRACE_CATEGORIES` array (after `'slot_expansion'`):

```typescript
  'settlement_genome',
  'settlement_reassessment',
  'culture_generation',
  'culture_sublocation',
```

- [ ] **Step 4: Add trace interfaces**

In `src/types/trace.ts`, add after the existing trace interfaces:

```typescript
/** Trace: settlement genome pipeline result at worldgen or reassessment */
export interface SettlementGenomeTrace extends TraceBase {
  category: 'settlement_genome';
  locationId: string;
  locationName: string;
  tier: string;
  cultureBias: string;
  cultureStrength: number;
  spheresAboveThreshold: { sphere: string; value: number }[];
  reachesAboveThreshold: { reach: string; value: number }[];
  position: 'heartland' | 'borderlands';
  passContributions: {
    infrastructure: string[];
    culture: { substitutions: string[]; additions: string[] };
    sphere: string[];
    reach: string[];
    archetype: string[] | null;
  };
  archetypeMatch: string | null;
  totalSublocations: number;
  totalNpcs: number;
  npcBudgetUsed: number;
  npcBudgetMax: number;
}

/** Trace: settlement reassessment triggered by tier change, reach shift, etc. */
export interface SettlementReassessmentTrace extends TraceBase {
  category: 'settlement_reassessment';
  locationId: string;
  trigger: 'promotion' | 'demotion' | 'reach_threshold' | 'faction_change' | 'vitality_crisis';
  previousTier: string | null;
  newTier: string | null;
  sublocationsAdded: string[];
  sublocationsRuined: string[];
  archetypeChange: { from: string | null; to: string | null } | null;
}

/** Trace: culture identity generation and trait assignment */
export interface CultureGenerationTrace extends TraceBase {
  category: 'culture_generation';
  cultureId: string;
  demonym?: string;
  traitNodeId?: string;
  entityId?: string;
  edgeCulturalStrength?: number;
}

/** Trace: cultural sublocation creation or ruin */
export interface CultureSublocationTrace extends TraceBase {
  category: 'culture_sublocation';
  locationId: string;
  sublocationId: string;
  cultureId: string;
  tier: string;
  isSubstitution: boolean;
}
```

Add these to the `TraceEntry` discriminated union (search for `export type TraceEntry =`):

```typescript
  | SettlementGenomeTrace
  | SettlementReassessmentTrace
  | CultureGenerationTrace
  | CultureSublocationTrace
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/trace-categories.test.ts`
Expected: PASS

- [ ] **Step 6: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 7: Commit**

```bash
git add src/types/trace.ts src/types/__tests__/trace-categories.test.ts
git commit -m "feat(genome): register settlement genome and culture trace categories"
```

---

### Task 2: Culture Identity Fields and Trait Nodes

**Files:**
- Modify: `src/types/culture.ts:8-24` (add demonym, homePlaceName to CultureIdentity)
- Modify: `src/engine/cultureGenerator.ts` (create trait nodes, compute culturalStrength)
- Test: `src/engine/__tests__/cultureGenerator.test.ts` (add tests)

- [ ] **Step 1: Write failing tests for new CultureIdentity fields**

Add to `src/engine/__tests__/cultureGenerator.test.ts`:

```typescript
describe('CultureIdentity fields', () => {
  it('composeCultureIdentity returns demonym and homePlaceName', () => {
    const identity = composeCultureIdentity('order', ['force', 'mind'], 'grassland');
    expect(identity).toHaveProperty('demonym');
    expect(identity).toHaveProperty('homePlaceName');
    expect(typeof identity.demonym).toBe('string');
    expect(identity.demonym.length).toBeGreaterThan(0);
    expect(typeof identity.homePlaceName).toBe('string');
    expect(identity.homePlaceName.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -t "CultureIdentity fields"`
Expected: FAIL — fields not on interface yet.

- [ ] **Step 3: Add fields to CultureIdentity**

In `src/types/culture.ts`, add to `CultureIdentity` interface:

```typescript
  demonym: string;
  homePlaceName: string;
```

- [ ] **Step 4: Generate demonym and homePlaceName in composeCultureIdentity**

In `src/engine/cultureGenerator.ts`, in `composeCultureIdentity()`, after the existing identity construction, add:

```typescript
  // Demonym: use the culture name directly (1-3 syllables, already generated)
  const demonym = generateCultureName(identity, seedRng);

  // Home place name: demonym + foundation-appropriate suffix
  const PLACE_SUFFIXES: Record<string, string[]> = {
    order: ['-stan', '-gar', '-heim', '-hold'],
    chaos: ['-thos', '-shar', '-reach'],
    force: ['-grad', '-gar', '-hold'],
    life: ['-dell', '-mere', '-glen', '-haven'],
    mind: ['-spire', '-thos', '-shar'],
    spirit: ['-haven', '-dell', '-mere'],
    default: ['-ton', '-bury', '-ford'],
  };
  const suffixes = PLACE_SUFFIXES[foundationId] ?? PLACE_SUFFIXES.default;
  const suffixIdx = Math.abs(hashString(demonym)) % suffixes.length;
  const homePlaceName = demonym + suffixes[suffixIdx];
```

Note: the exact implementation will depend on the existing `generateCultureName` flow. The key contract is that `composeCultureIdentity` returns an identity with `demonym` and `homePlaceName` populated. If `generateCultureName` is called separately, move the demonym/homePlaceName generation to `generateCultureIdentities` where `generateCultureName` is already called at line 364.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -t "CultureIdentity fields"`
Expected: PASS

- [ ] **Step 6: Write failing test for culture trait node creation**

Add to `src/engine/__tests__/cultureGenerator.test.ts`:

```typescript
describe('culture trait nodes', () => {
  it('registerPregenCultures creates a trait node per culture', () => {
    const graph = new WorldGraph();
    const cultures: PregenCulture[] = [{
      id: 'culture_0',
      name: 'Daru',
      identity: makeMockIdentity({ demonym: 'Daru' }),
      flagSvg: '',
    }];

    registerPregenCultures(graph, cultures);

    const traitNode = graph.getNode('trait.culture.culture_0');
    expect(traitNode).toBeTruthy();
    expect(traitNode!.type).toBe('trait');
    expect(traitNode!.name).toBe('Daru');
    expect(traitNode!.properties.subcategory).toBe('cultural');
    expect(traitNode!.properties.tags).toContain('Daru');
  });
});
```

Where `makeMockIdentity` is a test helper that returns a valid `CultureIdentity` with overrides. Check if one exists already in the test file; if not, create it.

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -t "culture trait nodes"`
Expected: FAIL — trait node not created.

- [ ] **Step 8: Create trait nodes in registerPregenCultures**

In `src/engine/cultureGenerator.ts`, in `registerPregenCultures()`, after the culture actor node is created, add:

```typescript
    // Create culture trait node for gating
    const traitNodeId = `trait.culture.${pc.id}`;
    graph.addNode({
      id: traitNodeId,
      type: 'trait',
      name: pc.identity.demonym,
      properties: {
        subcategory: 'cultural',
        description: `Cultural trait for the ${pc.identity.demonym} people`,
        importance: 0,
        maxLevel: 1,
        visibility: 'public',
        domainContributions: {},
        tags: [pc.identity.demonym],
        flavorText: '',
        category: 'innate',
      },
    });
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts -t "culture trait nodes"`
Expected: PASS

- [ ] **Step 10: Write failing test for culture trait assignment to locations**

```typescript
describe('culture trait assignment', () => {
  it('assignCultureToLocation creates has_trait edge to culture trait node', () => {
    const graph = new WorldGraph();
    // Register culture (which creates trait node)
    const cultures: PregenCulture[] = [{
      id: 'culture_0',
      name: 'Daru',
      identity: makeMockIdentity({ demonym: 'Daru' }),
      flagSvg: '',
    }];
    registerPregenCultures(graph, cultures);

    // Create a location
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Test Town', properties: {} });

    // Assign culture
    assignCultureToLocation(graph, 'loc_1', 'culture_0', 'current');

    // Check has_trait edge exists
    const traitEdges = graph.getOutgoingEdges('loc_1', 'has_trait');
    const cultureTrait = traitEdges.find(e => e.target === 'trait.culture.culture_0');
    expect(cultureTrait).toBeTruthy();
  });
});
```

- [ ] **Step 11: Implement trait assignment in assignCultureToLocation**

In `src/engine/cultureGenerator.ts`, in `assignCultureToLocation()`, after creating the `belongs_to` edge, add:

```typescript
    // Assign culture trait to location
    const traitNodeId = `trait.culture.${cultureId}`;
    if (graph.getNode(traitNodeId)) {
      graph.addEdge({
        id: `edge_culture_trait_${locationId}_${cultureId}`,
        type: 'has_trait',
        source: locationId,
        target: traitNodeId,
        properties: { level: 1 },
      });
    }
```

Do the same in `assignCultureToActor()`.

- [ ] **Step 12: Run all culture tests**

Run: `npx vitest run src/engine/__tests__/cultureGenerator.test.ts`
Expected: All PASS

- [ ] **Step 13: Type check and commit**

```bash
npx tsc --noEmit
git add src/types/culture.ts src/engine/cultureGenerator.ts src/engine/__tests__/cultureGenerator.test.ts
git commit -m "feat(culture): add demonym/homePlaceName fields and culture trait nodes"
```

---

### Task 3: Settlement Genome Data Tables

**Files:**
- Create: `src/engine/settlementGenome/constants.ts`
- Create: `src/engine/settlementGenome/infrastructure.ts`
- Create: `src/engine/settlementGenome/sphereMenu.ts`
- Create: `src/engine/settlementGenome/reachMenu.ts`
- Create: `src/engine/settlementGenome/archetypes.ts`
- Create: `src/engine/settlementGenome/types.ts`
- Test: `src/engine/__tests__/settlementGenome-tables.test.ts` (new)

- [ ] **Step 1: Create types file**

```typescript
// src/engine/settlementGenome/types.ts
import type { ReachDomain } from '../../types/traits';
import type { NpcRole } from '../../types/npc';
import type { SphereName, LocationSubtype } from '../../types/index';

export type SettlementTier = 'hamlet' | 'town' | 'city' | 'capital';

export type SublocationTag =
  | 'military' | 'scholarly' | 'arcane' | 'commerce'
  | 'religious' | 'cultural' | 'underworld' | 'nature'
  | 'authority' | 'borderlands';

export interface SublocationContribution {
  id: string;             // sublocation type ID (e.g. 'sublocation-type.barracks')
  minTier: SettlementTier;
  tags: SublocationTag[];
  condition?: 'high-prosperity' | 'trade-route' | 'coastal-hex' | 'borderlands';
}

export interface NpcContribution {
  role: NpcRole;
  minTier: SettlementTier;
}

export interface SphereContributionDef {
  sublocations: SublocationContribution[];
  npcRoles: NpcContribution[];
}

export interface ReachContributionDef {
  sublocations: SublocationContribution[];
  npcRoles: NpcContribution[];
}

export interface ArchetypeDef {
  id: string;
  name: string;
  requiredTags: { tag: SublocationTag; count: number }[];
  capstoneSublocations: string[];
  capstoneNpcs: NpcRole[];
  proseFlavor: string;
  priority: number;
}

export interface GenomeResult {
  sublocations: { id: string; sourcePass: 'infrastructure' | 'culture' | 'sphere' | 'reach' | 'archetype'; tags: SublocationTag[] }[];
  npcs: { role: NpcRole; sourcePass: string; preferredSublocation?: string }[];
  archetypeId: string | null;
  archetypeName: string | null;
  archetypeProseFlavor: string | null;
  settlementReachProfile: Record<ReachDomain, number>;
}
```

- [ ] **Step 2: Create constants file**

```typescript
// src/engine/settlementGenome/constants.ts

// ── Sphere Thresholds ──
export const SPHERE_CONTRIBUTION_THRESHOLD = 0.3;
export const SPHERE_STRONG_THRESHOLD = 0.6;

// ── Reach Thresholds ──
export const REACH_CONTRIBUTION_THRESHOLD = 0.3;

// ── Vitality ──
export const SETTLEMENT_VITALITY_PROMOTION_THRESHOLD = 0.75;
export const SETTLEMENT_VITALITY_DEMOTION_THRESHOLD = 0.25;
export const SETTLEMENT_VITALITY_SUSTAIN_TICKS = 60;
export const SETTLEMENT_VITALITY_CRISIS_THRESHOLD = 0.1;
export const VITALITY_PROSPERITY_WEIGHT = 0.5;
export const VITALITY_FACTION_WEIGHT = 0.2;
export const VITALITY_THREAT_WEIGHT = 0.2;
export const VITALITY_TRADE_WEIGHT = 0.1;
export const VITALITY_DRIFT_RATE = 0.05;

// ── NPC Budget ──
export const NPC_BUDGET: Record<string, { base: number; perSublocation: number }> = {
  hamlet:  { base: 3,  perSublocation: 1 },
  town:    { base: 6,  perSublocation: 1.5 },
  city:    { base: 10, perSublocation: 2 },
  capital: { base: 15, perSublocation: 2.5 },
};

// ── Reassessment Timing ──
export const PROMOTION_REASSESSMENT_DELAY = 6;
export const DEMOTION_RUIN_DECAY_TICKS = 120;

// ── Archetype ──
export const ARCHETYPE_MAX_PER_SETTLEMENT = 1;

// ── Culture Strength ──
export const CULTURE_STRENGTH_BASE = 0.4;
export const CULTURE_STRENGTH_HEARTLAND_BONUS = 0.3;
export const CULTURE_STRENGTH_HOME_PLACE_BONUS = 0.2;
export const CULTURE_STRENGTH_DILUTION_PENALTY = 0.1;
export const CULTURE_STRENGTH_MIN_FOR_ADDITIONS = 0.3;
```

- [ ] **Step 3: Create infrastructure table**

```typescript
// src/engine/settlementGenome/infrastructure.ts
import type { SublocationContribution, NpcContribution } from './types';

export const SETTLEMENT_INFRASTRUCTURE: SublocationContribution[] = [
  { id: 'sublocation-type.inn',             minTier: 'hamlet',  tags: ['commerce'] },
  { id: 'sublocation-type.well-fountain',   minTier: 'hamlet',  tags: [] },
  { id: 'sublocation-type.market-stall',    minTier: 'hamlet',  tags: ['commerce'] },
  { id: 'sublocation-type.temple-quarter',  minTier: 'town',    tags: ['religious'] },
  { id: 'sublocation-type.market-district', minTier: 'town',    tags: ['commerce'] },
  { id: 'sublocation-type.gatehouse',       minTier: 'town',    tags: ['military'] },
  { id: 'sublocation-type.jail',            minTier: 'town',    tags: ['authority'] },
  { id: 'sublocation-type.town-hall',       minTier: 'town',    tags: ['authority'] },
  { id: 'sublocation-type.harbor',          minTier: 'town',    tags: ['commerce'], condition: 'coastal-hex' },
  { id: 'sublocation-type.grand-bazaar',    minTier: 'city',    tags: ['commerce'], condition: 'high-prosperity' },
  { id: 'sublocation-type.palace-keep',     minTier: 'capital', tags: ['authority', 'military'] },
  { id: 'sublocation-type.dungeon',         minTier: 'capital', tags: ['authority'] },
];

export const INFRASTRUCTURE_NPCS: NpcContribution[] = [
  { role: 'innkeeper', minTier: 'hamlet' },
  { role: 'elder',     minTier: 'hamlet' },
  { role: 'guard',     minTier: 'town' },
];
```

- [ ] **Step 4: Create sphere contribution menu**

```typescript
// src/engine/settlementGenome/sphereMenu.ts
import type { SphereContributionDef } from './types';
import type { SphereName } from '../../types/index';

export const SPHERE_SUBLOCATION_MENU: Partial<Record<SphereName, SphereContributionDef>> = {
  force: {
    sublocations: [
      { id: 'sublocation-type.smithy',    minTier: 'hamlet',  tags: ['military'] },
      { id: 'sublocation-type.barracks',  minTier: 'town',    tags: ['military'] },
      { id: 'sublocation-type.arena',     minTier: 'city',    tags: ['military'] },
    ],
    npcRoles: [
      { role: 'smith',     minTier: 'hamlet' },
      { role: 'guard',     minTier: 'town' },
      { role: 'commander', minTier: 'city' },
    ],
  },
  matter: {
    sublocations: [
      { id: 'sublocation-type.mine-entrance', minTier: 'hamlet', tags: ['commerce'] },
      { id: 'sublocation-type.smelter',       minTier: 'town',   tags: ['commerce'] },
      { id: 'sublocation-type.mason-yard',    minTier: 'city',   tags: ['commerce'] },
    ],
    npcRoles: [
      { role: 'mason', minTier: 'hamlet' },
      { role: 'smith', minTier: 'town' },
    ],
  },
  energy: {
    sublocations: [
      { id: 'sublocation-type.lightning-rod', minTier: 'town', tags: ['arcane'] },
      { id: 'sublocation-type.power-nexus',   minTier: 'city', tags: ['arcane'] },
    ],
    npcRoles: [
      { role: 'researcher', minTier: 'town' },
      { role: 'scholar',    minTier: 'city' },
    ],
  },
  life: {
    sublocations: [
      { id: 'sublocation-type.herbalist-hut',   minTier: 'hamlet', tags: ['nature'] },
      { id: 'sublocation-type.healing-house',    minTier: 'town',   tags: ['nature', 'religious'] },
      { id: 'sublocation-type.conservatory',     minTier: 'city',   tags: ['nature', 'scholarly'] },
    ],
    npcRoles: [
      { role: 'healer', minTier: 'hamlet' },
      { role: 'priest', minTier: 'town' },
    ],
  },
  mind: {
    sublocations: [
      { id: 'sublocation-type.study',   minTier: 'hamlet', tags: ['scholarly'] },
      { id: 'sublocation-type.library', minTier: 'town',   tags: ['scholarly'] },
      { id: 'sublocation-type.academy', minTier: 'city',   tags: ['scholarly'] },
    ],
    npcRoles: [
      { role: 'scholar',   minTier: 'town' },
      { role: 'librarian', minTier: 'city' },
    ],
  },
  spirit: {
    sublocations: [
      { id: 'sublocation-type.shrine',           minTier: 'hamlet', tags: ['religious'] },
      { id: 'sublocation-type.spirit-house',     minTier: 'town',   tags: ['religious', 'arcane'] },
      { id: 'sublocation-type.oracle-chamber',   minTier: 'city',   tags: ['religious', 'arcane'] },
    ],
    npcRoles: [
      { role: 'priest', minTier: 'hamlet' },
      { role: 'hermit', minTier: 'town' },
    ],
  },
  time: {
    sublocations: [
      { id: 'sublocation-type.sundial-square', minTier: 'hamlet', tags: ['cultural'] },
      { id: 'sublocation-type.clocktower',     minTier: 'city',   tags: ['cultural', 'scholarly'] },
    ],
    npcRoles: [
      { role: 'scribe',   minTier: 'town' },
      { role: 'scholar',  minTier: 'city' },
    ],
  },
  entropy: {
    sublocations: [
      { id: 'sublocation-type.boneyard',     minTier: 'hamlet', tags: ['religious'] },
      { id: 'sublocation-type.plague-ward',  minTier: 'town',   tags: ['religious'] },
    ],
    npcRoles: [
      { role: 'healer', minTier: 'hamlet' },
      { role: 'hermit', minTier: 'town' },
    ],
  },
  chaos: {
    sublocations: [
      { id: 'sublocation-type.gambling-den',  minTier: 'town', tags: ['underworld', 'commerce'] },
      { id: 'sublocation-type.fighting-pit',  minTier: 'city', tags: ['underworld', 'military'] },
    ],
    npcRoles: [
      { role: 'entertainer', minTier: 'town' },
      { role: 'fence',       minTier: 'city' },
    ],
  },
  order: {
    sublocations: [
      { id: 'sublocation-type.courthouse',  minTier: 'town',    tags: ['authority'] },
      { id: 'sublocation-type.archive',     minTier: 'city',    tags: ['authority', 'scholarly'] },
      { id: 'sublocation-type.high-court',  minTier: 'capital', tags: ['authority'] },
    ],
    npcRoles: [
      { role: 'scribe', minTier: 'town' },
      { role: 'noble',  minTier: 'city' },
    ],
  },
  light: {
    sublocations: [
      { id: 'sublocation-type.watchtower',    minTier: 'hamlet', tags: ['military'] },
      { id: 'sublocation-type.beacon-tower',  minTier: 'city',   tags: ['military'] },
    ],
    npcRoles: [
      { role: 'lookout', minTier: 'hamlet' },
      { role: 'guard',   minTier: 'city' },
    ],
  },
  darkness: {
    sublocations: [
      { id: 'sublocation-type.smuggler-den',  minTier: 'town', tags: ['underworld'] },
      { id: 'sublocation-type.black-market',  minTier: 'city', tags: ['underworld', 'commerce'] },
    ],
    npcRoles: [
      { role: 'fence',     minTier: 'town' },
      { role: 'informant', minTier: 'city' },
    ],
  },
};

export const POSITION_MODIFIERS: Record<'heartland' | 'borderland', {
  bonusSublocations: { id: string; tags: string[] }[];
  bonusNpcs: NpcRole[];
}> = {
  borderland: {
    bonusSublocations: [
      { id: 'sublocation-type.city-walls', tags: ['military', 'borderlands'] },
      { id: 'sublocation-type.watchtower', tags: ['military', 'borderlands'] },
    ],
    bonusNpcs: ['guard', 'scout'],
  },
  heartland: {
    bonusSublocations: [
      { id: 'sublocation-type.festival-ground', tags: ['cultural'] },
      { id: 'sublocation-type.granary', tags: ['commerce'] },
    ],
    bonusNpcs: ['entertainer', 'innkeeper'],
  },
};
```

Note: Codebase uses singular forms (`'heartland' | 'borderland'`) per `ProvinceRole` in `worldgen/types.ts:19` and `DangerZone` in `monster.ts:21`.

- [ ] **Step 5: Create reach contribution menu**

```typescript
// src/engine/settlementGenome/reachMenu.ts
import type { ReachContributionDef } from './types';
import type { ReachDomain } from '../../types/traits';

export const REACH_SUBLOCATION_MENU: Record<ReachDomain, ReachContributionDef> = {
  iron: {
    sublocations: [
      { id: 'sublocation-type.armory',         minTier: 'town',    tags: ['military'] },
      { id: 'sublocation-type.war-council',    minTier: 'city',    tags: ['military', 'authority'] },
      { id: 'sublocation-type.siege-workshop', minTier: 'capital', tags: ['military'] },
    ],
    npcRoles: [
      { role: 'guard',         minTier: 'hamlet' },
      { role: 'commander',     minTier: 'town' },
      { role: 'quartermaster', minTier: 'city' },
    ],
  },
  gold: {
    sublocations: [
      { id: 'sublocation-type.counting-house', minTier: 'town',    tags: ['commerce'] },
      { id: 'sublocation-type.customs-house',  minTier: 'city',    tags: ['commerce'] },
      { id: 'sublocation-type.exchange',       minTier: 'capital', tags: ['commerce'] },
    ],
    npcRoles: [
      { role: 'merchant', minTier: 'hamlet' },
      { role: 'trader',   minTier: 'town' },
      { role: 'broker',   minTier: 'city' },
    ],
  },
  shadow: {
    sublocations: [
      { id: 'sublocation-type.hidden-passage', minTier: 'town',    tags: ['underworld'] },
      { id: 'sublocation-type.thieves-guild',  minTier: 'city',    tags: ['underworld'] },
      { id: 'sublocation-type.spy-network',    minTier: 'capital', tags: ['underworld'] },
    ],
    npcRoles: [
      { role: 'fence',     minTier: 'town' },
      { role: 'informant', minTier: 'city' },
      { role: 'spy',       minTier: 'capital' },
    ],
  },
  veil: {
    sublocations: [
      { id: 'sublocation-type.arcane-sanctum', minTier: 'town', tags: ['arcane'] },
      { id: 'sublocation-type.ward-stones',    minTier: 'city', tags: ['arcane'] },
    ],
    npcRoles: [
      { role: 'researcher', minTier: 'town' },
      { role: 'librarian',  minTier: 'city' },
    ],
  },
  heart: {
    sublocations: [
      { id: 'sublocation-type.hospice',         minTier: 'hamlet', tags: ['religious', 'nature'] },
      { id: 'sublocation-type.counselor-hall',   minTier: 'town',   tags: ['cultural'] },
      { id: 'sublocation-type.embassy',          minTier: 'city',   tags: ['authority'] },
    ],
    npcRoles: [
      { role: 'healer',  minTier: 'hamlet' },
      { role: 'priest',  minTier: 'town' },
      { role: 'steward', minTier: 'city' },
    ],
  },
  eye: {
    sublocations: [
      { id: 'sublocation-type.scout-post',            minTier: 'hamlet', tags: ['military'] },
      { id: 'sublocation-type.observatory',            minTier: 'town',   tags: ['scholarly'] },
      { id: 'sublocation-type.intelligence-bureau',    minTier: 'city',   tags: ['underworld', 'authority'] },
    ],
    npcRoles: [
      { role: 'scout',   minTier: 'hamlet' },
      { role: 'lookout', minTier: 'town' },
      { role: 'scholar', minTier: 'city' },
    ],
  },
  stone: {
    sublocations: [
      { id: 'sublocation-type.workshop',     minTier: 'hamlet', tags: ['commerce'] },
      { id: 'sublocation-type.guild-hall',   minTier: 'town',   tags: ['commerce'] },
      { id: 'sublocation-type.manufactory',  minTier: 'city',   tags: ['commerce'] },
    ],
    npcRoles: [
      { role: 'smith',  minTier: 'hamlet' },
      { role: 'mason',  minTier: 'town' },
      { role: 'weaver', minTier: 'city' },
    ],
  },
  star: {
    sublocations: [
      { id: 'sublocation-type.tavern',          minTier: 'hamlet',  tags: ['cultural', 'commerce'] },
      { id: 'sublocation-type.theater',         minTier: 'city',    tags: ['cultural'] },
      { id: 'sublocation-type.throne-room',     minTier: 'capital', tags: ['authority'] },
    ],
    npcRoles: [
      { role: 'entertainer', minTier: 'hamlet' },
      { role: 'herald',      minTier: 'town' },
      { role: 'noble',       minTier: 'city' },
    ],
  },
};
```

- [ ] **Step 6: Create archetype definitions**

```typescript
// src/engine/settlementGenome/archetypes.ts
import type { ArchetypeDef } from './types';

export const SETTLEMENT_ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'garrison-town',
    name: 'Garrison Town',
    requiredTags: [{ tag: 'military', count: 3 }],
    capstoneSublocations: ['sublocation-type.siege-stores'],
    capstoneNpcs: ['commander'],
    proseFlavor: 'a town that exists to hold the line',
    priority: 50,
  },
  {
    id: 'arcane-conclave',
    name: 'Arcane Conclave',
    requiredTags: [{ tag: 'scholarly', count: 2 }, { tag: 'arcane', count: 1 }],
    capstoneSublocations: ['sublocation-type.arcane-council-chamber'],
    capstoneNpcs: ['researcher'],
    proseFlavor: 'where knowledge is hoarded and secrets traded',
    priority: 40,
  },
  {
    id: 'trade-nexus',
    name: 'Trade Nexus',
    requiredTags: [{ tag: 'commerce', count: 3 }],
    capstoneSublocations: ['sublocation-type.merchant-prince-hall'],
    capstoneNpcs: ['broker'],
    proseFlavor: 'the sound of coin never stops',
    priority: 45,
  },
  {
    id: 'holy-seat',
    name: 'Holy Seat',
    requiredTags: [{ tag: 'religious', count: 2 }, { tag: 'cultural', count: 1 }],
    capstoneSublocations: ['sublocation-type.cathedral', 'sublocation-type.pilgrim-quarter'],
    capstoneNpcs: ['priest'],
    proseFlavor: 'faith made stone',
    priority: 35,
  },
  {
    id: 'thieves-haven',
    name: "Thieves' Haven",
    requiredTags: [{ tag: 'underworld', count: 2 }, { tag: 'commerce', count: 1 }],
    capstoneSublocations: ['sublocation-type.hidden-court'],
    capstoneNpcs: ['fence'],
    proseFlavor: 'two economies — one you see, one you don\'t',
    priority: 30,
  },
  {
    id: 'frontier-bastion',
    name: 'Frontier Bastion',
    requiredTags: [{ tag: 'military', count: 2 }, { tag: 'borderlands', count: 1 }],
    capstoneSublocations: ['sublocation-type.reinforced-keep', 'sublocation-type.refugee-quarter'],
    capstoneNpcs: ['guard'],
    proseFlavor: 'the last safe place before the wild',
    priority: 55,
  },
  {
    id: 'nature-sanctuary',
    name: 'Nature Sanctuary',
    requiredTags: [{ tag: 'nature', count: 2 }, { tag: 'cultural', count: 1 }],
    capstoneSublocations: ['sublocation-type.ancient-grove', 'sublocation-type.beast-pen'],
    capstoneNpcs: ['hermit'],
    proseFlavor: 'the land speaks here, and they listen',
    priority: 25,
  },
  {
    id: 'seat-of-power',
    name: 'Seat of Power',
    requiredTags: [{ tag: 'authority', count: 2 }, { tag: 'military', count: 1 }],
    capstoneSublocations: ['sublocation-type.high-court', 'sublocation-type.royal-guard-quarters'],
    capstoneNpcs: ['noble'],
    proseFlavor: 'power flows downhill from these walls',
    priority: 60,
  },
];
```

- [ ] **Step 7: Write table validation tests**

```typescript
// src/engine/__tests__/settlementGenome-tables.test.ts
import { describe, it, expect } from 'vitest';
import { SETTLEMENT_INFRASTRUCTURE } from '../settlementGenome/infrastructure';
import { SPHERE_SUBLOCATION_MENU } from '../settlementGenome/sphereMenu';
import { REACH_SUBLOCATION_MENU } from '../settlementGenome/reachMenu';
import { SETTLEMENT_ARCHETYPES } from '../settlementGenome/archetypes';
import { NPC_ROLES } from '../../types/npc';
import { REACH_DOMAINS } from '../../types/traits';

describe('settlementGenome data tables', () => {
  it('infrastructure sublocations all have valid tier', () => {
    const validTiers = new Set(['hamlet', 'town', 'city', 'capital']);
    for (const entry of SETTLEMENT_INFRASTRUCTURE) {
      expect(validTiers.has(entry.minTier), `${entry.id} has invalid tier ${entry.minTier}`).toBe(true);
    }
  });

  it('sphere menu covers all 12 spheres', () => {
    const keys = Object.keys(SPHERE_SUBLOCATION_MENU);
    expect(keys.length).toBe(12);
  });

  it('reach menu covers all 8 canonical reaches', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_SUBLOCATION_MENU).toHaveProperty(reach);
    }
  });

  it('all NPC roles in sphere menu exist in NpcRole union', () => {
    const roleSet = new Set(NPC_ROLES);
    for (const [sphere, def] of Object.entries(SPHERE_SUBLOCATION_MENU)) {
      for (const npc of def.npcRoles) {
        expect(roleSet.has(npc.role), `${sphere} menu references unknown role "${npc.role}"`).toBe(true);
      }
    }
  });

  it('all NPC roles in reach menu exist in NpcRole union', () => {
    const roleSet = new Set(NPC_ROLES);
    for (const [reach, def] of Object.entries(REACH_SUBLOCATION_MENU)) {
      for (const npc of def.npcRoles) {
        expect(roleSet.has(npc.role), `${reach} menu references unknown role "${npc.role}"`).toBe(true);
      }
    }
  });

  it('archetype IDs are unique', () => {
    const ids = SETTLEMENT_ARCHETYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('archetype priorities are unique', () => {
    const prios = SETTLEMENT_ARCHETYPES.map(a => a.priority);
    expect(new Set(prios).size).toBe(prios.length);
  });

  it('all archetype capstone NPC roles exist in NpcRole union', () => {
    const roleSet = new Set(NPC_ROLES);
    for (const arch of SETTLEMENT_ARCHETYPES) {
      for (const role of arch.capstoneNpcs) {
        expect(roleSet.has(role), `archetype ${arch.id} references unknown role "${role}"`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/engine/__tests__/settlementGenome-tables.test.ts`
Expected: PASS

- [ ] **Step 9: Type check and commit**

```bash
npx tsc --noEmit
git add src/engine/settlementGenome/
git add src/engine/__tests__/settlementGenome-tables.test.ts
git commit -m "feat(genome): add settlement genome data tables (infrastructure, spheres, reaches, archetypes)"
```

---

## Slice 2: Consumer Alignment

### Task 4: Align Ambition Trait Gating

**Files:**
- Modify: `src/engine/ambitionSelection.ts:58-63`
- Test: `src/engine/__tests__/ambitionSelection.test.ts`

- [ ] **Step 1: Write failing test for edge-based trait lookup**

Check if `src/engine/__tests__/ambitionSelection.test.ts` exists. If not, create it. Add:

```typescript
describe('passesEligibility trait gating', () => {
  it('checks has_trait edges instead of flat string array', () => {
    const graph = new WorldGraph();
    const agentId = 'agent_1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Test', properties: {} });
    graph.addNode({ id: 'trait.culture.culture_0', type: 'trait', name: 'Daru', properties: { tags: ['Daru'] } });
    graph.addEdge({ id: 'e1', type: 'has_trait', source: agentId, target: 'trait.culture.culture_0', properties: { level: 1 } });

    const template = {
      requiredTraits: ['trait.culture.culture_0'],
      blockingTraits: [],
      reachFloors: {},
      // ... other required template fields
    };

    // The function should pass because agent has the trait via edge
    const result = passesEligibility(template, agentId, graph);
    expect(result).toBe(true);
  });

  it('fails when agent lacks required trait edge', () => {
    const graph = new WorldGraph();
    const agentId = 'agent_1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Test', properties: {} });

    const template = {
      requiredTraits: ['trait.culture.culture_0'],
      blockingTraits: [],
      reachFloors: {},
    };

    const result = passesEligibility(template, agentId, graph);
    expect(result).toBe(false);
  });
});
```

Note: Adapt the test to match the actual `passesEligibility` signature. It currently takes `(template, agent)` where `agent` has a `traits` property. The function signature needs to accept a `graph` parameter, or the agent object needs to be enriched with trait edge data. Read the actual function to determine the cleanest approach.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/ambitionSelection.test.ts -t "trait gating"`
Expected: FAIL

- [ ] **Step 3: Modify passesEligibility to use graph edge lookup**

In `src/engine/ambitionSelection.ts`, change the trait check from:

```typescript
for (const trait of template.requiredTraits) {
  if (!agent.traits.includes(trait)) return false;
}
```

To:

```typescript
if (template.requiredTraits.length > 0) {
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  const traitTargets = new Set(traitEdges.map(e => e.target));
  for (const trait of template.requiredTraits) {
    if (!traitTargets.has(trait)) return false;
  }
}
```

This requires adding `graph` and `agentId` parameters to the function (or to the calling context). Check all callers to update them.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/ambitionSelection.test.ts -t "trait gating"`
Expected: PASS

- [ ] **Step 5: Run all ambition tests to confirm no regressions**

Run: `npx vitest run src/engine/__tests__/ambitionSelection.test.ts`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine/ambitionSelection.ts src/engine/__tests__/ambitionSelection.test.ts
git commit -m "refactor(ambitions): align trait gating to edge-based lookup"
```

---

### Task 5: Align Spell Trait Gating

**Files:**
- Modify: `src/engine/spellActivation.ts:96-113`
- Test: `src/engine/__tests__/spellActivation.test.ts`

- [ ] **Step 1: Write failing test for trait node ID lookup**

```typescript
describe('checkPrerequisites culture trait gating', () => {
  it('checks has_trait edge target IDs instead of trait names/tags', () => {
    const graph = new WorldGraph();
    const agentId = 'agent_1';
    graph.addNode({ id: agentId, type: 'actor', name: 'Test', properties: {} });
    graph.addNode({ id: 'trait.culture.culture_0', type: 'trait', name: 'Daru', properties: { tags: ['Daru'] } });
    graph.addEdge({ id: 'e1', type: 'has_trait', source: agentId, target: 'trait.culture.culture_0', properties: { level: 1 } });

    const prereqs = {
      requiredTraits: ['trait.culture.culture_0'],
    };

    const result = checkPrerequisites(prereqs, agentId, graph);
    expect(result.met).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/spellActivation.test.ts -t "culture trait"`
Expected: FAIL — currently checks names/tags, not node IDs.

- [ ] **Step 3: Modify checkPrerequisites to check edge target IDs**

In `src/engine/spellActivation.ts`, change the trait check from:

```typescript
if (prereqs.requiredTraits) {
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  const traitNames = new Set<string>();
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (traitNode) {
      traitNames.add(traitNode.properties.name as string ?? '');
      const tags = traitNode.properties.tags as string[] | undefined;
      if (tags) tags.forEach(t => traitNames.add(t));
    }
  }
  for (const req of prereqs.requiredTraits) {
    if (!traitNames.has(req)) {
      return { met: false, reason: `Missing required trait: ${req}` };
    }
  }
}
```

To:

```typescript
if (prereqs.requiredTraits) {
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  // Build lookup set: edge target IDs + trait names + tags (backward-compatible)
  const traitKeys = new Set<string>();
  for (const edge of traitEdges) {
    traitKeys.add(edge.target); // canonical: trait node ID
    const traitNode = graph.getNode(edge.target);
    if (traitNode) {
      const name = traitNode.properties.name as string | undefined;
      if (name) traitKeys.add(name);
      const tags = traitNode.properties.tags as string[] | undefined;
      if (tags) tags.forEach(t => traitKeys.add(t));
    }
  }
  for (const req of prereqs.requiredTraits) {
    if (!traitKeys.has(req)) {
      return { met: false, reason: `Missing required trait: ${req}` };
    }
  }
}
```

This is backward-compatible: existing spells that gate on trait names still work, and new culture-gated spells can use the node ID.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/spellActivation.test.ts -t "culture trait"`
Expected: PASS

- [ ] **Step 5: Run all spell tests**

Run: `npx vitest run src/engine/__tests__/spellActivation.test.ts`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine/spellActivation.ts src/engine/__tests__/spellActivation.test.ts
git commit -m "refactor(spells): add trait node ID to prerequisite lookup (backward-compatible)"
```

---

## Slice 3: Settlement Genome Pipeline

### Task 6: Core Genome Pipeline — Passes 1-4

**Files:**
- Create: `src/engine/settlementGenome/runGenome.ts`
- Create: `src/engine/settlementGenome/index.ts`
- Test: `src/engine/__tests__/settlementGenome-pipeline.test.ts` (new)

- [ ] **Step 1: Write barrel export**

```typescript
// src/engine/settlementGenome/index.ts
export { runSettlementGenome } from './runGenome';
export type { GenomeResult, SettlementTier, SublocationTag } from './types';
export * from './constants';
```

- [ ] **Step 2: Write failing test for infrastructure pass**

```typescript
// src/engine/__tests__/settlementGenome-pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { runSettlementGenome } from '../settlementGenome';
import { WorldGraph } from '../graph';
import type { GenomeResult } from '../settlementGenome/types';

function makeSettlementNode(graph: WorldGraph, id: string, subtype: string) {
  graph.addNode({
    id,
    type: 'location',
    name: `Test ${subtype}`,
    properties: { locationSubtype: subtype, hexCol: 5, hexRow: 5 },
  });
}

describe('runSettlementGenome', () => {
  describe('Pass 1: Infrastructure', () => {
    it('hamlet gets inn, well-fountain, market-stall', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'hamlet');

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'hamlet',
        sphereInfluence: {},
        position: 'heartland',
        cultureId: null,
        seed: 42,
      });

      const infraIds = result.sublocations
        .filter(s => s.sourcePass === 'infrastructure')
        .map(s => s.id);
      expect(infraIds).toContain('sublocation-type.inn');
      expect(infraIds).toContain('sublocation-type.well-fountain');
      expect(infraIds).toContain('sublocation-type.market-stall');
    });

    it('town gets hamlet infrastructure plus town-tier sublocations', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town',
        sphereInfluence: {},
        position: 'heartland',
        cultureId: null,
        seed: 42,
      });

      const infraIds = result.sublocations
        .filter(s => s.sourcePass === 'infrastructure')
        .map(s => s.id);
      expect(infraIds).toContain('sublocation-type.inn');
      expect(infraIds).toContain('sublocation-type.gatehouse');
      expect(infraIds).toContain('sublocation-type.town-hall');
    });
  });

  describe('Pass 3: Spheres', () => {
    it('high force sphere adds barracks at town tier', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town',
        sphereInfluence: { force: 0.7 },
        position: 'heartland',
        cultureId: null,
        seed: 42,
      });

      const sphereIds = result.sublocations
        .filter(s => s.sourcePass === 'sphere')
        .map(s => s.id);
      expect(sphereIds).toContain('sublocation-type.barracks');
    });

    it('sphere below threshold contributes nothing', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town',
        sphereInfluence: { force: 0.2 },
        position: 'heartland',
        cultureId: null,
        seed: 42,
      });

      const sphereIds = result.sublocations
        .filter(s => s.sourcePass === 'sphere')
        .map(s => s.id);
      expect(sphereIds).not.toContain('sublocation-type.barracks');
    });
  });

  describe('Deduplication', () => {
    it('same sublocation from multiple passes is deduplicated with merged tags', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'city');

      // Both order sphere and star reach can contribute courthouse-type sublocations
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'city',
        sphereInfluence: { order: 0.5 },
        position: 'heartland',
        cultureId: null,
        seed: 42,
        reachOverrides: { star: 0.5 },
      });

      // Count unique sublocation IDs
      const allIds = result.sublocations.map(s => s.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe('NPC budget', () => {
    it('respects hamlet NPC budget cap', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'hamlet');

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'hamlet',
        sphereInfluence: { force: 0.9, matter: 0.9, life: 0.9 },
        position: 'borderland',
        cultureId: null,
        seed: 42,
      });

      // Hamlet budget: base 3 + perSublocation * count
      // Should not exceed reasonable hamlet NPC count
      expect(result.npcs.length).toBeLessThanOrEqual(
        3 + Math.ceil(result.sublocations.length * 1),
      );
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/settlementGenome-pipeline.test.ts`
Expected: FAIL — `runSettlementGenome` not implemented.

- [ ] **Step 4: Implement runSettlementGenome**

```typescript
// src/engine/settlementGenome/runGenome.ts
import type { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { ReachDomain } from '../../types/traits';
import type { NpcRole } from '../../types/npc';
import type {
  GenomeResult, SettlementTier, SublocationTag,
  SublocationContribution, NpcContribution,
} from './types';
import { SETTLEMENT_INFRASTRUCTURE, INFRASTRUCTURE_NPCS } from './infrastructure';
import { SPHERE_SUBLOCATION_MENU, POSITION_MODIFIERS } from './sphereMenu';
import { REACH_SUBLOCATION_MENU } from './reachMenu';
import { SETTLEMENT_ARCHETYPES } from './archetypes';
import {
  SPHERE_CONTRIBUTION_THRESHOLD, SPHERE_STRONG_THRESHOLD,
  REACH_CONTRIBUTION_THRESHOLD, NPC_BUDGET,
} from './constants';

export interface GenomeInput {
  tier: SettlementTier;
  sphereInfluence: Partial<Record<SphereName, number>>;
  position: 'heartland' | 'borderland';
  cultureId: string | null;
  seed: number;
  reachOverrides?: Partial<Record<ReachDomain, number>>;
}

const TIER_ORDER: SettlementTier[] = ['hamlet', 'town', 'city', 'capital'];

function tierAtOrBelow(tier: SettlementTier, minTier: SettlementTier): boolean {
  return TIER_ORDER.indexOf(minTier) <= TIER_ORDER.indexOf(tier);
}

export function runSettlementGenome(
  graph: WorldGraph,
  locationId: string,
  input: GenomeInput,
): GenomeResult {
  const { tier, sphereInfluence, position, seed } = input;
  const accumulated = new Map<string, { sourcePass: string; tags: SublocationTag[] }>();
  const npcList: GenomeResult['npcs'] = [];

  // ── Helper: add sublocation if not already present, merge tags if duplicate ──
  function addSublocation(id: string, sourcePass: string, tags: SublocationTag[]) {
    const existing = accumulated.get(id);
    if (existing) {
      // Merge tags from new source
      for (const t of tags) {
        if (!existing.tags.includes(t)) existing.tags.push(t);
      }
    } else {
      accumulated.set(id, { sourcePass, tags: [...tags] });
    }
  }

  // ── Pass 1: Infrastructure ──
  for (const entry of SETTLEMENT_INFRASTRUCTURE) {
    if (!tierAtOrBelow(tier, entry.minTier)) continue;
    if (entry.condition) continue; // Condition evaluation (coastal, prosperity) deferred to follow-up task
    addSublocation(entry.id, 'infrastructure', entry.tags);
  }
  for (const npc of INFRASTRUCTURE_NPCS) {
    if (tierAtOrBelow(tier, npc.minTier)) {
      npcList.push({ role: npc.role, sourcePass: 'infrastructure' });
    }
  }

  // ── Pass 2: Culture ──
  // Culture pass is a stub here — full implementation in Task 7
  // Culture sublocations are added by the culture subsystem

  // ── Pass 3: Spheres ──
  for (const [sphereKey, value] of Object.entries(sphereInfluence)) {
    if ((value ?? 0) < SPHERE_CONTRIBUTION_THRESHOLD) continue;
    const menu = SPHERE_SUBLOCATION_MENU[sphereKey as SphereName];
    if (!menu) continue;

    for (const sub of menu.sublocations) {
      if (tierAtOrBelow(tier, sub.minTier)) {
        addSublocation(sub.id, 'sphere', sub.tags);
      }
    }
    for (const npc of menu.npcRoles) {
      if (tierAtOrBelow(tier, npc.minTier)) {
        npcList.push({ role: npc.role, sourcePass: 'sphere' });
      }
    }
    // Strong sphere bonus: extra NPC
    if ((value ?? 0) >= SPHERE_STRONG_THRESHOLD && menu.npcRoles.length > 0) {
      const firstRole = menu.npcRoles[0];
      if (tierAtOrBelow(tier, firstRole.minTier)) {
        npcList.push({ role: firstRole.role, sourcePass: 'sphere' });
      }
    }
  }

  // Position modifier
  const posMod = POSITION_MODIFIERS[position];
  if (posMod) {
    for (const sub of posMod.bonusSublocations) {
      addSublocation(sub.id, 'sphere', sub.tags as SublocationTag[]);
    }
    for (const role of posMod.bonusNpcs) {
      npcList.push({ role, sourcePass: 'sphere' });
    }
  }

  // ── Pass 4: Reaches ──
  const reachProfile = input.reachOverrides
    ? { ...computeSettlementReaches(graph, locationId), ...input.reachOverrides }
    : computeSettlementReaches(graph, locationId);

  for (const [reachKey, value] of Object.entries(reachProfile)) {
    if ((value ?? 0) < REACH_CONTRIBUTION_THRESHOLD) continue;
    const menu = REACH_SUBLOCATION_MENU[reachKey as ReachDomain];
    if (!menu) continue;

    for (const sub of menu.sublocations) {
      if (tierAtOrBelow(tier, sub.minTier)) {
        addSublocation(sub.id, 'reach', sub.tags);
      }
    }
    for (const npc of menu.npcRoles) {
      if (tierAtOrBelow(tier, npc.minTier)) {
        npcList.push({ role: npc.role, sourcePass: 'reach' });
      }
    }
  }

  // ── Pass 5: Archetype Recognition ──
  const tagCounts = new Map<SublocationTag, number>();
  for (const entry of accumulated.values()) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  let matchedArchetype: typeof SETTLEMENT_ARCHETYPES[0] | null = null;
  for (const arch of [...SETTLEMENT_ARCHETYPES].sort((a, b) => b.priority - a.priority)) {
    const meets = arch.requiredTags.every(
      req => (tagCounts.get(req.tag) ?? 0) >= req.count,
    );
    if (meets) {
      matchedArchetype = arch;
      break;
    }
  }

  if (matchedArchetype) {
    for (const capId of matchedArchetype.capstoneSublocations) {
      addSublocation(capId, 'archetype', []);
    }
    for (const role of matchedArchetype.capstoneNpcs) {
      npcList.push({ role, sourcePass: 'archetype' });
    }
  }

  // ── NPC Budget Enforcement ──
  const budget = NPC_BUDGET[tier] ?? NPC_BUDGET.hamlet;
  const maxNpcs = Math.ceil(budget.base + accumulated.size * budget.perSublocation);
  const finalNpcs = npcList.slice(0, maxNpcs);

  // ── Build result ──
  const sublocations = Array.from(accumulated.entries()).map(([id, data]) => ({
    id,
    sourcePass: data.sourcePass as GenomeResult['sublocations'][0]['sourcePass'],
    tags: data.tags,
  }));

  return {
    sublocations,
    npcs: finalNpcs,
    archetypeId: matchedArchetype?.id ?? null,
    archetypeName: matchedArchetype?.name ?? null,
    archetypeProseFlavor: matchedArchetype?.proseFlavor ?? null,
    settlementReachProfile: reachProfile as Record<ReachDomain, number>,
  };
}

/** Compute settlement reach scores from factions, NPCs, and sublocations present */
export function computeSettlementReaches(
  graph: WorldGraph,
  locationId: string,
): Partial<Record<ReachDomain, number>> {
  // Stub: returns empty. Full implementation reads faction reachWeights,
  // NPC role affinities, and sublocation type affinities.
  // This is completed in Task 8.
  return {};
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/settlementGenome-pipeline.test.ts`
Expected: PASS (infrastructure and sphere tests pass; reach tests pass with stubs)

- [ ] **Step 6: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 7: Commit**

```bash
git add src/engine/settlementGenome/ src/engine/__tests__/settlementGenome-pipeline.test.ts
git commit -m "feat(genome): implement settlement genome pipeline passes 1-5"
```

---

### Task 7: Culture Pass Integration

**Files:**
- Modify: `src/engine/settlementGenome/runGenome.ts` (fill in Pass 2)
- Test: `src/engine/__tests__/settlementGenome-pipeline.test.ts` (add culture tests)

- [ ] **Step 1: Write failing test for culture pass**

Add to `settlementGenome-pipeline.test.ts`:

```typescript
describe('Pass 2: Culture', () => {
  it('culture contributes baseline sublocations to a town', () => {
    const graph = new WorldGraph();
    makeSettlementNode(graph, 'loc_1', 'town');

    // Register a culture with force foundation (should contribute martial sublocations)
    graph.addNode({
      id: 'culture_0',
      type: 'actor',
      name: 'Daru',
      properties: {
        actorType: 'culture',
        cultureIdentity: { foundationBias: 'force', demonym: 'Daru' },
      },
    });
    // belongs_to edge with culturalStrength
    graph.addEdge({
      id: 'e_cult',
      type: 'belongs_to',
      source: 'loc_1',
      target: 'culture_0',
      properties: { culturalStrength: 0.7, cultureLayer: 'current' },
    });

    const result = runSettlementGenome(graph, 'loc_1', {
      tier: 'town',
      sphereInfluence: {},
      position: 'heartland',
      cultureId: 'culture_0',
      seed: 42,
    });

    const cultureSubIds = result.sublocations
      .filter(s => s.sourcePass === 'culture')
      .map(s => s.id);
    expect(cultureSubIds.length).toBeGreaterThan(0);
  });

  it('low culture strength limits additions', () => {
    const graph = new WorldGraph();
    makeSettlementNode(graph, 'loc_1', 'city');

    graph.addNode({
      id: 'culture_0',
      type: 'actor',
      name: 'Daru',
      properties: {
        actorType: 'culture',
        cultureIdentity: { foundationBias: 'force', demonym: 'Daru' },
      },
    });
    graph.addEdge({
      id: 'e_cult',
      type: 'belongs_to',
      source: 'loc_1',
      target: 'culture_0',
      properties: { culturalStrength: 0.2, cultureLayer: 'current' },
    });

    const result = runSettlementGenome(graph, 'loc_1', {
      tier: 'city',
      sphereInfluence: {},
      position: 'heartland',
      cultureId: 'culture_0',
      seed: 42,
    });

    // Low strength: only 1 substitution, no additions
    const cultureSubIds = result.sublocations
      .filter(s => s.sourcePass === 'culture');
    expect(cultureSubIds.length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/settlementGenome-pipeline.test.ts -t "Pass 2"`
Expected: FAIL

- [ ] **Step 3: Implement culture pass in runGenome**

Fill in the Pass 2 section of `runSettlementGenome` in `runGenome.ts`. The culture pass:

1. Reads the settlement's `belongs_to` → culture edge (cultureLayer === 'current')
2. Gets `culturalStrength` from the edge
3. Gets the culture's `CultureIdentity` from the culture node
4. Foundation bias determines which cultural sublocations to contribute
5. Strength gates: below `CULTURE_STRENGTH_MIN_FOR_ADDITIONS` (0.3) → 1 substitution only

Create a `CULTURE_BASELINE_MAP` in a new file `src/engine/settlementGenome/cultureBaseline.ts`:

```typescript
// src/engine/settlementGenome/cultureBaseline.ts
import type { SublocationContribution, NpcContribution } from './types';

interface CultureBaseline {
  substitutions: { replaces: string; replacement: SublocationContribution }[];
  additions: SublocationContribution[];
  npcRoles: NpcContribution[];
  flavorTag: string;
}

export const CULTURE_BASELINE_MAP: Record<string, CultureBaseline> = {
  chaos: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.standing-stones', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.divination-tent', minTier: 'town', tags: ['arcane', 'cultural'] },
    ],
    npcRoles: [{ role: 'hermit', minTier: 'hamlet' }],
    flavorTag: 'wild tradition',
  },
  order: {
    substitutions: [
      { replaces: 'sublocation-type.town-hall', replacement: { id: 'sublocation-type.courthouse', minTier: 'town', tags: ['authority', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.archive', minTier: 'city', tags: ['scholarly', 'cultural'] },
    ],
    npcRoles: [{ role: 'scribe', minTier: 'town' }],
    flavorTag: 'civic tradition',
  },
  force: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.forge-shrine', minTier: 'hamlet', tags: ['religious', 'military', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.proving-ground', minTier: 'town', tags: ['military', 'cultural'] },
    ],
    npcRoles: [{ role: 'commander', minTier: 'town' }],
    flavorTag: 'warrior heritage',
  },
  life: {
    substitutions: [
      { replaces: 'sublocation-type.well-fountain', replacement: { id: 'sublocation-type.healing-spring', minTier: 'hamlet', tags: ['nature', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.herb-garden', minTier: 'town', tags: ['nature', 'cultural'] },
    ],
    npcRoles: [{ role: 'healer', minTier: 'hamlet' }],
    flavorTag: 'healer tradition',
  },
  mind: {
    substitutions: [
      { replaces: 'sublocation-type.town-hall', replacement: { id: 'sublocation-type.debate-hall', minTier: 'town', tags: ['scholarly', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.scriptorium', minTier: 'town', tags: ['scholarly', 'cultural'] },
    ],
    npcRoles: [{ role: 'scholar', minTier: 'town' }],
    flavorTag: 'scholastic tradition',
  },
  spirit: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.ancestor-shrine', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.spirit-grove', minTier: 'town', tags: ['religious', 'nature', 'cultural'] },
    ],
    npcRoles: [{ role: 'priest', minTier: 'hamlet' }],
    flavorTag: 'spirit-keeper tradition',
  },
  matter: {
    substitutions: [
      { replaces: 'sublocation-type.market-stall', replacement: { id: 'sublocation-type.stone-market', minTier: 'hamlet', tags: ['commerce', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.master-forge', minTier: 'town', tags: ['commerce', 'cultural'] },
    ],
    npcRoles: [{ role: 'mason', minTier: 'hamlet' }],
    flavorTag: 'craft heritage',
  },
  energy: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.storm-shrine', minTier: 'hamlet', tags: ['arcane', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.lightning-garden', minTier: 'city', tags: ['arcane', 'cultural'] },
    ],
    npcRoles: [{ role: 'researcher', minTier: 'town' }],
    flavorTag: 'storm tradition',
  },
  entropy: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.bone-chapel', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.plague-garden', minTier: 'town', tags: ['nature', 'cultural'] },
    ],
    npcRoles: [{ role: 'hermit', minTier: 'hamlet' }],
    flavorTag: 'death-keeper tradition',
  },
  time: {
    substitutions: [
      { replaces: 'sublocation-type.town-hall', replacement: { id: 'sublocation-type.chronicle-hall', minTier: 'town', tags: ['scholarly', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.sundial-garden', minTier: 'town', tags: ['scholarly', 'cultural'] },
    ],
    npcRoles: [{ role: 'scribe', minTier: 'town' }],
    flavorTag: 'chronicle tradition',
  },
  light: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.beacon-shrine', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.mirror-garden', minTier: 'city', tags: ['arcane', 'cultural'] },
    ],
    npcRoles: [{ role: 'priest', minTier: 'hamlet' }],
    flavorTag: 'beacon tradition',
  },
  darkness: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.shadow-shrine', minTier: 'hamlet', tags: ['religious', 'underworld', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.whispering-den', minTier: 'town', tags: ['underworld', 'cultural'] },
    ],
    npcRoles: [{ role: 'fence', minTier: 'town' }],
    flavorTag: 'shadow tradition',
  },
};
```

Then in `runGenome.ts`, implement Pass 2:

```typescript
  // ── Pass 2: Culture ──
  if (input.cultureId) {
    const cultureEdges = graph.getOutgoingEdges(locationId, 'belongs_to');
    const currentCultureEdge = cultureEdges.find(
      e => e.target === input.cultureId && (e.properties as any)?.cultureLayer === 'current',
    );
    const culturalStrength = (currentCultureEdge?.properties as any)?.culturalStrength ?? CULTURE_STRENGTH_BASE;

    const cultureNode = graph.getNode(input.cultureId);
    const identity = (cultureNode?.properties as any)?.cultureIdentity;
    const foundation = identity?.foundationBias as string | undefined;

    if (foundation) {
      const baseline = CULTURE_BASELINE_MAP[foundation];
      if (baseline) {
        // Substitutions: replace infrastructure slots with cultural variants
        let subsApplied = 0;
        const maxSubs = culturalStrength < CULTURE_STRENGTH_MIN_FOR_ADDITIONS ? 1 : 3;
        for (const sub of baseline.substitutions) {
          if (subsApplied >= maxSubs) break;
          if (!tierAtOrBelow(tier, sub.replacement.minTier)) continue;
          // Remove the generic slot if it was added by infrastructure
          accumulated.delete(sub.replaces);
          addSublocation(sub.replacement.id, 'culture', sub.replacement.tags);
          subsApplied++;
        }

        // Additions: unique cultural sublocations (only if strength >= threshold)
        if (culturalStrength >= CULTURE_STRENGTH_MIN_FOR_ADDITIONS) {
          for (const add of baseline.additions) {
            if (tierAtOrBelow(tier, add.minTier)) {
              addSublocation(add.id, 'culture', add.tags);
            }
          }
        }

        // NPC roles
        for (const npc of baseline.npcRoles) {
          if (tierAtOrBelow(tier, npc.minTier)) {
            npcList.push({ role: npc.role, sourcePass: 'culture' });
          }
        }
      }
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/settlementGenome-pipeline.test.ts -t "Pass 2"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/settlementGenome/
git add src/engine/__tests__/settlementGenome-pipeline.test.ts
git commit -m "feat(genome): implement culture pass (Pass 2) with substitutions and strength gating"
```

---

### Task 8: Reach Computation and Vitality

**Files:**
- Modify: `src/engine/settlementGenome/runGenome.ts` (implement `computeSettlementReaches`)
- Create: `src/engine/settlementGenome/vitality.ts`
- Test: `src/engine/__tests__/settlementGenome-vitality.test.ts` (new)

- [ ] **Step 1: Write failing test for reach computation**

```typescript
// src/engine/__tests__/settlementGenome-vitality.test.ts
import { describe, it, expect } from 'vitest';
import { computeSettlementReaches } from '../settlementGenome/runGenome';
import { computeVitality } from '../settlementGenome/vitality';
import { WorldGraph } from '../graph';

describe('computeSettlementReaches', () => {
  it('returns non-zero gold reach when merchant faction is present', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_merchant',
      type: 'actor',
      name: 'Merchant Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { gold: 0.9, iron: 0.1 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'member_of', source: 'faction_merchant', target: 'loc_1',
      properties: {},
    });
    // Alternatively, faction may be linked via located_at or similar — adapt to actual edge patterns

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(reaches.gold).toBeGreaterThan(0);
  });
});

describe('computeVitality', () => {
  it('returns value between 0 and 1', () => {
    const vitality = computeVitality({
      prosperity: 50,
      factionHealth: 0.8,
      threatPressure: 0.1,
      tradeActivity: 0.5,
      currentVitality: 0.5,
    });
    expect(vitality).toBeGreaterThanOrEqual(0);
    expect(vitality).toBeLessThanOrEqual(1);
  });

  it('high prosperity drives vitality up', () => {
    const low = computeVitality({
      prosperity: 20, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    const high = computeVitality({
      prosperity: 90, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('threat pressure drives vitality down', () => {
    const safe = computeVitality({
      prosperity: 50, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    const threatened = computeVitality({
      prosperity: 50, factionHealth: 0.5, threatPressure: 0.8, tradeActivity: 0, currentVitality: 0.5,
    });
    expect(threatened).toBeLessThan(safe);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/settlementGenome-vitality.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement computeSettlementReaches**

In `runGenome.ts`, replace the stub:

```typescript
export function computeSettlementReaches(
  graph: WorldGraph,
  locationId: string,
): Partial<Record<ReachDomain, number>> {
  const reaches: Partial<Record<ReachDomain, number>> = {};

  // Faction contributions: find factions with members at this location
  const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
  for (const edge of locatedAtEdges) {
    const actor = graph.getNode(edge.source);
    if (!actor || actor.properties.actorType !== 'faction') continue;
    const weights = actor.properties.reachWeights as Partial<Record<ReachDomain, number>> | undefined;
    if (!weights) continue;
    for (const [reach, weight] of Object.entries(weights)) {
      reaches[reach as ReachDomain] = (reaches[reach as ReachDomain] ?? 0) + (weight ?? 0);
    }
  }

  // Also check member_of edges: individuals who are members of factions at this location
  const memberEdges = graph.getIncomingEdges(locationId, 'member_of');
  // Faction presence via located actors who are faction members
  // (This may need adaptation based on actual graph wiring patterns)

  // Normalize to 0-1 range
  const maxVal = Math.max(...Object.values(reaches).map(v => v ?? 0), 1);
  for (const key of Object.keys(reaches)) {
    reaches[key as ReachDomain] = (reaches[key as ReachDomain] ?? 0) / maxVal;
  }

  return reaches;
}
```

- [ ] **Step 4: Implement computeVitality**

```typescript
// src/engine/settlementGenome/vitality.ts
import {
  VITALITY_PROSPERITY_WEIGHT, VITALITY_FACTION_WEIGHT,
  VITALITY_THREAT_WEIGHT, VITALITY_TRADE_WEIGHT,
  VITALITY_DRIFT_RATE,
} from './constants';

export interface VitalityInput {
  prosperity: number;       // 0-100
  factionHealth: number;    // 0-1 average
  threatPressure: number;   // 0-1 normalized
  tradeActivity: number;    // 0-1 normalized
  currentVitality: number;  // 0-1 current value
}

export function computeVitality(input: VitalityInput): number {
  const { prosperity, factionHealth, threatPressure, tradeActivity, currentVitality } = input;

  const normalizedProsperity = Math.min(prosperity / 100, 1);

  const targetVitality = Math.max(0, Math.min(1,
    (normalizedProsperity * VITALITY_PROSPERITY_WEIGHT)
    + (factionHealth * VITALITY_FACTION_WEIGHT)
    - (threatPressure * VITALITY_THREAT_WEIGHT)
    + (tradeActivity * VITALITY_TRADE_WEIGHT),
  ));

  // Drift toward target
  const newVitality = currentVitality + (targetVitality - currentVitality) * VITALITY_DRIFT_RATE;
  return Math.max(0, Math.min(1, newVitality));
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/engine/__tests__/settlementGenome-vitality.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine/settlementGenome/ src/engine/__tests__/settlementGenome-vitality.test.ts
git commit -m "feat(genome): implement reach computation and vitality drift model"
```

---

### Task 9: Reassessment Phase and Orchestrator Wiring

**Files:**
- Create: `src/engine/phaseSettlementReassessment.ts`
- Modify: `src/engine/orchestrator.ts` (add phase after 6.635)
- Modify: `src/engine/phaseSettlementPromotion.ts` (emit reassessment signal)
- Test: `src/engine/__tests__/phaseSettlementReassessment.test.ts` (new)

- [ ] **Step 1: Write failing test for reassessment phase**

```typescript
// src/engine/__tests__/phaseSettlementReassessment.test.ts
import { describe, it, expect } from 'vitest';
import { phaseSettlementReassessment } from '../phaseSettlementReassessment';
// Import test helpers for creating minimal GameState

describe('phaseSettlementReassessment', () => {
  it('returns empty when no settlements need reassessment', () => {
    const state = makeMinimalGameState(); // helper
    const result = phaseSettlementReassessment(state);
    expect(result.tickEvents?.length ?? 0).toBe(0);
  });

  it('triggers reassessment when settlement has pendingReassessment flag', () => {
    const state = makeMinimalGameState();
    // Set a location with pendingReassessment = true
    const loc = state.graph.getNode('loc_1');
    if (loc) loc.properties.pendingReassessment = true;
    loc!.properties.reassessmentTick = state.tick - 7; // past delay

    const result = phaseSettlementReassessment(state);
    // Reassessment should have run and cleared the flag
    expect(loc!.properties.pendingReassessment).toBeFalsy();
  });
});
```

- [ ] **Step 2: Implement phaseSettlementReassessment**

```typescript
// src/engine/phaseSettlementReassessment.ts
import type { GameState, TickEvent } from '../types/index';
import { runSettlementGenome } from './settlementGenome';
import { PROMOTION_REASSESSMENT_DELAY } from './settlementGenome/constants';
import { emitTrace } from './traceBuffer';
import type { SettlementReassessmentTrace } from '../types/trace';

const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

export function phaseSettlementReassessment(state: GameState): Partial<GameState> {
  const { graph, tick, seed } = state;
  const events: TickEvent[] = [];
  const locations = graph.getNodesByType('location');

  for (const loc of locations) {
    const subtype = loc.properties.locationSubtype as string;
    if (!SETTLEMENT_SUBTYPES.has(subtype)) continue;
    if (!loc.properties.pendingReassessment) continue;

    const reassessmentTick = (loc.properties.reassessmentTick as number) ?? 0;
    if (tick - reassessmentTick < PROMOTION_REASSESSMENT_DELAY) continue;

    // Run genome reassessment
    const sphereInfluence = (loc.properties.sphereInfluence ?? {}) as Record<string, number>;
    const position = (loc.properties.position ?? 'heartland') as 'heartland' | 'borderland';
    const cultureEdge = graph.getOutgoingEdges(loc.id, 'belongs_to')
      .find(e => (e.properties as any)?.cultureLayer === 'current');
    const cultureId = cultureEdge?.target ?? null;

    const result = runSettlementGenome(graph, loc.id, {
      tier: subtype as any,
      sphereInfluence,
      position,
      cultureId,
      seed: seed + tick,
    });

    // Store genome result on location properties for UI consumption
    loc.properties.genomeResult = result;
    loc.properties.archetypeId = result.archetypeId;
    loc.properties.archetypeName = result.archetypeName;
    loc.properties.archetypeProseFlavor = result.archetypeProseFlavor;
    loc.properties.pendingReassessment = false;

    // Note: actual sublocation creation/destruction from genome result
    // is handled by a separate materializeGenome() function (Task 10)

    emitTrace({
      tick,
      category: 'settlement_reassessment',
      summary: `Reassessed ${loc.name} (${subtype})${result.archetypeName ? ` → ${result.archetypeName}` : ''}`,
      locationId: loc.id,
      trigger: (loc.properties.reassessmentTrigger as string) ?? 'promotion',
    } as any);
  }

  return { tickEvents: [...(state.tickEvents ?? []), ...events] };
}
```

- [ ] **Step 3: Wire into orchestrator**

In `src/engine/orchestrator.ts`, after the `phaseSettlementPromotion` block (around line 1874):

```typescript
import { phaseSettlementReassessment } from './phaseSettlementReassessment';
```

And in the phase sequence:

```typescript
  // Phase 6.636: Settlement Genome Reassessment (re-evaluate genome on tier changes or reach shifts)
  s = { ...s, ...phaseSettlementReassessment(s) };
  phaseEventCounts['settlement_reassessment'] = s.tickEvents.length - prevEventCount;
  prevEventCount = s.tickEvents.length;
```

- [ ] **Step 4: Flag reassessment from phaseSettlementPromotion**

In `src/engine/phaseSettlementPromotion.ts`, after a successful promotion or demotion, set:

```typescript
loc.properties.pendingReassessment = true;
loc.properties.reassessmentTick = tick;
loc.properties.reassessmentTrigger = promoted ? 'promotion' : 'demotion';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/engine/__tests__/phaseSettlementReassessment.test.ts`
Expected: PASS

- [ ] **Step 6: Type check and commit**

```bash
npx tsc --noEmit
git add src/engine/phaseSettlementReassessment.ts src/engine/orchestrator.ts src/engine/phaseSettlementPromotion.ts
git add src/engine/__tests__/phaseSettlementReassessment.test.ts
git commit -m "feat(genome): add phaseSettlementReassessment and wire into orchestrator"
```

---

### Task 10: Wire Genome into WorldSeed

**Files:**
- Modify: `src/engine/worldSeed.ts` (call `runSettlementGenome` instead of `ensureSublocations` for settlements)
- Create: `src/engine/settlementGenome/materialize.ts` (convert GenomeResult into actual graph nodes)
- Test: `src/engine/__tests__/settlementGenome-materialize.test.ts` (new)

- [ ] **Step 1: Write failing test for materialization**

```typescript
// src/engine/__tests__/settlementGenome-materialize.test.ts
import { describe, it, expect } from 'vitest';
import { materializeGenome } from '../settlementGenome/materialize';
import { WorldGraph } from '../graph';
import type { GenomeResult } from '../settlementGenome/types';

describe('materializeGenome', () => {
  it('creates sublocation nodes and contains edges from genome result', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_1', type: 'location', name: 'Test Town',
      properties: { locationSubtype: 'town' },
    });

    const result: GenomeResult = {
      sublocations: [
        { id: 'sublocation-type.inn', sourcePass: 'infrastructure', tags: ['commerce'] },
        { id: 'sublocation-type.barracks', sourcePass: 'sphere', tags: ['military'] },
      ],
      npcs: [],
      archetypeId: null,
      archetypeName: null,
      archetypeProseFlavor: null,
      settlementReachProfile: {} as any,
    };

    materializeGenome(graph, 'loc_1', result, 42);

    const containsEdges = graph.getOutgoingEdges('loc_1', 'contains');
    expect(containsEdges.length).toBe(2);

    // Verify sublocation nodes exist
    for (const edge of containsEdges) {
      const node = graph.getNode(edge.target);
      expect(node).toBeTruthy();
      expect(node!.type).toBe('location');
      expect(node!.properties.sublocationTypeId).toBeTruthy();
    }
  });

  it('stores genome result on location properties', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_1', type: 'location', name: 'Test Town',
      properties: { locationSubtype: 'town' },
    });

    const result: GenomeResult = {
      sublocations: [],
      npcs: [],
      archetypeId: 'garrison-town',
      archetypeName: 'Garrison Town',
      archetypeProseFlavor: 'a town that exists to hold the line',
      settlementReachProfile: {} as any,
    };

    materializeGenome(graph, 'loc_1', result, 42);

    const loc = graph.getNode('loc_1');
    expect(loc!.properties.archetypeId).toBe('garrison-town');
    expect(loc!.properties.archetypeName).toBe('Garrison Town');
  });
});
```

- [ ] **Step 2: Implement materializeGenome**

```typescript
// src/engine/settlementGenome/materialize.ts
import type { WorldGraph } from '../graph';
import type { GenomeResult } from './types';

/**
 * Convert a GenomeResult into actual graph nodes (sublocation instances + contains edges).
 * Idempotent: skips sublocations that already exist.
 */
export function materializeGenome(
  graph: WorldGraph,
  locationId: string,
  result: GenomeResult,
  seed: number,
): void {
  const loc = graph.getNode(locationId);
  if (!loc) return;

  // Store genome metadata on location
  loc.properties.archetypeId = result.archetypeId;
  loc.properties.archetypeName = result.archetypeName;
  loc.properties.archetypeProseFlavor = result.archetypeProseFlavor;
  loc.properties.genomeResult = result;

  // Check existing sublocations to avoid duplicates
  const existingContains = graph.getOutgoingEdges(locationId, 'contains');
  const existingTypeIds = new Set(
    existingContains.map(e => {
      const node = graph.getNode(e.target);
      return node?.properties.sublocationTypeId as string | undefined;
    }).filter(Boolean),
  );

  for (let i = 0; i < result.sublocations.length; i++) {
    const sub = result.sublocations[i];
    if (existingTypeIds.has(sub.id)) continue;

    const subId = `${locationId}_sub_${sub.id.replace('sublocation-type.', '')}_${i}`;
    const subName = sub.id
      .replace('sublocation-type.', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    graph.addNode({
      id: subId,
      type: 'location',
      name: subName,
      properties: {
        sublocationTypeId: sub.id,
        parentLocationId: locationId,
        hexCol: loc.properties.hexCol,
        hexRow: loc.properties.hexRow,
        genomeSourcePass: sub.sourcePass,
        genomeTags: sub.tags,
      },
    });

    graph.addEdge({
      id: `edge_contains_${locationId}_${subId}`,
      type: 'contains',
      source: locationId,
      target: subId,
      properties: {},
    });
  }
}
```

- [ ] **Step 3: Wire into worldSeed**

In `src/engine/worldSeed.ts`, find the section where `ensureSublocations` is called for settlement locations. For settlement subtypes (hamlet/town/city/capital), replace with:

```typescript
import { runSettlementGenome } from './settlementGenome';
import { materializeGenome } from './settlementGenome/materialize';

// For settlement locations, use genome pipeline
const GENOME_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);
for (const locId of locationIds) {
  const loc = graph.getNode(locId);
  const subtype = loc?.properties.locationSubtype as string;
  if (GENOME_SUBTYPES.has(subtype)) {
    const cultureEdge = graph.getOutgoingEdges(locId, 'belongs_to')
      .find(e => (e.properties as any)?.cultureLayer === 'current');
    const sphereInfluence = (loc?.properties.sphereInfluence ?? {}) as Record<string, number>;
    const position = (loc?.properties.position ?? 'heartland') as 'heartland' | 'borderland';

    const genomeResult = runSettlementGenome(graph, locId, {
      tier: subtype as any,
      sphereInfluence,
      position,
      cultureId: cultureEdge?.target ?? null,
      seed,
    });
    materializeGenome(graph, locId, genomeResult, seed);
  } else {
    // Non-settlement locations use legacy ensureSublocations
    ensureSublocations(graph, locId, seed);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/settlementGenome-materialize.test.ts`
Expected: PASS

Then run existing worldSeed/sublocation tests:

Run: `npx vitest run src/engine/__tests__/sublocation.test.ts`
Expected: PASS (ensureSublocations still works for non-settlements)

- [ ] **Step 5: CLI smoke test**

```bash
npm run cli -- --seed 42 --map small
```

At the `fws>` prompt:

```
eval state.graph.getNodesByType("location").filter(n => n.properties.archetypeId).map(n => `${n.name}: ${n.properties.archetypeName}`).slice(0,10)
eval state.graph.getNodesByType("location").filter(n => n.properties.genomeResult).length
```

Verify settlements have genome results and some have archetypes.

- [ ] **Step 6: Type check, build, and commit**

```bash
npx tsc --noEmit
npx vite build
git add src/engine/settlementGenome/materialize.ts src/engine/worldSeed.ts
git add src/engine/__tests__/settlementGenome-materialize.test.ts
git commit -m "feat(genome): wire genome pipeline into worldSeed, replacing ensureSublocations for settlements"
```

---

## Slice 4: Prose, UI, and Verification

### Task 11: Settlement Label and Archetype in UI

**Files:**
- Modify: `src/components/Game/HexChronicle.tsx` (show archetype name)
- Modify: `src/components/Game/HexSidebar.tsx` (show archetype badge)

- [ ] **Step 1: Add archetype to HexChronicle subtitle**

In `src/components/Game/HexChronicle.tsx`, find where the settlement subtitle is constructed (the hero section). After the terrain/coordinate line, add:

```typescript
const archetypeName = locations[0]?.properties?.archetypeName as string | undefined;
```

Then in the subtitle JSX, conditionally show:

```tsx
{archetypeName && (
  <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
    {' — '}{archetypeName}
  </span>
)}
```

- [ ] **Step 2: Add archetype badge to HexSidebar**

In `src/components/Game/HexSidebar.tsx`, find where settlement info is displayed. Add an archetype badge:

```tsx
{location?.properties?.archetypeName && (
  <div style={{
    fontSize: 'var(--text-xs)',
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: '2px',
  }}>
    {location.properties.archetypeName}
  </div>
)}
```

- [ ] **Step 3: Verify with dev server**

Start dev server, navigate to `?view=game`, click a city hex, verify archetype appears in chronicle and sidebar.

- [ ] **Step 4: Commit**

```bash
git add src/components/Game/HexChronicle.tsx src/components/Game/HexSidebar.tsx
git commit -m "feat(ui): show settlement archetype in HexChronicle and HexSidebar"
```

---

### Task 12: Debug Visibility

**Files:**
- Modify: `src/components/Game/DebugPanel.tsx` (trace filter for new categories)
- Modify: CLI (add genome inspection command)

- [ ] **Step 1: Verify DebugPanel auto-picks up new trace categories**

The DebugPanel imports `TRACE_CATEGORIES` from `src/types/trace.ts` and renders filter checkboxes. Since we added `settlement_genome`, `settlement_reassessment`, `culture_generation`, and `culture_sublocation` in Task 1, they should appear automatically. Verify by reading the DebugPanel component to confirm it uses the `TRACE_CATEGORIES` array dynamically.

If the DebugPanel hardcodes category names instead of reading the array, add the new categories to the hardcoded list.

- [ ] **Step 2: Add CLI genome inspection command**

In the CLI source (find with `grep -r "fws>" src/`), add a `genome` command:

```typescript
case 'genome': {
  const locationName = args.join(' ');
  const loc = state.graph.getNodesByType('location')
    .find(n => n.name.toLowerCase().includes(locationName.toLowerCase()));
  if (!loc) { console.log(`No location matching "${locationName}"`); break; }
  const genome = loc.properties.genomeResult as any;
  if (!genome) { console.log(`${loc.name} has no genome result`); break; }
  console.log(`\n${loc.name} (${loc.properties.locationSubtype})`);
  if (genome.archetypeName) console.log(`  Archetype: ${genome.archetypeName}`);
  console.log(`  Sublocations: ${genome.sublocations.length}`);
  for (const sub of genome.sublocations) {
    console.log(`    [${sub.sourcePass}] ${sub.id} (${sub.tags.join(', ')})`);
  }
  console.log(`  NPCs: ${genome.npcs.length}`);
  for (const npc of genome.npcs) {
    console.log(`    [${npc.sourcePass}] ${npc.role}`);
  }
  break;
}
```

- [ ] **Step 3: Test CLI command**

```bash
npm run cli -- --seed 42
```

At `fws>`: `genome bone coast` (or whatever city name appears)

Verify output shows sublocations grouped by pass with tags.

- [ ] **Step 4: Commit**

```bash
git add <modified files>
git commit -m "feat(debug): add genome CLI command and verify trace category visibility"
```

---

### Task 13: Regression Tests and Final Verification

**Files:**
- Modify: `src/engine/__tests__/sublocation.test.ts` (add non-regression test)
- Run: all tests, type check, build

- [ ] **Step 1: Add non-regression test for legacy ensureSublocations**

In `src/engine/__tests__/sublocation.test.ts`, add:

```typescript
describe('ensureSublocations still works for non-settlement types', () => {
  it('creates sublocations for castle via legacy path', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_castle',
      type: 'location',
      name: 'Test Castle',
      properties: { locationSubtype: 'castle' },
    });

    const result = ensureSublocations(graph, 'loc_castle', 42);
    // Castle: throne-room, barracks, dungeon
    expect(result.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All existing tests still pass. New tests pass.

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 4: Production build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 5: CLI smoke test**

```bash
npm run cli -- --seed 42
```

At `fws>` prompt:

```
tick 30
status
eval state.graph.getNodesByType("location").filter(n => n.properties.archetypeId).map(n => `${n.name}: ${n.properties.archetypeName}`)
eval state.graph.getNodesByType("location").filter(n => n.properties.genomeResult).map(n => ({ name: n.name, subs: n.properties.genomeResult.sublocations.length, npcs: n.properties.genomeResult.npcs.length })).slice(0,10)
genome <city-name>
```

Verify:
- Settlements have genome results
- Some settlements have archetypes
- Sublocation counts vary by tier (hamlets small, cities large)
- Different passes contribute different sublocations
- 30 ticks run without crashes (fail-soft)

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test(genome): add regression tests and verify pipeline end-to-end"
```

- [ ] **Step 7: Push**

```bash
git push
```

---

## Summary

| Slice | Tasks | Key Deliverable |
|-------|-------|----------------|
| 1. Core Contracts | 1-3 | Trace categories, culture trait nodes, genome data tables |
| 2. Consumer Alignment | 4-5 | Ambition + spell gating use edge-based trait lookup |
| 3. Genome Pipeline | 6-10 | Five-pass pipeline, vitality, reassessment, worldSeed wiring |
| 4. UI & Verification | 11-13 | Archetype in UI, debug CLI, regression tests |

Each task is independently committable and testable. Slices can be implemented sequentially. Slice 1 has no dependencies on other slices. Slice 2 depends on Slice 1 (trait nodes must exist). Slice 3 depends on Slice 1 (data tables). Slice 4 depends on Slice 3 (genome results must exist for UI).

### Deferred to Follow-Up

These items are intentionally out of scope for this plan:

- **NPC materialization from genome result**: The genome computes an NPC roster (`result.npcs`) and stores it on location properties, but actual NPC node creation still uses the existing `npcSeeding.ts` pipeline. A follow-up task should modify `npcSeeding.ts` to read from `genomeResult.npcs` instead of `LOCATION_ROLE_ROSTERS` for settlement locations.
- **Infrastructure condition evaluation**: Pass 1 entries with `condition` (coastal-hex, high-prosperity, trade-route) are skipped in v1. A follow-up should evaluate these from hex/prosperity data.
- **Settlement notifications**: Promotion/demotion/archetype toast notifications and chronicle events need UI wiring in the notification system.
