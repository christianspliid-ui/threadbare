/**
 * Nudge Model constants — THR-773 (WS0 engine substrate).
 *
 * Every magic number the nudge model, the broken-mortal state, and the god's
 * restore action depend on lives here (NFP #1). Changing the feel of any of it
 * is changing a number in this file, never rewriting logic.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
 * Program: `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (THR-772 epic)
 *
 * Revert path: the whole feature is absent-safe. `BROKEN_GATE_ENABLED = false`
 * kills the broken gate; setting the three erosion multipliers to 1 / 1 / 0
 * restores the flat pre-WS0 erosion; a step with no `nudges[]` never enters the
 * nudge path at all. Full rollback is constants-only.
 */

import type { NudgeRider, StepOutcome } from '../types/unifiedAction';
import type { QuintessenceThresholdState } from '../types/resolution';

// ─── Broken mortal state ─────────────────────────────────────────────

/**
 * Master switch for the broken-state *consequences* — candidacy exclusion and
 * the homeward drift pull. **Ships false.**
 *
 * The gate must never go live before the road out of it exists: flipping this
 * to `true` is a WS5 Done-when, gated on the rebuild encounters being authored.
 * Failure is plot, not punishment — a mortal locked out of all candidacy with
 * nothing to draw is stun-locked, not broken.
 *
 * Erosion scaling, the `brokenSince` bookkeeping, and every trace stay live
 * regardless, so telemetry accrues before the gate ever opens.
 */
export const BROKEN_GATE_ENABLED = false;

/** Threshold state at which a mortal enters the broken state. */
export const BROKEN_ENTER_STATE: QuintessenceThresholdState = 'critical';

/**
 * Threshold state a broken mortal must climb *past* before re-entering the
 * story. Deliberately above `BROKEN_ENTER_STATE` — the gap is the hysteresis
 * that stops an agent flickering in and out of the state tick by tick.
 */
export const BROKEN_EXIT_STATE: QuintessenceThresholdState = 'strained';

/**
 * Threshold states ordered worst → best. Used to compare a live state against
 * the enter/exit constants without hard-coding either comparison.
 */
export const QUINTESSENCE_STATE_ORDER: readonly QuintessenceThresholdState[] = [
  'broken',
  'critical',
  'weakened',
  'strained',
  'healthy',
];

// ─── Erosion scaling ─────────────────────────────────────────────────
//
// erosion = QUINTESSENCE_ENCOUNTER_FAILURE_EROSION
//           × bandMult × attendedMult × (1 + difficulty × DIFFICULTY_EROSION_SCALE)
//
// The base is the existing `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION` (0.03,
// `src/types/quintessence.ts`) — unchanged. These multipliers scale it.

/** Multiplier applied to a catastrophic (critical_failure) outcome. */
export const EROSION_BAND_MULT_CRITFAIL = 5;

/** Multiplier applied when the failing encounter was *attended* (story_beat). */
export const EROSION_ATTENDED_MULT = 2;

/** +100% erosion at difficulty 1.0. */
export const DIFFICULTY_EROSION_SCALE = 1.0;

/**
 * Erosion clamps the *resulting ratio* at this floor — erosion alone can never
 * reach zero. Death stays owned by the existing zero-state paths.
 */
export const QUINTESSENCE_RATIO_FLOOR = 0.02;

/**
 * Erosion multiplier per step outcome. Only failing outcomes erode at all, so
 * the success side is 0 (never reached — the call site gates on failure — but
 * stated rather than left implicit).
 */
export const EROSION_BAND_MULT: Readonly<Record<StepOutcome, number>> = {
  critical_success: 0,
  success: 0,
  success_at_cost: 0,
  near_miss: 1,
  failure: 1,
  critical_failure: EROSION_BAND_MULT_CRITFAIL,
};

/** Per rebuild-encounter success restore (band-scaled by WS5 content). */
export const REBUILD_RESTORE_BASE = 0.06;

