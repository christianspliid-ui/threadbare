# NPC Framework v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed ambient NPCs at world-gen, let the player target them with NPC-specific actions, and graduate them to full agents via player action, organic threshold, or story triggers.

**Architecture:** All NPCs are `actor` nodes with `actorType: 'individual'` and a new `spotlightTier` property (`'ambient' | 'notable' | 'spotlight'`). Existing agents get `spotlightTier: 'spotlight'` by default. Engine phases add tier guards. A new Phase 2.37 scans for graduation. NPC action templates are a new dataset filtered via the existing Generalized Action Targeting system.

**Tech Stack:** TypeScript, React, Vitest, seeded PRNG (mulberry32)

**Spec:** `Docs/plans/2026-04-01-npc-framework-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/types/npc.ts` | `SpotlightTier` type, `NpcRole` type, NPC constants, NPC-related property interfaces |
| `src/engine/npcSeeding.ts` | `seedNpcsAtLocations()` — world-gen NPC creation, role roster tables, faction NPC seeding |
| `src/engine/npcGraduation.ts` | `phaseNpcGraduation()` — Phase 2.37, `hydrateToTier()`, `bumpImportance()` |
| `src/data/npc-action-templates.ts` | ~20-25 NPC-specific action templates |
| `src/engine/__tests__/npcSeeding.test.ts` | Tests for NPC seeding |
| `src/engine/__tests__/npcGraduation.test.ts` | Tests for graduation mechanics |
| `src/engine/__tests__/npcTierGuards.test.ts` | Tests for tier guard behavior across engine phases |
| `src/data/__tests__/npc-action-templates.test.ts` | Tests for NPC action template validity |
| `src/components/Game/NpcDetailView.tsx` | Lightweight NPC detail panel |
| `src/components/Game/__tests__/NpcDetailView.test.tsx` | Tests for NPC detail view |

### Modified Files

| File | Change |
|------|--------|
| `src/types/graph.ts` | Add `SpotlightTier` to exports, no structural changes |
| `src/engine/worldSeed.ts` | Call `seedNpcsAtLocations()` after existing actor seeding |
| `src/engine/orchestrator.ts` | Add Phase 2.37 call between movement and dilemma detection |
| `src/engine/phaseAgentDecision.ts` | Add `spotlightTier === 'spotlight'` guard |
| `src/engine/phaseMovement.ts` | Add `spotlightTier === 'spotlight'` guard |
| `src/engine/socialEncounterGeneration.ts` | Add `spotlightTier === 'spotlight'` filter on social targets |
| `src/engine/agentValidation.ts` | Skip axiological profile validation for non-spotlight actors |
| `src/engine/graphQueries.ts` | Add optional `spotlightTier` filter parameter to `getAgentsAtLocation()` |
| `src/engine/targetActions.ts` | No code change — NPC templates use existing `requiredNodeProperties` gate |
| `src/components/Game/LocationView.tsx` | Add NPC roster section |
| `src/components/Game/LocationProfileModal.tsx` | Wire NPC click → target selection |

---

## Task 1: SpotlightTier Type & NPC Constants

**Files:**
- Create: `src/types/npc.ts`
- Test: `src/types/__tests__/npc.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/types/__tests__/npc.test.ts
import { describe, it, expect } from 'vitest';
import {
  SPOTLIGHT_TIERS,
  NPC_ROLES,
  NPC_CONSTANTS,
  type SpotlightTier,
  type NpcRole,
} from '../npc';

describe('NPC types', () => {
  it('defines three spotlight tiers', () => {
    expect(SPOTLIGHT_TIERS).toEqual(['ambient', 'notable', 'spotlight']);
  });

  it('defines NPC roles', () => {
    expect(NPC_ROLES.length).toBeGreaterThan(10);
    expect(NPC_ROLES).toContain('innkeeper');
    expect(NPC_ROLES).toContain('guard');
    expect(NPC_ROLES).toContain('merchant');
    expect(NPC_ROLES).toContain('healer');
    expect(NPC_ROLES).toContain('priest');
  });

  it('defines tunable constants with defaults', () => {
    expect(NPC_CONSTANTS.NOTABLE_THRESHOLD).toBe(10);
    expect(NPC_CONSTANTS.SPOTLIGHT_THRESHOLD).toBe(25);
    expect(NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES).toBe(3);
    expect(NPC_CONSTANTS.PROMOTE_ESSENCE_BASE).toBe(8);
    expect(NPC_CONSTANTS.MAX_NPCS_HAMLET).toBe(4);
    expect(NPC_CONSTANTS.MAX_NPCS_TOWN).toBe(8);
    expect(NPC_CONSTANTS.MAX_NPCS_CITY).toBe(15);
    expect(NPC_CONSTANTS.WILDERNESS_NPC_CHANCE).toBe(0.3);
  });

  it('defines importance increment constants', () => {
    expect(NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION).toBe(3);
    expect(NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE).toBe(1);
    expect(NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED).toBe(2);
    expect(NPC_CONSTANTS.IMPORTANCE_TRAIT_GAINED).toBe(4);
    expect(NPC_CONSTANTS.IMPORTANCE_LOCATION_CONTESTED).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/npc.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/types/npc.ts

import type { SphereName } from './index';

// ─── Spotlight Tier ─────────────────────────────────────────────

export type SpotlightTier = 'ambient' | 'notable' | 'spotlight';

export const SPOTLIGHT_TIERS: readonly SpotlightTier[] = ['ambient', 'notable', 'spotlight'] as const;

// ─── NPC Roles ──────────────────────────────────────────────────

export const NPC_ROLES = [
  'innkeeper', 'elder', 'guard', 'guard_captain', 'merchant', 'trader',
  'smith', 'healer', 'priest', 'acolyte', 'pilgrim', 'scholar',
  'spy', 'noble', 'entertainer', 'faction_rep', 'commander',
  'quartermaster', 'scout', 'hermit', 'ranger', 'wanderer',
  'clerk', 'appraiser', 'fence', 'informant', 'lookout',
  'steward', 'herald', 'attendant', 'scribe', 'librarian',
  'researcher', 'weaver', 'mason', 'brewer',
] as const;

export type NpcRole = typeof NPC_ROLES[number];

// ─── Role Roster ────────────────────────────────────────────────

export interface RoleRosterEntry {
  readonly role: NpcRole;
  /** Probability of spawning (1.0 = always) */
  readonly chance: number;
}

export const LOCATION_ROLE_ROSTERS: Readonly<Record<string, readonly RoleRosterEntry[]>> = {
  hamlet: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'elder', chance: 1.0 },
    { role: 'guard', chance: 0.8 },
  ],
  town: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'smith', chance: 0.9 },
    { role: 'healer', chance: 0.8 },
    { role: 'priest', chance: 0.7 },
  ],
  city: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'smith', chance: 1.0 },
    { role: 'healer', chance: 1.0 },
    { role: 'priest', chance: 1.0 },
    { role: 'scholar', chance: 0.8 },
    { role: 'spy', chance: 0.6 },
    { role: 'noble', chance: 0.7 },
    { role: 'entertainer', chance: 0.7 },
  ],
  temple: [
    { role: 'priest', chance: 1.0 },
    { role: 'acolyte', chance: 0.9 },
    { role: 'pilgrim', chance: 0.7 },
  ],
  military_outpost: [
    { role: 'commander', chance: 1.0 },
    { role: 'quartermaster', chance: 0.9 },
    { role: 'scout', chance: 0.8 },
  ],
  wilderness: [
    { role: 'hermit', chance: 0.3 },
    { role: 'ranger', chance: 0.3 },
    { role: 'wanderer', chance: 0.3 },
  ],
};

// ─── Faction Role Rosters ───────────────────────────────────────

export const FACTION_ROLE_ROSTERS: Readonly<Record<string, readonly RoleRosterEntry[]>> = {
  merchant_guild: [
    { role: 'merchant', chance: 1.0 },
    { role: 'trader', chance: 0.9 },
    { role: 'clerk', chance: 0.7 },
    { role: 'appraiser', chance: 0.6 },
  ],
  military_order: [
    { role: 'guard', chance: 1.0 },
    { role: 'guard', chance: 0.9 },
    { role: 'scout', chance: 0.8 },
    { role: 'quartermaster', chance: 0.7 },
  ],
  religious_order: [
    { role: 'priest', chance: 1.0 },
    { role: 'acolyte', chance: 0.9 },
    { role: 'pilgrim', chance: 0.7 },
  ],
  thieves_guild: [
    { role: 'fence', chance: 1.0 },
    { role: 'informant', chance: 0.9 },
    { role: 'lookout', chance: 0.7 },
  ],
  noble_house: [
    { role: 'steward', chance: 1.0 },
    { role: 'herald', chance: 0.8 },
    { role: 'attendant', chance: 0.7 },
    { role: 'guard', chance: 0.9 },
  ],
  scholarly_circle: [
    { role: 'scribe', chance: 1.0 },
    { role: 'librarian', chance: 0.8 },
    { role: 'researcher', chance: 0.7 },
  ],
  artisan_guild: [
    { role: 'smith', chance: 1.0 },
    { role: 'weaver', chance: 0.8 },
    { role: 'mason', chance: 0.7 },
    { role: 'brewer', chance: 0.6 },
  ],
};

// ─── NPC Name Pool ──────────────────────────────────────────────
// Fallback names when culture naming tables are unavailable.

export const NPC_NAME_POOL = [
  'Aldric', 'Benna', 'Corwin', 'Dagna', 'Edric', 'Fenna', 'Greydon', 'Halla',
  'Iver', 'Jessa', 'Kellan', 'Lira', 'Maren', 'Norren', 'Orin', 'Petra',
  'Quinn', 'Reva', 'Soren', 'Talia', 'Ulric', 'Vessa', 'Wynn', 'Xara',
  'Yoren', 'Zella', 'Ansel', 'Brida', 'Calder', 'Dagna', 'Elara', 'Finn',
  'Gareth', 'Helsa', 'Ingrid', 'Jorik', 'Kenna', 'Leif', 'Mira', 'Niall',
  'Olwen', 'Priya', 'Ronan', 'Sigrid', 'Torben', 'Una', 'Viggo', 'Wren',
] as const;

// ─── Constants ──────────────────────────────────────────────────

export const NPC_CONSTANTS = {
  // Graduation thresholds
  NOTABLE_THRESHOLD: 10,
  SPOTLIGHT_THRESHOLD: 25,
  SPOTLIGHT_MIN_EDGES: 3,

  // Player promotion costs
  PROMOTE_ESSENCE_BASE: 8,
  PROMOTE_IMPORTANCE_DISCOUNT: 0.5,

  // Importance increments
  IMPORTANCE_PLAYER_ACTION: 3,
  IMPORTANCE_ENCOUNTER_REFERENCE: 1,
  IMPORTANCE_EDGE_CREATED: 2,
  IMPORTANCE_TRAIT_GAINED: 4,
  IMPORTANCE_LOCATION_CONTESTED: 1,

  // Population caps
  MAX_NPCS_HAMLET: 4,
  MAX_NPCS_TOWN: 8,
  MAX_NPCS_CITY: 15,

  // Seeding
  WILDERNESS_NPC_CHANCE: 0.3,
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/npc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/npc.ts src/types/__tests__/npc.test.ts
git commit -m "feat(npc): add SpotlightTier type, NPC roles, and constants"
```

