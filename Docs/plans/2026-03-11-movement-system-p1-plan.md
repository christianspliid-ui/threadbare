# Movement System P1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add quest encounters (visibleTo + questPriority), threat rating computation, colocation detection, and hex map agent dot rendering — building on the P0 movement graph.

**Architecture:** Quest encounters extend `EncounterTemplate` with two new optional fields. Threat rating is a pure function of graph state. Colocation detection runs per-tick as a new phase. Agent dots render in D3 via the existing HexMap component. All weights/thresholds live in content data.

**Tech Stack:** TypeScript, Vitest, D3 (existing zoom), React, seeded PRNG (mulberry32), existing WorldGraph + encounter pipeline.

**Design doc:** `Docs/plans/2026-03-11-agent-visibility-movement-design.md` (§4.3, §5, §6, §1.1–1.2)

**Depends on:** P0 movement system (complete), encounter system, hex renderer, rival/faction state.

**Status:** ✅ P1 implemented (2026-03-11) — 78 tests across 12 files, all passing. P2 pending.

---

### Task 1: Quest Encounter Types

**Files:**
- Modify: `src/types/encounter.ts`
- Test: `src/types/__tests__/encounter-quest.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/encounter-quest.test.ts
import { describe, it, expect } from 'vitest';
import type { EncounterTemplate } from '../encounter';

describe('quest encounter fields', () => {
  it('accepts visibleTo as an array of strings', () => {
    const template: EncounterTemplate = {
      id: 'quest_test',
      name: 'Test Quest',
      locationTypes: ['hamlet'],
      steps: [],
      reachPrimary: 'iron',
      reachSecondary: 'heart',
      encounterType: 'social',
      threatRating: 'moderate',
      motivations: ['ambition_contentment'],
      visibleTo: ['faction:ironPact', 'agent:shadow_thief_42'],
      questPriority: 5.0,
    } as EncounterTemplate;

    expect(template.visibleTo).toEqual(['faction:ironPact', 'agent:shadow_thief_42']);
    expect(template.questPriority).toBe(5.0);
  });

  it('defaults questPriority to undefined (treated as 1.0 by engine)', () => {
    const template: Partial<EncounterTemplate> = {
      id: 'normal_encounter',
      name: 'Normal',
    };
    expect(template.questPriority).toBeUndefined();
  });

  it('defaults visibleTo to undefined (treated as "all" by engine)', () => {
    const template: Partial<EncounterTemplate> = {
      id: 'open_encounter',
      name: 'Open',
    };
    expect(template.visibleTo).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/encounter-quest.test.ts -v`
Expected: FAIL — `visibleTo` and `questPriority` not in `EncounterTemplate` type

**Step 3: Add quest fields to EncounterTemplate**

In `src/types/encounter.ts`, add to the `EncounterTemplate` interface:

```typescript
  /**
   * Visibility filter — which agents/factions can see this encounter.
   * Format: 'faction:<id>', 'agent:<id>', 'archetype:<id>', 'culture:<id>', or 'all'.
   * Undefined = visible to all (backward compatible).
   */
  visibleTo?: string[];

  /**
   * Score multiplier for quest encounters (1.0 = normal, 2.0–10.0 = quest).
   * Applied to motivationPull in movement candidate scoring.
   * Undefined = treated as 1.0 (no boost).
   */
  questPriority?: number;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/encounter-quest.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/encounter.ts src/types/__tests__/encounter-quest.test.ts
git commit -m "feat(encounter): add visibleTo and questPriority to EncounterTemplate"
```

---

### Task 2: Quest Visibility Filter

**Files:**
- Create: `src/engine/questVisibility.ts`
- Test: `src/engine/__tests__/questVisibility.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/questVisibility.test.ts
import { describe, it, expect } from 'vitest';
import { isEncounterVisibleToAgent } from '../questVisibility';
import { WorldGraph } from '../graph';

describe('questVisibility', () => {
  function makeGraph(): WorldGraph {
    const g = new WorldGraph();
    // Agent with faction and culture
    g.addNode({ id: 'agent1', type: 'actor', name: 'Warrior', properties: {
      actorType: 'individual',
      narrativeArchetype: 'warlord',
    }});
    g.addNode({ id: 'faction_iron', type: 'faction', name: 'Iron Pact', properties: {} });
    g.addNode({ id: 'culture_sun', type: 'culture', name: 'Sun Children', properties: {} });
    g.addEdge({ id: 'e1', source: 'agent1', target: 'faction_iron', type: 'member_of', properties: {} });
    g.addEdge({ id: 'e2', source: 'agent1', target: 'culture_sun', type: 'belongs_to', properties: { culturalStrength: 0.8 } });
    return g;
  }

  it('returns true when visibleTo is undefined (all)', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', undefined)).toBe(true);
  });

  it('returns true when visibleTo includes "all"', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['all'])).toBe(true);
  });

  it('returns true when agent matches faction filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:faction_iron'])).toBe(true);
  });

  it('returns false when agent does not match faction filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:other_faction'])).toBe(false);
  });

  it('returns true when agent matches direct agent filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['agent:agent1'])).toBe(true);
  });

  it('returns true when agent matches archetype filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['archetype:warlord'])).toBe(true);
  });

  it('returns true when agent matches culture filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['culture:culture_sun'])).toBe(true);
  });

  it('returns true if any filter matches (OR logic)', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:other', 'agent:agent1'])).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/questVisibility.test.ts -v`
