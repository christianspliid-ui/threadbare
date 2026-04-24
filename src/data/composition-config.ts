/** Maximum number of active compositions evaluated per tick. Excess deferred to next tick. */
export const PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK = 16;

/** Minimum ticks between phase activations on the same composition. 0 = activate immediately. */
export const PHASE_ACTIVATION_COOLDOWN_TICKS = 0;

/** Default StoryBeatPriority stamped on phase-emitted beats. */
export const PHASE_STORY_BEAT_DEFAULT_PRIORITY = 'doom_clock' as const;

/** Ticks a failed composition persists in activeCompositions before garbage collection. */
export const COMPOSITION_FAILED_RETENTION_TICKS = 20;

/** Ticks a completed composition persists in activeCompositions before garbage collection.
 *  Longer than failed retention so recent successful phased events remain inspectable in the
 *  DebugPanel composition view (CompositionView.tsx) for roughly one short-beat window. */
export const COMPOSITION_COMPLETED_RETENTION_TICKS = 50;

/** Fallback mood for ChronicleEntry.promptContext.mood when a story-beat template omits one. */
export const STORY_BEAT_DEFAULT_MOOD = 'ominous' as const;

/** Fallback sphere when no template is available (template-missing branch only; templates must specify sphere). */
export const STORY_BEAT_DEFAULT_SPHERE = 'entropy' as const;

/** Fallback voice when neither phase nor template specifies one. */
export const STORY_BEAT_DEFAULT_VOICE = 'divine' as const;
