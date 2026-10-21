// PROTO — THR-2006 (design lane 2026-10-21a). Lives only on proto/thr-2006-founding-patron.
//
// A founding the mortal cannot pay for is paid by the faction they rank highest in whose
// purse covers it (the patron). Ties break by faction id. No patron → the cell stays off
// the board, exactly as founding costs already do.

import type { WorldGraph } from './graph';
import { isPurseFaction } from './factionPurse/income';
import { getDerivedMembershipRank } from './factionReputation';
import { applyTreasuryDelta, readWealth } from './wealth';

export function findFoundingPatron(graph: WorldGraph, founderId: string, cost: number): string | null {
  let best: { id: string; rank: number } | null = null;
  for (const edge of graph.getOutgoingEdges(founderId, 'member_of')) {
    const faction = graph.getNode(edge.target);
    if (!isPurseFaction(faction)) continue;
    if (readWealth(faction.properties as Record<string, unknown>) < cost) continue;
    const rank = getDerivedMembershipRank(edge);
    if (!best || rank > best.rank || (rank === best.rank && faction.id < best.id)) best = { id: faction.id, rank };
  }
  return best?.id ?? null;
}

/** Charge the patron's purse. Returns true when it paid. */
export function chargeFoundingPatron(graph: WorldGraph, founderId: string, cost: number): string | null {
  const patronId = findFoundingPatron(graph, founderId, cost);
  if (!patronId) return null;
  const patron = graph.getNode(patronId)!;
  patron.properties.wealth = applyTreasuryDelta(readWealth(patron.properties as Record<string, unknown>), -cost);
  return patronId;
}
