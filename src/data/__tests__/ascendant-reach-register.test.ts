/**
 * Contract tests for ASCENDANT_REACH_REGISTER (THR-869).
 *
 * The register exists to stop the god being described in mortal capability words. These
 * tests pin the FULL 8×5 word set with `toEqual` rather than asserting a count — a count
 * passes while the words rot, and the words are the whole deliverable.
 */
import { describe, it, expect } from 'vitest';
import {
  ASCENDANT_REACH_REGISTER,
  ASCENDANT_REGISTER_BANDS,
  getAscendantTierWord,
  getAscendantEchoLine,
} from '../ascendant-reach-register';
import { REACH_DOMAINS, NARRATIVE_LEXICON } from '../../types/traits';

describe('ASCENDANT_REACH_REGISTER — the full authored set', () => {
  it('pins every reach ladder exactly', () => {
    const ladders = Object.fromEntries(
      REACH_DOMAINS.map((r) => [r, ASCENDANT_REACH_REGISTER[r].tierWords]),
    );
    expect(ladders).toEqual({
      iron: ['Unblooded', 'Drawn', 'Holding', 'Unbreaking', 'War Itself'],
      gold: ['Owing', 'Squaring', 'Creditor', 'Price-Setter', 'Every Debt'],
      shadow: ['Seen', 'Half-Seen', 'Unwitnessed', 'Unremembered', 'Never There'],
      veil: ['Sealed', 'Thinning', 'Open', 'Passable', 'No Wall'],
      heart: ['Unmourned', 'Missed', 'Wept For', 'Kept', 'Never Let Go'],
      eye: ['Blinkered', 'Watching', 'Far-Seeing', 'Nothing Hidden', 'Before It Happens'],
      stone: ['Unhewn', 'Set', 'Load-Bearing', 'Monumental', 'World-Root'],
      star: ['Unnamed', 'Spoken', 'Hallowed', 'Sworn By', 'Every Rite'],
    });
  });

  it('covers all 8 reaches with 5 bands each and a non-empty echo line', () => {
    expect(Object.keys(ASCENDANT_REACH_REGISTER).sort()).toEqual([...REACH_DOMAINS].sort());
    for (const reach of REACH_DOMAINS) {
      const entry = ASCENDANT_REACH_REGISTER[reach];
      expect(entry.tierWords).toHaveLength(ASCENDANT_REGISTER_BANDS);
      for (const word of entry.tierWords) expect(word.trim().length).toBeGreaterThan(0);
      expect(entry.echoLine.trim().length).toBeGreaterThan(0);
    }
  });

  it('never reuses a mortal capability word — the failure this table exists to kill', () => {
    const mortalWords = new Set(
      REACH_DOMAINS.flatMap((r) => NARRATIVE_LEXICON[r]).map((w) => w.toLowerCase()),
    );
    for (const reach of REACH_DOMAINS) {
      for (const word of ASCENDANT_REACH_REGISTER[reach].tierWords) {
        expect(mortalWords.has(word.toLowerCase())).toBe(false);
      }
    }
    // Guard is non-vacuous: the mortal set really does contain the named failure cases.
    for (const failure of ['trained', 'rootless', 'destitute']) {
      expect(mortalWords.has(failure)).toBe(true);
    }
  });

  it('renders a word, never a number', () => {
    for (const reach of REACH_DOMAINS) {
      for (const word of ASCENDANT_REACH_REGISTER[reach].tierWords) {
        expect(word).not.toMatch(/\d/);
      }
    }
  });
});

describe('getAscendantTierWord — engine tier (1–10) to register band', () => {
  it('maps each pair of engine tiers onto one band, ascending', () => {
    const bands = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => getAscendantTierWord('stone', t));
    expect(bands).toEqual([
      'Unhewn', 'Unhewn',
      'Set', 'Set',
      'Load-Bearing', 'Load-Bearing',
      'Monumental', 'Monumental',
      'World-Root', 'World-Root',
    ]);
  });

  it('clamps out-of-range tiers to the end bands', () => {
    expect(getAscendantTierWord('iron', 0)).toBe('Unblooded');
    expect(getAscendantTierWord('iron', -5)).toBe('Unblooded');
    expect(getAscendantTierWord('iron', 99)).toBe('War Itself');
  });

  it('fail-soft: non-finite tier falls back to the shallowest band', () => {
    expect(getAscendantTierWord('gold', NaN)).toBe('Owing');
    // Infinity is not finite either — it takes the same shallowest-band fallback.
    expect(getAscendantTierWord('gold', Infinity)).toBe('Owing');
  });

  it('fail-soft: an unmapped reach yields empty string, never a throw', () => {
    expect(getAscendantTierWord('not_a_reach', 3)).toBe('');
    expect(getAscendantEchoLine('not_a_reach')).toBe('');
  });
});