---

## Task 2: NPC Seeding at World-Gen

**Files:**
- Create: `src/engine/npcSeeding.ts`
- Modify: `src/engine/worldSeed.ts` (~line 1243, after individual actor loop)
- Test: `src/engine/__tests__/npcSeeding.test.ts`

- [ ] **Step 1: Write the tests**

```typescript
// src/engine/__tests__/npcSeeding.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedNpcsAtLocations } from '../npcSeeding';
import { NPC_CONSTANTS } from '../../types/npc';
import { mulberry32 } from '../prng';

function createTestGraph() {
  const graph = new WorldGraph();
  // Add a culture node
  graph.addNode({ id: 'culture_1', type: 'actor', name: 'Aurelian', properties: { actorType: 'culture' } });

  // Add a hamlet location
  graph.addNode({ id: 'loc_hamlet', type: 'location', name: 'Millford', properties: { locationSubtype: 'hamlet' } });
  graph.addEdge({ id: 'loc_hamlet_culture', source: 'loc_hamlet', target: 'culture_1', type: 'belongs_to', properties: { cultureLayer: 'current' } });

  // Add a city location
  graph.addNode({ id: 'loc_city', type: 'location', name: 'Ironhaven', properties: { locationSubtype: 'city' } });
  graph.addEdge({ id: 'loc_city_culture', source: 'loc_city', target: 'culture_1', type: 'belongs_to', properties: { cultureLayer: 'current' } });

  // Add a lair (should get no NPCs)
  graph.addNode({ id: 'loc_lair', type: 'location', name: 'Dark Pit', properties: { locationSubtype: 'lair' } });

  return graph;
}

describe('seedNpcsAtLocations', () => {
  it('creates ambient NPC actor nodes at settlements', () => {
    const graph = createTestGraph();
    const rng = mulberry32(42);
    const result = seedNpcsAtLocations(graph, ['loc_hamlet', 'loc_city', 'loc_lair'], rng);

    // Hamlet should have 2-3 NPCs, city should have 6-10
    const hamletNpcs = graph.getIncomingEdges('loc_hamlet', 'located_at')
      .map(e => graph.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient');
    expect(hamletNpcs.length).toBeGreaterThanOrEqual(2);
    expect(hamletNpcs.length).toBeLessThanOrEqual(NPC_CONSTANTS.MAX_NPCS_HAMLET);

    // Lair should have no NPCs
    const lairNpcs = graph.getIncomingEdges('loc_lair', 'located_at')
      .map(e => graph.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient');
    expect(lairNpcs.length).toBe(0);
  });

  it('sets spotlightTier to ambient on all seeded NPCs', () => {
    const graph = createTestGraph();
    const rng = mulberry32(42);
    seedNpcsAtLocations(graph, ['loc_hamlet'], rng);

    const npcs = graph.getIncomingEdges('loc_hamlet', 'located_at')
      .map(e => graph.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient');

    for (const npc of npcs) {
      expect(npc!.properties.actorType).toBe('individual');
      expect(npc!.properties.spotlightTier).toBe('ambient');
      expect(npc!.properties.npcRole).toBeDefined();
      expect(npc!.properties.importance).toBe(0);
    }
  });

  it('creates belongs_to culture edges for NPCs', () => {
    const graph = createTestGraph();
    const rng = mulberry32(42);
    seedNpcsAtLocations(graph, ['loc_hamlet'], rng);

    const npcs = graph.getIncomingEdges('loc_hamlet', 'located_at')
      .map(e => graph.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient');

    for (const npc of npcs) {
      const cultureEdges = graph.getOutgoingEdges(npc!.id, 'belongs_to');
      expect(cultureEdges.length).toBe(1);
      expect(cultureEdges[0].target).toBe('culture_1');
    }
  });

  it('respects population caps per settlement tier', () => {
    const graph = createTestGraph();
    const rng = mulberry32(42);
    seedNpcsAtLocations(graph, ['loc_city'], rng);

    const cityNpcs = graph.getIncomingEdges('loc_city', 'located_at')
      .map(e => graph.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient');

    expect(cityNpcs.length).toBeLessThanOrEqual(NPC_CONSTANTS.MAX_NPCS_CITY);
  });

  it('is deterministic — same seed produces same NPCs', () => {
    const graph1 = createTestGraph();
    seedNpcsAtLocations(graph1, ['loc_hamlet'], mulberry32(99));
    const names1 = graph1.getIncomingEdges('loc_hamlet', 'located_at')
      .map(e => graph1.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient')
      .map(n => n!.name)
      .sort();

    const graph2 = createTestGraph();
    seedNpcsAtLocations(graph2, ['loc_hamlet'], mulberry32(99));
    const names2 = graph2.getIncomingEdges('loc_hamlet', 'located_at')
      .map(e => graph2.getNode(e.source))
      .filter(n => n != null && n.properties.spotlightTier === 'ambient')
      .map(n => n!.name)
      .sort();

    expect(names1).toEqual(names2);
  });

  it('returns trace events for all seeded NPCs', () => {
    const graph = createTestGraph();
    const rng = mulberry32(42);
    const result = seedNpcsAtLocations(graph, ['loc_hamlet', 'loc_city'], rng);

    expect(result.traces.length).toBeGreaterThan(0);
    for (const trace of result.traces) {
      expect(trace.type).toBe('npc_seeded');
      expect(trace.tick).toBe(0);
      expect(trace.role).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/npcSeeding.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/engine/npcSeeding.ts

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { SpotlightTier, NpcRole } from '../types/npc';
import {
  LOCATION_ROLE_ROSTERS,
  NPC_NAME_POOL,
  NPC_CONSTANTS,
  type RoleRosterEntry,
} from '../types/npc';
import { hashString } from './prng';

// ─── Types ──────────────────────────────────────────────────────

export interface NpcSeededTrace {
  type: 'npc_seeded';
  actorId: string;
  locationId: string;
  role: string;
  factionId: string | null;
  tick: 0;
}

export interface SeedNpcsResult {
  npcIds: string[];
  traces: NpcSeededTrace[];
}

// ─── Settlement tier → NPC cap ──────────────────────────────────

function getMaxNpcs(locationSubtype: string): number {
  switch (locationSubtype) {
    case 'hamlet': return NPC_CONSTANTS.MAX_NPCS_HAMLET;
    case 'town': return NPC_CONSTANTS.MAX_NPCS_TOWN;
    case 'city': return NPC_CONSTANTS.MAX_NPCS_CITY;
    case 'temple': case 'shrine': return 3;
    case 'military_outpost': return 3;
    case 'wilderness': return 2;
    default: return 0;
  }
}

// ─── Resolve location subtype to roster key ─────────────────────

function getRosterKey(locationSubtype: string): string | null {
  if (locationSubtype === 'hamlet' || locationSubtype === 'town' || locationSubtype === 'city') {
    return locationSubtype;
  }
  if (locationSubtype === 'temple' || locationSubtype === 'shrine') return 'temple';
  if (locationSubtype === 'military_outpost') return 'military_outpost';
  // Wilderness locations — check for non-settlement outdoor types
  if (locationSubtype === 'wilderness' || locationSubtype === 'landmark') return 'wilderness';
  // Lairs, ruins — no NPC roster
  return null;
}

// ─── Get location culture ───────────────────────────────────────

function getLocationCultureId(graph: WorldGraph, locationId: string): string | null {
  const cultureEdges = graph.getOutgoingEdges(locationId, 'belongs_to');
  const currentCulture = cultureEdges.find(
    e => e.properties.cultureLayer === 'current' || !e.properties.cultureLayer,
  );
  return currentCulture?.target ?? cultureEdges[0]?.target ?? null;
}

// ─── Main function ──────────────────────────────────────────────

/**
 * Seed ambient NPC actor nodes at locations during world generation.
 *
 * For each location, looks up the role roster by location subtype,
 * rolls against each role's spawn chance, creates actor nodes with
 * `spotlightTier: 'ambient'`, and assigns edges.
 */
/**
 * Seed ambient NPC actor nodes at locations during world generation.
 *
 * For each location, looks up the role roster by location subtype,
 * rolls against each role's spawn chance, creates actor nodes with
 * `spotlightTier: 'ambient'`, and assigns edges.
 *
 * Also accepts factionLocationMap to wire faction member_of edges for
 * NPCs placed at faction-controlled locations.
 */
export function seedNpcsAtLocations(
  graph: WorldGraph,
  locationIds: readonly string[],
  rng: () => number,
  factionLocationMap?: ReadonlyMap<string, string>,  // locationId → factionId
): SeedNpcsResult {
  const npcIds: string[] = [];
  const traces: NpcSeededTrace[] = [];
  let npcCounter = 0;

  for (let locIdx = 0; locIdx < locationIds.length; locIdx++) {
    const locationId = locationIds[locIdx];
    const locNode = graph.getNode(locationId);
    if (!locNode) continue;

    const locationSubtype = (locNode.properties.locationSubtype as string) ?? '';
    const rosterKey = getRosterKey(locationSubtype);
    if (!rosterKey) continue;

    const roster = LOCATION_ROLE_ROSTERS[rosterKey];
    if (!roster) continue;

    const maxNpcs = getMaxNpcs(locationSubtype);
    const cultureId = getLocationCultureId(graph, locationId);
    let npcCount = 0;

    for (const entry of roster) {
      if (npcCount >= maxNpcs) break;
      if (rng() > entry.chance) continue;

      const npcId = `npc_${npcCounter}`;
      const nameIdx = Math.floor(rng() * NPC_NAME_POOL.length);
      const name = NPC_NAME_POOL[nameIdx];

      // Create the actor node
      graph.addNode({
        id: npcId,
        type: 'actor',
        name,
        properties: {
          actorType: 'individual',
          spotlightTier: 'ambient' as SpotlightTier,
          npcRole: entry.role,
          importance: 0,
          sphereAffinity: null,
        },
      });

      // located_at edge
      graph.addEdge({
        id: `${npcId}_located_at_${locationId}`,
        source: npcId,
        target: locationId,
        type: 'located_at',
        properties: {},
      });

      // belongs_to culture edge
      if (cultureId) {
        graph.addEdge({
          id: `${npcId}_belongs_to_${cultureId}`,
          source: npcId,
          target: cultureId,
          type: 'belongs_to',
          properties: { culturalStrength: 1.0 },
        });
      }

      // member_of faction edge (if location has a faction)
      const factionId = factionLocationMap?.get(locationId) ?? null;
      if (factionId) {
        graph.addEdge({
          id: `${npcId}_member_of_${factionId}`,
          source: npcId,
          target: factionId,
          type: 'member_of',
          properties: { role: entry.role, rank: 0.1, joinedTick: 0 },
        });
      }

      npcIds.push(npcId);
      traces.push({
        type: 'npc_seeded',
        actorId: npcId,
        locationId,
        role: entry.role,
        factionId,
        tick: 0,
      });

      npcCounter++;
      npcCount++;
    }
  }

  return { npcIds, traces };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/npcSeeding.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/npcSeeding.ts src/engine/__tests__/npcSeeding.test.ts
git commit -m "feat(npc): add NPC seeding at world-gen with role rosters"
```

