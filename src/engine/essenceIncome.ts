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
  ESSENCE_PER_SEAT,
  TIER_MAINTENANCE,
} from '../types/influence';
import { ASPECT_ESSENCE_PER_TICK } from '../data/aspect-content';
import type { WorldGraph } from './graph';
import type { ControlEffect } from '../types/controlEffect';
import { computeSourceIncome, readEssenceSource, upkeepChargedSources } from './essenceSources';
import { SOURCE_CONTROL_SUSTAIN } from '../data/essence-sources';
import { distributeBySpherePoints, getSpherePoints } from './spherePoints';

function emptyPool(): EssencePool {
  return Object.fromEntries(SPHERE_NAMES.map(s => [s, 0])) as EssencePool;
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

  // Home seat is a named higher-yield place of power — excluded from the
  // place-of-power loop and added once as ESSENCE_PER_SEAT (mirrors
  // computeEssenceGeneration in influence.ts, THR-502).
  const homeSeatLocationId = node.properties.homeSeatLocationId as string | undefined;
  const controlEdges = graph.getOutgoingEdges(ascendantId, 'controls');
  for (const edge of controlEdges) {
    if (edge.target === homeSeatLocationId) continue;
    const loc = graph.getNode(edge.target);
    if (!loc) continue;
    // Typed essence sources (THR-611) are counted in the source term below.
    if (readEssenceSource(loc.properties)?.sphereAffinity) continue;
    if (loc.properties.isPlaceOfPower) {
      totalRate += ESSENCE_PER_PLACE_OF_POWER;
    }
  }
  if (homeSeatLocationId && graph.getNode(homeSeatLocationId)) {
    totalRate += ESSENCE_PER_SEAT;
  }

  // Aspect conduit bonus (THR-479) — mirrors computeEssenceGeneration. Living
  // aspects only; mythic echoes no longer channel.
  const aspectEdges = graph.getOutgoingEdges(ascendantId, 'aspect_of');
  for (const edge of aspectEdges) {
    if (edge.properties.mythicEcho !== true) {
      totalRate += ASPECT_ESSENCE_PER_TICK;
    }
  }

  // THR-1749: the same split the ledger uses (influence.ts computeEssenceGeneration).
  const gross: EssencePool = distributeBySpherePoints(totalRate, getSpherePoints(node.properties));

  // Maintenance cost (deducted from primary sphere)
  let totalMaintenance = 0;
  for (const edge of threadEdges) {
    const tier = edge.properties.tier as InfluenceTier | undefined;
    totalMaintenance += tier !== undefined ? (TIER_MAINTENANCE[tier] ?? 0) : 0;
  }
  // THR-1747: source upkeep, charged by phaseEssenceSources from the primary sphere
  // (the same upkeepChargedSources walk chargeSourceUpkeep uses — the home seat excluded) — so the
  // readout and the ledger agree (THR-1652 lesson). Assumes every source is paid; an
  // unpaid source is charged nothing, which the Covenants row says in words.
  totalMaintenance += upkeepChargedSources(graph, ascendantId).length * SOURCE_CONTROL_SUSTAIN;

  const net = { ...gross };
  net[alignment.primary] = gross[alignment.primary] - totalMaintenance;

  // Typed essence-source income (THR-611) — per-sphere, tier/DR scaled. Mirrors
  // the term in computeEssenceGeneration; untyped sources stay on the legacy path.
  const sourceIncome = computeSourceIncome(graph, ascendantId);
  for (const [sphere, amount] of Object.entries(sourceIncome)) {
    const s = sphere as SphereName;
    if (amount && SPHERE_NAMES.includes(s)) net[s] = (net[s] ?? 0) + amount;
  }

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
