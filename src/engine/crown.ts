/**
 * The crown — oaths of fealty and tax (THR-1932).
 *
 * Plan: `Docs/plans/2026-10-15-thr-1932-crown.md`. Decision: THR-1917 (Christian present:
 * force is allowed, one layer only).
 *
 * One directed edge, `sworn_to` (vassal → liege realm), carries every oath. This module
 * is its only writer:
 *
 * - `executeSeekFealty` — the `seek_fealty` faction action. A realm coerces a faction it
 *   besieged or just took a town from; else it persuades (protection and standing) or
 *   buys (a gift from its purse) the richest candidate that accepts; else the best
 *   candidate refuses and cools a little.
 * - `runCrownPhase` — the daily `crown` phase, right after `faction_purse`. Per oath, in
 *   edge-id order: loyalty moves (six reasons), an oath below Distrusted breaks (a grudge
 *   on `relates_to`, a cooldown, maybe a rebellion), then the fealty tax moves a share of
 *   the vassal's day income to the liege — after its own soldiers are paid, never into debt.
 *
 * The Crown itself is derived (`crown/crownView.ts`): a realm with CROWN_MIN_OATHS oaths.
 *
 * NFP: Tunability — `data/crown-constants.ts`. Inspectability — four traces
 * (`oath_sworn`, `oath_refused`, `oath_broken`, `rebellion`) with the full offer parts;
 * `lastLoyaltyDay` and `recentLosses` on the edge; `__DEBUG.getOaths` / `getCrown`.
 * Determinism — no PRNG (the action draw is the faction-action stream's); factions,
 * oaths and candidates in id order, ties by income then id. Fail-soft — one oath's throw
 * skips that oath today; the phase's caller wraps it again.
 */

import type { GameState } from '../types/gameState';
import type { GraphEdge, GraphNode } from '../types/graph';
import type { ChronicleEntry } from '../types/narrative';
import type { FactionActionRecord } from '../types/factionAction';
import type { OathSwornTrace, OathRefusedTrace, OathBrokenTrace, RebellionTrace, OathWagesTrace, OathRaiseFundedTrace } from '../types/trace';
import type { ArmyState } from '../types/army';
import { ARMY_CREATION_GOLD_COST } from '../types/army';
import { armyRefusal, keepsStandingArmy, selectCommander, spawnArmy, wouldRaiseSize } from './armySpawning';
import type { WorldGraph } from './graph';
import type { RealmProjection } from './realmProjection';
import type { EconomicChronicleTrigger } from '../data/economic-chronicle-content';
import type { BattleState } from '../types/battle';
import type { LoyaltyDelta, LoyaltyReason, OathKind, OfferParts, SwornToEdgeProperties } from './crown/types';
import { LOYALTY_REASON_ORDER } from './crown/types';
import { emitTrace } from './traceBuffer';
import { readWealth, applyTreasuryDelta } from './wealth';
import { resolveEconomicChronicle, chronicleSeed } from './economicChronicle';
import { isFactionInAttention, readPurseDay, PURSE_LAST_DAY_PROP } from './factionPurse';
import { buildCrownWorld, maySwear, mayCourt, onReswearCooldown, type CrownWorld } from './crown/eligibility';
import { offerScore, affordableGift, giftCost } from './crown/offer';
import { isRealmFaction, readOath, vassalsOf } from './crown/crownView';
import { crownWagesActive } from './crown/wages';
import { upkeepOf, upkeepPerDayOf } from './factionPurse/upkeep';
import { FACTION_PURSE_ENABLED, PURSE_CYCLE_TICKS } from '../data/faction-purse-constants';
import { OATH_SWORN_LINES, OATH_BROKEN_LINES } from '../data/crown-chronicle-content';
import {
  CROWN_ENABLED,
  CROWN_MIN_OATHS,
  FEALTY_TAX_SHARE,
  OATH_ACCEPT_THRESHOLD,
  OATH_COERCE_MIN_SIEGE_TICKS,
  LOYALTY_ROUND_DECIMALS,
  OATH_COERCE_WINDOW_DAYS,
  OATH_RIVAL_MARGIN,
  LOYALTY_START,
  LOYALTY_RISE_WEALTHY,
  LOYALTY_FALL_STRAINED,
  LOYALTY_FALL_DESTITUTE,
  LOYALTY_FAIL_DEFENCE,
  LOYALTY_FALL_OUTGROWN,
  LOYALTY_FALL_RIVAL_OFFER,
  OATH_BREAK_THRESHOLD,
  REBELLION_INCOME_RATIO,
  OATH_BREAK_SENTIMENT_DELTA,
  OATH_REFUSAL_SENTIMENT_DELTA,
  OATH_REFUSAL_SENTIMENT_FLOOR,
  OATH_BREAK_REASON_WINDOW_DAYS,
  LIEGE_WAGE_RESERVE_DAYS,
  WAGES_CHRONICLE_MIN_GAP_DAYS,
  LIEGE_RAISE_ENABLED,
  LIEGE_RAISE_MIN_GAP_DAYS,
} from '../data/crown-constants';

// ─── Switch ───────────────────────────────────────────────────────────────

let warnedPurseOff = false;

/** The crown runs only with the purse: no purse, no tax and no gift (plan § Fail-soft). */
export function crownActive(): boolean {
  if (!CROWN_ENABLED) return false;
  if (!FACTION_PURSE_ENABLED) {
    if (!warnedPurseOff) {
      warnedPurseOff = true;
      console.warn('[crown] the faction purse is off; the crown is disabled');
    }
    return false;
  }
  return true;
}

