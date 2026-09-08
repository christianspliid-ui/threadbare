/**
 * Leverage — stealing a secret, and the favour's whole life cycle (THR-1439).
 *
 * Secrets & Favors already had marks and debts: a mark can be cultivated, pressed into
 * a favour and burned, and a favour can be redeemed by an encounter. Two things were
 * missing, and both are a mortal's *work* rather than an encounter's:
 *
 *   - **A mark could never change hands.** `stealMark` moves the `knows_secret_of`
 *     edge from its holder to the thief through `retargetEdgeSource` — the edge id
 *     stays, so every reader that keyed on it keeps working, and **the holder loses
 *     it, never a copy**. A copied secret would make theft free, which is the one
 *     thing the cell must not be.
 *   - **A favour could only be minted by pressing a mark.** `mintFavor` lets a mortal
 *     spend standing they have honestly earned to put somebody in their debt, which
 *     gives the favour class of Agreement its own beginning; `redeemFavor` and
 *     `forgiveFavor` give it its two endings.
 *
 * The edge shapes are `pressTheMark`'s, deliberately: a favour minted here and a
 * favour pressed out of a mark are the same object to every reader — the binder, the
 * secrets phase, the sheet's Agreements rows, the favour-calling encounters.
 *
 * Fail-soft (NFP #4) throughout: every path returns a `GraphOpResult`.
 */
import type { WorldGraph } from './graph';
import type { GraphOpResult } from './strategicGraphOps';
import { validateEdgeEndpoints } from '../types/edgeSchema';
import { applyReputationWithDelta } from './reputation';
import { applyFavorRedemptionConsequences } from './secretsFavorsConsequences';
import {
  FAVOR_STANDING_MIN,
  FAVOR_SENTIMENT_MIN,
  FAVOR_STANDING_COST,
  FAVOR_MAGNITUDE,
  FAVOR_REDEEM_STANDING_GAIN,
  FAVOR_FORGIVE_STANDING_GAIN,
} from '../data/strategic-action-constants';

