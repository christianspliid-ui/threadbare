/**
 * The versioned question set for the encounter coverage run (THR-1723, plan Decision 2).
 *
 * Criteria are built from canon, quoted, never paraphrased (content-judgments rule 4):
 *
 * - Reach lines are the Domain column of `Docs/canon/cosmology.md` § The Eight Reaches.
 * - Sphere lines are the Alignment column of cosmology § The Twelve Spheres, plus the
 *   seated sphere tag's catalog line.
 * - Activity and walk-of-life lines are the seated tags' catalog descriptions, read from
 *   `src/data/content-tags.ts` itself.
 *
 * `encounterQuestions.test.ts` asserts every cosmology quote against the canon file, so a
 * canon edit fails the test and forces a bump of `ENCOUNTER_COVERAGE_QUESTIONS_VERSION`.
 *
 * Question ids are never sent to the model (docs: "not used in inference"); the option
 * keys are, so they are the plain words.
 */
import { REACH_DOMAINS, type ReachDomain } from '../../src/types/traits';
import { SPHERE_NAMES, type SphereName } from '../../src/types/index';
import { getContentTag, SPHERE_TAG_DESCRIPTIONS } from '../../src/data/content-tags';
import { ACTIVITY_TAGS, NO_MATCH_OPTION, WALK_OF_LIFE_TAGS } from './constants';

export interface ChoiceQuestion {
  readonly type: 'choice';
  readonly instructions: string;
  readonly criteria: Readonly<Record<string, string>>;
}

export interface NoulQuestion {
  readonly type: 'noul';
  readonly instructions: string;
  readonly criteria: { readonly true: string; readonly false: string };
}

export type JevQuestion = ChoiceQuestion | NoulQuestion;
export type QuestionSet = Readonly<Record<string, JevQuestion>>;

/** Cosmology § The Eight Reaches, Domain column, verbatim. */
export const REACH_CANON_LINES: Readonly<Record<ReachDomain, string>> = {
  iron: 'Strength, force, martial action, direct confrontation',
  gold: 'Wealth, influence, social capital, patronage, trade',
  shadow: 'Stealth, deception, sabotage, hidden action',
  veil: 'Magic, divination, supernatural perception, ritual',
  heart: 'Emotion, loyalty, persuasion, personal bonds',
  eye: 'Knowledge, observation, judgment, intelligence',
  stone: 'Endurance, craftsmanship, building, preservation',
  star: 'Travel, fate, navigation, survival, long-distance',
};

/** Cosmology § The Twelve Spheres, Alignment column, verbatim. */
export const SPHERE_CANON_LINES: Readonly<Record<SphereName, string>> = {
  chaos: 'Change, disruption, entropy-as-creation',
  order: 'Stability, law, structure',
  light: 'Illumination, truth, clarity',
  darkness: 'Mystery, shadow, concealment',
  force: 'Physical power, momentum',
  matter: 'Substance, crafting, physicality',
  energy: 'Vitality, fire, kinetic power',
  life: 'Growth, biology, healing',
  mind: 'Thought, intelligence, will',
  spirit: 'Soul, essence, divine nature',
  time: 'Duration, memory, causality',
  entropy: 'Decay, dissolution, transformation',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const bare = (tag: string) => tag.replace(/^#/, '');

/** A seated tag's catalog line; a missing seat is a broken constant, so it fails loudly in the test. */
export function tagLine(tag: string): string {
  return getContentTag(tag)?.description ?? '';
}

function reverseCriteria(criteria: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(criteria).reverse()) out[key] = criteria[key];
  return out;
}

function reachQuestion(): ChoiceQuestion {
  const criteria: Record<string, string> = {};
  for (const reach of REACH_DOMAINS) {
    criteria[reach] = `${capitalize(reach)}: ${REACH_CANON_LINES[reach]}`;
  }
  criteria[NO_MATCH_OPTION] = 'No single Reach; the encounter tests nothing, or several equally.';
  return {
    type: 'choice',
    instructions:
      'Which Reach does the mortal\'s main test in `encounter` draw on? Judge by what the mortal must do to succeed, not by the setting. '
      // v2 (THR-2012): v1 read the noticing that sets up a test as the test (Eye right 5 of 67).
      + 'If the mortal only notices, reads or works something out in order to set up a fight, a deal, a theft, a rite or a piece of craft, judge that later test, not the noticing.',
    criteria,
  };
}

function sphereQuestion(sphere: SphereName): NoulQuestion {
  const name = capitalize(sphere);
  return {
    type: 'noul',
    instructions:
      `Does the fiction of \`encounter\` express the Sphere of ${name} (${SPHERE_CANON_LINES[sphere]}; '${SPHERE_TAG_DESCRIPTIONS[sphere]}') as a force at work in the scene, not as a passing word?`,
    criteria: {
      true: `${name} is a force at work in the scene: the events, stakes or powers in play express it.`,
      false: `${name} is absent, or appears only as a passing word or decoration.`,
    },
  };
}

function tagChoice(
  instructions: string,
  tags: readonly string[],
  noneLine: string,
): ChoiceQuestion {
  const criteria: Record<string, string> = {};
  for (const tag of tags) criteria[bare(tag)] = tagLine(tag);
  criteria[NO_MATCH_OPTION] = noneLine;
  return { type: 'choice', instructions, criteria };
}

function activityQuestion(): ChoiceQuestion {
  return tagChoice(
    'What is the mortal mainly doing in `encounter`?',
    ACTIVITY_TAGS,
    'None of these; the mortal mainly does something else.',
  );
}

function walkOfLifeQuestion(): ChoiceQuestion {
  return tagChoice(
    'Which walk of life does `encounter` happen in?',
    WALK_OF_LIFE_TAGS,
    'None of these; it happens in some other walk of life.',
  );
}

/** Question id for a worn family tag's fit check. */
export function tagFitQuestionId(tag: string): string {
  return `tagfit_${bare(tag)}`;
}

function tagFitQuestion(tag: string): NoulQuestion {
  return {
    type: 'noul',
    instructions:
      `Does \`encounter\` earn the tag \`${tag}\`, defined as '${tagLine(tag)}'?`,
    criteria: {
      true: `The encounter's fiction is plainly of this kind: '${tagLine(tag)}'`,
      false: 'The encounter is not of this kind; the tag does not describe it.',
    },
  };
}

/** The 17 base questions every entry is asked, in a stable order. */
export function buildBaseQuestions(): Record<string, JevQuestion> {
  const reach = reachQuestion();
  const activity = activityQuestion();
  const questions: Record<string, JevQuestion> = {
    reach,
    reach_rev: { ...reach, criteria: reverseCriteria(reach.criteria) },
  };
  for (const sphere of SPHERE_NAMES) questions[`sphere_${sphere}`] = sphereQuestion(sphere);
  questions.activity = activity;
  questions.activity_rev = { ...activity, criteria: reverseCriteria(activity.criteria) };
  questions.walk_of_life = walkOfLifeQuestion();
  return questions;
}

/** The full set for one entry: the base questions plus one tag-fit Noul per worn family tag. */
export function buildQuestionsForEntry(familyTags: readonly string[]): Record<string, JevQuestion> {
  const questions = buildBaseQuestions();
  for (const tag of familyTags) questions[tagFitQuestionId(tag)] = tagFitQuestion(tag);
  return questions;
}
