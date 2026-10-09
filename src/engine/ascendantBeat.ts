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

import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import { GIFT_PLACEMENT_SIGNIFICANCE } from '../data/receipt-content';
import type {
  AscendantBeatState,
  BeatDefinition,
  BeatRecord,
  BeatTrigger,
  PendingBeat,
} from '../types/ascendantBeat';
import type { AscendantProperties } from '../types/influence';
import { emitTrace } from './traceBuffer';
import { allGrantsHeld } from './beatGrantsHeld';
import type {
  BeatScheduledTrace,
  BeatOfferedTrace,
  BeatSkippedTrace,
  BeatResolvedTrace,
  SpineDeferredTrace,
  BeatArrivalOfferTrace,
  BeatSettledAsPlayedTrace,
} from '../types/trace';
import {
  ASCENDANT_SPINE,
  ASCENDANT_BEAT_POOL,
  BEAT_BASE_INTERVAL,
  BEAT_INTERVAL_JITTER,
  BEAT_MIN_GAP,
  SPINE_PLAYER_ACTS_BETWEEN_GIFTS,
  SPINE_IDLE_FALLBACK_TICKS,
  SETTLED_OPENING_CHRONICLE_LINE,
  SETTLED_OPENING_FIRST_FALLBACK,
  SETTLED_OPENING_SIGNIFICANCE,
  isSpineBeatId,
  BEAT_KIND_WEIGHTS,
  BEAT_INIT_LAST_BEAT_TURN,
  BEAT_REACH_BIAS_BASE,
  BEAT_REACH_BIAS_SLOPE,
  BEAT_REACH_AFFINITY_FULL_SCALE,
  BEAT_SPHERE_BIAS_PRIMARY,
  BEAT_SPHERE_BIAS_SECONDARY,
  BEAT_SPHERE_BIAS_NONE,
} from '../data/ascendant-beat-content';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import { REACH_SIGNATURE_ID_BY_REACH } from '../data/reach-signature-content';
import { ASCENDANT_DEEPENING_BEATS, getDeepeningBeatById } from '../data/ascendant-deepening-beats';
import { ASCENDANT_MILESTONE_BEATS, getMilestoneBeatById } from '../data/ascendant-milestone-beats';
import { bindDeliverySubject, eligibleDeliveryBeats, getDeliveryBeatById, type DeliveryBindFailure } from './deliveryBeatAdapter';
import { seedBeatGraph } from './ascendantBeatSeeding';
import { applyEncounterAftermathReaction } from './encounterAftermath';
import { touchWorld, touchStructure, type SimulationRuntime } from './simulationRuntime';
import type {
  UnifiedAction,
  UnifiedActionTemplate,
  EncounterAftermathReaction,
} from '../types/unifiedAction';

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
    | Omit<BeatResolvedTrace, 'id' | 'timestamp'>
    | Omit<SpineDeferredTrace, 'id' | 'timestamp'>
    | Omit<BeatArrivalOfferTrace, 'id' | 'timestamp'>
    | Omit<BeatSettledAsPlayedTrace, 'id' | 'timestamp'>,
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
    // THR-1771: affinities are stored raw (2–5); normalise to [0..1] before the slope.
    const raw = props?.domainAffinities?.[identity.reach] ?? 0;
    const affinity = Math.min(1, Math.max(0, raw / BEAT_REACH_AFFINITY_FULL_SCALE));
    mult *= BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE * affinity;
  }
  if (identity.sphere) {
    const sphere = props?.sphereAlignment;
    if (sphere?.primary === identity.sphere) mult *= BEAT_SPHERE_BIAS_PRIMARY;
    else if (sphere?.secondary === identity.sphere) mult *= BEAT_SPHERE_BIAS_SECONDARY;
    else mult *= BEAT_SPHERE_BIAS_NONE;
  }
  return mult;
}

/**
 * Rank the ascendant's reaches by affinity, descending (THR-523). The generator persists
 * an unordered `domainAffinities` bag (2–3 reaches), not an explicit primary/secondary
 * pair, so "primary" = highest affinity and "secondary" = second-highest are derived here.
 * Deterministic (NFP #3): affinity descending, ties broken by fixed `REACH_DOMAINS` order.
 * Fail-soft: returns `[]` when there is no ascendant / no affinities.
 */
function rankAscendantReaches(state: GameState): ReachDomain[] {
  const affinities = getAscendantProps(state)?.domainAffinities;
  if (!affinities) return [];
  return (Object.entries(affinities) as [ReachDomain, number][])
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort((a, b) =>
      b[1] !== a[1] ? b[1] - a[1] : REACH_DOMAINS.indexOf(a[0]) - REACH_DOMAINS.indexOf(b[0]),
    )
    .map(([reach]) => reach);
}

