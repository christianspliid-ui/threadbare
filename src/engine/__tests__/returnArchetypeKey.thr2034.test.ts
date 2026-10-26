/**
 * THR-2034 — the Return's archetype reads (Usurper bypass, archetype default
 * bonus) compare against the candidate's `primary_secondary` reach-pair key,
 * not the record's display-name `archetypeId`.
 */

import { describe, it, expect } from 'vitest';
import {
  archetypeKeyOf,
  passesFoundingGate,
  resolveReturn,
  ARCHETYPE_TRAJECTORY_GROUPS,
} from '../returnEngine';
import {
  bindSparkVisionsToCandidate,
  buildNarrativeResult,
  generateNarrativeCandidates,
  generateSparkVisions,
} from '../meetingEncounter';
import { ARCHETYPE_NAME_MAP } from '../../data/meeting-content';
import {
  ARCHETYPE_DEFAULT_BONUS,
  USURPER_BYPASS_ARCHETYPES,
} from '../../types/returnEngine';
import type { ReturnRelationshipState } from '../../types/returnEngine';
import type { MeetingChoiceRecord } from '../../types/meetingEncounter';
import type { ReachDomain } from '../../types/traits';

const NEUTRAL_REL: ReturnRelationshipState = {
  trust: 0,
  bondTier: 2,
  interventionRatio: 0.5,
  supportiveVsCoercive: 0,
  totalEssenceSpent: 0,
  cooperationStrategy: 'tit-for-tat',
};

/** A meeting record built the way `buildNarrativeResult` builds it, for the given reach pair. */
function narrativeRecord(primaryReach: ReachDomain, secondaryReach: ReachDomain): MeetingChoiceRecord {
  const [base] = generateNarrativeCandidates('hunger.golden', 'culture.golden', 42, undefined, 'life');
  const key = `${primaryReach}_${secondaryReach}`;
  const candidate = { ...base, primaryReach, secondaryReach, archetypeId: ARCHETYPE_NAME_MAP[key] ?? 'Wanderer' };
  const [vision] = bindSparkVisionsToCandidate(generateSparkVisions(primaryReach, 'life', 42), candidate);
  return buildNarrativeResult({
    candidate, vision, dilemmaChoices: [], editedName: undefined,
    locationId: 'loc_village', ascendantSphere: 'life', tick: 10,
  }).meetingChoiceRecord;
}

describe('THR-2034 — archetype key', () => {
  it('a narrative record carries the display name, and archetypeKeyOf yields the reach-pair key', () => {
    const record = narrativeRecord('shadow', 'shadow');
    expect(record.archetypeId).toBe('Phantom');
    expect(archetypeKeyOf(record)).toBe('shadow_shadow');
  });

  it('a shadow_shadow First gets the trickster bonus toward vanishing', () => {
    const record = { ...narrativeRecord('shadow', 'shadow'), foundingGateTags: [] };
    const withKey = resolveReturn(record, 'broken', NEUTRAL_REL, archetypeKeyOf(record), []);
    const withDisplayName = resolveReturn(record, 'broken', NEUTRAL_REL, record.archetypeId, []);
    expect((withKey.scores.vanishing ?? 0) - (withDisplayName.scores.vanishing ?? 0))
      .toBeCloseTo(ARCHETYPE_DEFAULT_BONUS);
  });

  it('a shadow-primary First passes the Usurper gate through the archetype bypass', () => {
    const record = { ...narrativeRecord('shadow', 'iron'), foundingGateTags: [] };
    expect(passesFoundingGate(record, 'usurper', archetypeKeyOf(record))).toBe(true);
    expect(passesFoundingGate(record, 'usurper', record.archetypeId)).toBe(false);
  });

  it('a hero First gets the hero bonus toward loyal_ascension', () => {
    const record = { ...narrativeRecord('iron', 'heart'), foundingGateTags: ['noble'] };
    const withKey = resolveReturn(record, 'triumph', NEUTRAL_REL, archetypeKeyOf(record), []);
    const withDisplayName = resolveReturn(record, 'triumph', NEUTRAL_REL, record.archetypeId, []);
    expect((withKey.scores.loyal_ascension ?? 0) - (withDisplayName.scores.loyal_ascension ?? 0))
      .toBeCloseTo(ARCHETYPE_DEFAULT_BONUS);
  });

  it('legacy records without reaches fall back through archetypeId (key or display name)', () => {
    const legacy = { ...narrativeRecord('eye', 'veil'), primaryReach: undefined, secondaryReach: undefined };
    expect(archetypeKeyOf(legacy)).toBe('eye_veil');
    expect(archetypeKeyOf({ ...legacy, archetypeId: 'star_star' })).toBe('star_star');
    expect(archetypeKeyOf({ ...legacy, archetypeId: 'Wanderer' })).toBe('');
    expect(archetypeKeyOf(undefined)).toBe('');
  });

  it('display names are unique, so the name → key fallback is unambiguous', () => {
    const names = Object.values(ARCHETYPE_NAME_MAP);
    expect(new Set(names).size).toBe(names.length);
  });

  it('no name in either archetype list is unreachable from ARCHETYPE_NAME_MAP keys', () => {
    const keys = new Set(Object.keys(ARCHETYPE_NAME_MAP));
    const listed = [
      ...USURPER_BYPASS_ARCHETYPES,
      ...ARCHETYPE_TRAJECTORY_GROUPS.flatMap(g => g.archetypes),
    ];
    expect(listed.filter(k => !keys.has(k))).toEqual([]);
  });
});
