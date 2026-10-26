/**
 * THR-2040 — famine and glut draws.
 *
 * Pins the plan's Done-when: `readLarder` grades famine over `FAMINE_FULL_DAYS`, a glut
 * needs both the surplus run and the balance floor, a sublocation reads its settlement,
 * the stock-tier fallback answers when there is no food store, and every missing-data
 * path is neutral. Then the scoring seam: the same town, hungry vs fed, lifts
 * `encounter.aid_refugees` and sinks `encounter.market_day_festival`, never past the cap.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import type { ValuePair, AxiologicalProfile } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';
import { scoreAndSelect } from '../encounterScoring';
import { computeLarderContextBonus, readLarder } from '../economicContext';
import {
  ECONOMIC_SCENE_AFFINITY,
  FAMINE_FULL_DAYS,
  LARDER_SCORING_CAP,
  LARDER_SCORING_WEIGHT,
  PLENTY_BALANCE_FLOOR,
  PLENTY_MIN_SURPLUS_DAYS,
  STOCK_TIER_FAMINE_DEVIATION,
  STOCK_TIER_GLUT_DEVIATION,
} from '../../data/economic-scene-affinity';

function zeroProfile(): AxiologicalProfile {
  return Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as AxiologicalProfile;
}

/** A town (props merged over a fed baseline) with one sublocation and one agent standing in it. */
function buildTown(props: Record<string, unknown> = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_a', type: 'location', name: 'Town A',
    properties: { locationType: 'settlement', locationSubtype: 'town', hexCol: 0, hexRow: 0, prosperity: 50, ...props },
  });
  graph.addNode({ id: 'sub_a', type: 'location', name: 'The Market', properties: { parentLocationId: 'loc_a', sublocationCategory: 'market' } });
  graph.addNode({
    id: 'agent_1', type: 'actor', name: 'Test Agent',
    properties: { actorType: 'individual', axiologicalProfile: zeroProfile(), locationId: 'loc_a' },
  });
  return graph;
}

const FED = { foodStore: 20, foodBalance: 0.1, foodSurplusDays: 1 };
const hungry = (hungerDays: number) => ({ foodStore: 0, foodBalance: -0.3, foodSurplusDays: 0, hungerDays });
const glutted = (balance: number, surplusDays = PLENTY_MIN_SURPLUS_DAYS) => ({ foodStore: 40, foodBalance: balance, foodSurplusDays: surplusDays });

describe('readLarder — famine', () => {
  it('grades from 1/FAMINE_FULL_DAYS on the first hungry day to 1 at FAMINE_FULL_DAYS and beyond', () => {
    expect(readLarder(buildTown(hungry(1)), 'loc_a')).toEqual({ state: 'famine', deviation: 1 / FAMINE_FULL_DAYS });
    expect(readLarder(buildTown(hungry(3)), 'loc_a').deviation).toBeCloseTo(3 / FAMINE_FULL_DAYS, 10);
    expect(readLarder(buildTown(hungry(FAMINE_FULL_DAYS)), 'loc_a').deviation).toBe(1);
    expect(readLarder(buildTown(hungry(FAMINE_FULL_DAYS + 7)), 'loc_a').deviation).toBe(1);
  });

  it('reads a hungry town with no hungerDays yet as one day deep', () => {
    const { hungerDays: _ignored, ...noCounter } = hungry(1);
    expect(readLarder(buildTown(noCounter), 'loc_a')).toEqual({ state: 'famine', deviation: 1 / FAMINE_FULL_DAYS });
  });

  it('an empty store with a positive balance is not a famine (the same test as isHungryToday)', () => {
    expect(readLarder(buildTown({ foodStore: 0, foodBalance: 0.2 }), 'loc_a').state).toBeNull();
  });
});

