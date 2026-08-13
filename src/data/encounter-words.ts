/**
 * Encounter word pools and the resolver for the *bare* word-pool placeholders —
 * `{adj}`, `{verb}` / `{verb}s`, `{noun}`, `{action}` — used across the encounter
 * corpus (THR-1036).
 *
 * ## Why this module exists
 *
 * 153 of 168 templates in `encounter-content.ts` are authored with these tokens.
 * A resolver for them was written (`resolveEncounterNarrative`) and never called by
 * anything, while the path that actually renders encounter prose — `enrichProse()` —
 * had never learned the tokens. So every one of those templates leaked raw `{adj}` /
 * `{verb}s` to the player, a Law 43 violation ("placeholders never leak").
 *
 * The pools and the substitution semantics live here, dependency-free, so the two
 * consumers share one implementation instead of one of them silently rotting:
 * `enrichProse()` (the live path) and `resolveEncounterNarrative()` (kept as a thin
 * delegate for its public export).
 *
 * ## Why the sphere vocabulary is NOT the pool to use
 *
 * `SPHERE_VOCABULARY` in `narrative-content.ts` also has `{adj}`/`{verb}` pools, and
 * `narrative.ts` resolves the same token names from it. It is the wrong source here,
 * because its verbs are **past tense** (`shattered`, `forged`, `struck`) while the
 * encounter corpus writes `{verb}s` and expects a base form to take the `-s`
 * ("{verb}s the court's attention"). Substituting sphere verbs would emit
 * "shattereds". The pools below are base-form by construction.
 */

/** Tone tiers for `{adj}`, selected from an encounter's threat rating. */
export type EncounterToneTier = 'early' | 'mid' | 'late';

/**
 * Tone adjectives per tier. Single source of truth — `ENCOUNTER_DIFFICULTY_TIERS`
 * in `encounter-content.ts` reads its `toneAdjectives` from here.
 */
export const ENCOUNTER_TONE_ADJECTIVES: Record<EncounterToneTier, string[]> = {
  early: ['uncertain', 'tentative', 'green', 'unsteady', 'fledgling'],
  mid: ['determined', 'tested', 'hardened', 'resolute', 'seasoned'],
  late: ['desperate', 'legendary', 'harrowed', 'transcendent', 'final'],
};

/** Verbs for encounter narratives (base form — 's' is appended for 3rd person). */
export const ENCOUNTER_VERB_POOL = [
  'stir', 'pulse', 'howl', 'surge', 'seethe', 'coil', 'groan',
  'tremble', 'shift', 'crack', 'burn', 'ring', 'echo', 'flash',
  'waver', 'flicker', 'twist', 'shatter', 'bloom', 'fade',
];

/** Action phrases for the `{action}` placeholder. */
export const ENCOUNTER_ACTION_POOL = [
  'practiced hands', 'iron will', 'careful deliberation',
  'raw instinct', 'patient skill', 'fierce focus',
  'quiet precision', 'desperate strength', 'steady rhythm',
];

/** Nouns for the `{noun}` placeholder. */
export const ENCOUNTER_NOUN_POOL = [
  'purpose', 'strength', 'resolve', 'shadow', 'faith',
  'devotion', 'silence', 'defiance', 'memory', 'ruin',
  'ambition', 'cunning', 'valor', 'wisdom', 'fury',
];

/** Tier used when a caller has no threat rating to hand. Neutral and grammatical. */
export const DEFAULT_ENCOUNTER_TONE_TIER: EncounterToneTier = 'mid';

/**
 * Map an encounter's `threatRating` onto a tone tier.
 * Unknown / absent ratings fall back to the neutral tier (NFP #4 — fail-soft).
 */
export function encounterToneTierForThreat(threatRating?: string): EncounterToneTier {
  if (threatRating === 'trivial' || threatRating === 'easy') return 'early';
  if (threatRating === 'hard' || threatRating === 'deadly') return 'late';
  return DEFAULT_ENCOUNTER_TONE_TIER;
}

