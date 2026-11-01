/**
 * THR-2086 — energy gets cards a god can cast.
 *
 * Before this, none of the ascendant-castable cards carried `sphereAffinity:
 * 'energy'`, so a Kindle, Wander or Illuminate god earned energy essence and
 * had nothing to spend it on that grew energy. Two tier-1 market cards on
 * existing ops: Stoke the Forges (a town) and Kindle a Spark (a mortal).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import { executeGraphOps, resetOpCounter } from '../../engine/graphOpExecutor';
import { buildValueOverlay, getDivineInfluences } from '../../engine/interventionEffects';
import { godPushScale, phaseUnifiedActionProgress } from '../../engine/unifiedActionResolution';
import { offerableCards, priceSphere } from '../../engine/godProgression';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../engine/traceBuffer';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../unified-action-templates';
import { KINDLE_SPARK_VALUE_DRIFT, INSPIRE_VALUE_DRIFT, COMPULSION_VALUE_DRIFT } from '../dream-content';
import { LOC_STOKE_FORGES_PROSPERITY_DELTA, LOC_STOKE_FORGES_UNREST_DELTA } from '../location-action-constants';
import { ECON_SHOCK_DELTA } from '../economic-scene-affinity';
import { ACTION_PRESSURE_SUCCESS } from '../../types/sphereAffinity';
import { VALUE_PAIRS } from '../../types/agent';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { AxiologicalProfile } from '../../types/agent';
import type { GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';

const GOD = 'asc-1';
const TOWN = 'town-1';
const MORTAL = 'mortal-1';

function successOps(id: string): GraphOp[] {
  const t = getUnifiedTemplateById(id)!;
  return t.steps.flatMap((s) => (isActionStepBranch(s) ? [] : s.onSuccess ?? [])) as GraphOp[];
}

function profile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base = Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
  return { ...base, ...overrides };
}

describe('THR-2086 — the energy census', () => {
  const castable = UNIFIED_ACTION_TEMPLATES.filter(
    (t) => (t.essenceCost ?? 0) > 0 && t.actorAffinities.includes('ascendant'),
  );
  const energy = castable.filter((t) => t.sphereAffinity === 'energy');

  it('at least two ascendant-castable cards carry energy', () => {
    expect(energy.map((t) => t.id)).toEqual(expect.arrayContaining(['loc.stoke_forges', 'divine.kindle_spark']));
    expect(energy.length).toBeGreaterThanOrEqual(2);
  });

  it('one of them targets a place, priced in the band of the other spheres\' cheapest place cards', () => {
    const place = energy.filter((t) => t.targetCategories?.includes('location'));
    expect(place.length).toBeGreaterThanOrEqual(1);
    expect(Math.min(...place.map((t) => t.essenceCost ?? Infinity))).toBeLessThanOrEqual(4);
  });

  it('both are tier-1 market cards with no pricedIn override', () => {
    for (const id of ['loc.stoke_forges', 'divine.kindle_spark']) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.progression).toMatchObject({ tier: 1, offer: 'market', generic: false });
      expect(t.progression?.pricedIn).toBeUndefined();
    }
  });
});

describe('THR-2086 — Stoke the Forges', () => {
  it('raises prosperity past the shock line and heats unrest', () => {
    expect(LOC_STOKE_FORGES_PROSPERITY_DELTA).toBeGreaterThanOrEqual(ECON_SHOCK_DELTA);
    resetOpCounter();
    const graph = new WorldGraph();
    graph.addNode({ id: GOD, type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: TOWN, type: 'location', name: 'Hollowmere', properties: { prosperity: 40, unrest: 10 } });
    const result = executeGraphOps(graph, successOps('loc.stoke_forges'), { actorId: GOD, targetId: TOWN, locationId: TOWN, tick: 5 });
    expect(result.allSucceeded).toBe(true);
    const props = graph.getNode(TOWN)!.properties;
    expect(props.prosperity).toBe(40 + LOC_STOKE_FORGES_PROSPERITY_DELTA);
    expect(props.unrest).toBe(10 + LOC_STOKE_FORGES_UNREST_DELTA);
  });

  it('a resolved cast pushes energy pressure on the town', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: GOD, type: 'actor', name: 'God', properties: { actorType: 'ascendant', domainCapabilities: {} } });
    graph.addNode({ id: TOWN, type: 'location', name: 'Hollowmere', properties: { prosperity: 40, unrest: 10 } });
    const tpl = { ...getUnifiedTemplateById('loc.stoke_forges')! };
    // Pin the roll: the success branch is what this asserts.
    tpl.steps = tpl.steps.map((s) => (isActionStepBranch(s) ? s : { ...s, difficulty: 0, duration: { min: 2, max: 2 } }));
    const action = {
      actionId: 'act_stoke', actorId: GOD, targetId: TOWN, templateId: tpl.id,
      currentStep: 0, stepProgress: 2, stepDuration: 2, totalProgress: 2, startedTick: 0,
      resolved: false, outcome: undefined, scale: 'local' as const, source: 'agent' as const, stepOutcomes: [],
    };
    const state = {
      tick: 1, seed: 42, phase: 'playing', graph, tickEvents: [], pendingSpherePressures: [], controlEffects: [],
      unifiedActions: [action], encounterProgress: [], rivalDefinitions: [], rivalStates: [], tiles: [],
      ascendantId: GOD, pendingHexMutations: [],
    } as unknown as GameState;
    const result = phaseUnifiedActionProgress(state, [tpl], () => 0.5) as Partial<GameState>;
    const push = (result.pendingSpherePressures ?? []).find((p) => p.sphere === 'energy' && p.source === 'divine_action');
    // THR-2094: the god's 2-essence working pushes twice a look.
    expect(push).toMatchObject({ targetEntityId: TOWN, magnitude: ACTION_PRESSURE_SUCCESS * godPushScale(true, tpl.essenceCost), pushScale: 2 });
  });
});

describe('THR-2086 — Kindle a Spark', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetOpCounter();
    clearTraces();
    enableTracing();
    graph = new WorldGraph();
    // Iron-primary god: the bound pair is mercy_ruthlessness.
    graph.addNode({ id: GOD, type: 'actor', name: 'The God', properties: { domainAffinities: { iron: 0.9, heart: 0.4 } } });
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Here', properties: {} });
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  function cast(lean: number) {
    graph.addNode({ id: MORTAL, type: 'actor', name: 'Mara', properties: { axiologicalProfile: profile({ mercy_ruthlessness: lean }) } });
    return executeGraphOps(graph, successOps('divine.kindle_spark'), { actorId: GOD, targetId: MORTAL, locationId: 'loc-1', tick: 10 });
  }

  it('writes an energy influence that deepens the mortal\'s own lean', () => {
    expect(cast(0.3).allSucceeded).toBe(true);
    const [entry] = getDivineInfluences(graph, MORTAL);
    expect(entry).toMatchObject({ interventionType: 'inspire_intervention', sphere: 'energy' });
    expect(entry.valueDrifts).toEqual({ mercy_ruthlessness: KINDLE_SPARK_VALUE_DRIFT });

    const base = graph.getNode(MORTAL)!.properties.axiologicalProfile as AxiologicalProfile;
    expect(buildValueOverlay(base, [entry], 10).mercy_ruthlessness).toBeGreaterThan(0.3);
  });

  it('the sign follows the lean', () => {
    cast(-0.2);
    expect(getDivineInfluences(graph, MORTAL)[0].valueDrifts).toEqual({ mercy_ruthlessness: -KINDLE_SPARK_VALUE_DRIFT });
  });

  it('a mortal at exactly 0 holds nothing and the no-lean trace fires', () => {
    expect(cast(0).allSucceeded).toBe(true);
    expect(getDivineInfluences(graph, MORTAL)).toHaveLength(0);
    expect(getTraces().find((t) => t.category === 'influence.no_lean')).toBeDefined();
  });

  it('runs hotter than Inspire, short of the compulsion', () => {
    expect(KINDLE_SPARK_VALUE_DRIFT).toBeGreaterThan(INSPIRE_VALUE_DRIFT);
    expect(KINDLE_SPARK_VALUE_DRIFT).toBeLessThan(COMPULSION_VALUE_DRIFT);
  });
});

describe('THR-2086 — a Kindle god is offered both, priced in energy', () => {
  it('the tier-1 offer pool holds both cards and each prices in energy', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: GOD, type: 'actor', name: 'God',
      properties: { actorType: 'ascendant', domainAffinities: { heart: 4, gold: 3 }, sphereAlignment: { primary: 'energy', secondary: 'life' } },
    });
    const state = { graph, ascendantId: GOD, tick: 0, unlockedActionIds: [] } as unknown as GameState;
    const pool = offerableCards(state, 1).map((t) => t.id);
    expect(pool).toEqual(expect.arrayContaining(['loc.stoke_forges', 'divine.kindle_spark']));
    for (const id of ['loc.stoke_forges', 'divine.kindle_spark']) {
      expect(priceSphere(getUnifiedTemplateById(id)!, state)).toBe('energy');
    }
  });
});
