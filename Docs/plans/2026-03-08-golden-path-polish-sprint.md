# Golden Path Polish Sprint — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 5 critical/major playtest findings so the autonomous simulation feels alive — doom advances through all stages, prose varies per action, dilemmas fire regularly, mandates progress, and the population evolves.

**Architecture:** Each fix is an independent, scoped change to one or two engine files plus their tests. All changes are constant-tuning or logic-patching in existing modules — no new systems. The playtest runner validates all fixes in a final verification pass.

**Tech Stack:** TypeScript, Vitest, existing engine modules (orchestrator.ts, narrative.ts, disposition.ts, mandate.ts, doomClock.ts, worldSeed.ts)

---

## Root Cause Analysis

| Finding | Root Cause | Fix |
|---------|-----------|-----|
| #1 Doom frozen at stage 1 | `DEFAULT_DOOM_TICKS=360`, stage 2 needs tick 72 (20% of 360). Playtest ran 50 ticks — clock IS ticking but thresholds too high for short runs. Even at 100 ticks, only stage 2 reached. | Lower `DEFAULT_DOOM_TICKS` to 120 so all 5 stages are reachable in ~100 ticks |
| #2 Monotonous prose | `phaseAgentActions` hardcodes `"[Name] acted in realm of [sphere]"`. The narrative engine (`generateRoutineProse`) is never called for agent action events. | Call `generateRoutineProse` in `phaseAgentActions` to produce varied sphere-flavored prose |
| #3 No dilemmas | `DILEMMA_STAKES_THRESHOLD=0.6` requires gold(0.3)/iron(0.4) domain + another factor. Random spheres rarely hit gold/iron. Also, actor selection is broken — always picks `allActors[0]` instead of the event's actor. | Lower threshold to 0.3, fix actor extraction from event, widen domain bonus to more reaches |
| #4 Mandate stuck at 0 | All 9 mandates require player-created graph edges (`controls`, `constructed_by`, `allied_with`, `worships` tier 2+, `sphere_influence`). Autonomous sim never creates these. | Add 3 new "simulation-achievable" mandate templates using `edge_count` for `relates_to`/`member_of`/`belongs_to` edges that exist from world seeding |
| #5 Static population | No agent lifecycle code exists. Agents are created at seed time and never change. | Add `phaseAgentLifecycle` to orchestrator — probabilistic death (removes node), migration (changes location edge), and trait drift |

---

### Task 1: Fix Doom Clock Calibration

**Files:**
- Modify: `src/types/gameState.ts` — change `DEFAULT_DOOM_TICKS` from 360 to 120
- Modify: `src/engine/__tests__/gameState.test.ts` — update assertion
- Test: `src/engine/__tests__/doomClock.test.ts` — verify stage transitions at new scale

**Step 1: Write the failing test**

In `src/engine/__tests__/doomClock.test.ts`, add:

```typescript
it('reaches all 5 stages within 120 ticks at tickModifier 1.0', () => {
  let state = createDoomClockState('breach', 120);
  const stagesSeen = new Set<number>();
  for (let i = 0; i < 120; i++) {
    state = advanceDoomClock(state);
    stagesSeen.add(state.currentStage);
  }
  expect(stagesSeen).toEqual(new Set([1, 2, 3, 4, 5]));
  expect(state.expired).toBe(true);
});
```

**Step 2: Run test to verify it passes (this should pass already since advanceDoomClock is generic)**

Run: `npx vitest run src/engine/__tests__/doomClock.test.ts --reporter=verbose`

**Step 3: Update DEFAULT_DOOM_TICKS**

In `src/types/gameState.ts`, change:
```typescript
export const DEFAULT_DOOM_TICKS = 120;
```

**Step 4: Update the gameState test assertion**

In `src/engine/__tests__/gameState.test.ts`, change the assertion from `360` to `120`.

**Step 5: Run all doom-related tests**

