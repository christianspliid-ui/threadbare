/**
 * Nudge stage display content — THR-775 (WS2 interface).
 *
 * Every player-facing word the nudge stage renders lives here (NFP #1): the
 * forecast tier words, the motive chips, the dimmed-card reasons, and the rider
 * labels. Changing how the stage *reads* is changing a string in this file,
 * never editing a component.
 *
 * **Words only.** The stage never renders a probability, a difficulty number, or
 * a forecast delta (ruling 6). The numerals exist in the stage model for the
 * designer view alone. Difficulty words come from `DIFFICULTY_WORD_BANDS`
 * (`nudge-constants.ts`) — the runtime band table — not from here.
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS2
 */

import type { ForecastTier } from '../types/traces/encounter-traces';
import type { MotiveSource } from '../engine/encounters/motiveClassifier';
import type { NudgeBlockedCode } from '../engine/encounters/nudges';
import type { NudgeRider } from '../types/unifiedAction';

/**
 * Forecast tier → the single word the player reads. This *is* the probability
 * surface: no percentage, no bar, no numeral ever renders beside it.
 */
export const FORECAST_TIER_WORDS: Readonly<Record<ForecastTier, string>> = {
  doomed: 'Doomed',
  perilous: 'Perilous',
  uncertain: 'Uncertain',
  favorable: 'Favorable',
  fated: 'Fated',
};

/** Motive chip copy — why this mortal is standing here (`classifyMotive`). */
export const MOTIVE_CHIP_LABELS: Readonly<Record<MotiveSource, string>> = {
  choice: 'BY CHOICE',
  mission: 'A MISSION',
  chance: 'CHANCE',
  divine: "THE GOD'S HAND",
};

/**
 * Fallback motive sentence per source, used when the encounter authored none.
 * Second person singular is deliberate — the player is the god being addressed.
 */
export const MOTIVE_FALLBACK_SENTENCES: Readonly<Record<MotiveSource, string>> = {
  choice: 'They came here wanting this.',
  mission: 'They were sent, and they came.',
  chance: 'They were simply here when it started.',
  divine: 'Your hand set this in motion.',
};

/**
 * The motive as an **introductory line**, printed above the scene's opening
 * prose (THR-972, director review 2026-08-02).
 *
 * The chip+sentence pair these replace sat *below* the prose, where it read as a
 * footnote on a scene the player had already finished reading. As an introduction
 * it does the job the classifier was built for: it frames the scene before the
 * scene arrives, so "why is this mortal here" is answered on the way in.
 *
 * **Register.** Plain and declarative — game prose, not novel prose
 * (`Docs/canon/prose.md` rule zero). These lines lead into authored fiction, so
 * anything lyrical here competes with the scene it is introducing. The director's
 * own examples set the ceiling for ornament and are preserved as the first variant
 * of `chance`, `mission`, and `divine`; only grammar and capitalization were
 * polished. The `choice` set is new authorship in the same register.
 *
 * `{actor}` is the acting mortal's name and `{mission}` the named errand — both
 * always substituted by the adapter, never rendered raw.
 *
 * Selection is a stable hash of the action id and step index — same encounter,
 * same line, every session. No rng draw (NFP #3).
 */
export const MOTIVE_INTRO_VARIANTS: Readonly<Record<MotiveSource, readonly string[]>> = {
  chance: [
    'While travelling, {actor} is faced with this:',
    'The road put this in front of {actor}.',
    '{actor} was simply here when it started.',
  ],
  mission: [
    'As part of {mission}, {actor} faces a challenge.',
    '{mission} brought {actor} to this.',
    'This stands between {actor} and {mission}.',
  ],
  divine: [
    'You have led {actor} to this moment.',
    'Your hand set {actor} on this road.',
    '{actor} stands here because you willed it.',
  ],
  choice: [
    '{actor} chose this road.',
    '{actor} came here wanting this.',
    'No one sent {actor}. They came anyway.',
  ],
};

/**
 * Stands in for `{mission}` when a mission-classified motive names no errand the
 * graph can resolve — a contribution whose provenance node has been culled, or a
 * receipt that recorded a weight without a node id.
 *
 * A generic noun rather than a raw placeholder: the classification is still true
 * (they were sent), only the errand's name is missing, and leaking `{mission}`
 * onto the stage would be worse than naming it vaguely (NFP #4).
 */
export const MOTIVE_MISSION_FALLBACK = 'the work they took on';

/**
 * Drawn immediately before the difficulty word, inside one frame (THR-972).
 *
 * The director's find: *"The difficulty cant stand alone without some
 * explanation."* A bare `FAIR` beside the reach reads as a description of the
 * scene rather than as the bar the mortal must clear. The scales say "this is
 * being weighed" without spending a word, and the frame binds glyph and word into
 * a single unit the eye takes in at once.
 */
export const TEST_GLYPH = '⚖';

/** Accessible name for the framed test unit — the glyph alone says nothing aloud. */
export const TEST_UNIT_LABEL = 'Test difficulty';

/**
 * Why a dimmed card cannot be played. Only `essence_unavailable` reaches the
 * player stage — the other codes are withheld (ruling 4) and read in the
 * designer view, where the full lexicon is still wanted.
 */
export const NUDGE_BLOCKED_REASONS: Readonly<Record<NudgeBlockedCode, string>> = {
  essence_unavailable: 'Not enough essence',
  sphere_locked: 'Sphere beyond your reach',
  unlock_missing: 'Not yet yours to give',
  trait_missing: 'They do not carry this',
};

