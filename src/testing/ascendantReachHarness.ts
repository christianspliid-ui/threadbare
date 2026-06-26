/**
 * Ascendant-reach harness helper (THR-494).
 *
 * Reusable bridge between the pinned-reach fixtures and the engine's
 * identity-based init path. Any batch harness (gameplay-report, content
 * census, ad-hoc smoke) can build a fully-seeded initial game state for a
 * chosen primary reach without reaching into `createAscendantFromIdentity`
 * directly.
 */

import type { ReachDomain } from '../types/traits';
import type { CosmologyProfile } from '../types/index';
import { initializeGameStateFromIdentity } from '../engine/gameInit';
import type { MapSizePreset } from '../engine/gameInit';
import { getAscendantReachIdentity } from '../data/__fixtures__/ascendant-reach-fixtures';

export interface BuildAscendantReachStateOptions {
  /** Override the map size (default: derived from the fixture's hunger). */
  mapSize?: MapSizePreset;
  /**
   * Override the cosmology (default: derived from the fixture's identity via
   * `deriveCosmologyFromIdentity`). Pass `createBalancedCosmology()` to compare
   * reaches against a neutral cosmology.
   */
  cosmology?: CosmologyProfile;
}

/**
 * Build a fully-seeded initial game state for a pinned-reach ascendant.
 *
 * Deterministic: same `(reach, seed, opts)` → identical state. Unknown reach
 * throws a clear error (via `getAscendantReachIdentity`).
 */
export function buildAscendantReachState(
  reach: ReachDomain | string,
  seed: number,
  opts: BuildAscendantReachStateOptions = {},
): ReturnType<typeof initializeGameStateFromIdentity> {
  const identity = getAscendantReachIdentity(reach);
  return initializeGameStateFromIdentity(identity, seed, opts.cosmology, opts.mapSize);
}
