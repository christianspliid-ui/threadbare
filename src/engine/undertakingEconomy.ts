/**
 * Undertakings in the economy (THR-1937, slice S1) — what a mortal's economic
 * undertakings leave behind.
 *
 * Plan: `Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md` § Engine 1–3.
 *
 * - **Found a town:** the town gets a ruler (`controls`) and the founder a freehold
 *   (`owns`, through `grantHolding`). The ruler is the founder's town-holding faction
 *   with the highest derived rank; ties go to a realm, then to the lower id; with no such
 *   faction the founder rules.
 * - **Open a lane:** the founder tolls it (`controlledBy` + `taxRate` on the
 *   `trades_with` edge). Who founded it is the `constructed_by` edge the lane's identity
 *   node already carries (`mintRouteIdentity` → `createLocation`).
 * - **Found a guild:** a reach profile from the founder's two leading Reaches, a calling
 *   from the leading one, and a purse that opens with what the founding cost.
 *
 * Every writer here goes through the existing funnels (`grantHolding`, the toll stamp,
 * `applyTreasuryDelta`); nothing mints a new edge type. Pure readers are exported for
 * the debug bridge and the tests. NFP #3: no PRNG, ties break by id. NFP #4: every
 * missing input falls back to today's behaviour, never a throw.
 */
import type { WorldGraph } from './graph';
import type { GraphEdge, GraphNode } from '../types/graph';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import { emitTrace } from './traceBuffer';
import { getDerivedMembershipRank } from './factionReputation';
import { isRealmFaction } from './crown/crownView';
import { isFactionNode, isSettlement } from './factionPurse/income';
import { grantHolding } from './holdings';
import { applyTreasuryDelta } from './wealth';
import { touchStructure, type SimulationRuntime } from './simulationRuntime';
import {
  FOUNDED_GUILD_REACH_COUNT,
  FOUNDED_GUILD_TYPE_BY_REACH,
  FOUNDED_LANE_GOODS_FALLBACK,
  FOUNDED_TOWN_RULER_INFLUENCE,
} from '../data/undertaking-economy-constants';
import { MEANS_CELL_COST, MEANS_CELL_COST_ENABLED } from '../data/mortal-means-constants';
import { TRADE_ROUTE_DEFAULT_TAX_RATE } from './tradeRoute';
import { ROUTE_IDENTITY_SUBTYPE } from '../data/strategic-action-constants';
import type {
  FoundGuildTrace,
  FoundTownRefusedTrace,
  FoundTownTrace,
  OpenLaneTrace,
} from '../types/trace';

// ─── Found a town: the ruler ─────────────────────────────────────────────────

export type FoundedRulerReason = 'faction_rank' | 'realm_tie' | 'id_tie' | 'founder';

export interface FoundedTownRuler {
  rulerId: string;
  reason: FoundedRulerReason;
  /** Town-holding factions the founder belongs to, in id order (the trace's candidates). */
  candidateFactionIds: string[];
}

/** The `via` a founding writes on the ruler's `controls` edge — the founding record's key. */
export const FOUNDED_CONTROLS_VIA = 'founded';

/** Whether a faction controls at least one place-tier settlement. */
function holdsATown(graph: WorldGraph, factionId: string): boolean {
  return graph.getOutgoingEdges(factionId, 'controls').some(e => isSettlement(graph.getNode(e.target)));
}

/**
 * Who rules a town `founderId` founds. Reads the founder's `member_of` edges through
 * `getDerivedMembershipRank` — never the raw `rank`, which has disagreeing writers.
 * A missing faction node is skipped (fail-soft).
 */
