import { describe, it, expect } from 'vitest';
import { composeRetconLine, type RetconInput } from '../premonition-content';

function makeRng(seed = 42) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

const base: RetconInput = {
  encounterType: 'explore',
  reach: 'eye',
  threatRating: 'easy',
  hexDistance: 0,
  requiresPresence: true,
  locationName: 'The Weathered Span',
  agentName: 'Kael',
};

describe('composeRetconLine', () => {
  it('produces a non-empty string', () => {
    const line = composeRetconLine(makeRng(), base);
    expect(line.length).toBeGreaterThan(10);
    console.log('[explore/eye/easy/here]', line);
  });

  it('includes distance context for far encounters', () => {
    const line = composeRetconLine(makeRng(), { ...base, hexDistance: 8, locationName: 'Thornwall' });
    // Far encounters should mention the location
    expect(line).toContain('Thornwall');
    console.log('[explore/eye/easy/far]', line);
  });

  it('uses remote fragments when requiresPresence is false', () => {
    const line = composeRetconLine(makeRng(), { ...base, requiresPresence: false });
    // Remote encounters don't include location suffix (dist=0)
    expect(line.length).toBeGreaterThan(10);
    console.log('[explore/eye/easy/remote]', line);
  });

  it('varies by encounter type', () => {
    const rng = makeRng(99);
    const explore = composeRetconLine(rng, base);
    const duel = composeRetconLine(makeRng(99), { ...base, encounterType: 'duel', reach: 'iron', threatRating: 'hard' });
    expect(explore).not.toEqual(duel);
    console.log('[explore]', explore);
    console.log('[duel]', duel);
  });

  it('varies confidence by threat rating', () => {
    const easy = composeRetconLine(makeRng(1), { ...base, threatRating: 'easy' });
    const deadly = composeRetconLine(makeRng(1), { ...base, threatRating: 'deadly' });
    expect(easy).not.toEqual(deadly);
    console.log('[easy]', easy);
    console.log('[deadly]', deadly);
  });

  it('is deterministic with same seed', () => {
    const a = composeRetconLine(makeRng(77), base);
    const b = composeRetconLine(makeRng(77), base);
    expect(a).toEqual(b);
  });

  it('resolves pronouns to they/their', () => {
    const line = composeRetconLine(makeRng(), { ...base, encounterType: 'assist', agentName: 'Mira' });
    expect(line).not.toContain('{pronoun}');
    expect(line).not.toContain('{possessive}');
    console.log('[assist/pronoun-check]', line);
  });

  it('covers all encounter types without error', () => {
    const types = ['explore', 'acquire', 'create', 'hire', 'duel', 'steal', 'trade', 'assist', 'build', 'lead'] as const;
    for (const t of types) {
      const line = composeRetconLine(makeRng(), { ...base, encounterType: t });
      expect(line.length).toBeGreaterThan(10);
      console.log(`[${t}]`, line);
    }
  });
});
