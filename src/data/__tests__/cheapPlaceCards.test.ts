/**
 * THR-2089 — force, matter and time get a cheap place card.
 *
 * Under the god-caused Mandate only the god's own cards raise a sphere, so a sphere
 * with no card a god can cast on a town cannot be raised. Slice 1 adds three tier-1
 * market cards on existing ops at 2 essence: Steel the Walls (force), Lay the Footings
 * (matter) and Keep the Stores (time). Fortify gains the subtypes the world generates.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import { executeGraphOps, resetOpCounter } from '../../engine/graphOpExecutor';
import { phaseUnifiedActionProgress } from '../../engine/unifiedActionResolution';
import { offerableCards, priceSphere, godCards } from '../../engine/godProgression';
import { checkGodCardProgression, CHEAP_PLACE_CARD_MAX_COST } from '../../engine/godCardProgressionCheck';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { LOC_LAY_FOOTINGS_BUILD_DELTA, LOC_KEEP_STORES_FOOD_DELTA } from '../location-action-constants';
import { FORTIFY_MULTIPLIER_BONUS, FORTIFY_MULTIPLIER_MAX } from '../../types/battle';
import { ACTION_PRESSURE_SUCCESS } from '../../types/sphereAffinity';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';

const GOD = 'asc-1';
const TOWN = 'town-1';

const CARDS = [
  { id: 'loc.steel_walls', sphere: 'force' },
  { id: 'loc.lay_footings', sphere: 'matter' },
  { id: 'loc.keep_stores', sphere: 'time' },
] as const;

function successOps(id: string): GraphOp[] {
  const t = getUnifiedTemplateById(id)!;
  return t.steps.flatMap((s) => (isActionStepBranch(s) ? [] : s.onSuccess ?? [])) as GraphOp[];
}

function townGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: GOD, type: 'actor', name: 'God', properties: { actorType: 'ascendant', domainCapabilities: {} } });
  graph.addNode({
    id: TOWN, type: 'location', name: 'Hollowmere',
    properties: { locationSubtype: 'town', buildProgress: 3, foodStore: 20 },
  });
  return graph;
}

describe('THR-2089 — the three cards', () => {
  it('each is a tier-1 market town card at 2 essence, priced by its sphere', () => {
    for (const { id, sphere } of CARDS) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.progression).toMatchObject({ tier: 1, offer: 'market', generic: false });
      expect(t.progression?.pricedIn).toBeUndefined();
      expect(t.sphereAffinity).toBe(sphere);
      expect(t.essenceCost).toBe(2);
      expect(t.essenceCost).toBeLessThanOrEqual(CHEAP_PLACE_CARD_MAX_COST);
      expect(t.targetCategories).toEqual(['location']);
      expect(t.targetSubtypes).toEqual(expect.arrayContaining(['town']));
    }
  });

  it('Steel the Walls fortifies the town like Fortify does', () => {
    resetOpCounter();
    const graph = townGraph();
    graph.updateNode(TOWN, { properties: { ...graph.getNode(TOWN)!.properties, fortificationMultiplier: 1 } });
    const result = executeGraphOps(graph, successOps('loc.steel_walls'), { actorId: GOD, targetId: TOWN, locationId: TOWN, tick: 5 });
    expect(result.allSucceeded).toBe(true);
    expect(graph.getNode(TOWN)!.properties.fortificationMultiplier)
      .toBe(Math.min(FORTIFY_MULTIPLIER_MAX, 1 + FORTIFY_MULTIPLIER_BONUS));
  });

  it('Lay the Footings adds build progress', () => {
    resetOpCounter();
    const graph = townGraph();
    executeGraphOps(graph, successOps('loc.lay_footings'), { actorId: GOD, targetId: TOWN, locationId: TOWN, tick: 5 });
    expect(graph.getNode(TOWN)!.properties.buildProgress).toBe(3 + LOC_LAY_FOOTINGS_BUILD_DELTA);
  });

  it('Keep the Stores adds food to the store', () => {
    resetOpCounter();
    const graph = townGraph();
    executeGraphOps(graph, successOps('loc.keep_stores'), { actorId: GOD, targetId: TOWN, locationId: TOWN, tick: 5 });
    expect(graph.getNode(TOWN)!.properties.foodStore).toBe(20 + LOC_KEEP_STORES_FOOD_DELTA);
  });

  it.each(CARDS)('a resolved $id pushes $sphere pressure on the town', ({ id, sphere }) => {
    const graph = townGraph();
    const tpl = { ...getUnifiedTemplateById(id)! };
    // Pin the roll: the success branch is what this asserts.
    tpl.steps = tpl.steps.map((s) => (isActionStepBranch(s) ? s : { ...s, difficulty: 0, duration: { min: 2, max: 2 } }));
    const action = {
      actionId: `act_${id}`, actorId: GOD, targetId: TOWN, templateId: tpl.id,
      currentStep: 0, stepProgress: 2, stepDuration: 2, totalProgress: 2, startedTick: 0,
      resolved: false, outcome: undefined, scale: 'local' as const, source: 'agent' as const, stepOutcomes: [],
    };
    const state = {
      tick: 1, seed: 42, phase: 'playing', graph, tickEvents: [], pendingSpherePressures: [], controlEffects: [],
      unifiedActions: [action], encounterProgress: [], rivalDefinitions: [], rivalStates: [], tiles: [],
      ascendantId: GOD, pendingHexMutations: [],
    } as unknown as GameState;
    const result = phaseUnifiedActionProgress(state, [tpl], () => 0.5) as Partial<GameState>;
    const push = (result.pendingSpherePressures ?? []).find((p) => p.sphere === sphere && p.source === 'divine_action');
    expect(push).toMatchObject({ targetEntityId: TOWN, magnitude: ACTION_PRESSURE_SUCCESS });
  });
});

describe('THR-2089 — a Reshape god is offered Steel the Walls and Lay the Footings', () => {
  it('the tier-1 offer pool holds both, priced in force and matter', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: GOD, type: 'actor', name: 'God',
      properties: { actorType: 'ascendant', domainAffinities: { iron: 4, stone: 3 }, sphereAlignment: { primary: 'force', secondary: 'matter' } },
    });
    const state = { graph, ascendantId: GOD, tick: 0, unlockedActionIds: [] } as unknown as GameState;
    const pool = offerableCards(state, 1).map((t) => t.id);
    expect(pool).toEqual(expect.arrayContaining(['loc.steel_walls', 'loc.lay_footings']));
    expect(priceSphere(getUnifiedTemplateById('loc.steel_walls')!, state)).toBe('force');
    expect(priceSphere(getUnifiedTemplateById('loc.lay_footings')!, state)).toBe('matter');
  });
});

describe('THR-2089 — Fortify reaches the strongholds the world generates', () => {
  it('targets fort and tower beside its old subtypes', () => {
    const subtypes = getUnifiedTemplateById('loc.fortify')!.targetSubtypes ?? [];
    expect(subtypes).toEqual(expect.arrayContaining(['fort', 'tower', 'keep', 'fortress', 'stronghold', 'watchtower', 'garrison']));
  });
});

describe('THR-2089 — the cheap-place-card hole', () => {
  const sources = { spine: new Set<string>(), milestone: new Set<string>(), signature: new Set<string>() };

  it('no longer warns for force, matter or time', () => {
    const warnings = checkGodCardProgression(godCards(), sources).warnings;
    for (const sphere of ['force', 'matter', 'time']) {
      expect(warnings).not.toContain(`hole: no cheap ${sphere} place card`);
    }
  });

  it('still warns for slice 2\'s spheres (THR-2090)', () => {
    const warnings = checkGodCardProgression(godCards(), sources).warnings;
    for (const sphere of ['spirit', 'life', 'entropy']) {
      expect(warnings).toContain(`hole: no cheap ${sphere} place card`);
    }
  });

  it('a card over the price, or off the town, does not count', () => {
    const steel = getUnifiedTemplateById('loc.steel_walls')!;
    const pricey = { ...steel, essenceCost: CHEAP_PLACE_CARD_MAX_COST + 1 };
    const offTown = { ...steel, targetSubtypes: ['fort'] };
    for (const card of [pricey, offTown]) {
      expect(checkGodCardProgression([card], sources).warnings).toContain('hole: no cheap force place card');
    }
    expect(checkGodCardProgression([steel], sources).warnings).not.toContain('hole: no cheap force place card');
  });
});
