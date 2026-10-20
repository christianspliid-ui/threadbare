/**
 * On the edge — a held town turns to a better lord (THR-1957, hunger and unrest S2;
 * plan `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md` § Engine 9).
 *
 * Once a day, for each held settlement bearing `on_the_edge` and out of its turn
 * cooldown, the town weighs every faction other than its holder that is the tax holder
 * of a settlement within `DEFECTION_RADIUS_HEXES`. Its view of a lord:
 *
 *   protection = the crown's protection term over this one town:
 *                threat > 0 ? strength(F) / (strength(F) + threat) : OATH_NO_THREAT_PROTECTION,
 *                threat = the strongest army within OATH_THREAT_RADIUS_HEXES of the town
 *                that is not F's, not sworn to F and not F's ally
 *   standing   = −1 if an army of F besieged the town within DEFECTION_MEMORY_DAYS,
 *                else +1 if F keeps a hall here or a member lives here, else 0
 *   fed        = share of F's held settlements with no hunger today
 *   solvent    = 0 when F's purse reads Destitute, else 1
 *   view       = W_protection·protection + W_standing·standing + W_fed·fed + W_solvent·solvent
 *
 * The town turns when the best lord beats its holder by `DEFECTION_MARGIN` (ties by id).
 * The siege-wins-over-a-hall order is this module's choice: a lord whose army sat at
 * the walls last month is not the lord the town runs to, hall or no hall.
 *
 * Pure reads here; `applyDefection` is the one writer. Deterministic (NFP #3): factions
 * and armies in id order, argmax with id ties, no draw.
 */
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { HexCoord } from '../../types';
import type { WorldGraph } from '../graph';
import type { CrownWorld } from '../crown/eligibility';
import type { TownLordViewParts } from '../../types/trace';
import { hexDistance } from '../../lib/hexMath';
import { resolveLocationToHex } from '../encounterAwareness';
import { getLocationNodes } from '../sublocationShape';
import { taxHolderOf } from '../factionPurse/income';
import { isAllied } from '../crown/offer';
import { factionKeepsHallAt } from '../warAims/enemy';
import { stampRealmSeat } from '../realmSeat';
import { residesIn } from '../factionSplinter';
import { adoptRevengeAmbition } from '../factionAmbitions';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { OATH_THREAT_RADIUS_HEXES, OATH_NO_THREAT_PROTECTION } from '../../data/crown-constants';
import {
  DEFECTION_RADIUS_HEXES,
  DEFECTION_MARGIN,
  DEFECT_W_PROTECTION,
  DEFECT_W_STANDING,
  DEFECT_W_FED,
  DEFECT_W_SOLVENT,
  DEFECTION_MEMORY_DAYS,
  DEFECTION_GRUDGE_SENTIMENT,
  DEFECTION_RELIEF,
  TOWN_TURN_COOLDOWN_DAYS,
} from '../../data/unrest-pressure-constants';
import { isPressureSettlement, HUNGER_DAYS_PROP } from './inputs';

/** Settlement property: tick of the last time the town turned (defection or rising). */
export const LAST_TURN_TICK_PROP = 'lastTurnTick';
/** Settlement property: faction id → last tick an army of that faction besieged the town. */
export const SIEGED_BY_PROP = 'unrestSiegedBy';

