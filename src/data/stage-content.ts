/**
 * stage-content.ts — the Stage's tunables (THR-1892, plan THR-1877 § Constants, C2).
 *
 * The Stage is the panel a mortal's moment plays on, over the dimmed map, with the
 * moment's hex lit in a window of open map beside it. Every number it uses is here or a
 * THR-1819 layout token (`--stage-*` in `index.css`); the words are in `view-content.ts`
 * (`STAGE_WORDS`).
 *
 * | Constant | Default | Purpose |
 * |---|---|---|
 * | STAGE_FRAME_KINDS | every Stage-home kind | the Stage-home kinds that play on the Stage frame; S2 the story beat, S3 the encounter, S4 the rest |
 * | STAGE_MAP_DIM | 0.7 | the dim's alpha over every unlit hex (THR-1829) |
 * | STAGE_DIM_COLOR | DOMINION_DIM_COLOR | the lens grammar's near-black, imported, never re-typed |
 * | STAGE_RING_COLOR_VAR | --text-primary | parchment, never gold (gold on the map is the Dominion frontier) |
 * | STAGE_RING_WIDTH_FRACTION | 0.06 | ring line width as a share of the hex radius |
 * | STAGE_GLOW_ALPHA | 0.35 | the lit hex's soft glow |
 * | STAGE_DIM_FADE_MS | 500 | dim fade-in, timed with the camera ease; 0 under reduced motion |
 * | STAGE_CAMERA_KEEP_MIN_K | 5 | lowest zoom at which the player's zoom is kept (place labels appear) |
 * | STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION | 0.8 | above this hex width in the window, the camera uses FOCUS_ZOOM |
 * | STAGE_CAMERA_SETTLE_TIMEOUT_MS | 800 | the panel enters even if the camera never reports landing |
 * | STAGE_LAYOUT_SETTLE_FRAMES | 2 | animation frames the camera waits after the rails move |
 * | STAGE_MAP_HINT_MS | 2000 | how long the hold line shows after an input on the map |
 * | STAGE_LIT_HEX_MIN_HIT_PX | 24 | the lit-hex button's smallest hit area (Law 46) |
 * | STAGE_CLOSE_EDGE_MARGIN_PX | 48 | on close, how far inside the visible map the place is kept |
 * | STAGE_OPTION_RING_DASH | { dash: 0.18, gap: 0.12 } | a premonition option ring's dashes, as shares of an edge (S4) |
 * | STAGE_OPTION_RING_COLOR_VAR | whisper / compulsion text rgb | an option ring's colour, the premonition's dream tone (S4) |
 */
import { DOMINION_DIM_COLOR } from './dominion-ui-content';
import type { StageHomedKind } from './homed-surfaces';

/**
 * The Stage-home kinds that play on the Stage frame in this slice. The others keep their
 * own screens until their slice moves them (THR-1895 the encounter, THR-1897 the rest).
 */
export const STAGE_FRAME_KINDS: readonly StageHomedKind[] = [
  'story-beat',
  'encounter',
  // THR-1897 (S4): the last four Stage moments.
  'journey-vignette',
  'undertaking-moment',
  'premonition',
  'emergence-dilemma',
];

export function isStageFrameKind(kind: string | null | undefined): kind is StageHomedKind {
  return kind != null && (STAGE_FRAME_KINDS as readonly string[]).includes(kind);
}

export const STAGE_MAP_DIM = 0.7;
export const STAGE_DIM_COLOR = DOMINION_DIM_COLOR;
export const STAGE_RING_COLOR_VAR = '--text-primary';
/** Used when the token cannot be read (no document). Parchment. */
export const STAGE_RING_COLOR_FALLBACK = '#e8dcc0';
export const STAGE_RING_WIDTH_FRACTION = 0.06;
export const STAGE_GLOW_ALPHA = 0.35;
/** Glow quad size as a share of the hex diameter. */
export const STAGE_GLOW_SCALE_FRACTION = 1.15;
/** = `CAMERA_CONSTANTS.JUMP_TO_DURATION_MS`; the dim and the camera move together. */
export const STAGE_DIM_FADE_MS = 500;
export const STAGE_CAMERA_KEEP_MIN_K = 5;
export const STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION = 0.8;
export const STAGE_CAMERA_SETTLE_TIMEOUT_MS = 800;
export const STAGE_LAYOUT_SETTLE_FRAMES = 2;
export const STAGE_MAP_HINT_MS = 2000;
export const STAGE_LIT_HEX_MIN_HIT_PX = 24;
export const STAGE_CLOSE_EDGE_MARGIN_PX = 48;

/** THR-1897 — a premonition option ring is dashed: each edge is dash, gap, dash… as shares of the edge. */
export const STAGE_OPTION_RING_DASH = { dash: 0.18, gap: 0.12 } as const;
/** The option ring's colour, read from the premonition's dream tone (an `r g b` triplet token). */
export const STAGE_OPTION_RING_COLOR_VAR = {
  whisper: '--premonition-whisper-text-rgb',
  compulsion: '--premonition-compulsion-text-rgb',
} as const;
/** Used when the token cannot be read (no document). */
export const STAGE_OPTION_RING_COLOR_FALLBACK = { whisper: '#c8b8d8', compulsion: '#d8c0c8' } as const;

/** The panel's entrance once the camera lands (Law 41's ceremonial tier); reduced motion uses `--anim-fast`. */
export const STAGE_PANEL_ENTRANCE_S = 0.6;
