/**
 * THR-1474 — the aftermath page, read as one text.
 *
 * Director question, 2026-09-12: *"I am wondering if we even have a holistic test
 * of all the aftermath text, where the agent reads all the text on the page
 * together, and makes sure there is no repetition, verbosity, or conflict in the
 * prose?"* There was not. This is the machine half of the answer — the literal
 * overlaps between blocks; the paraphrase and the contradiction are the critic's
 * Page read step and are deliberately out of reach here.
 *
 * **Every arm is falsified first.** A page check that reported nothing at all
 * would pass any assertion that the migrated slice is clean, so each pair kind
 * gets a fixture that must go red and a controlled twin that must go green — and
 * the twin differs from it *only* in the words under test, so a green twin is
 * evidence about the rule and not about some other thing the fixture changed.
 */

import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  AFTERMATH_PAGE_CATEGORY_ORDER,
  aftermathPageWordCount,
  assembleAftermathPages,
  pageOverlapFindings,
  renderAftermathPage,
} from '../aftermathPage';
import { doctrineV2Warnings } from '../doctrineV2Checks';
import { CHIP_OVERVIEW_OVERLAP_RUN_WORDS } from '../nudgeAuthoringConstants';
import { CONSEQUENCE_CATEGORY_ORDER } from '../../../components/Game/encounter-stage/adapters/buildAftermathConsequences';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';

/** A seven-word clause, long enough to carry four-word runs whichever way it is cut. */
const SHARED_CLAUSE = 'the riders come down off the ridge';

type Chip = Record<string, unknown>;
type Reaction = { id: string; label: string; intent?: string; effects: never[] };

function chip(id: string, category: string, causeClause: string, detail = ''): Chip {
  return {
    id,
    kind: 'trait',
    title: id,
    polarity: 'loss',
    category,
    direction: 'loss',
    stateNoun: { text: 'exhausted', entityId: 'trait.condition.exhausted' },
    causeClause,
    detail,
  };
}

function reaction(id: string, label: string, intent?: string): Reaction {
  return { id, label, intent, effects: [] as never[] };
}

/** One face — overview, chips, reactions — as a template the checks can read. */
function page(parts: {
  overview?: string;
  changes?: Chip[];
  reactions?: Reaction[];
}): UnifiedActionTemplate {
  return {
    id: 'encounter.test.thr1474_fixture',
    name: 'THR-1474 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: parts.overview ?? 'They came down the far side and the road went on.',
        changes: parts.changes ?? [],
        reactions: parts.reactions ?? [],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

describe('THR-1474 — the page is assembled the way it renders', () => {
  it('orders blocks overview → chips → reactions', () => {
    const [assembled] = assembleAftermathPages(
      page({
        overview: 'The pass closed behind them.',
        changes: [chip('c.boon', 'boon', 'They kept the hut warm')],
        reactions: [reaction('r.go', 'Walk on', 'The road resumes.')],
      }),
    );

    expect(assembled.blocks.map(b => b.kind)).toEqual(['overview', 'chip', 'reaction']);
    expect(assembled.where).toBe('fallback');
  });

  it('orders chips by category, not by emission order', () => {
    const [assembled] = assembleAftermathPages(
      page({
        changes: [
          chip('c.path', 'path', 'A road opened'),
          chip('c.scar', 'scar', 'A night spent cold'),
          chip('c.boon', 'boon', 'A hearth found'),
          chip('c.bond', 'bond', 'A hand offered'),
        ],
      }),
    );

    expect(assembled.blocks.filter(b => b.kind === 'chip').map(b => b.label)).toEqual([
      "chip 'c.scar'",
      "chip 'c.bond'",
      "chip 'c.boon'",
      "chip 'c.path'",
    ]);
  });

  it('keeps its category order identical to the adapter the screen draws from', () => {
    // The one duplicated constant in the module (content-eval must not import
    // the React adapter). Pinned here so the copy cannot drift silently — drift
    // would surface only as a batch report whose page order disagrees with the
    // screen, which is the exact class of error this module exists to stop.
    expect(AFTERMATH_PAGE_CATEGORY_ORDER).toEqual([...CONSEQUENCE_CATEGORY_ORDER]);
  });

  it('leaves uncategorised changes off the page — they draw no tag and no caption', () => {
    const [assembled] = assembleAftermathPages(
      page({ changes: [{ ...chip('c.bare', 'scar', 'A night spent cold'), category: undefined }] }),
    );

    expect(assembled.blocks.filter(b => b.kind === 'chip')).toHaveLength(0);
  });

  it('drops an empty overview rather than carrying a blank block', () => {
    const [assembled] = assembleAftermathPages(page({ overview: '   ' }));
    expect(assembled.blocks).toHaveLength(0);
    expect(renderAftermathPage(assembled)).toContain('renders no prose');
  });

  it('assembles one page per (variant × band) ending', () => {
    const template = {
      id: 'encounter.test.thr1474_bands',
      name: 'bands',
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          overview: 'Base.',
          changes: [],
          reactions: [],
          byOutcome: { failure: { overview: 'They lost it.' } },
        },
      },
    } as unknown as UnifiedActionTemplate;

    expect(assembleAftermathPages(template).map(p => p.where)).toEqual([
      'fallback',
      'fallback/failure',
    ]);
  });
});

