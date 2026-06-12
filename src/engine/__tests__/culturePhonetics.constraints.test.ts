import { describe, it, expect } from 'vitest';
import {
  countSyllables,
  hasConsonantClusterLongerThan,
  hasVowelRunLongerThan,
  NAME_MAX_SYLLABLES,
  NAME_MAX_CONSONANT_CLUSTER,
  NAME_MAX_VOWEL_RUN,
} from '../culturePhonetics';

describe('countSyllables', () => {
  it('counts vowel groups as syllables', () => {
    expect(countSyllables('a')).toBe(1);
    expect(countSyllables('ka')).toBe(1);
    expect(countSyllables('kael')).toBe(1);
    expect(countSyllables('mirael')).toBe(2); // mi-rael
    expect(countSyllables('solenne')).toBe(3); // so-len-ne
  });

  it('returns 1 for all-consonant strings', () => {
    expect(countSyllables('krn')).toBe(1);
  });

  it('returns at least 1 (implementation clamps at 1)', () => {
    expect(countSyllables('')).toBeGreaterThanOrEqual(1);
    expect(countSyllables('krn')).toBeGreaterThanOrEqual(1);
  });
});

describe('hasConsonantClusterLongerThan', () => {
  it('detects clusters longer than max', () => {
    expect(hasConsonantClusterLongerThan('krnn', 2)).toBe(true);   // krnn = 4 consecutive
    expect(hasConsonantClusterLongerThan('str', 2)).toBe(true);    // str = 3
    expect(hasConsonantClusterLongerThan('sk', 2)).toBe(false);    // sk = 2 (not > 2)
    expect(hasConsonantClusterLongerThan('ka', 2)).toBe(false);
  });

  it('would flag Saawhaiahaiiawhuiel-style clusters', () => {
    // 'whu' is w-h-u: only 'wh' before vowel 'u' — 2 consonants, not > 2
    // But 'whuiel' has wh at start; test cluster detection works generally
    expect(hasConsonantClusterLongerThan('shwrth', 2)).toBe(true); // 6-consonant cluster
  });
});

describe('hasVowelRunLongerThan', () => {
  it('detects vowel runs longer than max', () => {
    expect(hasVowelRunLongerThan('aeiou', 2)).toBe(true);    // 5 vowels
    expect(hasVowelRunLongerThan('aai', 2)).toBe(true);      // 3 vowels
    expect(hasVowelRunLongerThan('ae', 2)).toBe(false);      // 2 (not > 2)
    expect(hasVowelRunLongerThan('ka', 2)).toBe(false);
  });

  it('would reject Saawhaiahaiiawhuiel-style vowel avalanches', () => {
    // 'Saawh' → 'aa' is a 2-vowel run = not > 2 with max 2 — but 'aiaha' has longer runs
    expect(hasVowelRunLongerThan('Saawhaiahaiiawhuiel'.toLowerCase(), NAME_MAX_VOWEL_RUN)).toBe(true);
    expect(hasVowelRunLongerThan('Muwiaaimaiuea'.toLowerCase(), NAME_MAX_VOWEL_RUN)).toBe(true);
  });
});

describe('constraint constants', () => {
  it('MAX_SYLLABLES is in a reasonable range', () => {
    expect(NAME_MAX_SYLLABLES).toBeGreaterThanOrEqual(2);
    expect(NAME_MAX_SYLLABLES).toBeLessThanOrEqual(6);
  });

  it('MAX_CONSONANT_CLUSTER is at least 1', () => {
    expect(NAME_MAX_CONSONANT_CLUSTER).toBeGreaterThanOrEqual(1);
  });

  it('MAX_VOWEL_RUN is at least 1', () => {
    expect(NAME_MAX_VOWEL_RUN).toBeGreaterThanOrEqual(1);
  });
});
