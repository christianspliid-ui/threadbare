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
 *   node already carries (`mintRouteIdentity` → `createLocation`). The founder also
 *   holds the Route (`owns`, through `grantHolding`), so nobody else can claim it.
 * - **Found a guild:** a reach profile from the founder's two leading Reaches, a calling
 *   from the leading one, and a purse that opens with what the founding cost.
 * - **Trade run (S3, THR-1967):** pays the trader on the lane traded, once a day.
 * - **Faction ambition met (S3):** a regional monopoly meets `resource_acquisition`.
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
  FOUNDING_NO_GROUND_COOLDOWN_TICKS,
  TRADE_RUN_LAST_PAID_PROPERTY,
  TRADE_RUN_PAY_BASE,
  TRADE_RUN_PAY_COOLDOWN_TICKS,
  TRADE_RUN_PAY_MAX,
  TRADE_RUN_PAY_PER_UNIT,
  UNDERTAKING_ECONOMY_ENABLED,
  LEGACY_PLACE_TYPE_TO_BUILDING,
} from '../data/undertaking-economy-constants';
import { getSettlementBuilding, type SettlementBuildingDef } from '../data/settlement-buildings';
import {
  buildingSlotsOf,
  markMortalBuilding,
  nextBuildingFor,
  readBuildings,
} from './settlementEconomy/building';
import { isEconomySettlement } from './settlementEconomy/land';
import { applyMeansShift } from './mortalMeans';
import { readRegionalMonopolies } from './regionalMonopoly';
import { findUnclaimedSite } from './foundingSite';
import { MEANS_CELL_COST, MEANS_CELL_COST_ENABLED } from '../data/mortal-means-constants';
import { TRADE_ROUTE_DEFAULT_TAX_RATE } from './tradeRoute';
import { ROUTE_IDENTITY_SUBTYPE } from '../data/strategic-action-constants';
import type {
  FoundGuildTrace,
  FoundTownRefusedTrace,
  FoundTownTrace,
  OpenLaneTrace,
  RaiseBuildingTrace,
  TradePayTrace,
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
    // A realm among the tied wins (`realm_tie`); when every tied faction is a realm, being a
    // realm decided nothing and the lower id picks, so the reason reads `id_tie`.
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

/**
 * A seize of a founded town's freehold ends a lone founder's rule. The founder's
 * `controls` edge has no stance behind it, so neither the seize retirement nor the
 * conquest aftermath would ever remove it — the founder would tithe the town forever
 * after losing it. A faction ruler stays: seizing a freehold does not depose a realm.
 * The seizer gets only the freehold; ruling it is a `control:claim` stance like any
 * other mortal hold. Returns the removed edge ids (the seize's own trace records the
 * transfer).
 */
export function endLoneFounderRule(graph: WorldGraph, townId: string, seizerId: string): string[] {
  const removed: string[] = [];
  for (const edge of graph.getIncomingEdges(townId, 'controls')) {
    if (edge.properties?.via !== FOUNDED_CONTROLS_VIA || edge.source === seizerId) continue;
    if (isFactionNode(graph.getNode(edge.source))) continue;
    try { graph.removeEdge(edge.id); removed.push(edge.id); } catch { /* already gone */ }
  }
  return removed;
}

/** The site property a no-free-ground refusal stamps with its tick. */
export const NO_GROUND_TICK_PROPERTY = 'foundingNoGroundTick';

/**
 * Why a town cannot be founded from this site, or `null` (the `create × location`
 * eligibility hook, at proposal). A built-up neighbourhood is seen directly; water is
 * not (no tiles here), so a site whose last founding found no ground is refused for
 * `FOUNDING_NO_GROUND_COOLDOWN_TICKS` after it.
 */
export function foundTownSiteRefusal(graph: WorldGraph, siteId: string, tick: number): string | null {
  const site = graph.getNode(siteId);
  if (!site) return null;
  const last = site.properties[NO_GROUND_TICK_PROPERTY];
  if (typeof last === 'number' && tick - last < FOUNDING_NO_GROUND_COOLDOWN_TICKS) return 'no_free_ground';
  const col = site.properties.hexCol;
  const row = site.properties.hexRow;
  if (typeof col !== 'number' || typeof row !== 'number') return null;
  return findUnclaimedSite(graph, { col, row }) ? null : 'no_free_ground';
}

/** The no-free-ground refusal, traced (the cell completes with nothing founded), and the site marked. */
export function traceFoundTownRefused(founderId: string, siteId: string, tick: number, graph?: WorldGraph): void {
  const site = graph?.getNode(siteId);
  if (site) site.properties[NO_GROUND_TICK_PROPERTY] = tick;
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
  // The founder holds the Route as well as tolling it — the shape a seize leaves behind —
  // so the lane does not read as unowned to `control:claim` or the owner-gated route cells.
  // Fail-soft: a refused holding leaves the toll standing.
  if (identityNodeId && graph.getNode(identityNodeId)) {
    const held = grantHolding(graph, founderId, identityNodeId, { tick }, 'creation');
    if (!held.success) {
      console.warn(`[undertakingEconomy] founder holding refused on lane ${identityNodeId}: ${held.error ?? 'unknown'}`);
    }
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

// ─── A trade run pays (S3, THR-1967) ─────────────────────────────────────────

/** What one trade run pays on a lane that carried `carriedPerDay` yesterday, before the cooldown. */
export function tradeRunPay(carriedPerDay: number): number {
  const carried = Number.isFinite(carriedPerDay) && carriedPerDay > 0 ? carriedPerDay : 0;
  return Math.min(TRADE_RUN_PAY_MAX, TRADE_RUN_PAY_BASE + TRADE_RUN_PAY_PER_UNIT * carried);
}

/** The lane's per-day carried figure (the settlement economy's); 0 while nothing writes it. */
export function laneCarriedPerDay(edge: GraphEdge | undefined): number {
  const carried = edge?.properties?.carriedPerDay;
  return typeof carried === 'number' && Number.isFinite(carried) && carried > 0 ? carried : 0;
}

/** Is the trader inside their one-paid-run-a-day window? A missing stamp means never paid. */
export function tradeRunOnCooldown(trader: GraphNode | undefined, tick: number): boolean {
  const last = trader?.properties[TRADE_RUN_LAST_PAID_PROPERTY];
  return typeof last === 'number' && Number.isFinite(last) && tick - last < TRADE_RUN_PAY_COOLDOWN_TICKS;
}

/**
 * Pay a mortal for a trade run on the lane the run actually traded (`edgeId`, the one
 * `executeConductTrade` wrote — pay follows the trade, not the cell's label). Means move
 * through the one funnel (`applyMeansShift` → `bankWealth`, reason `trade_success`), at
 * most once per trader per day. Returns what was paid (0 inside the cooldown, for a
 * non-mortal, with the switch off, or at the Means ceiling).
 */
export function payTradeRun(graph: WorldGraph, traderId: string, edgeId: string, tick: number): number {
  if (!UNDERTAKING_ECONOMY_ENABLED) return 0;
  const trader = graph.getNode(traderId);
  if (!trader || trader.type !== 'actor' || trader.properties.actorType !== 'individual') return 0;
  const edge = graph.getEdge(edgeId);
  const carriedPerDay = laneCarriedPerDay(edge);
  const traderName = trader.name ?? traderId;
  if (tradeRunOnCooldown(trader, tick)) {
    emitTrace({
      category: 'undertaking.economy.trade_pay',
      tick, traderId, edgeKey: edgeId, carriedPerDay, paid: 0, skipped: 'cooldown',
      summary: `${traderName} trades again today — no pay`,
    } as TradePayTrace);
    return 0;
  }
  const shift = applyMeansShift(trader.properties as Record<string, unknown>, tradeRunPay(carriedPerDay), 'trade_success');
  if (shift) trader.properties[TRADE_RUN_LAST_PAID_PROPERTY] = tick;
  const paid = shift?.amount ?? 0;
  emitTrace({
    category: 'undertaking.economy.trade_pay',
    tick, traderId, edgeKey: edgeId, carriedPerDay, paid, skipped: null,
    summary: `${traderName}'s trade run pays ${paid}`,
  } as TradePayTrace);
  if (shift) {
    emitTrace({
      tick,
      category: 'economy.means.shift',
      agentId: traderId,
      sourceTemplateId: null,
      band: null,
      amount: shift.amount,
      wealthBefore: shift.wealthBefore,
      wealthAfter: shift.wealthAfter,
      bandBefore: shift.bandBefore,
      bandAfter: shift.bandAfter,
      reason: shift.reason,
      summary: `${traderName}'s Means ${shift.wealthBefore} → ${shift.wealthAfter} (trade run)`,
    });
  }
  return paid;
}

// ─── A faction's resource_acquisition is met (S3, THR-1967) ──────────────────

/**
 * Is a faction's active ambition met? Only `resource_acquisition` has a met rule: the
 * faction holds a regional monopoly (war aims S2's `regionalMonopolies`). Pure; a
 * missing faction or record reads as not met.
 */
export function isFactionAmbitionMet(graph: WorldGraph, factionId: string, ambitionType: unknown): boolean {
  if (!UNDERTAKING_ECONOMY_ENABLED || ambitionType !== 'resource_acquisition') return false;
  return readRegionalMonopolies(graph.getNode(factionId)?.properties).length > 0;
}

/** The resource ids of the faction's regional monopolies (the met trace's evidence). */
export function factionMonopolyResourceIds(graph: WorldGraph, factionId: string): string[] {
  return [...new Set(readRegionalMonopolies(graph.getNode(factionId)?.properties).map(m => m.resourceId))].sort();
}

// ─── Raise a building: the town's own next building (S2, THR-1966) ───────────

/**
 * Why `create × place` cannot target this site, or null. A settlement is a target only
 * while its chooser has a next building and a slot is free; a site that is not a
 * settlement (a fort, a ruin) is outside the town's economy and is left as before.
 */
export function raiseBuildingSiteRefusal(graph: WorldGraph, siteId: string): string | null {
  if (!UNDERTAKING_ECONOMY_ENABLED) return null;
  if (!isEconomySettlement(graph.getNode(siteId))) return null;
  return nextBuildingFor(graph, siteId) ? null : 'no_building_slot';
}

/** The building a mortal sets about raising at this site now, or null when there is none. */
export function plannedBuildingFor(graph: WorldGraph, siteId: string | undefined): SettlementBuildingDef | null {
  if (!UNDERTAKING_ECONOMY_ENABLED || !siteId) return null;
  if (!isEconomySettlement(graph.getNode(siteId))) return null;
  return nextBuildingFor(graph, siteId);
}

export interface RaisedBuildingPick {
  readonly def: SettlementBuildingDef;
  readonly outcome: 'raised' | 'repicked';
}

/**
 * At completion: the planned building if it still qualifies (not yet standing, a slot
 * free), else the chooser's current pick, else null (no room — nothing is raised).
 */
export function pickRaisedBuilding(
  graph: WorldGraph,
  settlementId: string,
  plannedBuildingId: string | null,
): RaisedBuildingPick | null {
  const settlement = graph.getNode(settlementId);
  if (!settlement) return null;
  const owned = readBuildings(graph, settlementId);
  if (owned.length >= buildingSlotsOf(settlement)) return null;
  const planned = plannedBuildingId ? getSettlementBuilding(plannedBuildingId) : undefined;
  if (planned && !owned.some(b => b.def.id === planned.id)) return { def: planned, outcome: 'raised' };
  const next = nextBuildingFor(graph, settlementId);
  return next ? { def: next, outcome: planned ? 'repicked' : 'raised' } : null;
}

export interface SettleRaisedBuildingInput {
  readonly graph: WorldGraph;
  readonly builderId: string;
  readonly settlementId: string;
  readonly placeId: string;
  readonly def: SettlementBuildingDef;
  readonly plannedBuildingId: string | null;
  readonly outcome: 'raised' | 'repicked';
  readonly tick: number;
  readonly projectId?: string;
}

/**
 * The Place a mortal raised becomes the town's building, and the builder holds it: the
 * building stamp, then a freehold through `grantHolding` (UL *Freehold*: the edge is the
 * authority). A refused freehold leaves the building standing (fail-soft).
 */
export function settleRaisedBuilding(input: SettleRaisedBuildingInput): void {
  const { graph, builderId, settlementId, placeId, def, tick } = input;
  const place = graph.getNode(placeId);
  if (!place) return;
  markMortalBuilding(place, def, tick);
  const freehold = grantHolding(graph, builderId, placeId, { tick, projectId: input.projectId });
  if (!freehold.success) {
    console.warn(`[undertakingEconomy] builder freehold refused on ${placeId}: ${freehold.error ?? 'unknown'}`);
  }
  emitTrace({
    category: 'undertaking.economy.raise_building',
    tick,
    builderId,
    settlementId,
    plannedBuildingId: input.plannedBuildingId,
    raisedBuildingId: def.id,
    placeId,
    outcome: input.outcome,
    summary: `${graph.getNode(builderId)?.name ?? builderId} raises ${def.id} in ${graph.getNode(settlementId)?.name ?? settlementId}${input.outcome === 'repicked' ? ` (planned ${input.plannedBuildingId})` : ''}`,
  } as RaiseBuildingTrace);
}

/** The work found no room left: nothing was raised, and the trace says what was meant. */
export function traceRaiseBuildingNoRoom(
  graph: WorldGraph,
  builderId: string,
  settlementId: string,
  plannedBuildingId: string | null,
  tick: number,
): void {
  emitTrace({
    category: 'undertaking.economy.raise_building',
    tick,
    builderId,
    settlementId,
    plannedBuildingId,
    raisedBuildingId: null,
    placeId: null,
    outcome: 'no_room',
    summary: `${graph.getNode(builderId)?.name ?? builderId} finds no room in ${graph.getNode(settlementId)?.name ?? settlementId}`,
  } as RaiseBuildingTrace);
}

/**
 * A strategic pack raised a Place of its own type (the template model): stamp it as the
 * building `LEGACY_PLACE_TYPE_TO_BUILDING` maps it to, with the builder's freehold, when the
 * settlement has that building free to take. A non-economic type, a building already
 * standing or full slots leave the Place as it was raised. Returns the building id stamped.
 */
export function stampLegacyPlace(
  graph: WorldGraph,
  builderId: string,
  placeId: string,
  sublocationTypeId: string,
  tick: number,
): string | null {
  if (!UNDERTAKING_ECONOMY_ENABLED) return null;
  const buildingId = LEGACY_PLACE_TYPE_TO_BUILDING[sublocationTypeId.replace(/^sublocation-type\./, '')];
  const def = buildingId ? getSettlementBuilding(buildingId) : undefined;
  const place = graph.getNode(placeId);
  const settlementId = place?.properties.parentLocationId;
  if (!def || typeof settlementId !== 'string' || !isEconomySettlement(graph.getNode(settlementId))) return null;
  const pick = pickRaisedBuilding(graph, settlementId, def.id);
  if (pick?.def.id !== def.id) return null;
  settleRaisedBuilding({ graph, builderId, settlementId, placeId, def, plannedBuildingId: def.id, outcome: 'raised', tick });
  return def.id;
}
