/**
 * The crown — who may swear, who may court, and the day's world snapshot (THR-1932,
 * plan § 1).
 *
 * `buildCrownWorld` reads everything the offer score and the loyalty pass need once —
 * incomes off the purse, armies with their hex and strength, each faction's presence,
 * the realms' hexes — so courting and the rival-offer check share one read per call.
 * Everything here is deterministic: factions, armies and candidates in id order.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { HexCoord } from '../../types';
import type { ArmyState } from '../../types/army';
import type { RealmProjection } from '../realmProjection';
import { hexNeighbors } from '../../lib/hexMath';
import { hexKey, hexKeyFromCoord } from '../../lib/hexKey';
import { resolveToParentLocation } from '../sublocationShape';
import { readWealth } from '../wealth';
import { readPurseDay, readMeansBand } from '../factionPurse';
import { isPurseFaction, isSettlement, totalIncome } from '../factionPurse/income';
import type { MeansBand } from '../../data/faction-purse-constants';
import {
  NEVER_SWEAR_FACTION_TYPES,
  NEVER_SWEAR_DEF_IDS,
  NEVER_SWEAR_GUILD_TYPES,
  OATH_RESWEAR_COOLDOWN_DAYS,
} from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS } from '../../data/faction-purse-constants';
import { isRealmFaction } from './crownView';

export interface ArmySnapshot {
  id: string;
  factionId: string;
  hex: HexCoord | null;
  strength: number;
}

export interface CrownWorld {
  graph: WorldGraph;
  tick: number;
  /** Faction nodes in the economy, id order. */
  factions: GraphNode[];
  /** Own day income (the purse's five sources, guild tax netted). */
  income: Map<string, number>;
  /** Own income plus the fealty taken in on the last pay day. */
  fullIncome: Map<string, number>;
  wealth: Map<string, number>;
  means: Map<string, MeansBand | null>;
  armies: ArmySnapshot[];
  /** faction → summed army strength. */
  strength: Map<string, number>;
  /** faction → every top-level Location it is present in (held + halls + members). */
  presence: Map<string, Set<string>>;
  /** faction → the hexes of its holdings and halls (what an army threatens). */
  holdHexes: Map<string, HexCoord[]>;
  /** faction → the settlements it controls (top-level Location ids). */
  held: Map<string, Set<string>>;
  /** Realm → its projected hex keys. */
  realmHexKeys: Map<string, Set<string>>;
  hexRealmId: Map<string, string>;
  /** Realms that may court today, id order. */
  courtRealms: string[];
  /** Realm → its candidates today (may swear now), id order. */
  candidates: Map<string, string[]>;
  /** Realm → every swearable-kind faction it reaches, sworn or not (the rival-offer check). */
  reach: Map<string, string[]>;
}

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function hexOf(graph: WorldGraph, locId: string | undefined | null): HexCoord | null {
  if (!locId) return null;
  const ground = resolveToParentLocation(graph, graph.getNode(locId));
  const col = ground?.properties.hexCol;
  const row = ground?.properties.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? { col, row } : null;
}

function topLevel(graph: WorldGraph, locId: string | undefined | null): string | null {
  if (!locId) return null;
  const n = graph.getNode(locId);
  if (!n || n.type !== 'location') return null;
  return resolveToParentLocation(graph, n)?.id ?? null;
}

/** Whether a faction may ever swear fealty (the decision's never-swear lists). */
export function isSwearableKind(node: GraphNode | undefined | null): boolean {
  if (!node || !isPurseFaction(node)) return false;
  const t = node.properties.factionType;
  if (typeof t === 'string' && NEVER_SWEAR_FACTION_TYPES.includes(t)) return false;
  if (node.properties.isMonsterFaction === true) return false;
  const def = node.properties.factionDefId;
  if (typeof def === 'string' && NEVER_SWEAR_DEF_IDS.includes(def)) return false;
  const guild = node.properties.guildType;
  if (typeof guild === 'string' && NEVER_SWEAR_GUILD_TYPES.includes(guild)) return false;
  return true;
}

