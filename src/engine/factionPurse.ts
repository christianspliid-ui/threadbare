/**
 * The faction purse — the daily `faction_purse` phase (THR-1931).
 *
 * Plan: `Docs/plans/2026-10-15-thr-1931-faction-purse.md`. Decision: THR-1867.
 *
 * Every faction gets a purse the land fills and war empties. Once a day, right after
 * `holding_income` (which keeps paying mortals only), each purse faction in id order:
 *
 *   1. earns its five sources (`factionPurse/income.ts`),
 *   2. pays each army's upkeep in army id order, while the purse covers it — no debt,
 *   3. stamps `armyState.paidThroughTick` on every army it paid,
 *   4. writes `meansBand` (the one word the sheet and the crown read), and
 *   5. replaces `purseLastDay` with the day's `PurseDay`.
 *
 * An army the purse could not pay keeps its old `paidThroughTick`, and
 * `checkUnderfunded` (`armyAttrition.ts`) reads that: unpaid armies lose cohesion and,
 * at 0, desert through the existing disband path.
 *
 * NFP: Tunability — every number in `data/faction-purse-constants.ts`. Inspectability —
 * `economy.purse.*` traces, `purseLastDay` on the node, the Economy debug tab, the
 * `__DEBUG.getFactionPurse` accessor. Determinism — no PRNG in the economy; factions,
 * places and armies in id order (the chronicle's variant pick is seeded per faction).
 * Fail-soft — one faction's throw skips that faction for the day; a missing projection
 * pays no land rent.
 */

import { sweepExpiredHoldingBlessings } from './godsStake';
import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { ArmyState } from '../types/army';
import type { ChronicleEntry } from '../types/narrative';
import type { PurseDayTrace, PurseBandChangeTrace } from '../types/trace';
import type { WorldGraph } from './graph';
import type { RealmProjection } from './realmProjection';
import type { EconomicChronicleTrigger } from '../data/economic-chronicle-content';
import { buildRealmProjection } from './realmProjection';
import { emitTrace } from './traceBuffer';
import { readWealth, applyTreasuryDelta } from './wealth';
import { resolveEconomicChronicle, chronicleSeed } from './economicChronicle';
import {
  computePurseIncome,
  isPurseFaction,
  totalIncome,
  type PurseIncome,
  type PurseSource,
  type PurseSourceKind,
} from './factionPurse/income';
import { armiesOf, settleUpkeep, upkeepPerDayOf } from './factionPurse/upkeep';
import { meansBand, meansRank, daysInHand, isMeansBand } from './factionPurse/means';
import {
  FACTION_PURSE_ENABLED,
  PURSE_CYCLE_TICKS,
  FACTION_STARTING_PURSE,
  FACTION_STARTING_UPKEEP_DAYS,
  PURSE_CHRONICLE_COOLDOWN_DAYS,
  type MeansBand,
} from '../data/faction-purse-constants';

// ─── Shapes ───────────────────────────────────────────────────────────────

/** One faction's pay day, kept on the node as `purseLastDay`. Replaced daily; nothing accumulates. */
export interface PurseDay {
  tick: number;
  income: PurseIncome;
  /** The two largest sources, by amount. */
  topSources: { kind: PurseSourceKind; nodeId: string }[];
  /** The tax holder this faction paid the largest guild cut to, for "A share goes to …". */
  paysTo: string | null;
  upkeepOwed: number;
  upkeepPaid: number;
  armiesPaid: string[];
  armiesUnpaid: string[];
  /** First day Means went Destitute; null when not Destitute. */
  brokeSinceTick: number | null;
  /** Settlements whose town tax this faction collected (the sheet's "pays tax" clause). */
  taxHolderOf: string[];
  /** Towns and places that paid this faction today (tax, yield, or a guild's cut). */
  paidBy: string[];
  /**
   * THR-1932 — fealty paid to this faction's liege today, written by the `crown` phase
   * after the pay day. Absent before the crown runs (reads as 0).
   */
  fealtyOut?: number;
  /** THR-1932 — fealty taken in from this faction's vassals today. Absent reads as 0. */
  fealtyIn?: number;
  /** THR-1932 — the liege this faction paid fealty to today, for the sheet's sentence. */
  fealtyTo?: string | null;
}

/** A desertion `checkUnderfunded`'s disband left for the next pay day's chronicle. */
export interface PendingDesertion {
  armyName: string;
  tick: number;
}

/** Node property names — one spelling, read by the sheet, the bridge and the schism term. */
export const PURSE_LAST_DAY_PROP = 'purseLastDay';
export const MEANS_BAND_PROP = 'meansBand';
export const PURSE_DESERTIONS_PROP = 'purseDesertions';
const PURSE_CHRONICLED_PROP = 'purseChronicledTick';
/** Set when the purse goes broke; cleared by the recovery line's crossing. */
const PURSE_BROKE_LATCH_PROP = 'purseWasBroke';

