/**
 * The vagueness lexicons' structure, pinned — THR-899 (executing THR-877).
 *
 * The repo used to carry two hand-written vagueness lists that disagreed:
 * `VAGUENESS_LEXICON` (10 terms, read only by the golden-exemplar assertions)
 * and `AUDIT_VAGUENESS_TERMS` (~35 terms, read by `countVagueness()` — the
 * number authors quote as evidence). They overlapped on four words, the spec doc
 * documented the one the audit did not use, and THR-868 lost a full rewrite
 * cycle cleaning the wrong list.
 *
 * THR-877 asked for the relationship to be "asserted by a test rather than
 * described in prose". This is that test. The stronger half of the fix is
 * structural — `VAGUENESS_LEXICON` is now *derived* from the audit module rather
 * than typed out a second time, so the two cannot drift without someone deleting
 * the derivation. These assertions pin the invariants that survive that: the
 * partition is disjoint and total, and each scope enforces what it claims to.
 */
import { describe, expect, it } from 'vitest';
import {
  ALL_VAGUENESS_TERMS,
  EVASIVE_VAGUENESS_TERMS,
  NATURAL_INDEFINITE_TERMS,
  VAGUE_INTENSIFIERS,
  countIntensifiers,
  countVagueness,
  vaguenessTermsFor,
  type ProseFieldClass,
} from '../content-eval/nudgeAuditDetectors';
import { VAGUENESS_LEXICON } from '../content-eval/nudgeAuthoringConstants';

const ALL_CLASSES: readonly ProseFieldClass[] = ['outcome', 'scene', 'interactive'];

describe('the two lexicons are one lexicon', () => {
  it('derives VAGUENESS_LEXICON from the audit module rather than duplicating it', () => {
    // The identity THR-877 asked to be asserted. If someone reintroduces a
    // hand-written array in `nudgeAuthoringConstants.ts`, this fails.
    expect(VAGUENESS_LEXICON).toEqual(vaguenessTermsFor('outcome'));
  });

  it('still covers every term the historical authoring lexicon carried', () => {
    // The pre-THR-899 hand-written list, inlined. None of these may be lost in
    // the rescope — a "split by intent" that quietly drops terms is a deletion
    // wearing a refactor's clothes.
    const historical = [
      'something', 'anything', 'nothing', 'thing', 'things',
      'way', 'ways', 'somehow', 'whatever', 'somewhere',
    ];
    for (const term of historical) {
      expect(ALL_VAGUENESS_TERMS, `historical term "${term}" was dropped`).toContain(term);
    }
  });

  it('still covers every term the historical audit lexicon carried', () => {
    // Same guarantee from the other side. `stuff` and the intensifiers were only
    // ever on the audit list; the intensifiers are demoted to warn, not removed.
    const historical = [
      'somehow', 'somewhat', 'seems to', 'appears to', 'a kind of', 'a sort of',
      'something like', 'in some way',
      'something', 'someone', 'somewhere', 'things', 'stuff',
      'the situation', 'the matter', 'the moment', 'the atmosphere', 'the tension',
      'the dynamic', 'the connection', 'the understanding', 'the balance',
      'the energy', 'the presence', 'the experience', 'the process',
      'very', 'really', 'quite', 'rather', 'truly', 'deeply', 'profoundly', 'utterly',
    ];
    for (const term of historical) {
      expect(ALL_VAGUENESS_TERMS, `historical term "${term}" was dropped`).toContain(term);
    }
  });
});

