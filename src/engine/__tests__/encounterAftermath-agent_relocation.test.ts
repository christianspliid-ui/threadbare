/**
 * THR-1142 — `agent_relocation`: encounters can send people somewhere.
 *
 * Covers the write (both modes, all four destination kinds, sentinels, residence),
 * the reader (`computeRelocationIntentBonus` steering the movement scoring), and
 * the lifecycle (arrival, expiry, TTL). Every fail-soft row of the plan doc's table
 * has a case here.
 *
 * ## Falsification
 *
 * Two guards in this file were falsified before being trusted, because both assert
 * things that a plausible-looking implementation gets wrong silently:
 *
 *  • `describe('the reader — wired into scoreAndSelect')` — reverting the
 *    `+ relocationBonus` term in `encounterScoring.ts` makes "an intent re-ranks
 *    the encounter board" fail. This one exists because the *unit* tests below it
 *    do NOT: they call `computeRelocationIntentBonus` directly, so the whole suite
 *    passed with the reader disconnected from the scorer when that was checked.
 *    A write with no reader is Law 56's hollowness one level down, and only an
 *    end-to-end assertion through the real scorer can see the wire.
 *  • `describe('the lifecycle')` — deleting the arrival branch in
 *    `resolveRelocationIntentForAgent` makes "clears the intent on arrival" fail;
 *    deleting the expiry branch makes "abandons an unreachable destination" fail
 *    and would leave agents walking forever.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import {
  computeRelocationIntentBonus,
  readRelocationIntent,
  readStoredRelocationIntent,
  resolveRelocationIntentForAgent,
  resolveRelocationDestination,
  RELOCATION_INTENT_PROP,
} from '../relocationIntent';
import {
  RELOCATION_INTENT_TTL_TICKS,
  RELOCATION_INTENT_SCORE_WEIGHT,
} from '../../data/movement-content';
import { scoreAndSelect } from '../encounterScoring';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import type { ValuePair } from '../../types/agent';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

/** Minimal viable cache entry — the scoring integration arms vary only id and location. */
const BASE_ENTRY: EncounterCacheEntry = {
  templateId: 'tmpl', locationId: 'loc-home', sublocationId: null, sublocationTypeId: null,
  reachPrimary: 'iron' as ReachDomain, reachSecondary: 'gold' as ReachDomain,
  threatRating: 'moderate' as never, encounterType: 'combat' as never,
  motivations: ['mercy_ruthlessness'] as ValuePair[],
  requiresPresence: true, remotePenalty: 0, questPriority: 1.0, isQuestEncounter: false,
  totalTickCost: 3, successRewardEstimate: 2.0,
  stepCount: 1, stepDifficulties: [0.5], stepReaches: ['iron'] as ReachDomain[],
};

/**
 * A small map with real hex spacing so distance assertions mean something:
 *
 *   loc-home   (0,0)  — where the actor starts; a `town`
 *   loc-near   (2,0)  — nearest settlement to home, a `hamlet`
 *   loc-far    (9,0)  — 9 hexes out, a `city`
 *   loc-ruin   (3,0)  — NOT a settlement; proves nearest_settlement filters subtype
 *   loc-nohex  —       a location with no coordinates, for the fail-soft row
 */
function buildState(opts: { actorLocated?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Maret',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc-home', type: 'location', name: 'Home', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'town' } });
  graph.addNode({ id: 'loc-near', type: 'location', name: 'Near Hamlet', properties: { hexCol: 2, hexRow: 0, locationSubtype: 'hamlet' } });
  graph.addNode({ id: 'loc-far', type: 'location', name: 'Far City', properties: { hexCol: 9, hexRow: 0, locationSubtype: 'city' } });
  graph.addNode({ id: 'loc-ruin', type: 'location', name: 'Old Ruin', properties: { hexCol: 3, hexRow: 0, locationSubtype: 'ruins' } });
  graph.addNode({ id: 'loc-nohex', type: 'location', name: 'Nowhere', properties: { locationSubtype: 'town' } });
  if (opts.actorLocated !== false) {
    graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: 'loc-home', type: 'located_at', properties: {} });
  }
  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'actor-hero', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId: 'enc.departure',
    targetId: 'actor-hero', scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    ...over,
  } as UnifiedAction;
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-departure', label: 'She Takes the East Road', effects } as EncounterAftermathReaction;
}

function apply(
  state: GameState,
  effects: EncounterAftermathReactionEffect[],
  runtime: SimulationRuntime,
  action: UnifiedAction = makeAction(),
  tick = 50,
) {
  return applyEncounterAftermathReaction(state, action, makeReaction(effects), tick, runtime);
}

