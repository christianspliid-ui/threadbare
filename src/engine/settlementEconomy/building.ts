/**
 * The build sink — buildings, slots, the choice, idling and loss (THR-1923, plan § Systems
 * design 4, § Resolution logic 4).
 *
 * A building is a Place the settlement raised (`isBuilding: true`, `buildingId`), on the
 * existing sublocation shape (a `location` node with `parentLocationId` and a `contains`
 * edge). A building whose Place type already stands in the settlement **adopts** that Place
 * rather than duplicating it; worldgen Places of a building's `adoptsTypes` count as built
 * at day 0 and are grandfathered past the slot cap.
 *
 * Determinism (NFP #3): one seeded draw per candidate, in building-table order. Fail-soft
 * (NFP #4): a building row whose id no longer exists is ignored; graph writes that throw
 * are skipped.
 */
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import {
  SETTLEMENT_BUILDINGS,
  getSettlementBuilding,
  buildingForPlaceType,
  type SettlementBuildingDef,
} from '../../data/settlement-buildings';
import {
  BUILD_SCORE_BASE,
  SURPLUS_TAG_BONUS,
  FOOD_RICH_BONUS,
  FOOD_RICH_RATIO,
  SPECIAL_GOOD_BONUS,
  HOUSING_PRESSURE_BONUS,
  PATH_BONUS,
  LEAN_BONUS,
  BUILD_CHOICE_JITTER,
  FOOD_PER_PERSON,
} from '../../data/settlement-economy-constants';
import type { SpecialGood } from '../../data/special-goods';
import type { Yield } from './land';

/** Property marking a Place the settlement economy raised or adopted. */
export const IS_BUILDING_PROP = 'isBuilding';
/** Who made the Place: `settlement_economy` when raised fresh; absent when adopted. */
export const BUILT_BY_PROP = 'builtBy';
export const BUILT_BY_ECONOMY = 'settlement_economy';
/** An adopted Place's persistence before adoption, restored if the building is lost. */
const ADOPTED_PERSISTENCE_PROP = 'adoptedPersistence';

export type IdleReason = 'upkeep_short' | 'input_lost';

export interface BuildingInstance {
  readonly node: GraphNode;
  readonly def: SettlementBuildingDef;
}

/** The buildings standing in a settlement, in building-table order. */
export function readBuildings(graph: WorldGraph, settlementId: string): BuildingInstance[] {
  const out: BuildingInstance[] = [];
  const seen = new Set<string>();
  for (const e of graph.getOutgoingEdges(settlementId, 'contains')) {
    const node = graph.getNode(e.target);
    if (!node || node.properties?.[IS_BUILDING_PROP] !== true) continue;
    const def = getSettlementBuilding(String(node.properties.buildingId ?? ''));
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    out.push({ node, def });
  }
  const order = new Map(SETTLEMENT_BUILDINGS.map((b, i) => [b.id, i]));
  return out.sort((a, b) => order.get(a.def.id)! - order.get(b.def.id)!);
}

export function isIdle(b: BuildingInstance): boolean {
  return typeof b.node.properties.idleReason === 'string';
}

/** The settlement facts a building's `needs` and score read. */
export interface BuildingContext {
  /** Today's yield including yesterday's imports: [food, wood, stone]. */
  readonly yieldIn: Yield;
  /** The land's own yield, before imports — what `needs` read (a building rises from its own land). */
  readonly landYield: Yield;
  readonly fieldHexes: number;
  readonly fishingHexes: number;
  readonly grazingHexes: number;
  readonly special: ReadonlySet<SpecialGood>;
  readonly routes: number;
  readonly population: number;
  readonly cap: number;
  readonly isSeat: boolean;
  readonly lean: string | undefined;
  readonly owned: readonly BuildingInstance[];
}

