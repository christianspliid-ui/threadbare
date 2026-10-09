/**
 * The threading rite — one writer for every thread the god binds (THR-1644 S1).
 *
 * Plan: `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md`. Decisions:
 *
 * - **D1 — one rite, one writer.** `applyThreadingRite` lands a rite's outcomes
 *   (value-pole shift, spark reach investment, scar, bond reception) on an
 *   *existing* individual. The meeting creates its soul, then calls it; the card
 *   route calls it on the mortal the card threaded.
 * - **D2 — rites shrink.** `riteShapeFor` reads how many mortals the god has
 *   ever threaded: the first thread (and any new First) plays the full rite,
 *   threads 2..`RITE_SHORT_MAX_ORDINAL` the short one, later threads the bond
 *   alone.
 * - **D3 — the first threaded is The First.** `resolveThreadWrite` runs at the
 *   card's thread write: when the god holds no First, the thread is written at
 *   `the_first` with the two journey fields the meeting writes, so every First
 *   perk keyed on that court position carries over with no per-perk change.
 *
 * This module imports nothing from `meetingEncounter.ts` — the meeting imports
 * it, and so does `graphOpExecutor.ts`, which sits on the action-resolution
 * import path the meeting module already depends on. The fallback that rolls a
 * bond with no hand lives in `threadingRiteQueue.ts` for the same reason.
 *
 * Fail-soft throughout (NFP #4): every step is guarded, nothing here throws.
 */

import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import type { CourtPosition } from '../types/influence';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { CooperationStrategy } from '../types/disposition';
import type { SphereName } from '../types/index';
import type {
  BondOutcome,
  FormativeOutcome,
  MeetingCandidateGender,
  NarrativeCandidate,
} from '../types/meetingEncounter';
import type { BondReception } from '../data/meeting-nudge-constants';
import { MEETING_QUINTESSENCE_FLOOR } from '../data/meeting-nudge-constants';
import { QUINTESSENCE_DEFAULT } from '../types/quintessence';
import { RITE_SHORT_MAX_ORDINAL, RITE_SURFACE_ENABLED } from '../data/threading-rite-constants';
import { getAgentPortraitUrlFromProperties } from '../data/portrait-assets';
import { emitTrace } from './traceBuffer';
import { grantFirstMark, type FirstMarkSkip } from './firstMark';

// ─── Types ────────────────────────────────────────────────────────

/**
 * The four rite shapes (D2). `full_meeting` is Meet The First itself;
 * `full_no_sensing` is a card-route First (the god already chose, so no
 * sensing beat); `short` is one test and the bond; `bond_only` the bond alone.
 */
export type RiteShape = 'full_meeting' | 'full_no_sensing' | 'short' | 'bond_only';

/** Why a rite resolved with no hand played. */
export type RiteFallbackReason = 'dismissed' | 'agent_missing' | 'queue_overflow' | 'no_surface';

/** Why `courtPositionForNewThread` returned what it did. */
export type CourtPositionReason = 'no_first' | 'first_held' | 'first_cooldown';

/** A rite owed for a thread already written — waits on `GameState` for its surface. */
export interface PendingThreadingRite {
  readonly agentId: string;
  readonly ascendantId: string;
  /** This thread's place in the god's count of threads ever bound (1 = first). */
  readonly ordinal: number;
  readonly shape: RiteShape;
  /** The tick the thread was written — also seeds the rite's rolls. */
  readonly tick: number;
}

/**
 * Transient marker the thread write leaves on the edge, read and cleared the
 * same tick by the orchestrator's rite drain (`collectPendingRites`). The
 * executor holds no `GameState`, so the edge carries the hand-off.
 */
export interface RitePendingMarker {
  readonly ordinal: number;
  readonly shape: RiteShape;
  readonly tick: number;
}

