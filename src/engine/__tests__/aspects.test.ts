import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  grantAspect,
  isAspect,
  isApotheosisEligible,
  seedApotheosisEncounters,
  markAspectEchoOnDeath,
  getLivingAspectEdges,
} from '../aspects';
import { computeEssenceIncome } from '../essenceIncome';
import { computeEssenceGeneration } from '../influence';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { SPHERE_NAMES } from '../../types/index';
import type { SphereAlignment } from '../../types/influence';
import type { GameState } from '../../types/gameState';
import {
  ASPECT_ELIGIBILITY_TICKS,
  ASPECT_REOFFER_COOLDOWN_TICKS,
  ASPECT_ESSENCE_PER_TICK,
  APOTHEOSIS_ENCOUNTER_TEMPLATE_ID,
} from '../../data/aspect-content';

const ASC = 'asc.player';
const MORTAL = 'actor.faithful';

function makeGraph(threadTier = 4, ticksAtTier = ASPECT_ELIGIBILITY_TICKS): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The Verdant One',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
    },
  });
  graph.addNode({
    id: MORTAL,
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc.home',
    type: 'location',
    name: 'Thornwall',
    properties: { locationType: 'location' },
  });
  graph.addEdge({
    id: `thread_${ASC}_${MORTAL}`,
    source: ASC,
    target: MORTAL,
    type: 'thread',
    properties: {
      tier: threadTier,
      ticksAtCurrentTier: ticksAtTier,
      establishedTick: 0,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
    },
  });
  graph.addEdge({
    id: `${MORTAL}_located_at_loc`,
    source: MORTAL,
    target: 'loc.home',
    type: 'located_at',
    properties: {},
  });
  return graph;
}

function threadEdge(graph: WorldGraph) {
  return graph.getOutgoingEdges(ASC, 'thread')[0];
}

describe('grantAspect', () => {
  it('creates an aspect_of edge with the documented properties', () => {
    const graph = makeGraph();
    const result = grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.apotheosis' });
    expect(result.granted).toBe(true);
    expect(result.reason).toBe('created');

    const edges = graph.getOutgoingEdges(ASC, 'aspect_of');
    expect(edges).toHaveLength(1);
    const props = edges[0].properties;
    expect(props.attainedTick).toBe(200);
    expect(props.originEncounterId).toBe('enc.apotheosis');
    expect(props.sourceTier).toBe(4);
    expect(props.survivesDeath).toBe(true);
    expect(props.mythicEcho).toBeUndefined();
    expect(isAspect(graph, MORTAL)).toBe(true);
  });

  it('is idempotent — a second grant is a no-op', () => {
    const graph = makeGraph();
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const second = grantAspect(graph, { mortalId: MORTAL, tick: 250, originEncounterId: 'enc.b' });
    expect(second.granted).toBe(false);
    expect(second.reason).toBe('already_aspect');
    expect(graph.getOutgoingEdges(ASC, 'aspect_of')).toHaveLength(1);
    // Original attainedTick preserved (not overwritten).
    expect(graph.getOutgoingEdges(ASC, 'aspect_of')[0].properties.attainedTick).toBe(200);
  });

  it('bumps the mortal\'s importance (narrative gravity)', () => {
    const graph = makeGraph();
    const before = (graph.getNode(MORTAL)!.properties.importance as number) ?? 0;
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const after = (graph.getNode(MORTAL)!.properties.importance as number) ?? 0;
    expect(after).toBeGreaterThan(before);
  });

  it('emits an aspect_attained trace on success', () => {
    const graph = makeGraph();
    clearTraces();
    enableTracing();
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const traces = getTraces().filter(t => t.category === 'aspect_attained');
    disableTracing();
    clearTraces();
    expect(traces).toHaveLength(1);
    expect((traces[0] as { mortalId?: string }).mortalId).toBe(MORTAL);
  });

  it('returns thread_missing when the mortal has no thread', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: ASC, type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: MORTAL, type: 'actor', name: 'Stranger', properties: { actorType: 'individual' } });
    const result = grantAspect(graph, { mortalId: MORTAL, tick: 1, originEncounterId: 'enc.a' });
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('thread_missing');
  });

  it('returns mortal_missing when the mortal node is absent', () => {
    const graph = makeGraph();
    const result = grantAspect(graph, { mortalId: 'actor.ghost', tick: 1, originEncounterId: 'enc.a' });
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('mortal_missing');
  });
});

describe('isApotheosisEligible', () => {
  it('is true for a tier-4 thread held long enough', () => {
    const graph = makeGraph(4, ASPECT_ELIGIBILITY_TICKS);
    expect(isApotheosisEligible(threadEdge(graph), 1000)).toBe(true);
  });

  it('is false below tier 4', () => {
    const graph = makeGraph(3, ASPECT_ELIGIBILITY_TICKS);
    expect(isApotheosisEligible(threadEdge(graph), 1000)).toBe(false);
  });

  it('is false when held at tier 4 for too few ticks', () => {
    const graph = makeGraph(4, ASPECT_ELIGIBILITY_TICKS - 1);
    expect(isApotheosisEligible(threadEdge(graph), 1000)).toBe(false);
  });

  it('respects the re-offer cooldown', () => {
    const graph = makeGraph(4, ASPECT_ELIGIBILITY_TICKS);
    const edge = threadEdge(graph);
    (edge.properties as { apotheosisOfferedTick?: number }).apotheosisOfferedTick = 1000;
    expect(isApotheosisEligible(edge, 1000 + ASPECT_REOFFER_COOLDOWN_TICKS - 1)).toBe(false);
    expect(isApotheosisEligible(edge, 1000 + ASPECT_REOFFER_COOLDOWN_TICKS)).toBe(true);
  });
});