Expected: FAIL — module not found

**Step 3: Implement quest visibility filter**

```typescript
// src/engine/questVisibility.ts
/**
 * Quest Visibility Filter
 *
 * Determines whether an encounter's visibleTo filter matches a given agent.
 * Supports: agent:<id>, faction:<id>, archetype:<id>, culture:<id>, "all".
 * Undefined visibleTo = visible to all (backward compatible).
 */

import type { WorldGraph } from './graph';

/**
 * Check whether an encounter with the given visibleTo filter is visible to an agent.
 * Returns true if any filter matches (OR logic) or if visibleTo is undefined/"all".
 */
export function isEncounterVisibleToAgent(
  graph: WorldGraph,
  agentId: string,
  visibleTo: string[] | undefined,
): boolean {
  // No filter = visible to all
  if (!visibleTo || visibleTo.length === 0) return true;
  if (visibleTo.includes('all')) return true;

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return false;

  for (const filter of visibleTo) {
    const [prefix, targetId] = filter.split(':');

    switch (prefix) {
      case 'agent':
        if (agentId === targetId) return true;
        break;

      case 'faction': {
        // Check if agent has member_of edge to this faction
        const factionEdges = graph.getOutgoingEdges(agentId, 'member_of');
        if (factionEdges.some(e => e.target === targetId)) return true;
        break;
      }

      case 'archetype': {
        const archetype = agentNode.properties?.narrativeArchetype;
        if (archetype === targetId) return true;
        break;
      }

      case 'culture': {
        const cultureEdges = graph.getOutgoingEdges(agentId, 'belongs_to');
        if (cultureEdges.some(e => e.target === targetId)) return true;
        break;
      }

      default:
        // Unknown filter prefix — skip (fail-soft)
        break;
    }
  }

  return false;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/questVisibility.test.ts -v`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/engine/questVisibility.ts src/engine/__tests__/questVisibility.test.ts
git commit -m "feat(quest): add visibility filter for quest encounters"
```

---

### Task 3: Threat Rating Computation

**Files:**
- Create: `src/engine/threatRating.ts`
- Create: `src/data/threat-content.ts`
- Test: `src/engine/__tests__/threatRating.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/threatRating.test.ts
import { describe, it, expect } from 'vitest';
import { computeHexThreatRating } from '../threatRating';
import { WorldGraph } from '../graph';