export interface ApplyRiteInput {
  readonly agentId: string;
  readonly ascendantId: string;
  readonly tick: number;
  readonly shape: RiteShape;
  /** The thread's ordinal, when known — recorded on the god's `lastRite` for inspection. */
  readonly ordinal?: number;
  readonly viaMeeting: boolean;
  /** Formative outcomes, in play order. Empty for a bond-only or no-hand rite. */
  readonly formativeOutcomes?: readonly FormativeOutcome[];
  /** The bond outcome — every rite ends in one; absent only on a fail-soft path. */
  readonly bondOutcome?: BondOutcome;
  /** A reception already decided without a bond outcome in hand (the meeting's folded result). `bondOutcome` wins. */
  readonly reception?: BondReception;
  /**
   * The reach The First's mark is granted in (D5), when it is known without a
   * `spark` — the meeting, whose spark is already folded into the node, passes its
   * vision's reach here. Precedence: `markReach`, then `spark.reach`, then the
   * node's `primaryReach`, then its highest reach.
   */
  readonly markReach?: ReachDomain;
  /** The spark's reach investment (full shapes only), in the meeting's 0–1 units. */
  readonly spark?: { readonly reach: ReachDomain; readonly amount: number };
  /** Pole-shift scale: 1 for a soul the meeting invented, `RITE_EXISTING_MORTAL_SHIFT_SCALE` otherwise. */
  readonly shiftScale?: number;
  /** False for *Bond without a hand* and every engine-side fallback. */
  readonly handPlayed: boolean;
  readonly fallbackReason?: RiteFallbackReason;
  /**
   * The meeting folds its tests and spark into the result before the node is
   * written (`applyMeetingOutcomes`, scale 1), so steps 1–3 are already on the
   * node. True skips them here — the writer must never apply a shift twice.
   */
  readonly outcomesPrefolded?: boolean;
}

export interface PoleShiftRecord {
  readonly pair: string;
  readonly before: number;
  readonly after: number;
  readonly scale: number;
}

export interface ApplyRiteResult {
  readonly applied: boolean;
  readonly poleShifts: readonly PoleShiftRecord[];
  readonly reachInvestment?: { readonly reach: ReachDomain; readonly amount: number };
  readonly quintessence?: { readonly before: number; readonly preClamp: number; readonly after: number };
  readonly reception?: BondReception;
  readonly markTraitId?: string;
  /** Why a First got no mark (D5): the switch is off, or the reach has no god-given trait. */
  readonly markSkipped?: FirstMarkSkip;
}

/** One rite a mortal took part in (individual property `riteHistory`), oldest first. */
export interface RiteHistoryEntry {
  readonly tick: number;
  readonly shape: RiteShape;
  readonly reception: BondReception;
}

/** The god's most recent rite (ascendant property `lastRite`), inspect-only. */
export interface LastRiteRecord {
  readonly agentId: string;
  readonly shape: RiteShape;
  readonly ordinal: number | null;
  readonly reception: BondReception | null;
  readonly markId: string | null;
  readonly tick: number;
}

// ─── Counting and shape (D2) ──────────────────────────────────────

/** A thread that bears a rite: to an individual who is not the god's own avatar or herald. */
function isRiteBearingThread(graph: WorldGraph, edge: GraphEdge): boolean {
  return graph.getNode(edge.target)?.properties.actorType === 'individual'
    && !isAvatarOf(graph, edge.target, edge.source);
}

/** Live rite-bearing `thread` edges from the god — the fallback count. */
function liveIndividualThreadCount(graph: WorldGraph, ascendantId: string): number {
  return graph.getOutgoingEdges(ascendantId, 'thread').filter(e => isRiteBearingThread(graph, e)).length;
}

/**
 * How many `thread` edges to individuals this god has ever written.
 *
 * Reads the ascendant's `threadsBoundCount` property, which every rite-bearing
 * thread write increments and a thread cut never decrements: the ordinal counts
 * rites the god has performed, not threads it holds. A world that predates the
 * property (or a seeded First written straight into the graph) falls back to
 * counting the live individual threads — so the seeded First counts.
 */
export function threadsBoundCount(graph: WorldGraph, ascendantId: string): number {
  const stored = graph.getNode(ascendantId)?.properties.threadsBoundCount;
  if (typeof stored === 'number' && Number.isFinite(stored)) return stored;
  return liveIndividualThreadCount(graph, ascendantId);
}

/**
 * Record one more thread bound and return its ordinal. Call AFTER the thread
 * edge is written: with no stored count, the live count already includes it.
 */
export function noteThreadBound(graph: WorldGraph, ascendantId: string): number {
  const ascendant = graph.getNode(ascendantId);
  if (!ascendant) return 1;
  const stored = ascendant.properties.threadsBoundCount;
  const next = typeof stored === 'number' && Number.isFinite(stored)
    ? stored + 1
    : Math.max(1, liveIndividualThreadCount(graph, ascendantId));
  ascendant.properties.threadsBoundCount = next;
  return next;
}

