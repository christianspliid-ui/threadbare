/**
 * Attention pool operations — regen, spend, visual state, and attend cost.
 *
 * Pure functions; each returns a new state object (immutable).
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type {
  AscendantAttentionState,
  AttentionPoolTrace,
  AttentionVisualState,
  ThreadTug,
} from '../types/attention';
import type { CourtPosition, ThreadEdgeProperties } from '../types/influence';
import type { TraceEntry } from '../types/trace';
import type { WorldGraph } from './graph';
import { resolveAttentionMode } from './attentionCadence';
import { emitTrace } from './traceBuffer';
import {
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
  LIVELIHOOD_TUG_ATTEND_COST,
  ATTENTION_POOL_FOCUSED_THRESHOLD,
  ATTENTION_POOL_BUSY_THRESHOLD,
  ATTENTION_POOL_STRAINED_THRESHOLD,
  ATTEND_COST_MODERATE,
  ATTEND_COST_HARD,
  ATTEND_COST_STORY_BEAT,
  COURT_COST_MULTIPLIER_FIRST,
  COURT_COST_MULTIPLIER_RETINUE,
  COURT_COST_MULTIPLIER_WATCHED,
} from '../data/attention-constants';

// ─── Threat Level Base Costs ─────────────────────────────────────────────────

/** Maps threat level (and 'story_beat' sentinel) to base attention cost. */
type ThreatOrBeat = 'moderate' | 'hard' | 'deadly' | 'story_beat';

const THREAT_BASE_COST: Record<ThreatOrBeat, number> = {
  moderate:   ATTEND_COST_MODERATE,
  hard:       ATTEND_COST_HARD,
  deadly:     ATTEND_COST_HARD,       // deadly shares the hard base cost
  story_beat: ATTEND_COST_STORY_BEAT,
};

// ─── Court Position Cost Multipliers ─────────────────────────────────────────

/** Maps court position to its attend-cost multiplier. */
const COURT_MULTIPLIER: Record<Exclude<CourtPosition, 'dormant'>, number> = {
  the_first: COURT_COST_MULTIPLIER_FIRST,
  retinue:   COURT_COST_MULTIPLIER_RETINUE,
  watched:   COURT_COST_MULTIPLIER_WATCHED,
};

// ─── regenAttention ───────────────────────────────────────────────────────────

/**
 * Add the state's `attentionRegen` to the pool, capped at `attentionCapacity`.
 * Returns a new state object; does not mutate the input.
 */
export function regenAttention(state: AscendantAttentionState): AscendantAttentionState {
  const next = Math.min(state.attentionPool + state.attentionRegen, state.attentionCapacity);
  return { ...state, attentionPool: next };
}

// ─── spendAttention ───────────────────────────────────────────────────────────

/**
 * Deduct `cost` from the attention pool, clamped at 0.
 * Returns a new state object; does not mutate the input.
 */
export function spendAttention(state: AscendantAttentionState, cost: number): AscendantAttentionState {
  const next = Math.max(state.attentionPool - cost, 0);
  return { ...state, attentionPool: next };
}

// ─── getAttentionVisualState ──────────────────────────────────────────────────

/**
 * Map the current pool fill ratio to a visual state label.
 *
 * Thresholds (ratio = pool / capacity):
 *   > 0.6  → 'focused'
 *   > 0.3  → 'busy'
 *   > 0.1  → 'strained'
 *   <= 0.1 → 'overwhelmed'
 */
export function getAttentionVisualState(state: AscendantAttentionState): AttentionVisualState {
  const ratio = state.attentionCapacity > 0
    ? state.attentionPool / state.attentionCapacity
    : 0;

  if (ratio > ATTENTION_POOL_FOCUSED_THRESHOLD) return 'focused';
  if (ratio > ATTENTION_POOL_BUSY_THRESHOLD)    return 'busy';
  if (ratio > ATTENTION_POOL_STRAINED_THRESHOLD) return 'strained';
  return 'overwhelmed';
}

// ─── computeAttendCost ────────────────────────────────────────────────────────

/**
 * Calculate the attention pool cost for attending a tug or story beat.
 *
 * Cost = base cost (by threat level) × court position multiplier.
 *
 * @param threatLevel - Threat level of the encounter, or 'story_beat' for full beats.
 * @param courtPosition - The agent's court position (dormant agents should not generate tugs).
 */
export function computeAttendCost(
  threatLevel: ThreatOrBeat,
  courtPosition: Exclude<CourtPosition, 'dormant'>,
): number {
  const base = THREAT_BASE_COST[threatLevel] ?? ATTEND_COST_MODERATE;
  const multiplier = COURT_MULTIPLIER[courtPosition] ?? COURT_COST_MULTIPLIER_RETINUE;
  return base * multiplier;
}

// ─── tugAttendCost ────────────────────────────────────────────────────────────

