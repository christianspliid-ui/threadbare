/**
 * THR-552: Stone / The Great Work reach-signature aftermath effect
 * (`spawn_unique_location`).
 *
 * Covers: minting a unique `location` node with an `owns` edge (THR-1297 migrated
 * this writer off `controls` — the agent MADE the place, so it is theirs, not merely
 * under their jurisdiction; the assertion below follows the contract rather than
 * staying green on its dead side), uniqueTag
 * dedup (second cast is a no-op), hex placement precedence (explicit > nearAgent
 * > actor), legendary-artifact reuse (`spawn_artifact` path), version-counter
 * touch, and fail-soft no-ops (no resolvable hex, duplicate tag).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { GREAT_WORK_ARTIFACT_TIER } from '../../data/game-config';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';

/**
 * actor-hero is the ascendant firing the encounter, located at loc-home on hex
 * (4, 7), so a Great Work with no explicit hex resolves to (4, 7) deterministically.
 */
function buildState(opts: { actorLocated?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual',
      sphereAlignment: { primary: 'matter' },
      sphereAffinity: { scores: { matter: 10 }, progress: {} },
    },
  });
  graph.addNode({ id: 'loc-home', type: 'location', name: 'Home', properties: { hexCol: 4, hexRow: 7 } });
  if (opts.actorLocated !== false) {
    graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: 'loc-home', type: 'located_at', properties: {} });
  }
  // A neighbour placed at hex (9, 2) for nearAgentId placement tests.
  graph.addNode({ id: 'neighbour', type: 'actor', name: 'Neighbour', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-far', type: 'location', name: 'Far', properties: { hexCol: 9, hexRow: 2 } });
  graph.addEdge({ id: 'neighbour_loc', source: 'neighbour', target: 'loc-far', type: 'located_at', properties: {} });
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
  } as GameState;
}

function makeAction(actorId = 'actor-hero', templateId = 'enc.greatwork'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId, targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-greatwork', label: 'The Great Work', effects } as EncounterAftermathReaction;
}

function apply(state: GameState, reaction: EncounterAftermathReaction, runtime: SimulationRuntime, tick = 50) {
  return applyEncounterAftermathReaction(state, makeAction(), reaction, tick, runtime);
}

function uniqueLocations(state: GameState, tag: string) {
  return state.graph.getNodesByType('location').filter(n => n.properties.uniqueTag === tag);
}

describe('spawn_unique_location', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('mints a unique location at the actor hex with an owns edge and unique flags', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'master_forge', uniqueTag: 'the_first_forge' }]);
    const result = apply(state, reaction, runtime);

    const minted = uniqueLocations(result.state, 'the_first_forge');
    expect(minted).toHaveLength(1);
    const loc = minted[0];
    expect(loc.type).toBe('location');
    expect(loc.properties.unique).toBe(true);
    expect(loc.properties.locationSubtype).toBe('master_forge');
    // Falls back to the actor's hex (loc-home at 4,7).
    expect(loc.properties.hexCol).toBe(4);
    expect(loc.properties.hexRow).toBe(7);

    // Ownership modelled as a graph edge, not a property — and since THR-1297 that
    // edge is `owns`, minted through the holdings writer along with the bearer-side
    // face. Asserting the absence of the old `controls` edge too: leaving both would
    // let a future revert pass this test.
    const owns = result.state.graph.getOutgoingEdges('actor-hero', 'owns')
      .find(e => e.target === loc.id);
    expect(owns).toBeDefined();
    expect(owns!.properties.via).toBe('creation');
    expect(result.state.graph.getOutgoingEdges('actor-hero', 'controls')
      .find(e => e.target === loc.id)).toBeUndefined();

    // Structural version bumped (new location shifts spatial structure).
    expect(result.mutationSummary.touchedWorld).toBe(true);
    expect(result.mutationSummary.touchedStructure).toBe(true);

    const trace = getTraces().find(t => t.category === 'ascendant.signature.unique_location');
    expect(trace).toBeDefined();
    expect((trace as { success?: boolean }).success).toBe(true);
  });

  it('de-dupes by uniqueTag — a second cast is a no-op, only one exists', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'master_forge', uniqueTag: 'the_first_forge' }]);
    apply(state, reaction, runtime);
    clearTraces();
    const result = apply(state, reaction, runtime);

    // Still exactly one location carries the tag.
    expect(uniqueLocations(result.state, 'the_first_forge')).toHaveLength(1);

    const trace = getTraces().find(t => t.category === 'ascendant.signature.unique_location');
    expect((trace as { success?: boolean }).success).toBe(false);
    expect((trace as { failReason?: string }).failReason).toBe('duplicate_tag');
  });

  it('honors an explicit hex over the actor location', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'mining', uniqueTag: 'deep_mine', hex: { col: 11, row: 3 } }]);
    const result = apply(state, reaction, runtime);
    const loc = uniqueLocations(result.state, 'deep_mine')[0];
    expect(loc.properties.hexCol).toBe(11);
    expect(loc.properties.hexRow).toBe(3);
  });

  it('places at nearAgentId hex when no explicit hex is given', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'monument', uniqueTag: 'far_monument', nearAgentId: 'neighbour' }]);
    const result = apply(state, reaction, runtime);
    const loc = uniqueLocations(result.state, 'far_monument')[0];
    expect(loc.properties.hexCol).toBe(9);
    expect(loc.properties.hexRow).toBe(2);
  });

  it('forges a legendary relic bonded to the maker when artifactForgeTier is set', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'master_forge', uniqueTag: 'relic_forge', artifactForgeTier: GREAT_WORK_ARTIFACT_TIER }]);
    const result = apply(state, reaction, runtime);

    // Reuses spawn_artifact's legendary-agent path: artifact_legendary + bonded_to.
    const bondEdge = result.state.graph.getOutgoingEdges('actor-hero', 'bonded_to')[0];
    expect(bondEdge).toBeDefined();
    const artifact = result.state.graph.getNode(bondEdge.target)!;
    expect(artifact.type).toBe('artifact_legendary');
    expect(artifact.properties.tier).toBe('legendary');
  });

  it('mints no artifact when artifactForgeTier is omitted', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'master_forge', uniqueTag: 'plain_forge' }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.graph.getOutgoingEdges('actor-hero', 'bonded_to')).toHaveLength(0);
  });

  it('fail-soft: no resolvable hex → skips without minting, no throw', () => {
    const state = buildState({ actorLocated: false }); // actor has no located_at edge
    const reaction = makeReaction([{ kind: 'spawn_unique_location', subtype: 'master_forge', uniqueTag: 'homeless_work' }]);
    const result = apply(state, reaction, runtime);
    expect(uniqueLocations(result.state, 'homeless_work')).toHaveLength(0);
    const trace = getTraces().find(t => t.category === 'ascendant.signature.unique_location');
    expect((trace as { success?: boolean }).success).toBe(false);
    expect((trace as { failReason?: string }).failReason).toBe('no_hex');
  });
});
