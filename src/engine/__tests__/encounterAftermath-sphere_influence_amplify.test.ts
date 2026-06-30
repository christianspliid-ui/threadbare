/**
 * THR-551: Veil / Rend the Gate reach-signature aftermath effect
 * (`sphere_influence_amplify`).
 *
 * Covers: rift establishment as a ControlEffect on the location, sphere-power
 * scaling of magnitude / cost / leak-chance (THR-548), and fail-soft no-ops
 * (missing / non-location target, missing actor).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import {
  RIFT_PERTICK_COST,
  RIFT_INFLUENCE_PER_TICK,
  RIFT_INFLUENCE_CAP,
  RIFT_LEAK_CHANCE,
} from '../../data/game-config';
import { SIGNATURE_SCALE_CEIL, SIGNATURE_SCALE_FLOOR } from '../../data/reach-signature-content';
import { MAX_SPHERE_SCORE } from '../../types/sphereAffinity';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';

/** Ascendant firing the encounter; primary sphere `entropy` at the requested score. */
function buildState(opts: { actorSphereScore?: number; withLocation?: boolean } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Veil',
    properties: {
      actorType: 'individual',
      sphereAlignment: { primary: 'entropy' },
      sphereAffinity: { scores: { entropy: opts.actorSphereScore ?? 10 }, progress: {} },
    },
  });
  if (opts.withLocation !== false) {
    graph.addNode({
      id: 'loc-rift', type: 'location', name: 'Riftmouth',
      properties: { hexCol: 4, hexRow: 6, sphereAffinity: { scores: { entropy: 0 }, progress: {} } },
    });
  }
  // A non-location node for the wrong-type fail-soft test.
  graph.addNode({ id: 'not-a-loc', type: 'actor', name: 'Bystander', properties: { actorType: 'individual' } });
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
    clearanceGateStates: new Map(), controlEffects: [],
  } as GameState;
}

function makeAction(actorId: string | undefined = 'actor-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.rift', targetId: actorId ?? 'x',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-rift', label: 'Rend the Gate', effects } as EncounterAftermathReaction;
}

function apply(state: GameState, reaction: EncounterAftermathReaction, runtime: SimulationRuntime, actorId: string | undefined = 'actor-hero', tick = 50) {
  return applyEncounterAftermathReaction(state, makeAction(actorId), reaction, tick, runtime);
}

const riftEffect = (): EncounterAftermathReactionEffect =>
  ({ kind: 'sphere_influence_amplify', locationId: 'loc-rift', sphere: 'entropy', durationMode: 'sustained' } as EncounterAftermathReactionEffect);

describe('sphere_influence_amplify (rift)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('establishes a rift ControlEffect on the location, scaled at max sphere power', () => {
    const state = buildState({ actorSphereScore: 10 }); // mult = SIGNATURE_SCALE_CEIL (2.0)
    const result = apply(state, makeReaction([riftEffect()]), runtime);

    const effects = result.state.controlEffects ?? [];
    expect(effects.length).toBe(1);
    const eff = effects[0];
    expect(eff.targetNodeId).toBe('loc-rift');
    expect(eff.targetHexCol).toBe(4);
    expect(eff.targetHexRow).toBe(6);
    expect(eff.active).toBe(true);

    // perTickCost: scaledCost(RIFT_PERTICK_COST, ceil) = base * max(1, 2.0)
    expect(eff.perTickCost.entropy).toBeCloseTo(RIFT_PERTICK_COST * SIGNATURE_SCALE_CEIL);
    // magnitude: scaledEffect(RIFT_INFLUENCE_PER_TICK, ceil)
    expect(eff.perTickSphereInfluence!.magnitude).toBeCloseTo(RIFT_INFLUENCE_PER_TICK * SIGNATURE_SCALE_CEIL);
    expect(eff.perTickSphereInfluence!.sphere).toBe('entropy');
    expect(eff.perTickSphereInfluence!.cap).toBe(Math.min(RIFT_INFLUENCE_CAP, MAX_SPHERE_SCORE));
    // leak chance: min(1, RIFT_LEAK_CHANCE * ceil)
    expect(eff.perTickLeak!.chance).toBeCloseTo(Math.min(1, RIFT_LEAK_CHANCE * SIGNATURE_SCALE_CEIL));

    const trace = getTraces().find(t => t.category === 'ascendant.signature.rift');
    expect(trace).toBeDefined();
    expect((trace as { success?: boolean }).success).toBe(true);
  });

  it('scales magnitude and cost down at low sphere power (floor multiplier)', () => {
    const state = buildState({ actorSphereScore: 0 }); // mult = SIGNATURE_SCALE_FLOOR (0.6)
    const result = apply(state, makeReaction([riftEffect()]), runtime);
    const eff = (result.state.controlEffects ?? [])[0];
    // magnitude scales by floor; cost is floored at 1× (never a discount).
    expect(eff.perTickSphereInfluence!.magnitude).toBeCloseTo(RIFT_INFLUENCE_PER_TICK * SIGNATURE_SCALE_FLOOR);
    expect(eff.perTickCost.entropy).toBeCloseTo(RIFT_PERTICK_COST); // max(1, 0.6) = 1
    expect(eff.perTickLeak!.chance).toBeCloseTo(RIFT_LEAK_CHANCE * SIGNATURE_SCALE_FLOOR);
  });

  it('honors an authored perTick override', () => {
    const state = buildState({ actorSphereScore: 0 }); // floor
    const eff: EncounterAftermathReactionEffect =
      { kind: 'sphere_influence_amplify', locationId: 'loc-rift', sphere: 'entropy', perTick: 5, durationMode: 'sustained' } as EncounterAftermathReactionEffect;
    const result = apply(state, makeReaction([eff]), runtime);
    expect((result.state.controlEffects ?? [])[0].perTickSphereInfluence!.magnitude).toBeCloseTo(5 * SIGNATURE_SCALE_FLOOR);
  });

  it('fail-soft: missing location spawns no effect', () => {
    const state = buildState({ withLocation: false });
    const result = apply(state, makeReaction([riftEffect()]), runtime);
    expect((result.state.controlEffects ?? []).length).toBe(0);
    const trace = getTraces().find(t => t.category === 'ascendant.signature.rift');
    expect((trace as { success?: boolean }).success).toBe(false);
    expect((trace as { failReason?: string }).failReason).toBe('location_missing');
  });

  it('fail-soft: non-location target spawns no effect', () => {
    const state = buildState();
    const eff: EncounterAftermathReactionEffect =
      { kind: 'sphere_influence_amplify', locationId: 'not-a-loc', sphere: 'entropy', durationMode: 'sustained' } as EncounterAftermathReactionEffect;
    const result = apply(state, makeReaction([eff]), runtime);
    expect((result.state.controlEffects ?? []).length).toBe(0);
    expect((getTraces().find(t => t.category === 'ascendant.signature.rift') as { failReason?: string }).failReason).toBe('not_a_location');
  });

  it('fail-soft: no acting ascendant spawns no effect', () => {
    const state = buildState();
    // Build an action whose actorId is genuinely absent (passing `undefined` to
    // makeAction would trigger its default param, so construct it directly).
    const ownerlessAction = { ...makeAction(), actorId: undefined } as UnifiedAction;
    const result = applyEncounterAftermathReaction(state, ownerlessAction, makeReaction([riftEffect()]), 50, runtime);
    expect((result.state.controlEffects ?? []).length).toBe(0);
    expect((getTraces().find(t => t.category === 'ascendant.signature.rift') as { failReason?: string }).failReason).toBe('no_owner');
  });
});
