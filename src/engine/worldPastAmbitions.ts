/**
 * worldPastAmbitions — the past feeds ambitions (THR-1657, world with a past S3).
 *
 * Runs at the tail of `worldPast.seedWorldPast`, injected by `gameInit` through
 * `SeedWorldPastOptions.mintAmbitions`. It lives apart from `worldPast.ts` because that
 * module is read low in the import graph (words, enrichment, the debug bridge), and the
 * ambition, grievance and faction modules this one needs close an import cycle there.
 *
 * Plan: `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md` § S3.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { hexDistance } from '../lib/hexMath';
import { hexOf, homeHex } from './worldPast';
import { isAutonomousDecisionActor } from './decisionTier';
import { isAgentGone } from './groups/groupQueries';
import { getFactionLeaderId } from './factionNetwork';
import { resolveGrievanceDisposition } from './grievance/grievanceLifecycle';
import { assignAmbitionToActor, MAX_ACTIVE_AMBITIONS } from './ambitionAssignment';
import {
  WORLDGEN_KIN_SENTIMENT,
  WORLDGEN_KIN_STRENGTH,
  WORLDGEN_TIE_TRUST_FROM_SENTIMENT,
} from '../data/worldgen-living-constants';
import { WORLD_PAST_DEFAULTS, type WorldPastConstants } from '../data/world-past-constants';
import { WORLD_PAST_ORIGIN, type WorldPastAmbitionsSummary, type WorldPastView } from '../types/worldPast';

const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** A protagonist: a living individual who already decides. The dead and the ambient never qualify. */
function isPastAmbitionHolder(node: GraphNode): boolean {
  return isAutonomousDecisionActor(node) && !isAgentGone(node) && node.properties.pastOrigin !== WORLD_PAST_ORIGIN;
}

/** Whether `assignAmbitionToActor` would accept this template for this actor (the same slot rule). */
function hasFreeSlotFor(graph: WorldGraph, actorId: string, templateId: string): boolean {
  const pursues = graph.getOutgoingEdges(actorId, 'pursues');
  if (pursues.some(e => e.target === `ambition.${templateId}`)) return false;
  return pursues.filter(e => e.properties.status === 'active').length < MAX_ACTIVE_AMBITIONS;
}

/** The `relates_to` kin pair, both directions, in the worldgen tie shape (`seedLivingWorld.writeSeededTie`). */
function writeKinTie(graph: WorldGraph, a: string, b: string): void {
  const properties = {
    sentiment: WORLDGEN_KIN_SENTIMENT,
    strength: WORLDGEN_KIN_STRENGTH,
    basis: 'kin',
    trust: WORLDGEN_KIN_SENTIMENT * WORLDGEN_TIE_TRUST_FROM_SENTIMENT,
    origin: WORLD_PAST_ORIGIN,
  };
  for (const [source, target] of [[a, b], [b, a]] as const) {
    const id = `edge_tie_${source}_${target}_kin`;
    if (graph.getEdge(id)) continue;
    graph.addEdge({ id, source, target, type: 'relates_to', properties: { ...properties } });
  }
}

export const PAST_REVENGE_TEMPLATE_ID = 'ambition_seek_revenge';
export const PAST_WONDER_TEMPLATE_ID = 'ambition_chase_the_wonder';

/**
 * Give the past's grievances and legends to the living (plan § S3, Lane decision 5).
 *
 * - **Revenge.** For each war in living memory, the losing Realm's member protagonist
 *   with the most standing (reputation, then id) and a free slot becomes kin of the
 *   fallen commander, and the commander's death opens as a grievance that passes to
 *   that kin through `resolveGrievanceDisposition`'s succession — the one route a dead
 *   victim's drive takes at run time too. The culprit is the winning Realm's current
 *   leader.
 * - **The wonder.** For each wonder with a finder, the nearest protagonist within
 *   `wonderPullMaxHexes` with a free slot comes to chase it.
 *
 * Holders are only deciders, and the spotlight pull is skipped, so no history pulls
 * anyone into the deciding tier: the t0 decider headcount is unchanged. One holder per
 * source, and one past ambition per holder. Deterministic and drawless — every list is
 * sorted. Every source that mints nothing is named with its reason.
 */
