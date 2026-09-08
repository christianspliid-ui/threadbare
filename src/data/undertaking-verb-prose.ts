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

/**
 * The verb as the roster's doing-line says it (THR-1434): *raising a company*,
 * *watching the ruin*. Lowercase, present participle, a game word rather than the
 * verb's own name where the name would read like a menu (`use` → *working*).
 */
export const UNDERTAKING_VERB_GERUNDS: Readonly<Record<UndertakingVerbVariant, string>> = {
  create: 'raising', 'change:raise': 'bettering', 'change:lower': 'undermining', use: 'working',
  'control:claim': 'claiming', 'control:seize': 'seizing', destroy: 'breaking', observe: 'watching',
};

/**
 * The verb as the ledger names a finished deed (THR-1434): *Founded the Saltway*,
 * *Seized the Old Mill*. Capitalised, past tense, one word.
 */
export const UNDERTAKING_VERB_DEEDS: Readonly<Record<UndertakingVerbVariant, string>> = {
  create: 'Founded', 'change:raise': 'Raised', 'change:lower': 'Undermined', use: 'Worked',
  'control:claim': 'Claimed', 'control:seize': 'Seized', destroy: 'Broke', observe: 'Watched',
};

/**
 * Deed words for the cells whose verb reads wrong on a ledger — a cure is not a
 * breaking, a learned working was not founded. Bounded on purpose, like the per-cell
 * line sets above: a cell with no entry takes its verb's word.
 */
export const UNDERTAKING_CELL_DEEDS: Readonly<Record<string, string>> = {
  'cell.create.power': 'Learned',
  'cell.destroy.power': 'Sealed',
  'cell.create.condition': 'Laid',
  'cell.destroy.condition': 'Cured',
  'cell.destroy.mortal': 'Slew',
  'cell.create.company': 'Raised',
  'cell.create.army': 'Raised',
  'cell.create.network': 'Founded',
  'cell.destroy.location': 'Razed',
  'cell.destroy.standing': 'Soured',
  'cell.destroy.agreement': 'Forgave',
  'cell.use.agreement': 'Called in',
  'cell.observe.area': 'Charted',
  // The ownership of people-things (THR-1438). *Claimed the Grey Company* reads like a
  // land grant; a command is **taken**. And standing for a seat is not claiming it —
  // the ledger has to say the bid, because the bid is all that happened.
  'cell.control_claim.company': 'Took command of',
  'cell.control_claim.army': 'Took command of',
  'cell.control_claim.faction': 'Stood for',
  'cell.observe.army': 'Scouted',
  // Yield and leverage (THR-1439). *Worked the Greycity* says nothing about what a
  // harvest is, and *Seized* a secret is what you do to a mill — a secret is **stolen**.
  // `raise × Route` keeps its verb's word: a lane really was raised.
  'cell.use.location': 'Drew the yield of',
  'cell.control_seize.agreement': 'Stole',
  'cell.use.standing': 'Called in',
};

/** The ledger's word for a finished cell: its own if it has one, else its verb's. */
export function deedWordFor(cellId: string, variant: UndertakingVerbVariant): string {
  return UNDERTAKING_CELL_DEEDS[cellId] ?? UNDERTAKING_VERB_DEEDS[variant];
}

/**
 * The card's name for the cells whose generic phrase is a lie about what happens
 * (THR-1438; UI Laws 13/14 — the game's word, never the machinery's).
 *
 * *Seize a company* is a **mutiny** and *Seize a faction* is a **usurpation**; those
 * are different acts with different preconditions, and a codex that calls both of them
 * "seizing" has told the player nothing about either. *Claim a faction* is worse than
 * vague — it is wrong: a candidacy does not hand anybody a faction, it puts a name
 * forward and waits for the seat to fall empty.
 *
 * Bounded on purpose, like the deed words and the per-cell line sets above: a cell
 * with no entry takes `<Verb> <a kind>`, which reads correctly for the other 49.
 */