/** Rider display names — designer view only; riders never announce themselves. */
export const NUDGE_RIDER_LABELS: Readonly<Record<NudgeRider, string>> = {
  no_crit_fail: 'No catastrophe',
  floor_at_cost: 'Floors at a cost',
  all_or_nothing: 'Widens both ends',
};

/** Cost rendered in words. A free card says so rather than showing a zero. */
export const NUDGE_FREE_COST_LABEL = 'Free';

/** Heading above the hand. */
export const NUDGE_HAND_HEADING = 'What you can do';

/** The commit verb — the player never "attacks", they let the world resolve. */
export const NUDGE_COMMIT_LABEL = 'Let fate decide';

/** Shown in place of the hand when every authored card is withheld. */
export const NUDGE_EMPTY_HAND_LINE = 'Nothing here answers to you. Let it play out.';

/**
 * How long the pre-roll rejection toast lives. Long enough to read, short
 * enough that it is gone before the next encounter surfaces.
 */
export const NUDGE_REJECT_TOAST_MS = 6000;

// ─── Derived factor lines (THR-892) ────────────────────────────────

/**
 * How a derived factor line reads, per modifier source and direction.
 *
 * **Canon rule 1 lives here.** Every template names its source *inside the
 * sentence* — "Sera Vance carries the Rusted Key" — never as a label beside a
 * number. That is why these are sentence templates rather than a `{label}:
 * {value}` pair: the key:value shape is the unfinished-UX pattern the project
 * rejects, and a table of half-sentences is the only way to keep it impossible.
 *
 * `{actor}` is the acting mortal's name, `{source}` the named cause. Both are
 * always substituted; a template referencing neither is legal (the rule line).
 *
 * Register is plain and descriptive on purpose — these sit under the prose, not
 * beside it, and a lyrical factor line competes with the scene for attention.
 */
export const DERIVED_FACTOR_SENTENCES: Readonly<
  Record<string, { readonly for: string; readonly against: string }>
> = {
  equipment: {
    for: '{actor} carries {source}.',
    against: '{source} hampers {actor}.',
  },
  trait: {
    for: '{actor} is {source}.',
    against: 'Being {source} tells against {actor}.',
  },
  terrain: {
    for: 'The {source} favours the attempt.',
    against: 'The {source} works against it.',
  },
  faction: {
    for: '{source} holds this ground.',
    against: '{source} holds this ground, and no friend of {actor}.',
  },
  sphere: {
    for: 'The {source} sphere runs with this.',
    against: 'The {source} sphere runs against this.',
  },
  effect: {
    for: '{source} steadies {actor}.',
    against: '{source} drags at {actor}.',
  },
  divine: {
    for: 'Your attention rests on {actor}.',
    against: 'Your attention weighs on {actor}.',
  },
  rule: {
    for: 'Something has bent the rules of this place.',
    against: 'Something has bent the rules of this place.',
  },
  // THR-1243. `{source}` is the *emitting agent*, not an item: an aura is the one
  // factor sourced from somebody else standing nearby, and naming the artifact
  // would credit gear the actor does not carry. Without this pair the modifier
  // would still move the roll while `deriveContributionLines` dropped its line —
  // an unnamed number changing the odds, which is what the factor panel exists
  // to prevent.
  aura: {
    for: 'Having {source} near steadies {actor}.',
    against: 'Having {source} near unsettles {actor}.',
  },
};

/**
 * The agent's own capability in the step's reach — the "first line" of the panel.
 *
 * `{word}` is the reach's tier word (`DOMAIN_WORD_SCALES`), `{reach}` the reach
 * itself. Rendered lowercase so the sentence reads as prose rather than as a
 * stat readout.
 */
export const DERIVED_SKILL_SENTENCE = '{actor} is {word} in {reach}.';

/** Stand-in when the acting node has no resolvable name (NFP #4, never throws). */
export const DERIVED_FACTOR_ACTOR_FALLBACK = 'The acting hand';

// ─── Whisper reveal (THR-1179) ───────────────────────────────────────

/**
 * What a committed Whisper shows about the step *after* this one.
 *
 * `{reach}` is the coming step's reach, `{word}` its difficulty word — words on
 * both sides, never digits (UI Law 13/14). The sentence deliberately reads as a
 * glimpse rather than a readout: the card sells foreknowledge, and a line shaped
 * like a stat block would sell a spreadsheet row instead.
 */
export const WHISPER_NEXT_STEP_SENTENCE =
  'What comes after this will ask for {reach}, and it looks {word}.';

/**
 * The reveal when this step is the last one.
 *
 * Still a real answer, which is why the card does not simply render nothing
 * here: "there is no next demand" is exactly the thing a god deciding how much
 * to spend on *this* step wanted to know, and withholding it would make the
 * Whisper feel broken on the one step where its answer is most actionable.
 */
export const WHISPER_NO_NEXT_STEP_SENTENCE =
  'Nothing waits beyond this. What is spent here is spent on the whole of it.';

/**
 * The reveal when a next step exists but its demand is not yet fixed — the way
 * ahead branches on what happens here.
 *
 * Without this line the Whisper would have to choose between two lies on a
 * branching template: claiming nothing follows, or naming one branch's demand as
 * though it were settled. Saying "it turns on this" is both true and useful — it
 * tells the god that this step is the hinge, which is worth knowing.
 */
export const WHISPER_UNSETTLED_NEXT_STEP_SENTENCE =
  'What comes after this is not yet settled. It turns on how this goes.';
