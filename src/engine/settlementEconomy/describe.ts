/**
 * What the place page and the debug bridge read of a settlement's economy (THR-1923).
 *
 * Pure reads over the flat properties the phase writes. The size line, the livelihood
 * sentences and the chronicle all read the same `foodBalance`, `starveDays`, routes and
 * `landShocks`, so they cannot disagree (plan § Player-facing text, PC-6). Names come back
 * as linkable parts (Law 21); a sentence whose name slot is empty is dropped (Law 14).
 */
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { SHOCK_DAYS, SURPLUS_MIN_PER_DAY } from '../../data/settlement-economy-constants';
import { getSettlementBuilding } from '../../data/settlement-buildings';
import {
  SIZE_TIER_WORDS,
  SIZE_TREND_WORDS,
  COURT_LEFT_TELL_DAYS,
  LIVELIHOOD_FOOD_LINES,
  LIVELIHOOD_ROUTE_LINES,
  LIVELIHOOD_SHOCK_LINES,
  LIVELIHOOD_WHERE_WORDS,
  LIVELIHOOD_WHERE_FALLBACK,
  LIVELIHOOD_BUILDING_LOST_LINE,
  BUILDING_FACT_WORDS,
  BUILDING_IDLE_INPUT_WORDS,
  type SizeTrend,
} from '../../data/settlement-economy-words';
import { isEconomySettlement } from './land';
import { IS_BUILDING_PROP } from './building';
import { isSurplusRoute, routeCarries } from './surplusRoutes';
import { readLandShocks, isShockActive } from './shocks';
import { tierRank } from './tier';

/** A run of text, or a name the page links. */
export type EconomyPart = string | { text: string; ref: { kind: 'location'; id: string } };

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Whether the settlement economy has reached this settlement (it counts people). */
export function economyReached(node: GraphNode | undefined): node is GraphNode {
  return !!node && isEconomySettlement(node) && typeof node.properties.population === 'number';
}

export function isHungry(node: GraphNode): boolean {
  const p = node.properties;
  return (num(p.starveDays) ?? 0) > 0 || ((num(p.foodStore) ?? 0) <= 0 && (num(p.foodBalance) ?? 0) < 0);
}

export function sizeTrendOf(node: GraphNode, tick: number): SizeTrend {
  const p = node.properties;
  if (isHungry(node)) return 'hungry';
  const lost = num(p.economySeatLostTick);
  const shrinking = tierRank(p.targetTier as string) < tierRank(p.locationSubtype as string);
  if (shrinking && lost !== undefined && tick - lost <= COURT_LEFT_TELL_DAYS * TICKS_PER_DAY) return 'court_left';
  if (shrinking) return 'shrinking';
  const pop = num(p.population) ?? 0;
  const cap = num(p.populationCap) ?? pop;
  if (tierRank(p.targetTier as string) > tierRank(p.locationSubtype as string)) return 'growing';
  if (pop < cap && (num(p.foodBalance) ?? 0) > 0) return 'growing';
  return 'steady';
}

/** "A town, growing." — or null when the economy has not reached the place. */
export function sizeLine(node: GraphNode | undefined, tick: number): { tierWord: string; trendWord: string; text: string } | null {
  if (!economyReached(node)) return null;
  const tierWord = SIZE_TIER_WORDS[node.properties.locationSubtype as string];
  if (!tierWord) return null;
  const trendWord = SIZE_TREND_WORDS[sizeTrendOf(node, tick)];
  return { tierWord, trendWord, text: `${tierWord}, ${trendWord}.` };
}

function fill(line: string, slots: Record<string, string>): string {
  return line.replace(/\{(\w+)\}/g, (_m, k: string) => slots[k] ?? '');
}

function isNamed(n: GraphNode | undefined): n is GraphNode {
  return !!n && typeof n.name === 'string' && n.name.length > 0;
}

/** One sentence naming every town in `towns` ("A, B and C"), each linked; null when there are none. */
function withNames(line: string, slot: 'buyer' | 'seller', towns: GraphNode[], slots: Record<string, string>): EconomyPart[] | null {
  if (towns.length === 0) return null;
  const sorted = [...towns].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const token = `{${slot}}`;
  const at = line.indexOf(token);
  if (at < 0) return [fill(line, slots)];
  const names: EconomyPart[] = [];
  sorted.forEach((t, i) => {
    if (i > 0) names.push(i === sorted.length - 1 ? ' and ' : ', ');
    names.push({ text: t.name, ref: { kind: 'location', id: t.id } });
  });
  return [fill(line.slice(0, at), slots), ...names, fill(line.slice(at + token.length), slots)];
}

