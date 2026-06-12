/**
 * Content lint: no prose template starts a new sentence directly with a
 * lowercase-substituted placeholder ({noun}, {adj}, {verb}).
 *
 * Pattern:  /\.\s+\{(noun|adj|verb)\}/
 *
 * When `{noun}` starts a sentence the resolved text is `grief made visible.`
 * (lowercase), which is the bug fixed by THR-456.  Placeholders {actor} and
 * {target} resolve to proper names (capitalised) so they are exempt.
 */
import { describe, it, expect } from 'vitest';
import { DILEMMA_STAKES_PROSE } from '../../data/narrative-content';

const LOWERCASE_SENTENCE_START = /\.\s+\{(noun|adj|verb)\}/;

describe('narrative content casing lint', () => {
  it('no DILEMMA_STAKES_PROSE template starts a sentence with a lowercase placeholder', () => {
    const violations: string[] = [];
    for (const [key, entries] of Object.entries(DILEMMA_STAKES_PROSE)) {
      for (const entry of entries) {
        if (LOWERCASE_SENTENCE_START.test(entry.text)) {
          violations.push(`${key} / ${entry.phraseId}: "${entry.text}"`);
        }
      }
    }
    expect(violations, `Casing violations:\n${violations.join('\n')}`).toHaveLength(0);
  });
});