/**
 * Court position used when a tug somehow carries `dormant`.
 * Dormant agents should not generate tugs; `computeAttendCost` rejects the type.
 */
const TUG_FALLBACK_COURT_POSITION: Exclude<CourtPosition, 'dormant'> = 'retinue';

/**
 * Attention cost of answering one Thread Tug (THR-2062: moved here from the badge
 * model so the engine's single writer and the badge price a tug the same way).
 * A livelihood tug is news, not a purchase: `LIVELIHOOD_TUG_ATTEND_COST`.
 */
export function tugAttendCost(tug: ThreadTug): number {
  if (tug.kind === 'livelihood') return LIVELIHOOD_TUG_ATTEND_COST;
  const safePosition = tug.courtPosition !== 'dormant'
    ? tug.courtPosition
    : TUG_FALLBACK_COURT_POSITION;
  return computeAttendCost(tug.threatLevel, safePosition);
}

// ─── attendThreadTug ──────────────────────────────────────────────────────────

/** What `attendThreadTug` reads: the graph, the ascendant, the live tugs, the tick. */
export interface AttendThreadTugInput {
  graph: WorldGraph;
  ascendantId: string;
  activeThreadTugs?: readonly ThreadTug[];
  tick: number;
}

export interface AttendThreadTugResult {
  /** The tug list with the answered tug marked attended (a new array). */
  activeThreadTugs: ThreadTug[];
  /** What the answer cost. */
  cost: number;
  /** The pool after paying. */
  pool: number;
}

/**
 * THR-2062 E4 — answer a Thread Tug: the single writer of an Attention spend.
 *
 * Finds the live, unattended tug, prices it (`tugAttendCost`), refuses when the
 * pool cannot cover it, writes the paid pool onto the ascendant node (graph
 * convention: props mutated in place — the caller owns `touchWorld`), and emits an
 * `attention_pool` trace with `cause: 'attend_tug'`.
 *
 * Fail-soft: an unknown, lapsed or already-answered tug, a missing ascendant, or a
 * pool that cannot pay → `null`, and nothing is spent.
 */
export function attendThreadTug(
  input: AttendThreadTugInput,
  tugId: string,
): AttendThreadTugResult | null {
  const tugs = input.activeThreadTugs ?? [];
  const tug = tugs.find(t => t.id === tugId);
  if (!tug || tug.attended || tug.expiresTick <= input.tick) return null;

  const ascendant = input.graph.getNode(input.ascendantId);
  if (!ascendant) return null;
  const props = ascendant.properties as Record<string, unknown>;
  const prev: AscendantAttentionState = {
    attentionPool:     Number.isFinite(props.attentionPool as number) ? props.attentionPool as number : ATTENTION_BASE_CAPACITY,
    attentionCapacity: Number.isFinite(props.attentionCapacity as number) ? props.attentionCapacity as number : ATTENTION_BASE_CAPACITY,
    attentionRegen:    Number.isFinite(props.attentionRegen as number) ? props.attentionRegen as number : ATTENTION_BASE_REGEN,
  };

  const cost = tugAttendCost(tug);
  if (prev.attentionPool < cost) return null;

  const next = spendAttention(prev, cost);
  props.attentionPool = next.attentionPool;

  emitTrace({
    category: 'attention_pool',
    tick:     input.tick,
    agentId:  tug.agentId,
    summary:  `attention spent -${cost.toFixed(2)} → ${next.attentionPool.toFixed(2)}/${next.attentionCapacity} answering tug ${tug.id}`,
    previous: prev.attentionPool,
    current:  next.attentionPool,
    capacity: next.attentionCapacity,
    delta:    -cost,
    cause:    'attend_tug',
    tugId:    tug.id,
    tugKind:  tug.kind ?? 'chapter',
  } satisfies Omit<AttentionPoolTrace, 'id' | 'timestamp'> as Omit<TraceEntry, 'id' | 'timestamp'>);

  return {
    activeThreadTugs: tugs.map(t => (t.id === tug.id ? { ...t, attended: true } : t)),
    cost,
    pool: next.attentionPool,
  };
}

// ─── attentionCanBeSpent ──────────────────────────────────────────────────────

/**
 * THR-2062 E5 — can a Thread Tug cost the god anything? True when the court holds a
 * non-dormant thread set to *Lives on* (`auto_resolve`). A mortal who asks you
 * (`pause`) raises no chapter tug, and livelihood tugs are free, so with only those
 * the gauge has nothing to show.
 */
export function attentionCanBeSpent(graph: WorldGraph, ascendantId: string): boolean {
  for (const edge of graph.getOutgoingEdges(ascendantId, 'thread')) {
    const props = (edge.properties ?? {}) as unknown as ThreadEdgeProperties;
    if ((props.courtPosition as string | undefined) === 'dormant') continue;
    if (!props.courtPosition) continue;
    if (resolveAttentionMode(props) === 'auto_resolve') return true;
  }
  return false;
}
