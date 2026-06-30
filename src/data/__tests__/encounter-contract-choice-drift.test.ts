import { describe, expect, it } from 'vitest';
import {
  resolveEncounterArchetypePole,
  resolveChoiceDrift,
  toEncounterArchetypePole,
  type EncounterAuthoredChoice,
} from '../encounter-contract-builder';
import { MORAL_AXIS_POLES_BY_REACH } from '../../types/encounter-contract';
import {
  CHOICE_DRIFT_MAGNITUDE_SMALL,
  CHOICE_DRIFT_MAGNITUDE_DEEP,
  PERSONALITY_DRIFT_DELTA_DEFAULT,
} from '../encounter-experience-constants';

/**
 * THR-528 — authored choice poles supersede the inferred `toEncounterArchetypePole`
 * heuristic. These tests pin the resolver contract that a `PendingChoiceCommit`
 * builder (and the encounter contract display) consume.
 */

function choice(overrides: Partial<EncounterAuthoredChoice> = {}): EncounterAuthoredChoice {
  return {
    id: 'c',
    label: 'A choice',
    intent: 'does a thing',
    essenceCost: 1,
    interventionType: 'supportive',
    ...overrides,
  } as EncounterAuthoredChoice;
}

describe('resolveEncounterArchetypePole (THR-528)', () => {
  it('honors an authored virtue pole over the heuristic', () => {
    const [virtue] = MORAL_AXIS_POLES_BY_REACH.gold;
    expect(resolveEncounterArchetypePole('gold', choice({ pole: 'virtue' }))).toBe(virtue);
  });

  it('honors an authored vice pole over the heuristic', () => {
    const [, vice] = MORAL_AXIS_POLES_BY_REACH.gold;
    expect(resolveEncounterArchetypePole('gold', choice({ pole: 'vice' }))).toBe(vice);
  });

  it('authored pole overrides the interventionType heuristic (divergence case)', () => {
    // 'withdrawn' would infer the virtue pole; authoring 'vice' flips it.
    const [, vice] = MORAL_AXIS_POLES_BY_REACH.gold;
    const c = choice({ interventionType: 'withdrawn', pole: 'vice' });
    expect(resolveEncounterArchetypePole('gold', c)).toBe(vice);
    expect(toEncounterArchetypePole('gold', c)).not.toBe(vice); // heuristic still says virtue
  });

  it('falls back to the heuristic when no pole is authored', () => {
    const c = choice({ interventionType: 'coercive' });
    expect(resolveEncounterArchetypePole('gold', c)).toBe(toEncounterArchetypePole('gold', c));
  });
});

describe('resolveChoiceDrift (THR-528)', () => {
  it('maps an authored virtue pole to positive drift sign', () => {
    const d = resolveChoiceDrift('iron', choice({ pole: 'virtue', magnitude: 0.15 }));
    expect(d.moralAxisPole).toBe('virtue');
    expect(d.driftMagnitude).toBe(0.15);
    expect(d.axisReach).toBe('iron');
  });

  it('maps an authored vice pole to the flaw drift sign', () => {
    const d = resolveChoiceDrift('iron', choice({ pole: 'vice', magnitude: 0.2 }));
    expect(d.moralAxisPole).toBe('flaw');
    expect(d.driftMagnitude).toBe(0.2);
  });

  it('routes drift to the authored moralAxis when it differs from the choice reach', () => {
    const d = resolveChoiceDrift('gold', choice({ moralAxis: 'heart', pole: 'virtue', magnitude: 0.1 }));
    expect(d.axisReach).toBe('heart');
  });

  it('defaults magnitude to PERSONALITY_DRIFT_DELTA_DEFAULT when a pole is authored without one', () => {
    const d = resolveChoiceDrift('iron', choice({ pole: 'vice' }));
    expect(d.driftMagnitude).toBe(PERSONALITY_DRIFT_DELTA_DEFAULT);
  });

  it('falls back to the heuristic pole + cost-tier magnitude for un-migrated cards', () => {
    const supportive = resolveChoiceDrift('iron', choice({ interventionType: 'supportive', essenceCost: 1 }));
    expect(supportive.moralAxisPole).toBe('virtue');
    expect(supportive.driftMagnitude).toBe(CHOICE_DRIFT_MAGNITUDE_SMALL);

    const coercive = resolveChoiceDrift('iron', choice({ interventionType: 'coercive', essenceCost: 3 }));
    expect(coercive.moralAxisPole).toBe('flaw');
    expect(coercive.driftMagnitude).toBe(CHOICE_DRIFT_MAGNITUDE_DEEP);
  });
});
