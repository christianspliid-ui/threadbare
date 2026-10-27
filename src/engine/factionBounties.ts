/**
 * THR-2072 — a faction's bounty is collected in a duel.
 *
 * Issue Bounty (`phaseFactionActions`) posts a `bounty` event node on a mortal the faction
 * holds `hostile_to`, and holds `BOUNTY_REWARD` on it as `escrow`. While it is open, a
 * member of the issuing faction who shares a place with the target may come for them (the
 * bounty licence in `grudgeDuelTrigger`). If the hunter beats the target — the target
 * yields, or is spared, mauled or slain — the bounty is collected (`bountyCollectBranch`):
 * the escrow is paid out, a hunter who makes choices rises one Means step, a `collected`
 * edge (hunter → bounty) records who collected it, and `hunted` is lifted when no open
 * bounty is left on the target. A bounty nobody collects lapses at `expiryTick`, or when
 * its target is gone, and its escrow goes back to the purse.
 *
 * Pure graph reads and writes, no PRNG: oldest first, then id order.
 *
 * Plan: Docs/plans/2026-10-26-thr-2072-bounty-collected-in-a-duel.md
 */
import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import {
  BOUNTY_COST,
  BOUNTY_EXPIRY,
  BOUNTY_MEANS_PAY,
  BOUNTY_REWARD,
  FACTION_BOUNTIES_ENABLED,
} from '../types/factionAction';
import { BOUNTY_CHRONICLE_LINE, FIGHT_CHRONICLE_NAMELESS_PLACE } from '../data/fight-ending-content';
import { isAutonomousDecisionActor } from './decisionTier';
import { isAgentGone } from './groups/groupQueries';
import { applyMeansShift } from './mortalMeans';
import { resolveToParentLocation } from './sublocationShape';
import { readWealth, applyTreasuryDelta } from './wealth';
import { emitTrace } from './traceBuffer';

/** The `lastWealthReason` a collected bounty stamps on the hunter (read by `describeWealthSource`). */
export const BOUNTY_WEALTH_REASON = 'bounty';

/** The condition a bounty puts on its target while one is open. */
export const HUNTED_CONDITION = 'hunted';

export type BountyStatus = 'active' | 'collected' | 'lapsed';

/** One bounty as the debug accessor and the census read it. */
export interface BountyRecord {
  id: string;
  factionId: string;
  targetId: string;
  status: BountyStatus;
  escrow: number;
  createdTick: number;
  expiryTick: number;
  collectedBy?: string;
  collectedTick?: number;
}

/** What a landed collection returns. */
export interface BountyCollected {
  bountyId: string;
  factionId: string;
  hunterId: string;
  targetId: string;
  /** The escrow the bounty held, now paid out. */
  escrow: number;
  /** False for an unseen hunter, or a decider whose shift clamped or was switched off. */
  meansPaid: boolean;
  /** The chronicle sentence (`BOUNTY_CHRONICLE_LINE`, filled). */
  line: string;
}

type Graph = GameState['graph'];

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function isBountyNode(node: GraphNode | undefined): node is GraphNode {
  return !!node && node.properties.eventType === 'bounty';
}

/** A bounty's status; anything but `collected` / `lapsed` reads as active (a pre-THR-2072 bounty). */
export function bountyStatus(node: GraphNode): BountyStatus {
  const status = node.properties.status;
  return status === 'collected' || status === 'lapsed' ? status : 'active';
}

/** A living individual mortal: the only thing a bounty may name. */
export function isBountyTarget(node: GraphNode | undefined): boolean {
  return !!node && node.type === 'actor' && node.properties.actorType === 'individual' && !isAgentGone(node);
}

function byAge(a: GraphNode, b: GraphNode): number {
  return num(a.properties.createdTick) - num(b.properties.createdTick) || a.id.localeCompare(b.id);
}

function isOpen(node: GraphNode, tick: number): boolean {
  return bountyStatus(node) === 'active' && num(node.properties.expiryTick, Infinity) > tick;
}

