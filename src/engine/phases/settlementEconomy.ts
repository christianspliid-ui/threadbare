/**
 * Phase: the settlement economy (THR-1923).
 *
 * Once a day every settlement works the land around it, feeds its people, grows or
 * starves, raises buildings from its spare timber and stone, sends a share of its surplus
 * to its holder's seat, and sells what is still left along a surplus route. Only a
 * faction seat that pulls resources in becomes a city. The phase writes flat properties
 * on each settlement (`population`, the meters, `foodBalance`, `buildBalance`,
 * `targetTier`) and the `resourceBalance` prosperity already reads; the promotion phase
 * moves the subtype toward `targetTier`.
 *
 * Christian's four directions (2026-10-14): goods flow à la Civ, not along roads; sinks,
 * not stockpiles; a diverse map; only a seat makes a city. Plan:
 * Docs/plans/2026-10-14-thr-1923-settlement-economy.md.
 *
 * Runs in `pre-economy`, before `resource_stock_tiers`, on the tick where
 * `tick % TICKS_PER_DAY === SETTLEMENT_ECONOMY_TICK_OFFSET`. The same day function runs
 * `SETTLEMENT_SETTLING_DAYS` times at worldgen (muted) so day-0 sizes fit the land.
 *
 * NFP: tunable (`settlement-economy-constants.ts` and the four data tables); inspectable
 * (seven trace kinds, flat properties, `__DEBUG.getSettlementEconomy`); deterministic (one
 * seeded draw per candidate building, id-ordered iteration); fail-soft (a settlement that
 * throws is skipped for the day, never the tick).
 */
import type { GameState, TickEvent } from '../../types/gameState';
import type { ChronicleEntry } from '../../types/narrative';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { HexTile } from '../../types';
import type { TraceEntryInput } from '../../types/trace';
import type { SphereName } from '../../types';
import type { EnginePhase, PhaseContext, PhaseResult } from '../phaseRegistry';
import type { WorldGraph } from '../graph';
import { emitTrace } from '../traceBuffer';
import { touchStructure, touchWorld, applyEncounterCacheUpdate, type SimulationRuntime } from '../simulationRuntime';
import { realmBorderMap } from '../realmBorderMap';
import { buildRealmProjection } from '../realmProjection';
import { resolveEconomicChronicle, chronicleSeed } from '../economicChronicle';
import { hexDistance, hexToPixel } from '../../lib/hexMath';
import { hexKey } from '../../lib/hexKey';
import { mulberry32, hashString } from '../../lib/prng';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { ECON_PHASE_SPOTLIGHT_CAP } from '../../data/resource-classes';
import { REALM_FACTION_CLASS } from '../../data/realm-content';
import { FIELD_TERRAINS, FISHING_TERRAINS, GRAZING_TERRAINS } from '../../data/terrain-yields';
import {
  SETTLEMENT_ECONOMY_ENABLED,
  SETTLEMENT_ECONOMY_TICK_OFFSET,
  SETTLEMENT_SETTLING_DAYS,
  CENTRE_YIELD,
  WORK_FOOD_WEIGHT,
  WORK_FOOD_WEIGHT_SHORT,
  FOOD_PER_PERSON,
  WOOD_PER_PERSON,
  START_POPULATION,
  BUILDING_SLOTS,
  SEAT_MIN_INCOMING,
  SEAT_DRAW,
  IDLE_DAYS_TO_LOSE,
  SURPLUS_ROUTE_RANGE,
  ROUTE_PERSIST_DAYS,
  ROUTE_DIE_DAYS,
  SURPLUS_MIN_PER_DAY,
  GOODS_IMPORT_FACTOR,
  SHOCK_SIEGE_FACTOR,
  ROUTE_HAPPY,
  HUNGER_UNHAPPY,
  CROWDING_PER_UNHAPPY,
  UNREST_FROM_HAPPINESS,
  UNREST_HAPPINESS_MAX,
  STARVING_CHRONICLE_COOLDOWN_DAYS,
  type SettlementTier,
} from '../../data/settlement-economy-constants';
import {
  SURPLUS_ROUTE_BORN_LINES,
  SURPLUS_ROUTE_BORN_TITLES,
  starvingTitle,
} from '../../data/settlement-economy-chronicle-content';
import type { EconomicChronicleTrigger } from '../../data/economic-chronicle-content';
import {
  buildLandIndex,
  assignHexOwnership,
  specialGoodsInReach,
  getEconomySettlements,
  hexOf,
  type OwnedHex,
  type Yield,
} from '../settlementEconomy/land';
import { runFoodDay, type FoodMeters } from '../settlementEconomy/growth';
import {
  readBuildings,
  adoptWorldgenPlaces,
  chooseBuilding,
  raiseBuilding,
  loseBuilding,
  channelMultiplier,
  sumEffect,
  upkeepOf,
  isIdle,
  type BuildingInstance,
  type IdleReason,
} from '../settlementEconomy/building';
import {
  buildSeatMap,
  buildHolderMap,
  heldCountBySeat,
  pullCountOf,
  seatPulls,
  leanBuildingOf,
} from '../settlementEconomy/seat';
import { targetTierOf, landHousingOf, populationCapOf, tierRank } from '../settlementEconomy/tier';
import { measureDiversity } from '../settlementEconomy/measures';
import {
  readSurplusRoutes,
  routeCarries,
  isRouteBlockaded,
  openSurplusRoute,
  markCarried,
  markDry,
  type SurplusGood,
} from '../settlementEconomy/surplusRoutes';
import {
  readLandShocks,
  shockFactorAt,
  isShockActive,
  besiegedSettlementIds,
  BEST_HEX_PROP,
  LAND_SHOCKS_PROP,
  type HexDirection,
  type LandShock,
} from '../settlementEconomy/shocks';

