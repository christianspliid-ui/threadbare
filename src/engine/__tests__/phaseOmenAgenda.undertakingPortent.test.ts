/**
 * A mortal's work casts omens (THR-1432).
 *
 * The omen agenda phase reads the `undertaking_outcome` nodes a harm-carrying
 * undertaking leaves and lets the loudest recent one become an emitted omen. Every
 * fixture node here is written by the real writer (`createUndertakingOutcomeNode`),
 * so the reader is tested against the shape the world produces, not a hand-drawn one
 * (a fixture that invented both sides would verify fiction).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { StrategicProjectRuntime, UndertakingHarmClass } from '../../types/strategicAction';
import { WorldGraph } from '../graph';
import { phaseOmenAgenda, castUndertakingPortent, PORTENDED_TICK_PROPERTY } from '../phaseOmenAgenda';
import { createUndertakingOutcomeNode } from '../grievance/undertakingOutcomeNode';
import { HARM_MAGNITUDE_BY_CLASS } from '../../data/ambition-minting-rules';
import {
  OMEN_UNDERTAKING_LOOKBACK_TICKS,
  OMEN_UNDERTAKING_WEIGHT_BY_HARM,
  OMEN_UNDERTAKING_CATEGORY_BY_HARM,
  OMEN_UNDERTAKING_DURATION_TICKS,
  EMITTED_OMEN_LOCAL_DEFAULT_RADIUS,
} from '../../data/game-config';
import { UNDERTAKING_PORTENT_HOOKS } from '../../data/omenTemplates';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';

// ─── Fixtures ────────────────────────────────────────────────────

function makeWorld(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'loc_dunmar', type: 'location', name: 'Dunmar', properties: { locationSubtype: 'town', hexCol: 3, hexRow: 4, prosperity: 50 } });
  g.addNode({ id: 'ind_hesk', type: 'actor', name: 'Hesk', properties: { actorType: 'individual' } });
  g.addNode({ id: 'ind_oswen', type: 'actor', name: 'Oswen', properties: { actorType: 'individual' } });
  g.addNode({ id: 'ind_maerin', type: 'actor', name: 'Maerin', properties: { actorType: 'individual' } });
  return g;
}

/** Write an outcome node through the real writer. */
function harm(
  g: WorldGraph,
  opts: { id: string; culprit: string; victim?: string; harmClass: UndertakingHarmClass; tick: number },
): string {
  const project = {
    projectId: opts.id,
    actorId: opts.culprit,
    templateId: 'cell.destroy.location',
    verb: 'destroy',
    targetNodeId: 'loc_dunmar',
    originLocationId: 'loc_dunmar',
  } as unknown as StrategicProjectRuntime;
  const nodeId = createUndertakingOutcomeNode({
    graph: g, project, harmClass: opts.harmClass, tick: opts.tick,
    culpritAgentId: opts.culprit, victimAgentId: opts.victim, ascendantId: 'player',
  });
  if (!nodeId) throw new Error('fixture: outcome node not written');
  return nodeId;
}

function makeState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 12,
    seed: 42,
    graph,
    doomClock: { currentStage: 0, progress: 0.1, expired: false, ticks: 5, stageTransitions: [] },
    doomDefinition: { archetype: 'breach', stages: [] },
    worldSoul: { fundament: { sphereWeights: {} }, resonance: {} },
    tickEvents: [],
    recentEvents: [],
    pendingSpherePressures: [],
    omenState: undefined,
    emittedOmens: [],
    ascendantId: 'player',
    followedAgentIds: [],
    mutedAgentIds: [],
    ...overrides,
  } as unknown as GameState;
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

// ─── The reader ───────────────────────────────────────────────────

