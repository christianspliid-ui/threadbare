/**
 * The faction purse — upkeep (THR-1931). Pure helpers over the graph.
 *
 * An army belongs to the faction its `member_of` edge names. Upkeep is paid in army id
 * order, whole armies only: the first army the purse cannot cover and every army after
 * it go unpaid that day (§ Resolution 2). There is no debt; the purse floors at 0.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { ArmySizeCategory, ArmyState } from '../../types/army';
import { ARMY_UPKEEP_PER_DAY } from '../../data/faction-purse-constants';

export interface FieldedArmy {
  id: string;
  size: ArmySizeCategory;
  upkeep: number;
}

/** Daily upkeep of one army by size; an unknown size costs a warband's. */
export function upkeepOf(size: ArmySizeCategory | string | undefined): number {
  return ARMY_UPKEEP_PER_DAY[size as ArmySizeCategory] ?? ARMY_UPKEEP_PER_DAY.warband;
}

/** The armies a faction fields, in id order. */
export function armiesOf(graph: WorldGraph, factionId: string): FieldedArmy[] {
  const out: FieldedArmy[] = [];
  for (const e of graph.getIncomingEdges(factionId, 'member_of')) {
    const n: GraphNode | undefined = graph.getNode(e.source);
    const as = n?.properties.armyState as ArmyState | undefined;
    if (!n || !as) continue;
    out.push({ id: n.id, size: as.size, upkeep: upkeepOf(as.size) });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Total daily upkeep a faction fields. */
export function upkeepPerDayOf(graph: WorldGraph, factionId: string): number {
  return armiesOf(graph, factionId).reduce((s, a) => s + a.upkeep, 0);
}

export interface UpkeepSettlement {
  wealthAfter: number;
  paid: string[];
  unpaid: string[];
  upkeepOwed: number;
  upkeepPaid: number;
}

/** Pay armies in id order from `wealth`; the first one that cannot be covered and every one after go unpaid. */
export function settleUpkeep(wealth: number, armies: readonly FieldedArmy[]): UpkeepSettlement {
  let w = wealth;
  const paid: string[] = [];
  const unpaid: string[] = [];
  let upkeepPaid = 0;
  let broke = false;
  for (const a of armies) {
    if (!broke && w + 1e-9 >= a.upkeep) {
      w -= a.upkeep;
      upkeepPaid += a.upkeep;
      paid.push(a.id);
    } else {
      broke = true;
      unpaid.push(a.id);
    }
  }
  const upkeepOwed = armies.reduce((s, a) => s + a.upkeep, 0);
  return { wealthAfter: Math.max(0, w), paid, unpaid, upkeepOwed, upkeepPaid };
}