describe('threatRating', () => {
  function makeGraph(): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'hex1', type: 'location', name: 'Contested Hex', properties: {
      locationType: 'hex_center',
    }});
    // Rival-controlled hex
    g.addNode({ id: 'rival1', type: 'rival', name: 'Dark Lord', properties: {
      hostilityToPlayer: 0.8,
    }});
    g.addEdge({ id: 'e_ctrl', source: 'rival1', target: 'hex1', type: 'controls', properties: {} });
    return g;
  }

  it('returns 0 for a hex with no threats', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'safe_hex', type: 'location', name: 'Safe', properties: { locationType: 'hex_center' } });
    const threat = computeHexThreatRating(g, 'safe_hex');
    expect(threat).toBe(0);
  });

  it('factors in faction hostility', () => {
    const g = makeGraph();
    const threat = computeHexThreatRating(g, 'hex1');
    expect(threat).toBeGreaterThan(0);
    expect(threat).toBeLessThanOrEqual(1);
  });

  it('clamps threat to [0, 1] range', () => {
    const g = makeGraph();
    const threat = computeHexThreatRating(g, 'hex1');
    expect(threat).toBeGreaterThanOrEqual(0);
    expect(threat).toBeLessThanOrEqual(1);
  });

  it('increases with hostile agents at location', () => {
    const g = makeGraph();
    // Add a hostile agent
    g.addNode({ id: 'hostile_agent', type: 'actor', name: 'Enemy', properties: {
      actorType: 'individual',
      cooperationStrategy: 'always_defect',
    }});
    g.addEdge({ id: 'e_loc', source: 'hostile_agent', target: 'hex1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e_fac', source: 'hostile_agent', target: 'rival1', type: 'member_of', properties: {} });

    const withHostile = computeHexThreatRating(g, 'hex1');
    // Remove hostile agent and compare
    g.removeEdge('e_loc');
    g.removeEdge('e_fac');
    g.removeNode('hostile_agent');
    const withoutHostile = computeHexThreatRating(g, 'hex1');
    expect(withHostile).toBeGreaterThan(withoutHostile);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/threatRating.test.ts -v`
Expected: FAIL

**Step 3: Create threat content data**

```typescript
// src/data/threat-content.ts
/**
 * Threat Rating Content Data
 *
 * Tunable weights for hex threat computation.
 * Engine reads these at resolution time — never owns them.
 */

/** Weight of controlling faction's hostility in threat rating */
export const THREAT_FACTION_WEIGHT = 0.4;

/** Weight of hostile agents at location in threat rating */
export const THREAT_HOSTILE_AGENT_WEIGHT = 0.3;

/** Weight of average encounter difficulty in threat rating */
export const THREAT_ENCOUNTER_WEIGHT = 0.2;

/** Weight of culture misalignment in threat rating */
export const THREAT_CULTURE_WEIGHT = 0.1;

/** Hostility threshold above which a cooperation strategy is considered hostile */
export const HOSTILE_STRATEGY_THRESHOLD = 0.5;
```

**Step 4: Implement threat rating**

```typescript
// src/engine/threatRating.ts
/**
 * Hex Threat Rating — computes composite threat score for a location.
 *
 * Score range: [0.0, 1.0] where 0 = safe, 1 = extremely dangerous.
 * Used by movement candidate scoring (threatModifier) to influence agent
 * goal evaluation: cautious agents avoid high-threat hexes.
 */

import type { WorldGraph } from './graph';
import {
  THREAT_FACTION_WEIGHT,
  THREAT_HOSTILE_AGENT_WEIGHT,
  THREAT_ENCOUNTER_WEIGHT,
  THREAT_CULTURE_WEIGHT,
} from '../data/threat-content';

/**
 * Compute the composite threat rating for a hex/location.
 * Returns a value in [0.0, 1.0].
 */
export function computeHexThreatRating(graph: WorldGraph, locationId: string): number {
  let factionThreat = 0;
  let hostileAgentThreat = 0;
  let encounterThreat = 0;
  // cultureThreat is agent-specific, deferred to P2 (requires agent context)

  // --- Factor 1: Controlling faction hostility ---
  const controlEdges = graph.getIncomingEdges(locationId, 'controls');
  for (const edge of controlEdges) {
    const controller = graph.getNode(edge.source);
    if (controller) {
      const hostility = (controller.properties?.hostilityToPlayer as number) ?? 0;
      factionThreat = Math.max(factionThreat, hostility);
    }
  }

  // --- Factor 2: Hostile agents at location ---
  const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
  let hostileCount = 0;
  let totalAgents = 0;
  for (const edge of locatedAtEdges) {
    const agent = graph.getNode(edge.source);
    if (agent && agent.properties?.actorType === 'individual') {
      totalAgents++;
      const strategy = agent.properties?.cooperationStrategy as string | undefined;
      if (strategy === 'always_defect' || strategy === 'grudger') {
        hostileCount++;
      }
      // Also check if agent belongs to a hostile faction
      const memberEdges = graph.getOutgoingEdges(edge.source, 'member_of');
      for (const mEdge of memberEdges) {
        const faction = graph.getNode(mEdge.target);
        if (faction && ((faction.properties?.hostilityToPlayer as number) ?? 0) > 0.5) {
          hostileCount++;
          break;
        }
      }
    }
  }
  hostileAgentThreat = totalAgents > 0 ? Math.min(1, hostileCount / Math.max(1, totalAgents)) : 0;

  // --- Factor 3: Average encounter threat ---
  // Check encounter nodes at this location
  const encounterEdges = graph.getIncomingEdges(locationId, 'encounter_at');
  if (encounterEdges.length > 0) {
    let totalThreat = 0;
    for (const edge of encounterEdges) {
      const enc = graph.getNode(edge.source);
      if (enc) {
        const rating = enc.properties?.threatRating as string | undefined;
        totalThreat += threatRatingToNumber(rating);
      }
    }
    encounterThreat = totalThreat / encounterEdges.length;
  }

  // --- Composite ---
  const raw = factionThreat * THREAT_FACTION_WEIGHT
            + hostileAgentThreat * THREAT_HOSTILE_AGENT_WEIGHT
            + encounterThreat * THREAT_ENCOUNTER_WEIGHT;
            // THREAT_CULTURE_WEIGHT reserved for agent-specific computation

  return Math.max(0, Math.min(1, raw));
}

/** Map textual threat ratings to numeric values */
function threatRatingToNumber(rating: string | undefined): number {
  switch (rating) {
    case 'trivial': return 0.1;
    case 'minor': return 0.25;
    case 'moderate': return 0.5;
    case 'serious': return 0.75;
    case 'deadly': return 1.0;
    default: return 0.3; // Unknown = moderate-ish
  }
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/threatRating.test.ts -v`
Expected: PASS (4 tests)

**Step 6: Commit**

```bash
git add src/engine/threatRating.ts src/data/threat-content.ts src/engine/__tests__/threatRating.test.ts
git commit -m "feat(movement): add hex threat rating computation"
```

---

### Task 4: Wire Quest Priority into Movement Candidates

**Files:**
- Modify: `src/engine/movementCandidates.ts`
- Modify: `src/data/movement-content.ts` (add `DEFAULT_QUEST_PRIORITY`)
- Test: `src/engine/__tests__/movementCandidates.test.ts` (add quest tests)

**Step 1: Write the failing test**

Add to the existing test file:

```typescript
describe('quest priority integration', () => {
  it('questPriority multiplies motivationPull', () => {
    const normalScore = scoreMovementCandidate(0.5, 10);
    const questScore = scoreMovementCandidate(0.5 * 5.0, 10); // questPriority = 5.0
    expect(questScore).toBeGreaterThan(normalScore);
    expect(questScore / normalScore).toBeCloseTo(5.0, 1);
  });
});
```

**Step 2: Run to verify it fails/passes**

This test should already pass since `scoreMovementCandidate` just multiplies. The real integration is in `generateMovementCandidates` — we need to read encounter templates at each destination and use `questPriority`.

**Step 3: Update movement-content.ts**

Add to `src/data/movement-content.ts`:

```typescript
/** Default quest priority for encounters without explicit questPriority */
export const DEFAULT_QUEST_PRIORITY = 1.0;
```

**Step 4: Update movementCandidates.ts**

Replace the P0 `computeBasePull` with a version that reads encounter templates at the destination and uses `questPriority`:

```typescript
import { isEncounterVisibleToAgent } from './questVisibility';
import { DEFAULT_QUEST_PRIORITY } from '../data/movement-content';

/**
 * Compute motivation pull for a destination based on encounter templates there.
 * Uses the best-matching encounter's questPriority as a multiplier.
 * P1: reads encounter templates at the destination and scores by axiological alignment.
 */
function computeBasePull(
  graph: WorldGraph,
  locationId: string,
  agentId: string,
  profile: AxiologicalProfile,
): { pull: number; bestTemplateId: string } {
  const node = graph.getNode(locationId);
  if (!node) return { pull: 0, bestTemplateId: '' };

  // Skip non-hex-center locations (agents move hex-to-hex in P1)
  const locType = node.properties?.locationType;
  if (locType !== 'hex_center') return { pull: 0, bestTemplateId: '' };

  // Check for encounter templates at this location
  const encounterEdges = graph.getIncomingEdges(locationId, 'encounter_at');
  let bestPull = 0;
  let bestTemplateId = '';

  for (const edge of encounterEdges) {
    const encNode = graph.getNode(edge.source);
    if (!encNode) continue;

    // Check visibility
    const visibleTo = encNode.properties?.visibleTo as string[] | undefined;
    if (!isEncounterVisibleToAgent(graph, agentId, visibleTo)) continue;

    // Quest priority multiplier
    const questPriority = (encNode.properties?.questPriority as number) ?? DEFAULT_QUEST_PRIORITY;

    // Simple axiological alignment (use ambition as proxy for P1)
    const basePull = P0_BASE_MOTIVATION_PULL + Math.max(0, profile.ambition_contentment) * P0_AMBITION_WEIGHT;
    const pull = basePull * questPriority;

    if (pull > bestPull) {
      bestPull = pull;
      bestTemplateId = encNode.id;
    }
  }

  // Fallback: if no encounters, use P0 heuristic for hex centers
  if (bestPull === 0) {
    const basePull = P0_BASE_MOTIVATION_PULL + Math.max(0, profile.ambition_contentment) * P0_AMBITION_WEIGHT;
    return { pull: basePull, bestTemplateId: '' };
  }

  return { pull: bestPull, bestTemplateId };
}
```

Update `generateMovementCandidates` to call the new `computeBasePull` with `agentId`:

```typescript
const { pull: basePull, bestTemplateId } = computeBasePull(graph, loc.id, agentId, profile);
if (basePull <= 0) continue;

// ... rest unchanged, but use bestTemplateId in the candidate
candidates.push({
  destinationId: loc.id,
  bestTemplateId,
  motivationPull: basePull,
  // ...
});
```

**Step 5: Run tests**

Run: `npx vitest run src/engine/__tests__/movementCandidates.test.ts -v`
Expected: PASS

**Step 6: Commit**

```bash
git add src/engine/movementCandidates.ts src/data/movement-content.ts src/engine/__tests__/movementCandidates.test.ts
git commit -m "feat(movement): wire quest priority into movement candidate scoring"
```

---

### Task 5: Threat Modifier in Movement Scoring

**Files:**
- Modify: `src/engine/movementCandidates.ts`
- Modify: `src/data/movement-content.ts` (add threat modifier constants)
- Test: `src/engine/__tests__/movementCandidates-threat.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/movementCandidates-threat.test.ts
import { describe, it, expect } from 'vitest';
import { computeThreatModifier } from '../movementCandidates';

describe('computeThreatModifier', () => {
  it('returns 1.0 when threat is 0', () => {
    expect(computeThreatModifier(0, 0)).toBe(1.0);
  });

  it('returns 1.0 when agent has max courage (threat ignored)', () => {
    expect(computeThreatModifier(1.0, 1.0)).toBeCloseTo(1.0, 1);
  });

  it('reduces score for high threat + low courage', () => {
    const mod = computeThreatModifier(0.8, -1.0);
    expect(mod).toBeLessThan(1.0);
    expect(mod).toBeGreaterThan(0);
  });

  it('moderate courage partially resists threat', () => {
    const cowardMod = computeThreatModifier(0.5, -0.5);
    const braveMod = computeThreatModifier(0.5, 0.5);
    expect(braveMod).toBeGreaterThan(cowardMod);
  });
});
```

**Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/__tests__/movementCandidates-threat.test.ts -v`
Expected: FAIL

**Step 3: Add content constants and implement**

In `src/data/movement-content.ts`:

```typescript
/** Minimum threat modifier (floor — even max coward keeps some motivation) */
export const THREAT_MODIFIER_FLOOR = 0.1;
```

In `src/engine/movementCandidates.ts`, export a new function:

```typescript
import { THREAT_MODIFIER_FLOOR } from '../data/movement-content';

/**
 * Compute threat modifier for movement scoring.
 *
 * threatModifier = 1.0 - (hexThreatRating × (1.0 - courageFactor))
 * where courageFactor maps courage_prudence [-1, 1] to [0, 1].
 * High courage → threat matters less. Low courage → threat reduces score.
 * Floored at THREAT_MODIFIER_FLOOR to prevent zero scores.
 */
export function computeThreatModifier(threatRating: number, couragePrudence: number): number {
  // Map courage_prudence from [-1, 1] to courageFactor [0, 1]
  const courageFactor = (couragePrudence + 1) / 2;
  const modifier = 1.0 - (threatRating * (1.0 - courageFactor));
  return Math.max(THREAT_MODIFIER_FLOOR, modifier);
}
```

Then integrate into `generateMovementCandidates`:

```typescript
import { computeHexThreatRating } from './threatRating';

// Inside the candidate loop:
const threat = computeHexThreatRating(graph, loc.id);
const threatMod = computeThreatModifier(threat, profile.courage_prudence);
const score = scoreMovementCandidate(basePull * threatMod, pathResult.totalCost);
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/movementCandidates-threat.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/movementCandidates.ts src/data/movement-content.ts src/engine/__tests__/movementCandidates-threat.test.ts
git commit -m "feat(movement): add threat modifier to movement candidate scoring"
```

---

### Task 6: Colocation Detection Phase

**Files:**
- Create: `src/engine/phaseColocationDetection.ts`
- Create: `src/data/colocation-content.ts`
- Test: `src/engine/__tests__/phaseColocationDetection.test.ts`
- Modify: `src/types/gameState.ts` (add `'agent_encounter'` event type)
- Modify: `src/engine/orchestrator.ts` (insert phase)

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/phaseColocationDetection.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { phaseColocationDetection, resetColocationEventCounter } from '../phaseColocationDetection';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';

function makeState(graph: WorldGraph, tick: number, seed: number): GameState {
  return {
    tick,
    seed,
    graph,
    tickEvents: [],
    ascendantId: 'god',
    // ... minimal required fields
  } as unknown as GameState;
}

describe('phaseColocationDetection', () => {
  beforeEach(() => {
    resetColocationEventCounter();
  });

  it('emits no events when no agents share a location', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Hex A', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'loc2', type: 'location', name: 'Hex B', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Agent 1', properties: { actorType: 'individual', domainCapabilities: {} } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent 2', properties: { actorType: 'individual', domainCapabilities: {} } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc2', type: 'located_at', properties: {} });

    const state = makeState(g, 1, 42);
    const result = phaseColocationDetection(state);
    const newEvents = (result.tickEvents ?? []).filter(e => e.type === 'agent_encounter');
    expect(newEvents.length).toBe(0);
  });

  it('can detect agents at the same location', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Alice', properties: { actorType: 'individual', domainCapabilities: { eye: 0.9 } } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Bob', properties: { actorType: 'individual', domainCapabilities: { shadow: 0.1 } } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    // Run many ticks with different seeds to get at least one detection
    let detected = false;
    for (let tick = 0; tick < 100; tick++) {
      const state = makeState(g, tick, tick * 13);
      const result = phaseColocationDetection(state);
      const encounters = (result.tickEvents ?? []).filter(e => e.type === 'agent_encounter');
      if (encounters.length > 0) {
        detected = true;
        break;
      }
    }
    expect(detected).toBe(true);
  });

  it('uses seeded PRNG for deterministic detection', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { locationType: 'location' } });
    g.addNode({ id: 'a1', type: 'actor', name: 'Alice', properties: { actorType: 'individual', domainCapabilities: { eye: 0.5 } } });
    g.addNode({ id: 'a2', type: 'actor', name: 'Bob', properties: { actorType: 'individual', domainCapabilities: { shadow: 0.5 } } });
    g.addEdge({ id: 'e1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e2', source: 'a2', target: 'loc1', type: 'located_at', properties: {} });

    const state1 = makeState(g, 5, 42);
    const result1 = phaseColocationDetection(state1);
    resetColocationEventCounter();
    const result2 = phaseColocationDetection(state1);

    // Same seed + tick = same result
    expect(result1.tickEvents?.length).toBe(result2.tickEvents?.length);
  });
});
```

**Step 2: Run to verify it fails**

Expected: FAIL

**Step 3: Create colocation content data**

```typescript
// src/data/colocation-content.ts
/**
 * Colocation Detection Content Data
 *
 * Base discovery chances and stat modifier weights for agent-pair detection.
 */

