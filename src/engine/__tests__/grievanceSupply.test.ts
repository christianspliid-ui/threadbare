/**
 * THR-1383 — the grievance lane gets a supply.
 *
 * The 300-tick observation run that closed THR-1298 minted zero grievances on both seeds
 * while every emission site fired. Three gates starved it, and these tests drive the
 * real lane through each of the three fixes rather than a fixture of them:
 *
 *   1. the mint window is derived from the pass cadence, so the passes tile the timeline
 *      and a harm at any tick is offered exactly once;
 *   2. a heavy enough harm may take a full mortal's *secondary* want (never the primary,
 *      never for a soft drive, never when the mortal already holds a grievance);
 *   3. a harm done to a faction reaches its leader as a target relation, and the
 *      provenance names whose hall it was.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import {
  phaseAmbitionProgress,
  mintAmbitionsFromEvents,
  buildAmbitionAgentSnapshot,
  resetAmbitionEventCounter,
  MILESTONE_CHECK_INTERVAL,
  AMBITION_REEVAL_INTERVAL,
  MINT_LOOKBACK_TICKS,
} from '../ambitionTick';
import { MAX_ACTIVE_AMBITIONS } from '../ambitionAssignment';
import { createUndertakingOutcomeNode } from '../grievance/undertakingOutcomeNode';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { HARM_MAGNITUDE_BY_CLASS } from '../../data/ambition-minting-rules';
import { GRIEVANCE_DISPLACE_MIN_MAGNITUDE } from '../../data/grievance-constants';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { StrategicProjectRuntime } from '../../types/strategicAction';
import type { UndertakingHarmClass } from '../../types/strategicAction';

const VICTIM = 'actor.victim';
const CULPRIT = 'actor.culprit';
const OTHER_CULPRIT = 'actor.other_culprit';
const SITE = 'loc.thornhall';
const FACTION = 'faction.ironwrights';
const LEADER = 'actor.leader';
const MEMBER = 'actor.member';

/** The first tick both cadences coincide on — the first mint pass of a run. */
const PASS = MINT_LOOKBACK_TICKS;

function makeProject(overrides: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj_raze_1',
    actorId: CULPRIT,
    templateId: 'strategic_raze_settlement',
    ambitionId: 'ambition_conquer_territory',
    verb: 'destroy',
    behaviorFamily: 'warlord-expansion',
    targetNodeId: SITE,
    originLocationId: SITE,
    progress: 10,
    progressRequired: 10,
    startedTick: 60,
    lastProgressTick: PASS,
    status: 'completed',
    ...overrides,
  } as StrategicProjectRuntime;
}

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of [
    [VICTIM, 'Oswen'], [CULPRIT, 'Hesk'], [OTHER_CULPRIT, 'Maerin'], [LEADER, 'Thessaly'], [MEMBER, 'Bren'],
  ] as const) {
    graph.addNode({
      id, type: 'actor', name,
      properties: {
        actorType: 'individual',
        domainCapabilities: { iron: 0.4, shadow: 0.3, heart: 0.3, stone: 0.3, gold: 0.3 },
      },
    });
  }
  graph.addNode({ id: SITE, type: 'location', name: 'Thornhall', properties: {} });
  graph.addEdge({ id: 'culprit_loc', source: CULPRIT, target: SITE, type: 'located_at', properties: {} });
  return graph;
}

function makeState(graph: WorldGraph, tick: number, seed: number): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed, graph,
    cosmology: {} as any, tiles: [], clock: {} as any, ascendantId: 'asc_1',
    essencePool: {} as any, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [], doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [], stealthExposure: 0,
    visibilityMap: new Map() as any, familiarityMap: new Map() as any,
    culturalInsightMap: new Map(), agentKnowledge: new Map(), encounterProgress: [],
    actionsInProgress: [], unifiedActions: [], worldSoul: {} as any,
    echoDefinitions: [], echoStates: [], chronicle: {} as any,
  } as unknown as GameState;
}