---

## Task 3: Wire NPC Seeding Into World-Gen

**Files:**
- Modify: `src/engine/worldSeed.ts` (~line 1243)

- [ ] **Step 1: Add import at top of worldSeed.ts**

Add after the existing imports (around line 30):

```typescript
import { seedNpcsAtLocations } from './npcSeeding';
```

- [ ] **Step 2: Add spotlightTier to existing agent creation**

In `worldSeed.ts`, around line 1209-1217, the existing actor creation block sets properties for individual actors. Add `spotlightTier: 'spotlight'` to the properties object:

```typescript
// Inside the existing for loop at ~line 1205
graph.addNode({
  id,
  type: 'actor',
  name: INDIVIDUAL_NAMES[nameIdx],
  properties: {
    actorType: 'individual',
    spotlightTier: 'spotlight',  // ← ADD THIS LINE
    axiologicalProfile: profile,
    domainCapabilities: generateDomainCapabilities(rng),
    locationId,
    narrativeArchetype: narrativeArchetypeId,
    cooperationStrategy,
    reputationScore: DEFAULT_REPUTATION,
  },
});
```

- [ ] **Step 3: Call seedNpcsAtLocations after individual seeding**

After the culture assignment block (~line 1247, after `assignCulturesToActors` call), add:

```typescript
// ── NPC seeding at locations ──────────────────────────
const npcResult = seedNpcsAtLocations(graph, locationIds, rng);
```

