/**
 * Ascendant Lens Builders
 *
 * Builds the `AscendantLens` — the god's narrative identity (Hunger, mortal
 * origin, drive, drive tags) — from either the player's authored remembrance
 * identity or, on identity-less paths, a sphere-derived stub.
 *
 * The lens reaches the player through *dilemma selection*: `scoreDilemmaResonance`
 * weighs `emotionalRegister ∩ hunger.dilemmaResonanceTags`, so the Hunger you
 * chose decides which formative tests your First is put through (THR-1213).
 *
 * THR-1318 retired the second channel that once lived here — a per-Hunger prose
 * overlay engine (`resolveLensOverlay` / `shouldFireMortalEcho` /
 * `composeLensedProse`) that was authored, unit-tested, and never called. Its
 * content side had been written for exactly one of twelve Hungers on 10 of 167
 * dilemmas, so activating it would have handed `gather` gods an occasional extra
 * paragraph and the other eleven nothing. Selection already carries the Hunger to
 * the meeting; a promise with no mechanism is worse than an absence.
 *
 * All functions are pure — no side effects, no state mutation.
 */

import { HUNGER_CATALOG } from '../data/hunger-catalog';
import type { CreationSphereName, SphereName } from '../types';
import type { AscendantLens, HungerId } from '../types/hunger';
import { toHungerId, toResonanceTags } from '../types/hunger';
import type { AscendantIdentity } from '../types/remembrance';

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
  primarySphere: SphereName,
  _secondarySphere: SphereName,
): AscendantLens {
  // Partial index: the map is keyed on the eight Creation spheres, and a
  // Foundation-sphere ascendant is representable — it falls through to the
  // default rather than being unrepresentable at the type level (NFP #4).
  const hungerId =
    (SPHERE_TO_HUNGER as Partial<Record<SphereName, HungerId>>)[primarySphere] ??
    FALLBACK_HUNGER_ID;
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
 * Build the lens from the player's own remembrance identity — the god the
 * player actually authored, not the archetype they were dealt.
 *
 * This is the resolver the seam existed for (THR-1213 slice 2). Before it, the
 * only lens in the tree was {@link buildStubAscendantLens} reading *archetype*
 * spheres, and its one caller was a memo nothing consumed: the Hunger chosen in
 * remembrance shaped prose framing and never the deal.
 *
 * `driveTags` narrows `identity.mortalTags` rather than casting it, because that
 * list is genuinely mixed — a fragment contributes real themes (`knowledge`,
 * `devotion`) alongside origin words that are not themes at all (`scholar`,
 * `rural`, `recent`). Narrowing keeps the tags that can overlap and drops the
 * ones that provably cannot.
 *
 * Fail-soft (NFP #4): a legacy, unknown, or corrupt `hungerId` resolves to
 * `undefined` through the bridge and falls back to the sphere stub, so selection
 * still gets a lens and the meeting still deals.
 */
export function buildLensFromIdentity(identity: AscendantIdentity): AscendantLens {
  const hungerId = toHungerId(identity.hungerId);
  const hunger = hungerId ? HUNGER_CATALOG.find((h) => h.id === hungerId) : undefined;

  if (!hunger) {
    return buildStubAscendantLens(
      identity.sphereAlignment.primary,
      identity.sphereAlignment.secondary,
    );
  }

  const driveTags = toResonanceTags(identity.mortalTags);

  return {
    hunger,
    mortalOrigin: identity.originFragmentId,
    drive: identity.mandateDirection,
    // An identity whose fragments contributed no in-vocabulary tag would
    // otherwise score every drive overlap at zero; fall back to the hunger's
    // own themes so the drive axis degrades to the hunger axis, never to dead.
    driveTags: driveTags.length > 0 ? driveTags : [...hunger.dilemmaResonanceTags.slice(0, 3)],
    timeSinceAscension: identity.timeSinceAscension,
    mortalName: identity.mortalName,
  };
}
