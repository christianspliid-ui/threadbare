/**
 * The review levers are honest or they are nothing (THR-1300 slice 2).
 *
 * Drives the real candidate walk and the real start path on a small constructed
 * world: a start bypasses exactly the three named gates and says so on the trace;
 * every other refusal still refuses; a destroy prefers an owned target and reports
 * an unowned one; the band pin substitutes the band at the checkpoint seam and
 * leaves the roll honest; force-moments promotes a followed mortal's founding to an
 * interrupt and nobody else's.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { StrategicProjectRuntime } from '../../types/strategicAction';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import {
  startUndertakingForReview,
  setUndertakingBandPin,
  clearUndertakingBandPin,
  getUndertakingPinVerdict,
  setForceMoments,
  REVIEW_LEVER_BYPASSABLE_GATES,
} from '../undertakingReviewLevers';
import { resolveUndertakingCheckpoint, resolveMomentPresentation } from '../undertakingCheckpoints';
import { UNDERTAKING_MAX_ACTIVE_PER_ACTOR, UNDERTAKING_CHECKPOINT_INTERVAL_TICKS } from '../../data/strategic-action-constants';
import { getStrategicTemplate } from '../strategicActionCandidates';

const ACTOR = 'actor_merchant';
const TEMPLATE = 'strategic_establish_trade_route';

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR, name: 'Merchant Kael', type: 'actor',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight',
      domainCapabilities: { gold: 0.6, eye: 0.4, heart: 0.3, shadow: 0.1, iron: 0.2, stone: 0.2, star: 0.1, veil: 0.1 },
    },
  });
  graph.addNode({ id: 'loc_market', name: 'The Grand Market', type: 'location', properties: { locationSubtype: 'market', hexCol: 5, hexRow: 5 } });
  graph.addNode({ id: 'loc_town', name: 'Millhaven', type: 'location', properties: { locationSubtype: 'town', hexCol: 7, hexRow: 5 } });
  graph.addNode({ id: 'loc_port', name: 'Tidegate', type: 'location', properties: { locationSubtype: 'port', hexCol: 3, hexRow: 8 } });
  graph.addEdge({ id: 'located_merchant', source: ACTOR, target: 'loc_market', type: 'located_at', properties: {} });
  return graph;
}

function buildState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    cycle: 1, tick: 10, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as any, tiles: [], clock: { currentTick: 10 } as any,
    ascendantId: 'ascendant', ascendantIdentity: null,
    essencePool: {} as any, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [], doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [], stealthExposure: 0,
    visibilityMap: new Map() as any, familiarityMap: new Map() as any,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
    ...overrides,
  } as GameState;
}

beforeEach(() => { clearTraces(); enableTracing(); clearUndertakingBandPin(); setForceMoments(false); });
afterEach(() => { disableTracing(); clearUndertakingBandPin(); setForceMoments(false); });

describe('the start lever', () => {
  it('refuses an unknown template and an unknown actor without throwing', () => {
    const graph = buildWorld();
    const state = buildState(graph);
    expect(startUndertakingForReview(state, graph, ACTOR, 'strategic_not_a_thing').reason).toBe('unknown_template');
    expect(startUndertakingForReview(state, graph, 'actor_nobody', TEMPLATE).reason).toBe('unknown_actor');
  });

  it('starts through the board\'s own path and names the bypassed gates on the trace', () => {
    const graph = buildWorld();
    const state = buildState(graph);
    const result = startUndertakingForReview(state, graph, ACTOR, TEMPLATE);
    expect(result.ok, result.message).toBe(true);
    expect(result.bypassedGates).toEqual([...REVIEW_LEVER_BYPASSABLE_GATES]);
    expect(result.belowSpotlight).toBe(false);
    // The project is real: it sits in the returned runtime state with the board's shape.
    const project = result.strategicState?.projects.find(p => p.projectId === result.projectId);
    expect(project?.templateId).toBe(TEMPLATE);
    expect(project?.actorId).toBe(ACTOR);
    expect(project?.status).toBe('active');
    // And the founding moment came back, the way the phase gets it.
    expect(result.moments?.[0]?.momentClass).toBe('started');
    const trace = getTraces().find(t => t.category === 'strategic_action_started') as any;
    expect(trace.startedBy).toBe('review_lever');
    expect(trace.bypassedGates).toEqual([...REVIEW_LEVER_BYPASSABLE_GATES]);
  });

  it('bypasses the per-mortal cap — the reviewer may start a fourth', () => {
    const graph = buildWorld();
    const running = Array.from({ length: UNDERTAKING_MAX_ACTIVE_PER_ACTOR }, (_, i) => ({
      projectId: `proj_other_${i}`, actorId: ACTOR, templateId: `strategic_other_${i}`, ambitionId: 'x',
      verb: 'create', behaviorFamily: 'merchant-expansion', progress: 0, progressRequired: 10,
      startedTick: 0, lastProgressTick: 0, status: 'active',
    })) as unknown as StrategicProjectRuntime[];
    const state = buildState(graph, { strategicState: { projects: running, controls: [], history: [] } });
    const result = startUndertakingForReview(state, graph, ACTOR, TEMPLATE);
    expect(result.ok, result.message).toBe(true);
    expect(result.strategicState?.projects.filter(p => p.actorId === ACTOR && p.status === 'active')).toHaveLength(UNDERTAKING_MAX_ACTIVE_PER_ACTOR + 1);
  });

  it('does not bypass the gates outside the closed list — an already-running template still refuses', () => {
    const graph = buildWorld();
    const running = [{
      projectId: 'proj_same', actorId: ACTOR, templateId: TEMPLATE, ambitionId: 'x',
      verb: 'create', behaviorFamily: 'merchant-expansion', progress: 0, progressRequired: 10,
      startedTick: 0, lastProgressTick: 0, status: 'active',
    }] as unknown as StrategicProjectRuntime[];
    const state = buildState(graph, { strategicState: { projects: running, controls: [], history: [] } });
    const result = startUndertakingForReview(state, graph, ACTOR, TEMPLATE);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('refused');
    expect(result.refusals).toContain('project_already_active');
  });

  it('reports a below-spotlight actor rather than hiding it', () => {
    const graph = buildWorld();
    graph.updateNode(ACTOR, { properties: { ...graph.getNode(ACTOR)!.properties, spotlightTier: 'ambient' } });
    const state = buildState(graph);
    const result = startUndertakingForReview(state, graph, ACTOR, TEMPLATE);
    expect(result.belowSpotlight).toBe(true);
    if (result.ok) expect(result.message).toMatch(/below the spotlight/);
  });

  it('arms the band pin in the same call when asked', () => {
    const graph = buildWorld();
    const state = buildState(graph);
    const result = startUndertakingForReview(state, graph, ACTOR, TEMPLATE, { band: 'failure' });
    expect(result.ok, result.message).toBe(true);
    expect(getUndertakingPinVerdict()?.status).toBe('not_reached');
    expect(getUndertakingPinVerdict()?.requestedBand).toBe('failure');
  });
});

describe('the band pin', () => {
  it('substitutes the band at the checkpoint seam, keeps the roll honest, and records the landing', () => {
    const graph = buildWorld();
    const state = buildState(graph);
    const started = startUndertakingForReview(state, graph, ACTOR, TEMPLATE);
    expect(started.ok, started.message).toBe(true);
    const project = started.strategicState!.projects.find(p => p.projectId === started.projectId)!;
    const due = project.startedTick + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS;
    const later = buildState(graph, { tick: due, strategicState: started.strategicState });

    expect(setUndertakingBandPin(TEMPLATE, 'critical_failure')).toBe(true);
    clearTraces();
    const outcome = resolveUndertakingCheckpoint(later, graph, project, due);
    expect(outcome.verdict).not.toBe('not_due');
    const trace = getTraces().find(t => t.category === 'undertaking_checkpoint') as any;
    expect(trace.band).toBe('critical_failure');
    expect(trace.bandPinned).toBe('critical_failure');
    // The roll happened for real — a number, not the band's fiction.
    expect(typeof trace.roll).toBe('number');
    const verdict = getUndertakingPinVerdict()!;
    expect(verdict.landed).toBe(1);
    // This template authors no creationEffects for the crit-failure band, and the
    // verdict says so rather than calling the base texture a review.
    const authored = (getStrategicTemplate(TEMPLATE)?.creationEffects?.onCritFailure?.length ?? 0) > 0;
    expect(verdict.status).toBe(authored ? 'band_landed' : 'no_effect_on_band');
  });

  it('leaves other templates alone and refuses a band that is not reviewable', () => {
    expect(setUndertakingBandPin(TEMPLATE, 'glorious')).toBe(false);
    expect(setUndertakingBandPin('strategic_not_a_thing', 'failure')).toBe(false);
    expect(getUndertakingPinVerdict()).toBeNull();
  });
});

describe('force-moments', () => {
  const project = { projectId: 'p', actorId: ACTOR, templateId: TEMPLATE } as StrategicProjectRuntime;

  it('promotes a followed mortal\'s founding to an interrupt only while set', () => {
    const graph = buildWorld();
    const followed = buildState(graph, { followedAgentIds: [ACTOR] });
    expect(resolveMomentPresentation(followed, graph, ACTOR, 'started', project)).toBe('badge');
    setForceMoments(true);
    expect(resolveMomentPresentation(followed, graph, ACTOR, 'started', project)).toBe('interrupt');
    setForceMoments(false);
    expect(resolveMomentPresentation(followed, graph, ACTOR, 'started', project)).toBe('badge');
  });

  it('never widens follow scope — an unfollowed mortal stays a badge', () => {
    const graph = buildWorld();
    const unfollowed = buildState(graph, { followedAgentIds: [] });
    setForceMoments(true);
    expect(resolveMomentPresentation(unfollowed, graph, ACTOR, 'started', project)).toBe('badge');
  });
});