function num(props: Record<string, unknown> | undefined, key: string): number | null {
  const v = props?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** A favour is live while nobody has redeemed it and nobody has broken it. */
export function isLiveFavorEdge(properties: Record<string, unknown> | undefined): boolean {
  return properties?.redeemed !== true && properties?.broken !== true;
}

/**
 * Whether this actor's standing with that one is good enough to call in a favour.
 *
 * Reads the written `reputation_with` score first and the seeded `relates_to`
 * sentiment otherwise — the same two-edge reading a Standing object is (THR-1436).
 * The bar is deliberately above the neutral default: `Accepted` (0.5) is what every
 * stranger carries, and a stranger owes nobody anything.
 */
export function standingSupportsFavor(graph: WorldGraph, actorId: string, targetId: string): boolean {
  const score = graph.getOutgoingEdges(actorId, 'reputation_with')
    .find(e => e.target === targetId);
  if (score) return (num(score.properties, 'score') ?? 0) >= FAVOR_STANDING_MIN;
  const seeded = graph.getOutgoingEdges(actorId, 'relates_to').find(e => e.target === targetId);
  if (seeded) return (num(seeded.properties, 'sentiment') ?? 0) >= FAVOR_SENTIMENT_MIN;
  return false;
}

/**
 * Steal a held mark: the edge's source becomes the thief.
 *
 * `retargetEdgeSource` reindexes in one call (THR-1437) — no instant where two actors
 * hold the secret and no instant where nobody does. The provenance is stamped on the
 * edge so the sheet can say *taken from* rather than *knows*, and so a robbed holder's
 * grievance has something to point at.
 */
export function stealMark(
  graph: WorldGraph,
  thiefId: string,
  edgeId: string,
  tick: number,
): GraphOpResult {
  try {
    const thief = graph.getNode(thiefId);
    if (!thief) return { success: false, op: 'steal_mark', error: 'thief_not_found' };
    const edge = graph.getEdge(edgeId);
    if (!edge || edge.type !== 'knows_secret_of') return { success: false, op: 'steal_mark', error: 'mark_gone' };
    if (edge.properties.revealed === true) return { success: false, op: 'steal_mark', error: 'mark_gone' };
    const holderId = edge.source;
    if (holderId === thiefId) return { success: false, op: 'steal_mark', error: 'already_holds' };
    if (edge.target === thiefId) return { success: false, op: 'steal_mark', error: 'own_mark' };

    const violation = validateEdgeEndpoints('knows_secret_of', thief.type, graph.getNode(edge.target)?.type ?? 'actor');
    if (violation) return { success: false, op: 'steal_mark', error: violation.message };

    graph.updateEdge(edgeId, {
      properties: { ...edge.properties, stolenFromId: holderId, stolenTick: tick, source: 'stolen' },
    });
    graph.retargetEdgeSource(edgeId, thiefId);

    return { success: true, op: 'steal_mark', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'steal_mark', error: String(e) };
  }
}

/**
 * Call in a favour: spend some of the standing it rests on, and the other party owes.
 *
 * The debt runs **subject → holder** (the one who owes is the edge's source), which is
 * `pressTheMark`'s direction and the direction `validateEdgeEndpoints` enforces. The
 * standing is spent first and only when the edge is going to land, so a refused favour
 * costs nothing.
 */
export function mintFavor(
  graph: WorldGraph,
  actorId: string,
  targetId: string,
  tick: number,
  projectId?: string,
  outcome?: string,
): GraphOpResult {
  try {
    const actor = graph.getNode(actorId);
    const target = graph.getNode(targetId);
    if (!actor || !target) return { success: false, op: 'mint_favor', error: 'node_not_found' };
    if (actorId === targetId) return { success: false, op: 'mint_favor', error: 'self_target' };

    const violation = validateEdgeEndpoints('owes_favor', target.type, actor.type);
    if (violation) return { success: false, op: 'mint_favor', error: violation.message };

    const outstanding = graph.getIncomingEdges(actorId, 'owes_favor')
      .find(e => e.source === targetId && isLiveFavorEdge(e.properties));
    if (outstanding) return { success: false, op: 'mint_favor', error: 'favour_outstanding' };

    // A band the ladder did not favour is a call that was made and not answered: the
    // standing is spent either way, because asking is what costs.
    const magnitude = FAVOR_MAGNITUDE * favorBandScale(outcome);
    applyReputationWithDelta(
      graph, actorId, targetId, -FAVOR_STANDING_COST, tick, projectId ?? 'mint_favor',
    );
    if (magnitude <= 0) return { success: false, op: 'mint_favor', error: 'call_unanswered' };

    const edgeId = `owes_favor_${targetId}_${actorId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: targetId,
      target: actorId,
      type: 'owes_favor',
      properties: {
        magnitude,
        context: 'called_in',
        grantedTick: tick,
        redeemed: false,
        broken: false,
      },
    });

    return { success: true, op: 'mint_favor', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'mint_favor', error: String(e) };
  }
}

/**
 * The band a call lands on. Shares the yield ladder's shape — an absent band is the
 * failure arm, never a silent full success.
 */
function favorBandScale(outcome: string | undefined): number {
  if (!outcome) return 0;
  return outcome === 'critical_success' ? 1.5
    : outcome === 'success' ? 1
      : outcome === 'success_at_cost' ? 0.75
        : 0;
}

/**
 * Spend a favour owed to you — `use × Agreement` on the favour class.
 *
 * The debt is marked redeemed through `applyFavorRedemptionConsequences`, the one
 * writer the secrets phase and the encounter path both already go through, so a favour
 * spent by work and a favour spent by an encounter end the same way. What the redeemer
 * gets is standing with the debtor's faction, or with the debtor when they have none —
 * the one lump a called-in favour can pay without inventing a service.
 */
export function redeemFavor(
  graph: WorldGraph,
  creditorId: string,
  edgeId: string,
  tick: number,
  projectId?: string,
): GraphOpResult {
  try {
    const edge = graph.getEdge(edgeId);
    if (!edge || edge.type !== 'owes_favor') return { success: false, op: 'redeem_favor', error: 'favour_gone' };
    if (!isLiveFavorEdge(edge.properties)) return { success: false, op: 'redeem_favor', error: 'favour_gone' };
    if (edge.target !== creditorId) return { success: false, op: 'redeem_favor', error: 'not_owed_to_actor' };
    const debtorId = edge.source;

    applyFavorRedemptionConsequences(edgeId, debtorId, creditorId, graph, tick);

    // The debtor's faction if they have one; the debtor themselves otherwise. Never
    // both — a favour buys one standing, not a reputation campaign.
    const faction = graph.getOutgoingEdges(debtorId, 'member_of')[0]?.target;
    applyReputationWithDelta(
      graph, creditorId, faction ?? debtorId, FAVOR_REDEEM_STANDING_GAIN, tick, projectId ?? 'redeem_favor',
    );

    return { success: true, op: 'redeem_favor', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'redeem_favor', error: String(e) };
  }
}

/**
 * Forgive a debt — `destroy × Agreement` on the favour class.
 *
 * The edge stays and stops being live, the way an exposed mark stays and stops being
 * leverage: the world remembers that somebody was once owed. Forgiveness is generosity
 * the debtor notices, so it pays standing rather than costing it.
 */
export function forgiveFavor(
  graph: WorldGraph,
  creditorId: string,
  edgeId: string,
  tick: number,
  projectId?: string,
): GraphOpResult {
  try {
    const edge = graph.getEdge(edgeId);
    if (!edge || edge.type !== 'owes_favor') return { success: false, op: 'forgive_favor', error: 'favour_gone' };
    if (!isLiveFavorEdge(edge.properties)) return { success: false, op: 'forgive_favor', error: 'favour_gone' };
    if (edge.target !== creditorId) return { success: false, op: 'forgive_favor', error: 'not_owed_to_actor' };
    const debtorId = edge.source;

    graph.updateEdge(edgeId, {
      properties: { ...edge.properties, redeemed: true, forgivenTick: tick, forgivenBy: creditorId },
    });
    applyReputationWithDelta(
      graph, debtorId, creditorId, FAVOR_FORGIVE_STANDING_GAIN, tick, projectId ?? 'forgive_favor',
    );

    return { success: true, op: 'forgive_favor', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'forgive_favor', error: String(e) };
  }
}
