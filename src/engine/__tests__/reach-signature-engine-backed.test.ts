/**
 * THR-555: the three engine-backed reach-signature *templates* resolve to their
 * shipped effects when fired as a player-god card on a target — proving the
 * `$target` / `$primary` sentinel binding (`bindReachSignatureTargets`) wires the
 * authored content (reach-signature-content.ts) into the shipped resolvers
 * (THR-550/551/552). The resolvers' own mechanics (scaling, dedup, fallbacks) are
 * covered by their per-effect suites; here we assert the *content → target binding*
 * seam only.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import {
  REACH_SIGNATURE_CONTENT_TEMPLATES,
  GREAT_WORK_UNIQUE_TAG,
} from '../../data/reach-signature-content';
import { GREAT_WORK_ARTIFACT_TIER } from '../../data/game-config';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

const template = (id: string) => {
  const t = REACH_SIGNATURE_CONTENT_TEMPLATES.find(x => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
};
const reactionOf = (id: string): EncounterAftermathReaction =>
  template(id).aftermathConfig!.fallback.reactions![0];

/** Ascendant with a configurable primary Creation Sphere, a faction, and a
 *  hexed location — the minimum graph for the three signatures' targets. */
function buildState(primarySphere = 'mind'): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'The Ascendant',
    properties: {
      actorType: 'individual',
      sphereAlignment: { primary: primarySphere },
      sphereAffinity: { scores: { [primarySphere]: 8 }, progress: {} },
    },
  });
  graph.addNode({ id: 'faction-iron', type: 'actor', name: 'Iron Legion', properties: { actorType: 'faction', actorStatus: 'active' } });
  graph.addNode({ id: 'loc-target', type: 'location', name: 'The Deep Keep', properties: { hexCol: 4, hexRow: 7 } });
  graph.addNode({ id: 'leader-1', type: 'actor', name: 'Warleader', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'leader_member', source: 'leader-1', target: 'faction-iron', type: 'member_of', properties: { reputation: 0.6, role: 'member', rank: 'member', joinedTick: 0 } });
  graph.addEdge({ id: 'leader_loc', source: 'leader-1', target: 'loc-target', type: 'located_at', properties: {} });
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

function makeAction(targetId: string, templateId: string): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId, targetId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as UnifiedAction;
}

describe('reach-signature engine-backed templates — target binding (THR-555)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('Iron / Warhost: $target binds signature_warhost to the played-on faction', () => {
    const state = buildState('force');
    const action = makeAction('faction-iron', 'invest.iron.warhost');
    const { state: next } = applyEncounterAftermathReaction(state, action, reactionOf('invest.iron.warhost'), 50, runtime);

    const faction = next.graph.getNode('faction-iron')!;
    expect(faction.properties.mobilized).toBe(true);
    expect(typeof faction.properties.mobilizedStrength).toBe('number');
  });

  it('Veil / Rend the Gate: $target anchors the rift + $primary sets the caster sphere', () => {
    const state = buildState('mind'); // caster's primary Creation Sphere
    const action = makeAction('loc-target', 'invest.veil.rend_the_gate');
    const { state: next } = applyEncounterAftermathReaction(state, action, reactionOf('invest.veil.rend_the_gate'), 50, runtime);

    const rift = (next.controlEffects ?? []).find(e => e.targetNodeId === 'loc-target');
    expect(rift, 'rift ControlEffect on the target location').toBeDefined();
    // $primary bound to the caster's primary sphere (mind), not the sentinel.
    expect(rift!.perTickSphereInfluence?.sphere).toBe('mind');
    expect(rift!.targetHexCol).toBe(4);
    expect(rift!.targetHexRow).toBe(7);
  });

  it('Stone / The Great Work: $target places the unique forge at the target hex + forges a legendary relic', () => {
    const state = buildState('matter');
    const action = makeAction('loc-target', 'invest.stone.great_work');
    const { state: next } = applyEncounterAftermathReaction(state, action, reactionOf('invest.stone.great_work'), 50, runtime);

    const work = next.graph.getNodesByType('location').find(n => n.properties.uniqueTag === GREAT_WORK_UNIQUE_TAG);
    expect(work, 'minted Great Work location').toBeDefined();
    expect(work!.properties.locationSubtype).toBe('master_forge');
    expect(work!.properties.hexCol).toBe(4); // resolved from loc-target's hex
    expect(work!.properties.hexRow).toBe(7);
    // A legendary relic (artifactForgeTier) bonded to the ascendant.
    const relic = next.graph.getNodesByType('artifact_legendary').find(n => (n.properties.tags as string[] | undefined)?.includes('great_work'));
    expect(relic, 'legendary Great Work relic').toBeDefined();
    expect(relic!.properties.tier).toBe(GREAT_WORK_ARTIFACT_TIER);
    expect(next.graph.getOutgoingEdges('actor-hero', 'bonded_to').some(e => e.target === relic!.id)).toBe(true);
  });

  it('is a no-op for the target binding when no sentinel is present (idempotent pass-through)', () => {
    // A hand-built warhost effect with a literal faction id must not be rewritten.
    const state = buildState('force');
    const literal: EncounterAftermathReaction = {
      id: 'rx', label: 'x',
      effects: [{ kind: 'signature_warhost', factionId: 'faction-iron' }],
    } as EncounterAftermathReaction;
    const action = makeAction('some-other-node', 'x');
    const { state: next } = applyEncounterAftermathReaction(state, action, literal, 50, runtime);
    expect(next.graph.getNode('faction-iron')!.properties.mobilized).toBe(true);
  });
});