export function pickFoundedTownRuler(graph: WorldGraph, founderId: string): FoundedTownRuler {
  const candidates: { id: string; rank: number; realm: boolean }[] = [];
  const seen = new Set<string>();
  for (const edge of graph.getOutgoingEdges(founderId, 'member_of')) {
    if (seen.has(edge.target)) continue;
    const faction = graph.getNode(edge.target);
    if (!isFactionNode(faction) || !holdsATown(graph, faction.id)) continue;
    seen.add(faction.id);
    candidates.push({ id: faction.id, rank: getDerivedMembershipRank(edge), realm: isRealmFaction(faction) });
  }
  const candidateFactionIds = candidates.map(c => c.id).sort();
  if (candidates.length === 0) return { rulerId: founderId, reason: 'founder', candidateFactionIds };

  const topRank = Math.max(...candidates.map(c => c.rank));
  const top = candidates.filter(c => c.rank === topRank).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (top.length === 1) return { rulerId: top[0].id, reason: 'faction_rank', candidateFactionIds };
  const realms = top.filter(c => c.realm);
  if (realms.length > 0) {
    // A realm among the tied wins; two tied realms fall to the lower id, still a realm tie.
    return { rulerId: realms[0].id, reason: realms.length === top.length ? 'id_tie' : 'realm_tie', candidateFactionIds };
  }
  return { rulerId: top[0].id, reason: 'id_tie', candidateFactionIds };
}

export interface FoundTownEconomyInput {
  graph: WorldGraph;
  founderId: string;
  townId: string;
  siteId: string;
  hexOffset: number;
  tick: number;
  projectId?: string;
  /**
   * The session's runtime. A faction-sourced `controls` edge moves the realm
   * projection, so the write bumps the structural cache (THR-1155 participation).
   */
  runtime?: SimulationRuntime;
}

/**
 * The economic writes after a town is founded: the ruler's `controls`, the founder's
 * freehold. Returns the ruler pick, or null when the town or founder is gone.
 *
 * `grantHolding` failing leaves the `controls` write standing (plan § Fail-soft).
 */
export function settleFoundedTown(input: FoundTownEconomyInput): FoundedTownRuler | null {
  const { graph, founderId, townId, tick } = input;
  if (!graph.getNode(townId) || !graph.getNode(founderId)) return null;
  const ruler = pickFoundedTownRuler(graph, founderId);

  const controlsId = `controls_${ruler.rulerId}_${townId}_${tick}`;
  if (!graph.getEdge(controlsId)) {
    graph.addEdge({
      id: controlsId,
      source: ruler.rulerId,
      target: townId,
      type: 'controls',
      properties: {
        role: 'strategic',
        // The key the mortal tithe reads (holdingIncome.ts): a founder who rules alone tithes once the town grows.
        controlType: 'strategic',
        influence: FOUNDED_TOWN_RULER_INFLUENCE,
        establishedTick: tick,
        via: FOUNDED_CONTROLS_VIA,
        rulerReason: ruler.reason,
      },
    });
    if (ruler.reason !== 'founder' && input.runtime) touchStructure(input.runtime);
  }

  const freehold = grantHolding(graph, founderId, townId, { tick, projectId: input.projectId });
  if (!freehold.success) {
    console.warn(`[undertakingEconomy] founder freehold refused on ${townId}: ${freehold.error ?? 'unknown'}`);
  }

  emitTrace({
    category: 'undertaking.economy.found_town',
    tick,
    founderId,
    locationId: townId,
    rulerId: ruler.rulerId,
    rulerReason: ruler.reason,
    candidateFactionIds: ruler.candidateFactionIds,
    siteId: input.siteId,
    hexOffset: input.hexOffset,
    summary: `${graph.getNode(founderId)?.name ?? founderId} founds ${graph.getNode(townId)?.name ?? townId}; ruled by ${graph.getNode(ruler.rulerId)?.name ?? ruler.rulerId} (${ruler.reason})`,
  } as FoundTownTrace);

  return ruler;
}

/** The no-free-ground refusal, traced (the cell completes with nothing founded). */
export function traceFoundTownRefused(founderId: string, siteId: string, tick: number): void {
  emitTrace({
    category: 'undertaking.economy.found_town_refused',
    tick,
    founderId,
    siteId,
    outcome: 'no_ground',
    summary: `${founderId} found no open ground near ${siteId}`,
  } as FoundTownRefusedTrace);
}

export interface FoundingRecord {
  founderId: string | null;
  rulerId: string | null;
  rulerReason: FoundedRulerReason | null;
}

/**
 * What a place's founding left on the graph: the founder (`constructed_by` to an actor)
 * and the ruler (the `controls` edge a founding wrote). Null when the id is not a
 * location. Read by the debug bridge and the place page.
 */
