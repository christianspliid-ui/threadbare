/**
 * Culture Phonetics — per-culture phoneme signature builder and name generator.
 *
 * Adds a phonetic identity layer on top of the existing curated name pools.
 * Each culture gets a deterministic phoneme inventory (vowels, onset/coda consonants,
 * syllable templates) derived from its foundation + sphere identity seed.
 * Names built from this inventory are internally consistent and audibly distinct
 * across cultures, while the curated pool still fires first for anchor flavor.
 *
 * THR-15 — Culture-Seeded Agent Name Generation
 */

import type { CultureIdentity, CulturePhoneticSignature, SyllableTemplate } from '../types/culture';
import {
  PHONETIC_SEED_SALT,
  VOWEL_COUNT_RANGE,
  ONSET_COUNT_RANGE,
  CODA_COUNT_RANGE,
  OPEN_SYLLABLE_CHANCE_BY_FOUNDATION,
  SYLLABLE_TEMPLATE_COUNT_RANGE,
  PERSONAL_SYLLABLE_RANGE,
  SETTLEMENT_SYLLABLE_RANGE,
  MAX_PHONETIC_ATTEMPTS,
} from '../types/culture';
import {
  VOWEL_MASTER_LIST_BY_FOUNDATION,
  CONSONANT_MASTER_LIST_BY_SPHERE,
  FOUNDATION_CONSONANT_BIAS,
  NAME_SUFFIXES_BY_FOUNDATION,
  SETTLEMENT_SUFFIXES_BY_FOUNDATION_PHONETIC,
  SYLLABLE_TEMPLATE_BIAS_BY_FOUNDATION,
  ORTHOGRAPHY_OPTIONS,
  ORTHOGRAPHY_WEIGHTS_BY_FOUNDATION,
} from '../data/culture-phonetic-pools';
import { emitTrace } from './traceBuffer';
import type { CulturePhoneticSignatureBuiltTrace, PhoneticNameGeneratedTrace, NamingConstrainedRejectTrace } from '../types/trace';

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Name Constraint Constants (THR-456) ─────────────────────────

/** Hard cap on syllables in a generated personal name */
export const NAME_MAX_SYLLABLES = 4;
/** Maximum run of consecutive consonant characters */
export const NAME_MAX_CONSONANT_CLUSTER = 2;
/** Maximum run of consecutive vowel characters */
export const NAME_MAX_VOWEL_RUN = 2;
/** How many times to retry before falling back to curated pool */
export const NAME_RETRY_BUDGET = 6;

const VOWELS = new Set('aeiouAEIOU');

export function countSyllables(word: string): number {
  const lower = word.toLowerCase();
  // Count vowel groups (each contiguous vowel run = one syllable nucleus)
  let count = 0;
  let inVowel = false;
  for (const ch of lower) {
    if (VOWELS.has(ch)) {
      if (!inVowel) { count++; inVowel = true; }
    } else {
      inVowel = false;
    }
  }
  return Math.max(1, count);
}