- [ ] **Step 4: Run existing tests to verify no regressions**

Run: `npx vitest run src/engine/__tests__/worldSeed.test.ts`
Expected: PASS (existing tests should not break)

- [ ] **Step 5: Run the CLI smoke test**

Run: `npm run cli -- --seed 42 --map small`
At prompt: `status` then `agents`
Expected: game initializes without errors, existing agents work normally

- [ ] **Step 6: Commit**

```bash
git add src/engine/worldSeed.ts
git commit -m "feat(npc): wire NPC seeding into world generation"
```

---

## Task 4: Engine Tier Guards

**Files:**
- Modify: `src/engine/phaseAgentDecision.ts` (~line 128-130)
- Modify: `src/engine/phaseMovement.ts` (~line 54-55)
- Modify: `src/engine/socialEncounterGeneration.ts` (~line 244)
- Modify: `src/engine/agentValidation.ts` (~line 109)
- Modify: `src/engine/graphQueries.ts` (~line 18-22)
- Test: `src/engine/__tests__/npcTierGuards.test.ts`

- [ ] **Step 1: Write tests for tier guard behavior**

```typescript
// src/engine/__tests__/npcTierGuards.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentsAtLocation } from '../graphQueries';

function createGraphWithTiers() {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: { locationSubtype: 'town' } });

  // Spotlight agent
  graph.addNode({ id: 'agent_1', type: 'actor', name: 'Kael', properties: {
    actorType: 'individual', spotlightTier: 'spotlight',
  } });
  graph.addEdge({ id: 'e1', source: 'agent_1', target: 'loc_1', type: 'located_at', properties: {} });

  // Ambient NPC
  graph.addNode({ id: 'npc_1', type: 'actor', name: 'Mira', properties: {
    actorType: 'individual', spotlightTier: 'ambient', npcRole: 'innkeeper',
  } });
  graph.addEdge({ id: 'e2', source: 'npc_1', target: 'loc_1', type: 'located_at', properties: {} });

  // Notable NPC
  graph.addNode({ id: 'npc_2', type: 'actor', name: 'Gareth', properties: {
    actorType: 'individual', spotlightTier: 'notable', npcRole: 'guard_captain',
  } });
  graph.addEdge({ id: 'e3', source: 'npc_2', target: 'loc_1', type: 'located_at', properties: {} });

  return graph;
}

describe('tier guards', () => {
  describe('getAgentsAtLocation', () => {
    it('returns all individuals by default (backward compat)', () => {
      const graph = createGraphWithTiers();
      const agents = getAgentsAtLocation(graph, 'loc_1');
      expect(agents.map(a => a.id).sort()).toEqual(['agent_1', 'npc_1', 'npc_2']);
    });

    it('filters by spotlightTier when specified', () => {
      const graph = createGraphWithTiers();
      const spotlightOnly = getAgentsAtLocation(graph, 'loc_1', 'spotlight');
      expect(spotlightOnly.map(a => a.id)).toEqual(['agent_1']);
    });

    it('returns ambient and notable NPCs when filtering for non-spotlight', () => {
      const graph = createGraphWithTiers();
      const npcsOnly = getAgentsAtLocation(graph, 'loc_1', 'ambient');
      expect(npcsOnly.map(a => a.id)).toEqual(['npc_1']);
    });
  });

  describe('legacy nodes without spotlightTier', () => {
    it('treats missing spotlightTier as spotlight', () => {
      const graph = new WorldGraph();
      graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
      graph.addNode({ id: 'legacy_agent', type: 'actor', name: 'Old Agent', properties: {
        actorType: 'individual',
        // no spotlightTier property
      } });
      graph.addEdge({ id: 'e1', source: 'legacy_agent', target: 'loc_1', type: 'located_at', properties: {} });

      const spotlight = getAgentsAtLocation(graph, 'loc_1', 'spotlight');
      expect(spotlight.map(a => a.id)).toEqual(['legacy_agent']);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/npcTierGuards.test.ts`
Expected: FAIL — `getAgentsAtLocation` doesn't accept a tier param yet

- [ ] **Step 3: Update graphQueries.ts**

In `src/engine/graphQueries.ts`, modify `getAgentsAtLocation` (~line 18-22):

```typescript
/** Get individual agents at a location, optionally filtered by spotlight tier.
 *  Missing spotlightTier defaults to 'spotlight' (backward compat for legacy nodes). */
export function getAgentsAtLocation(
  graph: WorldGraph,
  locationId: string,
  spotlightTier?: SpotlightTier,
): GraphNode[] {
  return graph.getIncomingEdges(locationId, 'located_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => {
      if (!n || n.properties.actorType !== 'individual') return false;
      if (spotlightTier === undefined) return true;
      const tier = (n.properties.spotlightTier as string) ?? 'spotlight';
      return tier === spotlightTier;
    });
}
```

Add the import at the top of `graphQueries.ts`:

```typescript
import type { SpotlightTier } from '../types/npc';
```

- [ ] **Step 4: Update phaseAgentDecision.ts**

At `src/engine/phaseAgentDecision.ts` ~line 128-130, change:

```typescript
// BEFORE:
const actors = graph.getNodesByType('actor').filter(
  (n) => n.properties.actorType === 'individual' && !avatarNodeIds.has(n.id),
);

// AFTER:
const actors = graph.getNodesByType('actor').filter(
  (n) => n.properties.actorType === 'individual'
    && (n.properties.spotlightTier ?? 'spotlight') === 'spotlight'
    && !avatarNodeIds.has(n.id),
);
```

- [ ] **Step 5: Update phaseMovement.ts**

At `src/engine/phaseMovement.ts` ~line 54-55, change:

```typescript
// BEFORE:
const agents = state.graph.getNodesByType('actor')
  .filter(actor => actor.properties?.actorType === 'individual');

// AFTER:
const agents = state.graph.getNodesByType('actor')
  .filter(actor => actor.properties?.actorType === 'individual'
    && (actor.properties.spotlightTier ?? 'spotlight') === 'spotlight');
```

- [ ] **Step 6: Update socialEncounterGeneration.ts**

At `src/engine/socialEncounterGeneration.ts` ~line 243-244, change:

```typescript
// BEFORE:
if (agentNode.type !== 'actor') continue;
if (edge.source === sourceAgentId) continue;

// AFTER:
if (agentNode.type !== 'actor') continue;
if ((agentNode.properties.spotlightTier ?? 'spotlight') !== 'spotlight') continue;
if (edge.source === sourceAgentId) continue;
```

- [ ] **Step 7: Update agentValidation.ts**

At `src/engine/agentValidation.ts` ~line 109, after the `isIndividual` check, add early return for non-spotlight:

```typescript
const isIndividual = actorType === 'individual';
// Skip full validation for ambient/notable NPCs — they have sparse property bags
const spotlightTier = (node.properties.spotlightTier as string) ?? 'spotlight';
if (isIndividual && spotlightTier !== 'spotlight') return [];
```

- [ ] **Step 8: Run tier guard tests**

Run: `npx vitest run src/engine/__tests__/npcTierGuards.test.ts`
Expected: PASS

- [ ] **Step 9: Run full test suite to check for regressions**

Run: `npm test`
Expected: All existing tests pass

- [ ] **Step 10: Commit**

```bash
git add src/engine/phaseAgentDecision.ts src/engine/phaseMovement.ts src/engine/socialEncounterGeneration.ts src/engine/agentValidation.ts src/engine/graphQueries.ts src/engine/__tests__/npcTierGuards.test.ts
git commit -m "feat(npc): add spotlightTier guards to engine phases"
```

