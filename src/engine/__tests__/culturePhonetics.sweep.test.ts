/**
 * THR-2170 — a seeded sweep of 10 000 generated personal names. Warm playtest round 3
 * found a ruler named "Oetgotkoetgoeyt": four syllables, clusters of two, so it passed
 * every THR-456 check while reading as a stammer. The length cap and the repeat check
 * close that; this sweep is the Done-when.
 */
import { describe, it, expect } from 'vitest';
import {
  buildPhoneticSignature,
  generatePhoneticName,
  hasRepeatsMoreThan,
  syllableChunks,
  NAME_MAX_LENGTH,
  NAME_MAX_REPEATS,
} from '../culturePhonetics';
import type { CultureIdentity } from '../../types/culture';
import { SPHERE_NAMES } from '../../types/index';

function identity(foundationBias: string, sphere: string): CultureIdentity {
  return {
    foundationBias,
    veneratedSpheres: [sphere as never],
    primaryBiome: 'grasslands',
    preferredBiomes: ['grasslands'],
    toleratedBiomes: [],
    archetypeLabel: 'Sweep Culture',
    demonym: 'Sweeper',
    homePlaceName: 'Sweepholm',
    socialStructure: 'Flat',
    accountability: 'Community',
    behavioralKeywords: [],
    materialVocabulary: [],
    metaphorPalette: [],
    formativeTraitSeedIds: [],
    behavioralTraitSeedIds: [],
    reachPreferences: { iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0, eye: 0, stone: 0, star: 0 },
  };
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SWEEP_SIZE = 10_000;

describe('personal-name sweep (THR-2170)', () => {
  it('rejects the playtest name on both new checks', () => {
    expect('Oetgotkoetgoeyt'.length).toBeGreaterThan(NAME_MAX_LENGTH);
    expect(hasRepeatsMoreThan('Oetgotkoetgoeyt', NAME_MAX_REPEATS)).toBe(true);
    expect(hasRepeatsMoreThan('Lalla', NAME_MAX_REPEATS)).toBe(false);
    expect(hasRepeatsMoreThan('Mirael', NAME_MAX_REPEATS)).toBe(false);
  });

  it('chunks syllables as onset + nucleus, trailing consonants on the last', () => {
    expect(syllableChunks('Mirael')).toEqual(['mi', 'rael']);
    expect(syllableChunks('Kaskat')).toEqual(['ka', 'skat']);
    expect(syllableChunks('krn')).toEqual(['krn']);
  });

  it('10 000 seeded personal names: none over the cap, no syllable thrice, mostly generated', () => {
    const foundations = ['chaos', 'order', 'light', 'darkness'];
    const signatures = foundations.flatMap((f, fi) =>
      SPHERE_NAMES.map((sphere, si) =>
        buildPhoneticSignature(identity(f, sphere), 1000 + fi * 97 + si, `culture_${f}_${sphere}`)),
    );
    const rng = mulberry32(2170);
    const names: string[] = [];
    let nulls = 0;
    for (let i = 0; names.length < SWEEP_SIZE && i < SWEEP_SIZE * 3; i++) {
      const sig = signatures[i % signatures.length];
      // A fresh used-set per draw: the sweep measures the shape of names, not collisions.
      const name = generatePhoneticName(sig, 'personal', rng, new Set(), 'culture_sweep', 0);
      if (name === null) nulls++;
      else names.push(name);
    }

    expect(names).toHaveLength(SWEEP_SIZE);
    const overCap = names.filter(n => n.length > NAME_MAX_LENGTH);
    const stammers = names.filter(n => {
      const counts = new Map<string, number>();
      for (const c of syllableChunks(n)) counts.set(c, (counts.get(c) ?? 0) + 1);
      return [...counts.values()].some(v => v >= 3);
    });
    expect(overCap).toEqual([]);
    expect(stammers).toEqual([]);
    // The generator still does its job — a cap that starves it would quietly hand
    // every name back to the curated pool. Fail-soft holds either way (null → pool).
    expect(nulls / (names.length + nulls)).toBeLessThan(0.05);
  });
});