/**
 * The `invest.<reach>.<name>` signature id the ascendant should receive for an acquisition
 * slot (THR-523). `'primary'` → the highest-affinity reach's signature, `'secondary'` →
 * the second-highest. Resolves per-run because *which* of the eight signatures is primary
 * depends on the ascendant, so a static `grantsActionIds` id cannot name it. Returns null
 * (fail-soft): a slot with no ranked reach (e.g. a single-domain ascendant asked for
 * `'secondary'`), or a reach with no authored signature. Exported for unit testing.
 */
export function resolveReachSignatureGrant(
  state: GameState,
  slot: 'primary' | 'secondary',
): string | null {
  const ranked = rankAscendantReaches(state);
  const reach = slot === 'primary' ? ranked[0] : ranked[1];
  if (!reach) return null;
  return REACH_SIGNATURE_ID_BY_REACH[reach] ?? null;
}

/**
 * True when the ascendant's primary or secondary reach signature is not yet in
 * `unlockedActionIds` (THR-523). Gates the secondary-signature acquisition beat so it
 * retires from the pool draw once both granted signatures are learned. Only ranks 0 and
 * 1 count (THR-1771): only those two are ever granted (Beat 4 + this beat), so a 3-reach
 * god's third signature kept the beat eligible forever, drawing an empty grant. Fail-soft:
 * no ascendant / no affinities → false (nothing to acquire, so the beat is ineligible).
 */