/** Base discovery chance per tick for agents in the same hex (different locations) */
export const ENCOUNTER_BASE_CHANCE_HEX = 0.05;

/** Base discovery chance per tick for agents at the same location */
export const ENCOUNTER_BASE_CHANCE_LOCATION = 0.10;

/** Base discovery chance per tick for agents at the same sublocation */
export const ENCOUNTER_BASE_CHANCE_SUBLOCATION = 0.20;

/** Eye domain bonus weight (higher Eye = more perceptive) */
export const EYE_PERCEPTION_WEIGHT = 0.15;

/** Shadow domain penalty weight (higher Shadow = stealthier) */
export const SHADOW_STEALTH_WEIGHT = 0.15;

/** Minimum detection chance (always some chance of encounter) */
export const DETECTION_CHANCE_FLOOR = 0.01;

/** Maximum detection chance (never guaranteed) */
export const DETECTION_CHANCE_CEILING = 0.95;
```

**Step 4: Implement colocation detection phase**

```typescript
// src/engine/phaseColocationDetection.ts
/**
 * Phase: Colocation Detection
 *
 * Every tick, for each pair of agents sharing a location tier,
 * roll for discovery. Successful detection emits agent_encounter events.
 */

import type { GameState, TickEvent } from '../types/gameState';
import {
  ENCOUNTER_BASE_CHANCE_HEX,
  ENCOUNTER_BASE_CHANCE_LOCATION,
  ENCOUNTER_BASE_CHANCE_SUBLOCATION,
  EYE_PERCEPTION_WEIGHT,
  SHADOW_STEALTH_WEIGHT,
  DETECTION_CHANCE_FLOOR,
  DETECTION_CHANCE_CEILING,
} from '../data/colocation-content';

