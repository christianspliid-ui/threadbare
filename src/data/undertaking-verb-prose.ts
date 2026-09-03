/**
 * Verb prose line-sets for verb × object undertakings (THR-1392 slice 2).
 *
 * One small authored set per verb variant: activity lines (the work in progress,
 * read on the sheet), completion lines (the work finished, read on the moment
 * card), and one GM-narration line. Four slots, filled by
 * `resolveUndertakingProse` from the world — never from the template:
 *
 *   {object}  the thing acted on, by its own name ("the Saltway", "Old Maerin's chart")
 *   {owner}   whoever holds it, by name (empty on an unheld object)
 *   {actor}   the mortal doing the work, by name; {Actor} sentence-initial
 *   {place}   where the work stands, by name
 *
 * Register (Prose Doctrine v2, `Docs/canon/prose.md`): GM narration, present tense,
 * third person, no second person, no numerals, no exclamation marks. A cell may carry
 * up to `CELL_OVERRIDE_MAX_PER_CELL` authored variants on top of these; a cell with
 * none still renders whole.
 *
 * Lines are chosen deterministically per project (`pickUndertakingLine`), so a
 * mortal's sheet says the same thing about the same work every time it is read.
 */
import type { UndertakingVerbVariant } from '../types/strategicAction';

export interface UndertakingVerbLineSet {
  /** The work under way. */
  readonly activity: readonly string[];
  /** The work finished. */
  readonly completion: readonly string[];
  /** One GM line for the moment card. */
  readonly narration: string;
}

export const UNDERTAKING_VERB_PROSE: Readonly<Record<UndertakingVerbVariant, UndertakingVerbLineSet>> = {
  found: {
    activity: [
      '{Actor} is raising {object} at {place}, and the ground has begun to answer.',
      '{Actor} works at {place} on what will be {object}, a little further each day.',
      'At {place} {actor} lays out the bones of {object}; the shape is already visible to anyone who looks.',
      '{Actor} has taken {place} in hand and is making {object} of it.',
    ],
    completion: [
      '{Object} stands at {place}, and it is {actor}\'s doing.',
      '{Actor} has finished {object}; {place} is not the place it was.',
      'The work at {place} is done. {Object} has a name now, and {actor} gave it one.',
      '{Object} is founded. Whoever passes {place} will know {actor} was here.',
    ],
    narration: 'Where there was nothing at {place}, {actor} has made {object}.',
  },
  improve: {
    activity: [
      '{Actor} is bettering {object} at {place}, patient with the slow parts.',
      '{Actor} works {object} over, piece by piece; {place} sees the difference before it is finished.',
      'At {place} {actor} tends {object}, adding what it lacked.',
      '{Actor} has set about making more of {object} than it was.',
    ],
    completion: [
      '{Object} is more than it was; {actor} saw to that at {place}.',
      '{Actor} has finished with {object}, and it will serve better for it.',
      'The improving of {object} is done. {Place} is the richer.',
      '{Object} has grown under {actor}\'s hand.',
    ],
    narration: '{Actor} has made {object} more than it was.',
  },
  use: {
    activity: [
      '{Actor} is putting {object} to use at {place}.',
      '{Actor} draws on {object}, quietly, for what it can give.',
      'At {place} {actor} spends what {object} is worth.',
      '{Actor} turns {object} to a purpose of their own.',
    ],
    completion: [
      '{Actor} has spent {object}, and got what was wanted from it.',
      '{Object} has been used. {Actor} walks away from {place} with the gain.',
      'What {object} was worth, {actor} has taken.',
      '{Actor} is done with {object}; it served.',
    ],
    narration: '{Actor} has drawn on {object} and taken its worth.',
  },
  'control:claim': {
    activity: [
      '{Actor} is laying claim to {object} at {place}; nobody has said otherwise yet.',
      '{Actor} moves to take {object} in hand, since no one else has.',
      'At {place} {actor} sets a mark on {object} and waits to see who objects.',
      '{Actor} is making {object} theirs, a step at a time.',
    ],
    completion: [
      '{Object} is {actor}\'s now. Nobody held it; somebody does.',
      '{Actor} holds {object}. {Place} answers to a new name.',
      'The claim on {object} stands; {actor} made it and no one contested it.',
      '{Actor} has taken {object} into their keeping.',
    ],
    narration: '{Object} was unheld; {actor} holds it now.',
  },
  'control:seize': {
    activity: [
      '{Actor} is moving on {object}, and {owner} has not yet noticed the ground shifting.',
      '{Actor} works to take {object} from {owner}; {place} is quieter than it should be.',
      'At {place} {actor} closes a hand around {object}, which {owner} still calls their own.',
      '{Actor} is prying {object} loose from {owner}.',
    ],
    completion: [
      '{Object} is {actor}\'s now, and {owner} knows who took it.',
      '{Actor} has seized {object}. {Owner} keeps the memory of it.',
      '{Object} changes hands at {place}: {owner} loses it, {actor} holds it.',
      '{Owner} held {object}; {actor} does.',
    ],
    narration: '{Actor} has taken {object} from {owner}.',
  },
  undo: {
    activity: [
      '{Actor} is unmaking {object} at {place}; {owner} will not thank them for it.',
      '{Actor} works against {object}, and {owner}\'s hold on {place} thins with every day of it.',
      'At {place} {actor} sets about breaking {object} that {owner} built.',
      '{Actor} means to see {object} undone, and {owner} cannot stop it.',
    ],
    completion: [
      '{Object} is undone. {Owner} will remember who did it.',
      '{Actor} has broken {object} at {place}; what {owner} had there is gone.',
      'Of {object} only the name is left; {actor} saw to that.',
      '{Owner}\'s {object} is finished, and {actor}\'s name is on the finishing.',
    ],
    narration: '{Actor} has undone {object}, and {owner} has lost it.',
  },
  survey: {
    activity: [
      '{Actor} is learning {object} at {place}, a little more each day.',
      '{Actor} watches {object} and keeps what is learned.',
      'At {place} {actor} takes the measure of {object}.',
      '{Actor} is reading {object} for what it hides.',
    ],
    completion: [
      '{Actor} knows {object} now, better than {owner} would like.',
      'The survey of {object} is done; {actor} carries it in their head.',
      '{Actor} has taken the measure of {object} at {place}.',
      'What {object} hid, {actor} has found.',
    ],
    narration: '{Actor} has learned {object}.',
  },
};

/** The player-facing verb word for a cell's display name (UI Law 14 — never a `snake_case` member). */
export const UNDERTAKING_VERB_WORDS: Readonly<Record<UndertakingVerbVariant, string>> = {
  found: 'Found', improve: 'Improve', use: 'Use', 'control:claim': 'Claim', 'control:seize': 'Seize', undo: 'Undo', survey: 'Survey',
};
