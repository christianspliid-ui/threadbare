/**
 * Surface realizer for foreshadowing prose (THR-631, Phase A).
 *
 * Clause templates use *typed slots* so the two failure modes of the pre-THR-631
 * foreshadowing prose become impossible by construction:
 *
 *   1. Category error — the old generic fallback jammed an encounter *title* into
 *      a *place* slot ("trouble in Weave a Political Alliance"). A `{place}` slot
 *      only ever receives a location name and the composer never routes a title
 *      into it, so the category error cannot recur.
 *   2. Agreement bug — the old fallback wrote "{They} believes" / "{He} believe".
 *      Verb slots `{v:lemma}` are conjugated to the subject's grammatical number,
 *      so agreement holds for he/she/they across every clause.
 *
 * Slots:
 *   {name} {place} {matter} {person} {faction} {subject} {Subject}  — filled from `slots`
 *   {Matter}                                                       — sentence-initial matter
 *   {object} {Object}                                              — object-case pronoun
 *   {v:lemma}                                                       — conjugated verb
 *
 * Object pronouns ({object}/{Object} — them/him/her) carry a case axis, not a
 * number axis: a clause that places a pronoun in object position ("moves {object}
 * closer") must use these slots, never the subject slots, or it renders "moves
 * they closer" (THR-640). `objectPronoun` maps the subject form to its object case.
 *
 * Capitalized variants are separate keys, not a transform: `NOUN_SLOT` looks the
 * key up case-sensitively, so `{Matter}` resolves only because the composers bind
 * it alongside `matter`. Six clauses opened on `{Matter}` for months while nothing
 * bound it, and each rendered headless — "hums at a pitch they answer to" — because
 * a missing slot fails soft to `''` (THR-1360). `foreshadowingSlotCoverage.test.ts`
 * now fails on any clause whose slots are not all bound.
 *
 * Fail-soft: an unknown verb lemma is emitted unconjugated, and a missing noun
 * slot collapses to empty rather than throwing (NFP #4). The realizer never
 * throws — a resolver that composes prose must never crash the caller.
 */

export type GrammaticalNumber = 'singular' | 'plural';

/**
 * Map a subject pronoun to the grammatical number used for verb agreement.
 * `they` (singular-they or plural) takes plural verb forms ("they believe");
 * `he`/`she`/`it` take singular ("she believes").
 */
export function pronounNumber(subject: string): GrammaticalNumber {
  return subject.trim().toLowerCase() === 'they' ? 'plural' : 'singular';
}

/**
 * Map a subject pronoun to its object-case form, for `{object}` / `{Object}`
 * slots: they→them, he→him, she→her, it→it. Unknown input falls back to `them`
 * (matching the `they` default used everywhere else — fail-soft, never throws).
 */
export function objectPronoun(subject: string): string {
  switch (subject.trim().toLowerCase()) {
    case 'he': return 'him';
    case 'she': return 'her';
    case 'it': return 'it';
    case 'they':
    default: return 'them';
  }
}

/** Irregular present-tense verbs: lemma → [3rd-person singular, plural/base]. */
const IRREGULAR_VERBS: Record<string, readonly [string, string]> = {
  be: ['is', 'are'],
  have: ['has', 'have'],
  do: ['does', 'do'],
  go: ['goes', 'go'],
};

/**
 * Conjugate a present-tense verb lemma to the subject's grammatical number.
 * Regular rule: plural = base form; singular adds `-s` (`-es` after a sibilant
 * or `o`, `-ies` after consonant + `y`). Unknown irregulars fall through the
 * regular rule — always grammatical for the common foreshadowing verbs.
 */
export function conjugate(lemma: string, number: GrammaticalNumber): string {
  const irregular = IRREGULAR_VERBS[lemma.toLowerCase()];
  if (irregular) return number === 'singular' ? irregular[0] : irregular[1];
  if (number === 'plural') return lemma;
  if (/(s|x|z|ch|sh|o)$/.test(lemma)) return `${lemma}es`;
  if (/[^aeiou]y$/.test(lemma)) return `${lemma.slice(0, -1)}ies`;
  return `${lemma}s`;
}

export interface RealizeContext {
  /** Subject's grammatical number, driving every `{v:lemma}` in the template. */
  number: GrammaticalNumber;
  /** Typed noun-phrase slot values. Missing keys collapse to empty (fail-soft). */
  slots: Readonly<Record<string, string | undefined>>;
}

const VERB_SLOT = /\{v:([a-zA-Z]+)\}/g;
const NOUN_SLOT = /\{([A-Za-z]+)\}/g;

/**
 * Realize a clause template: conjugate `{v:lemma}` verbs, then fill typed noun
 * slots. Whitespace and stray spaces before punctuation left by an empty slot
 * are collapsed so a missing optional slot never leaves a visible gap.
 */
export function realize(template: string, ctx: RealizeContext): string {
  const withVerbs = template.replace(VERB_SLOT, (_match, lemma: string) =>
    conjugate(lemma, ctx.number),
  );
  const filled = withVerbs.replace(NOUN_SLOT, (_match, key: string) => ctx.slots[key] ?? '');
  return filled
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}
