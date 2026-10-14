/**
 * THR-1852 — a God's Will option, and both its toasts, never show a dotted template id.
 *
 * The warm round-2 testers saw "compelled toward encounter.town.oath_breaker_rite":
 * the name lookup searched only the encounter pools, missed the authored encounters
 * that live in `UNIFIED_ACTION_TEMPLATES`, and fell back to the id. Every template a
 * mortal can be scored against is drawn from the unified index or the encounter pools,
 * so checking every one of them covers every candidate the compulsion builder can offer.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveCompulsionEncounterName,
  TEMPLATE_ID_SHAPE,
  buildCompulsionEvent,
} from '../premonitionCompulsion';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import { COMPULSION_UNNAMED_ENCOUNTER_NOUN } from '../../data/premonition-content';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import type { ScoredCandidate } from '../encounterScoring';

const PLAYTEST_IDS = [
  'encounter.town.oath_breaker_rite',
  'star.turning.comet_omen',
  'ts.quest.meditate_on_spheres',
  'ts.quest.copy_scriptures',
];

describe('THR-1852 — compulsion targets resolve to names, never ids', () => {
  it('names the four ids the warm round-2 testers quoted', () => {
    for (const id of PLAYTEST_IDS) {
      const name = resolveCompulsionEncounterName(id);
      expect(name, id).not.toMatch(TEMPLATE_ID_SHAPE);
      expect(name, id).not.toBe(COMPULSION_UNNAMED_ENCOUNTER_NOUN);
    }
    expect(resolveCompulsionEncounterName('encounter.town.oath_breaker_rite')).toBe('The Oath-Breaker\'s Rite');
  });

  it('gives every unified and encounter-pool template a non-id name', () => {
    const offenders: string[] = [];
    for (const t of [...UNIFIED_ACTION_TEMPLATES, ...ENCOUNTER_TEMPLATES]) {
      const name = resolveCompulsionEncounterName(t.id);
      if (TEMPLATE_ID_SHAPE.test(name) || name === t.id) offenders.push(`${t.id} → ${name}`);
    }
    expect(offenders).toEqual([]);
  });

  it('falls back to a generic noun when the template is unknown', () => {
    expect(resolveCompulsionEncounterName('no.such.template')).toBe(COMPULSION_UNNAMED_ENCOUNTER_NOUN);
  });

  it('builds a compulsion on the seeded medium world whose options carry names', () => {
    const { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, createBalancedCosmology(), 'medium');
    devSeedTheFirst(state);
    const firstId = 'ind_dev_the_first';
    const locationId = state.graph.getOutgoingEdges(firstId, 'located_at')[0]?.target ?? '';
    const top = PLAYTEST_IDS.map((templateId, i) => ({
      entry: {
        templateId,
        locationId,
        reachPrimary: 'iron',
        encounterType: 'explore',
        threatRating: i % 2 ? 'easy' : 'moderate',
        requiresPresence: false,
      },
      finalScore: 1 - i * 0.1,
    })) as unknown as ScoredCandidate[];
    let seed = 7;
    const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const event = buildCompulsionEvent(state, firstId, 'The First', top, rng);
    expect(event).not.toBeNull();
    const candidates = event?.compulsionCandidates ?? [];
    expect(candidates.length).toBeGreaterThan(0);
    for (const c of candidates) expect(c.encounterName).not.toMatch(TEMPLATE_ID_SHAPE);
  });
});
