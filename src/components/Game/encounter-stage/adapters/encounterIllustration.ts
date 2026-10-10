/**
 * THR-1800 — which authored illustration URLs the encounter stage may render.
 *
 * `/concept-art/encounters/placeholder.jpg` was never shipped, yet it is the
 * fallback the contract builders write into `place.painting`, and the contract
 * adapter copies that straight back onto `illustrationUrl`. Rendering it gave
 * the player an empty left half captioned "Some encounters arrive with a
 * remembered image already clinging to them" — a promise of a picture with no
 * picture. A URL on this list renders no image panel and no caption.
 */
export const MISSING_ENCOUNTER_ILLUSTRATION_URLS: ReadonlySet<string> = new Set([
  '/concept-art/encounters/placeholder.jpg',
]);

/** The URL to render, or `undefined` when there is nothing real to show. */
export function renderableIllustrationUrl(url: string | undefined): string | undefined {
  if (!url || MISSING_ENCOUNTER_ILLUSTRATION_URLS.has(url)) return undefined;
  return url;
}
