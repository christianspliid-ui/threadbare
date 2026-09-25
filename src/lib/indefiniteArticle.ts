/**
 * Indefinite-article agreement for generated prose (THR-1602).
 *
 * Word-pool substitution writes templates like `a {adj} recognition`, and the
 * pool does not know which article precedes its slot — so "a ancient
 * recognition" and "a economic scheme" reached the chronicle. These helpers
 * pick the article from the word that actually landed.
 *
 * Spelling-based, with the common exceptions where a vowel letter carries a
 * consonant sound ("a unique", "a one-eyed", "a European"). An `h` word keeps
 * "a": silent-h words ("an hour") are rare in the pools, and a template that
 * already wrote "an" is left alone — this pass only ever turns `a` into `an`.
 */

/** Vowel-lettered prefixes pronounced with a consonant sound — they keep "a". */
const CONSONANT_SOUND_PREFIXES = [
  'uni', 'use', 'usu', 'uti', 'ure', 'uro', 'ubiq', 'eu', 'ewe', 'one', 'once',
] as const;

/** True when `word` takes "an" rather than "a". */
export function takesAn(word: string): boolean {
  const w = word.toLowerCase();
  if (!/^[aeiou]/.test(w)) return false;
  return !CONSONANT_SOUND_PREFIXES.some((p) => w.startsWith(p));
}

/** `"economic scheme"` → `"an economic scheme"`; `"rumor"` → `"a rumor"`. */
export function withIndefiniteArticle(phrase: string): string {
  return `${takesAn(phrase) ? 'an' : 'a'} ${phrase}`;
}

/**
 * Repair every standalone `a`/`A` whose next word takes "an". Leaves "an",
 * mid-word letters, and consonant-sound words untouched. Idempotent.
 */
export function fixIndefiniteArticles(text: string): string {
  return text.replace(/\b([aA]) ([A-Za-z][\w'-]*)/g, (match, article: string, word: string) =>
    takesAn(word) ? `${article}n ${word}` : match,
  );
}
