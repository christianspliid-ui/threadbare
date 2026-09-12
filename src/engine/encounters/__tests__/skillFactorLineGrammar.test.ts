/**
 * The capability factor line is a sentence — for every reach, at every tier.
 *
 * THR-1494: `{actor} is {word} in {reach}` shipped **"Vara is oracle in eye."**
 * to the top of the scene screen, because the tier vocabulary mixes adjectives
 * ("formidable") with nouns ("oracle", "magnate", "masterwork") and a copula
 * template cannot be right for both word classes at once.
 *
 * The sweep is over the **live vocabulary**, not a fixture: a template broken
 * for `eye` is broken for all eight reaches, so a test that pins one string
 * would have passed the whole time the other seven were wrong.
 */

import { describe, it, expect } from 'vitest';
import { deriveSkillLine } from '../stepFactorLines';
import {
  DOMAIN_WORD_SCALES,
  DOMAIN_TIER_WORD_FORMS,
  getDomainTierWordForm,
} from '../../../data/domain-words';
import { REACH_DOMAINS, type ReachDomain } from '../../../types/traits';

/** The capability that lands in tier n — `getDomainTier` buckets 0–10 by twos. */
const CAPABILITY_FOR_TIER = [0.0, 0.2, 0.4, 0.6, 0.9] as const;

const ACTOR = 'Vara';

function everyTierWord(): { reach: ReachDomain; tier: number; word: string }[] {
  const rows: { reach: ReachDomain; tier: number; word: string }[] = [];
  for (const reach of REACH_DOMAINS) {
    const scale = DOMAIN_WORD_SCALES[reach];
    if (!scale) continue;
    scale.forEach((word, tier) => rows.push({ reach, tier, word }));
  }
  return rows;
}

describe('DOMAIN_TIER_WORD_FORMS covers the live vocabulary', () => {
  it('classifies every tier word explicitly — no word rides the fail-soft default', () => {
    const unclassified = everyTierWord()
      .filter(({ word }) => DOMAIN_TIER_WORD_FORMS[word.toLowerCase()] === undefined)
      .map(({ reach, tier, word }) => `${reach}[${tier}]=${word}`);

    // Read the map directly, never through `getDomainTierWordForm` — the helper
    // answers 'adjective' for an unknown word by design, so asking it here would
    // make this assertion incapable of failing.
    expect(unclassified).toEqual([]);
  });

  it('holds no orphan entries — a renamed word leaves no stale classification', () => {
    const live = new Set(everyTierWord().map(({ word }) => word.toLowerCase()));
    const orphans = Object.keys(DOMAIN_TIER_WORD_FORMS).filter((key) => !live.has(key));
    expect(orphans).toEqual([]);
  });

  it('actually contains noun forms — otherwise the sweep below proves nothing', () => {
    // The falsification guard (the controlled arm). If every live word were an
    // adjective the article branch would never execute, and every assertion in
    // the next block would pass against the defective template too.
    const nouns = everyTierWord().filter(
      ({ word }) => getDomainTierWordForm(word) !== 'adjective',
    );
    expect(nouns.length).toBeGreaterThan(0);
  });
});

describe('deriveSkillLine renders a grammatical sentence for every reach and tier', () => {
  it('gives every noun tier word its article, and every adjective none', () => {
    const broken: string[] = [];

    for (const { reach, tier, word } of everyTierWord()) {
      const line = deriveSkillLine({
        actorName: ACTOR,
        reach,
        capability: CAPABILITY_FOR_TIER[tier],
      });
      const form = getDomainTierWordForm(word);
      const lower = word.toLowerCase();
      const expected =
        form === 'adjective'
          ? `${ACTOR} is ${lower} in`
          : `${ACTOR} is ${form} ${lower} in`;

      if (!line.text.startsWith(expected)) broken.push(`${reach}[${tier}]: "${line.text}"`);
    }

    expect(broken).toEqual([]);
  });

  it('never emits the article-less noun construction the ticket found', () => {
    const nounWords = everyTierWord().filter(
      ({ word }) => getDomainTierWordForm(word) !== 'adjective',
    );

    for (const { reach, tier, word } of nounWords) {
      const { text } = deriveSkillLine({
        actorName: ACTOR,
        reach,
        capability: CAPABILITY_FOR_TIER[tier],
      });
      // The exact defective shape: "Vara is oracle in ...".
      expect(text).not.toContain(`is ${word.toLowerCase()} `);
    }
  });

  it('names the reach as a domain, not as a bare key', () => {
    for (const reach of REACH_DOMAINS) {
      const { text } = deriveSkillLine({ actorName: ACTOR, reach, capability: 0.5 });
      const label = reach.charAt(0).toUpperCase() + reach.slice(1);
      expect(text).toContain(` in ${label}.`);
      expect(text).not.toContain(` in ${reach}.`);
    }
  });

  it('ends every line as a sentence, whichever template it took', () => {
    for (const { reach, tier } of everyTierWord()) {
      const { text } = deriveSkillLine({
        actorName: ACTOR,
        reach,
        capability: CAPABILITY_FOR_TIER[tier],
      });
      expect(text.endsWith('.')).toBe(true);
      expect(text).not.toContain('{');
    }
  });

  it('falls back to a named hand rather than a blank subject (NFP #4)', () => {
    const { text } = deriveSkillLine({ actorName: undefined, reach: 'eye', capability: 0.9 });
    expect(text.startsWith('The acting hand is ')).toBe(true);
    expect(text).toContain(' in Eye.');
  });
});