/** May swear today: a swearable kind, not already sworn, and not itself a liege (one layer). */
export function maySwear(graph: WorldGraph, node: GraphNode | undefined | null): boolean {
  if (!node || !isSwearableKind(node)) return false;
  if (graph.getOutgoingEdges(node.id, 'sworn_to').length > 0) return false;
  if (graph.getIncomingEdges(node.id, 'sworn_to').length > 0) return false;
  return true;
}

/** May court: a realm that holds at least one settlement and owes fealty to no one. */
export function mayCourt(graph: WorldGraph, node: GraphNode | undefined | null): boolean {
  if (!node || !isRealmFaction(node)) return false;
  if (graph.getOutgoingEdges(node.id, 'sworn_to').length > 0) return false;
  return graph.getOutgoingEdges(node.id, 'controls').some(e => isSettlement(graph.getNode(e.target)));
}

/** Whether the pair broke an oath recently enough that it may not swear again. */
export function onReswearCooldown(graph: WorldGraph, a: string, b: string, tick: number): boolean {
  const window = OATH_RESWEAR_COOLDOWN_DAYS * PURSE_CYCLE_TICKS;
  for (const e of [...graph.getOutgoingEdges(a, 'relates_to'), ...graph.getOutgoingEdges(b, 'relates_to')]) {
    if (!((e.source === a && e.target === b) || (e.source === b && e.target === a))) continue;
    const t = e.properties.oathBrokenTick;
    if (typeof t === 'number' && tick - t < window) return true;
  }
  return false;
}

/** Strength of one army: headcount × its cohesion share (the prototype's measure). */
export function armyStrength(as: ArmyState | undefined): number {
  if (!as) return 0;
  const head = typeof as.headcount === 'number' && Number.isFinite(as.headcount) ? as.headcount : 0;
  const max = typeof as.cohesionMax === 'number' && as.cohesionMax > 0 ? as.cohesionMax : 0;
  const coh = max > 0 ? Math.max(0, Math.min(1, (as.cohesion ?? max) / max)) : 1;
  return head * coh;
}

/**
 * Read the day's world once. `projection` may be null (fail-soft: candidates come from
 * the realm's own towns only, and no realm counts a neighbour).
 */
