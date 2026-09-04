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

// ── Encounter sound design (THR-346) — RETIRED IN FULL ──────────────
//
// RETIRED 2026-09-04 (THR-1168, director's ruling in chat: "no audio please").
// The Moment 1 tension reveal is gone with its constants: the four dBFS levels
// (-28 inhale / -16 thrum peak / -18 resolve / -34 release), the cue timings
// (inhale 0–380ms, thrum 380ms–1.32s peak releasing at 1.56s, resolve 240ms),
// the two filter corners (800Hz inhale / 520Hz thrum), the C2 65.41Hz cello
// root with its ×4 octave multiplier, the 4ms/900ms struck-string envelope,
// and the nine-reach semitone tint map. Deleted with them:
// `src/audio/encounterSoundDesign.ts`, `src/hooks/useThreadReveal.ts`, and
// both audio test files.
//
// Why, and why it is a ruling rather than a defect. The question was whether
// committing a hand of nudge cards should carry ~1.6s of held breath before
// the outcome lands — a feel question with no right answer to test against,
// so it went to the director and came back no. The cues had had no live
// consumer since THR-1049 deleted the D1/D2 encounter screen and THR-1167
// deleted `ThreadOverlay`; `useThreadReveal` was left as the sole caller of
// all three cue functions, reachable from its own tests alone.
//
// The Moment 2 registration cue was retired first, on mechanical grounds
// (THR-1168, 2026-08-18): its pitch map was keyed by the engine effect
// vocabulary (`intelligence` / `hidden_mark` / `spawn_artifact`, canonical UI
// spec §4.1), and THR-1082 had replaced that on every player surface with six
// story-first consequence kinds (`prize | standing | toll | wound | seed |
// mark`) sharing zero keys with it — so the only available wiring would have
// played one fallback pitch forever behind a live-looking call.
//
// Recovery: the cue design of record survives as spec, not code — canonical
// UI spec §3.3 (`Docs/plans/2026-05-04-encounter-ui-canonical.md`) still
// carries the full three-cue table with every timing and level, and the
// implementation is in git history. Revival needs the ruling revisited first.

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
