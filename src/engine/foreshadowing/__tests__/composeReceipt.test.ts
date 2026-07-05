import { describe, it, expect } from 'vitest';
import { composeReceiptForeshadowing } from '../composeReceipt';
import { pronounNumber, conjugate, realize } from '../realizer';
import { STAKE_CLAUSE_MIN_WEIGHT } from '../constants';
import type { MotiveReceipt, MotiveContribution } from '../../../types/foreshadowing';
import {
  MOTIVE_CLAUSES,
  EXPECTATION_BY_FORECAST,
  STAKE_CLAUSES,
  DEFAULT_STAKE_CLAUSES,
} from '../../../data/foreshadowing-content';

function makeReceipt(overrides: Partial<MotiveReceipt> = {}): MotiveReceipt {
  return {
    templateId: 'encounter.plague_outbreak',
    locationId: 'loc-1',
    contributions: [{ kind: 'ambition', weight: 0.7 }],
    intelTier: 'briefed',
    expectation: 'perilous',
    dominantReach: 'iron',
    decidedAtTick: 12,
    ...overrides,
  };
}

const BASE_INPUT = {
  agentId: 'agent-1',
  encounterId: 'encounter.plague_outbreak',
  agentName: 'Kael Thornweaver',
  subjectPronoun: 'he',
};

describe('composeReceiptForeshadowing', () => {
  it('renders a multi-sentence passage using the agent first name only', () => {
    const { prose } = composeReceiptForeshadowing(BASE_INPUT, makeReceipt());
    expect(prose).toContain('Kael');
    expect(prose).not.toContain('Thornweaver');
    const sentences = prose.split(/(?<=[.?!])\s+/).filter(Boolean);
    expect(sentences.length).toBeGreaterThanOrEqual(3);
  });

  it('never surfaces the encounter id or a title, or an unresolved slot', () => {
    const { prose, tooltipProse } = composeReceiptForeshadowing(
      { ...BASE_INPUT, encounterId: 'encounter.weave_a_political_alliance' },
      makeReceipt({ templateId: 'encounter.weave_a_political_alliance' }),
    );
    for (const text of [prose, tooltipProse]) {
      expect(text).not.toContain('encounter.');
      expect(text).not.toContain('weave_a_political_alliance');
      expect(text).not.toMatch(/[{}]/);
    }
  });

  it('tooltipProse is a single sentence and appears in the full prose', () => {
    const { prose, tooltipProse } = composeReceiptForeshadowing(BASE_INPUT, makeReceipt());
    const sentences = tooltipProse.split(/(?<=[.?!])\s+/).filter(Boolean);
    expect(sentences.length).toBe(1);
    expect(prose).toContain(tooltipProse);
  });

  it('is deterministic for the same (agentId, encounterId, decidedAtTick)', () => {
    const a = composeReceiptForeshadowing(BASE_INPUT, makeReceipt()).prose;
    const b = composeReceiptForeshadowing(BASE_INPUT, makeReceipt()).prose;
    expect(a).toBe(b);
  });

  it('varies prose when the decision tick changes', () => {
    const a = composeReceiptForeshadowing(BASE_INPUT, makeReceipt({ decidedAtTick: 12 })).prose;
    const b = composeReceiptForeshadowing(BASE_INPUT, makeReceipt({ decidedAtTick: 200 })).prose;
    // Not guaranteed different for every pair, but the seed differs — assert the
    // composer is at least sensitive to the tick across a spread of ticks.
    const spread = new Set(
      [1, 5, 12, 40, 99, 200].map(
        t => composeReceiptForeshadowing(BASE_INPUT, makeReceipt({ decidedAtTick: t })).prose,
      ),
    );
    expect(spread.size).toBeGreaterThan(1);
    void a; void b;
  });

  it('keys S2 by the top contribution kind', () => {
    const { compositionKeys } = composeReceiptForeshadowing(
      BASE_INPUT,
      makeReceipt({ contributions: [{ kind: 'divine', weight: 0.9 }] }),
    );
    expect(compositionKeys).toContain('pull:divine');
  });

  it('keys S3 by the real forecast tier', () => {
    const { compositionKeys } = composeReceiptForeshadowing(
      BASE_INPUT,
      makeReceipt({ expectation: 'fated', intelTier: 'expert' }),
    );
    expect(compositionKeys).toContain('expect:fated');
  });

  it('renders the S4 stake clause only when the second contribution clears the floor', () => {
    const withStake = composeReceiptForeshadowing(
      BASE_INPUT,
      makeReceipt({
        contributions: [
          { kind: 'ambition', weight: 0.6 },
          { kind: 'bond', weight: STAKE_CLAUSE_MIN_WEIGHT + 0.05 },
        ],
      }),
    );
    expect(withStake.compositionKeys.some(k => k.startsWith('stake:'))).toBe(true);

    const belowFloor: MotiveContribution[] = [
      { kind: 'ambition', weight: 0.9 },
      { kind: 'bond', weight: STAKE_CLAUSE_MIN_WEIGHT - 0.05 },
    ];
    const noStake = composeReceiptForeshadowing(BASE_INPUT, makeReceipt({ contributions: belowFloor }));
    expect(noStake.compositionKeys.some(k => k.startsWith('stake:'))).toBe(false);
  });

  it('adds a hedge tail below the briefed tier, and none at briefed/expert', () => {
    const lowIntel = composeReceiptForeshadowing(BASE_INPUT, makeReceipt({ intelTier: 'rumor' }));
    expect(lowIntel.prose).toContain(' — ');
    expect(lowIntel.compositionKeys.some(k => k.includes('/hedged'))).toBe(true);

    const highIntel = composeReceiptForeshadowing(BASE_INPUT, makeReceipt({ intelTier: 'expert' }));
    expect(highIntel.compositionKeys.some(k => k.includes('/hedged'))).toBe(false);
  });

  it('fails soft with empty contributions (personality fallback, no throw)', () => {
    const receipt = makeReceipt({ contributions: [] });
    expect(() => composeReceiptForeshadowing(BASE_INPUT, receipt)).not.toThrow();
    const { compositionKeys } = composeReceiptForeshadowing(BASE_INPUT, receipt);
    expect(compositionKeys).toContain('pull:personality');
  });
});

