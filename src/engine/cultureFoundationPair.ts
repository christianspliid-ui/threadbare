/**
 * cultureFoundationPair — derive the `CULTURE_LOCATION_PROSE` key for a culture (THR-1623).
 *
 * The culture prose table is keyed by a *foundation pair* — one pole from the
 * Order/Chaos axis and one from the Light/Darkness axis (`order_light`,
 * `chaos_darkness`, …). No culture stores that pair: a `CultureIdentity` carries a
 * single `foundationBias` (one of the four Foundation Spheres) plus its
 * `veneratedSpheres`. The pair is derived here, once, so every reader — the location
 * and mortal prose resolvers and the hex chronicle — computes the same key and none
 * can drift from worldgen (the THR-1623 defect was two resolvers reading a
 * `foundationPair` field that no writer ever produced).
 *
 * Rule:
 *  - The bias fills its own axis.
 *  - The other axis comes from the venerated spheres: the first pole of that axis the
 *    culture venerates wins.
 *  - A culture venerating neither pole of the other axis takes the axis default below.
 *
 * Pure and deterministic — no PRNG, no graph access.
 */

import type { SphereName } from '../types';

/** Light/Darkness pole used when an Order/Chaos culture venerates neither Light nor Darkness. */
export const DEFAULT_LIGHT_DARKNESS_POLE = 'light' as const;

/** Order/Chaos pole used when a Light/Darkness culture venerates neither Order nor Chaos. */
export const DEFAULT_ORDER_CHAOS_POLE = 'order' as const;

const ORDER_CHAOS_AXIS = ['order', 'chaos'] as const;
const LIGHT_DARKNESS_AXIS = ['light', 'darkness'] as const;

type OrderChaosPole = typeof ORDER_CHAOS_AXIS[number];
type LightDarknessPole = typeof LIGHT_DARKNESS_AXIS[number];

/** A `CULTURE_LOCATION_PROSE` key: `<order|chaos>_<light|darkness>`. */
export type FoundationPairKey = `${OrderChaosPole}_${LightDarknessPole}`;

/** The shape this helper reads — a `CultureIdentity`, or the legacy fixture shape. */
export interface FoundationPairSource {
  foundationBias?: string;
  veneratedSpheres?: readonly (SphereName | string)[];
  /**
   * Legacy explicit key. No worldgen writer sets it; honoured only so hand-built
   * fixtures that predate THR-1623 keep resolving. A derived key wins when absent.
   */
  foundationPair?: string;
}

function firstVenerated<T extends string>(
  axis: readonly T[],
  spheres: readonly string[],
): T | undefined {
  // Venerated order wins — the culture's first-listed sphere is its strongest.
  for (const s of spheres) {
    if ((axis as readonly string[]).includes(s)) return s as T;
  }
  return undefined;
}

/**
 * Resolve the culture's foundation-pair prose key, or `null` when the culture has no
 * recognisable foundation (fail-soft: the caller emits no culture layer).
 */
export function getCultureFoundationPairKey(
  identity: FoundationPairSource | null | undefined,
): FoundationPairKey | null {
  if (!identity) return null;

  if (typeof identity.foundationPair === 'string' && identity.foundationPair.length > 0) {
    return identity.foundationPair as FoundationPairKey;
  }

  const bias = identity.foundationBias;
  const spheres = identity.veneratedSpheres ?? [];

  if (bias === 'order' || bias === 'chaos') {
    const pole = firstVenerated(LIGHT_DARKNESS_AXIS, spheres) ?? DEFAULT_LIGHT_DARKNESS_POLE;
    return `${bias}_${pole}`;
  }
  if (bias === 'light' || bias === 'darkness') {
    const pole = firstVenerated(ORDER_CHAOS_AXIS, spheres) ?? DEFAULT_ORDER_CHAOS_POLE;
    return `${pole}_${bias}`;
  }
  return null;
}
