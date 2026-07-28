import { describe, it, expect } from 'vitest';
import {
  REVEAL_KINDS,
  REVEAL_CATEGORY_TITLES,
  REVEAL_FALLBACK_FLAVOR,
  pickFallbackFlavor,
  revealCategoryTitle,
  stableIndex,
  type RevealKind,
} from '../reveal-content';

describe('reveal-content (THR-799)', () => {
  it('has a ceremony line for every declared kind', () => {
    for (const kind of REVEAL_KINDS) {
      expect(REVEAL_CATEGORY_TITLES[kind], `missing title for ${kind}`).toBeTruthy();
    }
    // No extra keys beyond the declared set — a stray kind would never render.
    expect(Object.keys(REVEAL_CATEGORY_TITLES).sort()).toEqual([...REVEAL_KINDS].sort());
  });

  it('has at least two fallback lines per kind so repeats do not read identically', () => {
    for (const kind of REVEAL_KINDS) {
      expect(REVEAL_FALLBACK_FLAVOR[kind].length, `too few lines for ${kind}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps category titles in letterspaced display caps', () => {
    for (const kind of REVEAL_KINDS) {
      const title = REVEAL_CATEGORY_TITLES[kind];
      expect(title, `${kind} title must be uppercase`).toBe(title.toUpperCase());
    }
  });

  // NFP #3 — determinism. The same element must show the same line every time,
  // in this run and the next; nothing here may consume a PRNG draw.
  it('selects the same fallback line for the same id every call', () => {
    const first = pickFallbackFlavor('attachment', 'attachment.old_steel');
    for (let i = 0; i < 50; i++) {
      expect(pickFallbackFlavor('attachment', 'attachment.old_steel')).toBe(first);
    }
  });

  it('returns a line from the kind pool', () => {
    for (const kind of REVEAL_KINDS) {
      const line = pickFallbackFlavor(kind, `element.${kind}.1`);
      expect(REVEAL_FALLBACK_FLAVOR[kind]).toContain(line);
    }
  });

  it('spreads different ids across more than one line', () => {
    const seen = new Set<string | null>();
    for (let i = 0; i < 40; i++) {
      seen.add(pickFallbackFlavor('event', `event.${i}`));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('returns null for an unknown kind so the caller omits the well', () => {
    expect(pickFallbackFlavor('nonsense' as RevealKind, 'x')).toBeNull();
    expect(revealCategoryTitle('nonsense' as RevealKind)).toBeNull();
  });

  it('stableIndex stays inside the bucket range and tolerates a zero bucket', () => {
    for (let i = 0; i < 200; i++) {
      const idx = stableIndex(`id.${i}`, 3);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(3);
      expect(Number.isInteger(idx)).toBe(true);
    }
    expect(stableIndex('anything', 0)).toBe(0);
  });

  it('stableIndex handles the empty id without throwing', () => {
    expect(stableIndex('', 3)).toBeGreaterThanOrEqual(0);
  });
});