/** Hooks the caller supplies: the session's projection and its structural bump. */
export interface CrownHooks {
  getProjection?: () => RealmProjection | null;
  /** Called on every `sworn_to` create or remove (the map outline reads the edges). */
  onStructure?: () => void;
}

// ─── Small helpers ────────────────────────────────────────────────────────

function nameOf(graph: WorldGraph, id: string): string {
  return graph.getNode(id)?.name ?? id;
}

function setWealth(graph: WorldGraph, id: string, delta: number): number {
  const node = graph.getNode(id);
  if (!node) return 0;
  const before = readWealth(node.properties);
  const after = applyTreasuryDelta(before, delta);
  node.properties.wealth = after;
  return after - before;
}

/**
 * Move coin between two factions without creating or destroying any: the receiver is
 * credited first (it may be at FACTION_TREASURY_CAP), and the payer gives up only what
 * landed. Returns the amount moved — the figure every record reports.
 */
function transferCoin(graph: WorldGraph, fromId: string, toId: string, amount: number): number {
  const from = graph.getNode(fromId);
  if (!from || amount <= 0) return 0;
  const available = Math.min(amount, readWealth(from.properties));
  if (available <= 0) return 0;
  const credited = setWealth(graph, toId, available);
  if (credited <= 0) return 0;
  return -setWealth(graph, fromId, -credited);
}

/**
 * Today's loyalty: clamped to [0,1] and rounded to LOYALTY_ROUND_DECIMALS, so the break test
 * reads the tuning numbers and not float drift (0.35 − 0.15 is 0.19999… in IEEE doubles, which
 * would break a coerced oath that loses exactly one town).
 */
export function settleLoyalty(previous: number, delta: number): number {
  const f = 10 ** LOYALTY_ROUND_DECIMALS;
  return Math.round(Math.max(0, Math.min(1, previous + delta)) * f) / f;
}

function pickLine(lines: readonly string[], seed: number): string {
  const i = Math.abs(seed | 0) % lines.length;
  return lines[i];
}

function fill(line: string, actor: string, target: string): string {
  return line.replace(/\{actor\}/g, actor).replace(/\{target\}/g, target);
}

function chronicleEntry(
  state: GameState,
  trigger: EconomicChronicleTrigger,
  actorId: string,
  targetId: string,
  flavor?: string,
): ChronicleEntry | null {
  const graph = state.graph;
  const entry = resolveEconomicChronicle(
    trigger,
    { actor: nameOf(graph, actorId), actorId, target: nameOf(graph, targetId), targetId, flavor },
    state.tick,
    chronicleSeed(state.seed, `${actorId}|${targetId}|${trigger}`) + 1932,
  );
  if (!entry) return null;
  return {
    id: entry.chronicleChapter.id,
    tier: 'chronicle',
    title: entry.chronicleChapter.title,
    prose: entry.chronicleChapter.prose,
    promptContext: {
      actors: entry.chronicleChapter.actorIds,
      location: nameOf(graph, actorId),
      sphere: 'matter',
      mood: 'political',
    },
    tick: state.tick,
  };
}

function inAttention(state: GameState, a: string, b: string): boolean {
  try {
    return isFactionInAttention(state, a) || isFactionInAttention(state, b);
  } catch {
    return false;
  }
}

/** The pair's `relates_to` edge from `a` toward `b`, minted when missing. */
function relationEdge(graph: WorldGraph, a: string, b: string, tick: number): GraphEdge | null {
  const found = graph.getOutgoingEdges(a, 'relates_to').find(e => e.target === b);
  if (found) return found;
  const base = `e_relates_${a}_${b}`;
  for (const id of [base, `${base}_oath_${tick}`]) {
    try {
      graph.addEdge({ id, source: a, target: b, type: 'relates_to', properties: { sentiment: 0 } });
      return graph.getOutgoingEdges(a, 'relates_to').find(e => e.id === id) ?? null;
    } catch { /* id taken — try the next */ }
  }
  return null;
}

function sentimentOf(edge: GraphEdge): number {
  const s = edge.properties.sentiment;
  return typeof s === 'number' && Number.isFinite(s) ? s : 0;
}

// ─── Winning an oath — seek_fealty ────────────────────────────────────────

/** The `can_court` prerequisite: a realm that may court and has at least one candidate. */
export function canCourt(world: CrownWorld | null, factionId: string): boolean {
  if (!crownActive() || !world) return false;
  if (!mayCourt(world.graph, world.graph.getNode(factionId))) return false;
  return (world.candidates.get(factionId)?.length ?? 0) > 0 || coercePool(world, factionId).length > 0;
}

interface CoerceCandidate {
  id: string;
  siegeBattleId?: string;
  townTakenId?: string;
}

/**
 * Every faction R may force today: one whose town R's army has besieged for
 * OATH_COERCE_MIN_SIEGE_TICKS, or one R took a town from within OATH_COERCE_WINDOW_DAYS.
 * Like the prototype, this does not require the faction to be one of R's candidates —
 * the siege or the conquest is its own reach.
 */
