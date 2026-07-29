/**
 * Rival scheme families registry (THR-66, THR-619, THR-621).
 *
 * Four families ship: corruptive and territorial (THR-66); economic
 * (THR-619 — sour-mines → corner-grain → break-guild → starve-faithful), which
 * rides the Mortal Economy P1 stock substrate (THR-615) and is gated behind it
 * via `requiresStocks`; and profane (THR-621 — sound-the-ground → open-the-drain
 * → press-the-wound → profane-the-source), which rides the essence-source
 * substrate (THR-611) and is gated behind the player actually holding a
 * contestable source via `requiresPlayerSource`.
 */
import type { RivalSchemeFamily } from './types';
import type { RivalBehavior } from '../../types/rival';
import { CORRUPTIVE_FAMILY } from './corruptive';
import { TERRITORIAL_FAMILY } from './territorial';
import { ECONOMIC_FAMILY } from './economic';
import { PROFANE_FAMILY } from './profane';

export type { RivalSchemeFamily, RivalSchemeBeat, RivalSchemeMoveKind } from './types';
export { CORRUPTIVE_FAMILY } from './corruptive';
export { TERRITORIAL_FAMILY } from './territorial';
export { ECONOMIC_FAMILY } from './economic';
export { PROFANE_FAMILY } from './profane';

/** All authored scheme families, deterministic order. */
export const RIVAL_SCHEME_FAMILIES: readonly RivalSchemeFamily[] = [
  CORRUPTIVE_FAMILY,
  TERRITORIAL_FAMILY,
  ECONOMIC_FAMILY,
  PROFANE_FAMILY,
];

/** Lookup a family by id. */
export function getRivalSchemeFamily(id: string): RivalSchemeFamily | undefined {
  return RIVAL_SCHEME_FAMILIES.find((f) => f.id === id);
}

/**
 * Families a rival may launch given its behavior and current escalation tier.
 * Deterministic order preserved. Sphere lean is flavor, not a gate.
 *
 * `worldHasStocks` gates families that declare `requiresStocks` (THR-619) and
 * `worldHasPlayerSource` gates those that declare `requiresPlayerSource`
 * (THR-621). Both default to `false` so a caller that has not measured the world
 * cannot accidentally launch a substrate-dependent family — the economic arc
 * stays ineligible until someone proves stocks exist, and the profane arc until
 * someone proves the player holds a source worth bleeding.
 */
export function eligibleSchemeFamilies(
  behavior: RivalBehavior,
  escalationTier: number,
  worldHasStocks: boolean = false,
  worldHasPlayerSource: boolean = false,
): RivalSchemeFamily[] {
  return RIVAL_SCHEME_FAMILIES.filter(
    (f) =>
      f.eligibleBehaviors.includes(behavior) &&
      escalationTier >= f.minTier &&
      (!f.requiresStocks || worldHasStocks) &&
      (!f.requiresPlayerSource || worldHasPlayerSource),
  );
}
