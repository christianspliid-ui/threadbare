/**
 * Ascendant Beat Director (THR-500)
 *
 * `phaseAscendantBeatDirector` runs once per turn, early (after the doom/omen world
 * state settles, before encounter resolution). It is a pure function over
 * `(state, rng)` that decides *which* Ascendant Beat to **offer** this turn:
 *
 *   1. If a beat is already pending → no-op (max-one-pending invariant).
 *   2. Spine first: offer the next scripted spine beat once its trigger is met.
 *   3. Else cadence-gated pool draw: once the spine is exhausted, draw a beat from
 *      the eligible pool with the seeded PRNG, respecting the cadence interval.
 *
 * The Director ONLY offers. Resolution happens when the player enters the beat via
 * the existing encounter pipeline; `resolveAscendantBeat` closes the loop (clears
 * `pending`, appends a `BeatRecord`). Beat aftermath — including the new
 * `unlock_action` effect — runs through the normal aftermath resolver.
 *
 * NFP #3 (determinism): all jitter/draw decisions use the seeded session PRNG.
 * NFP #4 (fail-soft): the whole phase is wrapped in try/catch and no-ops on any
 * error so the tick loop can never crash here.
 */

import type { GameState } from '../types/gameState';
import type {
  AscendantBeatState,
  BeatDefinition,
  BeatRecord,
  BeatTrigger,
  PendingBeat,
} from '../types/ascendantBeat';
import { emitTrace } from './traceBuffer';
import type {
  BeatScheduledTrace,
  BeatOfferedTrace,
  BeatSkippedTrace,
  BeatResolvedTrace,
} from '../types/trace';
import {
  ASCENDANT_SPINE,
  ASCENDANT_BEAT_POOL,
  BEAT_BASE_INTERVAL,
  BEAT_INTERVAL_JITTER,
  BEAT_MIN_GAP,
  BEAT_KIND_WEIGHTS,
  BEAT_INIT_LAST_BEAT_TURN,
} from '../data/ascendant-beat-content';

/**
 * Beat-trace emit wrapper. `emitTrace`'s parameter collapses a discriminated
 * `TraceEntry` union to its common base keys (`Omit<TraceEntry, …>` keeps only
 * keys shared by every member), so per-category fields like `turn`/`beatId` would
 * trip excess-property checks on a fresh literal. Funnelling through this typed
 * wrapper keeps each call site checked against the real beat-trace interfaces and
 * casts exactly once (the codebase's established escape hatch for trace emits).
 */
function emitBeatTrace(
  entry:
    | Omit<BeatScheduledTrace, 'id' | 'timestamp'>
    | Omit<BeatOfferedTrace, 'id' | 'timestamp'>
    | Omit<BeatSkippedTrace, 'id' | 'timestamp'>
    | Omit<BeatResolvedTrace, 'id' | 'timestamp'>,
): void {
  emitTrace(entry as unknown as Parameters<typeof emitTrace>[0]);
}

/** Factory for the initial Director state (spine at cursor 0, nothing pending). */
export function createInitialAscendantBeatState(): AscendantBeatState {
  return {
    spineCursor: 0,
    pending: null,
    history: [],
    lastBeatTurn: BEAT_INIT_LAST_BEAT_TURN,
  };
}

/** True if the ascendant has bonded with The First (a `thread` edge at the_first). */
function firstIsBonded(state: GameState): boolean {
  const ascendantId = state.ascendantId;
  if (!ascendantId) return false;
  try {
    const edges = state.graph.getOutgoingEdges(ascendantId, 'thread');
    return edges.some(
      e => (e.properties as { courtPosition?: string }).courtPosition === 'the_first',
    );
  } catch {
    return false;
  }
}

/**
 * Whether a beat trigger is satisfied at the given turn. Exported for unit testing.
 * `settlement_visited` is turn-gated in the foundation; its real world signal wires
 * in with the spine-authoring content issue.
 */
