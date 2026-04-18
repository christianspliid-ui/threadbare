/**
 * Phoneme master lists for the culture phonetic signature generator.
 * Each culture samples from these to build a per-culture phoneme inventory.
 *
 * Foundation sets vowel coloring; sphere sets consonant coloring.
 * Small inventories (~9 items) are intentional — cultures sample 3–8 items
 * so pools produce distinctly different subsets across cultures.
 */

import type { SyllableTemplate, PhoneticOrthography } from '../types/culture';

// ─── Vowel Inventories (biased by foundation) ──────────────────

export const VOWEL_MASTER_LIST_BY_FOUNDATION: Record<string, string[]> = {
  chaos:    ['a', 'e', 'i', 'o', 'u', 'y', 'ae', 'ei', 'ou'],
  order:    ['a', 'e', 'i', 'o', 'u'],
  light:    ['a', 'e', 'i', 'o', 'u', 'ai', 'ea', 'ia'],
  darkness: ['a', 'e', 'i', 'o', 'u', 'y', 'ae', 'oe'],
};

// ─── Consonant Inventories (biased by primary sphere) ───────────

export const CONSONANT_MASTER_LIST_BY_SPHERE: Record<string, string[]> = {
  force:   ['k', 'r', 'g', 't', 'd', 'n', 'gr', 'kr', 'th'],
  matter:  ['b', 'd', 'g', 'm', 'n', 'r', 'dr', 'br', 'nd'],
  energy:  ['v', 'z', 's', 'l', 't', 'sh', 'zr', 'vl'],
  life:    ['l', 'n', 'm', 'w', 'r', 'y', 'ly', 'ln'],
  mind:    ['s', 'th', 'f', 'l', 'n', 'r', 'sc', 'pr'],
  spirit:  ['s', 'h', 'l', 'm', 'n', 'w', 'sh', 'wh'],
  time:    ['s', 'v', 'r', 'n', 'd', 'l', 'ss', 'nd'],
  entropy: ['k', 'r', 'sh', 'sk', 'x', 't', 'rr', 'kh'],
};

/** Foundation-biased extra consonants mixed into the onset pool */
export const FOUNDATION_CONSONANT_BIAS: Record<string, string[]> = {
  chaos:    ['x', 'z', 'q', 'kk'],
  order:    ['l', 'n', 'r', 's'],
  light:    ['l', 'm', 's', 'r'],
  darkness: ['r', 'g', 'v', 'gh'],
};

// ─── Morphological Suffix Tables ────────────────────────────────

export const NAME_SUFFIXES_BY_FOUNDATION: Record<string, string[]> = {
  chaos:    ['-a', '-ix', '-ux', '-yr', ''],
  order:    ['-us', '-an', '-or', '-eth', ''],
  light:    ['-iel', '-ion', '-ea', '-ia', ''],
  darkness: ['-ir', '-or', '-al', '-en', ''],
};

export const SETTLEMENT_SUFFIXES_BY_FOUNDATION_PHONETIC: Record<string, string[]> = {
  chaos:    ['-rak', '-vel', '-wik', '-tor'],
  order:    ['-heim', '-stad', '-gar', '-holm'],
  light:    ['-loren', '-ae', '-mira', '-sol'],
  darkness: ['-morn', '-vale', '-hollow', '-shir'],
};

// ─── Syllable Template Weights (by foundation) ──────────────────

export const SYLLABLE_TEMPLATE_BIAS_BY_FOUNDATION: Record<string, SyllableTemplate[]> = {
  chaos:    ['VC', 'CVVC', 'CV', 'CVV'],
  order:    ['CVC', 'CVC', 'CV', 'VC'],
  light:    ['CV', 'CVV', 'CV', 'CVC'],
  darkness: ['CVC', 'VC', 'CVVC', 'CVC'],
};

// ─── Orthography Weights (by foundation) ────────────────────────

/** Ordered list of orthography styles with per-foundation bias weights */
export const ORTHOGRAPHY_OPTIONS: PhoneticOrthography[] = ['title', 'compound', 'apostrophe'];

export const ORTHOGRAPHY_WEIGHTS_BY_FOUNDATION: Record<string, number[]> = {
  chaos:    [0.4, 0.4, 0.2],
  order:    [0.7, 0.25, 0.05],
  light:    [0.5, 0.4, 0.1],
  darkness: [0.45, 0.45, 0.1],
};
