/**
 * THR-790 — the pool reads a place's traits.
 *
 * Two things are pinned: the term itself (zero at an unmarked place, the row's sum
 * at a marked one, clamped, hopping a Place to its Location) and the table's
 * spelling discipline — every key is a seated content tag and every trait id is a
 * location condition with a shipped definition, because a row nothing can match is
 * the silent zero the kill criterion would then misread as "traits do nothing".
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';
import type { ValuePair, AxiologicalProfile } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';
import { scoreAndSelect } from '../encounterScoring';
import { seedEncounterTraitDefinitions } from '../traitDefinitionSeeding';
import { assignTrait } from '../traits';
import { isContentTag } from '../../data/content-tags';
import { LOCATION_CONDITION_IDS } from '../../data/condition-trait-content';
import {
  LOCATION_TRAIT_ENCOUNTER_BONUS,
  LOCATION_TRAIT_ENCOUNTER_BONUS_CAP,
  LOCATION_TRAIT_IDS,
} from '../../data/location-trait-constants';
import {
  computeLocationTraitBonus,
  locationTraitBonusFor,
  locationTraitIdsAt,
  templateEffectiveTags,
} from '../locationTraitBonus';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';

/** A shipped encounter template whose projected reach tag is `#gold` — a Welcoming row. */
const GOLD_TEMPLATE = UNIFIED_ACTION_TEMPLATES.find(
  t => t.id.startsWith('encounter') && templateEffectiveTags(t.id).includes('#gold'),
)!;
/** ...and one carrying none of Welcoming's tags. */
const OFF_ROW_TEMPLATE = UNIFIED_ACTION_TEMPLATES.find(
  t => t.id.startsWith('encounter')
    && templateEffectiveTags(t.id).every(tag => LOCATION_TRAIT_ENCOUNTER_BONUS[LOCATION_TRAIT_IDS.welcoming][tag] === undefined),
)!;

describe('LOCATION_TRAIT_ENCOUNTER_BONUS — the table is spelled in the vocabulary', () => {
  it('every trait id is a shipped location condition', () => {
    const ids = Object.keys(LOCATION_TRAIT_ENCOUNTER_BONUS);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(LOCATION_CONDITION_IDS, `${id} is not a location condition`).toContain(id);
    // Every minted trait has a row — a trait with no pool row would be the theatre THR-800 named.
    for (const id of Object.values(LOCATION_TRAIT_IDS)) expect(ids).toContain(id);
  });

  it('every tag is seated in CONTENT_TAGS, and every row stays under the cap', () => {
    for (const [traitId, row] of Object.entries(LOCATION_TRAIT_ENCOUNTER_BONUS)) {
      expect(Object.keys(row).length, `${traitId} has an empty row`).toBeGreaterThan(0);
      for (const [tag, bonus] of Object.entries(row)) {
        expect(isContentTag(tag), `${traitId} names ${tag}, which is not seated`).toBe(true);
        expect(bonus).toBeGreaterThan(0);
        expect(bonus).toBeLessThanOrEqual(LOCATION_TRAIT_ENCOUNTER_BONUS_CAP);
      }
    }
  });

  it('every row names at least one tag the shipped corpus carries — else the term is a silent zero', () => {
    const corpusTags = new Set<string>();
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      if (!t.id.startsWith('encounter')) continue;
      for (const tag of templateEffectiveTags(t.id)) corpusTags.add(tag);
    }
    for (const [traitId, row] of Object.entries(LOCATION_TRAIT_ENCOUNTER_BONUS)) {
      const carried = Object.keys(row).filter(tag => corpusTags.has(tag));
      expect(carried.length, `${traitId}'s row names no tag any shipped encounter carries`).toBeGreaterThan(0);
    }
  });
});

describe('locationTraitBonusFor — the pure half', () => {
  it('is 0 with no traits, an unknown trait, or a template carrying none of the row tags', () => {
    expect(locationTraitBonusFor([], GOLD_TEMPLATE.id)).toBe(0);
    expect(locationTraitBonusFor(['trait.condition.location.festival'], GOLD_TEMPLATE.id)).toBe(0);
    expect(locationTraitBonusFor([LOCATION_TRAIT_IDS.welcoming], OFF_ROW_TEMPLATE.id)).toBe(0);
    expect(locationTraitBonusFor([LOCATION_TRAIT_IDS.welcoming], 'no.such.template')).toBe(0);
  });

  it('sums the matched rows for a marked place and clamps at the cap', () => {
    const row = LOCATION_TRAIT_ENCOUNTER_BONUS[LOCATION_TRAIT_IDS.welcoming];
    const expected = templateEffectiveTags(GOLD_TEMPLATE.id).reduce((s, tag) => s + (row[tag] ?? 0), 0);
    expect(expected).toBeGreaterThan(0);
    expect(locationTraitBonusFor([LOCATION_TRAIT_IDS.welcoming], GOLD_TEMPLATE.id)).toBeCloseTo(
      Math.min(expected, LOCATION_TRAIT_ENCOUNTER_BONUS_CAP), 10,
    );
    // Two traits stack, still under the cap.
    const twice = locationTraitBonusFor(
      [LOCATION_TRAIT_IDS.welcoming, LOCATION_TRAIT_IDS.lawless, LOCATION_TRAIT_IDS.haunted, LOCATION_TRAIT_IDS.veilThin],
      GOLD_TEMPLATE.id,
    );
    expect(twice).toBeGreaterThanOrEqual(locationTraitBonusFor([LOCATION_TRAIT_IDS.welcoming], GOLD_TEMPLATE.id));
    expect(twice).toBeLessThanOrEqual(LOCATION_TRAIT_ENCOUNTER_BONUS_CAP);
  });
});