export function isTriggerSatisfied(trigger: BeatTrigger, state: GameState, turn: number): boolean {
  const minTurn = trigger.minTurn ?? 0;
  if (turn < minTurn) return false;
  switch (trigger.kind) {
    case 'turn':
      return true;
    case 'first_bonded':
      return firstIsBonded(state);
    case 'settlement_visited':
      return true; // foundation: turn-gated; real signal lands in spine-authoring issue
    case 'cadence':
      return true;
    default:
      return false;
  }
}

/**
 * Deterministic weighted draw from a beat pool. Weight = kind weight × per-beat
 * weight. Returns null for an empty pool. Exported for unit testing.
 */
export function drawFromPool(
  pool: readonly BeatDefinition[],
  rng: () => number,
): BeatDefinition | null {
  if (pool.length === 0) return null;
  const weights = pool.map(b => Math.max(0, (BEAT_KIND_WEIGHTS[b.kind] ?? 1) * (b.weight ?? 1)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return pool[0];
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function emitSkipped(turn: number, reason: 'pending' | 'cadence' | 'empty_pool', beatId?: string): void {
  emitBeatTrace({
    tick: turn,
    category: 'ascendant.beat.skipped',
    turn,
    reason,
    ...(beatId ? { beatId } : {}),
    summary: `ascendant beat skipped: ${reason}${beatId ? ` (${beatId})` : ''}`,
  });
}

/** Build the offer + emit scheduled/offered traces; returns the next Director state. */
function offer(
  beats: AscendantBeatState,
  def: BeatDefinition,
  trigger: BeatTrigger,
  turn: number,
  poolSize: number,
  advanceSpine: boolean,
): AscendantBeatState {
  const pending: PendingBeat = {
    beatId: def.beatId,
    kind: def.kind,
    offeredTurn: turn,
    boundNodeIds: [],
    trigger,
  };
  emitBeatTrace({
    tick: turn,
    category: 'ascendant.beat.scheduled',
    turn,
    beatId: def.beatId,
    kind: def.kind,
    trigger,
    poolSize,
    summary: `ascendant beat scheduled: ${def.beatId} (${def.kind}) via ${trigger.kind}`,
  });
  emitBeatTrace({
    tick: turn,
    category: 'ascendant.beat.offered',
    turn,
    beatId: def.beatId,
    boundNodeIds: [...pending.boundNodeIds],
    summary: `ascendant beat offered: ${def.beatId}`,
  });
  const nextCursor = advanceSpine
    ? (beats.spineCursor + 1 >= ASCENDANT_SPINE.length ? -1 : beats.spineCursor + 1)
    : beats.spineCursor;
  return { ...beats, spineCursor: nextCursor, pending, lastBeatTurn: turn };
}

/**
 * Force-offer a specific beat by id, bypassing the cadence/spine gates. Dev/QA only
 * (the `__DEBUG.fireBeat` bridge, THR-507): looks the beat up in the spine and pool
 * catalogues, emits the same scheduled/offered traces the Director would, and returns
 * the next Director state. Replaces any currently-pending beat (debug override). When
 * the targeted beat is the spine cursor's beat, the cursor advances exactly as a
 * natural offer would; otherwise the cursor is left untouched. Returns `null` if no
 * beat matches. Exported for the debug bridge + unit testing.
 */
export function forceOfferBeatById(
  beats: AscendantBeatState,
  beatId: string,
  turn: number,
): { next: AscendantBeatState; def: BeatDefinition } | null {
  const spineIdx = ASCENDANT_SPINE.findIndex(b => b.beatId === beatId);
  if (spineIdx >= 0) {
    const def = ASCENDANT_SPINE[spineIdx];
    // Advance the cursor only when firing the beat the cursor currently points at,
    // so a debug fire of an already-passed or future spine beat never corrupts the cursor.
    const advanceSpine = spineIdx === beats.spineCursor;
    return { next: offer(beats, def, def.trigger, turn, 0, advanceSpine), def };
  }
  const poolDef = ASCENDANT_BEAT_POOL.find(b => b.beatId === beatId);
  if (poolDef) {
    return {
      next: offer(beats, poolDef, { kind: 'cadence' }, turn, ASCENDANT_BEAT_POOL.length, /*advanceSpine*/ false),
      def: poolDef,
    };
  }
  return null;
}

/**
 * The Director phase. Returns a partial GameState (merged by the orchestrator).
 * No-ops to `{}` when there is no beat to offer or when the state is uninitialized
 * (old saves / fixtures without `ascendantBeats`).
 */
export function phaseAscendantBeatDirector(
  state: GameState,
  rng: () => number,
): Partial<GameState> {
  const beats = state.ascendantBeats;
  if (!beats) return {}; // fail-soft: uninitialized
  const turn = state.tick;
  try {
    // 1. max-one-pending invariant
    if (beats.pending) {
      emitSkipped(turn, 'pending', beats.pending.beatId);
      return {};
    }

    // 2. spine first
    if (beats.spineCursor >= 0 && beats.spineCursor < ASCENDANT_SPINE.length) {
      const def = ASCENDANT_SPINE[beats.spineCursor];
      if (isTriggerSatisfied(def.trigger, state, turn)) {
        return { ascendantBeats: offer(beats, def, def.trigger, turn, 0, /*advanceSpine*/ true) };
      }
      // Spine waiting on its trigger — keep the opening clean, do not interleave pool beats.
      return {};
    }

    // 3. cadence-gated pool draw (spine exhausted)
    const jitter = Math.round((rng() * 2 - 1) * BEAT_INTERVAL_JITTER);
    const interval = Math.max(BEAT_MIN_GAP, BEAT_BASE_INTERVAL + jitter);
    if (turn - beats.lastBeatTurn < interval) {
      emitSkipped(turn, 'cadence');
      return {};
    }
    const def = drawFromPool(ASCENDANT_BEAT_POOL, rng);
    if (!def) {
      emitSkipped(turn, 'empty_pool');
      return {};
    }
    return {
      ascendantBeats: offer(beats, def, { kind: 'cadence' }, turn, ASCENDANT_BEAT_POOL.length, /*advanceSpine*/ false),
    };
  } catch (err) {
    // NFP #4: the tick loop must never crash.
    emitTrace({
      tick: turn,
      category: 'engine_warning',
      summary: `phaseAscendantBeatDirector error (turn ${turn}): ${err instanceof Error ? err.message : String(err)}`,
    });
    return {};
  }
}

/**
 * Close the loop on a pending beat: clear `pending`, append a `BeatRecord`, and emit
 * the `ascendant.beat.resolved` trace. Pure state transition — the encounter
 * pipeline / UI calls this when the player finishes a beat (wired by follow-up
 * issues). No-op if nothing is pending.
 */
export function resolveAscendantBeat(
  beats: AscendantBeatState,
  args: {
    outcome: string;
    grantedActionIds?: readonly string[];
    seededNodeIds?: readonly string[];
    turn: number;
  },
): AscendantBeatState {
  if (!beats.pending) return beats;
  const record: BeatRecord = {
    beatId: beats.pending.beatId,
    kind: beats.pending.kind,
    resolvedTurn: args.turn,
    outcome: args.outcome,
    grantedActionIds: args.grantedActionIds ?? [],
    seededNodeIds: args.seededNodeIds ?? [],
  };
  emitBeatTrace({
    tick: args.turn,
    category: 'ascendant.beat.resolved',
    turn: args.turn,
    beatId: record.beatId,
    outcome: record.outcome,
    grantedActionIds: [...record.grantedActionIds],
    seededNodeIds: [...record.seededNodeIds],
    summary: `ascendant beat resolved: ${record.beatId} → ${record.outcome}`,
  });
  return { ...beats, pending: null, history: [...beats.history, record] };
}
