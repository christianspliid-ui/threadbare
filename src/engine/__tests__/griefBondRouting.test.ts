/**
 * THR-1536 — a killing's grief reaches the living, not the corpse.
 *
 * A retained death (the plot, band casualties, commissioned killings) leaves the
 * victim's `participated_in role:'target'` edge on a node that can no longer act. Two
 * fixes, both driven through the real writer and the real ambition phase:
 *
 *   1. the dead do not pursue — `phaseAmbitionProgress` skips `isAgentGone` actors
 *      before residence observation and minting;
 *   2. grief reaches the living — the outcome writer routes a slain individual's harm to
 *      their warmest living bonds, tagged `viaBondOf`, never to the culprit.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import {
  phaseAmbitionProgress,
  mintAmbitionsFromEvents,
  buildAmbitionAgentSnapshot,
  resetAmbitionEventCounter,
  MINT_LOOKBACK_TICKS,
} from '../ambitionTick';
import { createUndertakingOutcomeNode } from '../grievance/undertakingOutcomeNode';
import { GRIEF_BOND_MAX, GRIEF_BOND_MIN_SENTIMENT } from '../../data/grievance-constants';
import { RESIDENCE_POSITION_PROP } from '../agentResidence';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import type { StrategicProjectRuntime } from '../../types/strategicAction';

const VICTIM = 'actor.victim';
const CULPRIT = 'actor.culprit';
const SISTER = 'actor.sister';
const FRIEND = 'actor.friend';
const STRANGER = 'actor.stranger';
const SITE = 'loc.thornhall';
const PASS = MINT_LOOKBACK_TICKS;

function makeProject(): StrategicProjectRuntime {
  return {
    projectId: 'proj_plot_1',
    actorId: CULPRIT,
    templateId: 'strategic_the_plot',
    ambitionId: 'ambition_seek_revenge',
    verb: 'destroy',
    behaviorFamily: 'schemer',
    targetNodeId: VICTIM,
    originLocationId: SITE,
    progress: 10,
    progressRequired: 10,
    startedTick: 0,
    lastProgressTick: PASS,
    status: 'completed',
  } as unknown as StrategicProjectRuntime;
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

/** A world where the victim has already fallen (retained, as the plot leaves them). */
function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of [
    [VICTIM, 'Oswen'], [CULPRIT, 'Hesk'], [SISTER, 'Mara'], [FRIEND, 'Tobin'], [STRANGER, 'Ulla'],
  ] as const) {
    graph.addNode({
      id, type: 'actor', name,
      properties: {
        actorType: 'individual',
        domainCapabilities: { iron: 16, shadow: 12, heart: 12, stone: 12, gold: 12 },
      },
    });
  }
  graph.addNode({ id: SITE, type: 'location', name: 'Thornhall', properties: {} });
  graph.addEdge({ id: 'culprit_loc', source: CULPRIT, target: SITE, type: 'located_at', properties: {} });
  graph.addEdge({ id: 'victim_loc', source: VICTIM, target: SITE, type: 'located_at', properties: {} });
  graph.updateNode(VICTIM, {
    properties: { deceased: true, deceasedTick: PASS, deathCause: 'plot', slainBy: CULPRIT },
  });
  return graph;
}

function bond(graph: WorldGraph, source: string, target: string, sentiment: number): void {
  graph.addEdge({
    id: `rel_${source}_${target}`, source, target, type: 'relates_to',
    properties: { sentiment, trust: 0.5, strength: 0.5, basis: 'kin' },
  });
}

function kill(graph: WorldGraph): string {
  return createUndertakingOutcomeNode({
    graph, project: makeProject(), harmClass: 'named_death', tick: PASS, victimAgentId: VICTIM,
  })!;
}

function griefEdge(graph: WorldGraph, actorId: string, eventId: string) {
  return graph.getOutgoingEdges(actorId, 'participated_in').find(e => e.target === eventId);
}

beforeEach(() => {
  resetAmbitionEventCounter();
  clearTraces();
});

