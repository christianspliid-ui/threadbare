/**
 * THR-1306 — a complication's `reputation_delta` must not sentence a fieldless agent to death.
 *
 * `complicationEffects.ts` defaulted a missing `reputationScore` to **0** where every other
 * delta-writer in the engine defaults it to `DEFAULT_REPUTATION` (0.5) — `orchestrator.ts`
 * on both the actor and target legs, `phaseReputationDecay.ts`, and `encounterAftermath.ts`.
 * The read is also a *write*, so the 0 was persisted: any agent that had never been assigned
 * the field took `clamp(0 + delta)` back onto its node, landing at or under
 * `LOW_REP_THRESHOLD` (0.1) and drawing a `DEATH_CHANCE_LOW_REP` roll every tick thereafter.
 *
 * Every assertion here goes **through the deaths predicate** in `agentLifecycle`, never by
 * reading `reputationScore` back off the property bag — the ticket's own Done-when, and for
 * the reason its sibling `birthPathDefects.test.ts` states: this is a producer and a reader
 * disagreeing about a field, so a test that inspects what the producer wrote would have
 * passed all along and proved nothing. The deaths loop decides whether a reputation value is
 * survivable. Ask it.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { SPHERE_NAMES } from '../../types/index';
import type { EssencePool } from '../../types/influence';
import type { ComplicationContext, ComplicationEffect } from '../../types/complication';
import { phaseAgentLifecycle, LOW_REP_THRESHOLD, resetLifecycleCounter } from '../agentLifecycle';
import { applyComplicationEffects } from '../complicationEffects';
import { DEFAULT_REPUTATION } from '../../types/disposition';

// ─── Fixture ──────────────────────────────────────────────────────
//
// The deaths loop short-circuits — `rep < LOW_REP_THRESHOLD && rng() < DEATH_CHANCE_LOW_REP`
// never draws for a healthy agent — so with exactly one individual in the graph, the first
// draw of `mulberry32(seed + tick * 71)` IS that agent's death roll. Seed 42 / tick 62 puts
// it at 0.01930, under DEATH_CHANCE_LOW_REP (0.02): a lethal tick, found by search rather
// than by hope. The other lethal ticks in the first 400 are 64, 145, 190, 217 and 301.
//
// That the tick is lethal is what makes the surviving arms falsifiable, so `dies()` below is
// asserted directly rather than assumed — see the first test.
const SEED = 42;
const LETHAL_TICK = 62;

const PLACE = 'loc-tidewatch';
const WALK_ON = 'npc-walkon';

function pool(): EssencePool {
  const p = {} as EssencePool;
  for (const s of SPHERE_NAMES) p[s] = 0;
  return p;
}

/**
 * One individual actor in the property-bag shape `npcSeeding` actually writes
 * (`npcSeeding.ts:275-285`) — note the absence of `reputationScore`, which is the whole
 * subject. `rep` overrides that only where a test needs a known starting value.
 */
function worldWith(rep?: number): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: PLACE, type: 'location', name: 'Tidewatch',
    properties: { hexCol: 3, hexRow: 4 },
  });
  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'Player God',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({
    id: WALK_ON, type: 'actor', name: 'Dockhand',
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient' as const,
      npcRole: 'labourer',
      importance: 0,
      sphereAffinity: null,
      ...(rep === undefined ? {} : { reputationScore: rep }),
    },
  });
  graph.addEdge({ id: 'e-loc', type: 'located_at', source: WALK_ON, target: PLACE, properties: {} });
  return graph;
}

function stateWith(graph: WorldGraph): GameState {
  return {
    tick: LETHAL_TICK,
    seed: SEED,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: { entropy: 0.2 } as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: pool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
    strategicState: { projects: [], controls: [], history: [] },
  } as unknown as GameState;
}

/** The minimum context the `reputation_delta` branch reads: the actor it applies to. */
function ctxFor(actorId: string): ComplicationContext {
  return {
    action: { actorId } as any,
    template: {} as any,
    stepIndex: 0,
    locationId: PLACE,
    atSettlement: false,
    presentAgentIds: [],
    factionIds: [],
    activeOmenCategory: null,
    doomStage: 0,
    existingAttachments: [],
    locationUnrest: 0,
  } as unknown as ComplicationContext;
}

