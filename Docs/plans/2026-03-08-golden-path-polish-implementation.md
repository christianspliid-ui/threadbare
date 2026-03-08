# Golden Path Polish Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 5 critical/major playtest findings so the headless simulation produces a living, evolving world.

**Architecture:** Tuning existing orchestrator phases and supporting engines — no new systems, no UI work. Each fix modifies 1-3 files with targeted constant/logic changes. All fixes are independent except Fix 5 (lifecycle) which adds a new orchestrator phase.

**Tech Stack:** TypeScript, Vitest, seeded PRNG (mulberry32)

---

### Task 1: Doom Clock Speed Multiplier

Add a `doomSpeed` parameter so playtest runs can compress doom progression into shorter tick budgets without changing the default 360-tick cycle for real gameplay.

**Files:**
- Modify: `src/engine/doomClock.ts` (advanceDoomClock, createDoomClockState)
- Modify: `src/types/gameState.ts` (DEFAULT_DOOM_TICKS reference — no change needed, doomSpeed lives on DoomClockState)
- Modify: `src/engine/gameInit.ts` (pass doomSpeed option through)
- Modify: `scripts/playtest.ts` (pass doomSpeed: 3.6)
- Test: `src/engine/__tests__/doomClock.test.ts`

**Step 1: Write the failing test**

Add to `src/engine/__tests__/doomClock.test.ts`:

```typescript
describe('doomSpeed multiplier', () => {
  it('advances faster with doomSpeed > 1', () => {
    const state = createDoomClockState('breach', 360);
    state.doomSpeed = 3.6;
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = advanceDoomClock(s);
    }
    // 20 ticks * 3.6 doomSpeed * 1.0 tickModifier = 72 effective ticks
    // 72 / 360 = 0.2 → stage 2
    expect(s.currentStage).toBeGreaterThanOrEqual(2);
  });

  it('defaults doomSpeed to 1.0 when not set', () => {
    const state = createDoomClockState('breach', 360);
    expect(state.doomSpeed).toBe(1.0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/doomClock.test.ts --reporter verbose`
Expected: FAIL — `doomSpeed` property does not exist on DoomClockState

**Step 3: Add doomSpeed to DoomClockState**

In `src/types/doomClock.ts`, add `doomSpeed` field to `DoomClockState`:

```typescript
export interface DoomClockState {
  definitionArchetype: DoomClockArchetype;
  currentTick: number;
  totalTicks: number;
  currentStage: number;
  progress: number;
  stageTransitions: number[];
  expired: boolean;
  tickModifier: number;
  doomSpeed: number;  // ← ADD THIS
}
```

**Step 4: Update createDoomClockState**

In `src/engine/doomClock.ts`, add `doomSpeed: 1.0` to the returned state:

```typescript
export function createDoomClockState(
  archetype: DoomClockArchetype,
  totalTicks: number,
): DoomClockState {
  return {
    definitionArchetype: archetype,
    currentTick: 0,
    totalTicks,
    currentStage: 1,
    progress: 0,
    stageTransitions: [0],
    expired: false,
    tickModifier: 1.0,
    doomSpeed: 1.0,  // ← ADD THIS
  };
}
```

**Step 5: Update advanceDoomClock to use doomSpeed**

In `src/engine/doomClock.ts`, change line 71 from:

```typescript
const newTick = state.currentTick + state.tickModifier;
```

to:

```typescript
const newTick = state.currentTick + state.tickModifier * (state.doomSpeed ?? 1.0);
```