/**
 * The livelihood sentences: fed or short, where the surplus goes and what comes in, a
 * land shock or a siege while it lasts, a building lost lately. Null when the economy
 * has not reached the place.
 */
export function livelihoodParts(graph: WorldGraph, node: GraphNode | undefined, tick: number): EconomyPart[] | null {
  if (!economyReached(node)) return null;
  const p = node.properties;
  const name = node.name;
  if (!name) return null;
  const slots = { name };
  const out: EconomyPart[] = [];
  const sentence = (parts: EconomyPart[] | null) => {
    if (!parts) return;
    if (out.length > 0) out.push(' ');
    out.push(...parts);
  };

  const balance = num(p.foodBalance) ?? 0;
  const foodLine = isHungry(node)
    ? LIVELIHOOD_FOOD_LINES.hungry
    : balance < 0
      ? LIVELIHOOD_FOOD_LINES.short
      : (num(p.exportFood) ?? 0) > SURPLUS_MIN_PER_DAY || balance >= 0.5
        ? LIVELIHOOD_FOOD_LINES.plenty
        : LIVELIHOOD_FOOD_LINES.fed;
  sentence([fill(foodLine, slots)]);

  // One sentence per direction and good, the towns listed ("from A, B and C"), each name linked.
  const outgoing = graph.getOutgoingEdges(node.id, 'trades_with').filter(isSurplusRoute);
  const incoming = graph.getIncomingEdges(node.id, 'trades_with').filter(isSurplusRoute);
  const groups: [string, 'buyer' | 'seller', GraphNode[]][] = [
    [LIVELIHOOD_ROUTE_LINES.foodOut, 'buyer', outgoing.filter(r => routeCarries(r) === 'food').map(r => graph.getNode(r.target)).filter(isNamed)],
    [LIVELIHOOD_ROUTE_LINES.goodsOut, 'buyer', outgoing.filter(r => routeCarries(r) === 'goods').map(r => graph.getNode(r.target)).filter(isNamed)],
    [LIVELIHOOD_ROUTE_LINES.foodIn, 'seller', incoming.filter(r => routeCarries(r) === 'food').map(r => graph.getNode(r.source)).filter(isNamed)],
    [LIVELIHOOD_ROUTE_LINES.goodsIn, 'seller', incoming.filter(r => routeCarries(r) === 'goods').map(r => graph.getNode(r.source)).filter(isNamed)],
  ];
  for (const [line, slot, towns] of groups) sentence(withNames(line, slot, towns, slots));

  if (p.economyBesieged === true) sentence([fill(LIVELIHOOD_SHOCK_LINES.siege, slots)]);
  const seen = new Set<string>();
  for (const s of readLandShocks(node)) {
    if (!isShockActive(s, tick) || seen.has(s.source)) continue;
    seen.add(s.source);
    const where = (s.direction ? LIVELIHOOD_WHERE_WORDS[s.direction] : undefined) ?? LIVELIHOOD_WHERE_FALLBACK;
    sentence([fill(LIVELIHOOD_SHOCK_LINES[s.source], { ...slots, where })]);
  }

  const lost = p.economyLastLost as { buildingId?: string; tick?: number } | undefined;
  const lostDef = lost?.buildingId ? getSettlementBuilding(lost.buildingId) : undefined;
  if (lostDef && typeof lost?.tick === 'number' && tick - lost.tick <= SHOCK_DAYS * TICKS_PER_DAY) {
    sentence([fill(LIVELIHOOD_BUILDING_LOST_LINE, { ...slots, building: lostDef.cardName.toLowerCase() })]);
  }
  return out;
}

/** The Connections fact a building Place carries — "built by the town", or why it idles. */
export function buildingFact(place: GraphNode): string | null {
  if (place.properties?.[IS_BUILDING_PROP] !== true) return null;
  const def = getSettlementBuilding(String(place.properties.buildingId ?? ''));
  if (!def) return null;
  const reason = place.properties.idleReason;
  if (reason === 'input_lost' && def.needs?.special) {
    return BUILDING_IDLE_INPUT_WORDS[def.needs.special] ?? BUILDING_FACT_WORDS.built;
  }
  if (reason === 'upkeep_short') return BUILDING_FACT_WORDS.idleUpkeep.replace('{material}', def.upkeepWord);
  return BUILDING_FACT_WORDS.built;
}

