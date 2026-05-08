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

// ── Phase D2 — EffectRegistration sequencing (THR-335) ──────────────
// Per-kind landing motion durations (ms). Match canonical UI spec §4.1.
export const REGISTRATION_FLIP_INTELLIGENCE_MS = 420;
export const REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS = 240;
export const REGISTRATION_FLIP_REPUTATION_TALLY_MS = 280;
export const REGISTRATION_FLIP_REPUTATION_SCORE_MS = 360;
export const REGISTRATION_FLIP_ENCOUNTER_SEED_MS = 360;
export const REGISTRATION_FLIP_HIDDEN_MARK_MS = 700;
export const REGISTRATION_FLIP_RECENT_EVENT_MS = 420;
export const REGISTRATION_FLIP_SPAWN_ARTIFACT_MS = 460;
export const REGISTRATION_FLIP_FACTION_MS = 800;
export const REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS = 240;

// Pulse-ring (mark-pulse) decay window after a pulse fires; rule §4.3 #2 suppresses
// any second pulse that would land inside this window for the same target surface.
export const REGISTRATION_PULSE_RING_DECAY_MS = 600;

// Lane time-window starts (ms from resolution) per canonical UI spec §4.2.
export const REGISTRATION_LANE_HERO_PANEL_FIRST_MS = 600;
export const REGISTRATION_LANE_HERO_PANEL_SECOND_MS = 1700;
export const REGISTRATION_LANE_RIGHT_RAIL_CAST_MS = 1000;
export const REGISTRATION_LANE_RIGHT_RAIL_STATE_MS = 1400;
export const REGISTRATION_LANE_ECHO_STRIP_MS = 2400;
export const REGISTRATION_LANE_PLAYER_ONLY_MS = 3200;

// Discipline rule §4.3 #1: 50% overlap delay for back-to-back card-flips in the
// same lane. Second flip is shifted by this gap when it would overlap > 50% of the first.
export const REGISTRATION_OVERLAP_DELAY_MS = 220;

// Discipline rule §4.3 #4: more than this many effects → second-breath gate.
export const REGISTRATION_GATE_THRESHOLD = 5;
// Pause inserted between batch 1 (first 5 effects) and batch 2 (effects 6+).
export const REGISTRATION_GATE_PAUSE_MS = 800;
// Prose-log line fading in when the gate fires.
export const REGISTRATION_GATE_LINE = '… more is settling';

// Outcome band cutoffs for choice resolution (THR-323, Phase B1).
// Within the success zone (roll <= p), bottom CRITICAL_SUCCESS_ZONE_FRACTION → critical_success.
export const OUTCOME_CRITICAL_SUCCESS_ZONE_FRACTION = 0.3;
// Within the failure zone (roll > p), bottom FAIL_FORWARD_ZONE_FRACTION → fail_forward.
export const OUTCOME_FAIL_FORWARD_ZONE_FRACTION = 0.2;
// Within the failure zone (roll > p), top CRITICAL_FAIL_ZONE_FRACTION → critical_fail.
export const OUTCOME_CRITICAL_FAIL_ZONE_FRACTION = 0.15;
