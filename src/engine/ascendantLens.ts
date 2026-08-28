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

import { HUNGER_CATALOG } from '../data/hunger-catalog';
import type { CreationSphereName } from '../types';
import type { AscendantLens, HungerId } from '../types/hunger';
import type { LensOverlay } from '../types/meetingEncounter';

// ─── Stub Lens Builder ───────────────────────────────────────────

/**
 * Default Hunger for each Creation Sphere — used by
 * {@link buildStubAscendantLens}.
 */
const SPHERE_TO_HUNGER: Record<CreationSphereName, HungerId> = {
  force: 'reshape',
  matter: 'bind',
  energy: 'kindle',
  life: 'gather',
  mind: 'witness',
  spirit: 'preserve',
  time: 'preserve',
  entropy: 'consume',
};

/** Default fallback Hunger when sphere doesn't map. */
const FALLBACK_HUNGER_ID: HungerId = 'gather';

/**
 * Build a stub AscendantLens from a sphere pair — the identity-less floor.
 *
 * Used on paths that have an archetype but no player-authored remembrance
 * identity (`?view=game` without `&seeded`). Maps the primary sphere to a
 * default Hunger and fills in placeholder mortal-origin data. The secondary
 * sphere is currently unused but reserved for future nuance.
 *
 * THR-1213 moved this here from `src/types/hunger.ts`: it reads the catalog,
 * and the catalog is data — types must not import data.
 */
export function buildStubAscendantLens(
  primarySphere: CreationSphereName,
  _secondarySphere: CreationSphereName,
): AscendantLens {
  const hungerId = SPHERE_TO_HUNGER[primarySphere] ?? FALLBACK_HUNGER_ID;
  const hunger = HUNGER_CATALOG.find((h) => h.id === hungerId) ?? HUNGER_CATALOG[0];

  return {
    hunger,
    mortalOrigin: 'unknown',
    drive: 'a nameless yearning that survived the crossing',
    driveTags: [...hunger.dilemmaResonanceTags.slice(0, 3)],
    timeSinceAscension: 'ancient',
    mortalName: 'the Forgotten',
  };
}

/**
 * Find the lens overlay matching the active Hunger.
 *
 * @param overlays - Per-Hunger prose overlays from the enriched dilemma template
 * @param hungerId - The god's active Hunger ID
 * @returns The matching overlay, or undefined if none exists
 */
export function resolveLensOverlay(
  overlays: readonly LensOverlay[],
  hungerId: HungerId,
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

  // Widened to `string`: the caller's tags are an untyped read boundary.
  const driveSet = new Set<string>(lens.driveTags);
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
