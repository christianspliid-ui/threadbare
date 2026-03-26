/**
 * View-layer utility: compute per-sphere net essence income per tick.
 *
 * Pure function — reads graph state, no mutations. Mirrors the logic in
 * influence.ts (computeEssenceGeneration + processInfluenceMaintenance) but
 * returns a net income record without touching the pool.
 */

import { SPHERE_NAMES } from '../types';
import type { SphereName } from '../types';
import type { EssencePool, SphereAlignment, InfluenceTier } from '../types/influence';
import {
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_THREAD,
  ESSENCE_PER_PLACE_OF_POWER,
  TIER_MAINTENANCE,
} from '../types/influence';
import type { WorldGraph } from './graph';
import type { ControlEffect } from '../types/controlEffect';

function emptyPool(): EssencePool {
  return Object.fromEntries(SPHERE_NAMES.map(s => [s, 0])) as EssencePool;
}

function distributeByAlignment(total: number, alignment: SphereAlignment): EssencePool {
  const gen = emptyPool();
  const primaryShare = total * 0.35;
  const secondaryShare = total * 0.25;
  const otherSpheres = SPHERE_NAMES.filter(
    (s: SphereName) => s !== alignment.primary && s !== alignment.secondary
  );
  const perOther = (total * 0.40) / otherSpheres.length;

  gen[alignment.primary] = primaryShare;
  gen[alignment.secondary] = secondaryShare;
  for (const s of otherSpheres) {
    gen[s] = perOther;
  }
  return gen;
}

/**
 * Compute net per-sphere essence income per tick (gross generation minus maintenance).
 * Maintenance is charged against the primary sphere.
 */
export function computeEssenceIncome(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects?: readonly ControlEffect[],
): EssencePool {
  const node = graph.getNode(ascendantId);
  if (!node) return emptyPool();

  const alignment = node.properties.sphereAlignment as SphereAlignment | undefined;
  if (!alignment) return emptyPool();

  // Gross generation
  let totalRate = BASE_ESSENCE_PER_TICK;
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  totalRate += threadEdges.length * ESSENCE_PER_THREAD;

  const controlEdges = graph.getOutgoingEdges(ascendantId, 'controls');
  for (const edge of controlEdges) {
    const loc = graph.getNode(edge.target);
    if (loc?.properties.isPlaceOfPower) {
      totalRate += ESSENCE_PER_PLACE_OF_POWER;
    }
  }

  const gross = distributeByAlignment(totalRate, alignment);

  // Maintenance cost (deducted from primary sphere)
  let totalMaintenance = 0;
  for (const edge of threadEdges) {
    const tier = edge.properties.tier as InfluenceTier | undefined;
    totalMaintenance += tier !== undefined ? (TIER_MAINTENANCE[tier] ?? 0) : 0;
  }

  const net = { ...gross };
  net[alignment.primary] = gross[alignment.primary] - totalMaintenance;

  // Control effect income (per-sphere, not distributed by alignment)
  if (controlEffects) {
    for (const effect of controlEffects) {
      if (!effect.active || !effect.perTickIncome) continue;
      for (const [sphere, income] of Object.entries(effect.perTickIncome)) {
        const s = sphere as SphereName;
        if (SPHERE_NAMES.includes(s)) {
          net[s] = (net[s] ?? 0) + (income as number);
        }
      }
    }
  }

  return net;
}