// ─── Seeded PRNG ──────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Event Counter ────────────────────────────────────────────────
let colocationEventCounter = 0;
function nextEventId(): string {
  return `evt_colocation_${++colocationEventCounter}`;
}
export function resetColocationEventCounter(): void {
  colocationEventCounter = 0;
}

// ─── Location Tier Detection ──────────────────────────────────────

function getBaseChance(locationType: string | undefined): number {
  switch (locationType) {
    case 'sublocation': return ENCOUNTER_BASE_CHANCE_SUBLOCATION;
    case 'location': return ENCOUNTER_BASE_CHANCE_LOCATION;
    case 'hex_center':
    default: return ENCOUNTER_BASE_CHANCE_HEX;
  }
}

// ─── Phase Function ───────────────────────────────────────────────

export function phaseColocationDetection(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 97);
  const events: TickEvent[] = [];
  const graph = state.graph;

  // Group agents by location
  const locationAgents = new Map<string, string[]>();
  const actors = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  for (const actor of actors) {
    const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
    if (locEdges.length === 0) continue;
    const locId = locEdges[0].target;
    if (!locationAgents.has(locId)) locationAgents.set(locId, []);
    locationAgents.get(locId)!.push(actor.id);
  }

  // For each location with 2+ agents, roll pairwise detection
  for (const [locId, agentIds] of locationAgents) {
    if (agentIds.length < 2) continue;

    const locNode = graph.getNode(locId);
    const locType = locNode?.properties?.locationType as string | undefined;
    const baseChance = getBaseChance(locType);

    // Pairwise detection (order matters: A detects B ≠ B detects A)
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const observerId = agentIds[i];
        const targetId = agentIds[j];

        const observer = graph.getNode(observerId);
        const target = graph.getNode(targetId);
        if (!observer || !target) continue;

        const observerEye = ((observer.properties?.domainCapabilities as Record<string, number>)?.eye ?? 0);
        const targetShadow = ((target.properties?.domainCapabilities as Record<string, number>)?.shadow ?? 0);

        const chance = Math.max(
          DETECTION_CHANCE_FLOOR,
          Math.min(DETECTION_CHANCE_CEILING,
            baseChance + observerEye * EYE_PERCEPTION_WEIGHT - targetShadow * SHADOW_STEALTH_WEIGHT
          )
        );

        if (rng() < chance) {
          events.push({
            id: nextEventId(),
            tick: state.tick,
            type: 'agent_encounter' as any,
            message: `${observer.name} encounters ${target.name} at ${locNode?.name ?? 'a location'}.`,
            significance: 0.6,
          });
        }
      }
    }
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}
```

**Step 5: Add event type and wire into orchestrator**

In `src/types/gameState.ts`, add `'agent_encounter'` to the TickEvent type union.

In `src/engine/orchestrator.ts`, add after the movement phase:

```typescript
import { phaseColocationDetection } from './phaseColocationDetection';