// ── Agreement sweep (THR-631 Done-when) ──────────────────────────────────────
// Self-maintaining: derives each verb's singular/plural forms from the real
// `conjugate` function, so adding a clause with a new verb needs no test edit.
// Catches both original bugs: a base verb after a singular subject ("He mean")
// and a 3rd-person-singular verb after a plural subject ("They believes").

const RECEIPT_CLAUSES: string[] = [
  ...Object.values(MOTIVE_CLAUSES).flat(),
  ...Object.values(EXPECTATION_BY_FORECAST).flat(),
  ...Object.values(STAKE_CLAUSES).flatMap(v => v ?? []),
  ...DEFAULT_STAKE_CLAUSES,
];

const LEMMAS = new Set<string>();
for (const clause of RECEIPT_CLAUSES) {
  for (const m of clause.matchAll(/\{v:(\w+)\}/g)) LEMMAS.add(m[1]);
}

const PRONOUNS = [
  { subject: 'he', Subject: 'He' },
  { subject: 'she', Subject: 'She' },
  { subject: 'they', Subject: 'They' },
];

describe('receipt clause agreement sweep', () => {
  it('has a non-trivial clause corpus and verb vocabulary', () => {
    expect(RECEIPT_CLAUSES.length).toBeGreaterThan(60);
    expect(LEMMAS.size).toBeGreaterThan(15);
  });

  for (const { subject, Subject } of PRONOUNS) {
    it(`renders every clause grammatically for "${subject}"`, () => {
      const slots = {
        name: 'Kael',
        subject,
        Subject,
        matter: 'what stirs at Ashmarket',
        place: 'Ashmarket',
      };
      const number = pronounNumber(subject);
      const isSingular = number === 'singular';
      const subjectAlt = isSingular ? '(He|She|he|she)' : '(They|they)';

      for (const clause of RECEIPT_CLAUSES) {
        const rendered = realize(clause, { number, slots });
        expect(rendered, `unresolved slot in: ${rendered}`).not.toMatch(/[{}]/);
        expect(rendered, `clause not sentence-terminated: ${rendered}`).toMatch(/[.?!]$/);

        for (const lemma of LEMMAS) {
          const sing = conjugate(lemma, 'singular');
          const plur = conjugate(lemma, 'plural');
          if (isSingular) {
            // A base (plural) form directly after a singular subject = forgot {v:}.
            if (sing !== plur) {
              expect(
                rendered,
                `singular subject + base verb "${plur}" in: ${rendered}`,
              ).not.toMatch(new RegExp(`\\b${subjectAlt} ${plur}\\b`));
            }
          } else {
            // A 3sg form directly after a plural subject = "They believes".
            if (sing !== plur) {
              expect(
                rendered,
                `plural subject + singular verb "${sing}" in: ${rendered}`,
              ).not.toMatch(new RegExp(`\\b${subjectAlt} ${sing}\\b`));
            }
          }
        }
      }
    });
  }
});