export const UNDERTAKING_CELL_PHRASES: Readonly<Record<string, string>> = {
  'cell.control_claim.company': 'Take command of a company',
  'cell.control_seize.company': 'Mutiny against a commander',
  'cell.control_claim.army': 'Take command of an army',
  'cell.control_seize.army': 'Mount a coup',
  'cell.control_claim.faction': 'Stand for a seat',
  'cell.control_seize.faction': 'Usurp a leader',
  'cell.observe.army': 'Scout an army',
  // Yield and leverage (THR-1439). "Use a location" is machinery talking; the game's
  // word for what happens is a **harvest**. "Seize an agreement" is worse — the object
  // is a secret and the act is theft, and the card has to say so before the player
  // picks it. "Use a standing" is calling in a favour, which is the only phrase anyone
  // outside the code would ever use for it.
  'cell.use.location': 'Draw a holding\'s yield',
  'cell.control_seize.agreement': 'Steal a secret',
  'cell.use.standing': 'Call in a favour',
  'cell.use.agreement': 'Press what you hold',
  'cell.change_raise.route': 'Widen a trade lane',
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

  // ─── Rings and the plot (THR-1430) ───────────────────────────────
  //
  // The catalogue's word is **Network** and it is what reaches any surface; "ring"
  // is this file's gloss and appears in no line. What the prose has to carry is the
  // one thing that makes a network different from a company: it is not in a place.

  'cell.create.network': {
    activity: [
      '{Actor} has been having quiet words with people at {place} who are good at listening.',
      'At {place} {actor} is finding out who talks, and to whom.',
      '{Actor} is putting something together that has no name and no roof.',
    ],
    completion: [
      '{Actor} has people now — in {place} and past it — who hear things and say them only to {actor}.',
      'What {actor} built at {place} does not gather anywhere. It is simply in more places than one.',
      '{Actor} has ears out. They are not all in the same town.',
    ],
    narration: '{Actor} has built a network.',
  },

  'cell.change_raise.network': {
    activity: [
      '{Actor} is adding to {object}, quietly, one conversation at a time.',
      'Word goes out from {actor} that there is a place for the right sort.',
      '{Actor} wants {object} wider than it is.',
    ],
    completion: [
      '{Object} reaches further than it did. {Actor} saw to that.',
      'There are more people in {object} now, and they do not all know each other.',
      '{Actor} has widened {object}. It covers ground it did not cover.',
    ],
    narration: '{Actor} has widened {object}.',
  },

  'cell.use.network': {
    activity: [
      '{Actor} has put a question to {object} and is waiting on the answer.',
      'Somewhere out along {object}, someone is paying attention on {actor}\'s behalf.',
      '{Actor} is listening through other people\'s ears.',
    ],
    completion: [
      'Word reaches {actor} of {object}. Nobody who told it knows who else was listening.',
      '{Actor} knows something now, and was never anywhere near where it happened.',
      'It came back to {actor} the way things do when enough people owe you.',
    ],
    narration: '{Actor} has learned something through {object}.',
  },

  // The plot. The lines never let the killing become a fight, and they never make it
  // sound clean: the register is a narrator reporting a murder, from outside.
  'cell.destroy.mortal': {
    activity: [
      '{Actor} has been finding out where {object} sleeps, and who is near.',
      '{Actor} is not arguing with {object} any more. That part is over.',
      'Something is being arranged about {object}, and {object} does not know it.',
    ],
    completion: [
      '{Object} is dead, and the night keeps the name.',
      '{Object} is dead. A name is on the wind, and it is {actor}\'s.',
      '{Object} lives, and knows now exactly who wanted otherwise.',
      '{Actor} is caught at it. {Object} is still breathing.',
    ],
    narration: '{Actor} meant {object} dead.',
  },

  // ─── The ownership of people-things (THR-1438) ───────────────────
  //
  // Five cells where the verb's own word is a lie about what happened. *Seizing* a
  // company is a mutiny and *seizing* a faction is a usurpation; *claiming* a faction
  // is standing for a seat you may never get. The generic lines would say a thing
  // changed hands. What these say is that people chose sides.

  'cell.control_claim.company': {
    activity: [
      'Nobody is giving the orders in {object}, and {actor} has started giving them anyway.',
      'At {place} {actor} is doing what the captain of {object} used to do.',
      '{Object} is looking at {actor} when there are decisions to make.',
    ],
    completion: [
      '{Object} answers to {actor} now. Nobody appointed them.',
      '{Actor} has {object}. The last one who did is not coming back.',
      'The command of {object} sat empty long enough that {actor} took it.',
    ],
    narration: '{Actor} has taken command of {object}.',
  },

  'cell.control_seize.company': {
    activity: [
      '{Actor} has been talking to {object} about {owner}, one at a time.',
      'Something is being counted at {place}, and it is how many of {object} would follow {actor}.',
      '{Object} is coming apart, and {actor} means to be holding it when it does.',
    ],
    completion: [
      '{Object} follows {actor} now. {Owner} is still with them, and rides at the back.',
      '{Actor} took {object} out from under {owner}. Nobody drew a blade; it was worse than that.',
      '{Owner} gave an order at {place} and {object} looked at {actor} instead.',
    ],
    narration: '{Actor} has turned {object} against {owner}.',
  },

  'cell.control_seize.army': {
    activity: [
      '{Actor} is asking, quietly, whether {owner} should be leading {object} at all.',
      'At {place} there are two answers to every order, and one of them is {actor}\'s.',
      '{Actor} is counting captains, not swords.',
    ],
    completion: [
      '{Object} is {actor}\'s. It was decided by the people who feed it, not on a field.',
      '{Actor} reached for {object} and closed a hand on nothing. {Owner} knows the name now.',
      'The banner over {object} did not change. Who stands under it did.',
    ],
    narration: '{Actor} moved against {owner} for {object}.',
  },

  'cell.control_claim.faction': {
    activity: [
      '{Actor} is letting it be known, in {object}, that they would take the seat.',
      'At {place} {actor} is being seen with the people who decide such things.',
      '{Actor} wants {object} and has stopped pretending otherwise.',
    ],
    completion: [
      '{Object} has no head, and {actor}\'s name is the one being said.',
      '{Actor} has stood for {object}. Standing is not sitting; the seat is still empty.',
      'When {object} chooses, {actor} will be on the list. That is what was won at {place}.',
    ],
    narration: '{Actor} has stood for the head of {object}.',
  },

  'cell.control_seize.faction': {
    activity: [
      '{Actor} is making the case, to anyone in {object} who will hear it, that {owner} has held it long enough.',
      'At {place} {actor} is counting who in {object} would stay standing if {owner} sat down.',
      '{Actor} means to have {object}, and is not waiting to be given it.',
    ],
    completion: [
      '{Object} is {actor}\'s. {Owner} still walks about, and is nobody\'s idea of a leader now.',
      '{Actor} moved on {owner} and {object} did not move with them. It cost.',
      '{Actor} pulled at {object} until it tore. Half of it is following them out.',
    ],
    narration: '{Actor} moved on {owner} for {object}.',
  },

  // ─── Yield and leverage (THR-1439) ───────────────────────────────
  //
  // Four cells where the verb's own lines say the wrong thing entirely. "{Actor} is
  // putting {object} to use" said about a town is a sentence about a tool; a harvest is
  // something done *to* a place that has people in it, and the lines have to leave the
  // cost visible. Likewise: seizing an Agreement is a theft, and using a Standing is
  // asking somebody for something.

  // Holding court, taxing a market, drawing a tithe. The town is present in every line
  // — that is the whole difference between this and taking coins out of a box.
  'cell.use.location': {
    activity: [
      '{Actor} is holding court at {object}, and the queue outside is people who owe.',
      'At {object} {actor} has the books open and the market is being counted.',
      '{Actor} is drawing what {object} owes them, and {object} is finding out how much that is.',
    ],
    completion: [
      '{Actor} has taken the season out of {object}. The town is poorer and knows who by.',
      'What {object} had, {actor} has. The market will be thinner for a while.',
      '{Actor} came away from {object} heavier than they went in, and {object} noticed.',
      '{Actor} leaned on {object} and got nothing worth the leaning. {Object} still paid.',
    ],
    narration: '{Actor} has drawn the yield of {object}.',
  },

  // Expansion work on a lane. Nothing is *built*; what changes is how much moves.
  'cell.change_raise.route': {
    activity: [
      '{Actor} is putting word out along {object} that there is room for more.',
      'At {place} {actor} is talking to carters about {object}, and about how often.',
      '{Actor} means more to move along {object} than moves along it now.',
    ],
    completion: [
      'More goes along {object} than did. {Actor} arranged it.',
      '{Object} is busier. Whoever tolls it will notice before they know why.',
      '{Actor} has widened what {object} carries; the road itself has not changed at all.',
    ],
    narration: '{Actor} has made {object} carry more.',
  },

  // Theft. The register has to make it clear the holder *lost* it — a copied secret
  // would be a different, much smaller act.
  'cell.control_seize.agreement': {
    activity: [
      '{Actor} is working out what {owner} knows, and where {owner} keeps it.',
      'At {place} {actor} is buying the same story {owner} paid for.',
      '{Actor} wants what {owner} is holding, and wants {owner} not to hold it.',
    ],
    completion: [
      '{Actor} knows it now, and {owner} does not. That is the whole of what changed.',
      'What {owner} had over somebody, {actor} has. {Owner} is holding nothing.',
      '{Actor} took it clean. {Owner} will reach for it one day and find it gone.',
    ],
    narration: '{Actor} has taken from {owner} the thing {owner} knew.',
  },

  // Calling in a favour. Standing spent, and somebody now owes — the debt is the point,
  // not the asking.
  'cell.use.standing': {
    activity: [
      '{Actor} is calling on {object}, which is a thing you only get to do so often.',
      'At {place} {actor} is asking for something, and spending to ask.',
      '{Actor} has decided what {object} is for, and is using it now.',
    ],
    completion: [
      '{Actor} asked, and is owed. {Object} is a little thinner for the asking.',
      'Somebody owes {actor} now. It cost {actor} some of {object} to arrange.',
      '{Actor} spent {object} on a debt, which is what {object} was always for.',
      '{Actor} asked and was heard out and nothing came of it. {Object} is spent anyway.',
    ],
    narration: '{Actor} has called in a favour.',
  },

  'cell.observe.army': {
    activity: [
      '{Actor} is somewhere above {object}, counting.',
      '{Actor} has been following {object} at a distance that keeps them alive.',
      'At {place} {actor} is learning where {object} is, and where it is going.',
    ],
    completion: [
      '{Actor} knows where {object} stands, and {object} does not know it was watched.',
      'The country {object} is crossing is on {actor}\'s map now.',
      '{Actor} came back from {place} knowing what {object} is and where it stands.',
    ],
    narration: '{Actor} has scouted {object}.',
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