/**
 * Every open bounty in the world, keyed by target, each list oldest first. Built once per
 * trigger pass so the pair walk reads a map, not the event list.
 */
export function indexOpenBounties(graph: Graph, tick: number): Map<string, GraphNode[]> {
  const index = new Map<string, GraphNode[]>();
  for (const node of graph.getNodesByType('event')) {
    if (!isBountyNode(node) || !isOpen(node, tick)) continue;
    const targetId = str(node.properties.targetAgentId);
    if (!targetId) continue;
    const list = index.get(targetId);
    if (list) list.push(node);
    else index.set(targetId, [node]);
  }
  for (const list of index.values()) list.sort(byAge);
  return index;
}

/** The open bounties on a target, oldest first, then id. */
export function openBountiesOn(
  graph: Graph,
  targetId: string,
  tick: number,
  index?: ReadonlyMap<string, readonly GraphNode[]>,
): GraphNode[] {
  if (index) return [...(index.get(targetId) ?? [])];
  return indexOpenBounties(graph, tick).get(targetId) ?? [];
}

/**
 * The oldest open bounty on `targetId` whose issuing faction `hunterId` is a member of,
 * or null. A mortal never hunts themself.
 */
export function huntableBounty(
  graph: Graph,
  hunterId: string,
  targetId: string,
  tick: number,
  index?: ReadonlyMap<string, readonly GraphNode[]>,
): GraphNode | null {
  if (hunterId === targetId) return null;
  const open = openBountiesOn(graph, targetId, tick, index);
  if (open.length === 0) return null;
  const factions = new Set(graph.getOutgoingEdges(hunterId, 'member_of').map(e => e.target));
  return open.find(b => factions.has(str(b.properties.issuingFactionId))) ?? null;
}

/** Whether `factionId` already has an open bounty on `targetId` (the one-per-target guard). */
export function hasOpenBountyFrom(graph: Graph, factionId: string, targetId: string, tick: number): boolean {
  for (const edge of graph.getOutgoingEdges(factionId, 'issues')) {
    const node = graph.getNode(edge.target);
    if (isBountyNode(node) && str(node.properties.targetAgentId) === targetId && isOpen(node, tick)) return true;
  }
  return false;
}

/** Removes `hunted` from the target's conditions when no open bounty is left on them. */
export function liftHuntedIfClear(graph: Graph, targetId: string, tick: number): boolean {
  const target = graph.getNode(targetId);
  if (!target) return false;
  const conditions = target.properties.conditions;
  if (!Array.isArray(conditions) || !conditions.includes(HUNTED_CONDITION)) return false;
  if (openBountiesOn(graph, targetId, tick).length > 0) return false;
  graph.updateNode(targetId, {
    properties: { conditions: (conditions as string[]).filter(c => c !== HUNTED_CONDITION) },
  });
  return true;
}

/** Where the hunter stands, as a chronicle place name. */
function placeNameOf(graph: Graph, agentId: string): string {
  const siteId = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
  const place = siteId ? resolveToParentLocation(graph, graph.getNode(siteId)) : undefined;
  return place?.name || FIGHT_CHRONICLE_NAMELESS_PLACE;
}

/** Fill a bounty line's `{hunter}`, `{target}` and `{place}` slots. */
export function fillBountyLine(line: string, names: { hunter: string; target: string; place: string }): string {
  return line
    .replace(/\{hunter\}/g, names.hunter)
    .replace(/\{target\}/g, names.target)
    .replace(/\{place\}/g, names.place);
}

/** The names a bounty line reads, for a hunter and a target. */
export function bountyLineNames(graph: Graph, hunterId: string, targetId: string): { hunter: string; target: string; place: string } {
  return {
    hunter: graph.getNode(hunterId)?.name ?? hunterId,
    target: graph.getNode(targetId)?.name ?? targetId,
    place: placeNameOf(graph, hunterId),
  };
}

/**
 * The hunter collects the bounty: escrow paid out, a decider hunter's Means up one step,
 * one `collected` edge, `hunted` lifted when clear. A bounty that already carries a
 * `collected` edge is treated as collected and never gets a second one.
 *
 * Fail-soft: any throw returns null and leaves the bounty as it was found.
 */
