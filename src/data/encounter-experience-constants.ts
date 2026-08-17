/**
 * Encounter Experience constants (THR-321, Phase A2).
 * Foundation-only tunables consumed by later encounter UI phases.
 */

// Probability tilt per divine choice intensity.
export const CHOICE_PROBABILITY_TILT_SMALL = 0.05;
// Probability tilt per divine choice intensity.
export const CHOICE_PROBABILITY_TILT_FULLER = 0.1;
// Probability tilt per divine choice intensity.
export const CHOICE_PROBABILITY_TILT_DEEP = 0.2;

// Moral-axis drift magnitude per divine choice intensity.
export const CHOICE_DRIFT_MAGNITUDE_SMALL = 0.04;
// Moral-axis drift magnitude per divine choice intensity.
export const CHOICE_DRIFT_MAGNITUDE_FULLER = 0.07;
// Moral-axis drift magnitude per divine choice intensity.
export const CHOICE_DRIFT_MAGNITUDE_DEEP = 0.12;

// Essence cost per divine choice intensity.
export const CHOICE_ESSENCE_COST_SMALL = 1;
// Essence cost per divine choice intensity.
export const CHOICE_ESSENCE_COST_FULLER = 2;
// Essence cost per divine choice intensity.
export const CHOICE_ESSENCE_COST_DEEP = 3;

// Drift threshold for soft scene-state signaling.
export const DRIFT_THRESHOLD_SOFT = 0.3;
// Drift threshold for identity banner signaling.
export const DRIFT_THRESHOLD_BANNER = 0.6;
// Drift threshold for becoming-event signaling.
export const DRIFT_THRESHOLD_BECOMING = 0.85;

// ── Personality drift from authored choices (THR-528) ───────────────
// Authored per-choice drift magnitudes (unsigned), declared on the choice card.
// A choice nudges the actor's live axis position by this much, toward the
// authored pole. Skewed small so streaks of behavior accumulate gradually.
export const PERSONALITY_DRIFT_DELTA_SUBTLE = 0.05;
export const PERSONALITY_DRIFT_DELTA_MODERATE = 0.1;
export const PERSONALITY_DRIFT_DELTA_STRONG = 0.15;
export const PERSONALITY_DRIFT_DELTA_DEFINING = 0.2;
// Fallback magnitude when a choice declares a pole/axis but omits an explicit
// magnitude (and the default for heuristic-inferred, un-migrated choices).
export const PERSONALITY_DRIFT_DELTA_DEFAULT = PERSONALITY_DRIFT_DELTA_MODERATE;

// Passive drift decay when choices do not reinforce direction. Drift is a
// *temporary delta*; because the live position = clamp(baseline + drift), pulling
// the delta toward zero relaxes the live position back to the agent's (mutable)
// baseline — it rests at the baseline, never at neutral. (THR-528)
export const PERSONALITY_DRIFT_DECAY_PER_TICK = 0.001;
/** @deprecated Renamed to PERSONALITY_DRIFT_DECAY_PER_TICK (THR-528). Kept as an alias. */
export const DRIFT_DECAY_RATE_PER_TICK = PERSONALITY_DRIFT_DECAY_PER_TICK;

// Detection threshold for notice-level rival pressure.
export const DETECTION_THRESHOLD_NOTICE = 0.5;
// Detection threshold for turn-level rival pressure.
export const DETECTION_THRESHOLD_TURN = 0.8;
// Detection threshold for encounter-level rival pressure.
export const DETECTION_THRESHOLD_ENCOUNTER = 1;
// Passive detection pressure decay over time.
export const DETECTION_DECAY_RATE_PER_TICK = 0.005;

// Forecast tier boundary for "doomed".
export const FORECAST_TIER_DOOMED_MAX = 0.2;
// Forecast tier boundary for "perilous".
export const FORECAST_TIER_PERILOUS_MAX = 0.4;
// Forecast tier boundary for "uncertain".
export const FORECAST_TIER_UNCERTAIN_MAX = 0.6;
// Forecast tier boundary for "favorable".
export const FORECAST_TIER_FAVORABLE_MAX = 0.8;

// Maximum number of visible forecast factors with hover expansion.
export const FORECAST_FACTORS_VISIBLE_HOVER_MAX = 4;

// Soft cap for primary cast tiles before editorial review.
export const CAST_TILES_PRIMARY_SOFT_CAP = 4;
// Threshold where background cast tiles collapse behind an expander.
export const CAST_TILES_BACKGROUND_COLLAPSE_THRESHOLD = 5;

// Default number of visible hand cards before expansion.
export const HAND_VISIBLE_CARDS_DEFAULT = 3;
// Default number of choice options per beat.
export const CHOICE_OPTIONS_PER_BEAT_DEFAULT = 3;
// Hard cap for choice options per beat.
export const CHOICE_OPTIONS_PER_BEAT_MAX = 6;
// Default encounter beat count.
export const BEAT_COUNT_DEFAULT = 4;
// Hard cap for encounter beat count.
export const BEAT_COUNT_MAX = 8;

// Aftermath registration animation fade-in duration.
export const AFTERMATH_ANIMATION_FADE_IN_MS = 600;
// Aftermath registration animation settle duration.
export const AFTERMATH_ANIMATION_SETTLE_MS = 400;
// World-to-encounter handoff transition duration.
export const ENCOUNTER_HANDOFF_TRANSITION_MS = 400;

// Phase D2's EffectRegistration sequencing constants (THR-335) were retired with
// the prototype cluster they tuned (THR-1049) — the landing components, the
// `useEffectSequencing` lane assignment, and the styleguide demo that was their
// only mount. The live surface for "what registered" is the consequence-chip
// block in `EncounterVeil.tsx` (THR-971 / THR-1082), which is not animated and
// reads none of these. Recover from git history if the animation spec is revived.

// Outcome band cutoffs for choice resolution (THR-323, Phase B1).
// Within the success zone (roll <= p), bottom CRITICAL_SUCCESS_ZONE_FRACTION → critical_success.
export const OUTCOME_CRITICAL_SUCCESS_ZONE_FRACTION = 0.3;
// Within the failure zone (roll > p), bottom FAIL_FORWARD_ZONE_FRACTION → fail_forward.
export const OUTCOME_FAIL_FORWARD_ZONE_FRACTION = 0.2;
// Within the failure zone (roll > p), top CRITICAL_FAIL_ZONE_FRACTION → critical_fail.
export const OUTCOME_CRITICAL_FAIL_ZONE_FRACTION = 0.15;