export function needsHold(def: SettlementBuildingDef, ctx: BuildingContext): boolean {
  const n = def.needs;
  if (!n) return true;
  if (n.foodYield !== undefined && ctx.landYield[0] < n.foodYield) return false;
  if (n.woodYield !== undefined && ctx.landYield[1] < n.woodYield) return false;
  if (n.stoneYield !== undefined && ctx.landYield[2] < n.stoneYield) return false;
  if (n.fieldHexes !== undefined && ctx.fieldHexes < n.fieldHexes) return false;
  if (n.fishingHexes !== undefined && ctx.fishingHexes < n.fishingHexes) return false;
  if (n.grazingHexes !== undefined && ctx.grazingHexes < n.grazingHexes) return false;
  if (n.special !== undefined && !ctx.special.has(n.special)) return false;
  if (n.routes !== undefined && ctx.routes < n.routes) return false;
  if (n.population !== undefined && ctx.population < n.population) return false;
  if (n.stoneOrSeat !== undefined && !(ctx.landYield[2] >= n.stoneOrSeat || ctx.isSeat)) return false;
  if (n.faithLeanOrBuilding && !(ctx.lean === def.id || ctx.owned.some(b => b.def.tag === 'faith'))) return false;
  return true;
}

/** The settlement's largest surplus channel, as the prototype read it. */
function surplusTagOf(y: Yield): 'stone' | 'wood' | 'food' {
  if (y[2] > y[1]) return 'stone';
  if (y[1] > 0) return 'wood';
  return 'food';
}

export interface BuildChoice {
  readonly def: SettlementBuildingDef;
  readonly score: number;
  readonly runnerUp?: string;
}

/**
 * Score every candidate (not yet standing, `needs` hold) and return the best. One draw per
 * candidate from `rng`, in building-table order.
 */
export function chooseBuilding(ctx: BuildingContext, rng: () => number): BuildChoice | null {
  const ownedIds = new Set(ctx.owned.map(b => b.def.id));
  const surplusTag = surplusTagOf(ctx.yieldIn);
  let best: { def: SettlementBuildingDef; score: number } | null = null;
  let second: { def: SettlementBuildingDef; score: number } | null = null;
  for (const def of SETTLEMENT_BUILDINGS) {
    if (ownedIds.has(def.id) || !needsHold(def, ctx)) continue;
    let score = BUILD_SCORE_BASE + rng() * BUILD_CHOICE_JITTER;
    if (def.tag === surplusTag) score += SURPLUS_TAG_BONUS;
    if (def.tag === 'food' && ctx.yieldIn[0] > ctx.population * FOOD_PER_PERSON * FOOD_RICH_RATIO) score += FOOD_RICH_BONUS;
    if (def.needs?.special) score += SPECIAL_GOOD_BONUS;
    if (def.id === 'housing' && ctx.population >= ctx.cap - 1) score += HOUSING_PRESSURE_BONUS;
    for (const b of ctx.owned) if (b.def.tag === def.tag) score += PATH_BONUS;
    if (ctx.lean === def.id) score += LEAN_BONUS;
    if (!best || score > best.score) {
      second = best;
      best = { def, score };
    } else if (!second || score > second.score) {
      second = { def, score };
    }
  }
  return best ? { def: best.def, score: best.score, runnerUp: second?.def.id } : null;
}

/** The product of standing buildings' multipliers on one channel. */
export function channelMultiplier(owned: readonly BuildingInstance[], channel: 'food' | 'wood' | 'stone'): number {
  let m = 1;
  for (const b of owned) if (!isIdle(b)) m *= b.def.effects[channel] ?? 1;
  return m;
}

export function sumEffect(owned: readonly BuildingInstance[], key: 'happy' | 'routeCap' | 'goods' | 'homes'): number {
  let s = 0;
  for (const b of owned) if (!isIdle(b)) s += b.def.effects[key] ?? 0;
  return s;
}

export function upkeepOf(owned: readonly BuildingInstance[]): number {
  return owned.reduce((sum, b) => sum + b.def.upkeep, 0);
}