export function collectBounty(
  state: Pick<GameState, 'graph'>,
  bountyId: string,
  hunterId: string,
  tick: number,
): BountyCollected | null {
  if (!FACTION_BOUNTIES_ENABLED) return null;
  try {
    const graph = state.graph;
    const bounty = graph.getNode(bountyId);
    if (!isBountyNode(bounty) || bountyStatus(bounty) !== 'active') return null;
    const targetId = str(bounty.properties.targetAgentId);
    const factionId = str(bounty.properties.issuingFactionId);
    if (graph.getIncomingEdges(bountyId, 'collected').length > 0) {
      graph.updateNode(bountyId, { properties: { status: 'collected' } });
      return null;
    }
    const hunter = graph.getNode(hunterId);
    if (!hunter || hunter.type !== 'actor') return null;

    const shift = isAutonomousDecisionActor(hunter)
      ? applyMeansShift(hunter.properties, BOUNTY_MEANS_PAY, BOUNTY_WEALTH_REASON)
      : null;
    const escrow = num(bounty.properties.escrow);
    graph.updateNode(bountyId, {
      properties: { status: 'collected', collectedTick: tick, escrow: 0, escrowPaid: escrow },
    });
    graph.addEdge({
      id: `e_collected_${hunterId}_${bountyId}`,
      source: hunterId,
      target: bountyId,
      type: 'collected',
      properties: { tick },
    });
    if (targetId) liftHuntedIfClear(graph, targetId, tick);

    const line = fillBountyLine(BOUNTY_CHRONICLE_LINE, bountyLineNames(graph, hunterId, targetId));
    emitTrace({
      tick,
      category: 'economy.bounty',
      action: 'collected',
      bountyId,
      factionId,
      targetId,
      escrow,
      hunterId,
      meansPaid: shift !== null,
      summary: line,
    });
    return { bountyId, factionId, hunterId, targetId, escrow, meansPaid: shift !== null, line };
  } catch (err) {
    console.warn('[factionBounties] collectBounty failed:', err);
    return null;
  }
}

/**
 * Every active bounty past its `expiryTick`, or whose target is gone or is not an
 * individual mortal, lapses: its escrow goes back to the purse through
 * `applyTreasuryDelta` (nothing when the faction is gone) and `hunted` is lifted when clear.
 *
 * @returns how many bounties lapsed this call.
 */
export function closeBounties(state: Pick<GameState, 'graph'>, tick: number): number {
  if (!FACTION_BOUNTIES_ENABLED) return 0;
  const graph = state.graph;
  let lapsed = 0;
  for (const bounty of graph.getNodesByType('event')) {
    if (!isBountyNode(bounty)) continue;
    try {
      if (bountyStatus(bounty) !== 'active') continue;
      const targetId = str(bounty.properties.targetAgentId);
      const target = targetId ? graph.getNode(targetId) : undefined;
      const reason: 'expired' | 'target_gone' | undefined = !isBountyTarget(target)
        ? 'target_gone'
        : num(bounty.properties.expiryTick, Infinity) <= tick ? 'expired' : undefined;
      if (!reason) continue;

      const escrow = num(bounty.properties.escrow);
      const factionId = str(bounty.properties.issuingFactionId);
      const faction = factionId ? graph.getNode(factionId) : undefined;
      const refunded = faction ? escrow : 0;
      if (faction && escrow > 0) {
        graph.updateNode(faction.id, {
          properties: { wealth: applyTreasuryDelta(readWealth(faction.properties), escrow) },
        });
      }
      graph.updateNode(bounty.id, { properties: { status: 'lapsed', escrow: 0, escrowRefunded: refunded } });
      lapsed++;
      if (target) liftHuntedIfClear(graph, target.id, tick);
      emitTrace({
        tick,
        category: 'economy.bounty',
        action: 'lapsed',
        bountyId: bounty.id,
        factionId,
        targetId,
        escrow: refunded,
        reason,
        summary: `${faction?.name ?? 'A gone faction'}'s price on ${target?.name ?? targetId} lapsed; ${refunded} back to the purse`,
      });
    } catch (err) {
      console.warn(`[factionBounties] close failed (${bounty.id}):`, err);
    }
  }
  return lapsed;
}

