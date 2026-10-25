/**
 * The crown — an oath a mortal brokers (THR-1944). Spec: the design-lane comment on
 * THR-1944, *Spec — a mortal can broker an oath* (2026-10-18b).
 *
 * The `faction_broker_fealty` aftermath effect resolves its two factions here, then
 * swears through the crown's own writer (`swearBrokeredOath` in `crown.ts`):
 *
 * - **liege** — the realm the mortal serves: their realm membership with the highest
 *   derived rank, ties to the lower id. A realm that is itself sworn hands the oath to
 *   its own liege (one layer only: the mortal brokers for the crown they serve).
 * - **vassal** — the faction a named agent belongs to (the Warlord's company: highest
 *   rank, ties to the lower id), or, with no agent named, the faction present at the
 *   mortal's town with the best standing toward the liege, then the higher day income,
 *   then the lower id. Never the liege, never its enemy, never one that may not swear.
 *
 * NFP: Tunability — `BROKERED_OATH_ENABLED`. Inspectability — every refusal returns its
 * reason for the aftermath trace. Determinism — no PRNG; every pick is id-ordered.
 * Fail-soft — a missing node is a refusal, never a throw.
 */

import type { GameState } from '../../types/gameState';
import type { ChronicleEntry } from '../../types/narrative';
import type { WorldGraph } from '../graph';
import type { OathForcedBy, OathKind } from './types';
import { swearBrokeredOath, type BrokeredOathRefusal, type CrownHooks } from '../crown';
import { buildCrownWorld, isSwearableKind, maySwear, onReswearCooldown } from './eligibility';
import { isEnemy, standingOf } from './offer';
import { isRealmFaction, liegeOf } from './crownView';
import { getDerivedMembershipRank } from '../factionReputation';
import { resolveSceneHere } from '../sceneHere';
import { resolveToParentLocation } from '../sublocationShape';
import { BROKERED_OATH_ENABLED } from '../../data/crown-constants';

export type BrokerOathRefusal = BrokeredOathRefusal | 'switch_off' | 'no_broker' | 'no_vassal';

export type BrokerOathResult =
  | { sworn: true; vassalId: string; liegeId: string; chronicle: ChronicleEntry[] }
  | { sworn: false; reason: BrokerOathRefusal; vassalId?: string; liegeId?: string };

/** The faction among `agentId`'s memberships passing `keep`, highest derived rank, ties to the lower id. */
function topMembership(graph: WorldGraph, agentId: string, keep: (factionId: string) => boolean): string | null {
  let best: { id: string; rank: number } | null = null;
  for (const edge of graph.getOutgoingEdges(agentId, 'member_of')) {
    const faction = graph.getNode(edge.target);
    if (!faction || faction.properties.dissolved || !keep(faction.id)) continue;
    const rank = getDerivedMembershipRank(edge);
    if (!best || rank > best.rank || (rank === best.rank && faction.id < best.id)) best = { id: faction.id, rank };
  }
  return best?.id ?? null;
}

/** The realm a mortal serves (decision 1), before the chain to its crown; null when none. */
export function servedRealmOf(graph: WorldGraph, mortalId: string): string | null {
  return topMembership(graph, mortalId, id => isRealmFaction(graph.getNode(id)));
}

/** The liege a mortal brokers for: their realm, or that realm's own liege when it is sworn. */
export function brokerLiegeOf(graph: WorldGraph, mortalId: string): string | null {
  const realm = servedRealmOf(graph, mortalId);
  if (!realm) return null;
  return liegeOf(graph, realm) ?? realm;
}

/**
 * The faction a named agent swears for: their swearable-kind membership, never the liege
 * and never its enemy. With `preferDefId`, a membership of that faction kind wins first
 * (the Warlord's free company). Without one, a reused local commander swears the company
 * they lead (their top non-realm membership — a holy order's or a guild's commander):
 * one mortal winning a hall scene never swears a whole realm.
 */
function vassalOfAgent(graph: WorldGraph, agentId: string, liegeId: string, preferDefId?: string): string | null {
  const node = graph.getNode(agentId);
  if (!node) return null;
  const swearable = (id: string) => id !== liegeId
    && isSwearableKind(graph.getNode(id))
    && !isEnemy(graph, id, liegeId);
  if (node.properties.actorType === 'faction') return swearable(node.id) ? node.id : null;
  const preferred = preferDefId
    ? topMembership(graph, agentId, id => swearable(id) && graph.getNode(id)?.properties.factionDefId === preferDefId)
    : null;
  return preferred ?? topMembership(graph, agentId, id => swearable(id) && !isRealmFaction(graph.getNode(id)));
}

/** Decision 3 — the faction present at the mortal's town that swears to `liegeId`, or null. */
export function presentVassalFor(state: GameState, brokerId: string, liegeId: string): string | null {
  const graph = state.graph;
  const hereId = resolveSceneHere(graph, brokerId, 'location');
  const town = hereId ? resolveToParentLocation(graph, graph.getNode(hereId))?.id ?? null : null;
  if (!town) return null;
  const world = buildCrownWorld(graph, state.tick, null);
  const picks = world.factions
    .filter(f => f.id !== liegeId
      && world.presence.get(f.id)?.has(town)
      && maySwear(graph, f)
      && !isEnemy(graph, f.id, liegeId)
      && !onReswearCooldown(graph, f.id, liegeId, state.tick))
    .map(f => ({ id: f.id, standing: standingOf(graph, f.id, liegeId), income: world.income.get(f.id) ?? 0 }))
    .sort((a, b) => b.standing - a.standing || b.income - a.income || (a.id < b.id ? -1 : 1));
  return picks[0]?.id ?? null;
}

/**
 * Broker an oath for `brokerId`. `vassalAgentId` names whose faction swears (the
 * Warlord); absent, the present-faction pick applies. Writes at most one `sworn_to` edge.
 */
export function brokerOath(
  state: GameState,
  args: { brokerId: string; vassalAgentId?: string; vassalFactionDefId?: string; kind: OathKind; forcedBy?: OathForcedBy },
  hooks: CrownHooks = {},
): BrokerOathResult {
  if (!BROKERED_OATH_ENABLED) return { sworn: false, reason: 'switch_off' };
  const graph = state.graph;
  if (!graph.getNode(args.brokerId)) return { sworn: false, reason: 'no_broker' };
  const liegeId = brokerLiegeOf(graph, args.brokerId);
  if (!liegeId) return { sworn: false, reason: 'no_realm' };
  const vassalId = args.vassalAgentId
    ? vassalOfAgent(graph, args.vassalAgentId, liegeId, args.vassalFactionDefId)
    : presentVassalFor(state, args.brokerId, liegeId);
  if (!vassalId) return { sworn: false, reason: 'no_vassal', liegeId };
  const result = swearBrokeredOath(state, { vassalId, liegeId, kind: args.kind, brokerId: args.brokerId, forcedBy: args.forcedBy }, hooks);
  return result.sworn
    ? { sworn: true, vassalId, liegeId, chronicle: result.chronicle }
    : { sworn: false, reason: result.reason, vassalId, liegeId };
}
