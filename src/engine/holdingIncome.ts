/**
 * Holding income — what a mortal holds yields, once a day (THR-1428 R3).
 *
 * Three of the undertaking grid's live cells hand a mortal something that *produces*:
 * a seized route carries a `taxRate` nobody collected, a claimed Place is a freehold
 * that paid nothing, and a controlled Location never tithed. Two of the three
 * `WEALTH_*_INCOME` constants (`src/engine/wealth.ts`) have existed since the Gold
 * Reach design and were read by no phase at all. This is their reader.
 *
 * **It pays mortals, never faction treasuries.** Faction income stays with
 * `phaseFactionActions`; this pass exists because a *mortal's* holdings yielded
 * nothing, and a `controls` edge from a faction node is skipped explicitly rather
 * than by accident (the same conflation THR-1428 R5 fixes in `armySupply`).
 *
 * `WEALTH_PROSPEROUS_HOME_INCOME` is deliberately **not** paid here. It keys on a
 * mortal's *home* settlement, and residence is observed rather than stamped (THR-822):
 * there is no durable edge to pay against, and a home is not a freehold. It is left
 * unpaid on purpose so the constant is not mistaken for forgotten.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                                   | Purpose                                  |
 * |----------------------------------------|------------------------------------------|
 * | HOLDING_INCOME_INTERVAL_TICKS          | how often holdings pay (one day)         |
 * | WEALTH_ROUTE_CONTROL_INCOME            | per route, before volume × tax scaling   |
 * | WEALTH_SUBLOCATION_INCOME              | per held Place or route freehold         |
 * | WEALTH_CONTROLLED_LOCATION_TITHE       | per controlled Location, before multiplier |
 * | HOLDING_TITHE_PROSPERITY_THRESHOLDS    | prosperity steps the multiplier bands on |
 * | HOLDING_TITHE_PROSPERITY_MULTIPLIER    | a rich town tithes more                  |
 * | HOLDING_INCOME_TRACE_AGGREGATE_ABOVE   | above this many freeholds, one trace     |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None. Every payment is derived from the graph; there is no draw.
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { WealthDeltaTrace } from '../types/trace';
import type { ChronicleEntry } from '../types/narrative';
import { resolveEconomicChronicle, chronicleSeed } from './economicChronicle';
import { emitTrace } from './traceBuffer';
import { readTradeRouteProps } from './tradeRoute';
import { isLocationNode } from './sublocationShape';
import {
  applyWealthDelta,
  bankWealth,
  WEALTH_ROUTE_CONTROL_INCOME,
  WEALTH_SUBLOCATION_INCOME,
} from './wealth';
import {
  HOLDING_INCOME_INTERVAL_TICKS,
  WEALTH_CONTROLLED_LOCATION_TITHE,
  HOLDING_TITHE_PROSPERITY_THRESHOLDS,
  HOLDING_TITHE_PROSPERITY_MULTIPLIER,
  HOLDING_INCOME_TRACE_AGGREGATE_ABOVE,
  HOLDING_INCOME_CHRONICLE_INTERVAL_TICKS,
  RUINED_SETTLEMENT_PROSPERITY_FLOOR,
} from '../data/strategic-action-constants';

/** One payment, before it is banked — what the chronicle and the debug bridge read. */
export interface HoldingPayment {
  readonly holderId: string;
  readonly reason: 'route_control' | 'sublocation_income' | 'location_tithe';
  /** The route, Place or Location that paid. */
  readonly sourceId: string;
  readonly amount: number;
}

/** What one interval's pass paid. Empty on every tick that is not a payment boundary. */
export interface HoldingIncomeResult {
  readonly payments: readonly HoldingPayment[];
  /** The chronicle lines the pass earned, if any — the phase patch carries them. */
  readonly chronicleEntries: readonly ChronicleEntry[];
}

/** The tick a holder's income was last chronicled, kept on the holder's own node. */
const LAST_CHRONICLED_PROPERTY = 'holdingIncomeChronicledTick';

