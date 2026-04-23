/** Maximum number of active compositions evaluated per tick. Excess deferred to next tick. */
export const PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK = 16;

/** Minimum ticks between phase activations on the same composition. 0 = activate immediately. */
export const PHASE_ACTIVATION_COOLDOWN_TICKS = 0;

/** Default StoryBeatPriority stamped on phase-emitted beats. */
export const PHASE_STORY_BEAT_DEFAULT_PRIORITY = 'doom_clock' as const;

/** Ticks a failed composition persists in activeCompositions before garbage collection. */
export const COMPOSITION_FAILED_RETENTION_TICKS = 20;