export function coercePool(world: CrownWorld, realmId: string): CoerceCandidate[] {
  const graph = world.graph;
  const tick = world.tick;
  const found = new Map<string, CoerceCandidate>();

  for (const n of graph.getNodesByType('actor')) {
    const bs = n.properties.battleState as BattleState | undefined;
    if (!bs || bs.battleType !== 'siege' || !bs.settlementId) continue;
    if (tick - bs.startedTick < OATH_COERCE_MIN_SIEGE_TICKS) continue;
    const attackerFaction = graph.getOutgoingEdges(bs.attackerArmyId, 'member_of')[0]?.target;
    if (attackerFaction !== realmId) continue;
    for (const e of graph.getIncomingEdges(bs.settlementId, 'controls')) {
      if (e.source === realmId || graph.getNode(e.source)?.properties.actorType !== 'faction') continue;
      if (!found.has(e.source)) found.set(e.source, { id: e.source, siegeBattleId: n.id });
    }
  }

  const window = OATH_COERCE_WINDOW_DAYS * PURSE_CYCLE_TICKS;
  for (const e of graph.getOutgoingEdges(realmId, 'controls')) {
    if (e.properties.via !== 'conquest') continue;
    const from = e.properties.takenFrom;
    const at = e.properties.establishedTick;
    if (typeof from !== 'string' || typeof at !== 'number' || tick - at > window) continue;
    if (!found.has(from)) found.set(from, { id: from, townTakenId: e.target });
  }

  return [...found.values()]
    .filter(c => c.id !== realmId
      && maySwear(graph, graph.getNode(c.id))
      && !onReswearCooldown(graph, c.id, realmId, tick))
    .sort((a, b) => (world.income.get(b.id) ?? 0) - (world.income.get(a.id) ?? 0) || (a.id < b.id ? -1 : 1));
}

export interface SeekFealtyResult {
  record: FactionActionRecord;
  chronicle: ChronicleEntry[];
  /** True when an oath was written (the caller's world snapshot is now stale). */
  changed: boolean;
}

function writeOath(
  state: GameState,
  vassalId: string,
  liegeId: string,
  kind: OathKind,
  giftPaid: number,
  hooks: CrownHooks,
  forcedBy?: 'siege' | 'conquest',
): void {
  const props: SwornToEdgeProperties = {
    kind,
    taxShare: FEALTY_TAX_SHARE,
    loyalty: LOYALTY_START[kind],
    swornTick: state.tick,
    giftPaid,
    lastLoyaltyDay: null,
    recentLosses: [],
    taxPaidTotal: 0,
    taxPaidToday: 0,
    lastPassTick: state.tick,
    ...(forcedBy ? { forcedBy } : {}),
  };
  state.graph.addEdge({
    id: `e_sworn_${vassalId}_${liegeId}_${state.tick}`,
    source: vassalId,
    target: liegeId,
    type: 'sworn_to',
    properties: props as unknown as Record<string, unknown>,
  });
  hooks.onStructure?.();
}

