/**
 * THR-1865 PROTOTYPE — Means as a want and a cost. THROWAWAY (never merged).
 *
 * - `computeMeansWant`: how much a mortal wants earning work, from poverty and the
 *   Generous/Greedy lean on `asceticism_extravagance` (+1 = Generous, −1 = Greedy).
 * - `meansCellKey` / `meansCellCost` / `isEarningCell`: cell classification.
 * - `meansProtoStats`: module-level counters the sketch reads. Module-scope state is a
 *   prototype shortcut (the real rule would own this per SimulationRuntime).
 */

import type { WorldGraph } from './graph';
import type { StrategicActionTemplate } from '../types/strategicAction';
import { readWealth } from './wealth';
import {
  MEANS_COMFORT_LINE,
  MEANS_POVERTY_SPAN,
  MEANS_GENEROSITY_DAMP,
  MEANS_GREED_WEIGHT,
  MEANS_RICH_LINE,
  MEANS_RICH_GREED_CEILING,
  MEANS_RICH_DAMPEN,
  MEANS_WANT_WEIGHT,
  MEANS_UNAFFORDED_WANT,
  MEANS_CELL_COST,
  MEANS_EARNING_CELLS,
  MEANS_EARNING_ENCOUNTER_TYPES,
  meansWantRuntime,
} from '../data/means-want-constants';

const GREED_AXIS = 'asceticism_extravagance';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function isMeansEnabled(): boolean {
  return meansWantRuntime.enabled;
}

export interface MeansWantBreakdown {
  readonly wealth: number;
  readonly poverty: number;
  readonly greed: number;
  readonly generosity: number;
  readonly unafforded: boolean;
  readonly want: number;
}

/**
 * The want. `profileLean` is the actor's value on `asceticism_extravagance`
 * (+1 Generous, −1 Greedy). `unafforded` adds `MEANS_UNAFFORDED_WANT`.
 */
export function computeMeansWantFrom(wealth: number, profileLean: number, unafforded = false): MeansWantBreakdown {
  const poverty = clamp((MEANS_COMFORT_LINE - wealth) / MEANS_POVERTY_SPAN, 0, 1);
  const greed = clamp(-profileLean, 0, 1);
  const generosity = clamp(profileLean, 0, 1);
  let want = clamp(poverty * (1 - MEANS_GENEROSITY_DAMP * generosity) + MEANS_GREED_WEIGHT * greed, 0, 1);
  if (wealth >= MEANS_RICH_LINE && greed < MEANS_RICH_GREED_CEILING) want = -MEANS_RICH_DAMPEN;
  if (unafforded) want = clamp(want + MEANS_UNAFFORDED_WANT, -1, 1);
  return { wealth, poverty, greed, generosity, unafforded, want };
}

/** Graph-reading form: wealth from properties, lean from `axiologicalProfile` (or the passed profile). */
export function computeMeansWant(
  graph: WorldGraph,
  actorId: string,
  profile?: Partial<Record<string, number>>,
  unafforded = false,
): MeansWantBreakdown {
  const node = graph.getNode(actorId);
  const props = (node?.properties ?? {}) as Record<string, unknown>;
  const ownProfile = props.axiologicalProfile as Partial<Record<string, number>> | undefined;
  const lean = profile?.[GREED_AXIS] ?? ownProfile?.[GREED_AXIS] ?? 0;
  return computeMeansWantFrom(readWealth(props), typeof lean === 'number' ? lean : 0, unafforded);
}

export function meansMultiplier(want: number): number {
  return 1 + MEANS_WANT_WEIGHT * want;
}

export function meansCellKey(template: StrategicActionTemplate | undefined): string | null {
  if (!template?.cellVariant || !template.objectTypeId) return null;
  return `${template.cellVariant}×${template.objectTypeId}`;
}

export function meansCellCost(template: StrategicActionTemplate | undefined): number {
  const key = meansCellKey(template);
  return key ? MEANS_CELL_COST[key] ?? 0 : 0;
}

export function isEarningCell(template: StrategicActionTemplate | undefined): boolean {
  const key = meansCellKey(template);
  return key !== null && MEANS_EARNING_CELLS.has(key);
}

export function isEarningEncounterType(type: string | undefined): boolean {
  return type !== undefined && MEANS_EARNING_ENCOUNTER_TYPES.has(type);
}

export function isMortal(graph: WorldGraph, actorId: string): boolean {
  return graph.getNode(actorId)?.properties.actorType === 'individual';
}

// ─── Prototype counters (sketch-only) ──────────────────────────────────────

export interface MeansProtoStats {
  /** Board winners at or above the floor, by mortal deciders. */
  decisions: number;
  /** …of which earning work (earning cell or trade/acquire/steal/hire encounter). */
  earningDecisions: number;
  /** executeStrategicAction calls (any undertaking start) by mortals. */
  undertakingStarts: number;
  /** …of which a cell. */
  cellStarts: number;
  /** …of which an earning cell. */
  earningCellStarts: number;
  /** …of which a costed cell (wealth charged when enabled). */
  costedCellStarts: number;
  /** Wealth charged in total. */
  wealthCharged: number;
  /** Board-time drops of a costed cell candidate for cost (one per candidate per decision). */
  dropEvents: number;
  /** Distinct (actor, cell) pairs ever dropped for cost. */
  droppedPairs: Set<string>;
  /** Decisions where the mortal's top-desired cell was the one dropped. */
  unaffordedTopDesire: number;
  /** Distinct template ids of starts (by key), for the sketch. */
  startsByCell: Map<string, number>;
}

export function freshStats(): MeansProtoStats {
  return {
    decisions: 0, earningDecisions: 0, undertakingStarts: 0, cellStarts: 0,
    earningCellStarts: 0, costedCellStarts: 0, wealthCharged: 0, dropEvents: 0,
    droppedPairs: new Set(), unaffordedTopDesire: 0, startsByCell: new Map(),
  };
}

/** Sketch hook: sees every BoardInput the decision phase scores (prototype seam). */
export const meansProtoCapture: { onBoard?: (input: unknown) => void } = {};

export const meansProtoStats: { current: MeansProtoStats; counting: boolean } = {
  current: freshStats(),
  counting: true,
};