// ─── Helpers ──────────────────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function trace(mute: boolean, entry: TraceEntryInput): void {
  if (mute) return;
  emitTrace(entry);
}

/** Where `hex` lies from `centre`, in the words the receipt and livelihood line use. */
export function hexDirectionFrom(
  centre: { col: number; row: number },
  hex: { col: number; row: number },
  hasRiver: boolean,
): HexDirection {
  if (hex.col === centre.col && hex.row === centre.row) return 'centre';
  if (hasRiver) return 'river';
  const a = hexToPixel(centre, 1);
  const b = hexToPixel(hex, 1);
  const deg = (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI;
  const sectors: HexDirection[] = ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'];
  return sectors[((Math.round(deg / 45) % 8) + 8) % 8];
}

/** Settlements a threaded mortal lives in (full-detail regardless of size). */
export function threadedHomeIds(state: Pick<GameState, 'graph' | 'ascendantId'>): Set<string> {
  const out = new Set<string>();
  const graph = state.graph;
  if (!state.ascendantId) return out;
  for (const thread of graph.getOutgoingEdges(state.ascendantId, 'thread')) {
    const loc = graph.getOutgoingEdges(thread.target, 'located_at')[0];
    if (!loc) continue;
    const node = graph.getNode(loc.target);
    const parent = node?.properties?.parentLocationId;
    out.add(typeof parent === 'string' ? parent : loc.target);
  }
  return out;
}

// ─── The working record ──────────────────────────────────────────────────

interface SettlementDay {
  readonly node: GraphNode;
  readonly id: string;
  readonly hexes: readonly OwnedHex[];
  readonly holder: string | null;
  readonly isSeat: boolean;
  readonly realmSeat: boolean;
  readonly held: number;
  meters: FoodMeters;
  buildProgress: number;
  goodsSurplusDays: number;
  buildings: BuildingInstance[];
  cap: number;
  pullCount: number;
  pulls: boolean;
  workedHexes: number;
  workedList: { key: string; food: number; wood: number; stone: number }[];
  landFood: number;
  yieldIn: Yield;
  need: number;
  upkeep: number;
  exportFood: number;
  exportGoods: number;
  goodsOutput: number;
  nextImportFood: number;
  nextImportGoods: number;
  starvedBefore: boolean;
}

export interface SettlementEconomyDayInput {
  readonly graph: WorldGraph;
  readonly tiles: readonly HexTile[];
  readonly tick: number;
  readonly seed: number;
  readonly hexRealmId: ReadonlyMap<string, string>;
  readonly runtime?: SimulationRuntime;
  /** Worldgen settling run: no traces, no chronicle. */
  readonly mute?: boolean;
  /** Settlements told in full detail whatever their size (threaded mortals' homes). */
  readonly alwaysSpotlight?: ReadonlySet<string>;
  /**
   * The worldgen settling run's reuse of what cannot change while it runs (the land, its
   * owners, the holders and seats, the special goods in reach). Filled on the first day,
   * read on the rest. Never passed during play, where holders and land move.
   */
  readonly landCache?: SettlingLandCache;
}

/** What one settling run computes once (see `SettlementEconomyDayInput.landCache`). */
export interface SettlingLandCache {
  index?: ReturnType<typeof buildLandIndex>;
  riverByKey?: Set<string>;
  holders?: Map<string, string | null>;
  seats?: ReturnType<typeof buildSeatMap>;
  heldBySeat?: Map<string, number>;
  ownership?: Map<string, OwnedHex[]>;
  special?: Map<string, ReturnType<typeof specialGoodsInReach>>;
}

export interface SettlementEconomyDayResult {
  readonly events: TickEvent[];
  readonly chronicle: ChronicleEntry[];
  readonly structureChanged: boolean;
  /** Settlements the day ran for (a settlement that threw is not counted). */
  readonly settlements: number;
}

/**
 * One day of the settlement economy over the whole map. Mutates the graph in place
 * (settlement properties, building Places, surplus-route edges).
 */
export function runSettlementEconomyDay(input: SettlementEconomyDayInput): SettlementEconomyDayResult {
  const { graph, tiles, tick, seed, hexRealmId, runtime } = input;
  const mute = input.mute === true;
  const events: TickEvent[] = [];
  const chronicle: ChronicleEntry[] = [];
  let structureChanged = false;

  const settlements = getEconomySettlements(graph);
  if (settlements.length === 0) return { events, chronicle, structureChanged, settlements: 0 };

  const cache = input.landCache;
  const index = cache?.index ?? buildLandIndex(graph, tiles);
  const riverByKey = cache?.riverByKey ?? new Set(tiles.filter(t => t.hasRiver).map(t => hexKey(t.coord.col, t.coord.row)));
  const holders = cache?.holders ?? buildHolderMap(graph, settlements, hexRealmId);
  const seats = cache?.seats ?? buildSeatMap(graph);
  const heldBySeat = cache?.heldBySeat ?? heldCountBySeat(holders, seats);
  const ownership = cache?.ownership ?? assignHexOwnership(settlements, index, hexRealmId, id => holders.get(id) ?? null);
  if (cache && !cache.index) {
    Object.assign(cache, { index, riverByKey, holders, seats, heldBySeat, ownership, special: new Map() });
  }
  const besieged = besiegedSettlementIds(graph);

  const routes = readSurplusRoutes(graph);
  const incomingCount = new Map<string, number>();
  for (const r of routes) incomingCount.set(r.target, (incomingCount.get(r.target) ?? 0) + 1);

  // Full detail: the most populous `ECON_PHASE_SPOTLIGHT_CAP`, plus threaded homes.
  const spotlight = new Set(
    [...settlements]
      .sort((a, b) => num(b.properties.population) - num(a.properties.population) || (a.id < b.id ? -1 : 1))
      .slice(0, ECON_PHASE_SPOTLIGHT_CAP)
      .map(s => s.id),
  );
  for (const id of input.alwaysSpotlight ?? []) spotlight.add(id);

  const chron = (
    trigger: EconomicChronicleTrigger,
    node: GraphNode,
    ctx: Record<string, string | undefined>,
    entitySalt: string,
    title?: string,
  ): void => {
    if (mute || !spotlight.has(node.id) || !node.name) return;
    const result = resolveEconomicChronicle(trigger, {
      settlement: node.name,
      locationId: node.id,
      hexCoords: hexOf(node) ?? undefined,
      ...ctx,
    }, tick, chronicleSeed(seed, `${node.id}:${entitySalt}`));
    if (!result) return;
    if (title) result.chronicleChapter.title = title;
    events.push(result.tickEvent);
    chronicle.push({
      id: result.chronicleChapter.id,
      tier: 'chronicle',
      title: result.chronicleChapter.title,
      prose: result.chronicleChapter.prose,
      promptContext: { actors: result.chronicleChapter.actorIds, location: node.name, sphere: 'gold' as SphereName, mood: 'economic' },
      tick,
    });
  };

  const records = new Map<string, SettlementDay>();

  // ── 1. Each settlement's own day: land, food, buildings ──────────────
  for (const node of settlements) {
    try {
      const rec = settlementOwnDay(node);
      if (rec) records.set(node.id, rec);
    } catch (err) {
      if (!mute) console.warn(`[settlement_economy] ${node.id} skipped this day`, err);
    }
  }

  function settlementOwnDay(node: GraphNode): SettlementDay | null {
    const p = node.properties;
    const id = node.id;
    const centre = hexOf(node);
    const hexes = ownership.get(id) ?? [];
    const holder = holders.get(id) ?? null;
    const holderNode = holder ? graph.getNode(holder) : undefined;
    const realmHolder = holderNode?.properties.factionClass === REALM_FACTION_CLASS ? holder : null;
    const isSeat = seats.seatedAt.has(id);
    const realmSeat = seats.realmSeats.has(id);
    const held = heldBySeat.get(id) ?? 0;
    const incoming = incomingCount.get(id) ?? 0;
    const pulls = seatPulls(isSeat, held, incoming, SEAT_MIN_INCOMING);
    const pullCount = pullCountOf(held, incoming);
    const tier = p.locationSubtype as SettlementTier;

    // First sight: day-0 Places become buildings; people start at the tier's size, capped by the land.
    const firstSight = typeof p.population !== 'number';
    if (firstSight) {
      for (const bid of adoptWorldgenPlaces(graph, id, tick)) {
        structureChanged = true;
        trace(mute, {
          tick, category: 'settlement_building_raised', agentId: id,
          summary: `${node.name}: ${bid} adopted from a standing Place`,
          locationId: id, buildingId: bid, placeId: '', reason: 'adopted',
        });
      }
    }
    let buildings = readBuildings(graph, id);
    const landHousing = landHousingOf(hexes.map(h => h.base[0]));
    const cap = populationCapOf(landHousing, sumEffect(buildings, 'homes'), pulls, pullCount);
    if (firstSight) p.population = Math.max(1, Math.min(START_POPULATION[tier] ?? 1, cap));

    const meters: FoodMeters = {
      population: Math.max(1, Math.round(num(p.population, 1))),
      foodStore: num(p.foodStore),
      growthProgress: num(p.growthProgress),
      starveDays: num(p.starveDays),
      foodSurplusDays: num(p.foodSurplusDays),
    };
    const starvedBefore = meters.starveDays > 0;

    // Work: one person, one hex — food first while the store is short. People work the
    // land they know by its ordinary yield, so a blight or a siege bites the hexes they work
    // rather than sending them to the next field over (review gate, THR-1923).
    const short = meters.foodStore < meters.population * FOOD_PER_PERSON;
    const foodWeight = short ? WORK_FOOD_WEIGHT_SHORT : WORK_FOOD_WEIGHT;
    const workedHexes = [...hexes]
      .sort((a, b) => (b.base[0] * foodWeight + b.base[1] + b.base[2]) - (a.base[0] * foodWeight + a.base[1] + a.base[2]) || (a.key < b.key ? -1 : 1))
      .slice(0, meters.population);

    // Land shocks: drop the faded ones, pin a record cast before the phase named a hex. A
    // shock lands on the best hex people actually work for its channel — one nobody works
    // would change nothing while the receipt said it did (review gate).
    const bestHex = (channel: 0 | 2): OwnedHex | undefined =>
      workedHexes.filter(h => h.base[channel] > 0)
        .sort((a, b) => b.base[channel] - a.base[channel] || (a.key < b.key ? -1 : 1))[0];
    const shocks: LandShock[] = readLandShocks(node).filter(s => isShockActive(s, tick));
    for (const s of shocks) {
      if (s.hexKey) continue;
      const h = bestHex(s.channel === 2 ? 2 : 0);
      if (!h) continue;
      s.hexKey = h.key;
      if (centre) s.direction = hexDirectionFrom(centre, h, riverByKey.has(h.key));
    }
    p[LAND_SHOCKS_PROP] = shocks;
    if (centre) {
      const best: Record<string, { key: string; direction: HexDirection }> = {};
      for (const ch of [0, 2] as const) {
        const h = bestHex(ch);
        if (h && h.base[ch] > 0) best[String(ch)] = { key: h.key, direction: hexDirectionFrom(centre, h, riverByKey.has(h.key)) };
      }
      p[BEST_HEX_PROP] = best;
    }

    // A siege is read, never stored: the fields outside the walls give little.
    const siegeNow = besieged.has(id);
    if (siegeNow !== (p.economyBesieged === true)) {
      trace(mute, {
        tick, category: 'settlement_land_shock', agentId: id,
        summary: `${node.name}: ${siegeNow ? 'a siege cuts its fields' : 'the siege lifts; its fields are worked again'}`,
        locationId: id, hexKey: null, channel: 0, factor: siegeNow ? SHOCK_SIEGE_FACTOR : 1, untilTick: tick, source: 'siege',
      });
    }
    p.economyBesieged = siegeNow;

    const effective = (h: OwnedHex): Yield => {
      const y: Yield = [h.base[0], h.base[1], h.base[2]];
      for (const s of shocks) {
        if (s.hexKey !== h.key) continue;
        y[s.channel] *= shockFactorAt(s, tick);
      }
      if (siegeNow && h.distance > 0) for (let i = 0; i < 3; i++) y[i] *= SHOCK_SIEGE_FACTOR;
      return y;
    };

    const worked = workedHexes.map(h => ({ h, y: effective(h) }));
    const y: Yield = [CENTRE_YIELD[0], CENTRE_YIELD[1], CENTRE_YIELD[2]];
    for (const w of worked) for (let i = 0; i < 3; i++) y[i] += w.y[i];
    y[0] *= channelMultiplier(buildings, 'food');
    y[1] *= channelMultiplier(buildings, 'wood');
    y[2] *= channelMultiplier(buildings, 'stone');
    const landFood = y[0];
    const yieldIn: Yield = [y[0] + num(p.importedFood), y[1] + num(p.importedGoods), y[2]];

    // Food sink.
    const food = runFoodDay(meters, yieldIn[0], cap);
    if (food.growth !== 0) {
      trace(mute || !spotlight.has(id), {
        tick, category: 'settlement_growth', agentId: id,
        summary: `${node.name}: ${food.growth > 0 ? 'gains' : 'loses'} a person (${food.meters.population})`,
        locationId: id, delta: food.growth, population: food.meters.population,
        cause: food.growth > 0 ? 'surplus' : 'starvation',
      });
    }
    const population = food.meters.population;

    // Build sink: upkeep first; short upkeep idles the costliest building.
    const special = cache?.special?.get(id) ?? specialGoodsInReach(node, index, hexRealmId, realmHolder);
    cache?.special?.set(id, special);
    const upkeep = population * WOOD_PER_PERSON + upkeepOf(buildings);
    let bp = yieldIn[1] + yieldIn[2] - upkeep;
    let victim: BuildingInstance | undefined;
    if (bp < 0) {
      victim = [...buildings].sort((a, b) => b.def.upkeep - a.def.upkeep)[0];
      bp = 0;
    }
    for (const b of buildings) {
      const inputLost = b.def.needs?.special !== undefined && !special.has(b.def.needs.special);
      const reason: IdleReason | null = inputLost ? 'input_lost' : b === victim ? 'upkeep_short' : null;
      const bp_ = b.node.properties;
      if (!reason) {
        bp_.idleDays = 0;
        delete bp_.idleReason;
        continue;
      }
      const wasIdle = isIdle(b);
      bp_.idleDays = num(bp_.idleDays) + 1;
      bp_.idleReason = reason;
      if (!wasIdle) {
        trace(mute, {
          tick, category: 'settlement_building_idle', agentId: id,
          summary: `${node.name}: ${b.def.id} idles (${reason})`,
          locationId: id, buildingId: b.def.id, placeId: b.node.id, reason,
        });
      }
    }
    for (const b of [...buildings]) {
      if (num(b.node.properties.idleDays) < IDLE_DAYS_TO_LOSE) continue;
      const reason = b.node.properties.idleReason as IdleReason | undefined;
      const removed = loseBuilding(graph, id, b, tick);
      if (removed && runtime) applyEncounterCacheUpdate(runtime, cache => cache.onSublocationDestroyed(b.node.id, id, graph));
      structureChanged = true;
      trace(mute, {
        tick, category: 'settlement_building_lost', agentId: id,
        summary: `${node.name}: ${b.def.id} lost after ${IDLE_DAYS_TO_LOSE} idle days`,
        locationId: id, buildingId: b.def.id, placeId: b.node.id, ...(reason ? { reason } : {}),
      });
      chron('building_lost', node, { goodsType: b.def.cardName.toLowerCase() }, `lost:${b.def.id}:${tick}`);
      if (!mute) p.economyLastLost = { buildingId: b.def.id, tick };
    }
    buildings = readBuildings(graph, id);

    let buildProgress = num(p.buildProgress);
    let goodsSurplusDays = num(p.goodsSurplusDays);
    let exportGoods = 0;
    // The slots follow the tier the settlement is held at, hysteresis included (review gate).
    const tierNow = targetTierOf({ population, realmSeat, pulls }, p.targetTier as string | undefined);
    if (buildings.length < BUILDING_SLOTS[tierNow]) {
      buildProgress += bp;
      const rng = mulberry32(hashString(`${seed}:settlement_economy:${id}:${tick}`));
      const choice = chooseBuilding({
        yieldIn,
        landYield: y,
        fieldHexes: hexes.filter(h => FIELD_TERRAINS.has(h.terrain)).length,
        fishingHexes: hexes.filter(h => FISHING_TERRAINS.has(h.terrain)).length,
        grazingHexes: hexes.filter(h => GRAZING_TERRAINS.has(h.terrain)).length,
        special,
        routes: routes.filter(r => r.source === id || r.target === id).length,
        population,
        cap,
        isSeat,
        lean: leanBuildingOf(graph, holder ?? seats.seatedAt.get(id)?.[0]),
        owned: buildings,
      }, rng);
      if (choice && buildProgress >= choice.def.cost) {
        const raised = raiseBuilding(graph, node, choice.def, tick);
        if (raised) {
          buildProgress -= choice.def.cost;
          structureChanged = true;
          if (!raised.adopted && runtime) {
            applyEncounterCacheUpdate(runtime, cache => cache.onSublocationCreated(graph, raised.placeId, id));
          }
          trace(mute, {
            tick, category: 'settlement_building_raised', agentId: id,
            summary: `${node.name}: raises ${choice.def.id} (score ${choice.score.toFixed(2)}${choice.runnerUp ? `, over ${choice.runnerUp}` : ''})`,
            locationId: id, buildingId: choice.def.id, placeId: raised.placeId,
            score: choice.score, ...(choice.runnerUp ? { runnerUp: choice.runnerUp } : {}),
            ...(raised.adopted ? { reason: 'adopted' } : {}),
          });
          chron('building_raised', node, { goodsType: choice.def.cardName.toLowerCase() }, `raised:${choice.def.id}`, choice.def.raisedTitle);
          buildings = readBuildings(graph, id);
        }
      }
      goodsSurplusDays = 0;
    } else {
      goodsSurplusDays = bp > SURPLUS_MIN_PER_DAY ? goodsSurplusDays + 1 : 0;
      // Only the land's own spare timber and stone is sold on; imports are built with, never
      // re-exported, so goods cannot circulate between seats (review gate).
      exportGoods = Math.min(bp, Math.max(0, y[1] + y[2] - upkeep));
    }

    return {
      node, id, hexes, holder, isSeat, realmSeat, held,
      meters: food.meters,
      buildProgress,
      goodsSurplusDays,
      buildings,
      cap,
      pullCount,
      pulls,
      workedHexes: worked.length,
      workedList: worked.map(w => ({ key: w.h.key, food: +w.y[0].toFixed(2), wood: +w.y[1].toFixed(2), stone: +w.y[2].toFixed(2) })),
      landFood,
      yieldIn,
      need: food.need,
      upkeep,
      // Only the land's own surplus food leaves: imported food is eaten or grown on, never
      // passed on, so two seats cannot pass a growing stockpile back and forth (review gate).
      exportFood: Math.min(food.exportableFood, Math.max(0, landFood - food.need)),
      exportGoods,
      goodsOutput: sumEffect(buildings, 'goods'),
      nextImportFood: 0,
      nextImportGoods: 0,
      starvedBefore,
    };
  }

  // ── 2. Seats draw a share of their holdings' surplus ─────────────────
  for (const rec of records.values()) {
    if (!rec.holder) continue;
    const seatId = seats.seatOf.get(rec.holder);
    if (!seatId || seatId === rec.id) continue;
    const seat = records.get(seatId);
    if (!seat) continue;
    const f = rec.exportFood * SEAT_DRAW;
    const g = rec.exportGoods * SEAT_DRAW;
    rec.exportFood -= f;
    rec.exportGoods -= g;
    seat.nextImportFood += f;
    seat.nextImportGoods += g;
  }

  // ── 3. Surplus routes: born from a lasting surplus, carry, end ───────
  const outgoing = new Map<string, GraphEdge[]>();
  for (const r of routes) {
    const list = outgoing.get(r.source) ?? [];
    list.push(r);
    outgoing.set(r.source, list);
  }
  const ownSeatOf = (rec: SettlementDay): string | undefined => (rec.holder ? seats.seatOf.get(rec.holder) : undefined);
  const pickBuyer = (rec: SettlementDay, good: SurplusGood, exclude: ReadonlySet<string>): { id: string; ownSeat: boolean } | null => {
    const from = hexOf(rec.node);
    if (!from) return null;
    const ownSeat = ownSeatOf(rec);
    const candidates: { rec: SettlementDay; d: number; own: boolean }[] = [];
    for (const o of records.values()) {
      if (o.id === rec.id || exclude.has(o.id)) continue;
      const at = hexOf(o.node);
      if (!at) continue;
      const d = hexDistance(from, at);
      if (d > SURPLUS_ROUTE_RANGE) continue;
      const wants = good === 'food'
        ? o.isSeat || o.meters.foodStore < o.meters.population * FOOD_PER_PERSON
        : o.isSeat || o.buildings.some(b => b.def.id === 'market' && !isIdle(b));
      if (wants) candidates.push({ rec: o, d, own: o.id === ownSeat });
    }
    if (candidates.length === 0) return null;
    const own = candidates.filter(c => c.own);
    const pool = own.length > 0 ? own : candidates;
    pool.sort((a, b) => a.d - b.d || (a.rec.id < b.rec.id ? -1 : 1));
    return { id: pool[0].rec.id, ownSeat: pool[0].own };
  };

  for (const rec of records.values()) {
    try {
      const mine = outgoing.get(rec.id) ?? [];
      for (const good of ['food', 'goods'] as const) {
        const amount = good === 'food' ? rec.exportFood : rec.exportGoods + rec.goodsOutput;
        const days = good === 'food'
          ? rec.meters.foodSurplusDays
          : rec.goodsSurplusDays + (rec.goodsOutput > 0 ? ROUTE_PERSIST_DAYS : 0);
        let route = mine.find(r => routeCarries(r) === good && graph.getEdge(r.id));
        if (!route && amount > SURPLUS_MIN_PER_DAY && days >= ROUTE_PERSIST_DAYS) {
          const cap = 1 + sumEffect(rec.buildings, 'routeCap');
          if (mine.filter(r => graph.getEdge(r.id)).length < cap) {
            const exclude = new Set(mine.map(r => r.target));
            for (let attempt = 0; attempt < 3 && !route; attempt++) {
              const buyer = pickBuyer(rec, good, exclude);
              if (!buyer) break;
              const edge = openSurplusRoute(graph, rec.id, buyer.id, good, tick);
              if (!edge) { exclude.add(buyer.id); continue; }
              route = edge;
              mine.push(edge);
              structureChanged = true;
              const buyerNode = graph.getNode(buyer.id);
              trace(mute, {
                tick, category: 'surplus_route_born', agentId: rec.id,
                summary: `${rec.node.name} → ${buyerNode?.name ?? buyer.id}: a surplus route carrying ${good}`,
                fromId: rec.id, toId: buyer.id, carries: good, carriedPerDay: amount,
                reason: buyer.ownSeat ? 'own_seat' : 'nearest_buyer',
              });
              if (buyerNode?.name) {
                const lines = SURPLUS_ROUTE_BORN_LINES[good];
                const line = lines[(hashString(edge.id) >>> 0) % lines.length]
                  .replace(/\{settlement\}/g, rec.node.name)
                  .replace(/\{target\}/g, buyerNode.name);
                chron('surplus_route_born', rec.node, { flavor: line, target: buyerNode.name, targetId: buyer.id }, `route:${edge.id}`, SURPLUS_ROUTE_BORN_TITLES[good]);
              }
            }
          }
        }
        if (!route) continue;
        const buyer = records.get(route.target);
        const blockaded = isRouteBlockaded(graph, route, tick);
        let ended: 'surplus_ended' | 'blockaded' | null = null;
        if (!graph.getNode(route.target)) {
          ended = 'surplus_ended';
        } else if (!blockaded && amount > SURPLUS_MIN_PER_DAY) {
          markCarried(route, amount, tick);
          if (good === 'food') {
            rec.exportFood = 0;
            if (buyer) buyer.nextImportFood += amount;
          } else {
            rec.exportGoods = 0;
            if (buyer) buyer.nextImportGoods += amount * GOODS_IMPORT_FACTOR;
          }
        } else if (markDry(route) >= ROUTE_DIE_DAYS) {
          ended = blockaded ? 'blockaded' : 'surplus_ended';
        }
        if (ended) {
          graph.removeEdge(route.id);
          structureChanged = true;
          trace(mute, {
            tick, category: 'surplus_route_ended', agentId: rec.id,
            summary: `${rec.node.name} → ${graph.getNode(route.target)?.name ?? route.target}: surplus route ended (${ended})`,
            fromId: rec.id, toId: route.target, carries: good, carriedPerDay: 0, reason: ended,
          });
          chron('surplus_route_ended', rec.node, {}, `ended:${route.id}`);
        }
      }
    } catch (err) {
      if (!mute) console.warn(`[settlement_economy] ${rec.id}: a step failed this day`, err);
    }
  }

  // ── 4. Balances, happiness, tier — and write it all down ─────────────
  const liveRoutes = readSurplusRoutes(graph);
  const touching = new Map<string, number>();
  const incomingNow = new Map<string, number>();
  for (const r of liveRoutes) {
    touching.set(r.source, (touching.get(r.source) ?? 0) + 1);
    touching.set(r.target, (touching.get(r.target) ?? 0) + 1);
    incomingNow.set(r.target, (incomingNow.get(r.target) ?? 0) + 1);
  }
  let anyChange = false;
  for (const rec of records.values()) {
    try {
      const node = rec.node;
      const p = node.properties;
      const m = rec.meters;
      const incoming = incomingNow.get(rec.id) ?? 0;
      const pulls = seatPulls(rec.isSeat, rec.held, incoming, SEAT_MIN_INCOMING);
      const targetTier = targetTierOf({ population: m.population, realmSeat: rec.realmSeat, pulls }, p.targetTier as string | undefined);

      const routesHere = touching.get(rec.id) ?? 0;
      const starving = m.starveDays > 0;
      const crowding = Math.floor(m.population / CROWDING_PER_UNHAPPY);
      const happinessNoHunger = sumEffect(rec.buildings, 'happy') + (routesHere > 0 ? ROUTE_HAPPY : 0) - crowding;
      const happiness = happinessNoHunger + (starving ? HUNGER_UNHAPPY : 0);
      // Hunger is its own unrest input (THR-1934), so contentment leaves it out.
      const contentment = clamp(-UNREST_FROM_HAPPINESS * happinessNoHunger, -UNREST_HAPPINESS_MAX, UNREST_HAPPINESS_MAX);
      if (p.economyHappiness !== happiness) {
        trace(mute || !spotlight.has(rec.id), {
          tick, category: 'settlement_happiness', agentId: rec.id,
          summary: `${node.name}: happiness ${happiness} (contentment ${contentment})`,
          locationId: rec.id, happiness, unrestTarget: contentment,
        });
      }

      const foodBalance = clamp((rec.yieldIn[0] - rec.need) / Math.max(rec.need, 1), -1, 1);
      const buildBalance = clamp((rec.yieldIn[1] + rec.yieldIn[2] - rec.upkeep) / Math.max(rec.upkeep, 1), -1, 1);

      // A court that left: a realm's seat moved away, or the seated faction lost every
      // settlement it held. Surplus roads coming and going are not a court leaving, so they
      // never tell this line (review gate). The muted settling run stamps nothing.
      const hadCourt = p.economyRealmSeat === true || p.economyHeldCourt === true;
      const hasCourt = rec.realmSeat || (rec.isSeat && rec.held > 0);
      if (!mute && hadCourt && !hasCourt && tierRank(targetTier) < tierRank(p.locationSubtype as string)) {
        chron('seat_lost_shrinking', node, {}, `seat:${tick}`);
        p.economySeatLostTick = tick;
      }
      p.economyHeldCourt = rec.isSeat && rec.held > 0;
      // Once per famine: losing a person resets starveDays, so the cooldown, not the counter, gates the line.
      const toldAt = typeof p.economyStarvingToldTick === 'number' ? p.economyStarvingToldTick : -Infinity;
      if (!mute && starving && !rec.starvedBefore && tick - toldAt >= STARVING_CHRONICLE_COOLDOWN_DAYS * TICKS_PER_DAY) {
        chron('settlement_starving', node, {}, `starve:${tick}`, starvingTitle(node.name));
        p.economyStarvingToldTick = tick;
      }

      if (p.targetTier !== targetTier || p.population !== m.population) anyChange = true;
      Object.assign(p, {
        population: m.population,
        foodStore: m.foodStore,
        growthProgress: m.growthProgress,
        starveDays: m.starveDays,
        foodSurplusDays: m.foodSurplusDays,
        goodsSurplusDays: rec.goodsSurplusDays,
        buildProgress: rec.buildProgress,
        importedFood: rec.nextImportFood,
        importedGoods: rec.nextImportGoods,
        foodBalance,
        buildBalance,
        // Prosperity's reader is kept (plan § Substrate): food weighs twice what timber and stone do.
        resourceBalance: clamp((2 * foodBalance + buildBalance) / 3, -1, 1),
        // The stock-tier pass lays an embargo cut on top of this base each tick (THR-1955).
        economyResourceBalance: clamp((2 * foodBalance + buildBalance) / 3, -1, 1),
        targetTier,
        populationCap: rec.cap,
        pullCount: pullCountOf(rec.held, incoming),
        economyPulls: pulls,
        economyRealmSeat: rec.realmSeat,
        workedHexes: rec.workedHexes,
        workedHexList: rec.workedList,
        landFood: rec.landFood,
        foodNeed: rec.need,
        exportFood: rec.exportFood,
        exportGoods: rec.exportGoods + rec.goodsOutput,
        economyHappiness: happiness,
        economyContentment: contentment,
        economyLastDay: tick,
      });

      if (spotlight.has(rec.id)) {
        trace(mute, {
          tick, category: 'settlement_economy_day', agentId: rec.id,
          summary: `${node.name}: ${m.population}/${rec.cap} people, food ${foodBalance.toFixed(2)}, build ${buildBalance.toFixed(2)} → ${targetTier}`,
          locationId: rec.id, population: m.population, cap: rec.cap, workedHexes: rec.workedHexes,
          foodYield: rec.yieldIn[0], foodNeed: rec.need, foodBalance,
          buildYield: rec.yieldIn[1] + rec.yieldIn[2], upkeep: rec.upkeep, buildBalance,
          importedFood: rec.nextImportFood, importedGoods: rec.nextImportGoods, pullCount: pullCountOf(rec.held, incoming),
        });
      }
    } catch (err) {
      if (!mute) console.warn(`[settlement_economy] ${rec.id}: a step failed this day`, err);
    }
  }

  if (runtime) {
    if (structureChanged) touchStructure(runtime);
    else if (anyChange) touchWorld(runtime);
  }
  return { events, chronicle, structureChanged, settlements: records.size };
}

// ─── Worldgen settling run ────────────────────────────────────────────────

export interface SettlingRunResult {
  readonly days: number;
  readonly ms: number;
  readonly settlements: number;
}

/**
 * Run the economy `days` times before tick 0 so each settlement starts at what its land
 * and its holder can hold. Muted (no traces, no chronicle). Days run at negative ticks;
 * the surplus routes it leaves are re-stamped to tick 0 so they read as fresh at start.
 */
export function runSettlingRun(
  graph: WorldGraph,
  tiles: readonly HexTile[],
  seed: number,
  days: number = SETTLEMENT_SETTLING_DAYS,
): SettlingRunResult {
  const started = Date.now();
  if (!SETTLEMENT_ECONOMY_ENABLED || days <= 0) return { days: 0, ms: 0, settlements: 0 };
  let hexRealmId: ReadonlyMap<string, string> = new Map();
  try {
    hexRealmId = buildRealmProjection(graph, tiles as HexTile[]).hexRealmId;
  } catch { /* NFP #4: no realm map — nearest-settlement ownership */ }
  let settlements = 0;
  // Nothing the land, holders or seats depend on moves while the settling run runs.
  const landCache: SettlingLandCache = {};
  for (let d = 0; d < days; d++) {
    const tick = -(days - d) * TICKS_PER_DAY;
    settlements = runSettlementEconomyDay({ graph, tiles, tick, seed, hexRealmId, mute: true, landCache }).settlements;
  }
  for (const r of readSurplusRoutes(graph)) {
    r.properties.lastTraded = 0;
    r.properties.establishedTick = 0;
  }
  return { days, ms: Date.now() - started, settlements };
}

// ─── Phase descriptor ─────────────────────────────────────────────────────

export function phaseSettlementEconomy(state: GameState, ctx: PhaseContext): PhaseResult {
  if (!SETTLEMENT_ECONOMY_ENABLED) return {};
  if (state.tick % TICKS_PER_DAY !== SETTLEMENT_ECONOMY_TICK_OFFSET) return {};
  const tiles = state.tiles ?? [];
  const result = runSettlementEconomyDay({
    graph: state.graph,
    tiles,
    tick: state.tick,
    seed: state.seed,
    hexRealmId: realmBorderMap(ctx.runtime, state.graph, tiles, state.tick),
    runtime: ctx.runtime,
    alwaysSpotlight: threadedHomeIds(state),
  });
  recordDiversity(state, ctx);
  const delta: PhaseResult = {};
  if (result.events.length > 0) delta.tickEvents = [...state.tickEvents, ...result.events];
  if (result.chronicle.length > 0) delta.chronicleEntries = [...state.chronicleEntries, ...result.chronicle];
  return delta;
}

/** Days on which a diversity snapshot is kept: day 1, then every this many days. */
const DIVERSITY_SNAPSHOT_EVERY_DAYS = 25;
/** Snapshots kept per session (a long session keeps its first and its most recent). */
const DIVERSITY_SNAPSHOT_MAX = 40;

function recordDiversity(state: GameState, ctx: PhaseContext): void {
  if (!ctx.runtime) return;
  const day = Math.floor(state.tick / TICKS_PER_DAY);
  if (day !== 1 && day % DIVERSITY_SNAPSHOT_EVERY_DAYS !== 0) return;
  try {
    const history = ctx.runtime.settlementDiversityHistory ?? [];
    if (history.some(h => h.day === day)) return;
    history.push(measureDiversity(state.graph, day));
    if (history.length > DIVERSITY_SNAPSHOT_MAX) history.splice(1, history.length - DIVERSITY_SNAPSHOT_MAX);
    ctx.runtime.settlementDiversityHistory = history;
  } catch { /* NFP #4: a measure is never worth a tick */ }
}

export const settlementEconomyPhase: EnginePhase = {
  id: 'settlement_economy',
  slot: 'pre-economy',
  label: 'Settlement Economy',
  beforePhase: ['resource_stock_tiers'],
  run: (state, ctx) => phaseSettlementEconomy(state, ctx),
};
