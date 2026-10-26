/**
 * THR-2042 — a faction's commission pays the member who takes it up.
 *
 * Commission Quest (`phaseFactionActions`) posts a `faction_quest` event and holds its
 * coin on the posting as `escrow`. The first member of that faction who makes choices
 * (`isAutonomousDecisionActor`) to finish any of the faction's work takes the oldest
 * open posting: their Means rises by {@link COMMISSION_MEANS_PAY}, the posting is marked
 * `taken`, and a `took_up` edge (agent → posting) records who took it. A posting nobody
 * takes before `expiryTick` lapses and gives its escrow back to the purse.
 *
 * Pure graph reads and writes, no PRNG: oldest first, then id order.
 *
 * Plan: Docs/plans/2026-10-25-thr-2042-faction-commission-pay.md
 */
import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import {
  COMMISSION_MEANS_PAY,
  FACTION_COMMISSIONS_ENABLED,
} from '../types/factionAction';
import { isAutonomousDecisionActor } from './decisionTier';
import { applyMeansShift, type MeansShiftResult } from './mortalMeans';
import { readWealth, applyTreasuryDelta } from './wealth';
import { emitTrace } from './traceBuffer';

/** The `lastWealthReason` a commission's pay stamps (read by `describeWealthSource`). */
export const COMMISSION_WEALTH_REASON = 'commission';

export type CommissionStatus = 'open' | 'taken' | 'lapsed';

/** One posting as the debug accessor and the census read it. */
export interface CommissionRecord {
  id: string;
  status: CommissionStatus;
  escrow: number;
  createdTick: number;
  expiryTick: number;
  takenBy?: string;
  takenTick?: number;
}

/** What a landed take-up returns: the posting, the faction and the Means shift. */
export interface CommissionTaken {
  commissionId: string;
  factionId: string;
  agentId: string;
  /** The escrow the posting held, now paid out. */
  escrow: number;
  shift: MeansShiftResult;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A posting's status; a pre-THR-2042 posting (no `status`) reads from `claimed`. */
function statusOf(node: GraphNode): CommissionStatus {
  const status = node.properties.status;
  if (status === 'taken' || status === 'lapsed' || status === 'open') return status;
  return node.properties.claimed === true ? 'taken' : 'open';
}

/** The faction's postings (any status), oldest first, then id. */
function postingsOf(graph: GameState['graph'], factionId: string): GraphNode[] {
  const postings: GraphNode[] = [];
  for (const edge of graph.getOutgoingEdges(factionId, 'commissions')) {
    const node = graph.getNode(edge.target);
    if (node && node.properties.eventType === 'faction_quest') postings.push(node);
  }
  return postings.sort((a, b) =>
    num(a.properties.createdTick) - num(b.properties.createdTick) || a.id.localeCompare(b.id));
}

/**
 * The faction's open postings at `tick`: not taken, not lapsed, not past expiry, and no
 * `took_up` edge already pointing at it. Oldest first, then id.
 */
export function openCommissionsOf(
  graph: GameState['graph'],
  factionId: string,
  tick: number,
): GraphNode[] {
  return postingsOf(graph, factionId).filter(node =>
    statusOf(node) === 'open'
    && num(node.properties.expiryTick, Infinity) > tick
    && graph.getIncomingEdges(node.id, 'took_up').length === 0);
}

/**
 * A decider member who just finished the faction's work takes its oldest open posting.
 * Writes nothing unless the Means shift lands (Law 56): a Magnate at the clamp, or Means
 * switched off, leaves the posting open for the next member.
 *
 * Fail-soft: any throw returns null and leaves the posting as it was found.
 */
export function takeUpCommission(
  state: Pick<GameState, 'graph'>,
  agentId: string,
  factionId: string,
  tick: number,
): CommissionTaken | null {
  if (!FACTION_COMMISSIONS_ENABLED) return null;
  try {
    const graph = state.graph;
    const agent = graph.getNode(agentId);
    if (!agent || agent.type !== 'actor' || !isAutonomousDecisionActor(agent)) return null;
    const posting = openCommissionsOf(graph, factionId, tick)[0];
    if (!posting) return null;

    const wealthBefore = readWealth(agent.properties);
    const shift = applyMeansShift(agent.properties, COMMISSION_MEANS_PAY, COMMISSION_WEALTH_REASON);
    if (!shift) return null;

    const escrow = num(posting.properties.escrow);
    graph.updateNode(posting.id, {
      properties: {
        claimed: true,
        status: 'taken',
        takenTick: tick,
        escrow: 0,
        escrowPaid: escrow,
      },
    });
    graph.addEdge({
      id: `e_took_up_${agentId}_${posting.id}`,
      source: agentId,
      target: posting.id,
      type: 'took_up',
      properties: { tick },
    });
    emitTrace({
      tick,
      category: 'economy.commission',
      action: 'taken',
      factionId,
      commissionId: posting.id,
      escrow,
      agentId,
      wealthBefore,
      wealthAfter: shift.wealthAfter,
      summary: `${agent.name} took up the ${posting.name}`,
    });
    return { commissionId: posting.id, factionId, agentId, escrow, shift };
  } catch (err) {
    console.warn('[factionCommissions] takeUpCommission failed:', err);
    return null;
  }
}

/**
 * Every open posting past its `expiryTick` lapses, and its escrow goes back to the
 * faction's purse through `applyTreasuryDelta`. A posting whose faction is gone lapses
 * with nothing refunded.
 *
 * @returns how many postings lapsed this call.
 */
export function lapseCommissions(state: Pick<GameState, 'graph'>, tick: number): number {
  if (!FACTION_COMMISSIONS_ENABLED) return 0;
  const graph = state.graph;
  let lapsed = 0;
  for (const posting of graph.getNodesByType('event')) {
    if (posting.properties.eventType !== 'faction_quest') continue;
    try {
      if (statusOf(posting) !== 'open') continue;
      if (num(posting.properties.expiryTick, Infinity) > tick) continue;
      const escrow = num(posting.properties.escrow);
      const factionId = typeof posting.properties.factionId === 'string' ? posting.properties.factionId : '';
      const faction = factionId ? graph.getNode(factionId) : undefined;
      const refunded = faction ? escrow : 0;
      if (faction && escrow > 0) {
        graph.updateNode(faction.id, {
          properties: { wealth: applyTreasuryDelta(readWealth(faction.properties), escrow) },
        });
      }
      graph.updateNode(posting.id, { properties: { status: 'lapsed', escrow: 0, escrowRefunded: refunded } });
      lapsed++;
      emitTrace({
        tick,
        category: 'economy.commission',
        action: 'lapsed',
        factionId,
        commissionId: posting.id,
        escrow: refunded,
        summary: `The ${posting.name} lapsed; ${refunded} back to the purse`,
      });
    } catch (err) {
      console.warn(`[factionCommissions] lapse failed (${posting.id}):`, err);
    }
  }
  return lapsed;
}

/** The faction's postings for the debug accessor; `takenBy` comes from the `took_up` edge. */
export function readFactionCommissions(
  graph: GameState['graph'],
  factionId: string,
): CommissionRecord[] {
  return postingsOf(graph, factionId).map(node => {
    const takenBy = graph.getIncomingEdges(node.id, 'took_up')[0]?.source;
    const takenTick = node.properties.takenTick;
    return {
      id: node.id,
      status: statusOf(node),
      escrow: num(node.properties.escrow),
      createdTick: num(node.properties.createdTick),
      expiryTick: num(node.properties.expiryTick),
      ...(takenBy ? { takenBy } : {}),
      ...(typeof takenTick === 'number' ? { takenTick } : {}),
    };
  });
}