Run: `npx vitest run src/engine/__tests__/doomClock.test.ts src/engine/__tests__/gameState.test.ts --reporter=verbose`
Expected: All pass

**Step 6: Commit**

```bash
git add src/types/gameState.ts src/engine/__tests__/gameState.test.ts src/engine/__tests__/doomClock.test.ts
git commit -m "fix: calibrate doom clock to 120 ticks — all 5 stages reachable in ~100-tick runs"
```

---

### Task 2: Wire Narrative Prose Engine into Agent Actions

**Files:**
- Modify: `src/engine/orchestrator.ts` — `phaseAgentActions` calls `generateRoutineProse`
- Test: `src/engine/__tests__/orchestrator.test.ts` or new `orchestrator-prose.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/orchestrator-prose.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { phaseAgentActions } from '../orchestrator';
// ... setup a minimal GameState with 3+ actors, run phaseAgentActions

describe('phaseAgentActions prose generation', () => {
  it('produces varied prose using sphere vocabulary instead of hardcoded template', () => {
    // Create minimal GameState with graph containing individual actors
    // Run phaseAgentActions
    // Check that NO event message matches the old pattern "[Name] acted in the realm of [sphere]."
    // Check that messages contain sphere-specific words from SPHERE_VOCABULARY
  });

  it('different seeds produce different prose for same sphere', () => {
    // Run with seed 42 and seed 99
    // Collect messages — they should differ
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/orchestrator-prose.test.ts --reporter=verbose`
Expected: FAIL — messages still match old hardcoded pattern

**Step 3: Modify phaseAgentActions to use narrative engine**

In `src/engine/orchestrator.ts`, import `generateRoutineProse` and call it:

```typescript
import { generateRoutineProse } from './narrative';

// Inside phaseAgentActions, replace:
//   message: `${actor.name} acted in the realm of ${sphere}.`,
// with:
const prose = generateRoutineProse('action_resolved', {
  actorName: actor.name,
  sphere,
  locationName: actor.properties?.locationId
    ? (state.graph.getNode(actor.properties.locationId as string)?.name ?? 'the realm')
    : 'the realm',
}, state.seed + state.tick * 31 + i);

events.push({
  id: nextEventId(),
  tick: state.tick,
  type: 'agent_action_resolved',
  message: prose.text,
  sphere,
  significance,
});
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/orchestrator-prose.test.ts --reporter=verbose`
Expected: PASS

**Step 5: Run full orchestrator tests to check no regressions**

Run: `npx vitest run src/engine/__tests__/orchestrator --reporter=verbose`