describe('a killing reaches the victim\'s living bonds', () => {
  it('writes one viaBondOf target edge per warm bond, in either direction, and none for the culprit', () => {
    const graph = makeWorld();
    bond(graph, VICTIM, SISTER, 0.9);          // outgoing from the victim
    bond(graph, FRIEND, VICTIM, 0.6);          // incoming to the victim
    bond(graph, VICTIM, CULPRIT, 0.8);         // the killer was close to them — still never reached
    const eventId = kill(graph);

    for (const id of [SISTER, FRIEND]) {
      const e = griefEdge(graph, id, eventId);
      expect(e?.properties.role, id).toBe('target');
      expect(e?.properties.viaBondOf, id).toBe(VICTIM);
    }
    expect(griefEdge(graph, CULPRIT, eventId)?.properties.role).toBe('primary');
    expect(griefEdge(graph, CULPRIT, eventId)?.properties.viaBondOf).toBeUndefined();
    // The corpse's own edge stays — the honest record of who was harmed.
    expect(griefEdge(graph, VICTIM, eventId)?.properties.viaBondOf).toBeUndefined();
  });

  it('skips bonds below the sentiment floor, dead bonds, and anyone past the cap', () => {
    const graph = makeWorld();
    bond(graph, VICTIM, STRANGER, GRIEF_BOND_MIN_SENTIMENT - 0.01);
    bond(graph, VICTIM, SISTER, 0.9);
    bond(graph, VICTIM, FRIEND, 0.7);
    // Enough warm bonds to exceed the cap, the coolest of which should be dropped.
    const extras = Array.from({ length: GRIEF_BOND_MAX }, (_, i) => `actor.extra_${i}`);
    extras.forEach((id, i) => {
      graph.addNode({ id, type: 'actor', name: `Extra ${i}`, properties: { actorType: 'individual' } });
      bond(graph, VICTIM, id, 0.3 + i * 0.01);
    });
    graph.addNode({ id: 'actor.dead_friend', type: 'actor', name: 'Gone', properties: { actorType: 'individual', deceased: true } });
    bond(graph, VICTIM, 'actor.dead_friend', 1.0);

    const eventId = kill(graph);
    const reached = graph.getIncomingEdges(eventId, 'participated_in')
      .filter(e => e.properties.viaBondOf === VICTIM)
      .map(e => e.source);
    expect(reached).toHaveLength(GRIEF_BOND_MAX);
    expect(reached).toContain(SISTER);
    expect(reached).toContain(FRIEND);
    expect(reached).not.toContain(STRANGER);
    expect(reached).not.toContain('actor.dead_friend');
  });

  it('routes nothing for a self-facing collapse — a dead owner\'s abandoned work wronged nobody', () => {
    // The seed-42 census caught this: an owner dies, their undertaking ends
    // `actor_lost`, and the self-facing abandonment node names the dead owner as victim.
    const graph = makeWorld();
    bond(graph, VICTIM, SISTER, 0.9);
    const eventId = createUndertakingOutcomeNode({
      graph, project: { ...makeProject(), actorId: VICTIM }, harmClass: 'undertaking_abandoned',
      tick: PASS, victimAgentId: VICTIM, selfFacing: true,
    })!;
    expect(eventId).toBeDefined();
    expect(griefEdge(graph, SISTER, eventId)).toBeUndefined();
  });

  it('routes nothing when the victim is still alive — they carry their own wound', () => {
    const graph = makeWorld();
    graph.updateNode(VICTIM, { properties: { deceased: false } });
    bond(graph, VICTIM, SISTER, 0.9);
    const eventId = kill(graph);
    expect(griefEdge(graph, SISTER, eventId)).toBeUndefined();
  });

  it('writes no extra edge when the victim had no qualifying bond, and witnesses still see it', () => {
    const graph = makeWorld();
    bond(graph, VICTIM, STRANGER, 0.1);
    graph.addEdge({ id: 'stranger_loc', source: STRANGER, target: SITE, type: 'located_at', properties: {} });
    enableTracing();
    const eventId = kill(graph);
    const trace = getTraces().find(t => t.category === 'undertaking_outcome_event') as { griefBondIds?: string[] } | undefined;
    disableTracing();

    expect(graph.getIncomingEdges(eventId, 'participated_in').some(e => e.properties.viaBondOf)).toBe(false);
    expect(trace?.griefBondIds).toBeUndefined();
    // The site edge is untouched, so the stranger standing there still witnesses it.
    expect(graph.getOutgoingEdges(eventId, 'occurred_at')[0]?.target).toBe(SITE);
  });

  it('names the reached bonds in the outcome trace', () => {
    const graph = makeWorld();
    bond(graph, VICTIM, SISTER, 0.9);
    enableTracing();
    kill(graph);
    const trace = getTraces().find(t => t.category === 'undertaking_outcome_event') as { griefBondIds?: string[] } | undefined;
    disableTracing();
    expect(trace?.griefBondIds).toEqual([SISTER]);
  });

  it('offers each grieving bond a vendetta against the killer, naming whose death it was', () => {
    const graph = makeWorld();
    bond(graph, VICTIM, SISTER, 0.9);
    bond(graph, FRIEND, VICTIM, 0.6);
    kill(graph);

    // Which drive a mortal takes is the temperament funnel's call (a blank test mortal
    // prefers to guard the home). Holding the two soft drives already isolates the
    // question this ticket owns: is the vendetta *on offer* to a grieving bond?
    const softDrives = new Set(['ambition_protect_the_home', 'ambition_flee_the_ravaged_land']);
    for (const id of [SISTER, FRIEND]) {
      const snapshot = buildAmbitionAgentSnapshot(graph, id);
      let minted = null;
      for (let s = 0; s < 80 && !minted; s++) {
        const m = mintAmbitionsFromEvents(graph, id, PASS, s, snapshot, softDrives, new Map());
        if (m?.grievance) minted = m;
      }
      expect(minted, `no seed minted ${id} a grievance`).not.toBeNull();
      expect(minted!.templateId).toBe('ambition_avenge_fallen');
      expect(minted!.grievance!.culpritAgentId).toBe(CULPRIT);
      expect(minted!.mintedByLabel).toContain('done to Oswen');
      expect(minted!.mintedByLabel).toContain("Hesk's work");
    }
  });
});

describe('the retained dead do not pursue', () => {
  it('never mints the corpse an ambition and never observes its residence', () => {
    for (let seed = 0; seed < 20; seed++) {
      const graph = makeWorld();
      kill(graph);
      phaseAmbitionProgress(makeState(graph, PASS, seed));
      expect(graph.getOutgoingEdges(VICTIM, 'pursues'), `seed ${seed}`).toHaveLength(0);
      expect(graph.getNode(VICTIM)!.properties[RESIDENCE_POSITION_PROP], `seed ${seed}`).toBeUndefined();
    }
  });

  it('still observes the living in the same pass (the skip is scoped to the dead)', () => {
    const graph = makeWorld();
    kill(graph);
    phaseAmbitionProgress(makeState(graph, PASS, 1));
    expect(graph.getNode(CULPRIT)!.properties[RESIDENCE_POSITION_PROP]).toBe(SITE);
  });
});