// ─── The graph half and the scoring seam ────────────────────────────────────

function zeroProfile(): AxiologicalProfile {
  return Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as AxiologicalProfile;
}

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  seedEncounterTraitDefinitions(graph);
  graph.addNode({ id: 'loc_a', type: 'location', name: 'Town A', properties: { locationType: 'settlement', locationSubtype: 'town', hexCol: 0, hexRow: 0 } });
  graph.addNode({ id: 'sub_a', type: 'location', name: 'The Market', properties: { parentLocationId: 'loc_a', sublocationCategory: 'market' } });
  graph.addNode({
    id: 'agent_1', type: 'actor', name: 'Test Agent',
    properties: { actorType: 'individual', axiologicalProfile: zeroProfile(), locationId: 'loc_a' },
  });
  return graph;
}

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

describe('computeLocationTraitBonus — the graph half', () => {
  it('reads the place tier: a Place hops to its Location, a missing node reads nothing', () => {
    const graph = buildWorld();
    expect(locationTraitIdsAt(graph, graph.getNode('loc_a'))).toEqual([]);
    assignTrait(graph, 'loc_a', LOCATION_TRAIT_IDS.welcoming, { tick: 1, source: 'test' });
    expect(locationTraitIdsAt(graph, graph.getNode('loc_a'))).toEqual([LOCATION_TRAIT_IDS.welcoming]);
    expect(locationTraitIdsAt(graph, graph.getNode('sub_a'))).toEqual([LOCATION_TRAIT_IDS.welcoming]);
    expect(locationTraitIdsAt(graph, undefined)).toEqual([]);
    // A mortal's traits are not a place's: a non-location trait on the town is ignored.
    graph.addNode({ id: 'trait.mastery.smithing.x', type: 'trait', name: 'Smith', properties: { subcategory: 'mastery' } } as GraphNode);
    graph.addEdge({ id: 'e.x', source: 'loc_a', target: 'trait.mastery.smithing.x', type: 'has_trait', properties: {} });
    expect(locationTraitIdsAt(graph, graph.getNode('loc_a'))).toEqual([LOCATION_TRAIT_IDS.welcoming]);
    expect(computeLocationTraitBonus(graph, graph.getNode('loc_a'), GOLD_TEMPLATE.id)).toBeGreaterThan(0);
    expect(computeLocationTraitBonus(graph, graph.getNode('loc_a'), OFF_ROW_TEMPLATE.id)).toBe(0);
  });
});

describe('scoreAndSelect — the term is folded into the score (THR-790)', () => {
  it('a Welcoming town lifts a gold-reach candidate by exactly the term, and leaves an off-row candidate alone', () => {
    const unmarked = buildWorld();
    const marked = buildWorld();
    assignTrait(marked, 'loc_a', LOCATION_TRAIT_IDS.welcoming, { tick: 1, source: 'test' });

    const before = scoreAndSelect([entryFor(GOLD_TEMPLATE.id)], 'agent_1', 'loc_a', unmarked, 1).topCandidates[0];
    const after = scoreAndSelect([entryFor(GOLD_TEMPLATE.id)], 'agent_1', 'loc_a', marked, 1).topCandidates[0];
    const term = computeLocationTraitBonus(marked, marked.getNode('loc_a'), GOLD_TEMPLATE.id);

    expect(before.locationTraitBonus).toBe(0);
    expect(after.locationTraitBonus).toBeCloseTo(term, 10);
    expect(term).toBeGreaterThan(0);
    // The term rides baseScore before the multipliers; both multipliers are 1 here
    // (tier-1 location, no role affinity), so the lift is the term itself.
    expect(after.finalScore - before.finalScore).toBeCloseTo(term, 6);

    const offBefore = scoreAndSelect([entryFor(OFF_ROW_TEMPLATE.id)], 'agent_1', 'loc_a', unmarked, 1).topCandidates[0];
    const offAfter = scoreAndSelect([entryFor(OFF_ROW_TEMPLATE.id)], 'agent_1', 'loc_a', marked, 1).topCandidates[0];
    expect(offAfter.locationTraitBonus).toBe(0);
    expect(offAfter.finalScore).toBeCloseTo(offBefore.finalScore, 10);
  });
});