function contains(graph: WorldGraph, settlementId: string): GraphNode[] {
  const out: GraphNode[] = [];
  for (const e of graph.getOutgoingEdges(settlementId, 'contains')) {
    const n = graph.getNode(e.target);
    if (n) out.push(n);
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function markAdopted(node: GraphNode, def: SettlementBuildingDef, tick: number): void {
  const p = node.properties;
  p[ADOPTED_PERSISTENCE_PROP] = p.persistence;
  // The town keeps what it raised: an adopted Place no longer dissolves on its old rule.
  p.persistence = { type: 'permanent' };
  p[IS_BUILDING_PROP] = true;
  p.buildingId = def.id;
  p.builtTick = tick;
  p.idleDays = 0;
}

/**
 * Day 0: every Place of a building's `adoptsTypes` becomes that building (one per
 * building). Returns the building ids adopted.
 */
export function adoptWorldgenPlaces(graph: WorldGraph, settlementId: string, tick: number): string[] {
  const adopted: string[] = [];
  const have = new Set(readBuildings(graph, settlementId).map(b => b.def.id));
  for (const node of contains(graph, settlementId)) {
    if (node.properties[IS_BUILDING_PROP] === true) continue;
    const typeId = node.properties.sublocationTypeId;
    if (typeof typeId !== 'string') continue;
    const def = SETTLEMENT_BUILDINGS.find(b => b.adoptsTypes?.includes(typeId));
    if (!def || have.has(def.id)) continue;
    markAdopted(node, def, tick);
    have.add(def.id);
    adopted.push(def.id);
  }
  return adopted;
}

export interface RaiseResult {
  readonly placeId: string;
  readonly adopted: boolean;
}

/**
 * Raise a building: adopt a standing Place of its type (or one of its `adoptsTypes`), else
 * mint a new Place. Null when the write fails.
 */
export function raiseBuilding(
  graph: WorldGraph,
  settlement: GraphNode,
  def: SettlementBuildingDef,
  tick: number,
): RaiseResult | null {
  try {
    const match = contains(graph, settlement.id).find(n => {
      if (n.properties[IS_BUILDING_PROP] === true) return false;
      const typeId = n.properties.sublocationTypeId;
      return typeof typeId === 'string' && buildingForPlaceType(typeId)?.id === def.id;
    });
    if (match) {
      markAdopted(match, def, tick);
      return { placeId: match.id, adopted: true };
    }
    let id = `${settlement.id}_bld_${def.id}`;
    if (graph.getNode(id)) id = `${id}_${tick}`;
    if (graph.getNode(id)) return null;
    graph.addNode({
      id,
      type: 'location',
      name: `${def.cardName} (${settlement.name})`,
      properties: {
        sublocationTypeId: def.sublocationTypeId,
        parentLocationId: settlement.id,
        hexCol: settlement.properties.hexCol,
        hexRow: settlement.properties.hexRow,
        persistence: { type: 'permanent' },
        [IS_BUILDING_PROP]: true,
        [BUILT_BY_PROP]: BUILT_BY_ECONOMY,
        buildingId: def.id,
        builtTick: tick,
        idleDays: 0,
      },
    });
    graph.addEdge({
      id: `edge_contains_${settlement.id}_${id}`,
      type: 'contains',
      source: settlement.id,
      target: id,
      properties: {},
    });
    return { placeId: id, adopted: false };
  } catch {
    return null;
  }
}

/**
 * Lose a building. A Place the economy raised is removed (anyone standing in it moves to
 * the settlement, as a dissolution does); an adopted Place stays and stops being a
 * building, its old persistence restored. Returns whether the Place was removed.
 */
export function loseBuilding(graph: WorldGraph, settlementId: string, b: BuildingInstance, tick: number): boolean {
  const node = b.node;
  const p = node.properties;
  if (p[BUILT_BY_PROP] === BUILT_BY_ECONOMY) {
    for (const edge of graph.getIncomingEdges(node.id, 'located_at')) {
      graph.removeEdge(edge.id);
      graph.addEdge({
        id: `located_at-${edge.source}-to-${settlementId}-${tick}`,
        source: edge.source,
        target: settlementId,
        type: 'located_at',
        properties: {},
      });
    }
    graph.removeNode(node.id);
    return true;
  }
  delete p[IS_BUILDING_PROP];
  delete p.buildingId;
  delete p.builtTick;
  delete p.idleDays;
  delete p.idleReason;
  if (p[ADOPTED_PERSISTENCE_PROP] !== undefined) p.persistence = p[ADOPTED_PERSISTENCE_PROP];
  delete p[ADOPTED_PERSISTENCE_PROP];
  return false;
}
