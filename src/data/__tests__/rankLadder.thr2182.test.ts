/**
 * THR-2182 — rank words show their ladder (plan
 * `Docs/plans/2026-11-06-thr-2182-rank-words-show-their-ladder.md`).
 *
 * Walks every Reach and every tier: the place line names the next word up, the
 * hover lists all five words low to high within Law 18's 200 characters, an
 * out-of-range tier reads nothing (fail-soft), and the faction ladder's top word
 * no longer reuses a mortal ladder word.
 */
import { describe, it, expect } from 'vitest';
import { DOMAIN_WORD_SCALES, rankLadderHover, rankPlaceLine } from '../domain-words';
import { RANK_PLACE_WORDS, RANK_TOP_LINE } from '../person-sheet-words';
import { FACTION_REACH_WORDS, factionReachWord } from '../subject-sheet-words';
import { REACH_DOMAINS } from '../../types/traits';
import { reachDisplayName } from '../../engine/aftermathWords';

const LAW_18_MAX = 200;

describe('rankPlaceLine / rankLadderHover (THR-2182)', () => {
  it('every Reach and tier: the line names the next word, the top says so', () => {
    for (const domain of REACH_DOMAINS) {
      const scale = DOMAIN_WORD_SCALES[domain];
      for (let tier = 0; tier <= 4; tier++) {
        const line = rankPlaceLine(domain, tier);
        if (tier === 4) {
          expect(line).toBe(RANK_TOP_LINE);
        } else {
          expect(line).toBe(`${RANK_PLACE_WORDS[tier]} · next ${scale[tier + 1]}`);
        }
        expect(line).not.toMatch(/\d/);
        expect(line).not.toMatch(/rung/i);
      }
    }
  });

  it('the hover lists all five words, low to high, under 200 characters', () => {
    for (const domain of REACH_DOMAINS) {
      const name = reachDisplayName(domain);
      const hover = rankLadderHover(domain, name);
      expect(hover).toBe(`${name}, low to high: ${DOMAIN_WORD_SCALES[domain].join(', ')}.`);
      expect(hover!.length).toBeLessThanOrEqual(LAW_18_MAX);
    }
    expect(rankLadderHover('iron', 'Iron')).toBe('Iron, low to high: Meek, Trained, Formidable, Fearsome, Legendary.');
  });

  it('a tier that is not an integer 0–4 reads nothing', () => {
    for (const tier of [-1, 5, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(rankPlaceLine('iron', tier)).toBeUndefined();
    }
  });
});

describe('the faction ladder (THR-2182 U3)', () => {
  it('reads Slight · Able · Strong · Foremost at its thresholds', () => {
    expect(factionReachWord(0)).toBe('Slight');
    expect(factionReachWord(25)).toBe('Able');
    expect(factionReachWord(50)).toBe('Strong');
    expect(factionReachWord(75)).toBe('Foremost');
    expect(factionReachWord(80)).toBe('Foremost');
  });

  it('shares no word with a mortal Reach ladder', () => {
    const mortal = new Set(Object.values(DOMAIN_WORD_SCALES).flat());
    expect(FACTION_REACH_WORDS.filter(w => mortal.has(w))).toEqual([]);
  });
});