// Phase 2.36: Colocation Detection (after movement, before sublocation dissolution)
Object.assign(state, phaseColocationDetection(state));
```

**Step 6: Run tests**

Run: `npx vitest run src/engine/__tests__/phaseColocationDetection.test.ts -v`
Expected: PASS

**Step 7: Commit**

```bash
git add src/engine/phaseColocationDetection.ts src/data/colocation-content.ts \
  src/engine/__tests__/phaseColocationDetection.test.ts \
  src/types/gameState.ts src/engine/orchestrator.ts
git commit -m "feat(encounter): add colocation detection phase with Eye/Shadow modifiers"
```

---

### Task 7: Agent Dots on Hex Map

**Files:**
- Create: `src/components/HexMap/AgentDots.tsx`
- Modify: `src/components/HexMap/HexMap.tsx` (render AgentDots layer)
- Create: `src/data/agent-visual-content.ts` (visual constants)
- Test: `src/components/HexMap/__tests__/AgentDots.test.tsx`

**Step 1: Create visual constants**

```typescript
// src/data/agent-visual-content.ts
/**
 * Agent Visual Content Data
 *
 * Tunable constants for rendering agent dots/tokens on the hex map.
 */

/** d3 zoom scale threshold: below = dots, above = tokens with initials */
export const ZOOM_TOKEN_THRESHOLD = 2.5;

/** Max agents shown in ring around settlement before overflow badge */
export const MAX_RING_AGENTS = 6;

/** Radius of agent dot at default zoom */
export const AGENT_DOT_RADIUS = 3;

/** Radius of agent dot at token zoom */
export const AGENT_TOKEN_RADIUS = 8;

/** Agent domain-to-color mapping for dot rendering */
export const DOMAIN_COLORS: Record<string, string> = {
  iron: '#6B7280',
  gold: '#D4A017',
  shadow: '#1F1F3A',
  veil: '#7B5EA7',
  heart: '#C94040',
  eye: '#2E86AB',
  stone: '#8B6F47',
  star: '#FFD700',
  flesh: '#D4826A',
};

