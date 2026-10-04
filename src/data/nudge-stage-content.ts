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
import type { NudgeRider, UnifiedActionOutcome } from '../types/unifiedAction';

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
 * The **stakes line**'s lead clause — why this mortal is here (THR-1727).
 *
 * Replaces the THR-972 motive intro line. The line reads
 * `[lead] [actor] must [goal] — or [risk].`, so each lead ends in a comma and
 * hands over to the actor's name. `{mission}` and `{location}` are always
 * substituted by `buildStakesLine`; a lead whose token cannot be filled is
 * dropped rather than printed raw (NFP #4).
 *
 * **Register.** Plain, game prose (`Docs/canon/prose.md` rule zero).
 * "As part of {mission}," is Christian's own phrasing and stays. The `divine`
 * lead is the one place the god is addressed in second person (Law 42).
 *
 * One variant per source at ship; authors may add more. Selection is a stable
 * hash of the action id, never an rng draw (NFP #3). An empty list means
 * "no lead", never a divide by zero.
 */
export const STAKES_LEAD_VARIANTS: Readonly<Record<MotiveSource, readonly string[]>> = {
  mission: ['As part of {mission},'],
  divine: ['Led here by your hand,'],
  choice: ['Choosing this road,'],
  chance: ['Passing through {location},'],
};

/**
 * The band a result line is chosen by: the action's final outcome, plus the
 * step-level `near_miss` so a caller holding a step outcome can ask too.
 */
export type StakesResultBand = UnifiedActionOutcome | 'near_miss';

/**
 * The **result line** — the stakes line's ending form, chosen by outcome band
 * (THR-1727). `{actor}` is the mortal; `{won}` / `{lost}` / `{lostBadly}` are
 * the template's authored endings, already resolved against the fork arm the
 * encounter ran on. `{lostBadly}` falls back to `{lost}` when unauthored.
 *
 * The line names the story's ending, never its consequences — what the cost
 * was lives in the aftermath chips (Law 56).
 */
export const STAKES_RESULT_FORMS: Readonly<Record<StakesResultBand, string>> = {
  critical_success: '{actor} {won}.',
  success: '{actor} {won}.',
  contested_won: '{actor} {won}.',
  success_at_cost: '{actor} {won}, at a cost.',
  near_miss: '{actor} nearly {won}, but {lost}.',
  failure: '{actor} {lost}.',
  contested_lost: '{actor} {lost}.',
  critical_failure: '{actor} {lostBadly}.',
};

/** Cap on `goal` and `won`, so the stakes line stays one line at 1920 wide. */
export const STAKES_GOAL_MAX_CHARS = 60;
/** Cap on `risk`, `lost` and `lostBadly`. */
export const STAKES_RISK_MAX_CHARS = 60;
/**
 * Cap on the assembled opening line, lead and actor name included. Over it, the
 * lead is dropped first; the line is never truncated mid-word.
 */
export const STAKES_LINE_MAX_CHARS = 150;
/**
 * Words the authored stakes parts may not contain: the mortal is the subject of
 * their own stakes, never "the traveler", and the god is not in them at all.
 * Matched as whole words, case-insensitive, by the validator.
 */
export const STAKES_FORBIDDEN_WORDS: readonly string[] = ['traveler', 'god', 'you', 'your'];

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

// ─── Reading marks (THR-1478) ────────────────────────────────────────
//
// Director ask, 2026-09-12: the difficulty and the forecast both lose their
// words on the surface and become marks. The words did not die — they moved to
// the accessible name, the tooltip, and the first-contact legend below. What
// lives here is the *ladder colour* each mark takes; the shapes themselves are
// `DifficultyScales` and `ForecastDie` in the shared icon set, and they are
// colour-agnostic by design (`currentColor`), so this is the one place the
// difficulty's colour reading is decided (NFP #1).

/**
 * Difficulty band → colour, on the same loss→gold→gain ladder the forecast and
 * the consequence chips already read.
 *
 * The direction is the mortal's, not the god's: a `gentle` step is good news, so
 * it takes the gain colour, and `severe` takes loss at full strength. `steep`
 * sits at the dimmer loss so the two hard bands stay distinguishable by more
 * than tilt alone.
 */
export const DIFFICULTY_BAND_COLORS: Readonly<Record<string, string>> = {
  gentle: 'rgb(var(--veil-gain-rgb) / 0.85)',
  fair: 'rgb(var(--veil-gold-rgb) / 0.85)',
  steep: 'rgb(var(--veil-loss-rgb) / 0.8)',
  severe: 'rgb(var(--veil-loss-rgb) / 1)',
};

/** Fail-soft (NFP #4): an unbanded word reads as gold, never as an unstyled mark. */
export const DIFFICULTY_BAND_COLOR_FALLBACK = 'rgb(var(--veil-gold-rgb) / 0.85)';

/**
 * Law 51 — the stage's reading legend is dismissed once, not once per encounter.
 * Namespaced alongside `threadbare.ui.consequenceLegendSeen`.
 */
export const NUDGE_READING_LEGEND_STORE_KEY = 'threadbare.ui.nudgeReadingLegendSeen';

export interface NudgeReadingLegendEntry {
  readonly id: 'forecast' | 'balance';
  /** Tooltip registry id — the legend teaches, the tooltip explains (Law 17). */
  readonly tooltipId: string;
  /** One or two words. A legend names a vocabulary; it does not define it. */
  readonly label: string;
}

/**
 * Law 12 — the three readings the merged header now carries as marks, named at
 * first contact so none of them has to be inferred from context.
 *
 * THR-1724 dropped `difficulty` ("how hard"): the header no longer draws a
 * difficulty mark, because the forecast already weighs it.
 *
 * `balance` is the entry that replaced the per-sentence "The Balance" hover
 * (THR-1478 item 5): the factor lines carry their polarity in their own colour,
 * and a colour vocabulary belongs in the legend rather than in a rulebook
 * tooltip repeated on every line.
 */
export const NUDGE_READING_LEGEND_ENTRIES: readonly NudgeReadingLegendEntry[] = [
  { id: 'forecast', tooltipId: 'ui.nudge_forecast', label: 'how it looks' },
  { id: 'balance', tooltipId: 'ui.nudge_factors', label: 'what weighs' },
];

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

/**
 * The commit verb with a hand staged — the player never "attacks", they play
 * their hand and let the world resolve. THR-1714: it names the act, because
 * "Let fate decide" read as *skip and roll randomly*. Also the veil's
 * authored-choice commit, where choosing an option is playing your hand.
 * Not "Whisper": that is already a nudge-card keyword.
 */
export const NUDGE_COMMIT_LABEL = 'Play your hand, let fate answer';

/** The commit verb with nothing staged — silence is a choice with odds (THR-1714). */
export const NUDGE_COMMIT_LABEL_SILENT = 'Stay silent, let fate answer';

/**
 * The moved-forecast note beside the pill (THR-1714). Present tense and names
 * its cause: the old "was Perilous" read as *the roll already happened*.
 */
export const NUDGE_FORECAST_SHIFT_LINE = 'your hand: {from} → {to}';

/**
 * A meeting card that argues for a pole says which (THR-1714). `{word}` is the
 * axis's own sheet word (`getAxisByValuePair`) — a fact about the card, like
 * its cost, so the reveal's "Fate went with you" can be traced to it.
 */
export const NUDGE_LEAN_TAG = 'Leans {word}';

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
  // THR-1483. `{source}` is the *condition's* name — `Under Watch`, `A Tended
  // Shrine` — so the line names what has happened to the place rather than the
  // place itself, which is the part that varies run to run. Distinct from
  // `terrain` on purpose: the moor is always the moor, but a watcher posted here
  // last week is exactly the kind of fact a player can act on or wait out.
  //
  // Required, not decorative: `deriveContributionLines` drops any contribution
  // whose kind has no sentence pair, so without this the modifier would move the
  // roll while no line explained it — an unnamed number changing the odds, which
  // is what the factor panel exists to prevent.
  condition: {
    for: '{source} favours the attempt here.',
    against: '{source} tells against it here.',
  },
  // THR-1670. `{source}` is the *spell's* name — the mortal reaches for it because
  // the odds looked bad, and the same roll decides the step and the spell. A cast
  // bonus is never negative, so the `against` half exists only to satisfy the pair.
  spell: {
    for: '{actor} is casting {source}.',
    against: '{actor} is casting {source}.',
  },
};

/**
 * The agent's own capability in the step's reach — the "first line" of the panel.
 *
 * `{word}` is the reach's tier word (`DOMAIN_WORD_SCALES`), lowercased so the
 * sentence reads as prose rather than as a stat readout. `{reach}` is the reach's
 * display label — title-case, matching the reach chip the same stage renders, so
 * the domain reads as a domain and not as a place the actor is standing in.
 *
 * Two shapes, because the tier vocabulary mixes word classes (THR-1494). An
 * adjective takes no article; a noun must have one, or the line reads "Vara is
 * oracle in eye." `DOMAIN_TIER_WORD_FORMS` says which a word is and, for a noun,
 * which article — the producer never guesses from spelling.
 */
export const DERIVED_SKILL_SENTENCE = '{actor} is {word} in {reach}.';

/** The noun-form counterpart — `{article}` comes from `DOMAIN_TIER_WORD_FORMS`. */
export const DERIVED_SKILL_SENTENCE_ARTICLED = '{actor} is {article} {word} in {reach}.';

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
