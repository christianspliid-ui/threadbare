import { isEncounterContractMetadata } from '../../encounter-contract-adapter';

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

/** Lead words of the fallback scene-picture label (THR-1733). */
export const SCENE_ALT_PREFIX = 'Scene from';
/** Scene-picture label when the template has no name to name (THR-1733). */
export const SCENE_ALT_NAMELESS = 'An encounter scene';

/**
 * THR-1733 — the words a screen reader hears for the scene picture.
 *
 * Contract encounters store their whole encoded contract in `illustrationAlt`
 * (`__encounter_contract_v1:<JSON>`); that is storage, never prose. Authored
 * alt text survives; absent, blank or contract-payload alt falls back to
 * `Scene from <name>`. Fail-soft: never throws, never parses.
 */
export function illustrationAltText(template: { illustrationAlt?: string; name?: string }): string {
  const authored = template.illustrationAlt?.trim();
  if (authored && !isEncounterContractMetadata(authored)) return authored;
  const name = template.name?.trim();
  return name ? `${SCENE_ALT_PREFIX} ${name}` : SCENE_ALT_NAMELESS;
}

/** The URL to render, or `undefined` when there is nothing real to show. */
export function renderableIllustrationUrl(url: string | undefined): string | undefined {
  if (!url || MISSING_ENCOUNTER_ILLUSTRATION_URLS.has(url)) return undefined;
  return url;
}