// ─── Debug readout (`__DEBUG.getSettlementEconomy`) ───────────────────────

export interface SettlementEconomyReadout {
  id: string;
  name: string;
  tier: string;
  targetTier: string | null;
  population: number;
  cap: number | null;
  foodStore: number;
  growthProgress: number;
  buildProgress: number;
  importedFood: number;
  importedGoods: number;
  starveDays: number;
  foodBalance: number | null;
  buildBalance: number | null;
  workedHexes: unknown;
  buildings: { buildingId: string; placeId: string; name: string; idleDays: number; idleReason: string | null; fact: string | null }[];
  seatPulls: boolean;
  realmSeat: boolean;
  pullCount: number;
  routesOut: { toId: string; to: string; carries: string; carriedPerDay: number }[];
  routesIn: { fromId: string; from: string; carries: string; carriedPerDay: number }[];
  landShocks: unknown;
  besieged: boolean;
  happiness: number | null;
  contentment: number | null;
  sizeLine: string | null;
  livelihood: string | null;
}

/** Everything the phase wrote on one settlement, by id or name. Null when it is not one. */
export function describeSettlementEconomy(graph: WorldGraph, idOrName: string, tick: number): SettlementEconomyReadout | null {
  let node = graph.getNode(idOrName);
  if (!node) {
    const needle = idOrName.toLowerCase();
    node = graph.getNodesByType('location').find(n => isEconomySettlement(n) && n.name.toLowerCase() === needle);
  }
  if (!node || !isEconomySettlement(node)) return null;
  const p = node.properties;
  const buildings = graph.getOutgoingEdges(node.id, 'contains')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => !!n && n.properties?.[IS_BUILDING_PROP] === true)
    .map(n => ({
      buildingId: String(n.properties.buildingId),
      placeId: n.id,
      name: n.name,
      idleDays: num(n.properties.idleDays) ?? 0,
      idleReason: typeof n.properties.idleReason === 'string' ? n.properties.idleReason : null,
      fact: buildingFact(n),
    }));
  const routeRow = (e: { source: string; target: string; properties: Record<string, unknown> }, end: string) => ({
    id: end,
    name: graph.getNode(end)?.name ?? end,
    carries: String(e.properties.carries ?? 'food'),
    carriedPerDay: num(e.properties.carriedPerDay) ?? 0,
  });
  const parts = livelihoodParts(graph, node, tick);
  return {
    id: node.id,
    name: node.name,
    tier: String(p.locationSubtype),
    targetTier: typeof p.targetTier === 'string' ? p.targetTier : null,
    population: num(p.population) ?? 0,
    cap: num(p.populationCap) ?? null,
    foodStore: num(p.foodStore) ?? 0,
    growthProgress: num(p.growthProgress) ?? 0,
    buildProgress: num(p.buildProgress) ?? 0,
    importedFood: num(p.importedFood) ?? 0,
    importedGoods: num(p.importedGoods) ?? 0,
    starveDays: num(p.starveDays) ?? 0,
    foodBalance: num(p.foodBalance) ?? null,
    buildBalance: num(p.buildBalance) ?? null,
    workedHexes: p.workedHexList ?? [],
    buildings,
    seatPulls: p.economyPulls === true,
    realmSeat: p.economyRealmSeat === true,
    pullCount: num(p.pullCount) ?? 0,
    routesOut: graph.getOutgoingEdges(node.id, 'trades_with').filter(isSurplusRoute)
      .map(e => { const r = routeRow(e, e.target); return { toId: r.id, to: r.name, carries: r.carries, carriedPerDay: r.carriedPerDay }; }),
    routesIn: graph.getIncomingEdges(node.id, 'trades_with').filter(isSurplusRoute)
      .map(e => { const r = routeRow(e, e.source); return { fromId: r.id, from: r.name, carries: r.carries, carriedPerDay: r.carriedPerDay }; }),
    landShocks: readLandShocks(node),
    besieged: p.economyBesieged === true,
    happiness: num(p.economyHappiness) ?? null,
    contentment: num(p.economyContentment) ?? null,
    sizeLine: sizeLine(node, tick)?.text ?? null,
    livelihood: parts ? parts.map(x => (typeof x === 'string' ? x : x.text)).join('') : null,
  };
}