/**
 * Deterministic hash from a string seed → non-negative number (NFP #3).
 * Same seed always picks the same words, so a re-render of an archived chapter
 * reads identically to the render the player first saw.
 */
export function hashWordSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Third-person singular of a base-form verb: `flash` → `flashes`, `stir` → `stirs`.
 *
 * The naive `verb + 's'` the original resolver used emits "flashs" and "echos". Sibilant
 * endings and consonant+`o` both take `-es`; `-y` after a consonant would take `-ies`,
 * but no pool verb ends in `-y` today and the rule is cheap to carry.
 */
export function thirdPersonSingular(verb: string): string {
  if (/(s|x|z|ch|sh|[^aeiou]o)$/.test(verb)) return `${verb}es`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`;
  return `${verb}s`;
}

/**
 * Resolve the bare word-pool tokens in a prose string.
 *
 * Each token family cycles its pool with an incrementing offset, so a sentence
 * carrying four `{adj}`s gets four *different* adjectives rather than the same word
 * four times — which is what a single-word substitution (the `narrative.ts` shape)
 * would produce on this corpus, and it reads as broken.
 *
 * `{verb}s` is matched before the bare `{verb}` so the authored `-s` is not left
 * stranded after the token it belongs to is consumed.
 *
 * **The two verb forms are different grammatical requests, and conflating them is a
 * defect the original resolver shipped.** It conjugated both to `verb + 's'`. Read the
 * corpus and the contract is unambiguous: `{verb}s` (394 sites) always has a singular
 * subject — "the court {verb}s the accusation" — while bare `{verb}` (144 sites) always
 * has a plural one — "the merchants {verb} in anger", "the recruits {verb} away",
 * "{They} {verb} a sentence". Conjugating the bare form produced "They trembles a
 * sentence". So: `{verb}s` → third-person singular, bare `{verb}` → base form.
 *
 * @param text   prose that may contain `{adj}` / `{verb}` / `{verb}s` / `{noun}` / `{action}`
 * @param seed   deterministic seed — a string is hashed, a number used as-is
 * @param tier   tone tier for `{adj}`; defaults to the neutral tier
 */
export function resolveWordPoolTokens(
  text: string,
  seed: number | string,
  tier: EncounterToneTier = DEFAULT_ENCOUNTER_TONE_TIER,
): string {
  // Cheap exit: the large majority of enrichment calls carry none of these tokens.
  if (!/\{adj\}|\{verb\}|\{noun\}|\{action\}/.test(text)) return text;

  const base = typeof seed === 'number' ? Math.abs(seed) : hashWordSeed(seed);
  const adjPool = ENCOUNTER_TONE_ADJECTIVES[tier] ?? ENCOUNTER_TONE_ADJECTIVES[DEFAULT_ENCOUNTER_TONE_TIER];

  let result = text;

  // `{verb}s` first (before the bare `{verb}`) — singular subject, so conjugate.
  let verbIdx = base;
  result = result.replace(/\{verb\}s/g, () => {
    const verb = ENCOUNTER_VERB_POOL[verbIdx % ENCOUNTER_VERB_POOL.length];
    verbIdx++;
    return thirdPersonSingular(verb);
  });
  // Bare `{verb}` — plural subject, so the base form stands.
  result = result.replace(/\{verb\}/g, () => {
    const verb = ENCOUNTER_VERB_POOL[verbIdx % ENCOUNTER_VERB_POOL.length];
    verbIdx++;
    return verb;
  });

  let adjIdx = base;
  result = result.replace(/\{adj\}/g, () => {
    const adj = adjPool[adjIdx % adjPool.length];
    adjIdx++;
    return adj;
  });

  result = result.replace(/\{action\}/g, () => ENCOUNTER_ACTION_POOL[base % ENCOUNTER_ACTION_POOL.length]);

  let nounIdx = base;
  result = result.replace(/\{noun\}/g, () => {
    const noun = ENCOUNTER_NOUN_POOL[nounIdx % ENCOUNTER_NOUN_POOL.length];
    nounIdx++;
    return noun;
  });

  return result;
}
