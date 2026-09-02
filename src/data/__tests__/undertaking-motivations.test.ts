/**
 * The undertaking corpus states an axiological opinion — THR-1377.
 *
 * THR-1349 measured that 35 of 64 shipped undertaking templates authored no
 * `motivations` at all, and that `computeDesireScore([])` returns exactly `0`,
 * which the shared floor mapped to `MINIMUM_DESIRE ** PERSONALITY_SCORE_EXPONENT`
 * — silence scored as active revulsion, across 55% of the corpus. That shipped
 * an engine-side mitigation (`UNDERTAKING_NEUTRAL_DESIRE`); this file pins the
 * content fix, so the gap cannot silently reopen.
 *
 * **Why a test and not a census gate.** The census measures *selection outcomes*,
 * which move with seed and world state; the thing being defended here is a corpus
 * property that holds independently of any run. A silent template reintroduced
 * next month would not fail the census — it would simply contribute nothing,
 * invisibly, which is the failure mode this whole ticket exists to close.
 *
 * **The guard is falsified, not assumed.** `findMotivationDefects` is run over
 * adversarial fixtures — one per way a set can lie — before it is run over the
 * live corpus, because a predicate that has never rejected anything is not
 * evidence that the corpus is clean. The population floor exists for the mirror
 * reason: a sweep over an empty corpus passes every assertion in this file.
 */
import { describe, it, expect } from 'vitest';
import type { ValuePair } from '../../types/agent';
import { getAllStrategicTemplates } from '../../engine/strategicActionCandidates';
import { findMotivationDefects } from '../content-eval/undertakingContract';

/**
 * The convention `ENCOUNTER_TYPE_MOTIVATIONS` sets and this corpus follows: at
 * least two distinct members of `VALUE_PAIRS`.
 *
 * Arity is a floor rather than an equality because five templates were authored
 * at 3 before this pass and are not defects — `computeDesireScore` averages over
 * the set, so a third pair narrows the read rather than breaking it.
 */
/**
 * Non-vacuity floor for the corpus sweep. Not an identity pin — new packs may
 * raise it. It exists so that a sweep over an accidentally-empty
 * `getAllStrategicTemplates()` fails loudly instead of passing silently.
 */
const CORPUS_FLOOR = 64;

// `findMotivationDefects` was lifted out of this file into the Undertaking Contract
// (`content-eval/undertakingContract.ts`, THR-1300 slice 1) so the gate and this
// pin share one rule; the arity floor it enforces is `UNDERTAKING_MOTIVATION_MIN_ARITY`.

/**
 * A near-miss spelling, assembled at runtime rather than written as a literal.
 *
 * `valuePairVocabulary.lint.test.ts` scans the source text of `src/data` and
 * `src/engine` for `motivations: [ …quoted tokens… ]` and fails on any token
 * outside `VALUE_PAIRS` — correctly, since such a token scores `0` forever and
 * silently. A literal bad token here would trip that lint, so the fixture is
 * composed instead: the resulting array is not a pure-token literal, the lint
 * skips it by its own documented body guard, and neither test is weakened.
 * **Do not inline this back into a quoted array.**
 */
const NOT_A_PAIR = `${'loyalty_ambition'}s` as ValuePair;

describe('undertaking motivations — the guard itself', () => {
  const good = { id: 'tpl_good', motivations: ['mercy_ruthlessness', 'loyalty_ambition'] as ValuePair[] };

  it('accepts a well-formed set', () => {
    expect(findMotivationDefects([good])).toEqual([]);
  });

  it('rejects each way a set can lie — one fixture per problem', () => {
    // Each fixture differs from `good` in exactly one respect, so a pass here is
    // attributable to the clause it targets rather than to the fixture generally.
    const cases: [Record<string, unknown>, string][] = [
      [{ id: 'tpl_absent' }, 'silent'],
      [{ id: 'tpl_empty', motivations: [] }, 'silent'],
      [{ id: 'tpl_thin', motivations: ['mercy_ruthlessness'] }, 'arity 1 < 2'],
      [
        { id: 'tpl_dup', motivations: ['mercy_ruthlessness', 'mercy_ruthlessness'] },
        'duplicate pair',
      ],
      [
        { id: 'tpl_typo', motivations: ['mercy_ruthlessness', NOT_A_PAIR] },
        `not a ValuePair: ${NOT_A_PAIR}`,
      ],
    ];
    for (const [fixture, problem] of cases) {
      const defects = findMotivationDefects([
        fixture as { id: string; motivations?: readonly ValuePair[] },
      ]);
      expect(defects, `fixture ${String(fixture.id)} should be rejected`).toContainEqual({
        id: fixture.id,
        problem,
      });
    }
  });
});

describe('undertaking motivations — the shipped corpus', () => {
  const templates = getAllStrategicTemplates();

  it('sweeps a real population, not an empty one', () => {
    // Without this the four assertions below are all vacuously true.
    expect(templates.length).toBeGreaterThanOrEqual(CORPUS_FLOOR);
  });

  it('no shipped undertaking template is axiologically silent (THR-1377)', () => {
    const silent = templates.filter(t => (t.motivations ?? []).length === 0).map(t => t.id);
    expect(silent).toEqual([]);
  });

  it('every shipped template passes the full convention', () => {
    expect(findMotivationDefects(templates)).toEqual([]);
  });

  it('the desire term can actually discriminate across the corpus', () => {
    // Coverage is not the point on its own — the point is that the term does
    // *work*. If every template named the same pair, the corpus would be fully
    // authored and the desire term would still rank nothing.
    const distinct = new Set(templates.flatMap(t => t.motivations ?? []));
    expect(distinct.size).toBeGreaterThan(1);
  });
});