describe('readLarder — glut', () => {
  it('needs both the surplus run and the balance floor', () => {
    expect(readLarder(buildTown(glutted(0.9)), 'loc_a').state).toBe('glut');
    expect(readLarder(buildTown(glutted(0.9, PLENTY_MIN_SURPLUS_DAYS - 1)), 'loc_a').state).toBeNull();
    expect(readLarder(buildTown(glutted(PLENTY_BALANCE_FLOOR - 0.01)), 'loc_a').state).toBeNull();
    expect(readLarder(buildTown(FED), 'loc_a').state).toBeNull();
  });

  it('grades in from 0 at the floor to 1 at a balance of 1', () => {
    expect(readLarder(buildTown(glutted(PLENTY_BALANCE_FLOOR)), 'loc_a')).toEqual({ state: 'glut', deviation: 0 });
    const mid = PLENTY_BALANCE_FLOOR + (1 - PLENTY_BALANCE_FLOOR) / 2;
    expect(readLarder(buildTown(glutted(mid)), 'loc_a').deviation).toBeCloseTo(0.5, 10);
    expect(readLarder(buildTown(glutted(1)), 'loc_a').deviation).toBe(1);
  });
});

describe('readLarder — place tier, fallback and fail-soft', () => {
  it('a sublocation reads its settlement', () => {
    const graph = buildTown(hungry(5));
    expect(readLarder(graph, 'sub_a')).toEqual(readLarder(graph, 'loc_a'));
    expect(readLarder(graph, 'sub_a').state).toBe('famine');
  });

  it('falls back to the stock tier when the town carries no food store', () => {
    const scarce = buildTown({ resources: { grain: { stockTier: 'scarce' } } });
    expect(readLarder(scarce, 'loc_a')).toEqual({ state: 'famine', deviation: STOCK_TIER_FAMINE_DEVIATION });
    const surplus = buildTown({ resources: { grain: { stockTier: 'surplus' } } });
    expect(readLarder(surplus, 'loc_a')).toEqual({ state: 'glut', deviation: STOCK_TIER_GLUT_DEVIATION });
    // A non-staple at either tier says nothing about the larder.
    const ore = buildTown({ resources: { iron: { stockTier: 'scarce' } } });
    expect(readLarder(ore, 'loc_a').state).toBeNull();
  });

  it('every missing-data path is neutral', () => {
    const neutral = { state: null, deviation: 0 };
    const graph = buildTown();
    expect(readLarder(graph, undefined)).toEqual(neutral);
    expect(readLarder(graph, 'no_such_place')).toEqual(neutral);
    expect(readLarder(graph, 'loc_a')).toEqual(neutral); // no foodStore, no resources
    expect(readLarder(buildTown({ foodStore: 10, foodBalance: 'lots', foodSurplusDays: 9 }), 'loc_a')).toEqual(neutral);
    expect(readLarder(buildTown({ foodStore: 10, foodBalance: 0.9 }), 'loc_a')).toEqual(neutral);
    const orphan = new WorldGraph();
    orphan.addNode({ id: 'sub_x', type: 'location', name: 'Stall', properties: { parentLocationId: 'gone' } });
    expect(readLarder(orphan, 'sub_x')).toEqual(neutral);
  });
});