/** A number property read fail-soft. */
function num(props: Record<string, unknown>, key: string): number | null {
  const v = props[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Whether a node is a mortal holder — an actor, and not a faction wearing the type. */
function isMortalHolder(n: GraphNode | undefined): n is GraphNode {
  return n !== undefined && n.type === 'actor' && n.properties.actorType !== 'faction';
}

/**
 * A rich town tithes more. Banded, not interpolated: the steps are the tunable, and a
 * curve would hide which step a settlement sits on from anyone reading the trace.
 */
export function titheMultiplier(prosperity: number): number {
  const [low, mid, high] = HOLDING_TITHE_PROSPERITY_THRESHOLDS;
  if (prosperity >= high) return HOLDING_TITHE_PROSPERITY_MULTIPLIER[2];
  if (prosperity >= mid) return HOLDING_TITHE_PROSPERITY_MULTIPLIER[1];
  if (prosperity >= low) return HOLDING_TITHE_PROSPERITY_MULTIPLIER[0];
  return 0;
}

/** Every payment this tick owes, before any of it is banked. Pure: reads, never writes. */
export function collectHoldingPayments(graph: WorldGraph): HoldingPayment[] {
  const payments: HoldingPayment[] = [];

  // ── Seized routes: the toll on what crosses ──
  // `controlledBy` is the seize verb's own write. A threatened route pays nothing —
  // control you cannot enforce collects nothing — and neither does a route nobody uses.
  for (const route of graph.getAllEdges().filter(e => e.type === 'trades_with')) {
    const props = readTradeRouteProps(route.properties as Record<string, unknown>);
    if (!props.controlledBy || props.threatened || props.volume <= 0) continue;
    if (!isMortalHolder(graph.getNode(props.controlledBy))) continue;
    const scaled = Math.max(1, Math.round(props.volume * props.taxRate));
    payments.push({
      holderId: props.controlledBy,
      reason: 'route_control',
      sourceId: route.id,
      amount: WEALTH_ROUTE_CONTROL_INCOME * scaled,
    });
  }

  // ── Freeholds: what an `owns` edge holds ──
  // The shape `grantHolding` writes. A holding whose node the world has since removed
  // pays nothing rather than throwing.
  for (const holder of graph.getNodesByType('actor')) {
    if (!isMortalHolder(holder)) continue;
    for (const edge of graph.getOutgoingEdges(holder.id, 'owns')) {
      if (!graph.getNode(edge.target)) continue;
      payments.push({
        holderId: holder.id,
        reason: 'sublocation_income',
        sourceId: edge.target,
        amount: WEALTH_SUBLOCATION_INCOME,
      });
    }
  }

  // ── Controlled Locations: the tithe ──
  // Only strategic control by a mortal. A ruin tithes nothing: there is nobody left
  // to tithe, which is the same floor the ruin verb writes.
  for (const edge of graph.getAllEdges().filter(e => e.type === 'controls')) {
    if (edge.properties?.controlType !== 'strategic') continue;
    const holder = graph.getNode(edge.source);
    if (!isMortalHolder(holder)) continue;
    const location = graph.getNode(edge.target);
    if (!location || !isLocationNode(location)) continue;
    const subtype = (location.properties.locationSubtype ?? location.properties.locationType) as string | undefined;
    if (subtype === 'ruins') continue;
    const prosperity = num(location.properties, 'prosperity') ?? 0;
    if (prosperity <= RUINED_SETTLEMENT_PROSPERITY_FLOOR) continue;
    const amount = WEALTH_CONTROLLED_LOCATION_TITHE * titheMultiplier(prosperity);
    if (amount <= 0) continue;
    payments.push({
      holderId: holder.id,
      reason: 'location_tithe',
      sourceId: location.id,
      amount,
    });
  }

  return payments.sort((a, b) =>
    a.holderId.localeCompare(b.holderId) || a.sourceId.localeCompare(b.sourceId));
}

/**
 * Pay every holding, once per `HOLDING_INCOME_INTERVAL_TICKS`.
 *
 * A holding taken mid-interval waits for the next boundary — no pro-rating. That is
 * tunable rather than clever: the story reads *the tolls came in*, and a fraction of a
 * day's toll is a number nobody can feel.
 */
export function payHoldingIncome(state: GameState): HoldingIncomeResult {
  const tick = state.tick;
  if (tick <= 0 || tick % HOLDING_INCOME_INTERVAL_TICKS !== 0) {
    return { payments: [], chronicleEntries: [] };
  }

  const graph = state.graph;
  const chronicleEntries: ChronicleEntry[] = [];
  const payments = collectHoldingPayments(graph);
  if (payments.length === 0) return { payments: [], chronicleEntries: [] };

  // Bank per holder, so a magnate's twenty routes move wealth once and the clamp is
  // applied to the day's takings rather than to each coin.
  const byHolder = new Map<string, HoldingPayment[]>();
  for (const p of payments) {
    const list = byHolder.get(p.holderId);
    if (list) list.push(p); else byHolder.set(p.holderId, [p]);
  }

  for (const [holderId, holderPayments] of byHolder) {
    const holder = graph.getNode(holderId);
    if (!holder) continue;
    const total = holderPayments.reduce((sum, p) => sum + p.amount, 0);
    // What the sheet's tooltip names. The largest payment is the one worth saying —
    // "tolls on the Saltway", not a list of every coin. THR-1439: the banking goes
    // through `bankWealth`, the one funnel the active harvest also uses, so both
    // spellings of "where this coin came from" are the same vocabulary.
    const { previousWealth, newWealth } = bankWealth(
      holder.properties,
      total,
      holderPayments.reduce((a, b) => (b.amount > a.amount ? b : a)).reason,
    );

    // Above the aggregate threshold one trace stands for the day; below it, one per
    // payment keeps the CLI `traces` view legible (NFP #2 without drowning it).
    if (holderPayments.length > HOLDING_INCOME_TRACE_AGGREGATE_ABOVE) {
      emitTrace({
        category: 'wealth_delta',
        tick,
        actorId: holderId,
        previousWealth,
        delta: newWealth - previousWealth,
        newWealth,
        reason: holderPayments[0].reason,
        summary: `${holder.name ?? holderId} took in the day from ${holderPayments.length} holdings`,
      } as WealthDeltaTrace);
    } else {
      let running = previousWealth;
      for (const p of holderPayments) {
        const after = applyWealthDelta(running, p.amount);
        emitTrace({
          category: 'wealth_delta',
          tick,
          actorId: holderId,
          previousWealth: running,
          delta: after - running,
          newWealth: after,
          reason: p.reason,
          summary: `${holder.name ?? holderId} was paid by ${graph.getNode(p.sourceId)?.name ?? p.sourceId}`,
        } as WealthDeltaTrace);
        running = after;
      }
    }

    // The chronicle line, rate-limited per holder. A daily toll retold every day is an
    // accounts ledger, not a chronicle — so the world remarks on it only occasionally,
    // and never with a number (the wealth tier word is what the sheet shows).
    const lastChronicled = num(holder.properties, LAST_CHRONICLED_PROPERTY);
    const due = lastChronicled === null
      || tick - lastChronicled >= HOLDING_INCOME_CHRONICLE_INTERVAL_TICKS;
    if (due) {
      const largest = holderPayments.reduce((a, b) => (b.amount > a.amount ? b : a));
      const sourceName = graph.getNode(largest.sourceId)?.name
        ?? (largest.reason === 'route_control' ? 'the road' : 'the holding');
      const entry = resolveEconomicChronicle(
        'holding_income',
        { actor: holder.name, actorId: holderId, target: sourceName, targetId: largest.sourceId },
        tick,
        chronicleSeed(state.seed, holderId) + 1428,
      );
      if (entry) {
        chronicleEntries.push({
          id: entry.chronicleChapter.id,
          tier: 'chronicle',
          title: entry.chronicleChapter.title,
          prose: entry.chronicleChapter.prose,
          promptContext: {
            actors: entry.chronicleChapter.actorIds,
            location: sourceName,
            // `matter`, not `gold`: Gold is a *Reach* (what you do) and the prompt
            // context wants a *Sphere* (what fuels it) — the two are orthogonal axes.
            // The neighbouring economic chronicle sites spell `'gold'` here and are
            // part of the type-error baseline for exactly this reason.
            sphere: 'matter',
            mood: 'economic',
          },
          tick,
        });
        holder.properties[LAST_CHRONICLED_PROPERTY] = tick;
      }
    }
  }

  return { payments, chronicleEntries };
}

/**
 * The phase patch. Kept separate from `payHoldingIncome` so the pass can be called
 * directly in tests without threading a whole `GameState` patch through them.
 */
export function phaseHoldingIncome(state: GameState): Partial<GameState> {
  const result = payHoldingIncome(state);
  return result.chronicleEntries.length > 0
    ? { chronicleEntries: [...state.chronicleEntries, ...result.chronicleEntries] }
    : {};
}
