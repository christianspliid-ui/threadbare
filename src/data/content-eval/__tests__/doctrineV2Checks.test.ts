/**
 * Prose Doctrine v2 structural checks. THR-1224.
 *
 * Every rule is tested in **both directions** — a case that trips it and a case
 * that does not. A one-sided test on a detector proves only that the function
 * returns strings; it cannot tell a working rule from one that flags everything,
 * and "flags everything" is indistinguishable from "flags nothing" once a reader
 * learns to skim the channel.
 */

import { describe, expect, it } from 'vitest';

import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  FRAGMENT_NAME_OPENERS,
  IMPERATIVE_VERB_LEXICON,
  cardNameShapeProblem,
  cardNameShapeProblems,
  doctrineV2Warnings,
  openingParagraphs,
  openingSkeletonProblems,
  templateOpeningProblems,
} from '../doctrineV2Checks';
import {
  NUDGE_OPENING_PARAGRAPHS_MAX,
  NUDGE_OPENING_PARAGRAPHS_MIN,
  NUDGE_WORD_BUDGETS,
} from '../nudgeAuthoringConstants';

// ─── The doctrine's own worked examples ──────────────────────────────

/**
 * The calibration exemplar from § *Calibration exemplar*, verbatim in shape.
 *
 * Using the director's own rewrite as the passing fixture is deliberate: a
 * check that fails the text the doctrine holds up as *correct* is measuring
 * something other than the doctrine.
 */
const EXEMPLAR_OPENING = [
  '{cast:agent} arrives at the fortress of {location} at the break of dawn.',
  'There they find the garrison in disarray. A magic relic has been found below the '
    + 'west guard tower. Its freezing aura has already sent three guards to the infirmary.',
  'No one dares approach it now. Guard Captain {cast:captain} is at his wits\' end and '
    + 'asks for help.',
].join('\n\n');

/** The "Wrong" half of the same section — the shipped, in-situ, one-paragraph shape. */
const IN_SITU_OPENING =
  'The fort\'s yard is swept and the gate is manned. This corner is used by nobody. '
  + 'Someone chalked a line across the flags and nothing crosses it.';

// ─── Card-name shape ─────────────────────────────────────────────────

describe('cardNameShapeProblem', () => {
  it('passes an imperative verb + noun name', () => {
    expect(cardNameShapeProblem('Widen The Swing')).toBeUndefined();
    expect(cardNameShapeProblem('Cut The Thread')).toBeUndefined();
    expect(cardNameShapeProblem('Push Early')).toBeUndefined();
  });

  it('flags the fragment names the doctrine names as wrong', () => {
    // "Inspire Courage", never "A Little More" — the spec's own example pair.
    expect(cardNameShapeProblem('A Little More')).toMatch(/fragment\/mood name/u);
    expect(cardNameShapeProblem('The Easier Way')).toMatch(/fragment\/mood name/u);
    expect(cardNameShapeProblem('Nothing More Lost')).toMatch(/fragment\/mood name/u);
    expect(cardNameShapeProblem('In Full View')).toMatch(/fragment\/mood name/u);
  });

  it('flags a participle opener as unrecognised rather than as a fragment', () => {
    // 'Seen', 'Left' and 'Made' are participles no suffix rule separates from
    // 'Listen', 'Lift' and 'Mark'. They are not function words, so they get the
    // softer message — which is also the one that tells a reader how to fix a
    // false positive.
    const problem = cardNameShapeProblem('Seen Plainly');
    expect(problem).toMatch(/not a recognised imperative verb/u);
    expect(problem).toMatch(/IMPERATIVE_VERB_LEXICON/u);
  });

  it('reports over-budget length only once the opener is a known verb', () => {
    const overBudget = `Press ${'The Odds Again Once More'}`;
    expect(overBudget.split(/\s+/u).length).toBeGreaterThan(NUDGE_WORD_BUDGETS.name);
    expect(cardNameShapeProblem(overBudget)).toMatch(/over the doctrine budget/u);
  });

  it('flags an empty name', () => {
    expect(cardNameShapeProblem('   ')).toBe('name is empty');
  });

  it('ignores case and trailing punctuation on the opener', () => {
    expect(cardNameShapeProblem('press the odds')).toBeUndefined();
    expect(cardNameShapeProblem('Press, The Odds')).toBeUndefined();
  });

  it('keeps the two opener lists disjoint', () => {
    // A word in both lists would make the message depend on check order rather
    // than on the word, and the two messages tell an author different things.
    const both = IMPERATIVE_VERB_LEXICON.filter(verb => FRAGMENT_NAME_OPENERS.includes(verb));
    expect(both).toEqual([]);
  });

  it('is total — every name is either clean or reported, never silently skipped', () => {
    // The property that makes this a gate rather than a sample. A name whose
    // opener is an adjective ("Full Weight") is caught by the unrecognised-verb
    // arm, not missed: the check has no third outcome.
    for (const name of ['Full Weight', 'Courage Rising', 'Ashes', 'Left Behind']) {
      expect(cardNameShapeProblem(name), `${name} slipped through`).toBeDefined();
    }
  });
});