/**
 * D2 — the rite a thread plays.
 *
 * The meeting is always the full meeting. A thread that makes a new First plays
 * the full rite without sensing whatever its ordinal: after a Return the next
 * First is still "the first and richest instance" (executor call, recorded on
 * THR-1644). Otherwise the ordinal decides: up to `RITE_SHORT_MAX_ORDINAL` the
 * short rite, past it the bond alone.
 */
export function riteShapeFor(ordinal: number, viaMeeting: boolean, becomesFirst = ordinal <= 1): RiteShape {
  if (viaMeeting) return 'full_meeting';
  if (becomesFirst) return 'full_no_sensing';
  if (ordinal <= RITE_SHORT_MAX_ORDINAL) return 'short';
  return 'bond_only';
}

// ─── The First is the first (D3) ──────────────────────────────────

/** True when the god holds a `the_first` thread — `isFirstBonded`, restated here to keep this module off the meeting's import path. */
function holdsFirst(graph: WorldGraph, ascendantId: string): boolean {
  return graph.getOutgoingEdges(ascendantId, 'thread').some(e =>
    (e.properties.courtPosition as string | undefined) === 'the_first');
}

/**
 * D3 — the court position a new thread is written at.
 *
 * `the_first` when the god holds no First, else the card's own position. "Holds
 * a First" is exactly the meeting's own rule (`isFirstBonded`: a thread whose
 * `courtPosition` is `the_first`), so the two routes always agree on when the
 * slot is open. That includes the Dormant Thread card, which rewrites a First's
 * position to `dormant` and so frees the slot for the meeting and the card
 * alike (pre-existing for the meeting; pinned in `threadingRite.thr1644.test.ts`).
 * The Return cooldown that gates the meeting (`firstSlotCooldownUntil`) gates the
 * card the same way.
 */
export function courtPositionForNewThread(
  graph: WorldGraph,
  ascendantId: string,
  cardPosition: CourtPosition,
  tick = 0,
): { position: CourtPosition; reason: CourtPositionReason } {
  if (holdsFirst(graph, ascendantId)) return { position: cardPosition, reason: 'first_held' };
  const cooldownUntil = graph.getNode(ascendantId)?.properties.firstSlotCooldownUntil;
  if (typeof cooldownUntil === 'number' && tick < cooldownUntil) {
    return { position: cardPosition, reason: 'first_cooldown' };
  }
  return { position: 'the_first', reason: 'no_first' };
}

/** Dead by either marker the lifecycle writes (`groupQueries.isAgentGone`'s test). */
function isGone(props: Record<string, unknown>): boolean {
  return props.deceased === true || props.status === 'dead';
}

/** The avatar (and an avatar-class herald) is never a rite target. */
function isAvatarOf(graph: WorldGraph, nodeId: string, ascendantId: string): boolean {
  return graph.getOutgoingEdges(nodeId, 'avatar_of').some(e => e.target === ascendantId);
}

/** What `resolveThreadWrite` decided, for the executor to finish after the edge lands. */
export interface ThreadWriteResolution {
  readonly properties: Record<string, unknown>;
  readonly cardPosition: CourtPosition;
  readonly resolvedPosition: CourtPosition;
  readonly reason: CourtPositionReason;
}

/**
 * The card route's thread write, before the edge is added (D3 + the real tick).
 *
 * Returns `null` when the thread is not a rite-bearing one — the target is not
 * an individual, the source is not this god, or the target is the god's own
 * avatar — and the executor writes the template's properties untouched.
 * Otherwise returns the properties to write: the resolved court position, the
 * journey fields the meeting writes when the thread makes a First, and the real
 * `establishedTick` (the templates hard-code 0).
 */
export function resolveThreadWrite(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  templateProperties: Record<string, unknown>,
  tick: number,
): ThreadWriteResolution | null {
  if (graph.getNode(ascendantId)?.properties.actorType !== 'ascendant') return null;
  const target = graph.getNode(agentId);
  if (target?.properties.actorType !== 'individual') return null;
  // A dead mortal still in the graph is no rite target, and never a First:
  // crowning a corpse would retire the meeting and wake the doom for nobody.
  if (isGone(target.properties)) return null;
  if (isAvatarOf(graph, agentId, ascendantId)) return null;

  const cardPosition = (templateProperties.courtPosition as CourtPosition | undefined) ?? 'watched';
  const { position, reason } = courtPositionForNewThread(graph, ascendantId, cardPosition, tick);
  const properties: Record<string, unknown> = {
    ...templateProperties,
    courtPosition: position,
    establishedTick: tick,
  };
  if (position === 'the_first') {
    // The two fields the meeting writes and the card did not (THR-1715): a
    // First is born asking, so the journey engine and the encounter veil see her.
    properties.storyPhase = 'call';
    properties.attentionMode = 'pause';
  }
  return { properties, cardPosition, resolvedPosition: position, reason };
}