export interface TownView {
  readonly townId: string;
  readonly holderId: string;
  readonly holder: TownLordViewParts;
  /** Every candidate lord, best first (view desc, then id). */
  readonly candidates: readonly TownLordViewParts[];
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

const NO_REALM_MAP: ReadonlyMap<string, string> = new Map();

/** Every settlement's tax holder, once per daily pass (settlement id → faction id). */
export function settlementHolders(graph: WorldGraph, hexRealmId: ReadonlyMap<string, string> = NO_REALM_MAP): Map<string, string> {
  const out = new Map<string, string>();
  for (const node of getLocationNodes(graph)) {
    if (!isPressureSettlement(node)) continue;
    const h = taxHolderOf(graph, node.id, hexRealmId);
    if (h) out.set(node.id, h);
  }
  return out;
}

/** Is the town on its turn cooldown (defection or rising)? */
export function onTurnCooldown(town: GraphNode, tick: number): boolean {
  const last = num(town.properties[LAST_TURN_TICK_PROP]);
  return last !== undefined && tick - last < TOWN_TURN_COOLDOWN_DAYS * TICKS_PER_DAY;
}

/** The crown's protection term, evaluated over one town's hex. */
export function townProtection(world: CrownWorld, townHex: HexCoord, factionId: string): number {
  const own = world.strength.get(factionId) ?? 0;
  let threat = 0;
  for (const a of world.armies) {
    if (!a.hex || a.factionId === factionId) continue;
    if (a.strength <= threat) continue;
    const liege = world.graph.getOutgoingEdges(a.factionId, 'sworn_to')[0]?.target;
    if (liege === factionId) continue;
    if (isAllied(world.graph, factionId, a.factionId)) continue;
    if (hexDistance(townHex, a.hex) <= OATH_THREAT_RADIUS_HEXES) threat = a.strength;
  }
  return threat > 0 ? own / (own + threat) : OATH_NO_THREAT_PROTECTION;
}

/** −1 a recent siege of the town by F; else +1 a hall of F here or a member of F living here; else 0. */
export function townStanding(graph: WorldGraph, town: GraphNode, factionId: string, tick: number): number {
  const sieged = town.properties[SIEGED_BY_PROP] as Record<string, number> | undefined;
  const at = sieged && typeof sieged === 'object' ? num(sieged[factionId]) : undefined;
  if (at !== undefined && tick - at <= DEFECTION_MEMORY_DAYS * TICKS_PER_DAY) return -1;
  if (factionKeepsHallAt(graph, factionId, town.id)) return 1;
  for (const e of graph.getIncomingEdges(factionId, 'member_of')) {
    if (residesIn(graph, e.source, town.id)) return 1;
  }
  return 0;
}

/** Share of F's held settlements with no hunger today (0 when it holds none). */
export function fedShare(graph: WorldGraph, holders: ReadonlyMap<string, string>, factionId: string): number {
  let held = 0;
  let fed = 0;
  for (const [townId, holder] of holders) {
    if (holder !== factionId) continue;
    held += 1;
    const days = num(graph.getNode(townId)?.properties[HUNGER_DAYS_PROP]) ?? 0;
    if (days <= 0) fed += 1;
  }
  return held > 0 ? fed / held : 0;
}

/** 0 when F's purse reads Destitute; 1 otherwise (an unread purse counts as solvent). */
export function solventOf(world: CrownWorld, factionId: string): number {
  return world.means.get(factionId) === 'Destitute' ? 0 : 1;
}

export function townViewOf(
  world: CrownWorld,
  holders: ReadonlyMap<string, string>,
  town: GraphNode,
  townHex: HexCoord,
  factionId: string,
): TownLordViewParts {
  const protection = townProtection(world, townHex, factionId);
  const standing = townStanding(world.graph, town, factionId, world.tick);
  const fed = fedShare(world.graph, holders, factionId);
  const solvent = solventOf(world, factionId);
  const view = DEFECT_W_PROTECTION * protection + DEFECT_W_STANDING * standing
    + DEFECT_W_FED * fed + DEFECT_W_SOLVENT * solvent;
  return { factionId, protection, standing, fed, solvent, view };
}

/** Factions other than the holder that hold at least one settlement within the radius, id order. */
export function lordCandidates(
  graph: WorldGraph,
  holders: ReadonlyMap<string, string>,
  townHex: HexCoord,
  holderId: string,
): string[] {
  const out = new Set<string>();
  for (const [townId, holder] of holders) {
    if (holder === holderId || out.has(holder)) continue;
    const hex = resolveLocationToHex(graph, townId);
    if (hex && hexDistance(townHex, hex) <= DEFECTION_RADIUS_HEXES) out.add(holder);
  }
  return [...out].sort();
}

/** The whole view a held town takes of its holder and the lords near it, or null when unheld. */
export function buildTownView(
  world: CrownWorld,
  holders: ReadonlyMap<string, string>,
  town: GraphNode,
): TownView | null {
  const holderId = holders.get(town.id);
  const townHex = resolveLocationToHex(world.graph, town.id);
  if (!holderId || !townHex) return null;
  const holder = townViewOf(world, holders, town, townHex, holderId);
  const candidates = lordCandidates(world.graph, holders, townHex, holderId)
    .map(f => townViewOf(world, holders, town, townHex, f))
    .sort((a, b) => b.view - a.view || (a.factionId < b.factionId ? -1 : a.factionId > b.factionId ? 1 : 0));
  return { townId: town.id, holderId, holder, candidates };
}

/** The lord the town turns to, or null when none beats the holder by the margin. */
export function defectionChoice(view: TownView): TownLordViewParts | null {
  const best = view.candidates[0];
  if (!best) return null;
  return best.view > view.holder.view + DEFECTION_MARGIN ? best : null;
}

/** The old holder's `relates_to` toward the new lord, minted when missing. */
function relationEdge(graph: WorldGraph, a: string, b: string, tick: number) {
  const found = graph.getOutgoingEdges(a, 'relates_to').find(e => e.target === b);
  if (found) return found;
  const id = `e_relates_${a}_${b}_defection_${tick}`;
  try {
    graph.addEdge({ id, source: a, target: b, type: 'relates_to', properties: { sentiment: 0 } });
  } catch { /* fail-soft: id taken */ }
  return graph.getOutgoingEdges(a, 'relates_to').find(e => e.target === b) ?? null;
}

/**
 * Move the town's `controls` from its holder to `toId`, and stamp the turn on both
 * sides. `via` is `'defection'` here and `'rising'` for a rising. Edges are retargeted,
 * never delete-and-add (the edge id is the audit trail, as for a conquest). Returns the
 * number of edges moved; the caller bumps structure — `runTownTurns` calls the unrest
 * phase's `onStructure` hook, which is `touchStructure(runtime)` in the orchestrator.
 */
export function moveControls(
  graph: WorldGraph,
  townId: string,
  fromId: string,
  toId: string,
  via: 'defection' | 'rising',
  tick: number,
): number {
  let moved = 0;
  for (const edge of graph.getIncomingEdges(townId, 'controls').filter(e => e.source === fromId)) {
    try {
      graph.retargetEdgeSource(edge.id, toId);
      graph.updateEdge(edge.id, { properties: { establishedTick: tick, via, takenFrom: fromId } });
      moved += 1;
    } catch { /* fail-soft: edge removed mid-pass */ }
  }
  try { stampRealmSeat(graph, toId); } catch { /* fail-soft */ }
  try { stampRealmSeat(graph, fromId); } catch { /* fail-soft */ }
  return moved;
}

/**
 * The town turns to `toId`: controls move, the old holder's grudge (`relates_to`
 * sentiment past the enemy line, `defectionTick`) and its revenge ambition naming the
 * town, then the relief push and the cooldown stamp. Returns false when no edge moved.
 */
export function applyDefection(state: GameState, town: GraphNode, holderId: string, toId: string): boolean {
  const graph = state.graph;
  const tick = state.tick;
  if (moveControls(graph, town.id, holderId, toId, 'defection', tick) === 0) return false;
  const rel = relationEdge(graph, holderId, toId, tick);
  if (rel) {
    const prev = num(rel.properties.sentiment) ?? 0;
    graph.updateEdge(rel.id, {
      properties: { sentiment: Math.min(prev, DEFECTION_GRUDGE_SENTIMENT), defectionTick: tick },
    });
  }
  adoptRevengeAmbition(state, holderId, toId, town.id, 'town_defected');
  const unrest = num(town.properties.unrest) ?? 0;
  town.properties.unrest = Math.max(0, Math.min(100, unrest + DEFECTION_RELIEF));
  town.properties[LAST_TURN_TICK_PROP] = tick;
  return true;
}