/** Execute `seek_fealty` for realm R. Never throws past its own try (the caller's sweep catches). */
export function executeSeekFealty(
  state: GameState,
  realm: GraphNode,
  world: CrownWorld,
  hooks: CrownHooks = {},
): SeekFealtyResult | null {
  if (!crownActive()) return null;
  const graph = state.graph;
  const R = realm.id;
  const chronicle: ChronicleEntry[] = [];
  const before = vassalsOf(graph, R).length;

  const sworn = (vassalId: string, kind: OathKind, parts: OfferParts, giftPaid: number, coercedBy?: CoerceCandidate) => {
    const forcedBy = coercedBy ? (coercedBy.siegeBattleId ? 'siege' as const : 'conquest' as const) : undefined;
    writeOath(state, vassalId, R, kind, giftPaid, hooks, forcedBy);
    emitTrace({
      category: 'oath_sworn',
      tick: state.tick,
      vassalId,
      liegeId: R,
      kind,
      parts,
      giftPaid,
      coercedBy: coercedBy ? { siegeBattleId: coercedBy.siegeBattleId, townTakenId: coercedBy.townTakenId } : undefined,
      oathValue: world.oathValue.get(vassalId) ?? 0,
      summary: `${nameOf(graph, vassalId)} swears fealty to ${realm.name ?? R} (${kind}`
        + `${giftPaid > 0 ? `, gift ${giftPaid.toFixed(1)}` : ''}) — score ${parts.score.toFixed(2)}`,
    } as OathSwornTrace);
    if (inAttention(state, vassalId, R)) {
      const line = fill(pickLine(OATH_SWORN_LINES[kind], chronicleSeed(state.seed, vassalId) + state.tick), nameOf(graph, vassalId), realm.name ?? R);
      const e = chronicleEntry(state, 'oath_sworn', vassalId, R, line);
      if (e) chronicle.push(e);
    }
    if (before < CROWN_MIN_OATHS && before + 1 >= CROWN_MIN_OATHS) {
      const e = chronicleEntry(state, 'crown_formed', R, vassalId);
      if (e) chronicle.push(e);
    }
    return {
      record: {
        actionType: 'seek_fealty' as const,
        executedTick: state.tick,
        targetId: vassalId,
        targetName: graph.getNode(vassalId)?.name,
        outcome: 'success' as const,
        details: { kind, giftPaid, score: parts.score },
      },
      chronicle,
      changed: true,
    };
  };

  // 1. Coercion first — force needs no score (Christian: force allowed).
  const pool = coercePool(world, R);
  if (pool.length > 0) {
    const c = pool[0];
    return sworn(c.id, 'coerced', offerScore(world, c.id, R, 0), 0, c);
  }

  // 2. Persuasion or purchase.
  type Accept = { id: string; kind: OathKind; parts: OfferParts; gift: number };
  const accepted: Accept[] = [];
  let bestRefused: { id: string; parts: OfferParts; gift: number } | null = null;
  for (const c of world.candidates.get(R) ?? []) {
    if (onReswearCooldown(graph, c, R, state.tick)) continue;
    const plain = offerScore(world, c, R, 0);
    if (plain.score >= OATH_ACCEPT_THRESHOLD) {
      accepted.push({ id: c, kind: 'persuaded', parts: plain, gift: 0 });
      continue;
    }
    const g = affordableGift(world, c, R);
    const bought = g > 0 ? offerScore(world, c, R, g) : plain;
    if (g > 0 && bought.score >= OATH_ACCEPT_THRESHOLD) {
      accepted.push({ id: c, kind: 'bought', parts: bought, gift: g });
      continue;
    }
    const best = bought.score > plain.score ? bought : plain;
    if (!bestRefused || best.score > bestRefused.parts.score
        || (best.score === bestRefused.parts.score && c < bestRefused.id)) {
      bestRefused = { id: c, parts: best, gift: g };
    }
  }

  if (accepted.length > 0) {
    accepted.sort((a, b) =>
      (world.income.get(b.id) ?? 0) - (world.income.get(a.id) ?? 0)
      || (a.kind === b.kind ? 0 : a.kind === 'persuaded' ? -1 : 1)
      || (a.id < b.id ? -1 : 1));
    const pick = accepted[0];
    let giftPaid = 0;
    if (pick.kind === 'bought') {
      const cost = giftCost(world, pick.id, pick.gift);
      giftPaid = transferCoin(graph, R, pick.id, cost);
    }
    return sworn(pick.id, pick.kind, pick.parts, giftPaid);
  }

  // 3. No acceptance — the best candidate refuses, and cools a little.
  if (!bestRefused) return null;
  const rel = relationEdge(graph, bestRefused.id, R, state.tick);
  if (rel) {
    const s = sentimentOf(rel);
    const next = s <= OATH_REFUSAL_SENTIMENT_FLOOR ? s : Math.max(OATH_REFUSAL_SENTIMENT_FLOOR, s + OATH_REFUSAL_SENTIMENT_DELTA);
    if (next !== s) graph.updateEdge(rel.id, { properties: { sentiment: next } });
  }
  emitTrace({
    category: 'oath_refused',
    tick: state.tick,
    candidateId: bestRefused.id,
    liegeId: R,
    parts: bestRefused.parts,
    affordableGift: bestRefused.gift,
    oathValue: world.oathValue.get(bestRefused.id) ?? 0,
    summary: `${nameOf(graph, bestRefused.id)} refuses fealty to ${realm.name ?? R} — score ${bestRefused.parts.score.toFixed(2)}`,
  } as OathRefusedTrace);
  return {
    record: {
      actionType: 'seek_fealty',
      executedTick: state.tick,
      targetId: bestRefused.id,
      targetName: graph.getNode(bestRefused.id)?.name,
      outcome: 'failed',
      details: { score: bestRefused.parts.score },
    },
    chronicle,
    changed: false,
  };
}

// ─── The daily crown phase ────────────────────────────────────────────────

export interface CrownPhaseResult {
  chronicleEntries: ChronicleEntry[];
  broken: number;
  taxMoved: number;
  /** THR-1974 — wages lieges paid their vassals' soldiers today. */
  wagesPaid: number;
  /** THR-2020 — raises lieges paid for vassals that fielded no army today. */
  raisesFunded: number;
}

/** THR-1974 — one oath's wage day, kept for the purse-day write-back. */
interface WageRecord {
  vassalId: string;
  liegeId: string;
  covered: string[];
  paid: number;
}

/**
 * THR-1974 rule 2 — the liege pays the soldiers its vassal could not. Over the surviving
 * oaths in edge-id order: the vassal's `armiesUnpaid` (today's purse verdict), in army id
 * order, whole armies only, from the liege's purse above LIEGE_WAGE_RESERVE_DAYS of its
 * own upkeep. The first army it cannot cover and every one after stay unpaid. A covered
 * army is stamped `paidThroughTick` and `liegePaidTick`; the vassal's own purse and its
 * `armiesUnpaid` are never rewritten (the purse's broke line compares them day to day).
 */
