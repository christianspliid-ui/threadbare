/**
 * Mentorship System Constants (THR-75)
 *
 * All tunable numbers for the mentor/apprentice relationship pipeline.
 * Edit this file to tune eligibility, pacing, drift, and divine-action costs
 * without touching logic.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §4.6
 */

/** Master feature flag — phaseMentorship and candidate generation no-op when false.
 *  Allows full rollback without a code revert. */
export const ENABLE_MENTORSHIP = true;

/** Minimum Domain Capability tier (0-8) a mentor must have in a Reach to teach it.
 * @range 5–7 */
export const MENTOR_MIN_TIER = 6;

/** Minimum apprentice tier — must have a foundation to build on.
 * @range 1–3 */
export const APPRENTICE_MIN_TIER = 2;

/** Maximum apprentice tier — above this they don't need a mentor.
 * @range 3–5 */
export const APPRENTICE_MAX_TIER = 4;

/** Base ticks for a full apprenticeship.
 * @range 6–14 */
export const MENTORSHIP_BASE_DURATION = 8;

/** Plus-or-minus variance on duration (uniform 0..n).
 * @range 1–4 */
export const MENTORSHIP_DURATION_VARIANCE = 3;

/** Ticks between training checkpoints — four checkpoints across a base run.
 * @range 2–4 */
export const MENTORSHIP_CHECK_INTERVAL = 2;

/** Apprentice straying beyond this hex distance fails the initiative.
 * @range 2–5 */
export const MENTORSHIP_MAX_SEPARATION_HEXES = 3;

/** Training progress points that seed milestone encounters (Phase 2). */
export const MILESTONE_THRESHOLDS: readonly number[] = [0.25, 0.5, 0.75];

/** Initial bondQuality when no prior relates_to edge exists between the pair. */
export const BOND_QUALITY_INITIAL = 0.0;

/** bondQuality gain per passed checkpoint.
 * @range 0.08–0.25 */
export const BOND_DRIFT_ON_SUCCESS = 0.15;

/** bondQuality loss per failed checkpoint — failures cut deeper than successes heal.
 * @range 0.1–0.3 */
export const BOND_DRIFT_ON_FAILURE = 0.2;

/** bondQuality at/above which a completed apprenticeship graduates.
 * @range 0.0–0.4 */
export const GRADUATION_BOND_THRESHOLD = 0.2;

/** bondQuality below which the bond actively breaks (Falling Out).
 * @range -0.5–-0.1 */
export const FALLING_OUT_BOND_THRESHOLD = -0.3;

/** Falling-out sentiment below which a hostile_to edge is created instead of negative relates_to.
 * @range -0.8–-0.4 */
export const HOSTILE_THRESHOLD = -0.6;

/** Level (1-3) of the Mastery trait granted on graduation.
 * @range 1–3 */
export const GRADUATION_TRAIT_LEVEL = 2;

/** Fraction of the trait level transferred on a partial (falling-out / quiet-parting) end.
 * @range 0.25–0.75 */
export const FALLING_OUT_TRANSFER_FRACTION = 0.5;

/** Apprentice tier ≥ mentor tier + this → Surpassing arc.
 *  Zero means: equal-or-greater tier triggers Surpassing.
 * @range 0–2 */
export const SURPASSING_TIER_DELTA = 0;

/** One-time candidate-score bonus from the Inspire Mentorship divine action.
 *  Consumed once. Mirrors initiativeInspireBonus.
 * @range 0.2–0.7 */
export const INSPIRE_MENTORSHIP_SCORE_BONUS = 0.4;

/** Essence cost of "Inspire Mentorship" divine action. */
export const INSPIRE_MENTORSHIP_ESSENCE_COST = 2;

/** Essence cost of "Sever the Bond" divine action. */
export const SEVER_BOND_ESSENCE_COST = 6;

/** bondQuality forced by "Sever the Bond" — guarantees Falling Out on next resolve. */
export const SEVER_BOND_QUALITY_FLOOR = -1.0;