**Step 6: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-prose.test.ts
git commit -m "fix: wire narrative prose engine into agent actions — varied sphere-flavored prose"
```

---

### Task 3: Fix Dilemma Detection

**Files:**
- Modify: `src/types/disposition.ts` — lower `DILEMMA_STAKES_THRESHOLD` from 0.6 to 0.3
- Modify: `src/engine/orchestrator.ts` — fix actor extraction, widen domain bonuses
- Test: `src/engine/__tests__/orchestrator-dilemma.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/orchestrator-dilemma.test.ts`:

```typescript
describe('phaseDilemmaDetection fixes', () => {
  it('produces at least 1 dilemma event in 50 ticks with 10 agents', () => {
    // Set up GameState with 10 agents, run phaseDilemmaDetection
    // after phaseAgentActions has produced events
    // Count dilemma_resolved events across 50 ticks
    // Expect > 0
  });

  it('extracts correct actor from event message rather than always using allActors[0]', () => {
    // Create state with named actors
    // Check that dilemma actors match the agent_action_resolved event actors
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/orchestrator-dilemma.test.ts --reporter=verbose`

**Step 3: Fix the three issues**

**3a.** In `src/types/disposition.ts`:
```typescript
export const DILEMMA_STAKES_THRESHOLD = 0.3; // was 0.6
```

**3b.** In `src/engine/orchestrator.ts`, `phaseDilemmaDetection`:

Add domain bonuses for more reaches (shadow, heart, veil get partial bonuses):
```typescript
// Add to computeStakes call context or inline:
// Map more spheres to high-stakes domains
const SPHERE_TO_DOMAIN: Record<string, ReachDomain> = {
  force: 'iron', matter: 'stone', energy: 'iron',
  life: 'flesh', mind: 'eye', spirit: 'veil',
  time: 'star', entropy: 'shadow',
};
const domain = SPHERE_TO_DOMAIN[event.sphere ?? 'force'] ?? 'iron';
```

**3c.** Fix actor extraction — match actor from event message:
```typescript
// Instead of: const actor = allActors[0];
// Extract actor name from event message and find the matching actor
const actorName = event.message.split(' ')[0]; // First word is always actor name
const actor = allActors.find(a => a.name === actorName) ?? allActors[0];
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/orchestrator-dilemma.test.ts --reporter=verbose`

**Step 5: Run all disposition tests**

Run: `npx vitest run src/engine/__tests__/disposition --reporter=verbose`

**Step 6: Update the existing disposition test that asserts DILEMMA_STAKES_THRESHOLD = 0.6**

Check `src/engine/__tests__/disposition.test.ts` for any hardcoded 0.6 assertions and update to 0.3.

**Step 7: Commit**

```bash
git add src/types/disposition.ts src/engine/orchestrator.ts src/engine/__tests__/orchestrator-dilemma.test.ts
git commit -m "fix: lower dilemma stakes threshold to 0.3, fix actor extraction, widen domain mapping"
```

---

### Task 4: Add Achievable Mandate Conditions

**Files:**
- Modify: `src/data/mandate-content.ts` — add 3 new templates with conditions achievable by autonomous sim
- Modify: `src/engine/mandate.ts` — add `relationship_count` condition evaluator
- Test: `src/data/__tests__/mandate-content.test.ts`, `src/engine/__tests__/mandate.test.ts`

**Step 1: Write the failing test**

```typescript
describe('simulation-achievable mandates', () => {
  it('MANDATE_TEMPLATES includes at least 3 templates achievable without player input', () => {
    const achievable = MANDATE_TEMPLATES.filter(
      t => t.type === 'simulation_achievable'
    );
    expect(achievable.length).toBeGreaterThanOrEqual(3);
  });

  it('relationship_count condition evaluates correctly against seeded world', () => {
    // Seed a world, check that relates_to edges exist
    // Evaluate relationship_count condition — should find existing edges
  });
});
```

**Step 2: Design the 3 new mandates**

These use conditions based on edges that world seeding DOES create:
- `relates_to` — inter-actor relationships (created at ~30% rate between pairs)
- `member_of` — faction membership (created at ~70% rate)
- `belongs_to` — culture membership (created by culture generator)

New mandates:
1. **Threads of Fate** (`simulation_achievable`) — relationships form between agents. Conditions: 4/8/12 `relates_to` edges.
2. **The Gathering** (`simulation_achievable`) — factions grow. Conditions: 3/5/8 `member_of` edges.
3. **Cultural Convergence** (`simulation_achievable`) — cultures spread. Conditions: 3/6/10 `belongs_to` edges.

**Step 3: Add `relationship_count` condition type to mandate.ts**

In `evaluateCondition`:
```typescript
case 'relationship_count': {
  const { edgeType, minCount } = condition.params as {
    edgeType: string;
    minCount: number;
  };
  const edges = graph.getAllEdges().filter(e => e.type === edgeType);
  return edges.length >= minCount;
}
```

Note: this is functionally identical to `edge_count` — we can just reuse `edge_count` with the correct `edgeType`. The existing `edge_count` evaluator already works. So we just need the new mandate templates to use `edge_count` with `relates_to`, `member_of`, `belongs_to`.

**Step 4: Add templates to mandate-content.ts**

```typescript
const THREADS_OF_FATE: MandateTemplate = {
  id: 'mandate.threads_of_fate',
  type: 'simulation_achievable',
  name: 'Threads of Fate',
  description: 'Relationships form between mortals. Weave the web of destiny.',
  sphereAffinities: ['mind', 'spirit'],
  stages: [
    { stage: 'setup', description: '4 relationships form.', conditions: [
      { type: 'edge_count', description: '4+ relates_to edges', params: { edgeType: 'relates_to', minCount: 4 } }
    ]},
    { stage: 'escalation', description: '8 relationships form.', conditions: [
      { type: 'edge_count', description: '8+ relates_to edges', params: { edgeType: 'relates_to', minCount: 8 } }
    ]},
    { stage: 'culmination', description: '12 relationships form.', conditions: [
      { type: 'edge_count', description: '12+ relates_to edges', params: { edgeType: 'relates_to', minCount: 12 } }
    ]},
  ],
};

const THE_GATHERING: MandateTemplate = {
  id: 'mandate.the_gathering',
  type: 'simulation_achievable',
  name: 'The Gathering',
  description: 'Factions grow in strength and numbers. Loyalty draws the faithful.',
  sphereAffinities: ['force', 'spirit'],
  stages: [
    { stage: 'setup', description: '3 faction memberships.', conditions: [
      { type: 'edge_count', description: '3+ member_of edges', params: { edgeType: 'member_of', minCount: 3 } }
    ]},
    { stage: 'escalation', description: '5 faction memberships.', conditions: [
      { type: 'edge_count', description: '5+ member_of edges', params: { edgeType: 'member_of', minCount: 5 } }
    ]},
    { stage: 'culmination', description: '8 faction memberships.', conditions: [
      { type: 'edge_count', description: '8+ member_of edges', params: { edgeType: 'member_of', minCount: 8 } }
    ]},
  ],
};

const CULTURAL_CONVERGENCE: MandateTemplate = {
  id: 'mandate.cultural_convergence',
  type: 'simulation_achievable',
  name: 'Cultural Convergence',
  description: 'Cultures spread and take root. Identity becomes destiny.',
  sphereAffinities: ['life', 'mind'],
  stages: [
    { stage: 'setup', description: '3 cultural bonds.', conditions: [
      { type: 'edge_count', description: '3+ belongs_to edges', params: { edgeType: 'belongs_to', minCount: 3 } }
    ]},
    { stage: 'escalation', description: '6 cultural bonds.', conditions: [
      { type: 'edge_count', description: '6+ belongs_to edges', params: { edgeType: 'belongs_to', minCount: 6 } }
    ]},
    { stage: 'culmination', description: '10 cultural bonds.', conditions: [
      { type: 'edge_count', description: '10+ belongs_to edges', params: { edgeType: 'belongs_to', minCount: 10 } }
    ]},
  ],
};
```

**Step 5: Update mandateGenerator to prefer simulation-achievable mandates**

In `src/engine/mandateGenerator.ts`, add a weight multiplier for `simulation_achievable` mandates so they're more likely to be selected when no player input has occurred.

**Step 6: Run tests**

Run: `npx vitest run src/engine/__tests__/mandate --reporter=verbose`
Run: `npx vitest run src/data/__tests__/mandate --reporter=verbose`

**Step 7: Commit**

```bash
git add src/data/mandate-content.ts src/engine/mandateGenerator.ts src/engine/__tests__/mandate*.test.ts src/data/__tests__/mandate*.test.ts
git commit -m "fix: add 3 simulation-achievable mandates with conditions met by world seeding"
```

---

### Task 5: Add Agent Lifecycle Events

**Files:**
- Create: `src/engine/agentLifecycle.ts` — death, migration, trait drift functions
- Modify: `src/engine/orchestrator.ts` — add `phaseAgentLifecycle` between agent actions and dilemma detection
- Test: `src/engine/__tests__/agentLifecycle.test.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/agentLifecycle.test.ts`:

```typescript
describe('phaseAgentLifecycle', () => {
  it('produces at least 1 lifecycle event in 50 ticks with 10 agents', () => {
    // Run 50 iterations of phaseAgentLifecycle
    // Expect > 0 lifecycle events (death, migration, or trait_change)
  });

  it('agent death removes actor node from graph', () => {
    // Set death probability high, run lifecycle
    // Verify actor node is removed
  });

  it('migration changes agent location edge', () => {
    // Run lifecycle with migration
    // Verify contains edge target changed
  });
});
```

**Step 2: Create agentLifecycle.ts**

```typescript
// src/engine/agentLifecycle.ts

import type { GameState, TickEvent } from '../types/gameState';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────

/** Probability of an agent dying per tick */
export const DEATH_PROBABILITY_PER_TICK = 0.005; // ~1 death per 200 agent-ticks

/** Probability of an agent migrating per tick */
export const MIGRATION_PROBABILITY_PER_TICK = 0.02; // ~1 migration per 50 agent-ticks

/** Probability of a new relationship forming per tick (between any two unrelated agents at same location) */
export const RELATIONSHIP_FORMATION_PER_TICK = 0.03;

/** Minimum agents to keep alive (prevents empty world) */
export const MIN_AGENTS = 4;

export function phaseAgentLifecycle(
  state: GameState,
  rng: () => number,
  nextEventId: () => string,
): { events: TickEvent[]; removedActorIds: string[] } {
  const events: TickEvent[] = [];
  const removedActorIds: string[] = [];
  const graph = state.graph;

  const actors = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  const locationIds = graph.getNodesByType('location').map(n => n.id);
  if (locationIds.length === 0) return { events, removedActorIds };

  for (const actor of actors) {
    // ── Death ──
    if (actors.length - removedActorIds.length > MIN_AGENTS && rng() < DEATH_PROBABILITY_PER_TICK) {
      // Remove all edges connected to this actor
      const outEdges = graph.getOutgoingEdges(actor.id);
      const inEdges = graph.getIncomingEdges(actor.id);
      for (const e of [...outEdges, ...inEdges]) {
        graph.removeEdge(e.id);
      }
      graph.removeNode(actor.id);
      removedActorIds.push(actor.id);

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_lifecycle',
        message: `${actor.name} has passed from the world.`,
        significance: 0.6,
      });
      continue; // Dead agents don't migrate
    }

    // ── Migration ──
    if (rng() < MIGRATION_PROBABILITY_PER_TICK) {
      const currentLocId = actor.properties?.locationId as string | undefined;
      const newLocId = locationIds[Math.floor(rng() * locationIds.length)];
      if (newLocId !== currentLocId) {
        // Update location property
        actor.properties.locationId = newLocId;

        // Update contains edge
        const containsEdge = graph.getOutgoingEdges(actor.id, 'contains')
          .find(e => e.target === currentLocId) ??
          graph.getIncomingEdges(actor.id, 'contains')
            .find(e => true);
        // Actually the edge is source=actor, target=location with type 'contains'
        // Find and update or remove+add
        const edgesToRemove = graph.getOutgoingEdges(actor.id)
          .filter(e => e.type === 'contains');
        for (const e of edgesToRemove) graph.removeEdge(e.id);
        graph.addEdge({
          id: `edge_at_${actor.id}_${state.tick}`,
          source: actor.id,
          target: newLocId,
          type: 'contains',
          properties: {},
        });

        const newLoc = graph.getNode(newLocId);
        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'agent_lifecycle',
          message: `${actor.name} journeyed to ${newLoc?.name ?? 'unknown lands'}.`,
          significance: 0.3,
        });
      }
    }
  }

  // ── New Relationships ──
  // Agents at the same location may form new relationships
  const livingActors = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && !removedActorIds.includes(n.id));

  for (let i = 0; i < livingActors.length; i++) {
    for (let j = i + 1; j < livingActors.length; j++) {
      const a = livingActors[i];
      const b = livingActors[j];
      if (a.properties?.locationId !== b.properties?.locationId) continue;

      // Check if they already have a relationship
      const existing = graph.getOutgoingEdges(a.id, 'relates_to')
        .find(e => e.target === b.id) ??
        graph.getIncomingEdges(a.id, 'relates_to')
          .find(e => e.source === b.id);
      if (existing) continue;

      if (rng() < RELATIONSHIP_FORMATION_PER_TICK) {
        const sentiment = (rng() * 2) - 1;
        graph.addEdge({
          id: `edge_rel_${a.id}_${b.id}_${state.tick}`,
          source: a.id,
          target: b.id,
          type: 'relates_to',
          properties: {
            sentiment,
            strength: 0.2 + rng() * 0.3,
            basis: sentiment > 0 ? 'acquaintance' : 'tension',
          },
        });

        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'agent_lifecycle',
          message: sentiment > 0
            ? `${a.name} and ${b.name} formed a bond.`
            : `Tension grew between ${a.name} and ${b.name}.`,
          significance: 0.2,
        });
      }
    }
  }

  return { events, removedActorIds };
}
```

**Step 3: Wire into orchestrator**

In `src/engine/orchestrator.ts`, add between Phase 2 and Phase 2.5:

```typescript
import { phaseAgentLifecycle } from './agentLifecycle';

