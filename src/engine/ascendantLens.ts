/**
 * Ascendant Lens Overlay Resolution Engine
 *
 * Weaves the god's Hunger-specific perception into meeting encounter prose.
 * Every scene the player reads passes through this: base template prose
 * + Hunger perception overlay + optional mortal echo when the god's Drive
 * resonates with the dilemma's emotional tags.
 *
 * All functions are pure — no side effects, no state mutation.
 *
 * NFP #4 (Fail-soft): Missing overlay → base prose returned unchanged.
 */

import type { AscendantLens } from '../types/hunger';
import type { LensOverlay } from '../types/meetingEncounter';

/**
 * Find the lens overlay matching the active Hunger.
 *
 * @param overlays - Per-Hunger prose overlays from the enriched dilemma template
 * @param hungerId - The god's active Hunger ID
 * @returns The matching overlay, or undefined if none exists
 */
export function resolveLensOverlay(
  overlays: readonly LensOverlay[],
  hungerId: string,
): LensOverlay | undefined {
  return overlays.find((o) => o.hungerId === hungerId);
}

/**
 * Determine whether the mortal echo should fire.
 *
 * Compares the god's Drive tags against the dilemma's emotional tags.
 * If the overlap count meets or exceeds the threshold, the echo fires —
 * surfacing a fragment of the god's mortal memory.
 *
 * @param lens - The god's complete narrative identity
 * @param dilemmaEmotionalTags - Emotional register tags from the dilemma
 * @param echoThreshold - Minimum tag overlap required (undefined = never fire)
 * @returns true if the echo should fire
 */
export function shouldFireMortalEcho(
  lens: AscendantLens,
  dilemmaEmotionalTags: readonly string[],
  echoThreshold: number | undefined | null,
): boolean {
  if (echoThreshold == null) return false;

  const driveSet = new Set(lens.driveTags);
  let overlap = 0;
  for (const tag of dilemmaEmotionalTags) {
    if (driveSet.has(tag)) overlap++;
  }

  return overlap >= echoThreshold;
}

/**
 * Compose final lensed prose from base template + overlay + optional echo.
 *
 * Composition rules:
 * - No matching overlay → return baseProse unchanged (fail-soft)
 * - Overlay matches → baseProse + "\n\n" + perceptionProse
 * - Echo fires (threshold met) → + "\n\n" + echoProse
 *
 * @param baseProse - The base dilemma template prose
 * @param overlays - Per-Hunger prose overlays
 * @param lens - The god's complete narrative identity
 * @param dilemmaEmotionalTags - Emotional register tags from the dilemma
 * @returns Composed prose string
 */
export function composeLensedProse(
  baseProse: string,
  overlays: readonly LensOverlay[],
  lens: AscendantLens,
  dilemmaEmotionalTags: readonly string[],
): string {
  const overlay = resolveLensOverlay(overlays, lens.hunger.id);
  if (!overlay) return baseProse;

  let result = baseProse + '\n\n' + overlay.perceptionProse;

  if (
    overlay.echoProse &&
    shouldFireMortalEcho(lens, dilemmaEmotionalTags, overlay.echoThreshold)
  ) {
    result += '\n\n' + overlay.echoProse;
  }

  return result;
}