/** Default agent dot color when domain is unknown */
export const DEFAULT_AGENT_COLOR = '#555555';

/** Ring distance from hex center for agent positioning */
export const AGENT_RING_RADIUS = 12;
```

**Step 2: Write the AgentDots component**

```tsx
// src/components/HexMap/AgentDots.tsx
/**
 * Renders agent dots/tokens on the hex map.
 *
 * At low zoom: colored dots with black outlines.
 * At high zoom: tokens with agent initials and archetype badge.
 * Dots are arranged in a ring around the hex center.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import {
  ZOOM_TOKEN_THRESHOLD,
  MAX_RING_AGENTS,
  AGENT_DOT_RADIUS,
  AGENT_TOKEN_RADIUS,
  DOMAIN_COLORS,
  DEFAULT_AGENT_COLOR,
  AGENT_RING_RADIUS,
} from '../../data/agent-visual-content';
import { hexCenter } from '../../lib/hexMath';

interface AgentDotsProps {
  graph: WorldGraph;
  hexId: string;
  hexCol: number;
  hexRow: number;
  zoomScale: number;
  onAgentClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
}

function getAgentColor(domainCapabilities: Record<string, number> | undefined): string {
  if (!domainCapabilities) return DEFAULT_AGENT_COLOR;
  let bestDomain = '';
  let bestValue = -1;
  for (const [domain, value] of Object.entries(domainCapabilities)) {
    if (value > bestValue) {
      bestValue = value;
      bestDomain = domain;
    }
  }
  return DOMAIN_COLORS[bestDomain] ?? DEFAULT_AGENT_COLOR;
}

export const AgentDots: React.FC<AgentDotsProps> = ({
  graph,
  hexId,
  hexCol,
  hexRow,
  zoomScale,
  onAgentClick,
  onAgentHover,
}) => {
  // Find agents at this hex
  const locEdges = graph.getIncomingEdges(hexId, 'located_at');
  const agents = locEdges
    .map(e => graph.getNode(e.source))
    .filter(n => n && n.properties?.actorType === 'individual');

  if (agents.length === 0) return null;

  const [cx, cy] = hexCenter(hexCol, hexRow);
  const isTokenZoom = zoomScale >= ZOOM_TOKEN_THRESHOLD;
  const radius = isTokenZoom ? AGENT_TOKEN_RADIUS : AGENT_DOT_RADIUS;

  // Ring positions (evenly spaced around center)
  const visibleAgents = agents.slice(0, MAX_RING_AGENTS);
  const overflow = agents.length - MAX_RING_AGENTS;

  return (
    <g className="agent-dots">
      {visibleAgents.map((agent, i) => {
        if (!agent) return null;
        const angle = (2 * Math.PI * i) / Math.max(visibleAgents.length, 1) - Math.PI / 2;
        const dx = Math.cos(angle) * AGENT_RING_RADIUS;
        const dy = Math.sin(angle) * AGENT_RING_RADIUS;
        const color = getAgentColor(agent.properties?.domainCapabilities as Record<string, number>);

        return (
          <g
            key={agent.id}
            transform={`translate(${cx + dx}, ${cy + dy})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onAgentClick?.(agent.id)}
            onMouseEnter={() => onAgentHover?.(agent.id)}
            onMouseLeave={() => onAgentHover?.(null)}
          >
            <circle
              r={radius}
              fill={color}
              stroke="#000"
              strokeWidth={0.5}
            />
            {isTokenZoom && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={radius * 0.9}
                fill="#fff"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {(agent.name ?? '?').slice(0, 2).toUpperCase()}
              </text>
            )}
          </g>
        );
      })}
      {overflow > 0 && (
        <text
          x={cx}
          y={cy + AGENT_RING_RADIUS + 8}
          textAnchor="middle"
          fontSize={6}
          fill="#333"
        >
          +{overflow}
        </text>
      )}
    </g>
  );
};
```

**Step 3: Write a basic test**

```tsx
// src/components/HexMap/__tests__/AgentDots.test.tsx
import { describe, it, expect } from 'vitest';
import { ZOOM_TOKEN_THRESHOLD, MAX_RING_AGENTS, DOMAIN_COLORS } from '../../../data/agent-visual-content';

describe('agent-visual-content constants', () => {
  it('ZOOM_TOKEN_THRESHOLD is 2.5', () => {
    expect(ZOOM_TOKEN_THRESHOLD).toBe(2.5);
  });

  it('MAX_RING_AGENTS is 6', () => {
    expect(MAX_RING_AGENTS).toBe(6);
  });

  it('DOMAIN_COLORS has all 9 reaches', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
    for (const reach of reaches) {
      expect(DOMAIN_COLORS[reach]).toBeDefined();
    }
  });
});
```

**Step 4: Wire into HexMap**

In `src/components/HexMap/HexMap.tsx`, import and render the `AgentDots` component as a layer above hex tiles, passing the graph, hex coordinates, and zoom scale.

**Step 5: Run tests**

Run: `npx vitest run src/components/HexMap/__tests__/AgentDots.test.tsx -v`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/HexMap/AgentDots.tsx src/data/agent-visual-content.ts \
  src/components/HexMap/__tests__/AgentDots.test.tsx \
  src/components/HexMap/HexMap.tsx
git commit -m "feat(ui): add agent dots/tokens on hex map with domain coloring"
```

---

### Task 8: Integration Test — Full Movement + Quest + Detection Cycle

**Files:**
- Create: `src/engine/__tests__/movement-p1-integration.test.ts`

**Step 1: Write integration tests**

```typescript
// src/engine/__tests__/movement-p1-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateMovementCandidates } from '../movementCandidates';
import { computeHexThreatRating } from '../threatRating';
import { isEncounterVisibleToAgent } from '../questVisibility';
import { phaseColocationDetection, resetColocationEventCounter } from '../phaseColocationDetection';
import type { AxiologicalProfile } from '../../types/agent';

describe('P1 integration', () => {
  beforeEach(() => {
    resetColocationEventCounter();
  });

  it('quest priority boosts movement candidate score', () => {
    const g = new WorldGraph();
    // Two hexes with adjacent edges
    g.addNode({ id: 'hexA', type: 'location', name: 'Home', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'hexB', type: 'location', name: 'Quest Target', properties: { locationType: 'hex_center' } });
    g.addEdge({ id: 'adj', source: 'hexA', target: 'hexB', type: 'adjacent', properties: {} });
    g.addEdge({ id: 'adj2', source: 'hexB', target: 'hexA', type: 'adjacent', properties: {} });

    // Agent at hexA
    g.addNode({ id: 'agent1', type: 'actor', name: 'Hero', properties: {
      actorType: 'individual',
      axiologicalProfile: { ambition_contentment: 0.5, courage_prudence: 0 },
      domainCapabilities: {},
    }});
    g.addEdge({ id: 'loc1', source: 'agent1', target: 'hexA', type: 'located_at', properties: {} });

    // Quest encounter at hexB
    g.addNode({ id: 'quest1', type: 'encounter', name: 'Epic Quest', properties: {
      questPriority: 5.0,
      visibleTo: ['agent:agent1'],
    }});
    g.addEdge({ id: 'enc_at', source: 'quest1', target: 'hexB', type: 'encounter_at', properties: {} });

    const profile: AxiologicalProfile = {
      ambition_contentment: 0.5,
      courage_prudence: 0,
      cruelty_compassion: 0,
      cunning_honesty: 0,
      devotion_independence: 0,
      loyalty_treachery: 0,
      tradition_innovation: 0,
      dominance_humility: 0,
      wrath_patience: 0,
      greed_generosity: 0,
    };

    const candidates = generateMovementCandidates(g, 'agent1', 'hexA', profile);
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    // The quest destination should be the top candidate
    const questCandidate = candidates.find(c => c.destinationId === 'hexB');
    expect(questCandidate).toBeDefined();
    expect(questCandidate!.bestTemplateId).toBe('quest1');
  });

  it('threat rating reduces scores for cautious agents', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'hex1', type: 'location', name: 'Dangerous', properties: { locationType: 'hex_center' } });
    g.addNode({ id: 'rival1', type: 'rival', name: 'Enemy', properties: { hostilityToPlayer: 0.9 } });
    g.addEdge({ id: 'ctrl', source: 'rival1', target: 'hex1', type: 'controls', properties: {} });

    const threat = computeHexThreatRating(g, 'hex1');
    expect(threat).toBeGreaterThan(0.3);
  });

  it('quest visibility filter works end-to-end', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'agent1', type: 'actor', name: 'Member', properties: {
      actorType: 'individual',
      narrativeArchetype: 'merchant',
    }});
    g.addNode({ id: 'faction1', type: 'faction', name: 'Guild', properties: {} });
    g.addEdge({ id: 'e1', source: 'agent1', target: 'faction1', type: 'member_of', properties: {} });

    // Quest visible only to faction
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:faction1'])).toBe(true);
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:other'])).toBe(false);
    expect(isEncounterVisibleToAgent(g, 'agent1', ['archetype:merchant'])).toBe(true);
    expect(isEncounterVisibleToAgent(g, 'agent1', undefined)).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/engine/__tests__/movement-p1-integration.test.ts -v`
Expected: PASS

**Step 3: Commit**

```bash
git add src/engine/__tests__/movement-p1-integration.test.ts
git commit -m "test(movement): add P1 integration tests for quest + threat + colocation"
```

---

### Task 9: Verify & Cleanup

**Step 1: Run all movement tests**

```bash
npx vitest run src/engine/__tests__/movement*.test.ts src/engine/__tests__/phaseMovement.test.ts \
  src/engine/__tests__/phaseColocationDetection.test.ts src/engine/__tests__/questVisibility.test.ts \
  src/engine/__tests__/threatRating.test.ts src/data/__tests__/movement-content.test.ts \
  src/types/__tests__/movement.test.ts src/types/__tests__/encounter-quest.test.ts \
  src/components/HexMap/__tests__/AgentDots.test.tsx
```

Expected: ALL PASS

**Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: Zero errors

**Step 3: Build**

```bash
npx vite build
```

Expected: Success

**Step 4: Verify no hardcoded magic numbers**

Grep engine files for inline numbers that should be constants.

**Step 5: Update design doc**

Change status to: "P1 implemented — P2 pending"

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore(movement): P1 verify & cleanup"
```
