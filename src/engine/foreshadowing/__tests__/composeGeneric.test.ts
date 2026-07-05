import { describe, it, expect } from 'vitest';
import { composeGenericForeshadowing } from '../composeGeneric';
import { pronounNumber, realize } from '../realizer';
import {
  KNOWLEDGE_CLAUSES,
  PULL_CLAUSES,
  EXPECTATION_CLAUSES,
  DEFAULT_PULL_CLAUSES,
} from '../../../data/foreshadowing-content';

const BASE = {
  agentId: 'agent-1',
  encounterId: 'encounter.plague_outbreak',
  agentName: 'Kael Thornweaver',
  subjectPronoun: 'he',
  dominantReach: 'eye',
  intelTier: 'unknown' as const,
};

describe('composeGenericForeshadowing', () => {
  it('renders a three-sentence passage using the agent first name', () => {
    const { prose } = composeGenericForeshadowing(BASE);
    expect(prose).toContain('Kael');
    expect(prose).not.toContain('Thornweaver');
    const sentences = prose.split(/(?<=[.?!])\s+/).filter(Boolean);
    expect(sentences.length).toBe(3);
  });

  it('never surfaces the encounter id or a title in the prose', () => {
    const { prose } = composeGenericForeshadowing({
      ...BASE,
      encounterId: 'encounter.weave_a_political_alliance',
    });
    // The original bug jammed the encounter title into a place slot.
    expect(prose).not.toContain('encounter.');
    expect(prose).not.toContain('weave_a_political_alliance');
    expect(prose).not.toContain('{');
  });

  it('is deterministic for the same (agentId, encounterId)', () => {
    const a = composeGenericForeshadowing(BASE).prose;
    const b = composeGenericForeshadowing(BASE).prose;
    expect(a).toBe(b);
  });

  it('grounds the matter phrase at a known location', () => {
    const { prose } = composeGenericForeshadowing({ ...BASE, locationName: 'Ashmarket' });
    expect(prose).toContain('Ashmarket');
  });

  it('reports composition provenance keys', () => {
    const { compositionKeys } = composeGenericForeshadowing(BASE);
    expect(compositionKeys).toEqual(['knowledge:unknown', 'pull:eye', 'expect:unknown']);
  });

  it('falls to the default pull pool for a non-Reach dominant value', () => {
    const { compositionKeys } = composeGenericForeshadowing({ ...BASE, dominantReach: 'wilderness' });
    expect(compositionKeys[1]).toBe('pull:default');
  });
});

// ── Agreement sweep (THR-631 Done-when) ──────────────────────────────────────
// Every clause in every pool, rendered for he/she/they, must be grammatical:
// no singular subject with a base verb ("He mean"), no plural subject with a
// singular verb ("They believes"), and no unresolved slot tokens.

const SUBJECT_VERBS =
  'mean|go|trust|see|reckon|want|prefer|feel|sense|read|build|carry|believe|suspect|know|expect|think|judge|like|gather';
const SINGULAR_BASE = new RegExp(`\\b(He|She|he|she) (${SUBJECT_VERBS})\\b`);
const PLURAL_SINGULAR = new RegExp(
  `\\b(They|they) (means|goes|trusts|sees|reckons|wants|prefers|feels|senses|reads|builds|carries|believes|suspects|knows|expects|thinks|judges|likes|gathers)\\b`,
);

const PRONOUNS = [
  { subject: 'he', Subject: 'He' },
  { subject: 'she', Subject: 'She' },
  { subject: 'they', Subject: 'They' },
];

const ALL_CLAUSES: string[] = [
  ...Object.values(KNOWLEDGE_CLAUSES).flat(),
  ...Object.values(PULL_CLAUSES).flat(),
  ...Object.values(EXPECTATION_CLAUSES).flat(),
  ...DEFAULT_PULL_CLAUSES,
];

describe('foreshadowing clause agreement sweep', () => {
  it('has a non-trivial clause corpus', () => {
    expect(ALL_CLAUSES.length).toBeGreaterThan(40);
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
      for (const clause of ALL_CLAUSES) {
        const rendered = realize(clause, { number, slots });
        expect(rendered, `unresolved slot in: ${rendered}`).not.toMatch(/[{}]/);
        expect(rendered, `singular subject + base verb in: ${rendered}`).not.toMatch(SINGULAR_BASE);
        expect(rendered, `plural subject + singular verb in: ${rendered}`).not.toMatch(PLURAL_SINGULAR);
        expect(rendered, `clause not sentence-terminated: ${rendered}`).toMatch(/[.?!]$/);
      }
    });
  }
});
