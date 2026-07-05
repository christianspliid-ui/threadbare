/**
 * Rival scheme families registry (THR-66).
 *
 * Two families ship now (corruptive, territorial) and fully exercise the
 * scheme framework. The economic family (sour-mines → corner-grain →
 * break-guild → starve-faithful) is designed in
 * `Docs/plans/2026-07-05-rival-activation-schemes.md` but blocked on the
 * Mortal Economy P1 stock substrate (THR-615) and tracked as THR-620.
 */
import type { RivalSchemeFamily } from './types';
import type { RivalBehavior } from '../../types/rival';
import { CORRUPTIVE_FAMILY } from './corruptive';
import { TERRITORIAL_FAMILY } from './territorial';

export type { RivalSchemeFamily, RivalSchemeBeat, RivalSchemeMoveKind } from './types';
export { CORRUPTIVE_FAMILY } from './corruptive';
export { TERRITORIAL_FAMILY } from './territorial';

/** All authored scheme families, deterministic order. */
export const RIVAL_SCHEME_FAMILIES: readonly RivalSchemeFamily[] = [
  CORRUPTIVE_FAMILY,
  TERRITORIAL_FAMILY,
];

/** Lookup a family by id. */
export function getRivalSchemeFamily(id: string): RivalSchemeFamily | undefined {
  return RIVAL_SCHEME_FAMILIES.find((f) => f.id === id);
}

/**
 * Families a rival may launch given its behavior and current escalation tier.
 * Deterministic order preserved. Sphere lean is flavor, not a gate.
 */
export function eligibleSchemeFamilies(
  behavior: RivalBehavior,
  escalationTier: number,
): RivalSchemeFamily[] {
  return RIVAL_SCHEME_FAMILIES.filter(
    (f) => f.eligibleBehaviors.includes(behavior) && escalationTier >= f.minTier,
  );
}
