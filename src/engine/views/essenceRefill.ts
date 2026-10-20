/**
 * Essence refill band — how fast a pool refills, as a word (THR-1985, plan E1/E2).
 *
 * Pure view. A sphere's band is its **net** income as a **share** of the god's
 * total **gross** income, never an absolute rate: the Seat and thread yield raise
 * the total, and an absolute band would re-word every row when they arrive. The
 * split is proportional (`distributeBySpherePoints`), so a sphere's share depends
 * only on the pour — except the deepest sphere, which pays the upkeep.
 */

import { SPHERE_NAMES } from '../../types';
import type { SphereName } from '../../types';
import type { ControlEffect } from '../../types/controlEffect';
import type { WorldGraph } from '../graph';
import { computeEssenceIncomeBreakdown } from '../essenceIncome';
import { getUpkeepStatus } from '../ascendantPrimitives';
import { BASE_ESSENCE_PER_TICK } from '../../types/influence';
import { deriveAlignmentFromPoints, distributeBySpherePoints, type SpherePoints } from '../spherePoints';
import {
  ESSENCE_REFILL_FAST_SHARE,
  ESSENCE_REFILL_STEADY_SHARE,
  type EssenceRefillBand,
} from '../../data/essence-refill-content';

export type { EssenceRefillBand } from '../../data/essence-refill-content';

/**
 * One sphere's net income as a share of the god's total gross income → its band.
 * `grossTotalPerTick ≤ 0` (or a non-finite input) → `null`: no band, the row
 * shows none (fail-soft, NFP #4).
 */
export function essenceRefillBand(netPerTick: number, grossTotalPerTick: number): EssenceRefillBand | null {
  if (!Number.isFinite(netPerTick) || !Number.isFinite(grossTotalPerTick) || grossTotalPerTick <= 0) return null;
  const share = netPerTick / grossTotalPerTick;
  if (share >= ESSENCE_REFILL_FAST_SHARE) return 'fast';
  if (share >= ESSENCE_REFILL_STEADY_SHARE) return 'steady';
  if (share > 0) return 'slow';
  return 'drains';
}

export interface EssenceRefillSphere {
  netPerTick: number;
  share: number;
  band: EssenceRefillBand;
}

export interface EssenceRefillReading {
  grossTotalPerTick: number;
  spheres: Partial<Record<SphereName, EssenceRefillSphere>>;
}

/**
 * Every sphere's refill band for the god, read from the essence ledger's own
 * mirror (`computeEssenceIncomeBreakdown`). A throw inside the ledger read
 * returns an empty reading — rows then show no refill word (today's row).
 */
export function readEssenceRefill(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects?: readonly ControlEffect[],
): EssenceRefillReading {
  try {
    const { net: ledgerNet, grossTotal } = computeEssenceIncomeBreakdown(graph, ascendantId, controlEffects);
    // A sustained control's per-tick cost is charged from the pool by
    // phaseControlEffects (Step 3b) but is not part of the income mirror; the
    // band nets it out so a pool a control is draining reads "Drains". A cost a
    // sustaining relic waives is not charged, so it is not netted here either.
    const net = { ...ledgerNet };
    for (const effect of controlEffects ?? []) {
      if (!effect.active || getUpkeepStatus(effect, graph) !== 'no_relic') continue;
      for (const [sphere, cost] of Object.entries(effect.perTickCost)) {
        const s = sphere as SphereName;
        if (typeof cost === 'number' && cost > 0 && s in net) net[s] -= cost;
      }
    }
    const spheres: Partial<Record<SphereName, EssenceRefillSphere>> = {};
    for (const sphere of SPHERE_NAMES) {
      const netPerTick = net[sphere] ?? 0;
      const band = essenceRefillBand(netPerTick, grossTotal);
      if (band) spheres[sphere] = { netPerTick, share: netPerTick / grossTotal, band };
    }
    return { grossTotalPerTick: grossTotal, spheres };
  } catch {
    return { grossTotalPerTick: 0, spheres: {} };
  }
}

export interface PourRefillPreview {
  /** Each sphere's band for this pour, from the base income alone. */
  bands: Record<SphereName, EssenceRefillBand>;
  /** The deepest sphere — the one that will pay upkeep — or null while the pour names fewer than two. */
  deepest: SphereName | null;
}

/**
 * THR-1985 (plan E2) — the pour screen's live preview. Splits the base income by
 * the points poured so far and bands each sphere's share. Because bands are
 * shares, the word matches the row the player reads after the bond for every
 * sphere but the deepest (which pays upkeep) and any a source feeds directly.
 */
export function previewPourRefill(points: SpherePoints): PourRefillPreview {
  const income = distributeBySpherePoints(BASE_ESSENCE_PER_TICK, points);
  const bands = {} as Record<SphereName, EssenceRefillBand>;
  for (const sphere of SPHERE_NAMES) {
    bands[sphere] = essenceRefillBand(income[sphere], BASE_ESSENCE_PER_TICK) ?? 'slow';
  }
  return { bands, deepest: deriveAlignmentFromPoints(points)?.primary ?? null };
}