// ─── Broken drift (movement pull) ────────────────────────────────────
//
// A broken mortal stops ranging. The pull is a scoring bonus, never a movement
// override: it makes near, tended places outscore far and wild ones, and the
// agent's own scorer still decides. Same additive channel as the Draw Together
// convergence pull (`DRAW_TOGETHER_PULL_WEIGHT`), and comparable in magnitude.

/**
 * Weight of the stay-close pull, applied as `weight / (1 + hexDistance)`. At
 * distance 0 it is the full weight; it decays away with every hex of travel.
 */
export const BROKEN_DRIFT_PULL_WEIGHT = 2.0;

/**
 * Flat bonus for a candidate at a settlement — a tended place with people in it
 * is where someone worn to nothing goes.
 */
export const BROKEN_DRIFT_SETTLEMENT_BONUS = 1.0;

/** Location subtypes that count as "safe" for the drift pull. */
export const BROKEN_DRIFT_SAFE_SUBTYPES: ReadonlySet<string> = new Set([
  'hamlet',
  'town',
  'city',
  'capital',
]);

// ─── Nudge riders ────────────────────────────────────────────────────

/**
 * Strongest-single-rider order, strongest first. When a player commits several
 * nudges carrying riders, exactly one applies — the earliest in this list.
 * Riders never stack, and they never touch the d100.
 */
export const NUDGE_RIDER_PRIORITY: readonly NudgeRider[] = [
  'no_crit_fail',
  'floor_at_cost',
  // The Gambit sits last on purpose (THR-885). It is the only rider that can
  // worsen an outcome, so when a player has also committed a protective card the
  // protection wins — a hand cannot accidentally cancel its own safety net.
  'all_or_nothing',
];

// ─── Sphere signature discount ───────────────────────────────────────

/**
 * The Signature (THR-885) — essence knocked off a card whose sphere matches one
 * the ascendant is aligned to. A discount, not a gate: full sphere *gating*
 * stays parked with THR-870.
 */
export const SPHERE_DISCOUNT = 1;

/**
 * Floor the discount can never push a card below. Free is an authored decision
 * (`essenceCost: 0` on a trait card), never something a discount arrives at —
 * otherwise a sphere-matched card silently becomes a different kind of card.
 */
export const SPHERE_DISCOUNT_MIN_COST = 1;

// ─── The Repertoire (THR-887) ────────────────────────────────────────

/**
 * Essence knocked off a card signed by the ascendant's **secondary** sphere.
 *
 * Distinct from {@link SPHERE_DISCOUNT} by *layer*, not by arithmetic — both are
 * 1, and that is a coincidence worth keeping visible rather than collapsing.
 * `SPHERE_DISCOUNT` is THR-885's per-encounter price cut, applied by
 * `effectiveNudgeCost` to a card in an authored step hand. This one is the
 * repertoire layer: it prices a *library* card the god holds because their
 * secondary sphere signs its type. Tuning one should not silently move the other.
 *
 * Primary-sphere cards are full strength (no discount, no surcharge) — the
 * primary's reward is *access*, per plan Decision 7.1.
 */
export const SECONDARY_SPHERE_DISCOUNT = 1;

/**
 * Forecast penalty carried by an echo card returned from a **somber** age
 * (plan Decision 7.4). The scarred card is cheaper — a dead god's favorite
 * trick, come back wrong — and pays for it here.
 *
 * In pip terms this is one red down-triangle. Stored as a raw forecast delta;
 * the pip tiering is display-only (recorded on THR-885).
 */
export const ECHO_CARD_SCAR_PENALTY = 5;

/** Essence knocked off a scarred echo card. Pairs with {@link ECHO_CARD_SCAR_PENALTY}. */
export const ECHO_CARD_SCAR_DISCOUNT = 1;

// ─── Motive classification ───────────────────────────────────────────

/** Receipt share that claims the motive as `choice` or `mission`. */
export const MOTIVE_DOMINANT_SHARE = 0.5;

// ─── Difficulty display ──────────────────────────────────────────────

/**
 * Step difficulty → display word. Words only — the mortal-facing surface never
 * shows the number (ruling 6).
 */
export const DIFFICULTY_WORD_BANDS: readonly { readonly min: number; readonly word: string }[] = [
  { min: 0.60, word: 'severe' },
  { min: 0.45, word: 'steep' },
  { min: 0.30, word: 'fair' },
  { min: 0, word: 'gentle' },
];

