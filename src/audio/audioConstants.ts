export const MUSIC_VOLUME_DEFAULT = 0.4;
export const BACKGROUND_VOLUME_DEFAULT = 0.35;
export const UI_VOLUME_DEFAULT = 0.6;
export const MUSIC_FADE_IN_MS = 3000;
export const MUSIC_FADE_OUT_MS = 1500;
export const AMBIENT_CROSSFADE_MS = 2000;
export const AMBIENT_CONTEXT_DEBOUNCE_MS = 300;
export const MUSIC_MUTE_KEY = 'fws_music_muted';
export const BACKGROUND_MUTE_KEY = 'fws_bg_muted';
export const UI_MUTE_KEY = 'fws_ui_muted';
/** Legacy key from themeAudio.ts — read during migration to preserve user setting. */
export const LEGACY_MUSIC_MUTE_KEY = 'threadbearer_muted';

export const MUSIC_SRC_DEFAULT = '/audio/music/theme-drone.mp3';

// ── Encounter sound design (THR-346, post-v1 H1) ────────────────────
// Spec: Docs/plans/2026-05-04-encounter-ui-canonical.md §3.3 (Moment 1)
// and §4.1/§4.3 (Moment 2 registration cues).
//
// These cues are SYNTHESIZED via the Web Audio API rather than sampled —
// no assets ship with them. The spec calls for a cello drone and struck-string
// notes at named intervals; deriving those from oscillators keeps the sphere
// tinting exact (an interval is a frequency ratio, not a mix decision) and
// keeps every value below a tunable number per NFP #1.

/** Master trim applied to every encounter cue, on top of the UI channel volume. */
export const ENCOUNTER_CUE_MASTER_GAIN = 0.9;

// Levels in dBFS, straight from the §3.3 spec table.
/** Held breath. Spec: "-28dB, mono center, low-pass at 800Hz". */
export const ENCOUNTER_INHALE_DB = -28;
/** Cello drone peak on the taut beat. Spec: "Peaks at -16dB". */
export const ENCOUNTER_THRUM_PEAK_DB = -16;
/** Struck-string resolve node. Sits between breath and thrum peak. */
export const ENCOUNTER_RESOLVE_DB = -18;
/** Slackening-thread release. Spec: "barely-audible". */
export const ENCOUNTER_RELEASE_DB = -34;

// Cue timings in ms from commit, matching the §3.3 table and the
// useThreadReveal beat clock (60+380+520+420+240 = 1620ms total).
export const ENCOUNTER_INHALE_START_MS = 0;
export const ENCOUNTER_INHALE_DURATION_MS = 380;
export const ENCOUNTER_THRUM_START_MS = 380;
export const ENCOUNTER_THRUM_PEAK_MS = 1320;
export const ENCOUNTER_THRUM_RELEASE_MS = 1560;
export const ENCOUNTER_RESOLVE_DURATION_MS = 240;

/** Low-pass corner for the inhale, per spec. */
export const ENCOUNTER_INHALE_LOWPASS_HZ = 800;
/** Low-pass corner for the cello drone — keeps it bowed, not buzzing. */
export const ENCOUNTER_THRUM_LOWPASS_HZ = 520;

/** Cello root. C2 = 65.41Hz — the low open register the spec's "root only" implies. */
export const ENCOUNTER_CELLO_ROOT_HZ = 65.41;
/** Struck-string notes sound an octave above the drone root so they read as separate. */
export const ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER = 4;

/** Struck string: near-instant attack, long decay. */
export const ENCOUNTER_RESOLVE_ATTACK_MS = 4;
export const ENCOUNTER_RESOLVE_DECAY_MS = 900;

/**
 * Sphere tinting for the resolve note, in semitones above the cello root.
 *
 * The spec names three exactly — "low fourth on Iron, open fifth on Eye,
 * soft minor third on Heart" — and those three are reproduced literally.
 * The remaining six reaches are extrapolated to keep the same consonance
 * gradient the named three establish (stable intervals for grounded reaches,
 * unresolved ones for reaches that withhold). They are tuning numbers, not
 * spec claims; change them freely if the feel is wrong.
 */
export const ENCOUNTER_RESOLVE_SEMITONES: Readonly<Record<string, number>> = {
  iron: 5, // perfect fourth — spec-exact ("low fourth")
  eye: 7, // perfect fifth — spec-exact ("open fifth")
  heart: 3, // minor third — spec-exact ("soft minor third")
  stone: 0, // unison — heaviest, most grounded
  gold: 9, // major sixth — open and generous
  veil: 10, // minor seventh — deliberately unresolved
  star: 12, // octave — a return rather than an arrival
  shadow: 6, // tritone — unstable
  quintessence: 4, // major third — the only unambiguously bright one
};

/** Fallback interval when a reach is missing from the map (fail-soft). */
export const ENCOUNTER_RESOLVE_SEMITONES_FALLBACK = 0;

// The Moment 2 registration-cue constants (level, attack, decay, and the
// ten-entry sphere-tint map) were retired with the cue itself (THR-1168). The map
// was keyed by the *engine effect* vocabulary of canonical UI spec §4.1 —
// `intelligence`, `hidden_mark`, `spawn_artifact` and kin — and no player surface
// still speaks it: THR-1082 replaced the mechanical effect buckets with six
// story-first consequence kinds (`prize | standing | toll | wound | seed | mark`),
// sharing zero keys with this map. The live "what registered" surface is the
// consequence-chip block in `EncounterVeil.tsx` (THR-971 / THR-1082), which could
// only ever have driven the fallback pitch. Recover from git history if a
// per-effect registration surface returns.

/**
 * Pool of in-game music tracks. MusicChannel shuffles through these,
 * advancing to the next track when the current one ends.
 * Drop MP3s into public/audio/music/ and add the path here.
 * If empty, falls back to MUSIC_SRC_DEFAULT on loop.
 */
export const MUSIC_TRACKS: string[] = [
  '/audio/music/Ashes in the Black Snow.mp3',
  '/audio/music/Desert of Unremembered Names.mp3',
  '/audio/music/Endless Mouth of Sky.mp3',
  '/audio/music/Forgotten Threshold.mp3',
  '/audio/music/Oboe Over The Black Sand.mp3',
  '/audio/music/Temple of the Wind-Scarred Steppe.mp3',
  '/audio/music/theme-drone.mp3',
];

/**
 * Maps each ambient sound key to an ordered list of audio file URLs.
 * BackgroundChannel picks randomly from this list on context switch.
 * Empty arrays = channel stays silent (graceful degradation until assets ship).
 * Add file paths here when audio assets are dropped into public/audio/ambient/.
 */
export const AMBIENT_TRACKS: Record<string, string[]> = {
  water:      [],
  grassland:  ['/audio/grassland-01.mp3'],
  forest:     ['/audio/forest-01.mp3'],
  swamp:      [],
  mountains:  [],
  plateau:    ['/audio/plateau-01.mp3'],
  desert:     ['/audio/desert-01.mp3'],
  tundra:     [],
  volcanic:   [],
  wasteland:  [],
  city:       [],
  settlement: [],
  fortress:   [],
  sacred:     [],
  dungeon:    [],
  danger:     [],
};
