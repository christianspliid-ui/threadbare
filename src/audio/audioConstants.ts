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
