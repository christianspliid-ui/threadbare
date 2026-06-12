import { describe, it, expect } from 'vitest';
import { pickWithRepetitionGuard, type PhraseEntry, PROSE_REPETITION_GUARD_WINDOW } from '../proseSelection';

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POOL: PhraseEntry[] = [
  { phraseId: 'p1', text: 'First phrase.' },
  { phraseId: 'p2', text: 'Second phrase.' },
  { phraseId: 'p3', text: 'Third phrase.' },
  { phraseId: 'p4', text: 'Fourth phrase.' },
  { phraseId: 'p5', text: 'Fifth phrase.' },
];

describe('pickWithRepetitionGuard', () => {
  it('returns a PhraseEntry from the pool', () => {
    const used = new Set<string>();
    const result = pickWithRepetitionGuard(POOL, seededRng(1), used);
    expect(POOL.some(p => p.phraseId === result.phraseId)).toBe(true);
  });

  it('avoids already-used phrases while fresh options exist', () => {
    const used = new Set<string>(['p1', 'p2', 'p3', 'p4']);
    // Only p5 is fresh
    const result = pickWithRepetitionGuard(POOL, seededRng(1), used);
    expect(result.phraseId).toBe('p5');
  });

  it('falls back to full pool when all entries are used', () => {
    const used = new Set<string>(POOL.map(p => p.phraseId));
    // All used — should still return something without throwing
    expect(() => pickWithRepetitionGuard(POOL, seededRng(1), used)).not.toThrow();
  });

  it('adds the picked phraseId to usedIds', () => {
    const used = new Set<string>();
    const result = pickWithRepetitionGuard(POOL, seededRng(5), used);
    expect(used.has(result.phraseId)).toBe(true);
  });

  it('produces no repetitions across a full pool sweep', () => {
    const used = new Set<string>();
    const picked: string[] = [];
    for (let i = 0; i < POOL.length; i++) {
      picked.push(pickWithRepetitionGuard(POOL, seededRng(i * 7), used).phraseId);
    }
    expect(new Set(picked).size).toBe(POOL.length);
  });

  it('throws on empty pool', () => {
    expect(() => pickWithRepetitionGuard([], seededRng(1), new Set())).toThrow();
  });

  it('is deterministic — same seed and same usedIds produces same result', () => {
    const r1 = pickWithRepetitionGuard(POOL, seededRng(77), new Set(['p1']));
    const r2 = pickWithRepetitionGuard(POOL, seededRng(77), new Set(['p1']));
    expect(r1.phraseId).toBe(r2.phraseId);
  });

  it('PROSE_REPETITION_GUARD_WINDOW is a positive integer', () => {
    expect(PROSE_REPETITION_GUARD_WINDOW).toBeGreaterThan(0);
    expect(Number.isInteger(PROSE_REPETITION_GUARD_WINDOW)).toBe(true);
  });
});
