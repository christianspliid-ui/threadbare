// src/data/bond-basis.ts

/**
 * Bond basis vocabulary — one word per kind of tie between two mortals (THR-1630).
 *
 * A `relates_to` edge carries a `basis` string. Writers and readers grew their words
 * separately: ambition templates ask for `lineage`, `heir`, `exile_kin`, `enemy`,
 * `spouse`; the one worldgen writer stamps `friendship` / `rivalry`; and until THR-1630
 * nothing wrote any word for family at all, so every kin-reading template was dead.
 *
 * The rule this file sets: a writer stamps a **canonical** word; a reader compares
 * through `bondBasisMatches`, which folds both sides through `BOND_BASIS_ALIASES`.
 * `kin` is canonical for family — it is the word `bondModifiers` already used, and
 * "lineage" reads as a descent line rather than a person. Data only; no logic beyond
 * the fold (plan § S1d).
 */

/**
 * Words a writer may stamp. The ones written today plus `kin`. A reader never needs
 * this list — it exists so a new writer can check its word is one somebody reads.
 */
export const CANONICAL_BOND_BASES: readonly string[] = [
  'kin',
  'friendship',
  'rivalry',
  'romantic',
  'mentorship',
  'trade',
  'loyalty',
  'alliance',
  'sworn_ally',
  'faith',
  'gratitude',
  'labor',
  'debt',
  'history',
  'acquaintance',
];

/**
 * Reader words that mean a canonical word. Folded on both sides of a comparison, so a
 * template asking for `lineage` matches a seeded `kin` edge and a writer that one day
 * stamps `spouse` matches a reader asking for `romantic`.
 */
export const BOND_BASIS_ALIASES: Readonly<Record<string, string>> = {
  lineage: 'kin',
  heir: 'kin',
  exile_kin: 'kin',
  kinship: 'kin',
  enemy: 'rivalry',
  mentor: 'mentorship',
  trade_partner: 'trade',
  spouse: 'romantic',
};

/**
 * The plain word the player reads for a basis (used by the sheet in THR-1655). A basis
 * with no entry renders as no word.
 */
export const BOND_BASIS_WORDS: Readonly<Record<string, string>> = {
  kin: 'kin',
  friendship: 'friend',
  rivalry: 'rival',
  romantic: 'beloved',
  mentorship: 'mentor',
  trade: 'trading partner',
  loyalty: 'loyal to',
  alliance: 'ally',
  sworn_ally: 'sworn ally',
  faith: 'fellow in faith',
  gratitude: 'owes thanks',
  labor: 'works with',
  debt: 'in debt',
  history: 'old acquaintance',
  acquaintance: 'acquaintance',
};

/** The canonical word for `basis` — itself when it has no alias. Non-strings fold to `''`. */
export function canonicalBondBasis(basis: unknown): string {
  if (typeof basis !== 'string') return '';
  return BOND_BASIS_ALIASES[basis] ?? basis;
}

const warnedWordless = new Set<string>();

/**
 * The word the sheet shows for a written basis (THR-1655), folded through the aliases —
 * `null` when the basis has no word. A wordless basis renders as no word and warns once
 * (Law 14: never show the key), so a new basis without a word is loud in dev, silent on screen.
 */
export function bondBasisWord(basis: unknown): string | null {
  const canonical = canonicalBondBasis(basis);
  if (canonical === '') return null;
  const word = BOND_BASIS_WORDS[canonical];
  if (word) return word;
  if (canonical !== 'unknown' && !warnedWordless.has(canonical)) {
    warnedWordless.add(canonical);
    console.warn(`[bond-basis] no display word for bond basis "${canonical}" — rendering none`);
  }
  return null;
}

/** Whether a written basis satisfies a wanted one, both folded through the aliases. */
export function bondBasisMatches(written: unknown, wanted: unknown): boolean {
  const w = canonicalBondBasis(written);
  return w !== '' && w === canonicalBondBasis(wanted);
}