function hasUnacquiredReachSignature(state: GameState): boolean {
  const ranked = rankAscendantReaches(state).slice(0, 2);
  if (ranked.length === 0) return false;
  const unlocked = new Set(state.unlockedActionIds ?? []);
  for (const reach of ranked) {
    const sig = REACH_SIGNATURE_ID_BY_REACH[reach];
    if (sig && !unlocked.has(sig)) return true;
  }
  return false;
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

/**
 * Culture/faction actor ids the god has already been introduced to (THR-522): the union
 * of `boundNodeIds` recorded against resolved `introduction` beats. Pre-THR-522 records
 * carry no `boundNodeIds`, so they contribute nothing — binding then falls to graph order
 * while the count-proxy eligibility gate ({@link countUnintroducedGroups}) keeps pacing how
 * many introduction beats fire. Returns a Set for O(1) exclusion in {@link bindBeatSubject}.
 */
function getIntroducedGroupIds(state: GameState): Set<string> {
  const ids = new Set<string>();
  const history = state.ascendantBeats?.history ?? [];
  for (const rec of history) {
    if (rec.kind !== 'introduction') continue;
    for (const id of rec.boundNodeIds ?? []) ids.add(id);
  }
  return ids;
}

/**
 * Resolve the specific subject node(s) a beat operates on at offer time (THR-522). For an
 * `unintroduced_group`-eligible beat this is the first culture/faction actor the god has
 * not yet been introduced to (graph iteration order — deterministic, NFP #3), so the
 * offered beat can name the exact group instead of generic phrasing. Every other beat binds
 * nothing (`[]`) — the existing pure-flavor / grant contract is unchanged. Fail-soft
 * (NFP #4): any graph error yields `[]` and the beat falls back to generic prose. Exported
 * for unit testing.
 */
export function bindBeatSubject(beat: BeatDefinition, state: GameState): readonly string[] {
  if (beat.eligibility?.kind !== 'unintroduced_group') return [];
  try {
    const introduced = getIntroducedGroupIds(state);
    const group = state.graph.getNodesByType('actor').find(n => {
      const t = (n.properties as { actorType?: string }).actorType;
      return (t === 'culture' || t === 'faction') && !introduced.has(n.id);
    });
    return group ? [group.id] : [];
  } catch {
    return [];
  }
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
export { allGrantsHeld };

export function isBeatEligible(beat: BeatDefinition, state: GameState): boolean {
  // THR-1747: an investment beat retires once every card it grants is held — the pool
  // re-offered held cards forever (a fake reveal). Checked ahead of the no-eligibility
  // early return so a beat with no predicate (`the_unveiled_eye`) retires too. Own
  // try: an error here reads as "not all held", keeping the beat eligible (fail-open).
  if (beat.kind === 'investment') {
    let retired = false;
    try {
      retired = allGrantsHeld(beat, state);
    } catch {
      retired = false;
    }
    if (retired) return false;
  }
  const e = beat.eligibility;
  if (!e || e.kind === 'always') return true;
  try {
    switch (e.kind) {
      case 'unintroduced_group':
        return countUnintroducedGroups(state) > 0;
      case 'unthreaded_target':
        return hasUnthreadedTarget(state);
      case 'unacquired_reach_signature':
        return hasUnacquiredReachSignature(state);
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

/**
 * Keep only the delivery beats whose source encounter can bind The First (THR-1650).
 * Emits one aggregate `beat.delivery_skipped` per draw that withholds any — the reason is
 * `no_first` when nothing is bonded, else the first failing beat's reason. Fail-soft: a
 * thrown binder withholds that beat (never offer a vision that cannot play).
 */
function withholdUnbindableDeliveryBeats(
  candidates: readonly BeatDefinition[],
  state: GameState,
  turn: number,
): BeatDefinition[] {
  const kept: BeatDefinition[] = [];
  let firstReason: DeliveryBindFailure | undefined;
  let subjectId: string | null = null;
  for (const beat of candidates) {
    if (!beat.templateId) continue;
    try {
      const binding = bindDeliverySubject(state, beat.templateId);
      subjectId = binding.subjectId;
      if (binding.ok) {
        kept.push(beat);
      } else {
        firstReason ??= binding.reason;
      }
    } catch {
      firstReason ??= 'no_anchor';
    }
  }
  const filteredCount = candidates.length - kept.length;
  if (filteredCount > 0) {
    emitTrace({
      tick: turn,
      category: 'beat.delivery_skipped',
      turn,
      subjectId,
      reason: firstReason,
      filteredCount,
      summary: `beat.delivery_skipped: ${filteredCount} delivery beat(s) withheld (${firstReason ?? 'unknown'})`,
    });
  }
  return kept;
}

/** Build the offer + emit scheduled/offered traces; returns the next Director state. */
function offer(
  beats: AscendantBeatState,
  def: BeatDefinition,
  trigger: BeatTrigger,
  turn: number,
  poolSize: number,
  boundNodeIds: readonly string[],
  advanceSpine: boolean,
): AscendantBeatState {
  const pending: PendingBeat = {
    beatId: def.beatId,
    kind: def.kind,
    offeredTurn: turn,
    boundNodeIds: [...boundNodeIds],
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
  state?: GameState,
): { next: AscendantBeatState; def: BeatDefinition } | null {
  // Bind the subject when state is supplied (the debug bridge passes it) so a force-fired
  // introduction beat names its group exactly as a natural offer would (THR-522). Headless
  // unit callers omit state → no binding, same as before.
  const bound = (def: BeatDefinition) => (state ? bindBeatSubject(def, state) : []);
  const spineIdx = ASCENDANT_SPINE.findIndex(b => b.beatId === beatId);
  if (spineIdx >= 0) {
    const def = ASCENDANT_SPINE[spineIdx];
    // Advance the cursor only when firing the beat the cursor currently points at,
    // so a debug fire of an already-passed or future spine beat never corrupts the cursor.
    const advanceSpine = spineIdx === beats.spineCursor;
    return { next: offer(beats, def, def.trigger, turn, 0, bound(def), advanceSpine), def };
  }
  const poolDef = ASCENDANT_BEAT_POOL.find(b => b.beatId === beatId);
  if (poolDef) {
    return {
      next: offer(beats, poolDef, { kind: 'cadence' }, turn, ASCENDANT_BEAT_POOL.length, bound(poolDef), /*advanceSpine*/ false),
      def: poolDef,
    };
  }
  // Delivery beats (THR-506) wrap branching encounters and are not in the static
  // pool; resolve them from the adapter so force-offer can host a divine vision.
  const deliveryDef = getDeliveryBeatById(beatId);
  if (deliveryDef) {
    return {
      next: offer(beats, deliveryDef, { kind: 'cadence' }, turn, ASCENDANT_BEAT_POOL.length, bound(deliveryDef), /*advanceSpine*/ false),
      def: deliveryDef,
    };
  }
  // Deepening beats (THR-613) are enqueued directly by `phaseAscendantProgression`, never
  // drawn — but `__DEBUG.fireBeat('beat.deepening.<reach>')` still needs to force-offer one
  // for browser-verifying the vignette. Bind nothing (they operate on the ascendant itself).
  const deepeningDef = getDeepeningBeatById(beatId);
  if (deepeningDef) {
    return {
      next: offer(beats, deepeningDef, deepeningDef.trigger, turn, ASCENDANT_DEEPENING_BEATS.length, [], /*advanceSpine*/ false),
      def: deepeningDef,
    };
  }
  // Milestone beats (THR-613) are likewise enqueued directly by `phaseAscendantProgression`
  // on a holdings threshold, never drawn — but `__DEBUG.fireBeat` must be able to force-offer
  // one to browser-verify the vignette + its card grant without farming three sources first.
  const milestoneDef = getMilestoneBeatById(beatId);
  if (milestoneDef) {
    return {
      next: offer(beats, milestoneDef, milestoneDef.trigger, turn, ASCENDANT_MILESTONE_BEATS.length, [], /*advanceSpine*/ false),
      def: milestoneDef,
    };
  }
  return null;
}

/**
 * Offer the opening spine beat at arrival, before any tick (THR-1716).
 *
 * Beat 0 ("Reach Down") is authored as due on turn 0, but the Director only runs
 * inside a tick and the world arrives paused — so the first beat waited behind a
 * Play button nothing pointed at. The UI arrival site (`useSimulation`'s initial
 * state) calls this once; `initializeGameState` deliberately does not, so the CLI
 * and every fixture keep a byte-identical tick-0 state.
 *
 * Offers only when all hold: beat state exists, the cursor is at 0, nothing is
 * pending, the cursor beat's trigger is satisfied now, and The First is not bonded
 * (on a pre-bonded route the Director settles Beat 0 as already played on the
 * first tick instead — THR-1786). Otherwise returns `{}`.
 * Draws no PRNG — it reuses `forceOfferBeatById`, the Director's spine branch.
 * Fail-soft: any error is traced and returns `{}`.
 */
export function offerArrivalSpineBeat(state: GameState): Partial<GameState> {
  const beats = state.ascendantBeats;
  if (!beats) return {};
  const turn = state.tick;
  try {
    if (beats.spineCursor !== 0 || beats.pending !== null) return {};
    const def = ASCENDANT_SPINE[0];
    if (!def || !isTriggerSatisfied(def.trigger, state, turn)) return {};
    if (firstIsBonded(state)) return {};
    const offered = forceOfferBeatById(beats, def.beatId, turn, state);
    if (!offered) return {};
    emitBeatTrace({
      tick: turn,
      category: 'beat.arrival_offer',
      beatId: def.beatId,
      summary: `opening beat offered at arrival: ${def.beatId}`,
    });
    return { ascendantBeats: offered.next };
  } catch {
    // Fail-soft: no offer at arrival. The Director still offers Beat 0 on the first
    // tick, and `getOpeningState().arrivalBeatOffered` reads false — the visible
    // signal. (No engine_warning here: that trace's interface is the hex-index one.)
    return {};
  }
}

/** Beat 0, "Reach Down" — the god spinning its first thread to The First. */
const OPENING_SPINE_BEAT_ID = 'beat.spine.opening';

/** The First's display name: the target of the ascendant's `the_first` thread edge. */
function firstName(state: GameState): string {
  const ascendantId = state.ascendantId;
  if (!ascendantId) return SETTLED_OPENING_FIRST_FALLBACK;
  const edge = state.graph
    .getOutgoingEdges(ascendantId, 'thread')
    .find(e => (e.properties as { courtPosition?: string }).courtPosition === 'the_first');
  const name = edge ? state.graph.getNode(edge.target)?.name : undefined;
  return name && name.trim() ? name : SETTLED_OPENING_FIRST_FALLBACK;
}

/**
 * Settle a spine beat as already played instead of offering it (THR-1786).
 *
 * Beat 0 ("Reach Down") narrates the god threading The First. On every route where
 * The First is bonded before the Director first runs (`?seeded`, `?spawn=`,
 * `?testavatar`, the warm start), offering it told the player to bind a mortal it
 * was already bound to. This offers the beat through {@link forceOfferBeatById} and
 * resolves it through {@link resolvePendingBeat} — the same writer a clicked beat
 * uses, so grants, seeding, the `BeatRecord`, cursor advance and the spine-pacing
 * stamps are identical — then writes one chronicle line and a
 * `beat.settled_as_played` trace.
 *
 * Only Beat 0 writes the "thread already holds" line; a later gift settled this way
 * (the warm start, THR-1787) is announced by its own gift-placement line, if any.
 *
 * Draws no PRNG. Fail-soft: on any error, or if the beat does not resolve, returns
 * `{}` so the caller offers the beat normally.
 */
export function settleSpineBeatAsPlayed(
  state: GameState,
  beatId: string,
  turn: number,
  reason: BeatSettledAsPlayedTrace['reason'] = 'first_already_bonded',
): Partial<GameState> {
  const beats = state.ascendantBeats;
  if (!beats || beats.pending !== null) return {};
  try {
    const offered = forceOfferBeatById(beats, beatId, turn, state);
    if (!offered) return {};
    const resolution = resolvePendingBeat({ ...state, tick: turn, ascendantBeats: offered.next });
    if (!resolution.resolved) return {};
    const events: TickEvent[] = beatId === OPENING_SPINE_BEAT_ID
      ? [{
        id: `beat_settled_${beatId}_${turn}`,
        tick: turn,
        type: 'narrative',
        message: SETTLED_OPENING_CHRONICLE_LINE.replace('{firstName}', firstName(state)),
        significance: SETTLED_OPENING_SIGNIFICANCE,
      }]
      : [];
    const next = resolution.state;
    emitBeatTrace({
      tick: turn,
      category: 'beat.settled_as_played',
      beatId,
      reason,
      summary: `beat.settled_as_played: ${beatId} (${reason})`,
    });
    return {
      ascendantBeats: next.ascendantBeats,
      unlockedActionIds: next.unlockedActionIds,
      tickEvents: [...(next.tickEvents ?? []), ...events],
      recentEvents: [...(next.recentEvents ?? []), ...events].slice(-MAX_RECENT_EVENTS),
    };
  } catch (err) {
    emitTrace({
      tick: turn,
      category: 'engine_warning',
      summary: `settleSpineBeatAsPlayed error (${beatId}, turn ${turn}): ${err instanceof Error ? err.message : String(err)}`,
    });
    return {};
  }
}

export interface OpeningSettleResult {
  /** Merge into GameState: beats, unlocks and the events the settles wrote. Empty when nothing settled. */
  patch: Partial<GameState>;
  /** Spine beat ids settled, in order (Beat 0 first when it was still at the cursor). */
  settled: string[];
  /** The first requested beat that could not be settled, or null. It and later ones are offered normally. */
  failedBeatId: string | null;
}

/**
 * Settle the no-choice opening gifts before the warm-up's first tick (THR-1787).
 *
 * The warm start runs with no player acts, so the one-act pacing gate (THR-1647 S4)
 * would hold the gift chain at its start for seasons and hand it to the player at
 * arrival, which read as the tutorial repeating. Each beat in `beatIds` offers a
 * single call to action with no alternative, so settling it decides nothing the
 * player could have decided differently. Beat 0 is settled first if it is still at
 * the cursor (The First is bonded), because a spine beat only advances the cursor
 * when it is the cursor beat.
 *
 * Settles strictly in cursor order through {@link settleSpineBeatAsPlayed}; a beat
 * already behind the cursor is skipped. Stops at the first beat that is not at the
 * cursor or does not settle, which is then offered normally after arrival
 * (fail-soft). Requires a bonded First; returns an empty result otherwise.
 * Draws no PRNG. Seeding mutates `state.graph` in place, so the caller touches the world.
 */
export function settleOpeningSpineBeats(
  state: GameState,
  beatIds: readonly string[],
  turn: number = state.tick,
): OpeningSettleResult {
  const settled: string[] = [];
  if (!state.ascendantBeats || !firstIsBonded(state)) {
    return { patch: {}, settled, failedBeatId: beatIds[0] ?? null };
  }
  let working: GameState = state;
  const patch: Partial<GameState> = {};
  const settleOne = (beatId: string, reason: BeatSettledAsPlayedTrace['reason']): boolean => {
    const result = settleSpineBeatAsPlayed(working, beatId, turn, reason);
    if (!result.ascendantBeats) return false;
    Object.assign(patch, result);
    working = { ...working, ...result };
    settled.push(beatId);
    return true;
  };

  const cursorBeatId = () => ASCENDANT_SPINE[working.ascendantBeats?.spineCursor ?? -1]?.beatId;
  if (cursorBeatId() === OPENING_SPINE_BEAT_ID && !settleOne(OPENING_SPINE_BEAT_ID, 'first_already_bonded')) {
    return { patch, settled, failedBeatId: beatIds[0] ?? null };
  }
  for (const beatId of beatIds) {
    const spineIdx = ASCENDANT_SPINE.findIndex(b => b.beatId === beatId);
    const cursor = working.ascendantBeats?.spineCursor ?? -1;
    if (spineIdx >= 0 && spineIdx < cursor) continue; // already played
    if (spineIdx !== cursor || !settleOne(beatId, 'warm_start')) {
      return { patch, settled, failedBeatId: beatId };
    }
  }
  return { patch, settled, failedBeatId: null };
}

// ─── Spine pacing (THR-1647 S4) ──────────────────────────────────────────────

/**
 * Why the next spine gift is being held back, or `null` when it may be offered.
 * `min_turn` is the beat's own authored trigger; the other three are the S4 gates
 * that apply to gifts 1–4 only (Beat 0, "Reach Down", is paced by the turn alone).
 */
export type SpineGateReason = 'min_turn' | SpineDeferredTrace['reason'];

/** Tick the last spine gift resolved: the stamped field, else the newest spine record in history. */
export function lastSpineResolvedTick(beats: AscendantBeatState): number | null {
  if (beats.lastSpineResolvedTick !== undefined) return beats.lastSpineResolvedTick;
  for (let i = beats.history.length - 1; i >= 0; i--) {
    if (isSpineBeatId(beats.history[i].beatId)) return beats.history[i].resolvedTurn;
  }
  return null;
}

/**
 * The spine gate as a pure read (THR-1647 S4). For the beat at `beats.spineCursor`:
 *
 *  (a) its authored `minTurn` has passed (every spine beat);
 *  and, for gifts 1–4,
 *  (b) The First is bonded — every one of them references The First or grows from the bond;
 *  (c) `BEAT_MIN_GAP` ticks have run since the last spine gift resolved;
 *  (d) the player has acted `SPINE_PLAYER_ACTS_BETWEEN_GIFTS` times since that
 *      gift resolved, or `SPINE_IDLE_FALLBACK_TICKS` ticks have run since it did.
 *
 * Returns `null` when the spine is exhausted, too — callers read `nextSpineBeat`
 * for that. A missing `playerActCount` reads as 0, so an old save still gets its
 * gifts through the idle fallback.
 */
export function spineGateBlockedBy(state: GameState): SpineGateReason | null {
  const beats = state.ascendantBeats;
  if (!beats || beats.spineCursor < 0 || beats.spineCursor >= ASCENDANT_SPINE.length) return null;
  const def = ASCENDANT_SPINE[beats.spineCursor];
  const turn = state.tick;
  if (!isTriggerSatisfied(def.trigger, state, turn)) return 'min_turn';
  if (beats.spineCursor === 0) return null;
  if (!firstIsBonded(state)) return 'first_not_bonded';
  const resolvedAt = lastSpineResolvedTick(beats);
  if (resolvedAt === null) return null; // no gift resolved yet to space from
  const since = turn - resolvedAt;
  if (since < BEAT_MIN_GAP) return 'min_gap';
  const actsSince = (state.playerActCount ?? 0) - (beats.playerActCountAtLastSpine ?? 0);
  if (actsSince >= SPINE_PLAYER_ACTS_BETWEEN_GIFTS) return null;
  if (since >= SPINE_IDLE_FALLBACK_TICKS) return null;
  return 'awaiting_player_act';
}

/**
 * Emit `beat.spine_deferred` once per (beatId, reason) and return the beats state
 * carrying the new dedup key — or the same object when this deferral was already
 * traced, so a held gift does not churn state every tick.
 */
function noteSpineDeferral(
  beats: AscendantBeatState,
  beatId: string,
  reason: SpineDeferredTrace['reason'],
  turn: number,
): AscendantBeatState {
  const key = `${beatId}|${reason}`;
  if (beats.lastSpineDeferralKey === key) return beats;
  emitBeatTrace({
    tick: turn,
    category: 'beat.spine_deferred',
    beatId,
    reason,
    summary: `beat.spine_deferred: ${beatId} held (${reason})`,
  });
  return { ...beats, lastSpineDeferralKey: key };
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
      const blockedBy = spineGateBlockedBy(state);
      if (blockedBy === null) {
        // THR-1786: The First is already bonded, so Beat 0 — the god threading The First —
        // has in effect been played. Settle it in place rather than ask the player again.
        // Fail-soft: an empty settle falls through to the normal offer.
        if (def.beatId === OPENING_SPINE_BEAT_ID && firstIsBonded(state)) {
          const settled = settleSpineBeatAsPlayed(state, def.beatId, turn);
          if (settled.ascendantBeats) return settled;
        }
        // Spine beats are not `unintroduced_group`-eligible, so binding is empty — but
        // route through `bindBeatSubject` for one offer path (THR-522).
        return { ascendantBeats: offer(beats, def, def.trigger, turn, 0, bindBeatSubject(def, state), /*advanceSpine*/ true) };
      }
      // Spine waiting — keep the opening clean, do not interleave pool beats. A gift
      // that is due but held for the player (THR-1647 S4) says why, once per reason.
      if (blockedBy !== 'min_turn') {
        const next = noteSpineDeferral(beats, def.beatId, blockedBy, turn);
        return next === beats ? {} : { ascendantBeats: next };
      }
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
    // THR-1650: a delivery beat plays its encounter on The First, so one whose source
    // cannot bind The First (none bonded, nowhere to anchor, wrong kind of place) is
    // never offered — withheld here, not shown and then failed.
    const deliveryCandidates = eligibleDeliveryBeats(beats.history.map(h => h.beatId));
    const bindableDelivery = withholdUnbindableDeliveryBeats(deliveryCandidates, state, turn);
    const pool = [...ASCENDANT_BEAT_POOL, ...bindableDelivery];
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
    // Bind the specific subject (the un-introduced culture/faction for introduction beats)
    // so the offered beat can name it; other beats bind nothing (THR-522).
    const boundNodeIds = bindBeatSubject(def, state);
    // poolSize reflects the *eligible* pool (plan §3.2) for inspectability.
    return {
      ascendantBeats: offer(beats, def, { kind: 'cadence' }, turn, eligible.length, boundNodeIds, /*advanceSpine*/ false),
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
    // Carry the subject the beat operated on so later introduction draws exclude an
    // already-introduced group and the debug surface can name what each beat touched (THR-522).
    boundNodeIds: [...beats.pending.boundNodeIds],
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

/**
 * Look a beat up across every catalogue: the scripted spine, the static cadence pool, the
 * delivery adapter, and the god-side Deepening beats (THR-613). Deepening beats are enqueued
 * directly by `phaseAscendantProgression` (they never ride the Director's draw), so without
 * this branch `resolvePendingBeat` would skip an enqueued Deepening as `missing_template` and
 * the tier-crossing vignette would never reach the player.
 */
function findBeatDefinition(beatId: string): BeatDefinition | null {
  return (
    ASCENDANT_SPINE.find(b => b.beatId === beatId) ??
    ASCENDANT_BEAT_POOL.find(b => b.beatId === beatId) ??
    getDeliveryBeatById(beatId) ??
    getDeepeningBeatById(beatId) ??
    getMilestoneBeatById(beatId) ??
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

/**
 * Run a resolved beat's matched `UnifiedActionTemplate` aftermath through the existing
 * encounter aftermath resolver (THR-522, plan §4.1–§4.2). This is the "richer contract" the
 * THR-517 resolve path lacked: a beat template can now carry `unlock_action` /
 * `encounter_seed` / structural graph-op aftermath on its `aftermathConfig.fallback.reactions`,
 * and beat resolution executes it — instead of capability being expressible only through the
 * descriptor `grantsActionIds`. The systemic-wiring-guide thesis applied to beats: content
 * reaches the engine's dynamic capabilities rather than hardcoding.
 *
 * A beat is addressed to the god, not a mortal encounter, so we synthesize a minimal,
 * already-resolved `UnifiedAction` whose actor is the bound subject (the introduced group,
 * when present) and fall back to the ascendant — aftermath effects that resolve a target
 * relative to the actor (e.g. faction reputation on the introduced group) then land on the
 * right node. The synthesized action is never stored in `state.unifiedActions`; it exists
 * only to give the resolver an encounter context.
 *
 * Additive: a template with no `aftermathConfig` reactions is a no-op (the documented
 * fallback), so every shipping beat keeps its prior grant-only behavior. Fail-soft (NFP #4):
 * wrapped so a thrown resolver never wedges the beat — returns the input state + a
 * touched-nothing summary on error.
 */
function runBeatTemplateAftermath(
  state: GameState,
  beatId: string,
  boundNodeIds: readonly string[],
  template: UnifiedActionTemplate,
  runtime: SimulationRuntime,
  turn: number,
): { state: GameState; touchedWorld: boolean; touchedStructure: boolean } {
  const reactions: readonly EncounterAftermathReaction[] = template.aftermathConfig?.fallback.reactions ?? [];
  if (reactions.length === 0) return { state, touchedWorld: false, touchedStructure: false };
  const subjectId = boundNodeIds[0] ?? state.ascendantId ?? '';
  const action: UnifiedAction = {
    actionId: `beat:${beatId}`,
    actorId: subjectId,
    templateId: beatId,
    targetId: subjectId,
    scale: 'cosmic',
    source: 'system',
    startTick: turn,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
  };
  let working = state;
  let touchedWorld = false;
  let touchedStructure = false;
  try {
    for (const reaction of reactions) {
      const { state: next, mutationSummary } = applyEncounterAftermathReaction(
        working, action, reaction, turn, runtime,
      );
      working = next;
      touchedWorld = touchedWorld || mutationSummary.touchedWorld;
      touchedStructure = touchedStructure || mutationSummary.touchedStructure;
    }
  } catch (err) {
    emitTrace({
      tick: turn,
      category: 'engine_warning',
      summary: `runBeatTemplateAftermath error (${beatId}, turn ${turn}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
    return { state, touchedWorld: false, touchedStructure: false };
  }
  return { state: working, touchedWorld, touchedStructure };
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
  opts: {
    chosenActionId?: string;
    outcome?: string;
    /** Runtime for the template-aftermath path (THR-522). Omitted by headless callers → no aftermath runs. */
    runtime?: SimulationRuntime;
    /** Injected `getUnifiedTemplateById` so the engine can fetch the matched content template
     *  for its aftermath without importing the template registry (mirrors `templateResolver`). */
    templateProvider?: (templateId: string) => UnifiedActionTemplate | undefined;
  } = {},
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

    // THR-523: dynamic reach-signature grant. Beat 4 carries `grantsReachSignature:
    // 'primary'`, the reach-signature pool beat carries `'secondary'`; the id is resolved
    // per-run from the ascendant's ranked domain affinities (a static grant can't name it).
    // Orthogonal to the static grants above and unconditional for a `selection` beat — the
    // player's god-path choice and their signature both land. Fail-soft no-op when the slot
    // has no ranked reach or no authored signature.
    if (def.grantsReachSignature) {
      const signatureId = resolveReachSignatureGrant(state, def.grantsReachSignature);
      if (signatureId && !granted.includes(signatureId)) {
        granted = [...granted, signatureId];
      }
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

    // Seed the promised graph state (throne / artifact) for beats that carry a
    // `seedsGraph` tag (THR-520, plan §4.1). Mutates `state.graph` in place (shared
    // mutable world graph) and reports the touched node ids for the BeatRecord. Beats
    // without the tag — the pre-THR-520 contract — seed nothing here.
    const seedResult = def.seedsGraph ? seedBeatGraph(state, def, turn) : undefined;
    const seededNodeIds = seedResult?.seededNodeIds ?? [];
    if (seededNodeIds.length > 0 && opts.runtime) touchWorld(opts.runtime);

    // Run the matched content template's aftermath (THR-522): the richer resolve contract
    // where a beat template carries `unlock_action` / `encounter_seed` / structural graph-op
    // aftermath on its `aftermathConfig.fallback.reactions`, executed through the existing
    // encounter aftermath resolver. Additive + fail-soft: only fires when a `runtime` +
    // `templateProvider` are supplied (the UI/debug path) and the template declares aftermath
    // reactions; every shipping beat declares none, so the grant-only fallback stands.
    let workingState: GameState = { ...state, unlockedActionIds: nextUnlocked };

    // THR-1606: a spine gift that placed something says so — a chronicle-tier line
    // with a toast naming the place or the bearer, linked to it. Before this, the
    // seat and the artifact mutated the graph with no event, so the gift was silent.
    const placement = seedResult?.placement;
    if (placement) {
      const giftEvent: TickEvent = {
        id: `beat_gift_${pending.beatId}_${turn}`,
        tick: turn,
        type: 'narrative',
        message: placement.line,
        significance: GIFT_PLACEMENT_SIGNIFICANCE,
        notification: { channel: 'toast' },
        ...(placement.anchorKind === 'agent'
          ? { actorId: placement.anchorId }
          : { refs: [{ kind: 'location' as const, id: placement.anchorId }] }),
      };
      workingState = {
        ...workingState,
        tickEvents: [...(workingState.tickEvents ?? []), giftEvent],
        recentEvents: [...(workingState.recentEvents ?? []), giftEvent].slice(-MAX_RECENT_EVENTS),
      };
      emitTrace({
        tick: turn,
        category: 'beat.gift_placed',
        beatId: pending.beatId,
        placedNodeId: placement.placedNodeId,
        anchorId: placement.anchorId,
        summary: `beat.gift_placed: ${pending.beatId} → ${placement.line}`,
      });
    }
    const contentTemplate = def.templateId && opts.templateProvider
      ? opts.templateProvider(def.templateId)
      : undefined;
    // THR-1650: never for a `delivery` beat. Its template is a mortal branching encounter
    // whose own aftermath runs through the veil against The First when Witness plays it;
    // running its fallback reactions here wrote that scene's consequences against the god
    // (the THR-1526 untrue-scene class). Retired, not rerouted.
    if (opts.runtime && contentTemplate && pending.kind !== 'delivery') {
      const after = runBeatTemplateAftermath(
        workingState, def.beatId, pending.boundNodeIds, contentTemplate, opts.runtime, turn,
      );
      workingState = after.state;
      if (after.touchedWorld) touchWorld(opts.runtime);
      if (after.touchedStructure) touchStructure(opts.runtime);
    }

    const outcome = opts.outcome ?? (pending.kind === 'selection' ? 'chosen' : 'received');
    const resolvedCore = resolveAscendantBeat(beats, {
      outcome,
      grantedActionIds: granted,
      seededNodeIds,
      turn,
    });
    // THR-1647 S4: the next spine gift is spaced from this moment — the tick and the
    // player's act count now — so acts taken after this resolve are what count.
    const resolvedBeats: AscendantBeatState = isSpineBeatId(pending.beatId)
      ? {
        ...resolvedCore,
        lastSpineResolvedTick: turn,
        playerActCountAtLastSpine: state.playerActCount ?? 0,
      }
      : resolvedCore;
    return {
      state: { ...workingState, ascendantBeats: resolvedBeats },
      resolved: true,
      beatId: pending.beatId,
      grantedActionIds: granted,
      outcome,
      message: `Resolved '${pending.beatId}' → ${outcome}${granted.length ? ` (+${granted.join(', ')})` : ''}${seededNodeIds.length ? ` [seeded ${seededNodeIds.join(', ')}]` : ''}`,
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