/** Give an actor an ordinary, active want on a real template. */
function addWant(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  priority: 'primary' | 'secondary',
  extra: Record<string, unknown> = {},
): string {
  const ambitionNodeId = `ambition.${templateId}`;
  if (!graph.getNode(ambitionNodeId)) {
    const tmpl = AMBITION_TEMPLATES.find(t => t.id === templateId);
    graph.addNode({
      id: ambitionNodeId, type: 'ambition', name: tmpl?.displayName ?? templateId,
      properties: {
        [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE,
        templateId, displayName: tmpl?.displayName ?? templateId,
        category: tmpl?.category ?? 'survival', reachAffinity: tmpl?.reachAffinity ?? {},
        totalMilestones: tmpl?.milestones.length ?? 0,
      },
    });
  }
  const edgeId = `pursues_${actorId}_${ambitionNodeId}`;
  graph.addEdge({
    id: edgeId, source: actorId, target: ambitionNodeId, type: 'pursues',
    // Assigned on the pass tick so no age-based abandonment rule can fire on the
    // same tick and confuse a displacement with the lifecycle's own housekeeping.
    properties: { priority, status: 'active', assignedTick: PASS, completedMilestones: [], ...extra },
  });
  return edgeId;
}

const [WANT_A, WANT_B] = AMBITION_TEMPLATES.map(t => t.id);

function activeWants(graph: WorldGraph, actorId: string) {
  return graph.getOutgoingEdges(actorId, 'pursues').filter(e => e.properties.status === 'active');
}

/** Run the phase over fresh worlds under successive seeds until `until` holds; returns that world. */
function firstRunWhere(
  build: () => WorldGraph,
  until: (graph: WorldGraph) => boolean,
  limit = 80,
): WorldGraph | null {
  for (let seed = 0; seed < limit; seed++) {
    const graph = build();
    phaseAmbitionProgress(makeState(graph, PASS, seed));
    if (until(graph)) return graph;
  }
  return null;
}

function harm(graph: WorldGraph, harmClass: UndertakingHarmClass, tick = PASS, culprit = CULPRIT, victim = VICTIM) {
  return createUndertakingOutcomeNode({
    graph, project: makeProject({ actorId: culprit }), harmClass, tick, victimAgentId: victim,
  })!;
}

beforeEach(() => {
  resetAmbitionEventCounter();
  clearTraces();
});

// ─── 1. The window tiles the cadence ─────────────────────────────

describe('the mint window is derived from the pass cadence', () => {
  it('is the least common multiple of the two intervals, never a literal', () => {
    expect(MINT_LOOKBACK_TICKS % MILESTONE_CHECK_INTERVAL).toBe(0);
    expect(MINT_LOOKBACK_TICKS % AMBITION_REEVAL_INTERVAL).toBe(0);
    // The smallest such multiple: halving it breaks one of the two divisibilities.
    const half = MINT_LOOKBACK_TICKS / 2;
    expect(half % MILESTONE_CHECK_INTERVAL !== 0 || half % AMBITION_REEVAL_INTERVAL !== 0).toBe(true);
    // At the shipped values (15, 25) that is 75 — the number the observation run measured
    // the passes firing on while the window covered 25.
    expect(MINT_LOOKBACK_TICKS).toBe(75);
  });

  it('offers a harm at every tick offset within a cadence to exactly one pass', () => {
    const passes = [PASS, 2 * PASS, 3 * PASS];
    const offeredAt = (harmTick: number): number[] => {
      const graph = makeWorld();
      const nodeId = harm(graph, 'property_destroyed', PASS);
      graph.getNode(nodeId)!.properties.tick = harmTick;
      return passes.filter(pass => {
        const snapshot = buildAmbitionAgentSnapshot(graph, VICTIM);
        for (let s = 0; s < 80; s++) {
          if (mintAmbitionsFromEvents(graph, VICTIM, pass, s, snapshot, new Set(), new Map())) return true;
        }
        return false;
      });
    };
    // Every offset in the second cadence, including both boundaries. The pass tick
    // itself belongs to that pass, not the next one.
    for (const t of [PASS + 1, PASS + 2, PASS + 37, 2 * PASS - 1, 2 * PASS]) {
      expect(offeredAt(t), `harm at tick ${t}`).toEqual([2 * PASS]);
    }
    expect(offeredAt(PASS)).toEqual([PASS]);
  });
});

// ─── 2. Displacement ─────────────────────────────────────────────

describe('a heavy enough harm may take a full mortal\'s secondary want', () => {
  const fullVictimAfterRazing = () => {
    const graph = makeWorld();
    addWant(graph, VICTIM, WANT_A, 'primary');
    addWant(graph, VICTIM, WANT_B, 'secondary');
    harm(graph, 'property_destroyed');
    return graph;
  };

  it('displaces the secondary, keeps the primary, and says so in the trace and the chronicle', () => {
    expect(HARM_MAGNITUDE_BY_CLASS.property_destroyed).toBeGreaterThanOrEqual(GRIEVANCE_DISPLACE_MIN_MAGNITUDE);
    enableTracing();
    let seenState: Partial<GameState> | undefined;
    let world: WorldGraph | null = null;
    for (let seed = 0; seed < 80 && !world; seed++) {
      const graph = fullVictimAfterRazing();
      clearTraces();
      const out = phaseAmbitionProgress(makeState(graph, PASS, seed));
      if (activeWants(graph, VICTIM).some(e => e.properties.grievance === true)) {
        world = graph;
        seenState = out;
      }
    }
    disableTracing();
    expect(world, 'no seed in 80 minted a grievance for a full mortal').not.toBeNull();

    const active = activeWants(world!, VICTIM);
    expect(active).toHaveLength(MAX_ACTIVE_AMBITIONS);
    // The primary stood; the vendetta took the secondary's place.
    expect(active.find(e => e.target === `ambition.${WANT_A}`)?.properties.priority).toBe('primary');
    const vendetta = active.find(e => e.properties.grievance === true)!;
    expect(vendetta.properties.culpritAgentId).toBe(CULPRIT);
    expect(vendetta.properties.priority).toBe('secondary');

    const displaced = world!.getEdge(`pursues_${VICTIM}_ambition.${WANT_B}`)!;
    expect(displaced.properties.status).toBe('abandoned');
    expect(displaced.properties.abandonedReason).toBe('displaced_by_grievance');
    expect(displaced.properties.resolvedTick).toBe(PASS);

    const trace = getTraces().find(t => t.category === 'ambition_displaced') as any;
    expect(trace).toBeDefined();
    expect(trace.agentId).toBe(VICTIM);
    expect(trace.displacedTemplateId).toBe(WANT_B);
    expect(trace.culpritAgentId).toBe(CULPRIT);

    const line = seenState?.tickEvents?.find(e => e.message.includes('sets aside'));
    expect(line?.actorId).toBe(VICTIM);
    expect(line?.message).toContain('Oswen sets aside');
    expect(line?.message).toContain('Hesk');
  });

  // The two guards below sit on the mint function itself, not the phase: the phase
  // carries a belt-and-braces `continue` that would hide a loosened filter from a
  // phase-level assertion (a falsification that stayed green found this).
  it('with slots full, the mint function offers only vendettas at or above the bar', () => {
    const graph = makeWorld();
    harm(graph, 'property_destroyed');
    const snapshot = buildAmbitionAgentSnapshot(graph, VICTIM);
    const mint = (seed: number, slotsFree: boolean) =>
      mintAmbitionsFromEvents(graph, VICTIM, PASS, seed, snapshot, new Set(), new Map(), slotsFree);
    const full = Array.from({ length: 200 }, (_, s) => mint(s, false)).filter(m => m !== null);
    const free = Array.from({ length: 200 }, (_, s) => mint(s, true)).filter(m => m !== null);
    // A grave harm is never a coin flip: the base-chance roll applies to soft drives
    // only, so every seed reaches the funnel — and the funnel takes the vendetta here.
    expect(full.length).toBe(200);
    expect(full.every(m => m!.grievance !== undefined)).toBe(true);
    // The same harm offers a free mortal soft drives too — which is what proves the
    // filter, not the funnel, is what narrowed the full mortal's offer.
    expect(free.some(m => m!.grievance === undefined)).toBe(true);
  });

  it('with slots full, a harm below the bar offers nothing at all', () => {
    expect(HARM_MAGNITUDE_BY_CLASS.network_severed).toBeGreaterThanOrEqual(GRIEVANCE_DISPLACE_MIN_MAGNITUDE);
    expect(HARM_MAGNITUDE_BY_CLASS.undertaking_abandoned).toBeLessThan(GRIEVANCE_DISPLACE_MIN_MAGNITUDE);
    // Lower the bar's neighbour into range by hand: a `network_severed` harm (0.5) sits
    // exactly on the bar and qualifies; re-stamp the node below it and it must not.
    const graph = makeWorld();
    const nodeId = harm(graph, 'network_severed');
    const snapshot = buildAmbitionAgentSnapshot(graph, VICTIM);
    const anyMint = () => Array.from({ length: 200 }, (_, s) =>
      mintAmbitionsFromEvents(graph, VICTIM, PASS, s, snapshot, new Set(), new Map(), false),
    ).some(m => m !== null);
    expect(anyMint()).toBe(true);
    graph.getNode(nodeId)!.properties.harmMagnitude = GRIEVANCE_DISPLACE_MIN_MAGNITUDE - 0.01;
    expect(anyMint()).toBe(false);
  });

  it('offers a full mortal nothing for a harm below the displacement bar', () => {
    expect(HARM_MAGNITUDE_BY_CLASS.undertaking_abandoned).toBeLessThan(GRIEVANCE_DISPLACE_MIN_MAGNITUDE);
    const world = firstRunWhere(
      () => {
        const graph = makeWorld();
        addWant(graph, VICTIM, WANT_A, 'primary');
        addWant(graph, VICTIM, WANT_B, 'secondary');
        harm(graph, 'undertaking_abandoned');
        return graph;
      },
      graph => activeWants(graph, VICTIM).length !== MAX_ACTIVE_AMBITIONS
        || activeWants(graph, VICTIM).some(e => e.properties.grievance === true)
        || graph.getOutgoingEdges(VICTIM, 'pursues').some(e => e.properties.abandonedReason !== undefined),
    );
    expect(world, 'a soft harm changed a full mortal\'s wants').toBeNull();
  });

  it('offers a full mortal only the vendetta, never the soft drives the same harm carries', () => {
    // property_destroyed offers rebuild / protect / flee beside revenge. A free mortal may
    // take any of them; a full one may take only the vendetta.
    const world = firstRunWhere(
      fullVictimAfterRazing,
      graph => graph.getOutgoingEdges(VICTIM, 'pursues')
        .some(e => e.properties.mintedByEventId !== undefined && e.properties.grievance !== true),
    );
    expect(world, 'a full mortal was minted a soft drive').toBeNull();
  });

  it('leaves a mortal who already holds a grievance on the feed/replace path', () => {
    // Primary ordinary want + a standing vendetta against Maerin. A worse harm from Hesk
    // replaces the vendetta (the one-slot rule) and frees the slot itself, so nothing
    // ordinary is displaced; a like-for-like harm feeds it.
    const world = firstRunWhere(
      () => {
        const graph = makeWorld();
        addWant(graph, VICTIM, WANT_A, 'primary');
        addWant(graph, VICTIM, 'ambition_seek_revenge', 'secondary', {
          grievance: true, culpritAgentId: OTHER_CULPRIT, harmMagnitude: 0.5, heat: 0.5, chainDepth: 0,
        });
        harm(graph, 'named_death');
        return graph;
      },
      graph => activeWants(graph, VICTIM).some(e => e.properties.grievance === true && e.properties.culpritAgentId === CULPRIT),
    );
    expect(world, 'no seed replaced the standing vendetta').not.toBeNull();
    const primary = world!.getEdge(`pursues_${VICTIM}_ambition.${WANT_A}`)!;
    expect(primary.properties.status).toBe('active');
    expect(world!.getOutgoingEdges(VICTIM, 'pursues').some(e => e.properties.abandonedReason !== undefined)).toBe(false);
    expect(activeWants(world!, VICTIM).filter(e => e.properties.grievance === true)).toHaveLength(1);
  });
});

// ─── 3. A faction's harm reaches its leader ──────────────────────

describe('a harm done to a faction reaches its leader', () => {
  const withFaction = (graph: WorldGraph) => {
    graph.addNode({
      id: FACTION, type: 'actor', name: 'the Ironwrights',
      properties: { actorType: 'faction', factionDefId: 'faction_test_ironwrights' },
    });
    graph.addEdge({ id: 'me_leader', source: LEADER, target: FACTION, type: 'member_of', properties: { reputation: 0.9, role: 'leader', rank: 5, joinedTick: 0 } });
    graph.addEdge({ id: 'me_member', source: MEMBER, target: FACTION, type: 'member_of', properties: { reputation: 0.5, role: 'member', rank: 2, joinedTick: 0 } });
    return graph;
  };

  it('writes a second target edge for the leader, tagged with the faction', () => {
    const graph = withFaction(makeWorld());
    const nodeId = harm(graph, 'holding_seized', PASS, CULPRIT, FACTION);
    const edgeTo = (actorId: string) => graph.getOutgoingEdges(actorId, 'participated_in').find(e => e.target === nodeId);
    // The faction's own edge stays — the honest record of who was harmed.
    expect(edgeTo(FACTION)?.properties.role).toBe('target');
    expect(edgeTo(FACTION)?.properties.viaFactionId).toBeUndefined();
    expect(edgeTo(LEADER)?.properties.role).toBe('target');
    expect(edgeTo(LEADER)?.properties.viaFactionId).toBe(FACTION);
    // Only the leader carries it; an ordinary member is not offered a vendetta.
    expect(edgeTo(MEMBER)).toBeUndefined();
  });

  it('routes nowhere when the culprit leads the faction they harmed', () => {
    const graph = withFaction(makeWorld());
    const nodeId = harm(graph, 'holding_seized', PASS, LEADER, FACTION);
    const leaderEdge = graph.getOutgoingEdges(LEADER, 'participated_in').find(e => e.target === nodeId);
    expect(leaderEdge?.properties.role).toBe('primary');
    expect(leaderEdge?.properties.viaFactionId).toBeUndefined();
  });

  it('mints the leader a vendetta whose provenance names the faction', () => {
    const graph = withFaction(makeWorld());
    harm(graph, 'holding_seized', PASS, CULPRIT, FACTION);
    const snapshot = buildAmbitionAgentSnapshot(graph, LEADER);
    let minted = null;
    for (let s = 0; s < 80 && !minted; s++) {
      const m = mintAmbitionsFromEvents(graph, LEADER, PASS, s, snapshot, new Set(), new Map());
      if (m?.grievance) minted = m;
    }
    expect(minted, 'no seed minted the leader a grievance').not.toBeNull();
    expect(minted!.grievance!.culpritAgentId).toBe(CULPRIT);
    expect(minted!.mintedByLabel).toContain('the Ironwrights');
    expect(minted!.mintedByLabel).toContain('done to');
    expect(minted!.mintedByLabel).toContain("Hesk's work");
  });
});