**Step 6: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/doomClock.test.ts --reporter verbose`
Expected: PASS — all existing + new tests

**Step 7: Wire doomSpeed into gameInit**

In `src/engine/gameInit.ts`, add optional `doomSpeed` parameter:

```typescript
export function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
  cols: number = DEFAULT_COLS,
  rows: number = DEFAULT_ROWS,
  options?: { doomSpeed?: number },  // ← ADD THIS
): { state: GameState; tiles: HexTile[] } {
```

Then after `createDoomClockState`, set doomSpeed:

```typescript
const doomState = createDoomClockState('breach', DEFAULT_DOOM_TICKS);
if (options?.doomSpeed) {
  doomState.doomSpeed = options.doomSpeed;
}
```

**Step 8: Wire doomSpeed into playtest runner**

In `scripts/playtest.ts`, update the `initializeGameState` call in `runPlaytest()`:

```typescript
const { state: initialState } = initializeGameState(
  archetype,
  'Playtester',
  cosmology,
  seed,
  undefined,
  undefined,
  { doomSpeed: 3.6 },
);
```

**Step 9: Run full test suite**

Run: `npx vitest run --reporter verbose`
Expected: All tests PASS

**Step 10: Commit**

```bash
git add src/types/doomClock.ts src/engine/doomClock.ts src/engine/gameInit.ts src/engine/__tests__/doomClock.test.ts scripts/playtest.ts
git commit -m "feat: add doomSpeed multiplier for compressed playtest runs"
```

---

### Task 2: Narrative Prose Differentiates

Replace the static agent action message with varied routine prose, widen the significance range so some events reach notable tier, and add periodic notable events.

**Files:**
- Modify: `src/engine/orchestrator.ts` (phaseAgentActions — lines 85-113)
- Test: `src/engine/__tests__/orchestrator.test.ts` (or create new file)

**Step 1: Write the failing tests**

Create `src/engine/__tests__/orchestrator-prose.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { phaseAgentActions } from '../orchestrator';
// ... setup helpers from existing orchestrator tests

describe('phaseAgentActions prose variation', () => {
  it('produces varied messages instead of static template', () => {
    // Setup a GameState with multiple actors and run phaseAgentActions
    // with a seed that produces at least 2 agent actions
    const state = createTestState(42); // helper
    const result = phaseAgentActions(state);
    const actionEvents = result.tickEvents!.filter(
      (e: any) => e.type === 'agent_action_resolved'
    );
    if (actionEvents.length >= 2) {
      // At least some messages should differ
      const messages = actionEvents.map((e: any) => e.message);
      const uniqueMessages = new Set(messages);
      expect(uniqueMessages.size).toBeGreaterThan(1);
    }
  });

  it('no message matches the old static template pattern', () => {
    const state = createTestState(42);
    const result = phaseAgentActions(state);
    const actionEvents = result.tickEvents!.filter(
      (e: any) => e.type === 'agent_action_resolved'
    );
    for (const event of actionEvents) {
      expect(event.message).not.toMatch(/acted in the realm of/);
    }
  });

  it('significance range can reach 0.9', () => {
    // Run many seeds and check that at least one event has significance >= 0.85
    let foundHigh = false;
    for (let seed = 0; seed < 100; seed++) {
      const state = createTestState(seed);
      const result = phaseAgentActions(state);
      const events = result.tickEvents!.filter(
        (e: any) => e.type === 'agent_action_resolved'
      );
      if (events.some((e: any) => e.significance >= 0.85)) {
        foundHigh = true;
        break;
      }
    }
    expect(foundHigh).toBe(true);
  });
});
```

Note: The test helper `createTestState` should build a minimal GameState with 8-12 individual actors. Reuse patterns from existing orchestrator tests.

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/orchestrator-prose.test.ts --reporter verbose`
Expected: FAIL — messages still use static template

**Step 3: Implement prose variation in phaseAgentActions**

In `src/engine/orchestrator.ts`, add the import at the top:

```typescript
import { generateRoutineProse } from './narrative';
```

Then replace lines 95-110 (the inner loop body) with:

```typescript
for (const actor of actors) {
  if (rng() < 0.15) {
    const spheres: SphereName[] = [...SPHERE_NAMES];
    const sphere = spheres[Math.floor(rng() * spheres.length)];
    const significance = 0.3 + rng() * 0.6; // max 0.9 (was 0.5 → max 0.8)

    // Generate varied prose instead of static template
    const proseSeed = state.seed + state.tick * 31 + actors.indexOf(actor);
    const locationId = actor.properties.locationId as string | undefined;
    const locationNode = locationId ? state.graph.getNode(locationId) : null;

    const prose = generateRoutineProse('action_resolved', {
      actorName: actor.name,
      locationName: locationNode?.name ?? 'the wilds',
      sphere,
    }, proseSeed);

    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'agent_action_resolved',
      message: prose.text,
      sphere,
      significance,
    });
  }
}

// Every 5 ticks, force a notable action event
if (state.tick % 5 === 0 && actors.length > 0) {
  const notableActor = actors[Math.floor(rng() * actors.length)];
  const sphere = SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)];
  const proseSeed = state.seed + state.tick * 97;
  const locationId = notableActor.properties.locationId as string | undefined;
  const locationNode = locationId ? state.graph.getNode(locationId) : null;

  const prose = generateRoutineProse('action_resolved', {
    actorName: notableActor.name,
    locationName: locationNode?.name ?? 'the wilds',
    sphere,
  }, proseSeed);

  events.push({
    id: nextEventId(),
    tick: state.tick,
    type: 'agent_action_resolved',
    message: prose.text,
    sphere,
    significance: 0.85,
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/orchestrator-prose.test.ts --reporter verbose`
Expected: PASS

**Step 5: Run full test suite**

Run: `npx vitest run --reporter verbose`
Expected: All tests PASS (some existing orchestrator tests may need the message assertion updated if they check for the old static template)

**Step 6: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-prose.test.ts
git commit -m "feat: varied narrative prose for agent actions, wider significance range"
```

---

### Task 3: Dilemmas Fire at Realistic Rates

Lower the stakes threshold, add a base stakes floor, seed initial relationship sentiments, and fix the actor selection bug.

**Files:**
- Modify: `src/types/disposition.ts` (DILEMMA_STAKES_THRESHOLD, add STAKES_BASE)
- Modify: `src/engine/disposition.ts` (computeStakes — add base)
- Modify: `src/engine/orchestrator.ts` (phaseDilemmaDetection — fix actor selection)
- Modify: `src/engine/worldSeed.ts` (seed initial sentiments on relationships)
- Test: `src/engine/__tests__/disposition.test.ts` (extend computeStakes tests)
- Test: create `src/engine/__tests__/dilemma-rate.test.ts`

**Step 1: Write the failing tests**

Add to `src/engine/__tests__/disposition.test.ts`:

```typescript
describe('computeStakes with STAKES_BASE', () => {
  it('returns at least STAKES_BASE for any domain', () => {
    const stakes = computeStakes('heart', 0, false, false);
    expect(stakes).toBeGreaterThanOrEqual(0.1);
  });

  it('iron domain reaches threshold easily', () => {
    const stakes = computeStakes('iron', 0, false, false);
    // iron = 0.4 + base 0.1 = 0.5, above threshold 0.3
    expect(stakes).toBeGreaterThanOrEqual(0.3);
  });
});
```

Create `src/engine/__tests__/dilemma-rate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';

describe('dilemma firing rate', () => {
  it('produces at least 1 dilemma in 50 ticks', () => {
    resetEventCounter();
    const archetypes = generateArchetypes(4, 42);
    const cosmology = createBalancedCosmology();
    const { state: initial } = initializeGameState(archetypes[0], 'Test', cosmology, 42);
    let state = initial;
    let dilemmaCount = 0;
    for (let i = 0; i < 50; i++) {
      state = runTick(state);
      dilemmaCount += state.tickEvents.filter(e => e.type === 'dilemma_resolved').length;
    }
    expect(dilemmaCount).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/disposition.test.ts src/engine/__tests__/dilemma-rate.test.ts --reporter verbose`
Expected: FAIL — computeStakes returns 0 for 'heart' domain, no dilemmas in 50 ticks

**Step 3: Lower DILEMMA_STAKES_THRESHOLD and add STAKES_BASE**

In `src/types/disposition.ts`:

```typescript
/** Stakes threshold above which a dilemma triggers narrative event */
export const DILEMMA_STAKES_THRESHOLD = 0.3; // was 0.6

/** Base stakes floor — every dilemma candidate gets at least this */
export const STAKES_BASE = 0.1;
```

**Step 4: Update computeStakes to use STAKES_BASE**

In `src/engine/disposition.ts`, update the import and function:

```typescript
import {
  DILEMMA_STAKES_THRESHOLD,
  DEFAULT_REPUTATION,
  STAKES_BASE, // ← ADD
} from '../types/disposition';
```

```typescript
export function computeStakes(
  domain: ReachDomain,
  sentiment: number,
  isFactionLeader: boolean,
  isTerritory: boolean,
): number {
  let stakes = STAKES_BASE; // was 0

  if (domain === 'gold') stakes += STAKES_DOMAIN_GOLD;
  if (domain === 'iron') stakes += STAKES_DOMAIN_IRON;
  if (Math.abs(sentiment) > 0.7) stakes += STAKES_EXTREME_SENTIMENT;
  if (isFactionLeader) stakes += STAKES_FACTION_LEADER;
  if (isTerritory) stakes += STAKES_TERRITORY_CONTROL;

  return Math.max(0, Math.min(1, stakes));
}
```

**Step 5: Fix actor selection bug in phaseDilemmaDetection**

In `src/engine/orchestrator.ts`, replace line 137:

```typescript
// OLD: const actor = allActors[0];
// NEW: Find actor whose name appears in the event message
const actor = allActors.find(a => event.message.includes(a.name)) ?? allActors[Math.floor(rng() * allActors.length)];
```

**Step 6: Seed initial sentiments on relationships**

In `src/engine/worldSeed.ts`, the inter-actor relationship section already seeds sentiment with `(rng() * 2) - 1` (line 400), which gives -1 to 1. This is fine — the issue is that only 30% of actor pairs get relationships at all (line 399: `rng() < 0.3`). The `computeStakes` fix (base + lower threshold) should be sufficient. No changes needed here.

**Step 7: Run tests**

Run: `npx vitest run --reporter verbose`
Expected: All PASS

**Step 8: Commit**

```bash
git add src/types/disposition.ts src/engine/disposition.ts src/engine/orchestrator.ts src/engine/__tests__/disposition.test.ts src/engine/__tests__/dilemma-rate.test.ts
git commit -m "feat: lower dilemma threshold, add base stakes, fix actor selection"
```

---

### Task 4: Mandate Progress Advances

Seed initial graph structures (constructed_by, controls edges) and make agent actions increment sphere influence at locations.

**Files:**
- Modify: `src/engine/worldSeed.ts` (add seeded graph structures)
- Modify: `src/engine/orchestrator.ts` (phaseAgentActions — increment sphere influence)
- Test: create `src/engine/__tests__/mandate-progress.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/mandate-progress.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';

describe('mandate progress', () => {
  it('has non-zero mandate progress within 50 ticks', () => {
    resetEventCounter();
    const archetypes = generateArchetypes(4, 42);
    const cosmology = createBalancedCosmology();
    const { state: initial } = initializeGameState(archetypes[0], 'Test', cosmology, 42);
    let state = initial;
    for (let i = 0; i < 50; i++) {
      state = runTick(state);
    }
    // At least some mandate progress
    expect(state.mandateState?.progress).toBeGreaterThan(0);
  });

  it('locations have sphere influence after agent actions', () => {
    resetEventCounter();
    const archetypes = generateArchetypes(4, 7);
    const cosmology = createBalancedCosmology();
    const { state: initial } = initializeGameState(archetypes[0], 'Test', cosmology, 7);
    let state = initial;
    for (let i = 0; i < 20; i++) {
      state = runTick(state);
    }
    // Check that at least one location has sphereInfluence
    const locations = state.graph.getNodesByType('location');
    const hasInfluence = locations.some(
      loc => loc.properties.sphereInfluence &&
        Object.values(loc.properties.sphereInfluence as Record<string, number>).some(v => v > 0)
    );
    expect(hasInfluence).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/mandate-progress.test.ts --reporter verbose`
Expected: FAIL — mandate progress is 0, no sphereInfluence on locations

**Step 3: Seed initial graph structures in worldSeed**

In `src/engine/worldSeed.ts`, add after the inter-actor relationships section (after line 414), before the return:

```typescript
// ── Seeded graph structures for mandate evaluation ──────────
// Add constructed_by edges (locations built by agents)
for (const locId of locationIds) {
  if (rng() < 0.5 && individualIds.length > 0) {
    const builderId = pickRandom(rng, individualIds);
    graph.addEdge({
      id: `edge_built_${locId}`,
      source: locId,
      target: builderId,
      type: 'constructed_by',
      properties: { tier: 1 },
    });
  }
}

// Add controls edges (factions control locations)
if (factionIds.length > 0) {
  for (const locId of locationIds) {
    if (rng() < 0.4) {
      const factionId = pickRandom(rng, factionIds);
      graph.addEdge({
        id: `edge_ctrl_${locId}`,
        source: factionId,
        target: locId,
        type: 'controls',
        properties: { strength: 0.3 + rng() * 0.5 },
      });
    }
  }
}

// Initialize sphereInfluence on locations
for (const locId of locationIds) {
  const locNode = graph.getNode(locId);
  if (locNode) {
    const influence: Record<string, number> = {};
    // Give each location a small starting influence in 1-2 random spheres
    const numSpheres = 1 + Math.floor(rng() * 2);
    for (let s = 0; s < numSpheres; s++) {
      const sphere = pickRandom(rng, SPHERE_NAMES);
      influence[sphere] = 0.1 + rng() * 0.2;
    }
    locNode.properties.sphereInfluence = influence;
  }
}
```

**Step 4: Agent actions increment sphere influence**

In `src/engine/orchestrator.ts`, inside `phaseAgentActions`, after pushing the agent action event, add sphere influence increment:

```typescript
// Increment sphere influence at agent's location
const agentLocationId = actor.properties.locationId as string | undefined;
if (agentLocationId) {
  const locNode = state.graph.getNode(agentLocationId);
  if (locNode) {
    const influence = (locNode.properties.sphereInfluence ?? {}) as Record<string, number>;
    influence[sphere] = (influence[sphere] ?? 0) + 0.02;
    locNode.properties.sphereInfluence = influence;
  }
}
```

**Step 5: Run tests**

Run: `npx vitest run --reporter verbose`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/engine/worldSeed.ts src/engine/orchestrator.ts src/engine/__tests__/mandate-progress.test.ts
git commit -m "feat: seed graph structures and sphere influence for mandate progress"
```

---

### Task 5: Agent Population Evolves

Add a lightweight lifecycle phase with death, birth, and migration mechanics.

**Files:**
- Create: `src/engine/agentLifecycle.ts`
- Modify: `src/engine/orchestrator.ts` (add phaseAgentLifecycle call in runTick)
- Test: create `src/engine/__tests__/agentLifecycle.test.ts`
- Test: create `src/engine/__tests__/lifecycle-integration.test.ts`

**Step 1: Write the failing unit tests**

Create `src/engine/__tests__/agentLifecycle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { agentDeath, agentBirth, agentMigration } from '../agentLifecycle';
// ... setup helpers

describe('agentDeath', () => {
  it('removes agent with reputation < 0.1 at 2% chance', () => {
    // Create graph with an agent at reputation 0.05
    // Run 100 iterations to confirm death can happen
    let died = false;
    for (let seed = 0; seed < 100; seed++) {
      // test logic...
    }
    expect(died).toBe(true);
  });

  it('does not remove agent with reputation >= 0.1', () => {
    // Agent at 0.5 reputation should never die from reputation
  });
});

describe('agentBirth', () => {
  it('creates new agent at location with >= 3 agents', () => {
    // Setup location with 3 agents
    // Run birth check
  });
});

describe('agentMigration', () => {
  it('moves agent to adjacent location', () => {
    // Setup agent at location with adjacent location
    // Run migration check
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/agentLifecycle.test.ts --reporter verbose`
Expected: FAIL — module does not exist

**Step 3: Create agentLifecycle.ts**

Create `src/engine/agentLifecycle.ts`:

```typescript
/**
 * Agent Lifecycle — lightweight population dynamics.
 *
 * Three mechanics per tick:
 * - Death: low-reputation agents have a small chance of dying
 * - Birth: dense locations can spawn new agents
 * - Migration: agents occasionally move to adjacent locations
 */
import type { WorldGraph } from './graph';
import type { TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';
import { assignCooperationStrategy } from './disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';

// ─── Constants ────────────────────────────────────────────────────

/** Reputation threshold below which death is possible */
export const DEATH_REPUTATION_THRESHOLD = 0.1;

/** Chance of death per tick for low-reputation agents */
export const DEATH_CHANCE_LOW_REP = 0.02;

/** Agent age (ticks) after which age-death kicks in */
export const DEATH_AGE_THRESHOLD = 200;

/** Chance of death per tick for old agents */
export const DEATH_CHANCE_OLD_AGE = 0.01;

/** Minimum agents at a location for birth to be possible */
export const BIRTH_LOCATION_DENSITY = 3;

/** Chance of birth per tick when density threshold is met */
export const BIRTH_CHANCE = 0.01;

/** Chance of migration per agent per tick */
export const MIGRATION_CHANCE = 0.02;

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

// ─── ID Generator ─────────────────────────────────────────────────

let lifecycleCounter = 0;
export function resetLifecycleCounter(): void {
  lifecycleCounter = 0;
}
function nextLifecycleId(): string {
  return `lifecycle_${++lifecycleCounter}`;
}

// ─── Names for new agents ─────────────────────────────────────────

const BORN_NAMES = [
  'Aelith', 'Bram', 'Calyx', 'Dusk', 'Ember', 'Fael',
  'Gwyn', 'Hale', 'Idris', 'Jael', 'Kael', 'Lira',
  'Maren', 'Nyx', 'Orin', 'Pyre', 'Quinn', 'Rowan',
];

// ─── Death ────────────────────────────────────────────────────────

export function agentDeath(
  graph: WorldGraph,
  tick: number,
  seed: number,
): TickEvent[] {
  const rng = mulberry32(seed + tick * 53);
  const events: TickEvent[] = [];

  const actors = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  for (const actor of actors) {
    const rep = (actor.properties.reputationScore as number) ?? DEFAULT_REPUTATION;
    const birthTick = (actor.properties.birthTick as number) ?? 0;
    const age = tick - birthTick;

    let shouldDie = false;

    // Low reputation death
    if (rep < DEATH_REPUTATION_THRESHOLD && rng() < DEATH_CHANCE_LOW_REP) {
      shouldDie = true;
    }

    // Old age death
    if (age > DEATH_AGE_THRESHOLD && rng() < DEATH_CHANCE_OLD_AGE) {
      shouldDie = true;
    }

    if (shouldDie) {
      // Remove all edges connected to this actor
      const outgoing = graph.getOutgoingEdges(actor.id);
      const incoming = graph.getIncomingEdges(actor.id);
      for (const edge of [...outgoing, ...incoming]) {
        graph.removeEdge(edge.id);
      }
      graph.removeNode(actor.id);

      events.push({
        id: nextLifecycleId(),
        tick,
        type: 'agent_death',
        message: `${actor.name} has passed from the world`,
        significance: 0.7,
      });
    }
  }

  return events;
}

// ─── Birth ────────────────────────────────────────────────────────

export function agentBirth(
  graph: WorldGraph,
  tick: number,
  seed: number,
  deathOccurred: boolean,
): TickEvent[] {
  if (deathOccurred) return []; // No birth on death ticks

  const rng = mulberry32(seed + tick * 67);
  const events: TickEvent[] = [];

  const locations = graph.getNodesByType('location');

  for (const loc of locations) {
    // Count agents at this location
    const agentsHere = graph.getIncomingEdges(loc.id, 'contains')
      .map(e => graph.getNode(e.source))
      .filter(n => n && n.properties.actorType === 'individual');

    if (agentsHere.length >= BIRTH_LOCATION_DENSITY && rng() < BIRTH_CHANCE) {
      const newId = `ind_born_${tick}_${loc.id}`;
      const name = BORN_NAMES[Math.floor(rng() * BORN_NAMES.length)];
      const archetype = NARRATIVE_ARCHETYPES[Math.floor(rng() * NARRATIVE_ARCHETYPES.length)];

      // Inherit dominant domain capabilities from location's agents (simplified)
      const domainCaps: Record<string, number> = {};
      const domains = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
      for (const d of domains) {
        domainCaps[d] = 10 + Math.floor(rng() * 31);
      }

      const profile: any = {};
      const pairs = [
        'ambition_contentment', 'courage_prudence', 'cruelty_compassion',
        'cunning_honesty', 'devotion_independence', 'loyalty_treachery',
        'tradition_innovation', 'dominance_humility', 'wrath_patience', 'greed_generosity',
      ];
      for (const pair of pairs) {
        profile[pair] = (rng() * 1.6) - 0.8;
      }

      const strategy = assignCooperationStrategy(archetype.id, profile, rng);

      graph.addNode({
        id: newId,
        type: 'actor',
        name,
        properties: {
          actorType: 'individual',
          axiologicalProfile: profile,
          domainCapabilities: domainCaps,
          locationId: loc.id,
          narrativeArchetype: archetype.id,
          cooperationStrategy: strategy,
          reputationScore: DEFAULT_REPUTATION,
          birthTick: tick,
        },
      });

      graph.addEdge({
        id: `edge_at_${newId}`,
        source: newId,
        target: loc.id,
        type: 'contains',
        properties: {},
      });

      events.push({
        id: nextLifecycleId(),
        tick,
        type: 'agent_birth',
        message: `${name} emerges in ${loc.name}`,
        significance: 0.6,
      });

      break; // Only one birth per tick
    }
  }

  return events;
}

// ─── Migration ────────────────────────────────────────────────────

export function agentMigration(
  graph: WorldGraph,
  tick: number,
  seed: number,
): TickEvent[] {
  const rng = mulberry32(seed + tick * 79);
  const events: TickEvent[] = [];

  const actors = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  for (const actor of actors) {
    if (rng() >= MIGRATION_CHANCE) continue;

    const locationId = actor.properties.locationId as string | undefined;
    if (!locationId) continue;

    // Find adjacent locations
    const adjEdges = [
      ...graph.getOutgoingEdges(locationId, 'adjacent'),
      ...graph.getIncomingEdges(locationId, 'adjacent'),
    ];

    if (adjEdges.length === 0) continue;

    // Pick a random adjacent location
    const adjEdge = adjEdges[Math.floor(rng() * adjEdges.length)];
    const targetLocId = adjEdge.source === locationId ? adjEdge.target : adjEdge.source;
    const targetLoc = graph.getNode(targetLocId);
    if (!targetLoc) continue;

    // Move: update contains edge
    const containsEdge = graph.getOutgoingEdges(actor.id, 'contains')
      .find(e => e.target === locationId)
      ?? graph.getIncomingEdges(actor.id, 'contains')
        .find(e => e.source === actor.id && e.target === locationId);

    // Try both directions for contains edge
    const outContains = graph.getOutgoingEdges(actor.id, 'contains');
    const edgeToRemove = outContains.find(e => e.target === locationId);

    if (edgeToRemove) {
      graph.removeEdge(edgeToRemove.id);
    } else {
      // Check incoming (contains edge might be source=actor, target=location)
      const inContains = graph.getIncomingEdges(locationId, 'contains');
      const altEdge = inContains.find(e => e.source === actor.id);
      if (altEdge) graph.removeEdge(altEdge.id);
    }

    graph.addEdge({
      id: `edge_at_${actor.id}_${tick}`,
      source: actor.id,
      target: targetLocId,
      type: 'contains',
      properties: {},
    });

    actor.properties.locationId = targetLocId;

    events.push({
      id: nextLifecycleId(),
      tick,
      type: 'agent_migration',
      message: `${actor.name} travels to ${targetLoc.name}`,
      significance: 0.3,
    });
  }

  return events;
}

// ─── Combined Phase ───────────────────────────────────────────────

export function phaseAgentLifecycle(
  graph: WorldGraph,
  tick: number,
  seed: number,
): TickEvent[] {
  const deathEvents = agentDeath(graph, tick, seed);
  const birthEvents = agentBirth(graph, tick, seed, deathEvents.length > 0);
  const migrationEvents = agentMigration(graph, tick, seed);
  return [...deathEvents, ...birthEvents, ...migrationEvents];
}
```

**Step 4: Run unit tests**

Run: `npx vitest run src/engine/__tests__/agentLifecycle.test.ts --reporter verbose`
Expected: PASS

**Step 5: Wire into orchestrator**

In `src/engine/orchestrator.ts`, add import:

```typescript
import { phaseAgentLifecycle } from './agentLifecycle';
```

In `runTick()`, add after Phase 2 (agent actions) and before Phase 2.5 (dilemma detection):

```typescript
// Phase 2.1: Agent Lifecycle (death, birth, migration)
const lifecycleEvents = phaseAgentLifecycle(s.graph, s.tick, s.seed);
s = { ...s, tickEvents: [...s.tickEvents, ...lifecycleEvents] };
phaseEventCounts['agent_lifecycle'] = lifecycleEvents.length;
```

**Step 6: Write integration test**

Create `src/engine/__tests__/lifecycle-integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';

describe('agent lifecycle integration', () => {
  it('agent count changes within 100 ticks', () => {
    resetEventCounter();
    const archetypes = generateArchetypes(4, 42);
    const cosmology = createBalancedCosmology();
    const { state: initial } = initializeGameState(archetypes[0], 'Test', cosmology, 42);

    const initialAgentCount = initial.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual').length;

    let state = initial;
    let anyLifecycleEvent = false;
    for (let i = 0; i < 100; i++) {
      state = runTick(state);
      if (state.tickEvents.some(e =>
        e.type === 'agent_death' || e.type === 'agent_birth' || e.type === 'agent_migration'
      )) {
        anyLifecycleEvent = true;
      }
    }

    expect(anyLifecycleEvent).toBe(true);
  });
});
```

**Step 7: Run full test suite**

Run: `npx vitest run --reporter verbose`
Expected: All PASS

**Step 8: Commit**

```bash
git add src/engine/agentLifecycle.ts src/engine/orchestrator.ts src/engine/__tests__/agentLifecycle.test.ts src/engine/__tests__/lifecycle-integration.test.ts
git commit -m "feat: agent lifecycle — death, birth, migration population dynamics"
```

---

### Task 6: Verification Playtest

Run the playtest with all 5 fixes applied and verify all success criteria from the design document.

**Files:**
- None modified — this is a verification step

**Step 1: Run all tests**

Run: `npx vitest run --reporter verbose`
Expected: All tests PASS

**Step 2: Run the verification playtest**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx esbuild scripts/playtest.ts --bundle --platform=node --outfile=scripts/playtest.mjs --format=esm --external:vitest && node scripts/playtest.mjs --seeds 42,7,100 --ticks 100`

**Step 3: Verify success criteria**

Read the generated report files in `Docs/playtests/` and check:

1. ✅ Doom clock reaches stage 2+ by tick 40 (with doomSpeed 3.6)
2. ✅ Agent action messages show varied prose (no identical messages in sequence)
3. ✅ At least 5 dilemma_resolved events across 100 ticks
4. ✅ Mandate progress > 0 by tick 50
5. ✅ Agent count changes (at least 1 birth, death, or migration) by tick 100
6. ✅ All existing tests still pass

If any criterion fails, diagnose and fix before committing.

**Step 4: Commit playtest reports**

```bash
git add Docs/playtests/
git commit -m "docs: verification playtest — golden path polish sprint"
```
