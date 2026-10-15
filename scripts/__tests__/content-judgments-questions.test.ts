/**
 * THR-1723 — the question set quotes canon verbatim. A cosmology edit fails the quote tests;
 * any question-text edit (a tag-catalog line included) fails the fingerprint pin. Either is
 * the cue to bump ENCOUNTER_COVERAGE_QUESTIONS_VERSION.
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { REACH_DOMAINS } from '../../src/types/traits';
import { SPHERE_NAMES } from '../../src/types/index';
import { getContentTag, SPHERE_TAG_DESCRIPTIONS } from '../../src/data/content-tags';
import {
  ACTIVITY_TAGS,
  ENCOUNTER_COVERAGE_QUESTIONS_FINGERPRINT,
  ENCOUNTER_COVERAGE_QUESTIONS_VERSION,
  NO_MATCH_OPTION,
  WALK_OF_LIFE_TAGS,
} from '../content-judgments/constants';
import {
  buildBaseQuestions,
  buildQuestionsForEntry,
  REACH_CANON_LINES,
  SPHERE_CANON_LINES,
  type ChoiceQuestion,
} from '../content-judgments/encounterQuestions';
import { fnv1a } from '../content-judgments/encounterState';

const cosmology = fs.readFileSync(path.resolve(__dirname, '../../Docs/canon/cosmology.md'), 'utf8');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

describe('encounter coverage questions (THR-1723)', () => {
  it('is version 1 until a quote or option changes', () => {
    expect(ENCOUNTER_COVERAGE_QUESTIONS_VERSION).toBe(1);
  });

  it('pins the question text: any edit, including a tag-catalog line, fails until the version is bumped', () => {
    // A failure here means the questions changed. Bump ENCOUNTER_COVERAGE_QUESTIONS_VERSION
    // and set ENCOUNTER_COVERAGE_QUESTIONS_FINGERPRINT to the received value.
    expect(fnv1a(JSON.stringify(buildBaseQuestions()))).toBe(ENCOUNTER_COVERAGE_QUESTIONS_FINGERPRINT);
  });

  it('quotes every Reach line from cosmology § The Eight Reaches verbatim', () => {
    for (const reach of REACH_DOMAINS) {
      expect(cosmology).toContain(`| **${cap(reach)}** | ${REACH_CANON_LINES[reach]} |`);
    }
  });

  it('quotes every Sphere line from cosmology § The Twelve Spheres verbatim', () => {
    for (const sphere of SPHERE_NAMES) {
      expect(cosmology).toContain(`| ${cap(sphere)} | ${SPHERE_CANON_LINES[sphere]} |`);
    }
  });

  it('every activity and walk-of-life option is a seated family tag, quoted from the catalog', () => {
    const q = buildBaseQuestions();
    for (const [qid, tags] of [['activity', ACTIVITY_TAGS], ['walk_of_life', WALK_OF_LIFE_TAGS]] as const) {
      const criteria = (q[qid] as ChoiceQuestion).criteria;
      for (const tag of tags) {
        const seated = getContentTag(tag);
        expect(seated?.axis, tag).toBe('family');
        expect(criteria[tag.slice(1)]).toBe(seated!.description);
      }
      expect(Object.keys(criteria).at(-1)).toBe(NO_MATCH_OPTION);
    }
  });

  it('carries the canon line and the sphere tag line in each Sphere question', () => {
    const q = buildBaseQuestions();
    for (const sphere of SPHERE_NAMES) {
      const instructions = (q[`sphere_${sphere}`] as { instructions: string }).instructions;
      expect(instructions).toContain(SPHERE_CANON_LINES[sphere]);
      expect(instructions).toContain(SPHERE_TAG_DESCRIPTIONS[sphere]);
    }
  });

  it('asks 17 base questions, and the _rev options are the exact reverse', () => {
    const q = buildBaseQuestions();
    expect(Object.keys(q)).toHaveLength(17);
    for (const axis of ['reach', 'activity'] as const) {
      const fwd = Object.keys((q[axis] as ChoiceQuestion).criteria);
      const rev = Object.keys((q[`${axis}_rev`] as ChoiceQuestion).criteria);
      expect(rev).toEqual([...fwd].reverse());
      expect((q[`${axis}_rev`] as ChoiceQuestion).instructions).toBe((q[axis] as ChoiceQuestion).instructions);
    }
    expect(Object.keys((q.reach as ChoiceQuestion).criteria)).toEqual([...REACH_DOMAINS, NO_MATCH_OPTION]);
  });

  it('adds one tag-fit Noul per worn family tag, quoting its catalog line', () => {
    const q = buildQuestionsForEntry(['#trade', '#relic']);
    expect(Object.keys(q)).toHaveLength(19);
    expect(q.tagfit_trade.type).toBe('noul');
    expect((q.tagfit_relic as { instructions: string }).instructions).toContain(getContentTag('#relic')!.description);
  });
});
