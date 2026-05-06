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
// Passive drift decay when choices do not reinforce direction.
export const DRIFT_DECAY_RATE_PER_TICK = 0.001;

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

// Default number of visible forecast factors without hover expansion.
export const FORECAST_FACTORS_VISIBLE_DEFAULT = 1;
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
