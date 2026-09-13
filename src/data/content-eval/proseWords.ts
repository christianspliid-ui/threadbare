/**
 * Word-level primitives shared by the prose checks. THR-1474.
 *
 * Three functions, lifted verbatim out of `doctrineV2Checks.ts` when
 * `aftermathPage.ts` needed the same run-splitter. They moved rather than being
 * copied for the reason that module's own header already gives about the
 * `aftermathFaces` walk: *a second walk over the same config is a second answer
 * waiting to drift from the first*. An n-gram overlap check is worth exactly as
 * much as the agreement between the two sides doing the splitting, so there is
 * one splitter.
 *
 * No imports and no domain types on purpose — this is the leaf of the
 * content-eval graph, which is what lets both `doctrineV2Checks` (chip ↔ its own
 * overview) and `aftermathPage` (every block ↔ every other block) depend on it
 * without either depending on the other.
 */

/** Strip punctuation and case so `"Steady,"` and `Steady` compare equal. */
export function normaliseWord(word: string): string {
  return word.replace(/[^\p{L}\p{N}'-]/gu, '').toLowerCase();
}

/** Whitespace-delimited words, empties dropped. Counts what a reader reads. */
export function wordsOf(text: string): string[] {
  return text.trim().split(/\s+/u).filter(Boolean);
}

/**
 * Normalised word runs of length `n`, for overlap tests.
 *
 * Punctuation and case are stripped through {@link normaliseWord} so *"twice.
 * They walk"* and *"twice — they walk"* are the same run, and enrichment tokens
 * are left intact as words: a `{cast:keeper}` shared between two blocks is a
 * genuine repetition of the same named person, which is precisely the retelling
 * this looks for.
 *
 * A run is an unordered membership test, so callers may intersect two sets in
 * either direction and get the same answer — which is why the page check can
 * compare every block against every other block without deciding which of a pair
 * is "the original".
 */
export function wordRuns(text: string, n: number): ReadonlySet<string> {
  const words = wordsOf(text).map(normaliseWord).filter(Boolean);
  const runs = new Set<string>();
  for (let i = 0; i + n <= words.length; i += 1) {
    runs.add(words.slice(i, i + n).join(' '));
  }
  return runs;
}
