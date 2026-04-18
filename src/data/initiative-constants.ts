/**
 * Initiative System Constants (THR-51)
 *
 * All tunable numbers for the agent initiative pipeline.
 * Edit this file to tune frequency, scoring, and timing without touching logic.
 */

/** Minimum ticks between completing one initiative and starting another.
 * @range 10–40 (lower = agents chain initiatives faster) */
export const INITIATIVE_COOLDOWN_TICKS = 20;

/** Hard cap on initiative candidate finalScore — prevents initiatives from
 * dominating over encounters in all circumstances.
 * @range 0.3–0.8 */
export const INITIATIVE_MAX_SCORE = 0.6;

/** Flat bonus when initiative aligns with an agent's active ambition.
 * @range 0.05–0.3 */
export const INITIATIVE_AMBITION_ALIGNMENT_BONUS = 0.15;

/** Maximum bonus from excess wealth above initiative cost.
 * Score += this * (wealth - minWealth) / 100
 * @range 0.05–0.2 */
export const INITIATIVE_WEALTH_SURPLUS_BONUS = 0.10;

/** Ticks added to duration when a checkpoint capability check fails.
 * @range 1–5 */
export const INITIATIVE_DELAY_ON_FAILED_CHECK = 3;

/** Agents below this wealth never consider initiatives (survival mode).
 * @range 3–10 */
export const INITIATIVE_MIN_WEALTH_FLOOR = 5;

/** Score bonus applied when "Inspire Initiative" divine action was used.
 * Consumed once (single-use token).
 * @range 0.2–0.7 */
export const INITIATIVE_INSPIRE_BONUS = 0.5;

/** Ticks added to targetCompletionTick by "Sabotage Initiative" divine action.
 * @range 3–8 */
export const INITIATIVE_SABOTAGE_EXTENSION = 5;

/** Probability that a sabotaged initiative fails at its next checkpoint.
 * @range 0.2–0.6 */
export const INITIATIVE_SABOTAGE_FAIL_CHANCE = 0.4;

/** Essence cost for "Inspire Initiative" divine action. */
export const INSPIRE_INITIATIVE_ESSENCE_COST = 12;

/** Essence cost for "Sabotage Initiative" divine action. */
export const SABOTAGE_INITIATIVE_ESSENCE_COST = 10;

/** How often an active spy network generates intelligence (ticks).
 * @range 3–10 */
export const SPY_NETWORK_INTEL_INTERVAL = 5;

/** Probability per cycle that a spy network scan is detected by the target.
 * @range 0.02–0.1 */
export const SPY_NETWORK_DETECTION_CHANCE = 0.05;

/** Ticks between spy network upkeep deductions.
 * @range 10–20 */
export const SPY_NETWORK_DECAY_INTERVAL = 15;

/** Wealth cost per upkeep cycle to maintain a spy network.
 * @range 1–4 */
export const SPY_NETWORK_UPKEEP = 2;

/** Minimum 'relates_to' edge strength before a spy network dissolves.
 * @range 0.1–0.3 */
export const SPY_NETWORK_MIN_STRENGTH = 0.2;

/** Bonus to encounter scoring at a shrine for encounters matching the shrine's sphere.
 * @range 0.05–0.3 */
export const SHRINE_SPHERE_BOOST = 0.15;

/** Duration (ticks) of festival social boost effects at a location.
 * @range 6–20 */
export const FESTIVAL_DURATION = 10;

/** Score added per agent at location beyond 3 (social density bonus for social initiatives). */
export const INITIATIVE_SOCIAL_DENSITY_BONUS_PER_AGENT = 0.05;

/** Base pass probability for a checkpoint capability roll (before capability modifier).
 * @range 0.3–0.7 */
export const INITIATIVE_CHECKPOINT_BASE_PASS_CHANCE = 0.5;

/** How much domain capability shifts the checkpoint pass probability per point.
 * finalProb = base + capability * weight
 * @range 0.1–0.5 */
export const INITIATIVE_CHECKPOINT_CAPABILITY_WEIGHT = 0.3;

/** Master feature flag — set false to disable entire initiative pipeline without removing code. */
export const ENABLE_INITIATIVES = true;
