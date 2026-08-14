/**
 * Guards for the ruins/delve display vocabulary (THR-1080).
 *
 * The point of these is not that the current five words are the right five —
 * it is that no `DelveConsequenceRoll` or `DelveScale` can reach a player
 * surface as its raw key. The exhaustiveness pins are what make that hold for
 * a value added next year, which is the failure mode Law 14's second clause
 * ("warns once, never as the key") exists to catch.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  RUIN_FATE_WORDS,
  RUIN_FATE_CLAUSES,
  DELVE_SCALE_WORDS,
  STREAM_YIELD_WORDS,
  getRuinFateWord,
  getRuinFateClause,
  getDelveScaleWord,
  getStreamYieldWord,
} from '../ruin-words';
import {
  POP_ESSENCE_PER_TICK_MIN,
  POP_ESSENCE_PER_TICK_MAX,
} from '../../engine/ruins/constants';
import type { DelveConsequenceRoll, DelveScale } from '../../engine/ruins/delveTypes';

/**
 * The live enum, pinned as a literal rather than derived from the vocabulary
 * under test — deriving it from `Object.keys(RUIN_FATE_WORDS)` would make the
 * test agree with the map by construction and assert nothing.
 */
const ALL_ROLLS: DelveConsequenceRoll[] = [
  'catastrophic', 'scarred', 'marked', 'triumphant', 'transformed',
];
const ALL_SCALES: DelveScale[] = ['minor', 'major', 'saga'];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ruin fate vocabulary', () => {
  it('resolves every DelveConsequenceRoll in both shapes', () => {
    for (const roll of ALL_ROLLS) {
      expect(RUIN_FATE_WORDS[roll], `header word for ${roll}`).toBeTruthy();
      expect(RUIN_FATE_CLAUSES[roll], `sentence clause for ${roll}`).toBeTruthy();
    }
  });

  it('renders every fate as presented copy, never as a bare key', () => {
    // Note the invariant is presentation, not difference-from-the-key: three of
    // the five keys (`scarred`, `marked`, `triumphant`) are already the right
    // English word for their condition, and renaming them purely to differ from
    // their key would be worse copy. What must hold is that the value arrives
    // Title-cased through the vocabulary rather than as the raw lowercase token
    // the header used to print.
    for (const roll of ALL_ROLLS) {
      const word = getRuinFateWord(roll);
      expect(word, `header word for ${roll}`).toMatch(/^[A-Z]/);
      expect(word).not.toContain('_');
    }
    // The two the vocabulary genuinely re-words. `transformed` is the value on
    // screen for every consequential emergence — it is the only roll that
    // permits Claim/Bargain/Corrupt — so it is the one worth pinning.
    expect(getRuinFateWord('transformed')).toBe('Remade');
    expect(getRuinFateClause('transformed')).toBe('remade');
    expect(getRuinFateWord('catastrophic')).toBe('Undone');
  });

  it('completes the disabled-card sentence grammatically', () => {
    for (const roll of ALL_ROLLS) {
      const sentence = `This outcome cannot be claimed — the ruin was ${getRuinFateClause(roll)}.`;
      expect(sentence).toMatch(/^This outcome cannot be claimed — the ruin was \S.*\.$/);
      expect(sentence).not.toMatch(/was undefined/);
    }
  });

  it('falls back to plain English and warns once on an unknown key (Law 14)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rendered = getRuinFateWord('shattered_beyond_repair');

    expect(rendered).toBe('Shattered Beyond Repair');
    expect(rendered).not.toContain('_');
    expect(warn).toHaveBeenCalledTimes(1);

    // Second render of the same miss stays quiet — "warns once", not once per frame.
    getRuinFateWord('shattered_beyond_repair');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('delve scale vocabulary', () => {
  it('resolves every DelveScale', () => {
    for (const scale of ALL_SCALES) {
      expect(DELVE_SCALE_WORDS[scale], `chip word for ${scale}`).toBeTruthy();
      expect(getDelveScaleWord(scale)).not.toContain('_');
    }
  });

  it('falls back rather than leaking an unknown scale key', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getDelveScaleWord('world_ending')).toBe('World Ending');
  });
});

describe('stream yield vocabulary', () => {
  it('bands the whole live engine range without a numeral', () => {
    for (let rate = POP_ESSENCE_PER_TICK_MIN; rate <= POP_ESSENCE_PER_TICK_MAX; rate++) {
      const word = getStreamYieldWord(rate);
      expect(STREAM_YIELD_WORDS).toContain(word as typeof STREAM_YIELD_WORDS[number]);
      expect(word, `stream word for ${rate}`).not.toMatch(/\d/);
    }
  });

  it('is monotonic and reaches every band from the live range', () => {
    const seen = new Set<string>();
    let previousIndex = -1;
    for (let rate = POP_ESSENCE_PER_TICK_MIN; rate <= POP_ESSENCE_PER_TICK_MAX; rate++) {
      const index = STREAM_YIELD_WORDS.indexOf(
        getStreamYieldWord(rate) as typeof STREAM_YIELD_WORDS[number],
      );
      expect(index, 'a stronger stream never reads weaker').toBeGreaterThanOrEqual(previousIndex);
      previousIndex = index;
      seen.add(getStreamYieldWord(rate));
    }
    // A band no live rate can produce is dead vocabulary — the structural pin
    // THR-1070 used for its duration scale, for the same reason.
    expect(seen.size).toBe(STREAM_YIELD_WORDS.length);
  });

  it('clamps outside the engine range rather than returning undefined (NFP #4)', () => {
    expect(getStreamYieldWord(0)).toBe(STREAM_YIELD_WORDS[0]);
    expect(getStreamYieldWord(999)).toBe(STREAM_YIELD_WORDS[STREAM_YIELD_WORDS.length - 1]);
  });
});