/**
 * Finish a rite-bearing thread write once the edge exists: count it, stamp the
 * rite shape and the pending marker on the edge, and trace the D3 verdict.
 * Returns the marker so a caller with `GameState` can queue it directly.
 */
export function completeThreadWrite(
  graph: WorldGraph,
  edgeId: string,
  ascendantId: string,
  agentId: string,
  resolution: ThreadWriteResolution,
  tick: number,
): RitePendingMarker | null {
  const edge = graph.getEdge(edgeId);
  if (!edge) return null;
  const ordinal = noteThreadBound(graph, ascendantId);
  const shape = riteShapeFor(ordinal, false, resolution.resolvedPosition === 'the_first');
  const marker: RitePendingMarker = { ordinal, shape, tick };
  edge.properties.riteShape = shape;
  edge.properties.ritePending = marker;

  emitTrace({
    category: 'thread.court_position_resolved',
    tick,
    agentId,
    summary: `thread to ${agentId}: ${resolution.cardPosition} → ${resolution.resolvedPosition} (${resolution.reason}); thread #${ordinal}, rite ${shape}`,
    ascendantId,
    cardPosition: resolution.cardPosition,
    resolvedPosition: resolution.resolvedPosition,
    reason: resolution.reason,
    threadsBoundCount: ordinal,
  });
  return marker;
}

/** The cards whose thread write bears a rite (the Agent Thread pair). */
export const RITE_BEARING_THREAD_TEMPLATE_IDS: ReadonlySet<string> = new Set([
  'bind_thread_agent',
  'bind_thread_agent_strong',
]);

/**
 * True when casting `templateId` on `targetId` will open a rite (S2): the card is
 * an Agent Thread, the rite surface is on, the target is a rite-bearing mortal
 * (`resolveThreadWrite`'s own test), and the god does not already hold a thread
 * to them. The cast path reads it to suppress the generic cast receipt — the
 * rite tells the fact once (PC-5).
 */
export function castOpensRite(
  graph: WorldGraph,
  ascendantId: string,
  templateId: string,
  targetId: string,
  surfaceEnabled = RITE_SURFACE_ENABLED,
): boolean {
  if (!surfaceEnabled || !RITE_BEARING_THREAD_TEMPLATE_IDS.has(templateId)) return false;
  if (findThreadEdge(graph, ascendantId, targetId)) return false;
  return resolveThreadWrite(graph, ascendantId, targetId, {}, 0) !== null;
}

// ─── The one writer (D1) ──────────────────────────────────────────

function findThreadEdge(graph: WorldGraph, ascendantId: string, agentId: string): GraphEdge | undefined {
  return graph.getOutgoingEdges(ascendantId, 'thread').find(e => e.target === agentId);
}

/**
 * D1 — apply a rite's outcomes to an EXISTING individual.
 *
 * Steps, each skipped when its outcome is absent:
 * 1. value-pole shift per formative test, × `shiftScale`, clamped to [−1, 1];
 * 2. spark reach investment (`amount × 100`, the meeting's arithmetic);
 * 3. scar: quintessence − erosion, floored at `MEETING_QUINTESSENCE_FLOOR` (a
 *    mortal already below the floor is never raised by it);
 * 4. bond reception onto the thread edge;
 * 5. The First's mark (S3), when the thread's court position is `the_first`;
 * then the rite's bookkeeping: `riteShape` on the edge, `lastRite` on the
 * ascendant, and one `rite.applied` trace.
 *
 * Steps 1–3 are skipped when `outcomesPrefolded` (the meeting already folded
 * them into the node it wrote). The writer holds no runtime, so it cannot call
 * `touchStructure`: its callers own the touch — `bondFirstFromMeeting` touches
 * after the meeting, and the card route's tick ends with the world touched.
 */