const intentOf = (state: GameState, agentId = 'actor-hero') =>
  readStoredRelocationIntent(state.graph.getNode(agentId));

const locationOf = (state: GameState, agentId = 'actor-hero') =>
  state.graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;

describe('agent_relocation — the write', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('travel mode writes an intent and does NOT move the agent', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime);

    const intent = intentOf(result.state);
    expect(intent).not.toBeNull();
    expect(intent!.destinationNodeId).toBe('loc-far');
    expect(intent!.destinationHex).toEqual({ col: 9, row: 0 });
    expect(intent!.source).toBe('aftermath');
    expect(intent!.templateId).toBe('enc.departure');
    expect(intent!.setAtTick).toBe(50);
    expect(intent!.expiresAtTick).toBe(50 + RELOCATION_INTENT_TTL_TICKS);

    // The load-bearing half: nobody teleported. The journey is the point.
    expect(locationOf(result.state)).toBe('loc-home');
    expect(result.mutationSummary.touchedWorld).toBe(true);
  });

  it('travel mode is the default when no mode is authored', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime);
    expect(intentOf(result.state)).not.toBeNull();
    expect(locationOf(result.state)).toBe('loc-home');
  });

  it('honours an authored ttlTicks over the default', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'location', locationId: 'loc-far' },
      ttlTicks: 5,
    }], runtime);
    expect(intentOf(result.state)!.expiresAtTick).toBe(55);
  });

  it('instant mode retargets located_at immediately and writes no intent', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'location', locationId: 'loc-far' },
      mode: 'instant',
    }], runtime);

    expect(locationOf(result.state)).toBe('loc-far');
    expect(intentOf(result.state)).toBeNull();
    // Position is a single edge — the old one must be gone, not merely outnumbered.
    expect(result.state.graph.getOutgoingEdges('actor-hero', 'located_at')).toHaveLength(1);
    expect(result.mutationSummary.touchedStructure).toBe(true);
  });

  it('instant mode to a bare hex fails soft — a hex is not a located_at target', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'hex', col: 4, row: 4 },
      mode: 'instant',
    }], runtime);

    expect(locationOf(result.state)).toBe('loc-home');
    const trace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'agent_relocation');
    expect((trace as { failReason?: string }).failReason).toBe('instant_requires_location');
  });

  it('residence: set_destination observes the new position on an instant move', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'location', locationId: 'loc-far' },
      mode: 'instant',
      residence: 'set_destination',
    }], runtime);
    expect(result.state.graph.getNode('actor-hero')!.properties.residencePositionId).toBe('loc-far');
  });

  it('residence: unchanged (the default) leaves residence unobserved', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'location', locationId: 'loc-far' },
      mode: 'instant',
    }], runtime);
    expect(result.state.graph.getNode('actor-hero')!.properties.residencePositionId).toBeUndefined();
  });

  it('a travel intent records the residence request for arrival rather than stamping it now', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation',
      destination: { kind: 'location', locationId: 'loc-far' },
      residence: 'set_destination',
    }], runtime);
    expect(intentOf(result.state)!.stampResidenceOnArrival).toBe(true);
    // Not stamped yet — they have not arrived. THR-822: residence is observed, never predicted.
    expect(result.state.graph.getNode('actor-hero')!.properties.residencePositionId).toBeUndefined();
  });

  it('emits the aftermath_agent_relocation trace with the destination', () => {
    const state = buildState();
    apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime);
    const trace = getTraces().find(t => t.category === 'aftermath_agent_relocation');
    expect(trace).toBeDefined();
    expect((trace as { destination?: string }).destination).toBe('Far City');
    expect((trace as { mode?: string }).mode).toBe('travel');
  });
});

