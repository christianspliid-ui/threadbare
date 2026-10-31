/**
 * THR-2093 — the dark backing behind text that sits on scene art.
 *
 * The meeting's formative test draws its prose and its helps/hinders panel
 * over `ComicPanel`'s scene, whose only scrim fades out toward the top — so
 * the text crossed bright windows with nothing behind it. Both surfaces share
 * this one backing, so they read as one family and cannot drift apart.
 *
 * The alpha is set by Law 45, not by taste: every text tone on these surfaces
 * (the god-voice line at rgba(212,168,122,0.7) is the weakest) holds 4.5:1
 * even where the art behind is pure white. At 0.93 the god-voice line measures
 * 4.54:1 on white art; 0.8 would drop it to 3.35:1.
 */
import type { CSSProperties } from 'react';

/**
 * Opacity of the void-coloured backing (`--veil-void`, #0a0a0f).
 * @range 0.93–1 — below 0.93 the god-voice line fails 4.5:1 over white art.
 */
export const READING_BACKING_ALPHA = 0.93;

/** Blur applied to the art seen through the backing's remaining translucency. */
export const READING_BACKING_BLUR_PX = 6;

/** The backing itself — background plus blur. Callers add their own padding and border. */
export const READING_BACKING: CSSProperties = {
  background: `rgba(10, 10, 15, ${READING_BACKING_ALPHA})`,
  backdropFilter: `blur(${READING_BACKING_BLUR_PX}px)`,
  WebkitBackdropFilter: `blur(${READING_BACKING_BLUR_PX}px)`,
};
