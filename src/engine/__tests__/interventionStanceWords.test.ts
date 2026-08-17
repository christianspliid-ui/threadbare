/**
 * THR-1048 — the intervention-stance vocabulary.
 *
 * Two gates that matter beyond the three assertions anyone would write:
 *
 * 1. **The union is pinned with `toEqual`, not sampled.** `interventionType`
 *    is a closed three-value union, so a `toBe` per value passes forever while
 *    a fourth stance added to the type renders the fallback word at the player
 *    with nothing red. Pinning the whole record means widening the union
 *    fails here first, which is where the word gets chosen.
 * 2. **The forbidden strings are literals.** Asserting `!== stance` or
 *    comparing against the module's own table would be a tautology — the test
 *    would agree with whatever the module decided, including printing the key.
 *    `'supportive'` is written out so the gate says what Law 14 says.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __interventionStanceWords,
  __resetInterventionStanceWarnings,
  interventionStanceWord,
} from '../interventionStanceWords';

afterEach(() => {
  __resetInterventionStanceWarnings();
  vi.restoreAllMocks();
});

describe('interventionStanceWord (THR-1048)', () => {
  it('pins the closed union — a new stance must choose its word here', () => {
    expect(__interventionStanceWords()).toEqual({
      supportive: 'lend strength',
      coercive: 'press them',
      withdrawn: 'stand back',
    });
  });

  it('resolves each stance to words', () => {
    expect(interventionStanceWord('supportive')).toBe('lend strength');
    expect(interventionStanceWord('coercive')).toBe('press them');
    expect(interventionStanceWord('withdrawn')).toBe('stand back');
  });

  it('never returns the key itself — Law 14', () => {
    // Literals, not a loop over the module's own table: the point is that
    // these three exact strings must not survive to a render.
    for (const key of ['supportive', 'coercive', 'withdrawn']) {
      expect(interventionStanceWord(key)).not.toBe(key);
    }
  });

  it('returns undefined for an absent stance rather than inventing one', () => {
    // A designed empty: authored choice cards carry no stance, and the meta
    // row renders nothing for them. A fallback word here would tag every
    // authored card with a stance its author did not write.
    expect(interventionStanceWord(undefined)).toBeUndefined();
    expect(interventionStanceWord(null)).toBeUndefined();
    expect(interventionStanceWord('')).toBeUndefined();
  });

  it('falls back to plain English for an unknown stance, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(interventionStanceWord('vengeful')).toBe('step in');
    expect(interventionStanceWord('vengeful')).toBe('step in');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('vengeful');
  });

  it('warns separately for each distinct unknown stance', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    interventionStanceWord('vengeful');
    interventionStanceWord('curious');

    expect(warn).toHaveBeenCalledTimes(2);
  });
});