describe('agent_relocation — destination kinds', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('hex destination resolves without needing a location node', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'hex', col: 6, row: 3 },
    }], runtime);
    const intent = intentOf(result.state)!;
    expect(intent.destinationHex).toEqual({ col: 6, row: 3 });
    expect(intent.destinationNodeId).toBeUndefined();
  });

  it('nearest_settlement picks the closest settlement, skipping non-settlements and the current hex', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'nearest_settlement' },
    }], runtime);
    // loc-home is distance 0 (excluded — going nowhere is not a relocation);
    // loc-ruin at distance 3 is closer than loc-far but is not a settlement.
    expect(intentOf(result.state)!.destinationNodeId).toBe('loc-near');
  });

  it('away respects minHexDistance', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'away', minHexDistance: 5 },
    }], runtime);
    // Only loc-far (9 hexes) clears a 5-hex floor.
    expect(intentOf(result.state)!.destinationNodeId).toBe('loc-far');
  });

  it('away is deterministic for the same seed, tick and effect site (NFP #3)', () => {
    const runA = apply(buildState(), [{
      kind: 'agent_relocation', destination: { kind: 'away', minHexDistance: 1 },
    }], createSimulationRuntime());
    const runB = apply(buildState(), [{
      kind: 'agent_relocation', destination: { kind: 'away', minHexDistance: 1 },
    }], createSimulationRuntime());
    expect(intentOf(runA.state)!.destinationNodeId).toBe(intentOf(runB.state)!.destinationNodeId);
  });

  it('away with no candidate far enough fails soft', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'away', minHexDistance: 50 },
    }], runtime);
    expect(intentOf(result.state)).toBeNull();
    const trace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'agent_relocation');
    expect((trace as { failReason?: string }).failReason).toBe('destination_unresolvable');
  });

  it('a location with no hex fails soft rather than writing a broken intent', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-nohex' },
    }], runtime);
    expect(intentOf(result.state)).toBeNull();
  });

  it('a missing location id fails soft', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-does-not-exist' },
    }], runtime);
    expect(intentOf(result.state)).toBeNull();
  });

  it('an unplaced agent cannot resolve a relative destination', () => {
    const state = buildState({ actorLocated: false });
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'nearest_settlement' },
    }], runtime);
    expect(intentOf(result.state)).toBeNull();
  });
});

describe('agent_relocation — sentinels', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('binds a $target destination to the action target location', () => {
    const state = buildState();
    const result = apply(
      state,
      [{ kind: 'agent_relocation', destination: { kind: 'location', locationId: '$target' } }],
      runtime,
      makeAction({ targetId: 'loc-far' }),
    );
    expect(intentOf(result.state)!.destinationNodeId).toBe('loc-far');
  });

  it('binds a $cast:<key> destination through the action support bindings', () => {
    const state = buildState();
    const result = apply(
      state,
      [{ kind: 'agent_relocation', destination: { kind: 'location', locationId: '$cast:refuge' } }],
      runtime,
      makeAction({ supportBindings: [{ key: 'refuge', nodeId: 'loc-near' }] } as unknown as Partial<UnifiedAction>),
    );
    expect(intentOf(result.state)!.destinationNodeId).toBe('loc-near');
  });

  it('leaves an unresolvable destination sentinel unbound and no-ops (resolve, never trust)', () => {
    const state = buildState();
    const result = apply(
      state,
      [{ kind: 'agent_relocation', destination: { kind: 'location', locationId: '$cast:missing' } }],
      runtime,
    );
    expect(intentOf(result.state)).toBeNull();
  });

  it('a $target that names something with no hex does not bind', () => {
    const state = buildState();
    const result = apply(
      state,
      [{ kind: 'agent_relocation', destination: { kind: 'location', locationId: '$target' } }],
      runtime,
      makeAction({ targetId: 'loc-nohex' }),
    );
    expect(intentOf(result.state)).toBeNull();
  });

  it('relocates a cast member rather than the actor when targetAgentId names one', () => {
    const state = buildState();
    state.graph.addNode({ id: 'actor-kin', type: 'actor', name: 'Kin', properties: { actorType: 'individual' } });
    state.graph.addEdge({ id: 'kin_loc', source: 'actor-kin', target: 'loc-home', type: 'located_at', properties: {} });

    const result = apply(
      state,
      [{ kind: 'agent_relocation', targetAgentId: '$cast:kin', destination: { kind: 'location', locationId: 'loc-far' } }],
      runtime,
      makeAction({ supportBindings: [{ key: 'kin', nodeId: 'actor-kin' }] } as unknown as Partial<UnifiedAction>),
    );

    expect(intentOf(result.state, 'actor-kin')).not.toBeNull();
    expect(intentOf(result.state, 'actor-hero')).toBeNull();
  });

  it('a non-agent relocation target fails soft', () => {
    const state = buildState();
    apply(state, [{
      kind: 'agent_relocation', targetAgentId: 'loc-far',
      destination: { kind: 'location', locationId: 'loc-near' },
    }], runtime);
    const trace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect'
      && (t as { effectKind?: string }).effectKind === 'agent_relocation');
    expect((trace as { failReason?: string }).failReason).toBe('non_agent_target');
  });
});