describe('cardNameShapeProblems', () => {
  it('names the offending card by id, and stays silent on a clean hand', () => {
    const dirty = {
      id: 'encounter.test.dirty',
      steps: [{ nudges: [{ id: 'test.a_little_more', name: 'A Little More' }] }],
    } as unknown as UnifiedActionTemplate;
    expect(cardNameShapeProblems(dirty)).toHaveLength(1);
    expect(cardNameShapeProblems(dirty)[0]).toMatch(/^test\.a_little_more: /u);

    const clean = {
      id: 'encounter.test.clean',
      steps: [{ nudges: [{ id: 'test.widen', name: 'Widen The Swing' }] }],
    } as unknown as UnifiedActionTemplate;
    expect(cardNameShapeProblems(clean)).toEqual([]);
  });

  it('returns nothing for a template with no steps or no hands', () => {
    // Fail-soft, and deliberately NOT a violation: "this template authors no
    // cards" is `checkNudgeHand`'s judgment to make, at error level. A warn
    // channel restating it would double-report every hand-less template.
    expect(cardNameShapeProblems({ id: 'x' } as unknown as UnifiedActionTemplate)).toEqual([]);
    expect(
      cardNameShapeProblems({ id: 'x', steps: [{}] } as unknown as UnifiedActionTemplate),
    ).toEqual([]);
  });
});

// ─── The opening skeleton ────────────────────────────────────────────

describe('openingParagraphs', () => {
  it('splits on blank lines and drops empties', () => {
    expect(openingParagraphs('one\n\ntwo\n\n\n  \n\nthree')).toEqual(['one', 'two', 'three']);
  });

  it('treats a single wrapped paragraph as one paragraph', () => {
    // The v1 corpus shape: authored as concatenated source lines, which produce
    // one runtime string with no `\n\n` in it.
    expect(openingParagraphs('a long line that\nwrapped in source')).toHaveLength(1);
  });
});