// In runTick, after phaseAgentActions:
// Phase 2.25: Agent Lifecycle
const lifecycleRng = mulberry32(state.seed + s.tick * 43);
const lifecycle = phaseAgentLifecycle(s, lifecycleRng, nextEventId);
s = { ...s, tickEvents: [...s.tickEvents, ...lifecycle.events] };
phaseEventCounts['agent_lifecycle'] = lifecycle.events.length;
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/agentLifecycle.test.ts --reporter=verbose`

**Step 5: Run full test suite**

Run: `npx vitest run --reporter=verbose`

**Step 6: Commit**

```bash
git add src/engine/agentLifecycle.ts src/engine/orchestrator.ts src/engine/__tests__/agentLifecycle.test.ts
git commit -m "feat: add agent lifecycle — death, migration, relationship formation per tick"
```

---

### Task 6: Verification Playtest

**Files:**
- Run: `npx tsx scripts/playtest.ts` with seeds 42, 7, 100 at 100 ticks

**Step 1: Run the playtest**

```bash
npx tsx scripts/playtest.ts --seeds 42,7,100 --ticks 100
```

**Step 2: Verify each finding is resolved**

Check the reports for:
1. ✅ Doom clock reaches stage 3+ by tick 100 (120 total ticks → stage 3 at tick 72, stage 4 at tick 96)
2. ✅ Agent action messages are NOT all identical — varied sphere vocabulary
3. ✅ At least 1 `dilemma_resolved` event per seed
4. ✅ Mandate progress > 0 for at least 1 seed
5. ✅ Agent count changes (deaths/migrations) visible in reports
6. ✅ Reputation values differ from 0.5 for at least some agents (downstream of dilemmas)
7. ✅ Essence still accumulates (no regression)

**Step 3: If any finding is NOT resolved, diagnose and fix before proceeding**

**Step 4: Commit playtest reports**

```bash
git add Docs/playtests/
git commit -m "test: verification playtest — all 7 findings resolved"
```

---

### Task 7: Documentation Updates

Use the `gamedocumenter` skill for the standard 3-layer update:

1. **CLAUDE.md** — update project status, engine stats, changelog
2. **Obsidian vault** — update affected system notes (Doom Clock, Narrative Engine, Disposition System, Mandate Tracker, add Agent Lifecycle note)
3. **Notion backlog** — mark Golden Path Sprint complete, update reference docs

---

## Execution Notes

- Tasks 1-5 are independent and can be executed in parallel by subagents
- Task 6 (verification) depends on all 5 being complete
- Task 7 (docs) depends on Task 6 verification passing
- All changes are additive except the constant changes (DEFAULT_DOOM_TICKS, DILEMMA_STAKES_THRESHOLD) — existing tests may need assertion updates