/**
 * The factions with an open price on this mortal, oldest posting first, one entry per
 * faction (the sheet's Blood row). Empty when none.
 */
export function bountiesOnTarget(graph: Graph, targetId: string, tick: number): { factionId: string; factionName: string }[] {
  if (!FACTION_BOUNTIES_ENABLED) return [];
  const seen = new Set<string>();
  const out: { factionId: string; factionName: string }[] = [];
  for (const bounty of openBountiesOn(graph, targetId, tick)) {
    const factionId = str(bounty.properties.issuingFactionId);
    const faction = factionId ? graph.getNode(factionId) : undefined;
    if (!faction || seen.has(factionId)) continue;
    seen.add(factionId);
    out.push({ factionId, factionName: faction.name });
  }
  return out;
}

/**
 * Debug lever (CLI `spawn duel <hunter> --with <target> --bounty`): posts a bounty from
 * `factionId` on `targetId` the way Issue Bounty does (escrow held, cost from the purse,
 * `hunted` added), unless one from that faction is already open. Returns the open
 * bounty's id, or null when the target cannot carry a bounty.
 */
export function postDebugBounty(state: Pick<GameState, 'graph'>, factionId: string, targetId: string, tick: number): string | null {
  const graph = state.graph;
  const faction = graph.getNode(factionId);
  const target = graph.getNode(targetId);
  if (!faction || !isBountyTarget(target)) return null;
  const existing = openBountiesOn(graph, targetId, tick).find(b => str(b.properties.issuingFactionId) === factionId);
  if (existing) return existing.id;
  const bountyId = `bounty_${factionId}_${targetId}_${tick}`;
  graph.addNode({
    id: bountyId,
    type: 'event',
    name: `Bounty on ${target!.name}`,
    properties: {
      eventType: 'bounty',
      issuingFactionId: factionId,
      targetAgentId: targetId,
      escrow: BOUNTY_REWARD,
      expiryTick: tick + BOUNTY_EXPIRY,
      createdTick: tick,
      status: 'active',
    },
  });
  graph.addEdge({
    id: `e_issues_${factionId}_${bountyId}`,
    source: factionId,
    target: bountyId,
    type: 'issues',
    properties: { expiryTick: tick + BOUNTY_EXPIRY },
  });
  graph.updateNode(factionId, {
    properties: { wealth: applyTreasuryDelta(readWealth(faction.properties), -BOUNTY_COST) },
  });
  const conditions = Array.isArray(target!.properties.conditions) ? target!.properties.conditions as string[] : [];
  if (!conditions.includes(HUNTED_CONDITION)) {
    graph.updateNode(targetId, { properties: { conditions: [...conditions, HUNTED_CONDITION] } });
  }
  return bountyId;
}

/** Every bounty (or one faction's), oldest first; `collectedBy` comes from the `collected` edge. */
export function readBounties(graph: Graph, factionId?: string): BountyRecord[] {
  const bounties = graph.getNodesByType('event')
    .filter(node => isBountyNode(node) && (!factionId || str(node.properties.issuingFactionId) === factionId))
    .sort(byAge);
  return bounties.map(node => {
    const collectedBy = graph.getIncomingEdges(node.id, 'collected')[0]?.source;
    const collectedTick = node.properties.collectedTick;
    return {
      id: node.id,
      factionId: str(node.properties.issuingFactionId),
      targetId: str(node.properties.targetAgentId),
      status: bountyStatus(node),
      escrow: num(node.properties.escrow),
      createdTick: num(node.properties.createdTick),
      expiryTick: num(node.properties.expiryTick),
      ...(collectedBy ? { collectedBy } : {}),
      ...(typeof collectedTick === 'number' ? { collectedTick } : {}),
    };
  });
}
