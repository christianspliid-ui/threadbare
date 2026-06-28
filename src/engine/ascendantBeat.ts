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
import type { AscendantProperties } from '../types/influence';
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
  BEAT_REACH_BIAS_BASE,
  BEAT_REACH_BIAS_SLOPE,
  BEAT_SPHERE_BIAS_PRIMARY,
  BEAT_SPHERE_BIAS_SECONDARY,
  BEAT_SPHERE_BIAS_NONE,
} from '../data/ascendant-beat-content';
import { eligibleDeliveryBeats, getDeliveryBeatById } from './deliveryBeatAdapter';

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
 * Read the ascendant's persisted properties (reach affinities + sphere alignment) for
 * identity biasing. Fail-soft: returns null when there is no ascendant, no node, or the
 * graph lookup throws — the draw then treats every beat as unbiased (NFP #4).
 */
function getAscendantProps(state: GameState): AscendantProperties | null {
  const id = state.ascendantId;
  if (!id) return null;
  try {
    const node = state.graph.getNode(id);
    return (node?.properties as AscendantProperties | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Identity-bias multiplier for a beat (THR-516, plan §3.2). A beat declaring an aligned
 * `reach` is scaled by the ascendant's `domainAffinities[reach]`; one declaring a
 * `sphere` gets a flat bonus when that sphere is the ascendant's primary/secondary.
 * Reach and sphere combine multiplicatively. A beat with no `identity`, or when there is
 * no ascendant, returns 1 (unbiased). Pure over its inputs; exported for unit testing.
 */
export function computeIdentityBias(beat: BeatDefinition, state: GameState): number {
  const identity = beat.identity;
  if (!identity) return 1;
  const props = getAscendantProps(state);
  let mult = 1;
  if (identity.reach) {
    const affinity = props?.domainAffinities?.[identity.reach] ?? 0;
    mult *= BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE * Math.max(0, affinity);
  }
  if (identity.sphere) {
    const sphere = props?.sphereAlignment;
    if (sphere?.primary === identity.sphere) mult *= BEAT_SPHERE_BIAS_PRIMARY;
    else if (sphere?.secondary === identity.sphere) mult *= BEAT_SPHERE_BIAS_SECONDARY;
    else mult *= BEAT_SPHERE_BIAS_NONE;
  }
  return mult;
}

/** Count culture/faction actor nodes the god has not yet been introduced to (THR-516). */
function countUnintroducedGroups(state: GameState): number {
  const groups = state.graph.getNodesByType('actor').filter(n => {
    const t = (n.properties as { actorType?: string }).actorType;
    return t === 'culture' || t === 'faction';
  }).length;
  const introduced = state.ascendantBeats
    ? state.ascendantBeats.history.filter(h => h.kind === 'introduction').length
    : 0;
  return groups - introduced;
}

/** True if a threadable actor/location the god has not yet threaded exists (THR-516). */
function hasUnthreadedTarget(state: GameState): boolean {
  const id = state.ascendantId;
  if (!id) return false;
  const threadable =
    state.graph.getNodesByType('actor').length + state.graph.getNodesByType('location').length;
  const threads = state.graph.getOutgoingEdges(id, 'thread').length;
  return threads < threadable;
}

/**
 * Whether a beat's eligibility predicate holds against current world state (THR-516,
 * plan §4.2). A beat with no `eligibility` (or `{ kind: 'always' }`) is always eligible.
 * Fail-soft (NFP #4): an unknown predicate kind or a thrown evaluation fails *open*
 * (treated as eligible) so a predicate bug never silences the living world — the same
 * fail-open posture the plan's §3.8 fallback table takes for the reach gate. Exported
 * for unit testing.
 */
export function isBeatEligible(beat: BeatDefinition, state: GameState): boolean {
  const e = beat.eligibility;
  if (!e || e.kind === 'always') return true;
  try {
    switch (e.kind) {
      case 'unintroduced_group':
        return countUnintroducedGroups(state) > 0;
      case 'unthreaded_target':
        return hasUnthreadedTarget(state);
      default:
        return true; // fail-open for an unrecognized predicate
    }
  } catch {
    return true; // fail-open: an eligibility error must never mute the world
  }
}

/**
 * Deterministic weighted draw from a beat pool. Weight = kind weight × per-beat weight ×
 * identity bias (THR-516; `identityBias` defaults to neutral so existing two-arg callers
 * are unaffected). Returns null for an empty pool. Exported for unit testing.
 */
export function drawFromPool(
  pool: readonly BeatDefinition[],
  rng: () => number,
  identityBias?: (beat: BeatDefinition) => number,
): BeatDefinition | null {
  if (pool.length === 0) return null;
  const weights = pool.map(b => {
    const base = Math.max(0, (BEAT_KIND_WEIGHTS[b.kind] ?? 1) * (b.weight ?? 1));
    const bias = identityBias ? Math.max(0, identityBias(b)) : 1;
    return base * bias;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return pool[0];
  let roll = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function emitSkipped(
  turn: number,
  reason: 'pending' | 'cadence' | 'empty_pool' | 'missing_template',
  beatId?: string,
): void {
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
  // Delivery beats wrap a branching encounter; `def.templateId` names it so the
  // trace identifies the otherwise-unreachable content the vision hosts (THR-506).
  const templateId = def.templateId ? { templateId: def.templateId } : {};
  emitBeatTrace({
    tick: turn,
    category: 'ascendant.beat.scheduled',
    turn,
    beatId: def.beatId,
    kind: def.kind,
    trigger,
    poolSize,
    ...templateId,
    summary: `ascendant beat scheduled: ${def.beatId} (${def.kind})${def.templateId ? ` → ${def.templateId}` : ''} via ${trigger.kind}`,
  });
  emitBeatTrace({
    tick: turn,
    category: 'ascendant.beat.offered',
    turn,
    beatId: def.beatId,
    boundNodeIds: [...pending.boundNodeIds],
    ...templateId,
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
  // Delivery beats (THR-506) wrap branching encounters and are not in the static
  // pool; resolve them from the adapter so force-offer can host a divine vision.
  const deliveryDef = getDeliveryBeatById(beatId);
  if (deliveryDef) {
    return {
      next: offer(beats, deliveryDef, { kind: 'cadence' }, turn, ASCENDANT_BEAT_POOL.length, /*advanceSpine*/ false),
      def: deliveryDef,
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
    // Merge the static base pool (intro/invest/select) with the delivery beats that
    // are still eligible — branching encounters not yet delivered this run (THR-506).
    // The base pool stays delivery-free; delivery dedup against history happens in the
    // adapter, per-beat eligibility predicates (THR-516) are applied below.
    const pool = [...ASCENDANT_BEAT_POOL, ...eligibleDeliveryBeats(beats.history.map(h => h.beatId))];
    // Drop beats whose eligibility predicate fails against current world state, then draw
    // weighted by ascendant identity (reach/sphere) on top of the kind-mix weights.
    const eligible = pool.filter(b => isBeatEligible(b, state));
    if (eligible.length === 0) {
      emitSkipped(turn, 'empty_pool');
      return {};
    }
    const def = drawFromPool(eligible, rng, b => computeIdentityBias(b, state));
    if (!def) {
      emitSkipped(turn, 'empty_pool');
      return {};
    }
    // poolSize reflects the *eligible* pool (plan §3.2) for inspectability.
    return {
      ascendantBeats: offer(beats, def, { kind: 'cadence' }, turn, eligible.length, /*advanceSpine*/ false),
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

/** Look a beat up across all three catalogues (spine, static pool, delivery adapter). */
function findBeatDefinition(beatId: string): BeatDefinition | null {
  return (
    ASCENDANT_SPINE.find(b => b.beatId === beatId) ??
    ASCENDANT_BEAT_POOL.find(b => b.beatId === beatId) ??
    getDeliveryBeatById(beatId) ??
    null
  );
}

/**
 * Public catalogue lookup for a beat by id (spine ∪ pool ∪ delivery). The UI
 * (`AscendantBeatModal`) needs a pending beat's `grantsActionIds` to render a
 * selection beat's choose-1-of-N options; the `PendingBeat` only carries id + kind.
 */
export function getBeatDefinitionById(beatId: string): BeatDefinition | null {
  return findBeatDefinition(beatId);
}

/** Result of {@link resolvePendingBeat}. `state` is the input state unchanged on no-op. */
export interface PendingBeatResolution {
  /** Next state: grants applied to `unlockedActionIds`, `pending` cleared. */
  readonly state: GameState;
  /** True only when a beat actually resolved (grants applied + history recorded). */
  readonly resolved: boolean;
  /** The beat id acted on (resolved or skipped), or null when nothing was pending. */
  readonly beatId: string | null;
  /** Action ids unlocked by this resolution (the chosen one for selection beats). */
  readonly grantedActionIds: readonly string[];
  /** Outcome-ladder rung recorded against the beat (`''` on no-op). */
  readonly outcome: string;
  /** Human-readable summary for the debug bridge / status surfaces. */
  readonly message: string;
}

/**
 * Resolve the currently-pending ascendant beat against full `GameState` — the
 * "offer → enter → resolve" loop's closing half (THR-517). The Director only
 * *offers* (`phaseAscendantBeatDirector` sets `pending`); this is what clears it in
 * the running sim once the player enters and finishes the beat.
 *
 * Looks the pending beat up in the catalogue, applies its grants into
 * `state.unlockedActionIds` (dedup; emits `action.unlock.granted` via `'beat'` per
 * newly-granted id), then records the `BeatRecord` + clears `pending` via
 * {@link resolveAscendantBeat}.
 *
 * - **Non-selection beats** grant *all* of the definition's `grantsActionIds`.
 * - **Selection beats** (`kind: 'selection'`) grant exactly one option — pass
 *   `opts.chosenActionId`. Omitting it (or passing one outside the beat's options)
 *   is a no-op that returns `resolved: false` with a message: the player must choose.
 *
 * Fail-soft (NFP #4): nothing pending → no-op; a pending beat whose definition is
 * unknown, or whose declared `templateId` fails `templateResolver`, clears
 * gracefully (emits `ascendant.beat.skipped` reason `missing_template`) so the queue
 * never wedges. The whole body is wrapped so a thrown resolver can never crash a tick.
 *
 * Pure over its inputs aside from trace emission; returns a fresh state — callers
 * (`GameView` / the `__DEBUG.resolveBeat` bridge) swap it in via `setGameState`.
 *
 * @param templateResolver optional predicate the UI injects (`id => getUnifiedTemplateById(id) !== undefined`)
 *   so the engine can honor the missing-template fail-soft without importing the
 *   template registry. When omitted, a declared `templateId` is assumed valid.
 */
export function resolvePendingBeat(
  state: GameState,
  opts: { chosenActionId?: string; outcome?: string } = {},
  templateResolver?: (templateId: string) => boolean,
): PendingBeatResolution {
  const beats = state.ascendantBeats;
  if (!beats?.pending) {
    return { state, resolved: false, beatId: null, grantedActionIds: [], outcome: '', message: 'No beat pending.' };
  }
  const pending = beats.pending;
  const turn = state.tick;
  try {
    const def = findBeatDefinition(pending.beatId);
    // Fail-soft: unknown beat (stale save / removed catalogue entry), or a declared
    // template the UI can't resolve → clear pending gracefully, never wedge the queue.
    if (!def || (def.templateId && templateResolver && !templateResolver(def.templateId))) {
      emitSkipped(turn, 'missing_template', pending.beatId);
      return {
        state: { ...state, ascendantBeats: { ...beats, pending: null } },
        resolved: false,
        beatId: pending.beatId,
        grantedActionIds: [],
        outcome: 'skipped',
        message: `Beat '${pending.beatId}' skipped: definition or template missing/invalid.`,
      };
    }

    const allGrants = def.grantsActionIds ?? [];
    let granted: readonly string[];
    if (pending.kind === 'selection') {
      const chosen = opts.chosenActionId;
      if (!chosen || !allGrants.includes(chosen)) {
        return {
          state,
          resolved: false,
          beatId: pending.beatId,
          grantedActionIds: [],
          outcome: '',
          message: `Selection beat '${pending.beatId}' needs a choice from [${allGrants.join(', ')}].`,
        };
      }
      granted = [chosen];
    } else {
      granted = allGrants;
    }

    // Apply grants → unlockedActionIds (dedup; one trace per newly-revealed id).
    const current = state.unlockedActionIds ?? [];
    const nextUnlocked = [...current];
    for (const id of granted) {
      if (nextUnlocked.includes(id)) continue;
      nextUnlocked.push(id);
      emitTrace({
        tick: turn,
        category: 'action.unlock.granted',
        turn,
        actionId: id,
        via: 'beat',
        summary: `action.unlock.granted: ${id} (via beat ${pending.beatId})`,
      } as unknown as Parameters<typeof emitTrace>[0]);
    }

    const outcome = opts.outcome ?? (pending.kind === 'selection' ? 'chosen' : 'received');
    const resolvedBeats = resolveAscendantBeat(beats, { outcome, grantedActionIds: granted, turn });
    return {
      state: { ...state, unlockedActionIds: nextUnlocked, ascendantBeats: resolvedBeats },
      resolved: true,
      beatId: pending.beatId,
      grantedActionIds: granted,
      outcome,
      message: `Resolved '${pending.beatId}' → ${outcome}${granted.length ? ` (+${granted.join(', ')})` : ''}`,
    };
  } catch (err) {
    // NFP #4: the resolve path must never crash a tick or wedge the queue.
    emitTrace({
      tick: turn,
      category: 'engine_warning',
      summary: `resolvePendingBeat error (${pending.beatId}, turn ${turn}): ${err instanceof Error ? err.message : String(err)}`,
    });
    return {
      state,
      resolved: false,
      beatId: pending.beatId,
      grantedActionIds: [],
      outcome: '',
      message: `Beat '${pending.beatId}' resolution errored — left pending.`,
    };
  }
}