function payWages(
  state: GameState,
  surviving: readonly GraphEdge[],
  out: ChronicleEntry[],
): WageRecord[] {
  const records: WageRecord[] = [];
  if (!crownWagesActive()) return records;
  const graph = state.graph;
  const tick = state.tick;
  const reserve = new Map<string, number>();
  const reserveOf = (liegeId: string): number => {
    let r = reserve.get(liegeId);
    if (r === undefined) {
      r = LIEGE_WAGE_RESERVE_DAYS * upkeepPerDayOf(graph, liegeId);
      reserve.set(liegeId, r);
    }
    return r;
  };
  // liege → the pair to chronicle today: one line per liege per pay day, the oldest oath.
  const lines = new Map<string, { edge: GraphEdge; trigger: EconomicChronicleTrigger; swornTick: number }>();

  for (const edge of surviving) {
    try {
      const vassalId = edge.source;
      const liegeId = edge.target;
      const vassal = graph.getNode(vassalId);
      const liege = graph.getNode(liegeId);
      const day = readPurseDay(vassal);
      // No purse day today: no wage; the armies follow the purse's own verdict.
      if (!vassal || !liege || !day || day.tick !== tick) continue;
      const props = readOath(edge);

      const covered: string[] = [];
      const uncovered: string[] = [];
      const spareBefore = Math.max(0, readWealth(liege.properties) - reserveOf(liegeId));
      let paid = 0;
      for (const armyId of day.armiesUnpaid ?? []) {
        const armyNode = graph.getNode(armyId);
        const as = armyNode?.properties.armyState as ArmyState | undefined;
        // An id that is no longer an army of this vassal is skipped.
        if (!armyNode || !as || !graph.getOutgoingEdges(armyId, 'member_of').some(e => e.target === vassalId)) continue;
        const cost = upkeepOf(as.size);
        const spare = Math.max(0, readWealth(liege.properties) - reserveOf(liegeId));
        if (uncovered.length > 0 || spare + 1e-9 < cost) {
          uncovered.push(armyId);
          continue;
        }
        paid += -setWealth(graph, liegeId, -cost);
        covered.push(armyId);
        armyNode.properties.armyState = { ...as, paidThroughTick: tick, liegePaidTick: tick };
      }

      const coveredToday = covered.length > 0;
      const prev = props.wagesCoveredLastDay === true;
      const started = coveredToday && !prev;
      const stopped = !coveredToday && prev && uncovered.length > 0;
      graph.updateEdge(edge.id, { properties: { wagesCoveredLastDay: coveredToday, wagesPaidToday: paid } });
      if (coveredToday) records.push({ vassalId, liegeId, covered, paid });

      if (coveredToday || uncovered.length > 0) {
        emitTrace({
          category: 'oath_wages',
          tick,
          vassalId,
          liegeId,
          armiesCovered: covered,
          armiesUncovered: uncovered,
          paid,
          liegeSpareBefore: spareBefore,
          started,
          stopped,
          summary: `${nameOf(graph, liegeId)} pays ${covered.length} of ${covered.length + uncovered.length} unpaid armies of ${nameOf(graph, vassalId)} (${paid.toFixed(1)})`
            + (started ? ' — pay taken up' : stopped ? ' — pay stopped' : ''),
        } as OathWagesTrace);
      }

      if ((started || stopped) && inAttention(state, vassalId, liegeId)) {
        const last = props.wagesChronicledTick;
        const gapOk = typeof last !== 'number' || tick - last >= WAGES_CHRONICLE_MIN_GAP_DAYS * PURSE_CYCLE_TICKS;
        const swornTick = props.swornTick ?? 0;
        const held = lines.get(liegeId);
        if (gapOk && (!held || swornTick < held.swornTick)) {
          lines.set(liegeId, { edge, trigger: started ? 'wages_taken_up' : 'wages_stopped', swornTick });
        }
      }
    } catch (err) {
      // Fail-soft: this oath's armies follow the purse's verdict today (NFP #4).
      console.warn(`[crown] wages on ${edge.id} skipped today`, err);
    }
  }

  for (const liegeId of [...lines.keys()].sort()) {
    const { edge, trigger } = lines.get(liegeId)!;
    const e = chronicleEntry(state, trigger, liegeId, edge.source);
    if (!e) continue;
    out.push(e);
    graph.updateEdge(edge.id, { properties: { wagesChronicledTick: tick } });
  }
  return records;
}

/**
 * THR-2020 — the liege pays for a raise its vassal cannot. Over the surviving oaths in
 * edge-id order, after the wages: a vassal that keeps a standing army
 * (`keepsStandingArmy`), is not a realm (kill criterion 3), fields none, and is refused
 * a raise by its purse alone (`armyRefusal` = 'purse') gets one, when the liege's purse
 * above LIEGE_WAGE_RESERVE_DAYS of its own upkeep covers `ARMY_CREATION_GOLD_COST` plus
 * the first day's upkeep; like a self-raise, only the raise is charged. At most one per
 * vassal per LIEGE_RAISE_MIN_GAP_DAYS. The liege pays, so the new army is stamped
 * `liegePaidTick` like a wage day; the vassal's purse is never touched. Returns how many
 * raises were paid.
 */
function fundRaises(state: GameState, surviving: readonly GraphEdge[]): number {
  if (!LIEGE_RAISE_ENABLED || !crownWagesActive()) return 0;
  const graph = state.graph;
  const tick = state.tick;
  const gap = LIEGE_RAISE_MIN_GAP_DAYS * PURSE_CYCLE_TICKS;
  let raised = 0;
  for (const edge of surviving) {
    try {
      const vassalId = edge.source;
      const liegeId = edge.target;
      const liege = graph.getNode(liegeId);
      if (!liege || !keepsStandingArmy(graph, vassalId)) continue;
      // A realm vassal raises from its own land (THR-1974 kill criterion 3: a liege never
      // buys a realm vassal's armies wholesale). A free company's hall town does not count.
      if (isRealmFaction(graph.getNode(vassalId))) continue;
      const props = readOath(edge);
      const last = props.liegeRaisedTick;
      if (typeof last === 'number' && tick - last < gap) continue;
      // Fields an army already, or is refused for anything but coin: not the liege's to buy.
      if (armyRefusal(state, vassalId) !== 'purse') continue;
      // As a self-raise (`canAffordArmy` / `spawnArmy` charge): the raise plus a first day
      // in hand, the raise itself charged. The next pay days run through the wages.
      const cost = ARMY_CREATION_GOLD_COST;
      const spareBefore = Math.max(0, readWealth(liege.properties) - LIEGE_WAGE_RESERVE_DAYS * upkeepPerDayOf(graph, liegeId));
      if (spareBefore + 1e-9 < cost + upkeepOf(wouldRaiseSize(graph, vassalId))) continue;
      const commander = selectCommander(state, vassalId);
      const ambitionId = graph.getOutgoingEdges(vassalId, 'pursues')[0]?.target;
      if (!commander || !ambitionId) continue;
      // Uncharged spawn: the vassal pays nothing; the liege's coin moves only once the army
      // exists. Stamped liege-paid at spawn, so it aims as the liege's army.
      const armyId = spawnArmy(state, vassalId, commander, ambitionId, { liegePaid: true });
      if (!armyId) continue;
      setWealth(graph, liegeId, -cost);
      graph.updateEdge(edge.id, { properties: { liegeRaisedTick: tick } });
      raised++;
      emitTrace({
        category: 'oath_raise_funded',
        tick,
        vassalId,
        liegeId,
        armyId,
        cost,
        liegeSpareBefore: spareBefore,
        summary: `${nameOf(graph, liegeId)} pays ${cost.toFixed(1)} to raise an army for ${nameOf(graph, vassalId)}`,
      } as OathRaiseFundedTrace);
    } catch (err) {
      // Fail-soft: no raise for this oath today (NFP #4).
      console.warn(`[crown] liege raise on ${edge.id} skipped today`, err);
    }
  }
  return raised;
}