export function applyThreadingRite(graph: WorldGraph, input: ApplyRiteInput): ApplyRiteResult {
  const node = graph.getNode(input.agentId);
  if (!node || isGone(node.properties)) {
    const missed: ApplyRiteResult = { applied: false, poleShifts: [], reception: input.bondOutcome?.reception ?? input.reception };
    emitRiteApplied(input, missed, 'agent_missing');
    return missed;
  }

  const props = node.properties;
  const poleShifts: PoleShiftRecord[] = [];
  let reachInvestment: ApplyRiteResult['reachInvestment'];
  let quintessence: ApplyRiteResult['quintessence'];

  if (!input.outcomesPrefolded) {
    // Step 1 — value poles.
    const scale = input.shiftScale ?? 1;
    const outcomes = input.formativeOutcomes ?? [];
    const profile = props.axiologicalProfile as AxiologicalProfile | undefined;
    if (profile && outcomes.length > 0) {
      const next: AxiologicalProfile = { ...profile };
      for (const o of outcomes) {
        const before = next[o.valuePair as ValuePair] ?? 0;
        const after = Math.max(-1, Math.min(1, before + o.shift * scale));
        next[o.valuePair as ValuePair] = after;
        poleShifts.push({ pair: o.valuePair, before, after, scale });
      }
      props.axiologicalProfile = next;
    }

    // Step 2 — spark reach investment.
    const caps = props.domainCapabilities as Record<string, number> | undefined;
    if (input.spark && caps) {
      const amount = Math.round(input.spark.amount * 100);
      caps[input.spark.reach] = Math.min(100, (caps[input.spark.reach] ?? 0) + amount);
      reachInvestment = { reach: input.spark.reach, amount };
    }

    // Step 3 — scar.
    const erosion = outcomes.reduce((sum, o) => sum + (o.quintessenceErosion ?? 0), 0);
    if (erosion > 0) {
      const before = typeof props.quintessence === 'number' ? props.quintessence : QUINTESSENCE_DEFAULT;
      const preClamp = before - erosion;
      const after = Math.min(before, Math.max(MEETING_QUINTESSENCE_FLOOR, preClamp));
      props.quintessence = after;
      quintessence = { before, preClamp, after };
    }
  }

  // Step 4 — bond reception, and the rite's own mark on the thread.
  const edge = findThreadEdge(graph, input.ascendantId, input.agentId);
  const reception = input.bondOutcome?.reception ?? input.reception;
  if (edge) {
    if (reception !== undefined) edge.properties.bondReception = reception;
    edge.properties.riteShape = input.shape;
  }

  // Step 5 — The First's mark (D5, S3 THR-1755).
  let markTraitId: string | undefined;
  let markSkipped: FirstMarkSkip | undefined;
  if (edge && (edge.properties.courtPosition as string | undefined) === 'the_first') {
    const reach = input.markReach ?? input.spark?.reach ?? markReachFromNode(props);
    const grant = grantFirstMark(graph, input.agentId, reach, input.tick);
    markTraitId = grant.markId;
    markSkipped = grant.skipped;
  }

  // The node's `riteHistory` — the sheet's "Bound in spring, Year 1 — took your
  // thread in doubt." line reads its newest entry (S2, THR-1754). Inspect-only.
  if (reception !== undefined) {
    const prior = Array.isArray(props.riteHistory) ? (props.riteHistory as RiteHistoryEntry[]) : [];
    const entry: RiteHistoryEntry = { tick: input.tick, shape: input.shape, reception };
    props.riteHistory = [...prior, entry];
  }

  // Inspect-only: the god's most recent rite, read by `__DEBUG.getThreadingRite()`.
  const ascendant = graph.getNode(input.ascendantId);
  if (ascendant) {
    const lastRite: LastRiteRecord = {
      agentId: input.agentId,
      shape: input.shape,
      ordinal: input.ordinal ?? null,
      reception: reception ?? null,
      markId: markTraitId ?? null,
      tick: input.tick,
    };
    ascendant.properties.lastRite = lastRite;
  }

  const result: ApplyRiteResult = { applied: true, poleShifts, reachInvestment, quintessence, reception, markTraitId, markSkipped };
  emitRiteApplied(input, result, input.fallbackReason);
  return result;
}

/**
 * The mark's reach for a mortal with no spark in hand: their `primaryReach`,
 * else their highest `domainCapabilities` reach (ties broken by `REACH_DOMAINS`
 * order, so the pick is deterministic). Undefined when the node has neither.
 */
