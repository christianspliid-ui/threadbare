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
 *   {learned} what a survey produced (THR-1428), read from the knowledge the actor now
 *             holds about the object — familiarity, a lead, a chart, a secret. Empty
 *             when the survey turned up nothing, so the line still reads whole.
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
  create: {
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
  'change:raise': {
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
  'change:lower': {
    activity: [
      '{Actor} works quietly against {object}, and {owner} has not yet noticed what is slipping.',
      'Little by little {actor} is wearing {object} down at {place}; the damage is patient work.',
      '{Actor} has found the seam in {object} and is prying at it, a little more each day.',
      'At {place} {actor} turns a hand against {object}, and what {owner} built begins to give.',
    ],
    completion: [
      '{Object} is the poorer for {actor}\'s work; {owner} will feel it before understanding it.',
      '{Actor} has brought {object} low at {place}, and {owner} keeps what is left.',
      'The seam {actor} pried at has opened: {object} is not what it was.',
    ],
    narration: '{Actor} has undermined {object}, and {owner} is left with the lesser thing.',
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
  destroy: {
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
  observe: {
    activity: [
      '{Actor} is learning {object} at {place}, a little more each day.',
      '{Actor} watches {object} and keeps what is learned.',
      'At {place} {actor} takes the measure of {object}.',
      '{Actor} is reading {object} for what it hides.',
    ],
    // The completion lines carry `{learned}` (THR-1428): watching now *produces*
    // something — familiarity, a lead, a chart, a secret — and the sentence names it.
    // The token is a trailing clause so a survey that turned up nothing new still
    // reads as a whole sentence when it resolves empty.
    completion: [
      '{Actor} knows {object} now, better than {owner} would like{learned}.',
      'The survey of {object} is done; {actor} carries it in their head{learned}.',
      '{Actor} has taken the measure of {object} at {place}{learned}.',
      'What {object} hid, {actor} has found{learned}.',
    ],
    narration: '{Actor} has learned {object}.',
  },
};

/** The player-facing verb word for a cell's display name (UI Law 14 — never a `snake_case` member). */
export const UNDERTAKING_VERB_WORDS: Readonly<Record<UndertakingVerbVariant, string>> = {
  create: 'Create', 'change:raise': 'Raise', 'change:lower': 'Lower', use: 'Use', 'control:claim': 'Claim', 'control:seize': 'Seize', destroy: 'Destroy', observe: 'Observe',
};

// ─── Per-cell line sets (THR-1429) ──────────────────────────────────

/**
 * Lines for one **cell** — a (verb, object type) pair — overriding the verb's own.
 *
 * The tables above are keyed by verb alone, which is right for the eleven object
 * types a verb reads the same way: founding a settlement and raising a company are
 * both a thing that comes to *stand* somewhere. It is wrong for the three cells this
 * table exists for. Nothing stands when a scholar learns a working, a curse is not
 * *founded*, and "{Object} stands at {place}, and it is {actor}'s doing" said about
 * a blessing on a friend is the register failure the verb-prose file was written to
 * prevent.
 *
 * Bounded on purpose (`CELL_OVERRIDE_MAX_PER_CELL`): a cell with no entry here is
 * still a complete undertaking and takes its verb's lines. This is where taste goes
 * when a cell earns it, not a second prose system.
 *
 * GM narration throughout, never in situ: the game says what happened, it does not
 * put the reader inside the moment.
 */
export const UNDERTAKING_CELL_PROSE: Readonly<Record<string, UndertakingVerbLineSet>> = {
  // A scholar learns a spell. The object is a working, and what changed is a mind.
  'cell.create.power': {
    activity: [
      '{Actor} is at {object} again, and the shape of it is starting to come.',
      'At {place} {actor} works at {object} the way other people work at stone.',
      '{Actor} has {object} half-learned, which is the dangerous half.',
    ],
    completion: [
      '{Actor} has {object} now, and the world is a little different for a mind that holds it.',
      '{Object} answers to {actor}. It did not, a season ago.',
      '{Actor} came away from {place} carrying {object}, and carries it still.',
    ],
    narration: '{Actor} has learned {object}.',
  },

  // A zealot blesses, a witch curses. One cell, and the sign decides which sentence
  // the world gets — but both are *put on somebody*, which is what these lines say.
  'cell.create.condition': {
    activity: [
      '{Actor} has been saying {owner}\'s name where names carry.',
      'At {place} {actor} is preparing something with {owner} in mind.',
      '{Actor} is at work on {object}, and it is meant for a person, not a place.',
    ],
    completion: [
      '{Object} is on {owner} now. {Actor} saw to it.',
      '{Owner} carries {object} out of {place}, and did not choose it.',
      'Whatever {actor} did at {place}, {owner} is wearing the result.',
    ],
    narration: '{Actor} has put {object} on {owner}.',
  },

  // Sealing a rival's art. The power is not taken — it is bound, which is worse to
  // live with and is the thing the lines have to get across.
  'cell.destroy.power': {
    activity: [
      '{Actor} is working against {object}, and {owner} has not felt it slip yet.',
      'At {place} {actor} ties a knot meant to hold {object} shut.',
      '{Actor} means to leave {owner} holding {object} and unable to use it.',
    ],
    completion: [
      '{Owner}\'s art is bound. {Actor} tied the knot.',
      '{Object} is still {owner}\'s, and it will not answer them. That is {actor}\'s doing.',
      '{Owner} reached for {object} at {place} and found nothing there to reach for.',
    ],
    narration: '{Actor} has sealed {object}, and {owner} keeps what will not answer.',
  },
};

/**
 * The line set a cell speaks with: its own if it has one, else its verb's.
 *
 * The single lookup both prose entry points go through, so an authored cell can
 * never speak with its verb's voice in one surface and its own in another.
 */
export function cellLineSet(
  variant: UndertakingVerbVariant,
  objectTypeId: string | undefined,
): UndertakingVerbLineSet {
  if (objectTypeId) {
    const override = UNDERTAKING_CELL_PROSE[`cell.${variant.replace(':', '_')}.${objectTypeId}`];
    if (override) return override;
  }
  return UNDERTAKING_VERB_PROSE[variant];
}