function breakReason(props: SwornToEdgeProperties): { reason: LoyaltyReason; losses: Partial<Record<LoyaltyReason, number>> } {
  const losses: Partial<Record<LoyaltyReason, number>> = {};
  for (const l of props.recentLosses ?? []) losses[l.reason] = (losses[l.reason] ?? 0) + l.amount;
  let reason: LoyaltyReason = 'liege_strained';
  let most = 0;
  for (const r of LOYALTY_REASON_ORDER) {
    const v = losses[r] ?? 0;
    if (v > most) { most = v; reason = r; }
  }
  return { reason, losses };
}

/** Today's loyalty deltas for one oath (the plan's six-row table). */
export function loyaltyDeltas(
  world: CrownWorld,
  vassalId: string,
  liegeId: string,
  sinceTick: number,
): LoyaltyDelta[] {
  const graph = world.graph;
  const deltas: LoyaltyDelta[] = [];
  const band = world.means.get(liegeId);
  if (band === 'Wealthy' || band === 'Magnate') deltas.push({ reason: 'liege_wealthy', amount: LOYALTY_RISE_WEALTHY });
  else if (band === 'Getting by') deltas.push({ reason: 'liege_strained', amount: -LOYALTY_FALL_STRAINED });
  else if (band === 'Destitute') deltas.push({ reason: 'liege_destitute', amount: -LOYALTY_FALL_DESTITUTE });

  for (const e of graph.getEdgesByType('controls')) {
    if (e.properties.takenFrom !== vassalId) continue;
    // The liege's own army taking the town (a siege that ran on after a coerced oath) is
    // not a failure to defend it; holding_lost is a third party's conquest.
    if (e.source === liegeId) continue;
    const at = e.properties.establishedTick;
    if (typeof at === 'number' && at > sinceTick && at <= world.tick) {
      deltas.push({ reason: 'holding_lost', amount: -LOYALTY_FAIL_DEFENCE });
    }
  }

  if ((world.income.get(vassalId) ?? 0) > (world.fullIncome.get(liegeId) ?? 0)) {
    deltas.push({ reason: 'outgrown', amount: -LOYALTY_FALL_OUTGROWN });
  }

  const live = offerScore(world, vassalId, liegeId, 0).score;
  for (const R2 of world.courtRealms) {
    if (R2 === liegeId || R2 === vassalId) continue;
    if (!(world.reach.get(R2) ?? []).includes(vassalId)) continue;
    if (offerScore(world, vassalId, R2, 0).score > live + OATH_RIVAL_MARGIN) {
      deltas.push({ reason: 'rival_offer', amount: -LOYALTY_FALL_RIVAL_OFFER });
      break;
    }
  }
  return deltas;
}

