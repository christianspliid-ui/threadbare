import { describe, it, expect } from 'vitest';
import { pickCulturalName, WANDERER_FALLBACK_BANNED_PATTERNS, GENERIC_NAMES } from '../culture-name-pools';

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('WANDERER_FALLBACK_BANNED_PATTERNS', () => {
  it('rejects Wanderer-N strings', () => {
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Wanderer-345'))).toBe(true);
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Wanderer-0'))).toBe(true);
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Wanderer-999'))).toBe(true);
  });

  it('rejects Elite of Lair strings', () => {
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Elite of Lair 7'))).toBe(true);
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Elite of Lair (spawned t50)'))).toBe(true);
  });

  it('does not reject valid names', () => {
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Kael'))).toBe(false);
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Mirael Thornweaver'))).toBe(false);
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test('Stranger of the Eastern Road'))).toBe(false);
  });
});

describe('pickCulturalName — banned patterns never leak', () => {
  it('never returns a Wanderer-N pattern even with exhausted pool', () => {
    const usedNames = new Set<string>();
    // exhaust a large number of names
    for (let i = 0; i < 200; i++) {
      const name = pickCulturalName('chaos', 'force', seededRng(i * 7 + 3), usedNames);
      expect(name).not.toMatch(/^Wanderer-\d+$/);
    }
  });

  it('never returns an Elite of Lair pattern', () => {
    const usedNames = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const name = pickCulturalName('order', 'mind', seededRng(i * 13 + 5), usedNames);
      expect(name).not.toMatch(/^Elite of Lair/);
    }
  });

  it('returns distinct names for small pools', () => {
    const usedNames = new Set<string>();
    const names: string[] = [];
    for (let i = 0; i < 5; i++) {
      names.push(pickCulturalName('light', 'spirit', seededRng(i), usedNames));
    }
    // all names should be unique
    expect(new Set(names).size).toBe(5);
  });
});

describe('pickCulturalName — the fallback tier honours the exclusion set (THR-1420)', () => {
  it('never returns a name the caller already marked used, even with every pool spent', () => {
    // The real caller (`mintCompanionName`) rebuilds `usedNames` from the graph on
    // every mint, so the ordinal anchor — `usedNames.size` — does not advance
    // between two colliding mints. A shared-and-growing set hides that; a fresh
    // set per call is what production actually does.
    const spent = [...GENERIC_NAMES];

    const first = new Set<string>(spent);
    const nameA = pickCulturalName('', '', seededRng(11), first);
    expect(spent).not.toContain(nameA);

    // Second call, fresh set of the same size plus the name just handed out —
    // exactly the shape two companions on one bearer produce.
    const second = new Set<string>([...spent, nameA]);
    // The picker adds its choice to the set before returning, so the membership
    // question has to be asked of a snapshot taken before the call.
    const takenBefore = new Set(second);
    const nameB = pickCulturalName('', '', seededRng(11), second);
    expect(takenBefore.has(nameB)).toBe(false);
    expect(nameB).not.toBe(nameA);
  });

  it('still refuses banned placeholder patterns from the fallback tier', () => {
    const used = new Set<string>(GENERIC_NAMES);
    const name = pickCulturalName('', '', seededRng(3), used);
    expect(WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test(name))).toBe(false);
  });
});