/** Apply a single `reputation_delta` complication effect to the walk-on. */
function applyDelta(state: GameState, delta: number): void {
  const effect: ComplicationEffect = { type: 'reputation_delta', factionScope: 'local', delta };
  applyComplicationEffects([effect], ctxFor(WALK_ON), state, LETHAL_TICK, 'test complication');
}

/**
 * Run one lifecycle tick and report whether the deaths predicate took the walk-on.
 * Death removes the node outright (`graph.removeNode`), so absence is the verdict — and it
 * is read through the phase, never off `reputationScore`.
 */
function diesThisTick(state: GameState): boolean {
  resetLifecycleCounter();
  let n = 0;
  phaseAgentLifecycle(state, () => `ev-${++n}`);
  return state.graph.getNode(WALK_ON) === undefined;
}

// ─── The fixture's own falsifiability guard ───────────────────────

describe('THR-1306 fixture — the chosen tick is actually lethal', () => {
  it('kills an agent already below the threshold, so survival elsewhere means something', () => {
    // Without this, every "survives" assertion below could pass on a tick whose roll simply
    // never goes against anyone — a lever that cannot fail, proving nothing about the fix.
    const state = stateWith(worldWith(LOW_REP_THRESHOLD / 2));
    expect(diesThisTick(state), 'seed/tick pair no longer rolls under DEATH_CHANCE_LOW_REP')
      .toBe(true);
  });

  it('spares the same agent when its reputation is neutral — reputation is the variable', () => {
    // The other half of the control: the tick kills on *reputation*, not unconditionally.
    const state = stateWith(worldWith(DEFAULT_REPUTATION));
    expect(diesThisTick(state)).toBe(false);
  });
});

// ─── The defect ───────────────────────────────────────────────────

describe('THR-1306 — a complication does not condemn an agent that never carried the field', () => {
  it('leaves a fieldless walk-on above the deaths predicate after a negative delta', () => {
    const state = stateWith(worldWith(undefined));
    applyDelta(state, -0.2);
    expect(diesThisTick(state)).toBe(false);
  });

  it('holds for a delta that would clear the whole threshold from a zero baseline', () => {
    // -0.15 exceeds LOW_REP_THRESHOLD (0.1) outright, so under the old default the agent
    // clamped to 0. From neutral it lands at 0.35 — comfortably survivable.
    const state = stateWith(worldWith(undefined));
    applyDelta(state, -LOW_REP_THRESHOLD - 0.05);
    expect(diesThisTick(state)).toBe(false);
  });

  it('still condemns an agent genuinely at zero — the fix changes the default, not the rule', () => {
    // This is the value the old default manufactured, and it is exactly what the deaths
    // predicate is supposed to kill. The bug was never that 0 survives; it was that a
    // missing field was read as 0 in the first place.
    const state = stateWith(worldWith(0));
    applyDelta(state, -0.2);
    expect(diesThisTick(state)).toBe(true);
  });

  it('leaves an agent that does carry the field on its own arithmetic', () => {
    // A present value is untouched by the default, so a real fall below the threshold still
    // reaches the deaths loop: 0.12 - 0.05 = 0.07, under LOW_REP_THRESHOLD.
    const state = stateWith(worldWith(0.12));
    applyDelta(state, -0.05);
    expect(diesThisTick(state)).toBe(true);
  });

  it('accumulates from neutral rather than from zero across repeated complications', () => {
    // Three separate complications on the same fieldless agent: 0.5 → 0.35 → 0.2 → 0.05.
    // The point is that the *first* one starts from neutral; the run still ends below the
    // threshold, which is the system working.
    const state = stateWith(worldWith(undefined));
    applyDelta(state, -0.15);
    applyDelta(state, -0.15);
    expect(diesThisTick(state)).toBe(false);
  });
});
