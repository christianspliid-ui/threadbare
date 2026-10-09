/**
 * Player-facing words for an aftermath choice that could not land (THR-1777).
 *
 * The veil used to swallow a failed reaction silently — the player clicked a
 * choice, nothing happened, and nothing said why. The engine's refusal reason
 * is written for the CLI and the trace log (action ids, agent ids), so the veil
 * shows one of these plain lines instead and the raw reason goes to the trace.
 */
export const AFTERMATH_REACTION_REFUSAL_COPY = {
  /** The tick loop already answered this aftermath while it sat on screen. */
  alreadyApplied: 'The world answered this moment while you watched. Nothing was changed.',
  /** Any other refusal: the aftermath is no longer there to answer. */
  unavailable: 'This choice could not take hold. The moment it belonged to has passed.',
} as const;