export function readFoundingRecord(graph: WorldGraph, locationId: string): FoundingRecord | null {
  const node = graph.getNode(locationId);
  if (!node || node.type !== 'location') return null;
  return {
    founderId: founderOf(graph, locationId),
    ...rulerOfFounding(graph, locationId),
  };
}

/** The actor that founded a location (its `constructed_by` edge), or null. */
export function founderOf(graph: WorldGraph, locationId: string): string | null {
  const edge = graph.getOutgoingEdges(locationId, 'constructed_by')
    .find(e => graph.getNode(e.target)?.type === 'actor');
  return edge?.target ?? null;
}

function rulerOfFounding(graph: WorldGraph, locationId: string): { rulerId: string | null; rulerReason: FoundedRulerReason | null } {
  const edge = graph.getIncomingEdges(locationId, 'controls')
    .find(e => e.properties?.via === FOUNDED_CONTROLS_VIA && graph.getNode(e.source));
  if (!edge) return { rulerId: null, rulerReason: null };
  const reason = edge.properties?.rulerReason;
  return {
    rulerId: edge.source,
    rulerReason: typeof reason === 'string' ? reason as FoundedRulerReason : null,
  };
}

// ─── Open a lane: the founder tolls it ───────────────────────────────────────

/**
 * Stamp the founder as the toll holder of a lane they opened. The `constructed_by` edge
 * from the lane's identity node to the founder is written by `mintRouteIdentity`; this
 * writes it only when absent (a legacy identity, an actor that did not exist at mint).
 */
export function settleFoundedLane(
  graph: WorldGraph,
  founderId: string,
  edgeId: string,
  identityNodeId: string | undefined,
  tick: number,
): boolean {
  const edge = graph.getEdge(edgeId);
  if (!edge || edge.type !== 'trades_with' || !graph.getNode(founderId)) return false;
  graph.updateEdge(edge.id, {
    properties: { ...edge.properties, controlledBy: founderId, taxRate: TRADE_ROUTE_DEFAULT_TAX_RATE },
  });
  if (identityNodeId && graph.getNode(identityNodeId)
    && !graph.getOutgoingEdges(identityNodeId, 'constructed_by').some(e => e.target === founderId)) {
    graph.addEdge({
      id: `constructed_by_${identityNodeId}_${founderId}`,
      source: identityNodeId,
      target: founderId,
      type: 'constructed_by',
      properties: { tick },
    });
  }
  emitTrace({
    category: 'undertaking.economy.open_lane',
    tick,
    founderId,
    fromId: edge.source,
    toId: edge.target,
    taxRate: TRADE_ROUTE_DEFAULT_TAX_RATE,
    summary: `${graph.getNode(founderId)?.name ?? founderId} opens and tolls ${graph.getNode(edge.source)?.name ?? edge.source}–${graph.getNode(edge.target)?.name ?? edge.target}`,
  } as OpenLaneTrace);
  return true;
}

/** A lane's toll holder and founder, by its `trades_with` edge id. Null when the edge is gone. */
export function readLaneHolders(graph: WorldGraph, edgeId: string): { controlledBy: string | null; founderId: string | null } | null {
  const edge = graph.getEdge(edgeId);
  if (!edge || edge.type !== 'trades_with') return null;
  const controlledBy = typeof edge.properties?.controlledBy === 'string' ? edge.properties.controlledBy as string : null;
  const identity = laneIdentityOf(graph, edge);
  return { controlledBy, founderId: identity ? founderOf(graph, identity.id) : null };
}

/** The identity node a `trades_with` edge carries as its Route object, if one was minted. */
export function laneIdentityOf(graph: WorldGraph, edge: GraphEdge): GraphNode | undefined {
  const byKey = graph.getNode(`loc_${ROUTE_IDENTITY_SUBTYPE}_${edge.source}_${edge.target}`);
  if (byKey && byKey.properties.routeEdgeId === edge.id) return byKey;
  return graph.getNodesByType('location').find(n => n.properties.routeEdgeId === edge.id);
}