// ─── Rekindle the Thread ─────────────────────────────────────────────

/** Essence price of `divine.rekindle_thread` — expensive by design. */
export const REKINDLE_ESSENCE_COST = 6;

/**
 * Ratio the target is restored to. Lands the mortal `steady`-adjacent, above
 * the `BROKEN_EXIT_STATE` hysteresis, so the restore actually clears the state.
 */
export const REKINDLE_RESTORE_TO_RATIO = 0.6;

// ─── Agent-decided branches (THR-894) ────────────────────────────────
//
// A `decidedBy` fork asks the mortal a question about themselves. The answer is
// their live axis position (baseline + drift) plus whatever the god argued for
// with the cards committed on the deciding step. These four numbers are the
// whole feel of that: how loud one card is, how close to the middle counts as
// "undecided", which way an undecided mortal falls, and how much taking the
// fork moves them. Changing the feel is changing a number here (NFP #1).

/**
 * Pull of a `poleLean` card that names no explicit `weight`.
 *
 * Sized to the ±1 axis scale so a *single* leaning card can carry a mortal who
 * sits near neutral, but not one who is already committed the other way. A god
 * who wants to turn a convinced mortal must argue harder — more cards, or a
 * heavier one.
 */
export const POLE_LEAN_DEFAULT_WEIGHT = 0.35;

/**
 * Half-width of the "undecided" band around zero net lean.
 *
 * Inside it the mortal genuinely has no answer and the fork resolves by a seeded
 * coin. Deliberately small: a mortal with any real conviction, or a god with one
 * committed card, should land on a pole rather than a shrug.
 */
export const BRANCH_DECISION_NEUTRAL_EPSILON = 0.05;

/**
 * Coin threshold for an undecided fork. `rng() < this` ⇒ `'positive'`.
 *
 * A true coin at 0.5: neither pole is the safe default, because a silent
 * tiebreak toward one of them would quietly bias every neutral mortal in the
 * world the same way — the failure the meeting's `'none'` lean was written to
 * avoid.
 */
export const BRANCH_DECISION_COIN_THRESHOLD = 0.5;

/**
 * Signed drift the decided pole writes onto the mortal's axis.
 *
 * This is the loop that makes repeated choices become character: below the
 * `soft` drift threshold on its own, so one fork is a lean and not a rebrand,
 * but three in the same direction register as who this person is becoming.
 */
export const BRANCH_DECISION_DRIFT_MAGNITUDE = 0.08;

// ─── N-route decided forks (THR-898) ─────────────────────────────────
//
// A route fork asks a different question than a pole fork. A pole fork asks
// "which way do you lean?"; a route fork asks "which of these is *your* way in?"
// — bribe, intimidate, or persuade the same wainwright. The dominant term is
// therefore competence, not conviction: a mortal takes the course they are good
// at. The three weights below are that priority made tunable (NFP #1), and they
// are deliberately on comparable scales — capability is a 0–1 sigmoid, an axis
// position is ±1, and a card lean is ~±POLE_LEAN_DEFAULT_WEIGHT each.

/**
 * Weight on the mortal's capability in the route's reach.
 *
 * The largest of the three: what makes a course *theirs* is being able to walk
 * it. A thief bribes because bribery works when they do it, not because bribery
 * expresses a value they hold.
 */
export const ROUTE_DECISION_CAPABILITY_WEIGHT = 1;

/**
 * Weight on the mortal's standing on a route's declared axis, signed toward the
 * route's pole. Zero contribution for a route that declares no axis.
 *
 * Half of capability: character colors which course a mortal reaches for, but
 * does not override being good at one and hopeless at another.
 */
export const ROUTE_DECISION_AXIS_WEIGHT = 0.5;

/**
 * Weight on the cards the god committed — both those naming the route directly
 * and those arguing on the route's axis.
 *
 * Sized so that a single committed card is a real argument on a fork where two
 * routes sit close, and not enough to send a mortal down a course they have no
 * capability for. The god leans; the mortal still chooses.
 */