describe('THR-1474 — the page tells one fact twice', () => {
  it('flags two chips sharing a four-word run', () => {
    const out = pageOverlapFindings(
      page({
        overview: 'The pass closed behind them.',
        changes: [
          chip('c.scar', 'scar', `They watched ${SHARED_CLAUSE}`),
          chip('c.bond', 'bond', `She watched ${SHARED_CLAUSE} beside him`),
        ],
      }),
    );

    expect(out).toHaveLength(1);
    expect(out[0]).toContain("chip 'c.scar' and chip 'c.bond'");
    expect(out[0]).toContain('the riders come down');
  });

  it('passes the same two chips once the second stops re-telling the first', () => {
    // Controlled arm: the first chip is byte-identical to the red case above, so
    // the only thing that changed is the words under test.
    expect(
      pageOverlapFindings(
        page({
          overview: 'The pass closed behind them.',
          changes: [
            chip('c.scar', 'scar', `They watched ${SHARED_CLAUSE}`),
            chip('c.bond', 'bond', 'She stayed at his shoulder for it'),
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('flags a reaction offering back what a chip already stated', () => {
    const out = pageOverlapFindings(
      page({
        changes: [chip('c.scar', 'scar', `They watched ${SHARED_CLAUSE}`)],
        reactions: [reaction('r.wait', 'Wait', `Let ${SHARED_CLAUSE} unchallenged.`)],
      }),
    );

    expect(out).toHaveLength(1);
    expect(out[0]).toContain("chip 'c.scar' and reaction 'r.wait'");
  });

  it('flags two reaction stances phrased as one', () => {
    const out = pageOverlapFindings(
      page({
        reactions: [
          reaction('r.rest', 'Let them rest', `Because ${SHARED_CLAUSE} regardless.`),
          reaction('r.tell', 'Let it travel', `Because ${SHARED_CLAUSE} regardless.`),
        ],
      }),
    );

    expect(out).toHaveLength(1);
    expect(out[0]).toContain("reaction 'r.rest' and reaction 'r.tell'");
  });

  it('flags an overview a reaction reads back', () => {
    const out = pageOverlapFindings(
      page({
        overview: `The pass closed and ${SHARED_CLAUSE}.`,
        reactions: [reaction('r.wait', 'Wait', `Nothing stops ${SHARED_CLAUSE} now.`)],
      }),
    );

    expect(out).toHaveLength(1);
    expect(out[0]).toContain("overview and reaction 'r.wait'");
  });

  it('leaves the overview ↔ chip pair to THR-1473, which reports it with its own message', () => {
    // Not an exemption — a division of labour. Both checks print into the same
    // warn channel, so reporting the pair twice would tell an author to fix one
    // sentence twice. The assertion is that it is reported exactly once, by the
    // arm that owns it.
    const fixture = page({
      overview: `The pass closed and ${SHARED_CLAUSE}.`,
      changes: [chip('c.scar', 'scar', `They watched ${SHARED_CLAUSE}`)],
    });

    expect(pageOverlapFindings(fixture)).toEqual([]);

    const warnings = doctrineV2Warnings(fixture);
    const retells = warnings.filter(line => line.includes('the riders come down'));
    expect(retells).toHaveLength(1);
    expect(retells[0]).toContain('[chip sentence]');
  });

  it('does not fire on a run one word shorter than the threshold', () => {
    // Falsifies the run length itself: three shared words must stay silent, or
    // the arm above proves only that *some* overlap fires, not that four is the
    // bar. `CHIP_OVERVIEW_OVERLAP_RUN_WORDS` is 4, so the fixture carries 3.
    expect(CHIP_OVERVIEW_OVERLAP_RUN_WORDS).toBe(4);
    const three = 'the far side';
    expect(three.split(' ')).toHaveLength(CHIP_OVERVIEW_OVERLAP_RUN_WORDS - 1);

    expect(
      pageOverlapFindings(
        page({
          // The default overview says "the far side" itself, which would make
          // this a three-way collision rather than the two-block case under test.
          overview: 'The pass closed behind them.',
          reactions: [
            reaction('r.a', 'Go', `They walk ${three} tomorrow.`),
            reaction('r.b', 'Stay', `Someone walks ${three} eventually.`),
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('reads through punctuation and case, so a re-quoted clause cannot hide', () => {
    const out = pageOverlapFindings(
      page({
        reactions: [
          reaction('r.a', 'Go', 'The riders come down, and nobody stops them.'),
          reaction('r.b', 'Stay', 'THE RIDERS COME DOWN — that is simply what happens.'),
        ],
      }),
    );

    expect(out).toHaveLength(1);
  });

  it('reports per band, because the same chip sits beside different siblings on each', () => {
    const template = {
      id: 'encounter.test.thr1474_perband',
      name: 'per band',
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          overview: 'Base.',
          changes: [chip('c.scar', 'scar', `They watched ${SHARED_CLAUSE}`)],
          reactions: [reaction('r.clean', 'Walk on', 'The road resumes.')],
          byOutcome: {
            failure: { reactions: [reaction('r.echo', 'Wait', `Let ${SHARED_CLAUSE} pass.`)] },
          },
        },
      },
    } as unknown as UnifiedActionTemplate;

    const out = pageOverlapFindings(template);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('on fallback/failure');
  });
});

describe('THR-1474 — the warn channel and the corpus', () => {
  it('prints page findings under their own [page] prefix', () => {
    const warnings = doctrineV2Warnings(
      page({
        reactions: [
          reaction('r.a', 'Go', `Because ${SHARED_CLAUSE} regardless.`),
          reaction('r.b', 'Stay', `Because ${SHARED_CLAUSE} regardless.`),
        ],
      }),
    );

    expect(warnings.some(line => line.startsWith('[page] '))).toBe(true);
  });

  it('leaves Snow on the Pass clean — the encounter the ruling was read on', () => {
    const template = UNIFIED_ACTION_TEMPLATES.find(
      t => t.id === 'encounter.slice.snow_on_the_pass',
    );
    expect(template, 'the slice encounter must exist for this assertion to mean anything')
      .toBeDefined();
    expect(pageOverlapFindings(template!)).toEqual([]);
  });

  it('never throws on the shipped corpus, whatever shape a template is in', () => {
    // NFP #4. The corpus carries pre-contract templates with absent `changes`,
    // absent `reactions` and absent `aftermathConfig` entirely.
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      expect(() => pageOverlapFindings(template)).not.toThrow();
    }
  });
});

describe('THR-1474 — the rendering a reviewer reads', () => {
  it('renders the page as prose, with no field names in the body', () => {
    const [assembled] = assembleAftermathPages(
      page({
        overview: 'The pass closed behind them.',
        changes: [chip('c.scar', 'scar', 'A night spent cold', 'They walk down worn through.')],
        reactions: [reaction('r.go', 'Walk on', 'The road resumes.')],
      }),
    );

    const rendered = renderAftermathPage(assembled);
    expect(rendered).toBe(
      'The pass closed behind them.\n\n'
        + '- A night spent cold — They walk down worn through.\n\n'
        + '> Walk on The road resumes.',
    );
    expect(rendered).not.toContain('causeClause');
    expect(rendered).not.toContain('c.scar');
  });

  it('counts the words the whole page spends', () => {
    const [assembled] = assembleAftermathPages(
      page({
        overview: 'One two three.',
        changes: [chip('c.scar', 'scar', 'four five')],
        reactions: [reaction('r.go', 'six', 'seven')],
      }),
    );

    expect(aftermathPageWordCount(assembled)).toBe(7);
  });
});