---

## Task 5: Graduation Mechanics

**Files:**
- Create: `src/engine/npcGraduation.ts`
- Test: `src/engine/__tests__/npcGraduation.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/engine/__tests__/npcGraduation.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { hydrateToTier, bumpImportance, phaseNpcGraduation } from '../npcGraduation';
import { NPC_CONSTANTS } from '../../types/npc';
import { mulberry32 } from '../prng';
import type { GameState } from '../../types/gameState';

function createNpcGraph() {
  const graph = new WorldGraph();
  graph.addNode({ id: 'culture_1', type: 'actor', name: 'Aurelian', properties: { actorType: 'culture' } });
  graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });

  // Ambient NPC with traits
  graph.addNode({ id: 'npc_1', type: 'actor', name: 'Mira', properties: {
    actorType: 'individual',
    spotlightTier: 'ambient',
    npcRole: 'innkeeper',
    importance: 0,
    sphereAffinity: 'mind',
  } });
  graph.addEdge({ id: 'e1', source: 'npc_1', target: 'loc_1', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e2', source: 'npc_1', target: 'culture_1', type: 'belongs_to', properties: {} });

  // Add a trait
  graph.addNode({ id: 'trait_shrewd', type: 'trait', name: 'Shrewd', properties: { category: 'innate' } });
  graph.addEdge({ id: 'e3', source: 'npc_1', target: 'trait_shrewd', type: 'has_trait', properties: { level: 1 } });

  return graph;
}

describe('bumpImportance', () => {
  it('increments importance on the NPC node', () => {
    const graph = createNpcGraph();
    bumpImportance(graph, 'npc_1', 'player_action');
    const node = graph.getNode('npc_1')!;
    expect(node.properties.importance).toBe(NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION);
  });

  it('accumulates across multiple bumps', () => {
    const graph = createNpcGraph();
    bumpImportance(graph, 'npc_1', 'player_action');
    bumpImportance(graph, 'npc_1', 'encounter_reference');
    const node = graph.getNode('npc_1')!;
    expect(node.properties.importance).toBe(
      NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION + NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE,
    );
  });

  it('does nothing for spotlight agents', () => {
    const graph = createNpcGraph();
    graph.addNode({ id: 'agent_1', type: 'actor', name: 'Kael', properties: {
      actorType: 'individual', spotlightTier: 'spotlight', importance: 0,
    } });
    bumpImportance(graph, 'agent_1', 'player_action');
    expect(graph.getNode('agent_1')!.properties.importance).toBe(0);
  });
});

describe('hydrateToTier', () => {
  it('hydrates ambient to notable — adds axiological profile', () => {
    const graph = createNpcGraph();
    const rng = mulberry32(42);
    hydrateToTier(graph, 'npc_1', 'notable', rng);
    const node = graph.getNode('npc_1')!;
    expect(node.properties.spotlightTier).toBe('notable');
    expect(node.properties.axiologicalProfile).toBeDefined();
    expect(node.properties.wealth).toBeDefined();
  });

  it('hydrates ambient to spotlight — adds full agent properties', () => {
    const graph = createNpcGraph();
    const rng = mulberry32(42);
    hydrateToTier(graph, 'npc_1', 'spotlight', rng);
    const node = graph.getNode('npc_1')!;
    expect(node.properties.spotlightTier).toBe('spotlight');
    expect(node.properties.axiologicalProfile).toBeDefined();
    expect(node.properties.domainCapabilities).toBeDefined();
  });

  it('is deterministic — same seed produces same profile', () => {
    const graph1 = createNpcGraph();
    hydrateToTier(graph1, 'npc_1', 'notable', mulberry32(99));
    const profile1 = graph1.getNode('npc_1')!.properties.axiologicalProfile;

    const graph2 = createNpcGraph();
    hydrateToTier(graph2, 'npc_1', 'notable', mulberry32(99));
    const profile2 = graph2.getNode('npc_1')!.properties.axiologicalProfile;

    expect(profile1).toEqual(profile2);
  });
});

describe('phaseNpcGraduation', () => {
  it('promotes ambient NPC to notable when importance crosses threshold', () => {
    const graph = createNpcGraph();
    const node = graph.getNode('npc_1')!;
    node.properties.importance = NPC_CONSTANTS.NOTABLE_THRESHOLD;

    const events = phaseNpcGraduation({ graph, tick: 10, seed: 42 } as unknown as GameState);

    expect(graph.getNode('npc_1')!.properties.spotlightTier).toBe('notable');
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('npc_graduated');
  });

  it('does not promote when importance is below threshold', () => {
    const graph = createNpcGraph();
    const node = graph.getNode('npc_1')!;
    node.properties.importance = NPC_CONSTANTS.NOTABLE_THRESHOLD - 1;

    const events = phaseNpcGraduation({ graph, tick: 10, seed: 42 } as unknown as GameState);

    expect(graph.getNode('npc_1')!.properties.spotlightTier).toBe('ambient');
    expect(events.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/npcGraduation.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/engine/npcGraduation.ts

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import type { SpotlightTier } from '../types/npc';
import { NPC_CONSTANTS } from '../types/npc';
import { VALUE_PAIRS, type AxiologicalProfile } from '../types/agent';
import { mulberry32, hashString } from './prng';

// ─── Local generation helpers ───────────────────────────────────
// These mirror worldSeed.ts internals but are simpler (no cosmology bias).
// NPC profiles are seeded from traits + role, not cosmology.

function generateSimpleAxiologicalProfile(rng: () => number): AxiologicalProfile {
  const profile: Partial<AxiologicalProfile> = {};
  for (const pair of VALUE_PAIRS) {
    profile[pair] = (rng() * 2) - 1; // -1 to 1
  }
  return profile as AxiologicalProfile;
}

function generateSimpleDomainCapabilities(rng: () => number): Record<string, number> {
  const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
  const caps: Record<string, number> = {};
  for (const r of reaches) {
    caps[r] = Math.floor(rng() * 40) + 10; // 10-50 range
  }
  return caps;
}

// ─── Trace type ─────────────────────────────────────────────────

export interface NpcGraduatedEvent {
  type: 'npc_graduated';
  actorId: string;
  fromTier: SpotlightTier;
  toTier: SpotlightTier;
  trigger: 'threshold' | 'player_action' | 'story_event';
  reason: string;
  importance: number;
  tick: number;
}

// ─── Importance source → increment mapping ──────────────────────

const IMPORTANCE_MAP: Record<string, number> = {
  player_action: NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION,
  encounter_reference: NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE,
  edge_created: NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED,
  trait_gained: NPC_CONSTANTS.IMPORTANCE_TRAIT_GAINED,
  location_contested: NPC_CONSTANTS.IMPORTANCE_LOCATION_CONTESTED,
};

// ─── Bump importance ────────────────────────────────────────────

/**
 * Increment an NPC's importance score. No-op for spotlight agents.
 */
export function bumpImportance(
  graph: WorldGraph,
  actorId: string,
  source: keyof typeof IMPORTANCE_MAP,
): void {
  const node = graph.getNode(actorId);
  if (!node) return;
  const tier = (node.properties.spotlightTier as string) ?? 'spotlight';
  if (tier === 'spotlight') return;

  const delta = IMPORTANCE_MAP[source] ?? 0;
  const current = (node.properties.importance as number) ?? 0;
  node.properties.importance = current + delta;
}

// ─── Hydrate to tier ────────────────────────────────────────────

/**
 * Promote an NPC to a higher spotlight tier, generating missing properties
 * deterministically from traits + culture + role.
 */
export function hydrateToTier(
  graph: WorldGraph,
  actorId: string,
  targetTier: SpotlightTier,
  rng: () => number,
): void {
  const node = graph.getNode(actorId);
  if (!node) return;

  const currentTier = (node.properties.spotlightTier as SpotlightTier) ?? 'ambient';
  const tierOrder: SpotlightTier[] = ['ambient', 'notable', 'spotlight'];
  if (tierOrder.indexOf(targetTier) <= tierOrder.indexOf(currentTier)) return;

  // Notable properties
  if (targetTier === 'notable' || targetTier === 'spotlight') {
    if (!node.properties.axiologicalProfile) {
      node.properties.axiologicalProfile = generateSimpleAxiologicalProfile(rng);
    }
    if (node.properties.wealth === undefined) {
      // Role-based wealth seeding
      const role = (node.properties.npcRole as string) ?? '';
      const wealthByRole: Record<string, number> = {
        merchant: 60, trader: 55, noble: 70, innkeeper: 40, smith: 45,
        guard: 25, guard_captain: 35, healer: 30, priest: 20,
      };
      node.properties.wealth = wealthByRole[role] ?? 20;
    }
    if (!node.properties.reputationScore) {
      node.properties.reputationScore = 0;
    }
  }

  // Spotlight properties
  if (targetTier === 'spotlight') {
    if (!node.properties.domainCapabilities) {
      node.properties.domainCapabilities = generateSimpleDomainCapabilities(rng);
    }
    if (!node.properties.cooperationStrategy) {
      node.properties.cooperationStrategy = 'tit_for_tat';
    }
  }

  node.properties.spotlightTier = targetTier;
}

// ─── Phase 2.37: NPC Graduation ─────────────────────────────────

/**
 * Scan all non-spotlight actors for graduation criteria.
 * Returns tick events for any promotions.
 */
export function phaseNpcGraduation(state: GameState): NpcGraduatedEvent[] {
  const { graph, tick, seed } = state;
  const events: NpcGraduatedEvent[] = [];

  const actors = graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
      && n.properties.spotlightTier !== 'spotlight'
      && n.properties.spotlightTier !== undefined,
  );

  for (const actor of actors) {
    const currentTier = actor.properties.spotlightTier as SpotlightTier;
    const importance = (actor.properties.importance as number) ?? 0;

    let targetTier: SpotlightTier | null = null;
    let reason = '';

    if (currentTier === 'ambient' && importance >= NPC_CONSTANTS.NOTABLE_THRESHOLD) {
      targetTier = 'notable';
      reason = `importance ${importance} >= NOTABLE_THRESHOLD ${NPC_CONSTANTS.NOTABLE_THRESHOLD}`;
    } else if (currentTier === 'notable' && importance >= NPC_CONSTANTS.SPOTLIGHT_THRESHOLD) {
      // Check additional requirements for spotlight
      const relatesEdges = graph.getOutgoingEdges(actor.id, 'relates_to');
      const incomingRelates = graph.getIncomingEdges(actor.id, 'relates_to');
      const totalRelations = relatesEdges.length + incomingRelates.length;

      if (totalRelations >= NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES) {
        targetTier = 'spotlight';
        reason = `importance ${importance} >= SPOTLIGHT_THRESHOLD ${NPC_CONSTANTS.SPOTLIGHT_THRESHOLD}, relations ${totalRelations}`;
      }
    }

    if (targetTier) {
      const rng = mulberry32(seed + hashString(actor.id) * 71);
      hydrateToTier(graph, actor.id, targetTier, rng);

      events.push({
        type: 'npc_graduated',
        actorId: actor.id,
        fromTier: currentTier,
        toTier: targetTier,
        trigger: 'threshold',
        reason,
        importance,
        tick,
      });
    }
  }

  return events;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/npcGraduation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/npcGraduation.ts src/engine/__tests__/npcGraduation.test.ts
git commit -m "feat(npc): add graduation mechanics and importance tracking"
```