export const ROUTE_DECISION_CARD_WEIGHT = 1;

/**
 * How close two route scores must be to count as tied.
 *
 * Inside this band the mortal genuinely has no preference and a seeded draw
 * settles it, mirroring `BRANCH_DECISION_NEUTRAL_EPSILON` in pole mode. Small,
 * for the same reason: any real difference should decide the fork itself.
 */
export const ROUTE_DECISION_TIE_EPSILON = 0.02;

/**
 * Most routes one fork may declare.
 *
 * Not a technical limit — a cap on authoring. Past a handful of courses the
 * scoring stops being legible to a reader of the encounter, and the variants
 * stop being distinguishable in play. Validation fails a branch that exceeds it
 * rather than shipping a fork nobody can reason about.
 */
export const MAX_BRANCH_ROUTES = 6;

// ─── The Apotheosis (THR-1086) ───────────────────────────────────────
//
// `encounter.apotheosis.ascension` ran both its steps at `difficulty: 0` for as
// long as the player picked the ending: the file's own comment said "the choice
// is the point, not a roll". Once the mortal makes that choice (THR-894 pole
// mode), the roll is free to carry what the button was carrying — and what it
// carries is the branch the original director verdict named and the first
// implementation could not afford: whether the frame *holds*.
//
// Three numbers, one per question the encounter actually asks. They read as
// three different difficulty words (`fair`, `steep`, `gentle`) on the surface,
// which is the whole point of separating them — see `DIFFICULTY_WORD_BANDS`.
//
// `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) does not bind here. It governs
// `OPEN_DRAW_ATTENTION_TIER` content — ambient encounters a mortal draws by
// standing somewhere. This is a `story_beat` seeded onto one hand-picked mortal
// who has held tier-4 devotion for `ASPECT_ELIGIBILITY_TICKS`, so the audience is
// author-chosen and a `steep` step is authorable against it.

/**
 * Step 0 — can the god hold the doorway open long enough for the mortal to answer.
 *
 * `fair`. The god is not fighting anything here; it is keeping a thin place thin
 * while a worn soul finds its own answer. A stumble costs the clean ending
 * (`computeFinalActionOutcome` folds any failed step into `success_at_cost`) and
 * never the decision itself — the pole is recorded before the action resolves.
 */
export const APOTHEOSIS_THRESHOLD_DIFFICULTY = 0.35;

/**
 * Martyr variant — does the mortal frame hold what is poured into it.
 *
 * `steep`, and the highest of the three on purpose: this is the encounter's real
 * risk, and the one the pre-conversion template had no way to express. A failure
 * here is the **unmade** ending — the aspect is not granted, because the grant
 * rides `successMetadata` on this step and a failed step fires `failureMetadata`.
 */
export const APOTHEOSIS_VESSEL_DIFFICULTY = 0.50;

/**
 * Survivor variant — does the doorway close gently, or is the withdrawal felt.
 *
 * `gentle`. Letting go is the easier act, and the band still decides whether the
 * mortal is left whole or left aching — a low difficulty is not a free pass.
 */
export const APOTHEOSIS_WITHDRAWAL_DIFFICULTY = 0.25;

// ─── Per-type card mechanic magnitudes (THR-1179) ────────────────────

/**
 * Authoring magnitudes for the card types whose mechanics ship under THR-1179.
 *
 * **Why these live here rather than inline on each authored card.** A card type
 * is a *vocabulary word* — every Heavy Hand costs the same order of attention,
 * or the word stops meaning anything to the player who learned it once. Naming
 * the magnitude once makes the type tunable as a type (NFP #1); leaving it
 * inline on each authored option makes "what does a Heavy Hand cost" a question
 * you answer by grepping content.
 *
 * They are the numbers an authored `StepNudge` of that type is written against:
 * a Heavy Hand's `costs.detectionDelta`, an Omen's `grants[].intensity`. An
 * author may deviate for a specific scene — these are the type's centre of mass,
 * not a clamp — but a card that deviates far enough to change the decision the
 * keyword promises is a different type wearing the wrong word.
 *
 * The liveness of each mechanic — that a card carrying these actually reaches
 * its host system and changes the world — is pinned per type by
 * `src/engine/encounters/__tests__/nudgeTypeMechanics.test.ts`.
 */