describe('computeLarderContextBonus', () => {
  it('is the weight × depth × row weight, signed by the row', () => {
    const famine = { state: 'famine' as const, deviation: 1 };
    const refugees = ECONOMIC_SCENE_AFFINITY['encounter.aid_refugees'].famineWeight!;
    expect(computeLarderContextBonus(famine, 'encounter.aid_refugees')).toBeCloseTo(LARDER_SCORING_WEIGHT * refugees, 10);
    expect(computeLarderContextBonus(famine, 'encounter.market_day_festival')).toBeLessThan(0);
    const glut = { state: 'glut' as const, deviation: 1 };
    expect(computeLarderContextBonus(glut, 'encounter.harvest_bounty')).toBeGreaterThan(0);
  });

  it('is 0 for a neutral larder, an unlisted family, or a row with no larder weight', () => {
    expect(computeLarderContextBonus({ state: null, deviation: 0 }, 'encounter.aid_refugees')).toBe(0);
    expect(computeLarderContextBonus({ state: 'famine', deviation: 1 }, 'encounter.offer_small_prayer')).toBe(0);
    // `encounter.debt_collection` has boom/bust weights only.
    expect(computeLarderContextBonus({ state: 'famine', deviation: 1 }, 'encounter.debt_collection')).toBe(0);
    // Glut at the floor grades to 0.
    expect(computeLarderContextBonus({ state: 'glut', deviation: 0 }, 'encounter.harvest_bounty')).toBe(0);
  });

  it('never exceeds the cap for any authored row', () => {
    for (const id of Object.keys(ECONOMIC_SCENE_AFFINITY)) {
      for (const state of ['famine', 'glut'] as const) {
        expect(Math.abs(computeLarderContextBonus({ state, deviation: 1 }, id))).toBeLessThanOrEqual(LARDER_SCORING_CAP);
      }
    }
  });

  it('the granary riot carries no larder weight — the unrest seeding owns its famine draw', () => {
    expect(ECONOMIC_SCENE_AFFINITY['encounter.town.granary_riot']).toBeUndefined();
  });
});

// ─── The scoring seam ────────────────────────────────────────────────────────

function entryFor(templateId: string, locationId = 'loc_a'): EncounterCacheEntry {
  return {
    templateId,
    locationId,
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'gold' as ReachDomain,
    reachSecondary: 'heart' as ReachDomain,
    threatRating: 'moderate' as never,
    encounterType: 'social' as never,
    motivations: ['mercy_ruthlessness'] as ValuePair[],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 3,
    successRewardEstimate: 2.0,
    stepCount: 1,
    stepDifficulties: [0.5],
    stepReaches: ['gold'] as ReachDomain[],
  } as EncounterCacheEntry;
}

function score(graph: WorldGraph, templateId: string) {
  return scoreAndSelect([entryFor(templateId)], 'agent_1', 'loc_a', graph, 1).topCandidates[0];
}

describe('scoreAndSelect — the larder term is folded into the score (THR-2040)', () => {
  it('a hungry town scores refugees higher and the market festival lower than the same town fed', () => {
    const fed = buildTown(FED);
    const starving = buildTown(hungry(FAMINE_FULL_DAYS));

    const refugeesFed = score(fed, 'encounter.aid_refugees');
    const refugeesHungry = score(starving, 'encounter.aid_refugees');
    expect(refugeesFed.larderContextBonus).toBe(0);
    expect(refugeesFed.larderState).toBeNull();
    expect(refugeesHungry.larderState).toBe('famine');
    expect(refugeesHungry.larderContextBonus).toBeGreaterThan(0);
    expect(refugeesHungry.finalScore).toBeGreaterThan(refugeesFed.finalScore);
    // Prosperity is unchanged (50, the neutral band), so the econ term cannot be what moved.
    expect(refugeesHungry.economicContextBonus).toBe(0);

    const festivalFed = score(fed, 'encounter.market_day_festival');
    const festivalHungry = score(starving, 'encounter.market_day_festival');
    expect(festivalHungry.larderContextBonus).toBeLessThan(0);
    expect(festivalHungry.finalScore).toBeLessThan(festivalFed.finalScore);

    for (const c of [refugeesHungry, festivalHungry]) {
      expect(Math.abs(c.larderContextBonus)).toBeLessThanOrEqual(LARDER_SCORING_CAP);
    }
  });

  it('a glutted town lifts the harvest bounty', () => {
    const fed = score(buildTown(FED), 'encounter.harvest_bounty');
    const glut = score(buildTown(glutted(1)), 'encounter.harvest_bounty');
    expect(glut.larderState).toBe('glut');
    expect(glut.larderContextBonus).toBeGreaterThan(0);
    expect(glut.finalScore).toBeGreaterThan(fed.finalScore);
  });
});
