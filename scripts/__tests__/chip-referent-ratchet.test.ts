/**
 * THR-1212 slice 3 — the no-referent chip ratchet.
 *
 * The gate this covers exists because clause 2 (`chipAnchorViolations`) is
 * *deliberately* silent about chips declaring neither a `stateNoun` nor a
 * `concepts` list, and a silent rule reports green over its own blind spot. So
 * the tests below are written against the two ways a ratchet rots:
 *
 *   1. **It measures the wrong population.** Pinned here by asserting the
 *      predicate directly against hand-built chips of each shape — including the
 *      band-override case, where the same chip id is authored one way on one face
 *      and another way on the next.
 *   2. **It cannot fail.** Every verdict arm below is falsified: the increase arm
 *      goes red, the missing- and malformed-baseline arms go red, and each is
 *      asserted to be red *for the stated reason*, not merely non-zero. A gate
 *      whose red path has never been exercised is not evidence.
 *
 * The live-corpus count is deliberately NOT pinned to 443 here. That number moves
 * every time a retrofit batch lands, and a test asserting it would fail honest
 * work while proving nothing about the rule — the committed baseline file is
 * where that number belongs, and the ratchet itself is what reads it.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../src/types/unifiedAction';
import { chipsWithoutReferent } from '../../src/data/content-eval/compositionContract';
import { UNIFIED_ACTION_TEMPLATES } from '../../src/data/unified-action-templates';
import {
  growthReport,
  isValidBaseline,
  noReferentCounts,
  readBaseline,
  serializeBaseline,
  writeBaseline,
  type ChipReferentBaseline,
} from '../chip-referent-ratchet';

/** A template whose fallback face carries the given chips. */
function templateWithChips(
  id: string,
  changes: readonly Record<string, unknown>[],
): UnifiedActionTemplate {
  return {
    id,
    name: id,
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: { overview: 'An ending.', changes, reactions: [] },
    },
  } as unknown as UnifiedActionTemplate;
}

const NO_REFERENT = {
  id: 'fixture.no_referent',
  kind: 'trait',
  title: 'Something Shifted',
  detail: 'Something about them is different now.',
  polarity: 'gain',
};

const WITH_STATE_NOUN = {
  ...NO_REFERENT,
  id: 'fixture.with_state_noun',
  stateNoun: { text: 'inspired', entityId: 'trait.condition.inspired', visualKind: 'attachment' },
};

const WITH_CONCEPTS = {
  ...NO_REFERENT,
  id: 'fixture.with_concepts',
  concepts: [{ text: 'certain of their own footing' }],
};

describe('chipsWithoutReferent — the population clause 2 cannot see', () => {
  it('counts a chip declaring neither a stateNoun nor concepts', () => {
    expect(chipsWithoutReferent(templateWithChips('t', [NO_REFERENT]))).toEqual([
      'fixture.no_referent',
    ]);
  });

  it('does not count a chip carrying a stateNoun', () => {
    expect(chipsWithoutReferent(templateWithChips('t', [WITH_STATE_NOUN]))).toEqual([]);
  });

  it('does not count a chip carrying a non-empty concepts list', () => {
    expect(chipsWithoutReferent(templateWithChips('t', [WITH_CONCEPTS]))).toEqual([]);
  });

  it('counts a chip whose concepts list is present but empty', () => {
    // The older authoring shape sometimes ships `concepts: []`. An empty list
    // names nothing, so treating it as a declaration would let a template opt out
    // of the ratchet by adding two characters.
    const chip = { ...NO_REFERENT, id: 'fixture.empty_concepts', concepts: [] };
    expect(chipsWithoutReferent(templateWithChips('t', [chip]))).toEqual([
      'fixture.empty_concepts',
    ]);
  });

  it('counts each chip id once, however many faces reach it', () => {
    // A base face plus a band override that does not replace `changes` inherits
    // it, so the same chip is reachable twice. Counting per face would report two
    // chips where an author sees — and fixes — one.
    const template = {
      id: 'two-faces',
      name: 'two-faces',
      aftermathConfig: {
        branchOnStep: 0,
        variants: {
          only: {
            overview: 'base',
            changes: [NO_REFERENT],
            reactions: [],
            byOutcome: { success: { overview: 'won' } },
          },
        },
      },
    } as unknown as UnifiedActionTemplate;
    expect(chipsWithoutReferent(template)).toEqual(['fixture.no_referent']);
  });

  it('counts a chip that is referent-less on ANY reachable face', () => {
    // `byOutcome` substitutes `changes` wholesale. A chip authored with an anchor
    // on the base face and without one on `failure` is shown anchor-less to every
    // player who rolls a failure, so "anchored somewhere" must not discharge it.
    const template = {
      id: 'diverging',
      name: 'diverging',
      aftermathConfig: {
        branchOnStep: 0,
        variants: {
          only: {
            overview: 'base',
            changes: [{ ...WITH_STATE_NOUN, id: 'fixture.same_id' }],
            reactions: [],
            byOutcome: {
              failure: { overview: 'lost', changes: [{ ...NO_REFERENT, id: 'fixture.same_id' }] },
            },
          },
        },
      },
    } as unknown as UnifiedActionTemplate;
    expect(chipsWithoutReferent(template)).toEqual(['fixture.same_id']);
  });

  it('returns nothing for a template with no aftermath at all', () => {
    expect(chipsWithoutReferent({ id: 'bare', name: 'bare' } as UnifiedActionTemplate)).toEqual([]);
  });
});

