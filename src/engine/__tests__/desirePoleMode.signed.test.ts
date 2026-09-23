/**
 * THR-1525 falsification — under `DESIRE_SCORE_POLE_MODE = 'signed'` the
 * mirrored-mortal equality in `desirePoleLiveness.test.ts` must break, and
 * `'signed'` must reproduce the pre-THR-1525 reading exactly (the rollback
 * promise the plan's kill criteria rest on). Pins are mode-independent.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../data/agent-behavior-constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/agent-behavior-constants')>()),
  DESIRE_SCORE_POLE_MODE: 'signed',
}));

import { computeDesireScore, DESIRE_SCORE_POLE_MODE } from '../encounterScoring';
import { VALUE_PAIRS, type AxiologicalProfile } from '../../types/agent';

const profile = (over: Partial<AxiologicalProfile>): AxiologicalProfile =>
  ({ ...Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])), ...over }) as AxiologicalProfile;

describe("DESIRE_SCORE_POLE_MODE = 'signed' (rollback reading)", () => {
  it('the mock took', () => {
    expect(DESIRE_SCORE_POLE_MODE).toBe('signed');
  });

  it('a mirrored mortal no longer scores equally — the liveness assertion goes red', () => {
    const a = computeDesireScore(['tradition_novelty'], profile({ tradition_novelty: 0.7 }));
    const b = computeDesireScore(['tradition_novelty'], profile({ tradition_novelty: -0.7 }));
    expect(a).not.toBeCloseTo(b, 9);
  });

  it('reproduces the pre-THR-1525 signed sum exactly', () => {
    const p = profile({ mercy_ruthlessness: 0.8, honesty_cunning: -0.3 });
    expect(computeDesireScore(['mercy_ruthlessness', 'honesty_cunning'], p)).toBeCloseTo(0.5, 10);
  });

  it('pins read the same in either mode', () => {
    const p = profile({ honesty_cunning: -0.3 });
    expect(computeDesireScore(['honesty_cunning'], p, { honesty_cunning: 'negative' })).toBeCloseTo(0.3, 10);
    expect(computeDesireScore(['honesty_cunning'], p, { honesty_cunning: 'positive' })).toBeCloseTo(-0.3, 10);
  });
});