function breakOath(
  state: GameState,
  edge: GraphEdge,
  reason: LoyaltyReason | 'vassal_gone' | 'liege_gone',
  losses: Partial<Record<LoyaltyReason, number>>,
  world: CrownWorld | null,
  hooks: CrownHooks,
  out: ChronicleEntry[],
): void {
  const graph = state.graph;
  const props = readOath(edge);
  const vassalId = edge.source;
  const liegeId = edge.target;
  const hadCrown = graph.getNode(liegeId) ? vassalsOf(graph, liegeId).length >= CROWN_MIN_OATHS : false;
  try { graph.removeEdge(edge.id); } catch { /* already gone */ }
  hooks.onStructure?.();

  emitTrace({
    category: 'oath_broken',
    tick: state.tick,
    vassalId,
    liegeId,
    kind: props.kind,
    swornTick: props.swornTick,
    loyalty: props.loyalty,
    reason,
    lossesInWindow: losses as Record<string, number>,
    taxPaidTotal: props.taxPaidTotal ?? 0,
    summary: `${nameOf(graph, vassalId)} breaks its oath to ${nameOf(graph, liegeId)} (${reason}, loyalty ${(props.loyalty ?? 0).toFixed(2)})`,
  } as OathBrokenTrace);

  // A missing end leaves no grudge and no line.
  if (reason === 'vassal_gone' || reason === 'liege_gone') {
    if (!graph.getNode(vassalId) || !graph.getNode(liegeId)) return;
  }

  for (const [a, b] of [[vassalId, liegeId], [liegeId, vassalId]] as const) {
    const rel = relationEdge(graph, a, b, state.tick);
    if (!rel) continue;
    graph.updateEdge(rel.id, {
      properties: {
        sentiment: Math.max(-1, sentimentOf(rel) + OATH_BREAK_SENTIMENT_DELTA),
        oathBrokenTick: state.tick,
        oathBrokenReason: reason,
      },
    });
  }

  if (reason !== 'vassal_gone' && reason !== 'liege_gone' && inAttention(state, vassalId, liegeId)) {
    const line = fill(
      pickLine(OATH_BROKEN_LINES[reason], chronicleSeed(state.seed, vassalId) + state.tick),
      nameOf(graph, vassalId),
      nameOf(graph, liegeId),
    );
    const e = chronicleEntry(state, 'oath_broken', vassalId, liegeId, line);
    if (e) out.push(e);
  }

  // Rebellion: a big realm breaking away raises its banners.
  if (world && isRealmFaction(graph.getNode(vassalId))) {
    const rebelIncome = world.income.get(vassalId) ?? 0;
    const crownIncome = world.fullIncome.get(liegeId) ?? 0;
    if (rebelIncome > 0 && rebelIncome >= REBELLION_INCOME_RATIO * crownIncome) {
      for (const [a, b] of [[vassalId, liegeId], [liegeId, vassalId]] as const) {
        try {
          graph.addEdge({
            id: `e_hostile_rebellion_${a}_${b}_${state.tick}`,
            source: a,
            target: b,
            type: 'hostile_to',
            properties: { reason: 'rebellion', sinceTick: state.tick },
          });
        } catch { /* duplicate on a double break */ }
      }
      emitTrace({
        category: 'rebellion',
        tick: state.tick,
        rebelId: vassalId,
        crownId: liegeId,
        rebelIncome,
        crownIncome,
        summary: `${nameOf(graph, vassalId)} rebels against ${nameOf(graph, liegeId)}`,
      } as RebellionTrace);
      const e = chronicleEntry(state, 'rebellion', vassalId, liegeId);
      if (e) out.push(e);
    }
  }

  if (hadCrown && vassalsOf(graph, liegeId).length < CROWN_MIN_OATHS) {
    const e = chronicleEntry(state, 'crown_lost', liegeId, vassalId);
    if (e) out.push(e);
  }
}

/**
 * Remove oaths the one-layer rule or a missing end forbids: an edge whose end is gone,
 * a vassal's second oath (keep the oldest), and every oath to a liege that has itself
 * sworn. Returns the surviving edges in id order.
 */
function sanitizeOaths(state: GameState, hooks: CrownHooks, out: ChronicleEntry[]): GraphEdge[] {
  const graph = state.graph;
  const edges = graph.getEdgesByType('sworn_to').slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const e of edges) {
    if (!graph.getNode(e.source)) breakOath(state, e, 'vassal_gone', {}, null, hooks, out);
    else if (!graph.getNode(e.target)) breakOath(state, e, 'liege_gone', {}, null, hooks, out);
  }
  const bySource = new Map<string, GraphEdge[]>();
  for (const e of graph.getEdgesByType('sworn_to')) {
    const list = bySource.get(e.source) ?? [];
    list.push(e);
    bySource.set(e.source, list);
  }
  let warned = false;
  for (const [, list] of [...bySource].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (list.length < 2) continue;
    if (!warned) { console.warn('[crown] a vassal held two oaths; keeping the oldest'); warned = true; }
    const sorted = list.sort((a, b) => (readOath(a).swornTick ?? 0) - (readOath(b).swornTick ?? 0) || (a.id < b.id ? -1 : 1));
    for (const extra of sorted.slice(1)) breakOath(state, extra, 'liege_gone', {}, null, hooks, out);
  }
  for (const e of graph.getEdgesByType('sworn_to').slice().sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (graph.getOutgoingEdges(e.target, 'sworn_to').length > 0) {
      console.warn(`[crown] ${e.target} is a liege and a vassal; its oaths are broken`);
      breakOath(state, e, 'liege_gone', {}, null, hooks, out);
    }
  }
  return graph.getEdgesByType('sworn_to').slice().sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * Run the crown's day. No-op off the pay-day boundary or with the crown off. Loyalty
 * first (an oath that breaks today pays no wage and no tax today), then the wages
 * (THR-1974), then the liege-paid raises (THR-2020), then the tax.
 */