describe('noReferentCounts — the corpus arithmetic', () => {
  it('totals across templates and omits the clean ones', () => {
    const { total, perTemplate } = noReferentCounts([
      templateWithChips('a', [NO_REFERENT, { ...NO_REFERENT, id: 'fixture.second' }]),
      templateWithChips('b', [WITH_STATE_NOUN]),
      templateWithChips('c', [NO_REFERENT]),
    ]);
    expect(total).toBe(3);
    expect(perTemplate.get('a')).toBe(2);
    expect(perTemplate.get('c')).toBe(1);
    // Omitted rather than recorded as 0 — a baseline listing every clean template
    // would be mostly zeroes and its diffs unreadable.
    expect(perTemplate.has('b')).toBe(false);
  });

  it('the live catalog scores without throwing, over a non-empty population', () => {
    // The vacuous-probe guard: an empty population would make every assertion in
    // this file pass while measuring nothing. Assert the population FIRST.
    expect(UNIFIED_ACTION_TEMPLATES.length).toBeGreaterThan(100);
    const { total, perTemplate } = noReferentCounts(UNIFIED_ACTION_TEMPLATES);
    expect(total).toBeGreaterThan(0);
    expect(perTemplate.size).toBeGreaterThan(0);
    // The sum of the parts is the gated number — pinned because the two are
    // reported separately and a drift between them would be invisible.
    expect([...perTemplate.values()].reduce((a, b) => a + b, 0)).toBe(total);
  });

  it('agrees with the committed baseline file', () => {
    // The one place the live number and the committed ceiling are compared in the
    // test suite. If a change lands chips without refreshing the baseline, this
    // goes red beside the CI gate rather than only in CI.
    const read = readBaseline(path.join(process.cwd(), 'chip-referent-baseline.json'));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    const { total } = noReferentCounts(UNIFIED_ACTION_TEMPLATES);
    expect(total).toBeLessThanOrEqual(read.baseline.total);
  });
});

describe('growthReport — attributing an increase', () => {
  const baseline: ChipReferentBaseline = {
    total: 3,
    command: 'x',
    perTemplate: { a: 2, c: 1 },
  };

  it('names only the templates that rose, biggest jump first', () => {
    const perTemplate = new Map([['a', 3], ['c', 1], ['new', 2]]);
    expect(growthReport(perTemplate, baseline)).toEqual([
      'new: 0 → 2 (+2)',
      'a: 2 → 3 (+1)',
    ]);
  });

  it('is silent when nothing rose', () => {
    expect(growthReport(new Map([['a', 1]]), baseline)).toEqual([]);
  });
});

describe('baseline file I/O — the failure modes that must not pass', () => {
  function tempFile(contents?: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chip-ratchet-'));
    const file = path.join(dir, 'chip-referent-baseline.json');
    if (contents !== undefined) fs.writeFileSync(file, contents, 'utf8');
    return file;
  }

  it('reports a missing baseline as missing, with the regeneration command', () => {
    const read = readBaseline(tempFile());
    expect(read.ok).toBe(false);
    if (read.ok) return;
    expect(read.reason).toBe('missing');
    expect(read.message).toContain('--baseline --update');
  });

  it('refuses invalid JSON rather than reading it as no ceiling', () => {
    const read = readBaseline(tempFile('{ not json'));
    expect(read.ok).toBe(false);
    if (read.ok) return;
    expect(read.reason).toBe('malformed');
  });

  it('refuses a well-formed JSON file of the wrong shape', () => {
    // The shape that would otherwise be read as `total: undefined`, against which
    // `total > baseline.total` is false — a corrupt file passing everything.
    const read = readBaseline(tempFile('{"count": 443}'));
    expect(read.ok).toBe(false);
    if (read.ok) return;
    expect(read.reason).toBe('malformed');
  });

  it('rejects a non-finite total', () => {
    expect(isValidBaseline({ total: Number.NaN, perTemplate: {} })).toBe(false);
    expect(isValidBaseline({ total: 1, perTemplate: {} })).toBe(true);
  });

  it('round-trips a written baseline', () => {
    const file = tempFile();
    writeBaseline(4, new Map([['b', 3], ['a', 1]]), file);
    const read = readBaseline(file);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.baseline.total).toBe(4);
    expect(read.baseline.perTemplate).toEqual({ a: 1, b: 3 });
  });

  it('serializes perTemplate in sorted order so a refresh diffs cleanly', () => {
    const serialized = serializeBaseline(3, new Map([['z', 1], ['a', 2]]));
    expect(serialized.indexOf('"a"')).toBeLessThan(serialized.indexOf('"z"'));
    expect(serialized.endsWith('\n')).toBe(true);
  });
});