/**
 * Detection pressure a Heavy Hand play adds in the actor's region.
 *
 * Sized against The Veil, which *lowers* pressure: the pair is meant to net off
 * when a player commits both, so a god who wants the large boost and none of the
 * attention can buy its way back to neutral for two cards instead of one.
 */
export const HEAVY_HAND_DETECTION_DELTA = 0.25;

/**
 * Forecast shift a Heavy Hand contributes — the "large boost" half of the trade.
 *
 * Deliberately above the ordinary Boost band (~0.06–0.08 across shipped cards):
 * the card's whole decision is *power now, attention later*, and a boost that
 * does not visibly outclass a Boost makes the detection cost pure downside.
 */
export const HEAVY_HAND_FORECAST_DELTA = 0.18;

/**
 * Severity of the mark a Long Game plants.
 *
 * Mid-band on purpose: the card buys a *future*, not a wound. A severity high
 * enough to drive immediate consequences would make it a Bargain, which is the
 * type that already exists for paying now.
 */
export const LONG_GAME_MARK_SEVERITY = 0.4;

/**
 * Intensity of the omen an Omen card emits (0–1).
 *
 * This is the term `deriveEmittedOmenEncounterBias` scales the draw bias by, so
 * it is the card's whole strength. Held below 1 so a single card bends the story
 * without pinning it — "steer the story, not the roll" is the decision the
 * keyword promises, and a maximal omen would read as authorship.
 */
export const OMEN_CARD_INTENSITY = 0.6;

/**
 * Ticks an Omen card's bias stains its scope before decaying out.
 *
 * Twice the 12-tick day, so the omen outlives the encounter that bought it and
 * is gone within a run's memory — long enough that the player sees the story
 * bend, short enough that an early omen is not still steering draws at the end.
 */
export const OMEN_CARD_DURATION_TICKS = 24;

/**
 * Forecast shift a Stumble contributes.
 *
 * Sized *at* the ordinary Boost band rather than above it. The Stumble's appeal
 * is not that it is stronger — it is that the same tilt arrives as the
 * opposition faltering, which is a different thing to have done and leaves a
 * different person standing afterwards. Pricing it above Boost would turn a
 * flavour-and-consequence choice into an arithmetic one.
 */
export const STUMBLE_FORECAST_DELTA = 0.08;

/**
 * Intensity of the condition a Stumble may leave on the cast member it weakens.
 *
 * Low: the card buys one bad moment for them, not an injury. A Stumble that
 * meaningfully disabled the opposition would be doing the mortal's work for
 * them, which is the god-as-protagonist failure the whole nudge model exists to
 * avoid (non-negotiable #1).
 */
export const STUMBLE_CONDITION_INTENSITY = 0.25;

/**
 * Ticks the Stumble's cast-side condition lasts.
 *
 * One 12-tick day — long enough that the scene's opposition is still nursing it
 * if the encounter runs on, short enough that it never becomes a permanent
 * handicap the player bought once.
 */
export const STUMBLE_CONDITION_DURATION_TICKS = 12;

/**
 * Forecast shift an Undertow contributes — the "strong boost" half of the trade.
 *
 * Between Boost and Heavy Hand. The Undertow's price is not paid in essence or
 * attention but in *who the mortal becomes*, and that price is only legible if
 * the boost is plainly worth considering; set at Boost strength the card reads
 * as strictly worse than Boost, and nobody ever meets the trade.
 */
export const UNDERTOW_FORECAST_DELTA = 0.13;

/**
 * Signed drift magnitude one Undertow play applies on its declared axis.
 *
 * Deliberately smaller than `BRANCH_DECISION_DRIFT_MAGNITUDE`: a decision the
 * mortal *made* should say more about them than a nudge the god slipped under
 * it. The card still changes who they are — repeatedly played, it changes them
 * decisively — but a single play never outweighs a single choice.
 */
export const UNDERTOW_DRIFT_MAGNITUDE = 0.06;