/**
 * The words a founded lane's chronicle line reads — both ends named, the good or the
 * fallback. Null when either end does not resolve: the line is dropped, never printed
 * with a hole (Law 14).
 */
export function foundedLaneChronicleWords(
  graph: WorldGraph,
  edgeId: string,
): { from: string; fromId: string; to: string; toId: string; goodsType: string } | null {
  const edge = graph.getEdge(edgeId);
  if (!edge) return null;
  const from = graph.getNode(edge.source)?.name;
  const to = graph.getNode(edge.target)?.name;
  if (!from || !to) return null;
  const goods = edge.properties?.goodsType;
  return {
    from, fromId: edge.source, to, toId: edge.target,
    goodsType: typeof goods === 'string' && goods.length > 0 && goods !== 'unknown' ? goods : FOUNDED_LANE_GOODS_FALLBACK,
  };
}

// ─── Found a guild: a calling and a purse ────────────────────────────────────

/** The founder's leading Reaches, strongest first, ties in `REACH_DOMAINS` order. Zero-valued Reaches are skipped. */
export function leadingReaches(founder: GraphNode | undefined, count: number = FOUNDED_GUILD_REACH_COUNT): ReachDomain[] {
  const caps = founder?.properties.domainCapabilities as Partial<Record<string, number>> | undefined;
  if (!caps) return [];
  return REACH_DOMAINS
    .map((reach, i) => ({ reach, value: caps[reach], i }))
    .filter((r): r is { reach: ReachDomain; value: number; i: number } => typeof r.value === 'number' && Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => b.value - a.value || a.i - b.i)
    .slice(0, count)
    .map(r => r.reach);
}

/** A founded guild's reach profile: the founder's leading Reaches on the raw 0–100 scale, as weights. `{}` with none. */
export function foundedGuildReachProfile(founder: GraphNode | undefined): Partial<Record<ReachDomain, number>> {
  const caps = founder?.properties.domainCapabilities as Partial<Record<string, number>> | undefined;
  const out: Partial<Record<ReachDomain, number>> = {};
  for (const reach of leadingReaches(founder)) out[reach] = (caps?.[reach] ?? 0) / 100;
  return out;
}

/** A founded guild's calling: the leading Reach's row, else the second's, else none. */
export function foundedGuildType(founder: GraphNode | undefined): string | null {
  for (const reach of leadingReaches(founder)) {
    const type = FOUNDED_GUILD_TYPE_BY_REACH[reach];
    if (type) return type;
  }
  return null;
}

/** What founding a guild cost its founder — mortal wealth's cost table, when costs are on and it has the row. */
export function foundedGuildOpeningPurse(): number {
  if (!MEANS_CELL_COST_ENABLED) return 0;
  return MEANS_CELL_COST['create×faction'] ?? 0;
}

/**
 * The economic writes after a guild is founded: its calling and its opening purse
 * (moved through `applyTreasuryDelta`, nothing minted). The reach profile is passed
 * into `foundFaction` by the cell, before this runs.
 */
export function settleFoundedGuild(
  graph: WorldGraph,
  founderId: string,
  factionId: string,
  reachProfile: Partial<Record<ReachDomain, number>>,
  tick: number,
): void {
  const faction = graph.getNode(factionId);
  if (!faction) return;
  const guildType = foundedGuildType(graph.getNode(founderId));
  const openingPurse = foundedGuildOpeningPurse();
  const props: Record<string, unknown> = { ...faction.properties };
  if (guildType) props.guildType = guildType;
  if (openingPurse > 0) {
    const current = typeof faction.properties.wealth === 'number' ? faction.properties.wealth : 0;
    props.wealth = applyTreasuryDelta(current, openingPurse);
  }
  graph.updateNode(factionId, { properties: props });
  emitTrace({
    category: 'undertaking.economy.found_guild',
    tick,
    founderId,
    factionId,
    guildType,
    reachProfile: { ...reachProfile },
    openingPurse,
    summary: `${faction.name ?? factionId} founded by ${graph.getNode(founderId)?.name ?? founderId} — calling ${guildType ?? 'none'}`,
  } as FoundGuildTrace);
}