---

## Task 6: Wire Graduation Phase Into Orchestrator

**Files:**
- Modify: `src/engine/orchestrator.ts`

- [ ] **Step 1: Add import**

At the top of `orchestrator.ts`, add:

```typescript
import { phaseNpcGraduation } from './npcGraduation';
```

- [ ] **Step 2: Add Phase 2.37 call**

In `runTick()`, find the movement phase call (`phaseMovement` ~line 1251) and the dilemma detection call (`phaseDilemmaDetection` ~line 1314). Between them (after colocation detection at ~line 1274), add:

```typescript
// ── Phase 2.37: NPC Graduation ──
const npcGradEvents = phaseNpcGraduation(s);
if (npcGradEvents.length > 0) {
  s = { ...s, tickEvents: [...s.tickEvents, ...npcGradEvents] };
}
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Run CLI smoke test with NPCs**

Run: `npm run cli -- --seed 42 --map small`
At prompt: `tick 20` then `status`
Expected: game runs 20 ticks without errors

- [ ] **Step 5: Commit**

```bash
git add src/engine/orchestrator.ts
git commit -m "feat(npc): wire Phase 2.37 NPC Graduation into orchestrator"
```

---

## Task 7: NPC Action Templates

**Files:**
- Create: `src/data/npc-action-templates.ts`
- Test: `src/data/__tests__/npc-action-templates.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// src/data/__tests__/npc-action-templates.test.ts
import { describe, it, expect } from 'vitest';
import { NPC_ACTION_TEMPLATES } from '../npc-action-templates';