describe('openingSkeletonProblems', () => {
  it("passes the doctrine's calibration exemplar", () => {
    expect(openingSkeletonProblems(EXEMPLAR_OPENING)).toEqual([]);
  });

  it('flags the shipped in-situ opening on both counts it fails', () => {
    const problems = openingSkeletonProblems(IN_SITU_OPENING);
    expect(problems.some(p => /1 paragraph, outside the skeleton/u.test(p))).toBe(true);
    expect(problems.some(p => /P1 names no place/u.test(p))).toBe(true);
  });

  it('accepts the whole admitted paragraph range and rejects just outside it', () => {
    const para = (n: number) => `{location} paragraph ${n}.`;
    for (let n = NUDGE_OPENING_PARAGRAPHS_MIN; n <= NUDGE_OPENING_PARAGRAPHS_MAX; n++) {
      const text = Array.from({ length: n }, (_, i) => para(i)).join('\n\n');
      expect(openingSkeletonProblems(text), `${n} paragraphs`).toEqual([]);
    }
    const tooMany = Array.from(
      { length: NUDGE_OPENING_PARAGRAPHS_MAX + 1 },
      (_, i) => para(i),
    ).join('\n\n');
    expect(openingSkeletonProblems(tooMany).some(p => /outside the skeleton/u.test(p))).toBe(true);
  });

  it('counts words across all paragraphs, not per paragraph', () => {
    // The budget row says "all three paragraphs together". Three paragraphs each
    // comfortably short can still blow it, and that is the case worth pinning —
    // a per-paragraph reading would call this clean.
    const filler = 'word '.repeat(NUDGE_WORD_BUDGETS.opening).trim();
    const text = `{location} arrives.\n\n${filler}\n\nThe problem stands.`;
    expect(openingSkeletonProblems(text).some(p => /over the budget/u.test(p))).toBe(true);

    const withinBudget = '{location} arrives.\n\nThings went wrong.\n\nThe problem stands.';
    expect(openingSkeletonProblems(withinBudget)).toEqual([]);
  });

  it('accepts any sanctioned place surface in P1, and only in P1', () => {
    for (const token of ['{location}', '{cast:warden}', '{frag:opening}']) {
      expect(openingSkeletonProblems(`${token} arrives.\n\nSomething broke.`)).toEqual([]);
    }
    // A place named only in P2 does not discharge P1's job — arrival is the
    // paragraph that has to say where the agent is.
    const lateOnly = openingSkeletonProblems('She arrives at dawn.\n\nAt {location}, trouble.');
    expect(lateOnly.some(p => /P1 names no place/u.test(p))).toBe(true);
  });

  it('rejects an invented literal place name in P1', () => {
    // Not an oversight: "prose may not invent game state" (2026-07-31). A scene
    // that names its own fortress has minted one, which is the defect the rule
    // exists to catch — so a capitalised literal must NOT satisfy P1.
    const invented = 'She arrives at the fortress of Greyhold at dawn.\n\nSomething broke.';
    expect(openingSkeletonProblems(invented).some(p => /P1 names no place/u.test(p))).toBe(true);
  });

  it('reports an empty opening once, not three times', () => {
    expect(openingSkeletonProblems('   ')).toEqual(['opening is empty']);
  });
});

describe('templateOpeningProblems', () => {
  it('prefixes each problem with its setting class', () => {
    const template = {
      id: 'encounter.test.settings',
      openings: { stronghold: IN_SITU_OPENING, ruin: EXEMPLAR_OPENING },
    } as unknown as UnifiedActionTemplate;
    const problems = templateOpeningProblems(template);
    expect(problems.every(p => p.startsWith('openings.stronghold: '))).toBe(true);
    expect(problems.length).toBeGreaterThan(0);
  });

  it('returns nothing for a template that declares no openings', () => {
    expect(templateOpeningProblems({ id: 'x' } as unknown as UnifiedActionTemplate)).toEqual([]);
  });

  it('composes the class opening with the step-0 spine before judging the skeleton', () => {
    // The converter lands the declared opening above the setting-neutral
    // narrativeTemplate, so a P1-only opening + a P2/P3 spine IS the skeleton.
    // Judging the opening field alone flagged that architecture as
    // "1 paragraph" once per declared class (THR-1223 batch 1).
    const template = {
      id: 'encounter.test.spine',
      openings: { stronghold: '{name} arrives at the fortress of {location} at dawn.' },
      steps: [
        {
          narrativeTemplate:
            'There {they} find trouble.\n\nThe problem stands, and someone must solve it.',
        },
      ],
    } as unknown as UnifiedActionTemplate;
    expect(templateOpeningProblems(template)).toEqual([]);
  });
});

// ─── The combined channel ────────────────────────────────────────────

describe('doctrineV2Warnings', () => {
  it('tags each line with its source block, openings first', () => {
    const template = {
      id: 'encounter.test.both',
      openings: { ruin: IN_SITU_OPENING },
      steps: [{ nudges: [{ id: 'test.card', name: 'A Little More' }] }],
    } as unknown as UnifiedActionTemplate;

    const warnings = doctrineV2Warnings(template);
    expect(warnings.some(w => w.startsWith('[opening] '))).toBe(true);
    expect(warnings.some(w => w.startsWith('[card name] '))).toBe(true);
    expect(warnings.findIndex(w => w.startsWith('[opening] '))).toBeLessThan(
      warnings.findIndex(w => w.startsWith('[card name] ')),
    );
  });

  it('is empty for a template that holds the doctrine', () => {
    const template = {
      id: 'encounter.test.compliant',
      openings: { ruin: EXEMPLAR_OPENING },
      steps: [{ nudges: [{ id: 'test.card', name: 'Widen The Swing' }] }],
    } as unknown as UnifiedActionTemplate;
    expect(doctrineV2Warnings(template)).toEqual([]);
  });
});
