/**
 * THR-2008 — the founding patron (decided on THR-2006, design lane 2026-10-21a).
 * Spec: Docs/audits/2026-10-21-thr-2006-founding-patron.md § 4.
 *
 * Once founding costs are on, a founding the mortal cannot pay for is paid by the
 * faction they rank highest in whose purse covers it: the patron. Ties break by faction
 * id (NFP #3). No patron → the cell stays off the board, exactly as founding costs
 * already do. Nothing is minted: the cost moves out of the patron's treasury through
 * `applyTreasuryDelta`, and the founder pays nothing.
 */

import type { WorldGraph } from './graph';
import { isPurseFaction } from './factionPurse/income';
import { getDerivedMembershipRank } from './factionReputation';
import { applyTreasuryDelta, readWealth } from './wealth';
import { FOUNDING_PATRON_ENABLED } from '../data/mortal-means-constants';

/**
 * The founder's highest-ranked purse faction whose treasury is at least `cost`, or null.
 * Pure read. A non-positive cost needs no patron (null).
 */
export function findFoundingPatron(graph: WorldGraph, founderId: string, cost: number): string | null {
  if (!(cost > 0)) return null;
  let best: { id: string; rank: number } | null = null;
  for (const edge of graph.getOutgoingEdges(founderId, 'member_of')) {
    const faction = graph.getNode(edge.target);
    if (!isPurseFaction(faction)) continue;
    // A dissolved faction keeps its member_of edges and its treasury; it backs nothing.
    if (faction.properties.dissolved) continue;
    if (readWealth(faction.properties as Record<string, unknown>) < cost) continue;
    const rank = getDerivedMembershipRank(edge);
    if (!best || rank > best.rank || (rank === best.rank && faction.id < best.id)) {
      best = { id: faction.id, rank };
    }
  }
  return best?.id ?? null;
}

/**
 * The board's affordability test for a costed cell: unaffordable only when the founder
 * cannot pay **and** no patron can (patron rule on). `patronOn` defaults to the switch.
 */
export function isFoundingUnaffordable(
  graph: WorldGraph,
  founderId: string,
  founderWealth: number,
  cost: number,
  patronOn: boolean = FOUNDING_PATRON_ENABLED,
): boolean {
  if (!(cost > 0) || founderWealth >= cost) return false;
  return !patronOn || findFoundingPatron(graph, founderId, cost) === null;
}

export interface FoundingPatronCharge {
  patronId: string;
  cost: number;
  treasuryBefore: number;
  treasuryAfter: number;
}

/**
 * Charge the founder's patron the whole cost. Returns what was charged, or null when no
 * patron exists (fail-soft: nothing is written, nobody pays).
 */
export function chargeFoundingPatron(graph: WorldGraph, founderId: string, cost: number): FoundingPatronCharge | null {
  const patronId = findFoundingPatron(graph, founderId, cost);
  if (!patronId) return null;
  const patron = graph.getNode(patronId);
  if (!patron) return null;
  const treasuryBefore = readWealth(patron.properties as Record<string, unknown>);
  const treasuryAfter = applyTreasuryDelta(treasuryBefore, -cost);
  patron.properties.wealth = treasuryAfter;
  return { patronId, cost, treasuryBefore, treasuryAfter };
}