function markReachFromNode(props: Record<string, unknown>): ReachDomain | undefined {
  const primary = props.primaryReach as ReachDomain | undefined;
  if (primary && (REACH_DOMAINS as readonly string[]).includes(primary)) return primary;
  const caps = props.domainCapabilities as Record<string, number> | undefined;
  if (!caps) return undefined;
  let best: ReachDomain | undefined;
  let bestValue = -Infinity;
  for (const r of REACH_DOMAINS) {
    const v = caps[r];
    if (typeof v === 'number' && v > bestValue) { best = r; bestValue = v; }
  }
  return best;
}

function emitRiteApplied(
  input: ApplyRiteInput,
  result: ApplyRiteResult,
  fallbackReason: RiteFallbackReason | undefined,
): void {
  emitTrace({
    category: 'rite.applied',
    tick: input.tick,
    agentId: input.agentId,
    summary: `rite ${input.shape} for ${input.agentId}: ${result.applied ? 'applied' : 'nothing written'}`
      + `${result.reception ? `, received in ${result.reception}` : ''}`
      + `${input.handPlayed ? '' : ' (no hand)'}${fallbackReason ? ` [${fallbackReason}]` : ''}`,
    shape: input.shape,
    viaMeeting: input.viaMeeting,
    handPlayed: input.handPlayed,
    outcomesPrefolded: input.outcomesPrefolded === true,
    poleShifts: result.poleShifts.map(p => ({ ...p })),
    ...(result.reachInvestment ? { reachInvestment: { ...result.reachInvestment } } : {}),
    ...(result.quintessence ? { quintessence: { ...result.quintessence } } : {}),
    ...(result.reception ? { reception: result.reception } : {}),
    ...(result.markTraitId ? { markTraitId: result.markTraitId } : {}),
    ...(result.markSkipped ? { markSkipped: result.markSkipped } : {}),
    ...(fallbackReason ? { fallbackReason } : {}),
  });
}

// ─── Adapter for the rite surface (S2) ────────────────────────────

const ADAPTER_FALLBACK_GRADIENT = 'linear-gradient(160deg, #3a3346 0%, #1d1a24 100%)';

/**
 * Render an existing mortal as a `NarrativeCandidate`, so the MeetTheFirst
 * beat components can show the mortal the god actually threaded (S2): their
 * real name, portrait and reaches — never an invented soul. Returns `null` for
 * a missing or non-individual node; the surface falls back to the node name.
 */
export function candidateFromAgent(graph: WorldGraph, agentId: string): NarrativeCandidate | null {
  const node = graph.getNode(agentId);
  if (!node || node.properties.actorType !== 'individual') return null;
  const p = node.properties;
  const caps = (p.domainCapabilities as Record<string, number> | undefined) ?? {};
  const reachCapabilities = Object.fromEntries(
    REACH_DOMAINS.map(r => [r, Math.max(0, Math.min(1, (caps[r] ?? 0) / 100))]),
  ) as Record<ReachDomain, number>;
  const ranked = [...REACH_DOMAINS].sort((a, b) => reachCapabilities[b] - reachCapabilities[a]);
  const primaryReach = (p.primaryReach as ReachDomain | undefined) ?? ranked[0];
  const secondaryReach = (p.secondaryReach as ReachDomain | undefined)
    ?? ranked.find(r => r !== primaryReach) ?? primaryReach;
  const gender = p.gender === 'female' || p.gender === 'male' ? (p.gender as MeetingCandidateGender) : undefined;
  return {
    tempId: agentId,
    name: node.name,
    archetypeId: String(p.narrativeArchetype ?? ''),
    cultureId: String(p.cultureId ?? ''),
    primaryReach,
    secondaryReach,
    sphere: (p.sphere as SphereName | undefined) ?? 'spirit',
    vignetteText: '',
    epithet: '',
    // The sheet's own resolver: a bespoke portrait, else the archetype portrait —
    // so the rite shows the same face the agent sheet does (PC-6).
    imageAssetPath: getAgentPortraitUrlFromProperties(p) ?? '',
    placeholderGradient: ADAPTER_FALLBACK_GRADIENT,
    ...(gender ? { gender } : {}),
    axiologicalSeed: { ...((p.axiologicalProfile as AxiologicalProfile | undefined) ?? {}) } as AxiologicalProfile,
    reachCapabilities,
    cooperationStrategy: (p.cooperationStrategy as CooperationStrategy | undefined) ?? 'tit-for-tat',
    appearanceSeed: typeof p.appearanceSeed === 'number' ? p.appearanceSeed : 0,
  };
}