export function buildCrownWorld(graph: WorldGraph, tick: number, projection: RealmProjection | null): CrownWorld {
  const factions = graph.getNodesByType('actor').filter(isPurseFaction).sort(byId);
  const factionIds = new Set(factions.map(f => f.id));

  const income = new Map<string, number>();
  const fullIncome = new Map<string, number>();
  const wealth = new Map<string, number>();
  const means = new Map<string, MeansBand | null>();
  for (const f of factions) {
    const day = readPurseDay(f);
    income.set(f.id, day ? totalIncome(day.income) : 0);
    wealth.set(f.id, readWealth(f.properties));
    means.set(f.id, readMeansBand(f));
  }
  // Full income = own + the fealty its live oaths carry today (taxShare × the vassal's
  // own income). Read off the edges, not yesterday's purse day, so an offer and the
  // loyalty pass see the same figure on the day an oath is sworn.
  for (const f of factions) fullIncome.set(f.id, income.get(f.id) ?? 0);
  for (const e of graph.getEdgesByType('sworn_to')) {
    if (!fullIncome.has(e.target)) continue;
    const share = typeof e.properties.taxShare === 'number' ? e.properties.taxShare : 0;
    fullIncome.set(e.target, (fullIncome.get(e.target) ?? 0) + share * Math.max(0, income.get(e.source) ?? 0));
  }

  // Armies: every actor carrying an armyState, its faction by member_of.
  const armies: ArmySnapshot[] = [];
  const strength = new Map<string, number>();
  for (const n of graph.getNodesByType('actor')) {
    const as = n.properties.armyState as ArmyState | undefined;
    if (!as) continue;
    const factionId = graph.getOutgoingEdges(n.id, 'member_of')[0]?.target;
    if (!factionId) continue;
    const s = armyStrength(as);
    armies.push({ id: n.id, factionId, hex: hexOf(graph, graph.getOutgoingEdges(n.id, 'located_at')[0]?.target), strength: s });
    strength.set(factionId, (strength.get(factionId) ?? 0) + s);
  }
  armies.sort(byId);

  // Presence: held towns, halls (located_at + home), and where non-army members stand.
  const presence = new Map<string, Set<string>>();
  const holdHexes = new Map<string, HexCoord[]>();
  const held = new Map<string, Set<string>>();
  for (const f of factions) {
    const heldSet = new Set<string>();
    for (const e of graph.getOutgoingEdges(f.id, 'controls')) {
      const t = topLevel(graph, e.target);
      if (t) heldSet.add(t);
    }
    const halls = new Set<string>();
    for (const e of graph.getOutgoingEdges(f.id, 'located_at')) {
      const t = topLevel(graph, e.target);
      if (t) halls.add(t);
    }
    const home = topLevel(graph, f.properties.homeLocationId as string | undefined);
    if (home) halls.add(home);
    const p = new Set<string>([...heldSet, ...halls]);
    for (const m of graph.getIncomingEdges(f.id, 'member_of')) {
      if (factionIds.has(m.source)) continue;
      const src = graph.getNode(m.source);
      if (!src || src.properties.armyState) continue;
      const at = topLevel(graph, graph.getOutgoingEdges(m.source, 'located_at')[0]?.target);
      if (at) p.add(at);
    }
    presence.set(f.id, p);
    held.set(f.id, heldSet);
    const hexes: HexCoord[] = [];
    for (const loc of [...new Set([...heldSet, ...halls])].sort()) {
      const h = hexOf(graph, loc);
      if (h) hexes.push(h);
    }
    holdHexes.set(f.id, hexes);
  }

  const realmHexKeys = new Map<string, Set<string>>();
  for (const r of projection?.realms ?? []) realmHexKeys.set(r.id, new Set(r.hexes.map(hexKeyFromCoord)));
  const hexRealmId = projection?.hexRealmId ?? new Map<string, string>();

  const courtRealms = factions.filter(f => mayCourt(graph, f)).map(f => f.id);

  const candidates = new Map<string, string[]>();
  const reach = new Map<string, string[]>();
  for (const R of courtRealms) {
    const out = new Set<string>();
    const myHexes = realmHexKeys.get(R) ?? new Set<string>();
    const myTowns = held.get(R) ?? new Set<string>();
    for (const f of factions) {
      if (f.id === R) continue;
      for (const loc of presence.get(f.id) ?? []) {
        if (myTowns.has(loc)) { out.add(f.id); break; }
        const hx = hexOf(graph, loc);
        if (hx && myHexes.has(hexKeyFromCoord(hx))) { out.add(f.id); break; }
      }
    }
    // Neighbouring realms: any realm whose hexes touch R's.
    for (const key of myHexes) {
      const [col, row] = key.split(',').map(Number);
      for (const nb of hexNeighbors({ col, row })) {
        const other = hexRealmId.get(hexKey(nb.col, nb.row));
        if (other && other !== R) out.add(other);
      }
    }
    const reached = [...out].filter(id => isSwearableKind(graph.getNode(id))).sort();
    reach.set(R, reached);
    // A pair on the re-swear cooldown is not a candidate: can_court must be true only
    // when seek_fealty has someone it may court, or the action wins the draw and does nothing.
    candidates.set(R, reached.filter(id => maySwear(graph, graph.getNode(id)) && !onReswearCooldown(graph, id, R, tick)));
  }

  return {
    graph, tick, factions, income, fullIncome, wealth, means, armies, strength,
    presence, holdHexes, held, realmHexKeys, hexRealmId, courtRealms, candidates, reach,
  };
}