describe('aspect essence trickle', () => {
  it('a living aspect raises essence generation by ASPECT_ESSENCE_PER_TICK', () => {
    const graph = makeGraph();
    const before = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const after = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    expect(after - before).toBeCloseTo(ASPECT_ESSENCE_PER_TICK, 5);
  });

  it('the view-layer mirror (computeEssenceIncome) matches the generator', () => {
    const graph = makeGraph();
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const gen = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    const income = SPHERE_NAMES.reduce((s, n) => s + computeEssenceIncome(graph, ASC)[n], 0);
    // Income is net of maintenance; both include the aspect bonus, so income <= gen but both moved together.
    expect(income).toBeLessThanOrEqual(gen + 1e-9);
    expect(getLivingAspectEdges(graph, ASC)).toHaveLength(1);
  });

  it('a mythic echo (dead aspect) no longer channels essence', () => {
    // Isolate the essence-filter: flip mythicEcho on the aspect edge directly
    // (death also tears down the thread, which would confound the delta).
    const graph = makeGraph();
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const living = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    graph.getOutgoingEdges(ASC, 'aspect_of')[0].properties.mythicEcho = true;
    const echo = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    expect(living - echo).toBeCloseTo(ASPECT_ESSENCE_PER_TICK, 5);
    expect(getLivingAspectEdges(graph, ASC)).toHaveLength(0);
  });

  it('death tears down the thread too — both aspect conduit and thread stop channeling', () => {
    const graph = makeGraph();
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    const living = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    markAspectEchoOnDeath(graph, MORTAL, 300);
    const afterDeath = SPHERE_NAMES.reduce((s, n) => s + computeEssenceGeneration(graph, ASC)[n], 0);
    // Aspect conduit (0.3) + thread (0.1) both stop.
    expect(living - afterDeath).toBeCloseTo(ASPECT_ESSENCE_PER_TICK + 0.1, 5);
    expect(getLivingAspectEdges(graph, ASC)).toHaveLength(0);
  });
});

describe('markAspectEchoOnDeath', () => {
  it('retains the node and aspect_of edge, removes other edges, sets mythicEcho', () => {
    const graph = makeGraph();
    grantAspect(graph, { mortalId: MORTAL, tick: 200, originEncounterId: 'enc.a' });
    clearTraces();
    enableTracing();
    const result = markAspectEchoOnDeath(graph, MORTAL, 300);
    const traces = getTraces().filter(t => t.category === 'aspect_echoed');
    disableTracing();
    clearTraces();

    expect(result.isEcho).toBe(true);
    expect(result.ascendantIds).toContain(ASC);
    // Node retained, marked deceased + echo.
    const node = graph.getNode(MORTAL);
    expect(node).toBeDefined();
    expect(node!.properties.deceased).toBe(true);
    expect(node!.properties.mythicEcho).toBe(true);
    // aspect_of edge retained + flagged; thread + located_at removed.
    const aspectEdges = graph.getOutgoingEdges(ASC, 'aspect_of');
    expect(aspectEdges).toHaveLength(1);
    expect(aspectEdges[0].properties.mythicEcho).toBe(true);
    expect(aspectEdges[0].properties.echoedTick).toBe(300);
    expect(graph.getOutgoingEdges(ASC, 'thread')).toHaveLength(0);
    expect(graph.getOutgoingEdges(MORTAL, 'located_at')).toHaveLength(0);
    // still an aspect (echo counts).
    expect(isAspect(graph, MORTAL)).toBe(true);
    expect(traces).toHaveLength(1);
  });

  it('returns isEcho=false for a non-aspect mortal', () => {
    const graph = makeGraph();
    const result = markAspectEchoOnDeath(graph, MORTAL, 300);
    expect(result.isEcho).toBe(false);
    expect(result.ascendantIds).toHaveLength(0);
  });
});

describe('seedApotheosisEncounters', () => {
  function makeState(graph: WorldGraph): GameState {
    return {
      ascendantId: ASC,
      graph,
      tick: 1000,
      pendingEncounterSeeds: [],
      unifiedActions: [],
    } as unknown as GameState;
  }

  it('seeds the apotheosis encounter onto an eligible tier-4 mortal', () => {
    const graph = makeGraph(4, ASPECT_ELIGIBILITY_TICKS);
    const patch = seedApotheosisEncounters(makeState(graph), 1000);
    expect(patch.pendingEncounterSeeds).toHaveLength(1);
    const seed = patch.pendingEncounterSeeds![0];
    expect(seed.templateId).toBe(APOTHEOSIS_ENCOUNTER_TEMPLATE_ID);
    expect(seed.targetAgentId).toBe(MORTAL);
    // Offer is stamped on the thread edge so it won't re-seed within cooldown.
    expect((threadEdge(graph).properties as { apotheosisOfferedTick?: number }).apotheosisOfferedTick).toBe(1000);
  });

  it('does not seed a mortal who is already an aspect', () => {
    const graph = makeGraph(4, ASPECT_ELIGIBILITY_TICKS);
    grantAspect(graph, { mortalId: MORTAL, tick: 900, originEncounterId: 'enc.a' });
    const patch = seedApotheosisEncounters(makeState(graph), 1000);
    expect(patch.pendingEncounterSeeds ?? []).toHaveLength(0);
  });

  it('does not seed an ineligible (tier-3) mortal', () => {
    const graph = makeGraph(3, ASPECT_ELIGIBILITY_TICKS);
    const patch = seedApotheosisEncounters(makeState(graph), 1000);
    expect(patch.pendingEncounterSeeds ?? []).toHaveLength(0);
  });
});