describe('the partition is disjoint and total', () => {
  it('assigns every term to exactly one set', () => {
    // A term in two sets would be enforced twice and counted twice, inflating the
    // density that WS5 batches quote as evidence.
    const seen = new Map<string, string[]>();
    const record = (terms: readonly string[], set: string): void => {
      for (const t of terms) seen.set(t, [...(seen.get(t) ?? []), set]);
    };
    record(EVASIVE_VAGUENESS_TERMS, 'evasive');
    record(NATURAL_INDEFINITE_TERMS, 'indefinite');
    record(VAGUE_INTENSIFIERS, 'intensifier');

    const duplicated = [...seen.entries()]
      .filter(([, sets]) => sets.length > 1)
      .map(([term, sets]) => `${term}: ${sets.join(' + ')}`);
    expect(duplicated, `terms in more than one set:\n${duplicated.join('\n')}`).toEqual([]);
  });

  it('carries no duplicates inside any one set', () => {
    for (const [name, terms] of [
      ['evasive', EVASIVE_VAGUENESS_TERMS],
      ['indefinite', NATURAL_INDEFINITE_TERMS],
      ['intensifier', VAGUE_INTENSIFIERS],
    ] as const) {
      expect(new Set(terms).size, `${name} carries a duplicate`).toBe(terms.length);
    }
  });

  it('covers the union exactly', () => {
    expect([...ALL_VAGUENESS_TERMS].sort()).toEqual(
      [...EVASIVE_VAGUENESS_TERMS, ...NATURAL_INDEFINITE_TERMS, ...VAGUE_INTENSIFIERS].sort(),
    );
  });
});

describe('each scope enforces what it claims', () => {
  it('enforces evasive terms in every field class', () => {
    for (const term of EVASIVE_VAGUENESS_TERMS) {
      for (const cls of ALL_CLASSES) {
        expect(
          countVagueness(`The room held ${term} of it.`, cls),
          `"${term}" is not enforced in ${cls} scope`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('enforces natural indefinites in outcome scope only', () => {
    for (const term of NATURAL_INDEFINITE_TERMS) {
      expect(
        countVagueness(`The room held ${term} of it.`, 'outcome'),
        `"${term}" is not enforced in outcome scope`,
      ).toBeGreaterThan(0);
      for (const cls of ['scene', 'interactive'] as const) {
        expect(
          countVagueness(`The room held ${term} of it.`, cls),
          `"${term}" is wrongly enforced in ${cls} scope — this is the contortion THR-899 removed`,
        ).toBe(0);
      }
    }
  });

  it('never counts an intensifier as vagueness, in any scope', () => {
    for (const term of VAGUE_INTENSIFIERS) {
      for (const cls of ALL_CLASSES) {
        expect(
          countVagueness(`She was ${term} certain of it.`, cls),
          `"${term}" still counts as vagueness in ${cls} scope`,
        ).toBe(0);
      }
      expect(
        countIntensifiers(`She was ${term} certain of it.`),
        `"${term}" is no longer reported as an intensifier`,
      ).toBeGreaterThan(0);
    }
  });

  it('defaults to the strictest scope when a caller does not say', () => {
    // A caller that has not thought about which slot its text came from must get
    // the conservative answer, never a silent loosening.
    expect(countVagueness('They left with nothing.')).toBe(
      countVagueness('They left with nothing.', 'outcome'),
    );
    expect(countVagueness('They left with nothing.')).toBeGreaterThan(0);
  });

  it('matches on word boundaries, not substrings', () => {
    // `someone` must not fire inside `somersault`; `way` must not fire inside
    // `wayfarer`. Without this the rescope would read clean for the wrong reason.
    expect(countVagueness('He turned a somersault by the waypost.', 'outcome')).toBe(0);
    // …but a possessive is still the word.
    expect(countVagueness("It was someone's coin.", 'outcome')).toBeGreaterThan(0);
  });
});

describe('the THR-899 acceptance sentences', () => {
  it('passes the reference scene sentence that the flat list used to fail', () => {
    expect(
      countVagueness('someone is asking around after the agent, and not in a good way', 'scene'),
    ).toBe(0);
  });

  it('fails the reference outcome sentence in every scope', () => {
    // "it cost them something" is rule zero's canonical prey: a sentence's shape
    // with the result removed. `something` is evasive, so no scope excuses it.
    for (const cls of ALL_CLASSES) {
      expect(countVagueness('it cost them something', cls), cls).toBeGreaterThan(0);
    }
  });
});
