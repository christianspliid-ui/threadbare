/**
 * The grievance lifecycle is *wired into the tick* — THR-1298 slice 5.
 *
 * `grievanceLifecycle.test.ts` proves the policy. This file proves the policy is
 * consulted, which is the half that fails silently: every routing rule in that suite
 * would pass identically against a module `phaseAmbitionProgress` never calls, and the
 * mint lane's own tests call `mintAmbitionsFromEvents` directly, so they clear the
 * routing entirely.
 *
 * Both arms drive the real phase over the real 15-tick pass, and differ in exactly one
 * field of one node — the victim's spotlight tier.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import {
  phaseAmbitionProgress,
  MILESTONE_CHECK_INTERVAL,
  AMBITION_REEVAL_INTERVAL,
  resetAmbitionEventCounter,
} from '../../ambitionTick';
import { createUndertakingOutcomeNode } from '../undertakingOutcomeNode';
import { findActiveGrievanceEdge } from '../grievanceLifecycle';
import { hasGrudge } from '../grudgeEdge';
import type { StrategicProjectRuntime } from '../../../types/strategicAction';

const VICTIM = 'actor.victim';
const CULPRIT = 'actor.culprit';
const SITE = 'loc.dunmar';

/** A tick on which BOTH the milestone pass and the re-eval (mint) pass run. */
const TICK = MILESTONE_CHECK_INTERVAL * AMBITION_REEVAL_INTERVAL;

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed: 42, graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc_1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as never, familiarityMap: new Map() as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
  } as unknown as GameState;
}

function makeProject(): StrategicProjectRuntime {
  return {
    projectId: 'proj_raze_1', actorId: CULPRIT,
    templateId: 'strategic_raze_settlement', ambitionId: 'ambition_conquer_territory',
    verb: 'destroy', behaviorFamily: 'conquest',
    targetNodeId: SITE, originLocationId: SITE,
    progress: 10, progressRequired: 10,
    startedTick: TICK - 15, lastProgressTick: TICK, status: 'completed',
  } as StrategicProjectRuntime;
}

/**
 * A razed settlement, its owner, and the hand that razed it.
 *
 * `victimTier` is the only knob — everything else is identical between the arms, so a
 * difference in outcome can only come from the tier routing.
 */
function razedWorld(victimTier: string): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of [[VICTIM, 'Sera'], [CULPRIT, 'Hesk']] as const) {
    graph.addNode({
      id, type: 'actor', name,
      properties: {
        actorType: 'individual',
        spotlightTier: id === VICTIM ? victimTier : 'spotlight',
        domainCapabilities: { iron: 0.4, shadow: 0.3, heart: 0.3, stone: 0.3, gold: 0.3 },
      },
    });
  }
  graph.addNode({ id: SITE, type: 'location', name: 'Dunmar', properties: {} });
  graph.addEdge({
    id: 'culprit_loc', source: CULPRIT, target: SITE, type: 'located_at', properties: {},
  });
  createUndertakingOutcomeNode({
    graph, project: makeProject(), harmClass: 'property_destroyed',
    tick: TICK, victimAgentId: VICTIM,
  });
  return graph;
}

/**
 * The first world seed at which this fixture actually mints.
 *
 * Minting is gated on a seeded base chance, so a fixed seed is a coin flip over whether
 * the lane runs at all — and a wiring test that silently never minted would pass its
 * "no drive was written" arm for entirely the wrong reason. Searching for the seed is
 * the same idiom `undertakingGrievanceMinting.test.ts` uses, and it stays deterministic:
 * the same fixture always finds the same seed.
 */
function firstMintingSeed(limit = 80): number | null {
  for (let seed = 0; seed < limit; seed++) {
    const graph = razedWorld('spotlight');
    phaseAmbitionProgress({ ...makeState(graph, TICK), seed });
    if (findActiveGrievanceEdge(graph, VICTIM)) return seed;
  }
  return null;
}

describe('phaseAmbitionProgress routes harms through the grievance lifecycle', () => {
  beforeEach(() => resetAmbitionEventCounter());

  const MINTING_SEED = firstMintingSeed();

  it('finds a world in which the harm mints at all', () => {
    // Guards every assertion below: without a minting seed, both arms would be vacuous.
    expect(MINTING_SEED).not.toBeNull();
  });

  it('gives a spotlight victim the drive', () => {
    const graph = razedWorld('spotlight');

    phaseAmbitionProgress({ ...makeState(graph, TICK), seed: MINTING_SEED! });

    const grievance = findActiveGrievanceEdge(graph, VICTIM);
    expect(grievance).toBeDefined();
    expect(grievance!.properties.culpritAgentId).toBe(CULPRIT);
    expect(grievance!.properties.heat as number).toBeGreaterThan(0);
  });

  it('gives an ambient victim a grudge and no drive — the routing runs inside the phase', () => {
    const graph = razedWorld('ambient');

    // The SAME seed that mints for the spotlight victim above, so the only difference
    // between the arms is the tier the routing reads.
    phaseAmbitionProgress({ ...makeState(graph, TICK), seed: MINTING_SEED! });

    // The harm registered — it simply did not become a drive an ambient agent could
    // never act on. Without the wiring, this victim would hold a pursues edge instead.
    expect(findActiveGrievanceEdge(graph, VICTIM)).toBeUndefined();
    expect(hasGrudge(graph, VICTIM, CULPRIT)).toBe(true);
  });
});