describe('a mortal\'s work casts a portent (THR-1432)', () => {
  it('a razing within the lookback becomes an emitted omen that names its outcome node', () => {
    const g = makeWorld();
    const nodeId = harm(g, { id: 'proj_raze', culprit: 'ind_hesk', victim: 'ind_maerin', harmClass: 'property_destroyed', tick: 10 });
    const state = makeState(g, { tick: 12 });

    const result = phaseOmenAgenda(state);

    expect(result.emittedOmens, 'no portent cast').toBeDefined();
    const omen = result.emittedOmens!.find(o => o.provenance?.outcomeNodeId === nodeId);
    expect(omen, 'the portent does not name the outcome node').toBeDefined();
    expect(omen!.sourceReactionId).toBe('undertaking_outcome');
    expect(omen!.provenance).toMatchObject({
      kind: 'undertaking',
      harmClass: 'property_destroyed',
      templateId: 'cell.destroy.location',
      verb: 'destroy',
      culpritAgentId: 'ind_hesk',
      victimAgentId: 'ind_maerin',
      siteId: 'loc_dunmar',
      followed: false,
    });
    // The deed in words, never a cell id or a node id on the hook.
    expect(omen!.provenance!.deed).toBe('the razing of Dunmar — Hesk\'s work');
    expect(omen!.narrativeHook).toContain('Dunmar');
    expect(omen!.narrativeHook).not.toMatch(/evt_und_|cell\.|[{}]/);
    expect(omen!.narrativeHook).not.toMatch(/\d/);
    // Placed where it happened, at the harm's own weight, for a day.
    expect(omen!.scope).toEqual({ kind: 'local', hexCol: 3, hexRow: 4, radius: EMITTED_OMEN_LOCAL_DEFAULT_RADIUS });
    expect(omen!.category).toBe(OMEN_UNDERTAKING_CATEGORY_BY_HARM.property_destroyed);
    expect(omen!.intensity).toBeCloseTo(HARM_MAGNITUDE_BY_CLASS.property_destroyed * OMEN_UNDERTAKING_WEIGHT_BY_HARM.property_destroyed, 6);
    expect(omen!.emittedTick).toBe(12);
    expect(omen!.expiresTick).toBe(12 + OMEN_UNDERTAKING_DURATION_TICKS);

    // The node is stamped, the chronicle carries the line, the trace says why.
    expect(g.getNode(nodeId)!.properties[PORTENDED_TICK_PROPERTY]).toBe(12);
    expect(result.tickEvents!.some(e => e.type === 'narrative' && e.message === omen!.narrativeHook)).toBe(true);
    const trace = getTraces().find(t => t.category === 'omen_emitted') as Record<string, unknown> | undefined;
    expect(trace).toBeDefined();
    expect(trace).toMatchObject({ sourceReactionId: 'undertaking_outcome', outcomeNodeId: nodeId, harmClass: 'property_destroyed', followed: false });
    expect((trace!.candidates as unknown[]).length).toBe(1);
  });

  it('nothing portends when the only outcome is older than the lookback', () => {
    const g = makeWorld();
    const tick = 12;
    const nodeId = harm(g, { id: 'proj_old', culprit: 'ind_hesk', harmClass: 'property_destroyed', tick: tick - OMEN_UNDERTAKING_LOOKBACK_TICKS - 1 });
    const state = makeState(g, { tick });

    const result = phaseOmenAgenda(state);

    expect(result.emittedOmens).toBeUndefined();
    expect(g.getNode(nodeId)!.properties[PORTENDED_TICK_PROPERTY]).toBeUndefined();
    expect(castUndertakingPortent(state, () => 0).reason).toBe('no_recent_outcome');
  });

  it('a followed culprit\'s work outranks an unfollowed one at equal harm — in either direction', () => {
    const build = (followed: string) => {
      const g = makeWorld();
      const a = harm(g, { id: 'proj_a', culprit: 'ind_hesk', harmClass: 'holding_seized', tick: 11 });
      const b = harm(g, { id: 'proj_b', culprit: 'ind_oswen', harmClass: 'holding_seized', tick: 11 });
      const state = makeState(g, { tick: 12, followedAgentIds: [followed] });
      return { a, b, portent: castUndertakingPortent(state, () => 0.999) };
    };

    const followB = build('ind_oswen');
    expect(followB.portent.omen?.provenance?.outcomeNodeId).toBe(followB.b);
    expect(followB.portent.omen?.provenance?.followed).toBe(true);
    expect(followB.portent.reason).toBe('top_score');

    const followA = build('ind_hesk');
    expect(followA.portent.omen?.provenance?.outcomeNodeId).toBe(followA.a);

    // The attention term is the whole difference: both weighed, one doubled.
    const scores = new Map(followB.portent.candidates.map(c => [c.node.id, c.score]));
    expect(scores.get(followB.b)! / scores.get(followB.a)!).toBeCloseTo(2, 6);
  });

  it('the victim\'s follow counts as much as the culprit\'s', () => {
    const g = makeWorld();
    const unwatched = harm(g, { id: 'proj_u', culprit: 'ind_hesk', harmClass: 'network_severed', tick: 11 });
    const watched = harm(g, { id: 'proj_w', culprit: 'ind_oswen', victim: 'ind_maerin', harmClass: 'network_severed', tick: 11 });
    const state = makeState(g, { tick: 12, followedAgentIds: ['ind_maerin'] });
    const portent = castUndertakingPortent(state, () => 0);
    expect(portent.omen?.provenance?.outcomeNodeId).toBe(watched);
    expect(portent.candidates.find(c => c.node.id === unwatched)?.followed).toBe(false);
  });

  it('a heavier harm outranks a lighter one whoever is followed', () => {
    const g = makeWorld();
    harm(g, { id: 'proj_walk', culprit: 'ind_hesk', harmClass: 'undertaking_abandoned', tick: 11 });
    const killing = harm(g, { id: 'proj_kill', culprit: 'ind_oswen', victim: 'ind_maerin', harmClass: 'named_death', tick: 11 });
    const state = makeState(g, { tick: 12, followedAgentIds: ['ind_hesk'] });
    expect(castUndertakingPortent(state, () => 0).omen?.provenance?.outcomeNodeId).toBe(killing);
  });

  it('an outcome portends once — the stamp keeps it out of the next tick\'s weighing', () => {
    const g = makeWorld();
    harm(g, { id: 'proj_once', culprit: 'ind_hesk', harmClass: 'property_destroyed', tick: 10 });
    const first = phaseOmenAgenda(makeState(g, { tick: 12 }));
    expect(first.emittedOmens).toHaveLength(1);

    const second = phaseOmenAgenda(makeState(g, { tick: 13, emittedOmens: first.emittedOmens }));
    expect(second.emittedOmens).toBeUndefined();
  });

  it('at most one portent per tick — the runner-up waits for the next tick', () => {
    const g = makeWorld();
    harm(g, { id: 'proj_1', culprit: 'ind_hesk', harmClass: 'property_destroyed', tick: 11 });
    harm(g, { id: 'proj_2', culprit: 'ind_oswen', harmClass: 'holding_seized', tick: 11 });
    const first = phaseOmenAgenda(makeState(g, { tick: 12 }));
    expect(first.emittedOmens).toHaveLength(1);
    const second = phaseOmenAgenda(makeState(g, { tick: 13, emittedOmens: first.emittedOmens }));
    expect(second.emittedOmens).toHaveLength(2);
    expect(new Set(second.emittedOmens!.map(o => o.provenance?.outcomeNodeId)).size).toBe(2);
  });

  it('the same world casts the same portent (a tie is one seeded draw)', () => {
    const run = () => {
      const g = makeWorld();
      harm(g, { id: 'proj_x', culprit: 'ind_hesk', harmClass: 'property_destroyed', tick: 11 });
      harm(g, { id: 'proj_y', culprit: 'ind_oswen', harmClass: 'property_destroyed', tick: 11 });
      return phaseOmenAgenda(makeState(g, { tick: 12 })).emittedOmens?.[0]?.omenId;
    };
    const a = run();
    expect(a).toBeDefined();
    expect(run()).toBe(a);
    const g = makeWorld();
    harm(g, { id: 'proj_x', culprit: 'ind_hesk', harmClass: 'property_destroyed', tick: 11 });
    harm(g, { id: 'proj_y', culprit: 'ind_oswen', harmClass: 'property_destroyed', tick: 11 });
    expect(castUndertakingPortent(makeState(g, { tick: 12 }), () => 0).reason).toBe('tie_draw_2');
  });

  it('every harm class has a weight, a category and a hook', () => {
    const classes = Object.keys(HARM_MAGNITUDE_BY_CLASS).sort();
    expect(Object.keys(OMEN_UNDERTAKING_WEIGHT_BY_HARM).sort()).toEqual(classes);
    expect(Object.keys(OMEN_UNDERTAKING_CATEGORY_BY_HARM).sort()).toEqual(classes);
    expect(Object.keys(UNDERTAKING_PORTENT_HOOKS).sort()).toEqual(classes);
    for (const hook of Object.values(UNDERTAKING_PORTENT_HOOKS)) {
      expect(hook).toMatch(/\{deed\}/);
      expect(hook).toMatch(/\{place\}/);
      expect(hook).not.toMatch(/\d|!/);
    }
  });
});
