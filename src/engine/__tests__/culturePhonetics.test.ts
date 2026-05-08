import { describe, it, expect } from 'vitest';
import { buildPhoneticSignature, generatePhoneticName } from '../culturePhonetics';
import type { CultureIdentity } from '../../types/culture';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ───────────────────────────────────────────────────────

function makeIdentity(foundationBias: string, sphere: string): CultureIdentity {
  return {
    foundationBias,
    veneratedSpheres: [sphere as any],
    primaryBiome: 'grasslands',
    preferredBiomes: ['grasslands'],
    toleratedBiomes: [],
    archetypeLabel: 'Test Culture',
    demonym: 'Tester',
    homePlaceName: 'Testheim',
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

// ─── buildPhoneticSignature ────────────────────────────────────────

describe('buildPhoneticSignature', () => {
  it('produces a valid signature for every foundation', () => {
    const foundations = ['chaos', 'order', 'light', 'darkness'];
    for (const f of foundations) {
      const sig = buildPhoneticSignature(makeIdentity(f, 'force'), 1234, `culture_${f}`);
      expect(sig.vowels.length).toBeGreaterThanOrEqual(3);
      expect(sig.vowels.length).toBeLessThanOrEqual(5);
      expect(sig.onsets.length).toBeGreaterThanOrEqual(4);
      expect(sig.onsets.length).toBeLessThanOrEqual(8);
      expect(sig.syllableTemplates.length).toBeGreaterThanOrEqual(2);
      expect(sig.syllableTemplates.length).toBeLessThanOrEqual(3);
      expect(['title', 'compound', 'apostrophe']).toContain(sig.orthography);
    }
  });

  it('produces a valid signature for every sphere', () => {
    for (const sphere of SPHERE_NAMES) {
      const sig = buildPhoneticSignature(makeIdentity('order', sphere), 999, `culture_${sphere}`);
      expect(sig.onsets.length).toBeGreaterThanOrEqual(4);
      expect(sig.vowels.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('is deterministic — same inputs produce identical signatures', () => {
    const identity = makeIdentity('chaos', 'force');
    const sig1 = buildPhoneticSignature(identity, 42, 'culture_test');
    const sig2 = buildPhoneticSignature(identity, 42, 'culture_test');
    expect(sig1.seedHash).toBe(sig2.seedHash);
    expect(sig1.vowels).toEqual(sig2.vowels);
    expect(sig1.onsets).toEqual(sig2.onsets);
    expect(sig1.codas).toEqual(sig2.codas);
    expect(sig1.syllableTemplates).toEqual(sig2.syllableTemplates);
    expect(sig1.orthography).toBe(sig2.orthography);
  });

  it('different foundations produce different signatures at the same seed', () => {
    const sigChaos = buildPhoneticSignature(makeIdentity('chaos', 'force'), 42, 'c1');
    const sigOrder = buildPhoneticSignature(makeIdentity('order', 'force'), 42, 'c1');
    // At least vowels or onsets should differ between foundations
    const vowelsDiffer = JSON.stringify(sigChaos.vowels) !== JSON.stringify(sigOrder.vowels);
    const onsetsDiffer = JSON.stringify(sigChaos.onsets) !== JSON.stringify(sigOrder.onsets);
    expect(vowelsDiffer || onsetsDiffer).toBe(true);
  });

  it('different cultureSeed values produce different signatures for the same identity', () => {
    const identity = makeIdentity('order', 'force');
    const sigA = buildPhoneticSignature(identity, 42, 'culture_a');
    const sigB = buildPhoneticSignature(identity, 99, 'culture_a');
    expect(sigA.seedHash).not.toBe(sigB.seedHash);
  });

  it('codas array is empty for open-syllable-favoring foundations with appropriate seed', () => {
    // light has 0.55 open-syllable chance — run many seeds until we hit one
    let foundOpenSyllable = false;
    for (let seed = 0; seed < 200; seed++) {
      const sig = buildPhoneticSignature(makeIdentity('light', 'spirit'), seed, `c_${seed}`);
      if (sig.codas.length === 0) { foundOpenSyllable = true; break; }
    }
    expect(foundOpenSyllable).toBe(true);
  });

  it('personal syllable range min is always 2', () => {
    for (let seed = 0; seed < 20; seed++) {
      const sig = buildPhoneticSignature(makeIdentity('order', 'force'), seed, `c_${seed}`);
      expect(sig.personalSyllableRange.min).toBe(2);
    }
  });
});

// ─── generatePhoneticName ──────────────────────────────────────────

describe('generatePhoneticName', () => {
  it('generates non-empty names in personal mode', () => {
    const sig = buildPhoneticSignature(makeIdentity('order', 'force'), 42, 'culture_test');
    const rng = mulberry32(12345);
    const usedNames = new Set<string>();
    const name = generatePhoneticName(sig, 'personal', rng, usedNames, 'culture_test', 0);
    expect(name).not.toBeNull();
    expect(name!.length).toBeGreaterThanOrEqual(2);
  });

  it('generates non-empty names in settlement mode', () => {
    const sig = buildPhoneticSignature(makeIdentity('chaos', 'matter'), 99, 'culture_chaos');
    const rng = mulberry32(99999);
    const usedNames = new Set<string>();
    const name = generatePhoneticName(sig, 'settlement', rng, usedNames, 'culture_chaos', 0);
    expect(name).not.toBeNull();
    expect(name!.length).toBeGreaterThanOrEqual(2);
  });

  it('adds generated names to the usedNames set', () => {
    const sig = buildPhoneticSignature(makeIdentity('order', 'force'), 42, 'c');
    const rng = mulberry32(111);
    const usedNames = new Set<string>();
    const name = generatePhoneticName(sig, 'personal', rng, usedNames, 'c', 0);
    expect(name).not.toBeNull();
    expect(usedNames.has(name!)).toBe(true);
  });

  it('does not return a name already in usedNames', () => {
    const sig = buildPhoneticSignature(makeIdentity('order', 'force'), 42, 'c');
    const rng1 = mulberry32(222);
    const usedNames = new Set<string>();
    const first = generatePhoneticName(sig, 'personal', rng1, usedNames, 'c', 0);
    expect(first).not.toBeNull();
    // Try to get first name again — it should not be returned
    const rng2 = mulberry32(222); // same seed → same sequence
    const second = generatePhoneticName(sig, 'personal', rng2, usedNames, 'c', 0);
    // second might be null if all attempts collide, or a different name
    expect(second === null || second !== first).toBe(true);
  });

  it('returns null if all attempts are exhausted (empty vowels edge case)', () => {
    // Craft a signature with empty vowels — every buildSyllable call should return null
    const emptySig: import('../../types/culture').CulturePhoneticSignature = {
      seedHash: 1,
      vowels: [],
      onsets: ['k', 't'],
      codas: ['n'],
      syllableTemplates: ['CV'],
      personalSyllableRange: { min: 2, max: 3 },
      settlementSyllableRange: { min: 2, max: 4 },
      nameSuffixes: [],
      settlementSuffixes: [],
      orthography: 'title',
    };
    const rng = mulberry32(1);
    const result = generatePhoneticName(emptySig, 'personal', rng, new Set(), 'test', 0);
    expect(result).toBeNull();
  });

  it('generated names start with a letter', () => {
    const sig = buildPhoneticSignature(makeIdentity('darkness', 'blood'), 77, 'culture_dark');
    const rng = mulberry32(7777);
    const usedNames = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const name = generatePhoneticName(sig, 'personal', rng, usedNames, 'culture_dark', 0);
      if (name !== null) {
        expect(/^[a-zA-Z]/.test(name)).toBe(true);
      }
    }
  });
});

// ─── Snapshot test ────────────────────────────────────────────────

describe('phonetic name snapshot — seed 42', () => {
  it('produces stable names across all foundations at seed 42', () => {
    const foundations = ['chaos', 'order', 'light', 'darkness'];
    const snapshots: Record<string, string[]> = {};

    for (const f of foundations) {
      const sig = buildPhoneticSignature(makeIdentity(f, 'force'), 42, `snap_${f}`);
      const rng = mulberry32(42);
      const usedNames = new Set<string>();
      const names: string[] = [];
      for (let i = 0; i < 10; i++) {
        const n = generatePhoneticName(sig, 'personal', rng, usedNames, `snap_${f}`, 0);
        if (n) names.push(n);
      }
      snapshots[f] = names;
    }

    // Every foundation should produce at least 5 names
    for (const f of foundations) {
      expect(snapshots[f].length).toBeGreaterThanOrEqual(5);
    }

    // Names across foundations should have visible variety
    const allNames = Object.values(snapshots).flat();
    const uniqueNames = new Set(allNames);
    // Allow up to 30% collision rate across all generated names
    expect(uniqueNames.size).toBeGreaterThan(allNames.length * 0.7);
  });
});