describe('agent_relocation — the reader, wired into scoreAndSelect', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  /** Two otherwise-identical candidates, one at the destination hex and one at home. */
  const twinCandidates = (): EncounterCacheEntry[] => [
    { ...BASE_ENTRY, templateId: 'at_home', locationId: 'loc-home' },
    { ...BASE_ENTRY, templateId: 'at_destination', locationId: 'loc-far' },
  ];

  const scoreOf = (state: GameState, entries: EncounterCacheEntry[], tick: number) => {
    const result = scoreAndSelect(entries, 'actor-hero', 'loc-home', state.graph, tick);
    const byId = (id: string) =>
      result.rankedCandidates.find(c => c.entry.templateId === id)?.finalScore ?? 0;
    return { home: byId('at_home'), destination: byId('at_destination'), selected: result.selected };
  };

  it('an intent re-ranks the encounter board toward the destination', () => {
    // Baseline: with no intent, the distant candidate loses on travel cost.
    const before = scoreOf(buildState(), twinCandidates(), 50);
    expect(before.destination).toBeLessThan(before.home);

    // The ending sends them east. Same world, same candidates — the board moves.
    const after = apply(buildState(), [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime).state;
    const withIntent = scoreOf(after, twinCandidates(), 50);

    expect(withIntent.destination).toBeGreaterThan(before.destination);

    // What steers is the *differential*, not the raw gain. `W / (1 + distance)` is
    // non-zero everywhere, so the home candidate picks up a little too (0.05 at 9
    // hexes) — the pull is a gradient across the map, not a spotlight on one tile,
    // exactly as the convergence bonus it is modelled on. The assertion that means
    // something is that the destination gains strictly more, closing the gap:
    const destinationGain = withIntent.destination - before.destination;
    const homeGain = withIntent.home - before.home;
    expect(destinationGain).toBeGreaterThan(homeGain);
    expect(before.home - before.destination).toBeGreaterThan(withIntent.home - withIntent.destination);
  });

  it('the destination candidate gains exactly the tunable weight at distance 0 (NFP #1)', () => {
    const before = scoreOf(buildState(), twinCandidates(), 50);
    const after = apply(buildState(), [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime).state;
    const withIntent = scoreOf(after, twinCandidates(), 50);

    // loc-far IS the destination hex, so the decayed pull is at its peak.
    expect(withIntent.destination - before.destination).toBeCloseTo(RELOCATION_INTENT_SCORE_WEIGHT, 6);
  });

  it('an expired intent leaves the board exactly as it was', () => {
    const before = scoreOf(buildState(), twinCandidates(), 60);
    const after = apply(buildState(), [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' }, ttlTicks: 5,
    }], runtime).state;
    const lapsed = scoreOf(after, twinCandidates(), 60);

    expect(lapsed.destination).toBeCloseTo(before.destination, 10);
    expect(lapsed.home).toBeCloseTo(before.home, 10);
  });
});

describe('agent_relocation — the reader (movement scoring)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('pulls the agent toward the destination — nearer candidates score strictly higher', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime);
    const node = result.state.graph.getNode('actor-hero');

    const atDestination = computeRelocationIntentBonus(node, 9, 0, 50);
    const halfway = computeRelocationIntentBonus(node, 5, 0, 50);
    const atHome = computeRelocationIntentBonus(node, 0, 0, 50);

    expect(atDestination).toBeGreaterThan(halfway);
    expect(halfway).toBeGreaterThan(atHome);
    // Peak equals the tunable weight exactly — the constant IS the knob (NFP #1).
    expect(atDestination).toBeCloseTo(RELOCATION_INTENT_SCORE_WEIGHT, 10);
  });

  it('contributes exactly zero for an agent with no intent — pre-THR-1142 scores are unchanged', () => {
    const state = buildState();
    expect(computeRelocationIntentBonus(state.graph.getNode('actor-hero'), 9, 0, 50)).toBe(0);
  });

  it('contributes zero once the intent has expired', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' }, ttlTicks: 5,
    }], runtime);
    const node = result.state.graph.getNode('actor-hero');
    expect(computeRelocationIntentBonus(node, 9, 0, 54)).toBeGreaterThan(0);
    expect(computeRelocationIntentBonus(node, 9, 0, 55)).toBe(0);
  });

  it('fails soft on a missing agent or a candidate with no hex', () => {
    const state = buildState();
    apply(state, [{ kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' } }], runtime);
    const node = state.graph.getNode('actor-hero');
    expect(computeRelocationIntentBonus(undefined, 9, 0, 50)).toBe(0);
    expect(computeRelocationIntentBonus(node, undefined, undefined, 50)).toBe(0);
  });

  it('readRelocationIntent hides an expired intent; readStoredRelocationIntent still sees it', () => {
    const state = buildState();
    const result = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' }, ttlTicks: 2,
    }], runtime);
    const node = result.state.graph.getNode('actor-hero');
    expect(readRelocationIntent(node, 60)).toBeNull();
    expect(readStoredRelocationIntent(node)).not.toBeNull();
  });

  it('a malformed stored intent reads as absent rather than throwing downstream', () => {
    const state = buildState();
    state.graph.updateNode('actor-hero', { properties: { [RELOCATION_INTENT_PROP]: { nonsense: true } } });
    const node = state.graph.getNode('actor-hero');
    expect(readStoredRelocationIntent(node)).toBeNull();
    expect(computeRelocationIntentBonus(node, 9, 0, 50)).toBe(0);
  });
});