export interface FactionPurseResult {
  days: Map<string, PurseDay>;
  chronicleEntries: ChronicleEntry[];
}

/** A thunk for the realm projection — the cached one in a session, a fresh build in tests. */
export type RealmProjectionSource = () => RealmProjection;

// ─── Readers (the sheet, the bridge, schism) ──────────────────────────────

export function readPurseDay(node: GraphNode | undefined | null): PurseDay | null {
  const v = node?.properties[PURSE_LAST_DAY_PROP];
  return v && typeof v === 'object' && typeof (v as PurseDay).tick === 'number' ? (v as PurseDay) : null;
}

export function readMeansBand(node: GraphNode | undefined | null): MeansBand | null {
  const v = node?.properties[MEANS_BAND_PROP];
  return isMeansBand(v) ? v : null;
}

/** Every faction node, in id order. */
function factionNodes(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('actor')
    .filter(isPurseFaction)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function projectionContext(graph: WorldGraph, tiles: GameState['tiles'], getProjection?: RealmProjectionSource) {
  const tileTerrain = new Map<string, string>();
  for (const t of tiles ?? []) tileTerrain.set(`${t.coord.col},${t.coord.row}`, t.terrain);
  let projection: RealmProjection | null = null;
  try {
    projection = getProjection ? getProjection() : buildRealmProjection(graph, tiles ?? []);
  } catch (err) {
    console.warn('[faction_purse] realm projection unavailable; no land rent today', err);
  }
  const realmHexes = new Map<string, readonly { col: number; row: number }[]>();
  for (const r of projection?.realms ?? []) realmHexes.set(r.id, r.hexes);
  return { hexRealmId: projection?.hexRealmId ?? new Map<string, string>(), realmHexes, tileTerrain };
}

function topTwo(sources: readonly PurseSource[]): { kind: PurseSourceKind; nodeId: string }[] {
  return [...sources]
    .sort((a, b) => b.amount - a.amount || (a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0))
    .slice(0, 2)
    .map(s => ({ kind: s.kind, nodeId: s.nodeId }));
}

// ─── Attention gate (chronicle only) ──────────────────────────────────────

/**
 * Whether a faction is inside the player's attention: a threaded mortal is a member, or
 * the faction controls a place on the god's held ground (its `controls` targets and seat).
 * Outside it the purse stays silent, so equilibrium never fills the chronicle.
 */
export function isFactionInAttention(state: GameState, factionId: string): boolean {
  const graph = state.graph;
  const asc = state.ascendantId;
  if (!asc) return false;
  for (const m of graph.getIncomingEdges(factionId, 'member_of')) {
    if (graph.getIncomingEdges(m.source, 'thread').some(e => e.source === asc)) return true;
  }
  const held = new Set<string>(graph.getOutgoingEdges(asc, 'controls').map(e => e.target));
  const seat = graph.getNode(asc)?.properties.homeSeatLocationId;
  if (typeof seat === 'string') held.add(seat);
  if (held.size === 0) return false;
  for (const e of graph.getOutgoingEdges(factionId, 'controls')) {
    if (held.has(e.target)) return true;
    const parent = graph.getNode(e.target)?.properties.parentLocationId;
    if (typeof parent === 'string' && held.has(parent)) return true;
  }
  return false;
}

// ─── The pay day ──────────────────────────────────────────────────────────

/**
 * Run one pay day. No-op off the daily boundary or with the purse switched off.
 * Mutates faction and army nodes in place (the graph is mutated in place everywhere).
 */
export function runFactionPurse(state: GameState, getProjection?: RealmProjectionSource): FactionPurseResult {
  const days = new Map<string, PurseDay>();
  const chronicleEntries: ChronicleEntry[] = [];
  const tick = state.tick;
  if (!FACTION_PURSE_ENABLED || tick <= 0 || tick % PURSE_CYCLE_TICKS !== 0) return { days, chronicleEntries };

  const graph = state.graph;
  const factions = factionNodes(graph);
  // THR-1969 — a holding blessing past its year is removed before the day is paid.
  sweepExpiredHoldingBlessings(graph, tick);
  const ctx = { ...projectionContext(graph, state.tiles, getProjection), tick };
  const incomes = computePurseIncome(graph, factions, ctx);

  for (const faction of factions) {
    try {
      const day = incomes.get(faction.id);
      if (!day) continue;
      const wealthBefore = readWealth(faction.properties);
      const earned = totalIncome(day.income);
      const afterIncome = applyTreasuryDelta(wealthBefore, earned);
      const armies = armiesOf(graph, faction.id);
      const settlement = settleUpkeep(afterIncome, armies);
      const wealthAfter = applyTreasuryDelta(settlement.wealthAfter, 0);

      // Stamp the armies paid today; an unpaid army keeps its old value.
      for (const armyId of settlement.paid) {
        const armyNode = graph.getNode(armyId);
        const as = armyNode?.properties.armyState as ArmyState | undefined;
        if (armyNode && as) armyNode.properties.armyState = { ...as, paidThroughTick: tick };
      }

      const upkeepPerDay = armies.reduce((s, a) => s + a.upkeep, 0);
      const anyUnpaid = settlement.unpaid.length > 0;
      const band = meansBand(wealthAfter, upkeepPerDay, anyUnpaid);
      const prevBand = readMeansBand(faction);
      const prevDay = readPurseDay(faction);
      const brokeSinceTick = band === 'Destitute'
        ? (prevBand === 'Destitute' && prevDay?.brokeSinceTick != null ? prevDay.brokeSinceTick : tick)
        : null;

      let paysTo: string | null = null;
      let largestCut = 0;
      for (const [holder, amount] of [...day.guildTaxPaidTo].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
        if (amount > largestCut) { largestCut = amount; paysTo = holder; }
      }

      const purseDay: PurseDay = {
        tick,
        income: day.income,
        topSources: topTwo(day.sources),
        paysTo,
        upkeepOwed: settlement.upkeepOwed,
        upkeepPaid: settlement.upkeepPaid,
        armiesPaid: settlement.paid,
        armiesUnpaid: settlement.unpaid,
        brokeSinceTick,
        taxHolderOf: day.taxHolderOf,
        paidBy: day.sources.filter(src => src.kind === 'town' || src.kind === 'place').map(src => src.nodeId).sort(),
      };
      faction.properties.wealth = wealthAfter;
      faction.properties[MEANS_BAND_PROP] = band;
      faction.properties[PURSE_LAST_DAY_PROP] = purseDay;
      days.set(faction.id, purseDay);

      emitTrace({
        category: 'economy.purse.day',
        tick,
        factionId: faction.id,
        wealthBefore,
        wealthAfter,
        income: { ...day.income },
        upkeepOwed: settlement.upkeepOwed,
        upkeepPaid: settlement.upkeepPaid,
        armiesUnpaid: settlement.unpaid,
        taxHolderOf: day.taxHolderOf,
        summary: `${faction.name ?? faction.id} purse ${wealthBefore.toFixed(1)}→${wealthAfter.toFixed(1)} (+${earned.toFixed(2)} −${settlement.upkeepPaid.toFixed(2)}) ${band}`
          + (anyUnpaid ? ` · ${settlement.unpaid.length} army unpaid` : ''),
      } as PurseDayTrace);

      if (prevBand !== band) {
        emitTrace({
          category: 'economy.purse.band_change',
          tick,
          factionId: faction.id,
          from: prevBand ?? 'none',
          to: band,
          days: daysInHand(wealthAfter, upkeepPerDay),
          summary: `${faction.name ?? faction.id} Means ${prevBand ?? 'none'} → ${band}`,
        } as PurseBandChangeTrace);
      }

      const prevAnyUnpaid = (prevDay?.armiesUnpaid.length ?? 0) > 0;
      const entry = purseChronicle(state, faction, prevBand, band, armies.length > 0, anyUnpaid, prevAnyUnpaid);
      if (entry) chronicleEntries.push(entry);
    } catch (err) {
      // Fail-soft: this faction's day is skipped; the rest settle (NFP #4).
      console.warn(`[faction_purse] ${faction.id} skipped this pay day`, err);
    }
  }

  return { days, chronicleEntries };
}

/** The phase patch: chronicle lines only — every other write lands on the graph. */
export function phaseFactionPurse(state: GameState, getProjection?: RealmProjectionSource): Partial<GameState> {
  const result = runFactionPurse(state, getProjection);
  return result.chronicleEntries.length > 0
    ? { chronicleEntries: [...state.chronicleEntries, ...result.chronicleEntries] }
    : {};
}

// ─── Chronicle ────────────────────────────────────────────────────────────

/**
 * At most one line per faction per pay day: a desertion first, then going broke, then a
 * recovery. A desertion is always told (it is its own event); the broke and recovery
 * lines share a cooldown.
 *
 * The crossings are read off pay, not off band neighbours, because the band moves one
 * word at a time: a purse that runs down is already Destitute (under a day in hand) the
 * day before an army goes unpaid, and a recovering one passes through Getting by.
 * - **broke** — with armies: the first pay day an army goes unpaid after a day when all
 *   were paid. Without: the band crosses into Destitute. Once per spell of being broke
 *   (a latch), so a purse limping between paying and not is one story.
 * - **recovered** — the latch, cleared the first pay day every army is paid and the band
 *   stands at Comfortable or better.
 * A broke crossing the cooldown silences is **not** latched, so no recovery is told
 * without the fall before it. Outside the player's attention the latch still moves, so a
 * faction that drifts into view mid-recovery is told the truth; inside the cooldown a
 * recovery keeps its latch and is told when the cooldown ends.
 */
function purseChronicle(
  state: GameState,
  faction: GraphNode,
  prevBand: MeansBand | null,
  band: MeansBand,
  fieldsArmy: boolean,
  anyUnpaid: boolean,
  prevAnyUnpaid: boolean,
): ChronicleEntry | null {
  const pending = (faction.properties[PURSE_DESERTIONS_PROP] as PendingDesertion[] | undefined) ?? [];
  if (pending.length > 0) delete faction.properties[PURSE_DESERTIONS_PROP];

  const inAttention = isFactionInAttention(state, faction.id);
  const last = faction.properties[PURSE_CHRONICLED_PROP];
  const cooling = typeof last === 'number' && state.tick - last < PURSE_CHRONICLE_COOLDOWN_DAYS * PURSE_CYCLE_TICKS;

  const latched = faction.properties[PURSE_BROKE_LATCH_PROP] === true;
  const brokeCrossing = !latched && (fieldsArmy
    ? anyUnpaid && !prevAnyUnpaid
    : band === 'Destitute' && prevBand !== null && prevBand !== 'Destitute');
  if (brokeCrossing && !(inAttention && cooling)) faction.properties[PURSE_BROKE_LATCH_PROP] = true;
  const recovered = latched && !anyUnpaid && meansRank(band) >= meansRank('Comfortable');

  let trigger: EconomicChronicleTrigger | null = null;
  let target: string | undefined;
  if (inAttention) {
    if (pending.length > 0) {
      trigger = 'army_unpaid_desertion';
      target = pending[pending.length - 1].armyName;
    } else if (!cooling && brokeCrossing) {
      trigger = fieldsArmy ? 'purse_broke' : 'purse_broke_bare';
    } else if (!cooling && recovered) {
      trigger = 'purse_recovered';
    }
  }
  if (recovered && (!inAttention || trigger === 'purse_recovered')) delete faction.properties[PURSE_BROKE_LATCH_PROP];
  if (!trigger) return null;

  const entry = resolveEconomicChronicle(
    trigger,
    { actor: faction.name, actorId: faction.id, target },
    state.tick,
    chronicleSeed(state.seed, faction.id) + 1931,
  );
  if (!entry) return null;
  faction.properties[PURSE_CHRONICLED_PROP] = state.tick;
  return {
    id: entry.chronicleChapter.id,
    tier: 'chronicle',
    title: entry.chronicleChapter.title,
    prose: entry.chronicleChapter.prose,
    promptContext: {
      actors: entry.chronicleChapter.actorIds,
      location: faction.name ?? faction.id,
      sphere: 'matter',
      mood: 'economic',
    },
    tick: state.tick,
  };
}

/** `armyAttrition` calls this when an unpaid army deserts; the next pay day chronicles it. */
export function recordPurseDesertion(graph: WorldGraph, factionId: string, armyName: string, tick: number): void {
  const faction = graph.getNode(factionId);
  if (!faction) return;
  const list = (faction.properties[PURSE_DESERTIONS_PROP] as PendingDesertion[] | undefined) ?? [];
  faction.properties[PURSE_DESERTIONS_PROP] = [...list, { armyName, tick }];
}

// ─── Worldgen ─────────────────────────────────────────────────────────────

/**
 * The opening purse: `FACTION_STARTING_PURSE` + `FACTION_STARTING_UPKEEP_DAYS` × the upkeep
 * the faction fields, and every worldgen army paid through tick 0 — so no worldgen army
 * deserts on day one and every faction opens at least Comfortable. Writes `meansBand`
 * so the sheet reads a word before the first pay day.
 */
export function seedOpeningPurse(graph: WorldGraph): void {
  if (!FACTION_PURSE_ENABLED) return;
  for (const faction of factionNodes(graph)) {
    try {
      const upkeep = upkeepPerDayOf(graph, faction.id);
      const wealth = applyTreasuryDelta(readWealth(faction.properties), FACTION_STARTING_PURSE + FACTION_STARTING_UPKEEP_DAYS * upkeep);
      faction.properties.wealth = wealth;
      faction.properties[MEANS_BAND_PROP] = meansBand(wealth, upkeep, false);
      for (const a of armiesOf(graph, faction.id)) {
        const armyNode = graph.getNode(a.id);
        const as = armyNode?.properties.armyState as ArmyState | undefined;
        if (armyNode && as) armyNode.properties.armyState = { ...as, paidThroughTick: 0 };
      }
    } catch (err) {
      console.warn(`[faction_purse] opening purse failed for ${faction.id}`, err);
    }
  }
}