export function hasConsonantClusterLongerThan(word: string, max: number): boolean {
  let run = 0;
  for (const ch of word.toLowerCase()) {
    if (!VOWELS.has(ch) && /[a-z]/.test(ch)) {
      run++;
      if (run > max) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

export function hasVowelRunLongerThan(word: string, max: number): boolean {
  let run = 0;
  for (const ch of word.toLowerCase()) {
    if (VOWELS.has(ch)) {
      run++;
      if (run > max) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

// ─── Helpers ─────────────────────────────────────────────────────

function pickN<T>(rng: () => number, pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function clampedInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function stableHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function weightedPick<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Signature Builder ───────────────────────────────────────────

/**
 * Build a deterministic phonetic signature for a culture.
 *
 * @param identity - The culture's composed identity (foundation + spheres)
 * @param cultureSeed - Numeric seed assigned to this culture (from PRNG at worldgen time)
 * @param cultureId - The node ID string (used to differentiate same-foundation cultures)
 */
export function buildPhoneticSignature(
  identity: CultureIdentity,
  cultureSeed: number,
  cultureId: string,
): CulturePhoneticSignature {
  const foundation = identity.foundationBias;
  const primarySphere = identity.veneratedSpheres[0] ?? 'force';
  const demonym = identity.demonym ?? '';

  // Derive a seedHash that incorporates the culture's unique identity
  const identityStr = `${foundation}:${primarySphere}:${demonym}`;
  const identityHash = stableHash(identityStr);
  const seedHash = ((cultureSeed ^ identityHash) + PHONETIC_SEED_SALT) >>> 0;

  const rng = mulberry32(seedHash);

  // Vowels: 3–5 from foundation-biased master list
  const vowelPool = VOWEL_MASTER_LIST_BY_FOUNDATION[foundation] ?? VOWEL_MASTER_LIST_BY_FOUNDATION['order'];
  const vowelCount = clampedInt(rng, VOWEL_COUNT_RANGE.min, VOWEL_COUNT_RANGE.max);
  const vowels = pickN(rng, vowelPool, vowelCount);

  // Onsets: 4–8 from sphere pool + foundation bias
  const sphereConsonants = CONSONANT_MASTER_LIST_BY_SPHERE[primarySphere] ?? CONSONANT_MASTER_LIST_BY_SPHERE['force'];
  const foundationBiasConsonants = FOUNDATION_CONSONANT_BIAS[foundation] ?? [];
  const onsetPool = [...new Set([...sphereConsonants, ...foundationBiasConsonants])];
  const onsetCount = clampedInt(rng, ONSET_COUNT_RANGE.min, ONSET_COUNT_RANGE.max);
  const onsets = pickN(rng, onsetPool, onsetCount);

  // Codas: open-syllable chance by foundation, otherwise 2–6 consonants from sphere pool
  const openSyllableChance = OPEN_SYLLABLE_CHANCE_BY_FOUNDATION[foundation] ?? 0.25;
  let codas: string[];
  if (rng() < openSyllableChance) {
    codas = [];
  } else {
    const codaCount = clampedInt(rng, 2, CODA_COUNT_RANGE.max);
    codas = pickN(rng, sphereConsonants, codaCount);
  }

  // Syllable templates: 2–3 from foundation-biased set
  const templatePool = SYLLABLE_TEMPLATE_BIAS_BY_FOUNDATION[foundation] ?? ['CV', 'CVC', 'VC'];
  const templateCount = clampedInt(rng, SYLLABLE_TEMPLATE_COUNT_RANGE.min, SYLLABLE_TEMPLATE_COUNT_RANGE.max);
  // Deduplicate while preserving order
  const seen = new Set<SyllableTemplate>();
  const syllableTemplates: SyllableTemplate[] = [];
  for (const t of templatePool) {
    if (!seen.has(t) && syllableTemplates.length < templateCount) {
      seen.add(t);
      syllableTemplates.push(t);
    }
  }
  // If the bias list didn't have enough unique templates, add fallbacks
  const allTemplates: SyllableTemplate[] = ['CV', 'CVC', 'VC', 'CVV', 'CVVC'];
  for (const t of allTemplates) {
    if (syllableTemplates.length >= templateCount) break;
    if (!seen.has(t)) { seen.add(t); syllableTemplates.push(t); }
  }

  // Syllable count ranges
  const personalMin = PERSONAL_SYLLABLE_RANGE.min;
  const personalMax = rng() < 0.15 ? 4 : rng() < 0.1 ? 1 : PERSONAL_SYLLABLE_RANGE.max;
  const settlementMax = SETTLEMENT_SYLLABLE_RANGE.max;
  const settlementMin = SETTLEMENT_SYLLABLE_RANGE.min;

  // Morphological suffixes
  const namesSuffixPool = NAME_SUFFIXES_BY_FOUNDATION[foundation] ?? [''];
  const nameSuffixes = pickN(rng, namesSuffixPool, 3);

  const settleSuffixPool = SETTLEMENT_SUFFIXES_BY_FOUNDATION_PHONETIC[foundation] ?? ['-ton'];
  const settlementSuffixes = pickN(rng, settleSuffixPool, 2);

  // Orthography
  const orthoWeights = ORTHOGRAPHY_WEIGHTS_BY_FOUNDATION[foundation] ?? [0.6, 0.35, 0.05];
  const orthography = weightedPick(rng, ORTHOGRAPHY_OPTIONS, orthoWeights);

  const signature: CulturePhoneticSignature = {
    seedHash,
    vowels,
    onsets,
    codas,
    syllableTemplates,
    personalSyllableRange: { min: personalMin, max: personalMax },
    settlementSyllableRange: { min: settlementMin, max: settlementMax },
    nameSuffixes,
    settlementSuffixes,
    orthography,
  };

  emitTrace({
    tick: 0,
    category: 'culture_phonetic_signature_built',
    summary: `Built phonetic signature for ${cultureId}: ${vowels.length} vowels, ${onsets.length} onsets, templates=[${syllableTemplates.join(',')}]`,
    cultureId,
    seedHash,
    vowelCount: vowels.length,
    onsetCount: onsets.length,
    codaCount: codas.length,
    templates: syllableTemplates,
    personalRange: [personalMin, personalMax],
    settlementRange: [settlementMin, settlementMax],
  } as CulturePhoneticSignatureBuiltTrace);

  return signature;
}

// ─── Name Generator ──────────────────────────────────────────────

/**
 * Build a single syllable from the signature's phoneme inventory.
 * Returns null if the template requires consonants but none are available.
 */
function buildSyllable(
  template: SyllableTemplate,
  signature: CulturePhoneticSignature,
  rng: () => number,
): string | null {
  const { vowels, onsets, codas } = signature;
  if (vowels.length === 0) return null;

  const pickFrom = (arr: string[]): string | null =>
    arr.length > 0 ? arr[Math.floor(rng() * arr.length)] : null;

  switch (template) {
    case 'CV': {
      const c = pickFrom(onsets);
      const v = pickFrom(vowels);
      if (!c || !v) return v ?? null;
      return c + v;
    }
    case 'CVC': {
      const c1 = pickFrom(onsets);
      const v = pickFrom(vowels);
      const c2 = codas.length > 0 ? pickFrom(codas) : pickFrom(onsets);
      if (!v) return null;
      return (c1 ?? '') + v + (c2 ?? '');
    }
    case 'VC': {
      const v = pickFrom(vowels);
      const c = codas.length > 0 ? pickFrom(codas) : pickFrom(onsets);
      if (!v) return null;
      return v + (c ?? '');
    }
    case 'CVV': {
      const c = pickFrom(onsets);
      const v1 = pickFrom(vowels);
      const v2 = pickFrom(vowels);
      if (!v1) return null;
      return (c ?? '') + v1 + (v2 ?? v1);
    }
    case 'CVVC': {
      const c1 = pickFrom(onsets);
      const v1 = pickFrom(vowels);
      const v2 = pickFrom(vowels);
      const c2 = codas.length > 0 ? pickFrom(codas) : pickFrom(onsets);
      if (!v1) return null;
      return (c1 ?? '') + v1 + (v2 ?? v1) + (c2 ?? '');
    }
    default:
      return null;
  }
}

/**
 * Apply the culture's orthography style to a raw generated word.
 */
function applyOrthography(raw: string, signature: CulturePhoneticSignature): string {
  switch (signature.orthography) {
    case 'title':
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    case 'compound':
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    case 'apostrophe': {
      // Insert an apostrophe after roughly the midpoint syllable boundary
      const mid = Math.floor(raw.length / 2);
      // Find a vowel position near mid to break at
      let breakAt = mid;
      for (let i = mid; i > 0; i--) {
        if ('aeiouAEIOU'.includes(raw[i])) { breakAt = i + 1; break; }
      }
      if (breakAt <= 0 || breakAt >= raw.length) {
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      }
      const first = raw.slice(0, breakAt);
      const second = raw.slice(breakAt);
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
        + "'" + second.charAt(0).toUpperCase() + second.slice(1).toLowerCase();
    }
  }
}

/**
 * Generate a name from a culture's phonetic signature.
 *
 * @param signature - The culture's phonetic signature
 * @param mode - 'personal' | 'settlement' | 'homeland'
 * @param rng - Seeded PRNG (from the caller — not the signature's own RNG)
 * @param usedNames - Set of already-used names (mutated on success)
 * @param cultureId - For tracing
 * @param tick - Current tick for tracing
 * @returns A generated name string, or null if generation failed
 */
export function generatePhoneticName(
  signature: CulturePhoneticSignature,
  mode: 'personal' | 'settlement' | 'homeland',
  rng: () => number,
  usedNames: Set<string>,
  cultureId: string,
  tick: number,
): string | null {
  const range = mode === 'personal'
    ? signature.personalSyllableRange
    : signature.settlementSyllableRange;

  const suffixPool = mode === 'personal' ? signature.nameSuffixes : signature.settlementSuffixes;

  for (let attempt = 0; attempt < MAX_PHONETIC_ATTEMPTS; attempt++) {
    const syllableCount = range.min + Math.floor(rng() * (range.max - range.min + 1));
    let raw = '';

    for (let s = 0; s < syllableCount; s++) {
      const template = signature.syllableTemplates[
        Math.floor(rng() * signature.syllableTemplates.length)
      ];
      const syllable = buildSyllable(template, signature, rng);
      if (syllable === null) break;
      raw += syllable;
    }

    if (raw.length < 2) continue;
    if (!/[a-zA-Z]/.test(raw[0])) continue;

    // Optional suffix
    const useSuffix = mode === 'personal'
      ? rng() < 0.4
      : rng() < 0.7;
    if (useSuffix && suffixPool.length > 0) {
      const suffix = suffixPool[Math.floor(rng() * suffixPool.length)];
      if (suffix) raw += suffix.replace(/^-/, '');
    }

    const candidate = applyOrthography(raw, signature);
    if (candidate.length < 2) continue;

    // Constraint checks (THR-456)
    if (mode === 'personal') {
      let constraintReason: 'syllables' | 'consonants' | 'vowels' | null = null;
      if (countSyllables(candidate) > NAME_MAX_SYLLABLES) {
        constraintReason = 'syllables';
      } else if (hasConsonantClusterLongerThan(candidate, NAME_MAX_CONSONANT_CLUSTER)) {
        constraintReason = 'consonants';
      } else if (hasVowelRunLongerThan(candidate, NAME_MAX_VOWEL_RUN)) {
        constraintReason = 'vowels';
      }
      if (constraintReason !== null) {
        emitTrace({
          tick,
          category: 'naming.constrained_reject',
          summary: `Rejected "${candidate}" for ${cultureId}: ${constraintReason} (attempt ${attempt + 1})`,
          cultureId,
          rejectedCandidate: candidate,
          reason: constraintReason,
          attempt: attempt + 1,
        } as NamingConstrainedRejectTrace);
        continue;
      }
    }

    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      emitTrace({
        tick,
        category: 'phonetic_name_generated',
        summary: `Phonetic name "${candidate}" generated for ${cultureId} (${mode}, attempt ${attempt + 1})`,
        cultureId,
        mode,
        name: candidate,
        attemptsUsed: attempt + 1,
      } as PhoneticNameGeneratedTrace);
      return candidate;
    }
  }

  return null;
}