export function mintPastAmbitions(
  graph: WorldGraph,
  view: WorldPastView,
  constants: Partial<WorldPastConstants> = {},
): WorldPastAmbitionsSummary {
  const c: WorldPastConstants = { ...WORLD_PAST_DEFAULTS, ...constants };
  const out: WorldPastAmbitionsSummary = { minted: [], skipped: [] };
  const holders = graph.getNodesByType('actor').filter(isPastAmbitionHolder).sort(byId);
  const taken = new Set<string>();

  // ── seek_revenge ────────────────────────────────────────────────────────
  let revenge = 0;
  for (const war of view.livingMemory) {
    const skip = (reason: WorldPastAmbitionsSummary['skipped'][number]['reason']) =>
      out.skipped.push({ sourceId: war.eventId, templateId: PAST_REVENGE_TEMPLATE_ID, reason });
    if (revenge >= c.revengeAmbitionsMax) { skip('cap_reached'); continue; }
    const commanderId = war.fallenIds[0];
    if (!commanderId) { skip('no_fallen_commander'); continue; }
    const culpritId = getFactionLeaderId(graph, war.winnerId);
    if (!culpritId || isAgentGone(graph.getNode(culpritId))) { skip('no_leader'); continue; }

    const members = holders
      .filter(h => !taken.has(h.id) && h.id !== culpritId)
      .map(h => ({ h, edge: graph.getOutgoingEdges(h.id, 'member_of').find(e => e.target === war.loserId) }))
      .filter((m): m is { h: GraphNode; edge: NonNullable<typeof m.edge> } => !!m.edge)
      .map(m => ({ id: m.h.id, standing: typeof m.edge.properties.reputation === 'number' ? m.edge.properties.reputation as number : 0 }))
      .sort((a, b) => b.standing - a.standing || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (members.length === 0) { skip('no_member_protagonist'); continue; }
    const heir = members.find(m => hasFreeSlotFor(graph, m.id, PAST_REVENGE_TEMPLATE_ID));
    if (!heir) { skip('no_free_slot'); continue; }

    // Kin first: the grievance's succession reads the commander's positive bonds, and this
    // is the only one a seeded dead actor has, so the drive lands on this protagonist.
    writeKinTie(graph, heir.id, commanderId);
    const disposition = resolveGrievanceDisposition(graph, commanderId, {
      culpritAgentId: culpritId,
      harmMagnitude: c.revengeHarmMagnitude,
      chainDepth: c.revengeChainDepth,
      sourceEventId: war.eventId,
    }, 0);
    if (!disposition.write || disposition.holderId !== heir.id) { skip('grievance_declined'); continue; }

    const commanderName = graph.getNode(commanderId)?.name;
    const result = assignAmbitionToActor(graph, heir.id, PAST_REVENGE_TEMPLATE_ID, 0, {
      skipSpotlightPull: true,
      ...(commanderName ? { mintedByLabel: `the death of ${commanderName}` } : {}),
      extraProperties: {
        mintedByEventId: war.eventId,
        pastOrigin: WORLD_PAST_ORIGIN,
        ...disposition.properties,
      },
    });
    if (!result.assigned) { skip('assign_refused'); continue; }
    taken.add(heir.id);
    revenge++;
    out.minted.push({ actorId: heir.id, templateId: PAST_REVENGE_TEMPLATE_ID, sourceId: war.eventId, culpritId, kinOfId: commanderId });
  }

  // ── chase_the_wonder ────────────────────────────────────────────────────
  const homes = new Map<string, { col: number; row: number } | undefined>(holders.map(h => [h.id, homeHex(graph, h)]));
  let wonders = 0;
  for (const w of view.wonders) {
    if (!w.finderId) continue;
    const skip = (reason: WorldPastAmbitionsSummary['skipped'][number]['reason']) =>
      out.skipped.push({ sourceId: w.wonderId, templateId: PAST_WONDER_TEMPLATE_ID, reason });
    if (wonders >= c.wonderAmbitionsMax) { skip('cap_reached'); continue; }
    const at = hexOf(graph.getNode(w.wonderId));
    const inRange = at
      ? holders
        .filter(h => !taken.has(h.id))
        .map(h => ({ id: h.id, home: homes.get(h.id) }))
        .filter((x): x is { id: string; home: { col: number; row: number } } => !!x.home)
        .map(x => ({ id: x.id, d: hexDistance(at, x.home) }))
        .filter(x => x.d <= c.wonderPullMaxHexes)
        .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      : [];
    if (inRange.length === 0) { skip('none_in_range'); continue; }
    const seeker = inRange.find(x => hasFreeSlotFor(graph, x.id, PAST_WONDER_TEMPLATE_ID));
    if (!seeker) { skip('no_free_slot'); continue; }

    const finderName = graph.getNode(w.finderId)?.name;
    const wonderName = graph.getNode(w.wonderId)?.name;
    const result = assignAmbitionToActor(graph, seeker.id, PAST_WONDER_TEMPLATE_ID, 0, {
      skipSpotlightPull: true,
      ...(finderName && wonderName ? { mintedByLabel: `the tale of ${finderName}, who found ${wonderName}` } : {}),
      extraProperties: { targetNodeId: w.wonderId, pastOrigin: WORLD_PAST_ORIGIN },
    });
    if (!result.assigned) { skip('assign_refused'); continue; }
    taken.add(seeker.id);
    wonders++;
    out.minted.push({ actorId: seeker.id, templateId: PAST_WONDER_TEMPLATE_ID, sourceId: w.wonderId });
  }

  return out;
}