export function runCrownPhase(state: GameState, hooks: CrownHooks = {}): CrownPhaseResult {
  const result: CrownPhaseResult = { chronicleEntries: [], broken: 0, taxMoved: 0, wagesPaid: 0, raisesFunded: 0 };
  const tick = state.tick;
  if (!crownActive() || tick <= 0 || tick % PURSE_CYCLE_TICKS !== 0) return result;
  const graph = state.graph;
  if (graph.getEdgesByType('sworn_to').length === 0) return result;

  const edges = sanitizeOaths(state, hooks, result.chronicleEntries);
  let projection: RealmProjection | null = null;
  try {
    projection = hooks.getProjection?.() ?? null;
  } catch (err) {
    console.warn('[crown] realm projection unavailable today', err);
  }
  const world = buildCrownWorld(graph, tick, projection);
  const window = OATH_BREAK_REASON_WINDOW_DAYS * PURSE_CYCLE_TICKS;

  // ── Loyalty, then breaks ──
  const surviving: GraphEdge[] = [];
  for (const edge of edges) {
    try {
      const props = readOath(edge);
      const deltas = loyaltyDeltas(world, edge.source, edge.target, props.lastPassTick ?? props.swornTick ?? 0);
      const sum = deltas.reduce((s, d) => s + d.amount, 0);
      const loyalty = settleLoyalty(props.loyalty ?? 0, sum);
      const recentLosses = [
        ...(props.recentLosses ?? []).filter(l => tick - l.tick < window),
        ...deltas.filter(d => d.amount < 0).map(d => ({ tick, reason: d.reason, amount: -d.amount })),
      ];
      graph.updateEdge(edge.id, {
        properties: { loyalty, lastLoyaltyDay: { tick, deltas }, recentLosses, lastPassTick: tick },
      });
      const updated = graph.getOutgoingEdges(edge.source, 'sworn_to').find(e => e.id === edge.id) ?? edge;
      if (loyalty < OATH_BREAK_THRESHOLD) {
        const { reason, losses } = breakReason(readOath(updated));
        breakOath(state, updated, reason, losses, world, hooks, result.chronicleEntries);
        result.broken++;
      } else {
        surviving.push(updated);
      }
    } catch (err) {
      // Fail-soft: this oath is skipped today (NFP #4).
      console.warn(`[crown] oath ${edge.id} skipped today`, err);
    }
  }

  // ── Wages (THR-1974): the liege pays what its vassal could not, before the tax ──
  const wages = payWages(state, surviving, result.chronicleEntries);
  const wagesTo = new Map<string, number>();
  for (const w of wages) {
    result.wagesPaid += w.paid;
    wagesTo.set(w.liegeId, (wagesTo.get(w.liegeId) ?? 0) + w.paid);
    const node = graph.getNode(w.vassalId);
    const day = readPurseDay(node);
    if (node && day) node.properties[PURSE_LAST_DAY_PROP] = { ...day, armiesPaidByLiege: w.covered, wagesFromLiege: w.paid };
  }
  for (const [id, amount] of wagesTo) {
    const node = graph.getNode(id);
    const day = readPurseDay(node);
    if (node && day) node.properties[PURSE_LAST_DAY_PROP] = { ...day, wagesToVassals: amount };
  }

  // ── A liege-paid raise (THR-2020): after the wages, from what the wages left ──
  result.raisesFunded = fundRaises(state, surviving);

  // ── The fealty tax ──
  const fealtyIn = new Map<string, number>();
  const fealtyOut = new Map<string, { amount: number; to: string }>();
  for (const edge of surviving) {
    try {
      const props = readOath(edge);
      const income = world.income.get(edge.source) ?? 0;
      const due = (props.taxShare ?? FEALTY_TAX_SHARE) * Math.max(0, income);
      const vassal = graph.getNode(edge.source);
      if (!vassal) continue;
      const paid = Math.min(due, readWealth(vassal.properties));
      const moved = paid > 0 ? transferCoin(graph, edge.source, edge.target, paid) : 0;
      fealtyIn.set(edge.target, (fealtyIn.get(edge.target) ?? 0) + moved);
      fealtyOut.set(edge.source, { amount: moved, to: edge.target });
      graph.updateEdge(edge.id, {
        properties: { taxPaidToday: moved, taxPaidTotal: (props.taxPaidTotal ?? 0) + moved },
      });
      result.taxMoved += moved;
    } catch (err) {
      console.warn(`[crown] fealty tax on ${edge.id} skipped today`, err);
    }
  }

  // ── Write the fealty onto both purse days ──
  for (const [id, out] of fealtyOut) {
    const node = graph.getNode(id);
    const day = readPurseDay(node);
    if (node && day) node.properties[PURSE_LAST_DAY_PROP] = { ...day, fealtyOut: out.amount, fealtyTo: out.to };
  }
  for (const [id, amount] of fealtyIn) {
    const node = graph.getNode(id);
    const day = readPurseDay(node);
    if (node && day) node.properties[PURSE_LAST_DAY_PROP] = { ...day, fealtyIn: amount };
  }

  return result;
}

/** The phase patch: chronicle lines only — every other write lands on the graph. */
export function phaseCrown(state: GameState, hooks: CrownHooks = {}): Partial<GameState> {
  const result = runCrownPhase(state, hooks);
  return result.chronicleEntries.length > 0
    ? { chronicleEntries: [...state.chronicleEntries, ...result.chronicleEntries] }
    : {};
}

// ─── Debug lever ──────────────────────────────────────────────────────────

/**
 * Write an oath directly, for the debug bridge's verification setup (the map outline and
 * the sheet need a sworn realm, and waiting for courtship is not a verification plan).
 * Goes through the same `writeOath` as the action, so the edge shape is the real one.
 * Refuses (returns false) when the one-layer rule or the kind lists forbid the oath.
 */
export function swearOathForDebug(
  state: GameState,
  vassalId: string,
  liegeId: string,
  kind: OathKind,
  hooks: CrownHooks = {},
): boolean {
  if (!crownActive()) return false;
  const graph = state.graph;
  if (vassalId === liegeId) return false;
  if (!maySwear(graph, graph.getNode(vassalId))) return false;
  if (!isRealmFaction(graph.getNode(liegeId))) return false;
  if (graph.getOutgoingEdges(liegeId, 'sworn_to').length > 0) return false;
  writeOath(state, vassalId, liegeId, kind, 0, hooks, kind === 'coerced' ? 'siege' : undefined);
  return true;
}