describe('agent_relocation — the lifecycle', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('reports travelling while the agent is still en route', () => {
    const state = buildState();
    const after = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime).state;
    expect(resolveRelocationIntentForAgent(after, 'actor-hero', 51).outcome).toBe('travelling');
    expect(intentOf(after)).not.toBeNull();
  });

  it('clears the intent on arrival', () => {
    const state = buildState();
    const after = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime).state;

    // Walk them there the way the movement system would — retarget located_at.
    after.graph.removeEdge('hero_loc');
    after.graph.addEdge({ id: 'hero_loc2', source: 'actor-hero', target: 'loc-far', type: 'located_at', properties: {} });

    const resolved = resolveRelocationIntentForAgent(after, 'actor-hero', 60);
    expect(resolved.outcome).toBe('arrived');
    expect(intentOf(after)).toBeNull();
  });

  it('arrival is hex-granular — any location on the destination hex counts', () => {
    const state = buildState();
    state.graph.addNode({
      id: 'loc-far-annex', type: 'location', name: 'Far Annex',
      properties: { hexCol: 9, hexRow: 0, locationSubtype: 'shrine' },
    });
    const after = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime).state;

    after.graph.removeEdge('hero_loc');
    after.graph.addEdge({ id: 'hero_loc2', source: 'actor-hero', target: 'loc-far-annex', type: 'located_at', properties: {} });

    expect(resolveRelocationIntentForAgent(after, 'actor-hero', 60).outcome).toBe('arrived');
  });

  it('abandons an unreachable destination when the TTL lapses — nobody walks forever', () => {
    const state = buildState();
    const after = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' }, ttlTicks: 5,
    }], runtime).state;

    expect(resolveRelocationIntentForAgent(after, 'actor-hero', 54).outcome).toBe('travelling');
    const lapsed = resolveRelocationIntentForAgent(after, 'actor-hero', 55);
    expect(lapsed.outcome).toBe('expired');
    expect(intentOf(after)).toBeNull();
  });

  it('arriving on the very tick the intent lapses counts as arrival, not failure', () => {
    const state = buildState();
    const after = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' }, ttlTicks: 5,
    }], runtime).state;

    after.graph.removeEdge('hero_loc');
    after.graph.addEdge({ id: 'hero_loc2', source: 'actor-hero', target: 'loc-far', type: 'located_at', properties: {} });

    expect(resolveRelocationIntentForAgent(after, 'actor-hero', 55).outcome).toBe('arrived');
  });

  it('reports none for an agent who was never sent anywhere', () => {
    const state = buildState();
    expect(resolveRelocationIntentForAgent(state, 'actor-hero', 50).outcome).toBe('none');
  });

  it('a second relocation replaces the first intent rather than stacking', () => {
    const state = buildState();
    const once = apply(state, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-far' },
    }], runtime).state;
    const twice = apply(once, [{
      kind: 'agent_relocation', destination: { kind: 'location', locationId: 'loc-near' },
    }], runtime, makeAction(), 52).state;

    expect(intentOf(twice)!.destinationNodeId).toBe('loc-near');
    expect(intentOf(twice)!.setAtTick).toBe(52);
  });
});

describe('resolveRelocationDestination — direct unit coverage', () => {
  it('returns null for every unresolvable shape rather than throwing (NFP #4)', () => {
    const state = buildState({ actorLocated: false });
    const rng = () => 0;
    expect(resolveRelocationDestination(state.graph, 'actor-hero', { kind: 'nearest_settlement' }, rng)).toBeNull();
    expect(resolveRelocationDestination(state.graph, 'actor-hero', { kind: 'away', minHexDistance: 1 }, rng)).toBeNull();
    expect(resolveRelocationDestination(state.graph, 'actor-hero', { kind: 'location', locationId: 'nope' }, rng)).toBeNull();
    // A bare hex needs nothing from the world — it resolves even for an unplaced agent.
    expect(resolveRelocationDestination(state.graph, 'actor-hero', { kind: 'hex', col: 1, row: 1 }, rng)).not.toBeNull();
  });
});