describe('NPC action templates', () => {
  it('has at least 15 templates', () => {
    expect(NPC_ACTION_TEMPLATES.length).toBeGreaterThanOrEqual(15);
  });

  it('all templates have unique IDs', () => {
    const ids = NPC_ACTION_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates target actor category', () => {
    for (const t of NPC_ACTION_TEMPLATES) {
      expect(t.targetCategories).toContain('actor');
    }
  });

  it('all templates require spotlightTier !== spotlight via requiredNodeProperties', () => {
    for (const t of NPC_ACTION_TEMPLATES) {
      // NPC templates must NOT have targetSubtypes that would match spotlight agents
      // They use requiredNodeProperties to gate on npcRole or spotlightTier
      expect(t.requiredNodeProperties).toBeDefined();
      const props = t.requiredNodeProperties as Record<string, unknown>;
      // Either gates on npcRole (which only NPCs have) or spotlightTier directly
      const gatesOnNpc = props.npcRole !== undefined || props.spotlightTier !== undefined;
      expect(gatesOnNpc).toBe(true);
    }
  });

  it('role-gated templates specify their role', () => {
    const tradeGoods = NPC_ACTION_TEMPLATES.find(t => t.id === 'npc_trade_goods');
    expect(tradeGoods).toBeDefined();
    expect(tradeGoods!.requiredNodeProperties?.npcRole).toBeDefined();
  });

  it('all templates have narrative templates', () => {
    for (const t of NPC_ACTION_TEMPLATES) {
      expect(t.narrativeTemplates.initiation).toBeTruthy();
      expect(t.narrativeTemplates.success).toBeTruthy();
      expect(t.narrativeTemplates.failure).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/npc-action-templates.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the templates**

Create `src/data/npc-action-templates.ts` with the NPC-specific action templates. Each template uses `requiredNodeProperties` to gate on `npcRole` presence (which only ambient/notable NPCs have), so they naturally exclude spotlight agents.

```typescript
// src/data/npc-action-templates.ts

import type { UnifiedActionTemplate } from '../types/unifiedAction';

/**
 * NPC-specific action templates (~20-25).
 * These target ambient/notable NPCs via requiredNodeProperties gating on npcRole.
 * Spotlight agents don't have npcRole, so these never show for them.
 */
export const NPC_ACTION_TEMPLATES: readonly UnifiedActionTemplate[] = [
  // ── Information (Eye) ──
  {
    id: 'npc_ask_information',
    name: 'Ask for Information',
    reach: 'eye',
    crudType: 'read',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.3 }],
    apCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },  // matches any truthy npcRole
    narrativeTemplates: {
      initiation: 'You approach {target} and ask what they know.',
      success: '{target} shares what they have heard.',
      failure: '{target} has nothing useful to say, or chooses not to share.',
    },
  },
  {
    id: 'npc_eavesdrop',
    name: 'Eavesdrop',
    reach: 'eye',
    crudType: 'read',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.25 }],
    apCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You listen carefully to {target} without drawing attention.',
      success: 'You overhear something useful from {target}.',
      failure: '{target} notices your attention and falls silent.',
    },
  },
  {
    id: 'npc_read_intentions',
    name: 'Read Intentions',
    reach: 'eye',
    crudType: 'read',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.35 }],
    apCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You study {target}, reading their posture and manner.',
      success: 'You gain insight into {target}\'s loyalties and motivations.',
      failure: '{target} is inscrutable. You learn nothing of value.',
    },
  },
  // ── Social (Heart/Shadow) ──
  {
    id: 'npc_befriend',
    name: 'Befriend',
    reach: 'heart',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.3 }],
    apCost: 2,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You seek to build a connection with {target}.',
      success: '{target} warms to you. A bond begins to form.',
      failure: '{target} remains distant. Perhaps another approach.',
    },
  },
  {
    id: 'npc_intimidate',
    name: 'Intimidate',
    reach: 'iron',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.35 }],
    apCost: 2,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You make your power known to {target}.',
      success: '{target} yields to your authority, cowed into compliance.',
      failure: '{target} stands firm, unimpressed by your display.',
    },
  },
  {
    id: 'npc_bribe',
    name: 'Bribe',
    reach: 'gold',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.2 }],
    apCost: 2,
    essenceCost: 2,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You offer {target} something of value in exchange for their cooperation.',
      success: '{target} accepts your offer and agrees to your terms.',
      failure: '{target} refuses your offer — or worse, takes offense.',
    },
  },
  {
    id: 'npc_recruit',
    name: 'Recruit',
    reach: 'heart',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.4 }],
    apCost: 3,
    essenceCost: 3,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You extend an offer of service to {target}.',
      success: '{target} pledges their service to your cause.',
      failure: '{target} declines. They have their own path.',
    },
  },
  {
    id: 'npc_charm',
    name: 'Charm',
    reach: 'heart',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.3 }],
    apCost: 2,
    essenceCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You turn your divine presence toward {target}, radiating warmth.',
      success: '{target} is captivated. Your influence takes hold.',
      failure: '{target} resists your charm. Something in them is unyielding.',
    },
  },
  // ── Utility (role-gated) ──
  {
    id: 'npc_trade_goods',
    name: 'Trade Goods',
    reach: 'gold',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.15 }],
    apCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: 'merchant' },
    narrativeTemplates: {
      initiation: 'You browse {target}\'s wares, looking for something useful.',
      success: 'A fair exchange is made. Both parties profit.',
      failure: '{target} has nothing you need, or the price is too steep.',
    },
  },
  {
    id: 'npc_commission_craft',
    name: 'Commission Craft',
    reach: 'gold',
    crudType: 'create',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.25 }],
    apCost: 2,
    essenceCost: 3,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: 'smith' },
    narrativeTemplates: {
      initiation: 'You commission {target} to forge something special.',
      success: '{target} agrees to the work. The forge burns bright.',
      failure: '{target} lacks the materials or the skill for what you ask.',
    },
  },
  {
    id: 'npc_seek_healing',
    name: 'Seek Healing',
    reach: 'flesh',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.2 }],
    apCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: 'healer' },
    narrativeTemplates: {
      initiation: 'You seek {target}\'s healing arts.',
      success: '{target} mends what was broken. You leave restored.',
      failure: '{target} does what they can, but some wounds resist mortal skill.',
    },
  },
  {
    id: 'npc_request_shelter',
    name: 'Request Shelter',
    reach: 'heart',
    crudType: 'read',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.1 }],
    apCost: 1,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: 'innkeeper' },
    narrativeTemplates: {
      initiation: 'You ask {target} for a room and a warm meal.',
      success: '{target} welcomes you. Rest comes easy tonight.',
      failure: 'The inn is full, or {target} doesn\'t like the look of you.',
    },
  },
  {
    id: 'npc_hire_guide',
    name: 'Hire as Guide',
    reach: 'eye',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.25 }],
    apCost: 2,
    essenceCost: 2,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: 'ranger' },
    narrativeTemplates: {
      initiation: 'You ask {target} to guide you through the wilds.',
      success: '{target} agrees. The path ahead becomes clearer.',
      failure: '{target} refuses. The wilderness keeps its secrets.',
    },
  },
  // ── Divine (Ascendant) ──
  {
    id: 'npc_bless',
    name: 'Bless',
    reach: 'star',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.15 }],
    apCost: 2,
    essenceCost: 3,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You reach out with divine favor toward {target}.',
      success: '{target} is touched by your blessing. Something in them shines brighter.',
      failure: 'Your blessing finds no purchase. The mortal is unreceptive.',
    },
  },
  {
    id: 'npc_curse',
    name: 'Curse',
    reach: 'star',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.2 }],
    apCost: 2,
    essenceCost: 4,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You weave a thread of divine affliction toward {target}.',
      success: '{target} is marked. The curse takes root.',
      failure: 'Something shields {target} from your wrath.',
    },
  },
  {
    id: 'npc_promote_to_agent',
    name: 'Promote to Agent',
    reach: 'star',
    crudType: 'update',
    scale: 'individual',
    steps: [{ type: 'resolution', difficulty: 0.1 }],
    apCost: 3,
    essenceCost: 8,
    targetCategories: ['actor'],
    requiredNodeProperties: { npcRole: undefined },
    narrativeTemplates: {
      initiation: 'You see something in {target} — a spark worthy of your attention.',
      success: '{target} awakens to a larger purpose. They are no longer mere backdrop.',
      failure: 'The spark flickers and fades. {target} is not ready.',
    },
  },
] as const;
```

**Note to implementer:** The `requiredNodeProperties: { npcRole: undefined }` pattern requires a small adjustment to the node-property gate in `targetActions.ts`. Currently the gate checks `target.properties[key] === val`. For NPC templates, we need "key exists and is truthy" when val is `undefined`. The implementer should update the gate logic OR use a different filtering approach (e.g., a custom `isNpc` check). The simplest fix: in `targetActions.ts` ~line 155-159, change the property match to:

```typescript
const allMatch = entries.every(([key, val]) =>
  val === undefined ? target.properties[key] != null : target.properties[key] === val,
);
```

This means `{ npcRole: undefined }` matches "has any npcRole property," while `{ npcRole: 'merchant' }` matches "npcRole is exactly 'merchant'."

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/npc-action-templates.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/npc-action-templates.ts src/data/__tests__/npc-action-templates.test.ts
git commit -m "feat(npc): add NPC action template pool"
```

---

## Task 8: Register NPC Templates in Game Init

**Files:**
- Modify: `src/engine/gameInit.ts` (~line 131-140)
- Modify: `src/data/unified-action-templates.ts` (or wherever the master template array is exported)

- [ ] **Step 1: Find where templates are registered**

The master template array is likely in `src/data/unified-action-templates.ts` or `src/data/action-template-content.ts`. NPC templates should be appended to the same array so the existing `getTargetActionSlots` call picks them up automatically.

- [ ] **Step 2: Import and spread NPC templates into the master array**

In the file that exports `ACTION_TEMPLATES` or `UNIFIED_ACTION_TEMPLATES`, add:

```typescript
import { NPC_ACTION_TEMPLATES } from './npc-action-templates';

// At the bottom, where the master array is assembled:
export const ALL_ACTION_TEMPLATES = [
  ...EXISTING_TEMPLATES,
  ...NPC_ACTION_TEMPLATES,
] as const;
```

If the existing architecture registers templates via `gameInit.ts` loop, add NPC templates to the same loop.

- [ ] **Step 3: Update targetActions.ts property gate**

In `src/engine/targetActions.ts` ~line 155-159, update the property match logic:

```typescript
// BEFORE:
const allMatch = entries.every(([key, val]) => target.properties[key] === val);

// AFTER:
const allMatch = entries.every(([key, val]) =>
  val === undefined ? target.properties[key] != null : target.properties[key] === val,
);
```

- [ ] **Step 4: Run existing targeting tests**

Run: `npx vitest run src/engine/__tests__/targetActions.test.ts`
Expected: PASS (existing tests unaffected)

- [ ] **Step 5: Commit**

```bash
git add src/data/unified-action-templates.ts src/engine/targetActions.ts src/engine/gameInit.ts
git commit -m "feat(npc): register NPC templates in action system"
```

---

## Task 9: NPC Detail View Component

**Files:**
- Create: `src/components/Game/NpcDetailView.tsx`
- Test: `src/components/Game/__tests__/NpcDetailView.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
// src/components/Game/__tests__/NpcDetailView.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NpcDetailView } from '../NpcDetailView';
import type { GraphNode } from '../../../types/graph';

const mockNpc: GraphNode = {
  id: 'npc_1',
  type: 'actor',
  name: 'Mira',
  properties: {
    actorType: 'individual',
    spotlightTier: 'ambient',
    npcRole: 'innkeeper',
    importance: 5,
    sphereAffinity: 'mind',
  },
};

describe('NpcDetailView', () => {
  it('renders NPC name and role', () => {
    render(<NpcDetailView npc={mockNpc} traits={[]} factionName={null} />);
    expect(screen.getByText('Mira')).toBeTruthy();
    expect(screen.getByText(/innkeeper/i)).toBeTruthy();
  });

  it('shows spotlight tier indicator', () => {
    render(<NpcDetailView npc={mockNpc} traits={[]} factionName={null} />);
    expect(screen.getByText(/ambient/i)).toBeTruthy();
  });

  it('shows faction affiliation when present', () => {
    render(<NpcDetailView npc={mockNpc} traits={[]} factionName="Merchant Guild" />);
    expect(screen.getByText(/Merchant Guild/)).toBeTruthy();
  });

  it('shows traits when present', () => {
    render(<NpcDetailView npc={mockNpc} traits={['Shrewd', 'Well-connected']} factionName={null} />);
    expect(screen.getByText('Shrewd')).toBeTruthy();
    expect(screen.getByText('Well-connected')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/NpcDetailView.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write the component**

```tsx
// src/components/Game/NpcDetailView.tsx
import { memo } from 'react';
import type { GraphNode } from '../../types/graph';
import type { SpotlightTier } from '../../types/npc';

interface NpcDetailViewProps {
  npc: GraphNode;
  traits: string[];
  factionName: string | null;
}

const TIER_LABELS: Record<SpotlightTier, string> = {
  ambient: 'Ambient',
  notable: 'Notable',
  spotlight: 'Agent',
};

const TIER_COLORS: Record<SpotlightTier, string> = {
  ambient: 'text-zinc-500',
  notable: 'text-amber-400',
  spotlight: 'text-emerald-400',
};

export const NpcDetailView = memo(function NpcDetailView({ npc, traits, factionName }: NpcDetailViewProps) {
  const tier = (npc.properties.spotlightTier as SpotlightTier) ?? 'ambient';
  const role = (npc.properties.npcRole as string) ?? 'unknown';
  const sphereAffinity = npc.properties.sphereAffinity as string | null;

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-100">{npc.name}</h3>
        <span className={`text-xs uppercase tracking-wider ${TIER_COLORS[tier]}`}>
          {TIER_LABELS[tier]}
        </span>
      </div>

      {/* Role */}
      <div className="text-sm text-zinc-400">
        {role.replace(/_/g, ' ')}
      </div>

      {/* Sphere affinity */}
      {sphereAffinity && (
        <div className="text-xs text-zinc-500">
          Sphere: <span className="text-zinc-300">{sphereAffinity}</span>
        </div>
      )}

      {/* Faction */}
      {factionName && (
        <div className="text-xs text-zinc-500">
          Faction: <span className="text-zinc-300">{factionName}</span>
        </div>
      )}

      {/* Traits */}
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {traits.map(trait => (
            <span
              key={trait}
              className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/NpcDetailView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/NpcDetailView.tsx src/components/Game/__tests__/NpcDetailView.test.tsx
git commit -m "feat(npc): add NpcDetailView component"
```

---

## Task 10: NPC Roster in Location Detail & Click-to-Target

**Files:**
- Modify: `src/components/Game/LocationView.tsx`
- Modify: `src/components/Game/LocationProfileModal.tsx` (or `GameView.tsx` — wherever target selection is handled)

This task wires the NPC roster into the location detail view and makes NPC names clickable to set them as the active target. The exact wiring depends on how the existing target selection state flows — likely through a `setTarget` callback or a `useAgentInteraction` hook.

- [ ] **Step 1: Add NPC roster section to LocationView**

In `src/components/Game/LocationView.tsx`, add a section after the existing agents list that displays NPCs at this location. The component already receives `agents: GraphNode[]` — filter for spotlight vs non-spotlight:

```tsx
// Inside LocationView component, after the agents section:

const npcsAtLocation = useMemo(() =>
  agents.filter(a => a.properties.spotlightTier === 'ambient' || a.properties.spotlightTier === 'notable'),
  [agents],
);

const spotlightAgents = useMemo(() =>
  agents.filter(a => (a.properties.spotlightTier ?? 'spotlight') === 'spotlight'),
  [agents],
);
```

Then render the NPC roster:

```tsx
{npcsAtLocation.length > 0 && (
  <div className="mt-3">
    <SectionHeading>Inhabitants</SectionHeading>
    <div className="flex flex-col gap-1">
      {npcsAtLocation.map(npc => (
        <button
          key={npc.id}
          onClick={() => onAgentClick(npc.id)}
          className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-800/50 text-left w-full"
        >
          <span className="text-sm text-zinc-300">{npc.name}</span>
          <span className="text-xs text-zinc-500">
            {(npc.properties.npcRole as string)?.replace(/_/g, ' ')}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Update the parent component to handle NPC target selection**

When `onAgentClick` is called with an NPC id, the parent needs to:
1. Construct a `TargetContext` from the NPC node
2. Set it as the active target
3. Show `NpcDetailView` in the detail panel instead of the full agent profile

The exact implementation depends on how the existing `useAgentInteraction` hook and `GameView.tsx` handle target switching. The implementer should:
- Check if the clicked actor has `npcRole` property
- If yes, build a `TargetContext` with `subtype: 'individual'` and include `npcRole` in properties
- Render `NpcDetailView` instead of `AgentDetailPanel`

- [ ] **Step 3: Verify the LocationView update passes rendering**

Run: `npx vitest run src/components/Game/__tests__/LocationView.test.tsx` (if it exists)
Expected: PASS or no existing test

- [ ] **Step 4: Type check and build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Both pass

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/LocationView.tsx src/components/Game/LocationProfileModal.tsx
git commit -m "feat(npc): add NPC roster to location detail with click-to-target"
```

---

## Task 11: Integration Smoke Test & Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: CLI integration test**

Run: `npm run cli -- --seed 42 --map medium`
At prompt:
- `status` — verify game initializes
- `tick 30` — run 30 ticks
- `agents` — verify spotlight agents behave normally
- `eval state.graph.getNodesByType('actor').filter(n => n.properties.spotlightTier === 'ambient').length` — verify NPCs were seeded (should be > 0)
- `eval state.graph.getNodesByType('actor').filter(n => n.properties.npcRole).map(n => n.name + ' (' + n.properties.npcRole + ')').slice(0, 10)` — show first 10 NPCs

Expected: NPCs exist in the graph, game runs without errors

- [ ] **Step 5: Commit any fixes**

If any issues found, fix and commit individually.

- [ ] **Step 6: Final commit and push**

```bash
git push
```
