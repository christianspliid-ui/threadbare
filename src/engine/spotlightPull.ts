/**
 * Spotlight pull — attention follows ambition (THR-1348).
 *
 * **The rule.** When an ambition whose template carries a `strategicProfile` is
 * assigned to a mortal below the spotlight tier, the holder is pulled into the
 * spotlight — promoted through `hydrateToTier` — and, to hold the deciding population
 * flat, one spotlight mortal steps back to `notable`. The world's builders become the
 * people the player can watch (Vision 00: a mortal is witnessed before their crisis
 * lands), and the attention budget the decision loop pays for does not grow.
 *
 * **Why here and not in the loop.** `phaseAgentDecision` runs the spotlight tier only.
 * An ambition held at `notable` or `ambient` never reaches the strategic board, is
 * never refused, and is never traced — THR-1329 measured a world where the whole
 * `merchant-expansion` family was unreachable on eleven seeds in twelve for exactly
 * this reason. Christian's ruling (attended chat, 2026-09-10) declined widening the
 * loop (unmeasured per-tick cost; builds things nobody sees) and declined report-only
 * (the gap is real). The pull runs **at assignment, once** — inside
 * `assignAmbitionToActor`, the single funnel every route onto the graph passes.
 *
 * **Pulled once.** The pull stamps `spotlightPulledTick` and `spotlightPullDemotedId`
 * on the pulled actor *before* the promotion, so a throw between the two cannot leave
 * a mortal pullable twice. That mark is what stops the promote / demote churn the
 * re-evaluation loop would otherwise drive, and it is the ledger the census reads.
 *
 * **The budget is a swap.** The demotion candidate set is every spotlight individual
 * that is not the avatar, has no incoming `thread` edge whose `courtPosition` is not
 * `'dormant'` (never a followed or retinue mortal — the ruling's hard line), commands
 * no army and holds no seat (a faction's leader or commander), holds no active
 * strategic-profiled ambition, is not mid-encounter and holds no running
 * undertaking, and was not itself pulled. Ordered least-recently-witnessed →
 * lowest `importance` → id: a total order, never graph iteration order (NFP #3). If
 * the set is empty the pull may run net-additive up to the world's overflow allowance
 * (`SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE` of the deciding population, capped by
 * `SPOTLIGHT_AMBITION_PULL_MAX`); past that it is refused with reason `budget`.
 *
 * Every refusal is a reason on the node and in the trace, never a throw (NFP #4).
 */
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { GameState, TickEvent } from '../types/gameState';
import type { SpotlightTier } from '../types/npc';
import type { SpotlightPullRefusal, SpotlightPullTrace } from '../types/trace';
import { hydrateToTier, demoteToTier } from './npcGraduation';
import { isAutonomousDecisionActor } from './strategicKindReachability';
import { findAmbitionTemplateById } from '../data/ambition-templates';
import { getAmbitionTemplateId } from './ambitionShape';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from '../lib/prng';
import {
  SPOTLIGHT_AMBITION_PULL_ENABLED,
  SPOTLIGHT_AMBITION_PULL_MAX,
  SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE,
  SPOTLIGHT_WITNESS_WINDOW_TICKS,
  SPOTLIGHT_PULL_EVENT_SIGNIFICANCE,
} from '../data/agent-behavior-constants';

// ─── Node properties (the ledger) ─────────────────────────────────

/** Tick the mortal was pulled into the spotlight. Present ⇒ never pulled again. */
export const SPOTLIGHT_PULLED_TICK_KEY = 'spotlightPulledTick';
/** The spotlight mortal demoted to make room, or `null` for a net-additive pull. */
export const SPOTLIGHT_PULL_DEMOTED_ID_KEY = 'spotlightPullDemotedId';
/** The ambition template whose assignment pulled the mortal. */
export const SPOTLIGHT_PULL_TEMPLATE_ID_KEY = 'spotlightPullTemplateId';
/** Last refusal, so the ledger can name who was left silenced and why. */
export const SPOTLIGHT_PULL_REFUSED_REASON_KEY = 'spotlightPullRefusedReason';
export const SPOTLIGHT_PULL_REFUSED_TICK_KEY = 'spotlightPullRefusedTick';
/**
 * Written at encounter resolution (`unifiedActionResolution`) on the actor and the
 * bound cast — the tick the player could last have seen this mortal in a scene. A
 * mortal that has never resolved in an encounter has no value and sorts *first* for
 * demotion: the ruling's order made reachable, not a fail-soft default.
 */
export const LAST_WITNESSED_TICK_KEY = 'lastWitnessedTick';

// ─── Types ─────────────────────────────────────────────────────────

export interface SpotlightPullOptions {
  /**
   * A stream for the hydration draws. Absent → derived from `(seed, tick, actorId)`,
   * which is what every production caller does: a pull that consumed a phase's own
   * stream would shift every draw after it, so a world with the pull would differ
   * from one without it everywhere rather than only where a pull ran. Tests pass one.
   */
  readonly rng?: () => number;
  /** World seed, used only to derive a stream when `rng` is absent. */
  readonly seed?: number;
  /**
   * Mortals mid-encounter or holding a running undertaking — never demoted mid-act.
   * Build with `collectBusyActorIds(state)`; a caller without a state passes nothing
   * and the rule fails open (a candidate may be demoted mid-encounter), which is the
   * additive direction for callers that predate the pull.
   */
  readonly busyActorIds?: ReadonlySet<string>;
}

export type SpotlightPullResult =
  | {
      readonly pulled: true;
      readonly fromTier: 'ambient' | 'notable';
      readonly demotedId: string | null;
      /** The one chronicle line — the caller appends it to the tick's events. */
      readonly event: TickEvent;
    }
  | {
      readonly pulled: false;
      /**
       * `not_applicable` covers the silent cases — template without a strategic
       * profile, holder already in the spotlight, actor missing. The four
       * `SpotlightPullRefusal` reasons are traced and stamped on the node.
       */
      readonly reason: SpotlightPullRefusal | 'not_applicable';
    };

export interface SpotlightLedger {
  readonly pulled: ReadonlyArray<{ id: string; templateId: string; tick: number; demotedId: string | null }>;
  /** Outstanding net-additive pulls still in the spotlight — what `budget` counts. */
  readonly overflow: number;
  /** How many net-additive pulls this world may hold at once — the share of its deciding population, capped. */
  readonly overflowAllowance: number;
  readonly refused: ReadonlyArray<{ id: string; reason: SpotlightPullRefusal; tick: number }>;
}

// ─── Helpers ───────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** A reproducible stream for a caller that holds none (NFP #3). */
export function deriveSpotlightPullRng(seed: number | undefined, tick: number, actorId: string): () => number {
  return mulberry32(((seed ?? 0) ^ Math.imul(tick, 7919) ^ hashString(actorId)) | 0);
}

/**
 * Mortals that must not be demoted mid-act: an unresolved unified action, or an
 * active undertaking on the strategic board.
 */
export function collectBusyActorIds(state: Pick<GameState, 'unifiedActions' | 'strategicState'>): Set<string> {
  const busy = new Set<string>();
  for (const a of state.unifiedActions ?? []) {
    if (!a.resolved) busy.add(a.actorId);
  }
  for (const p of state.strategicState?.projects ?? []) {
    if (p.status === 'active') busy.add(p.actorId);
  }
  return busy;
}

function isAvatar(graph: WorldGraph, id: string): boolean {
  return graph.getOutgoingEdges(id, 'avatar_of').length > 0;
}

/** An incoming `thread` edge whose court position is not `'dormant'` — followed or retinue. */
function isThreaded(graph: WorldGraph, id: string): boolean {
  return graph.getIncomingEdges(id, 'thread').some(
    e => (e.properties as Record<string, unknown> | undefined)?.courtPosition !== 'dormant',
  );
}

/**
 * Leads a standing army (an incoming `commanded_by` edge). Mercenary commanders and
 * garrison captains are deciders on purpose (THR-1437 counted on their undertakings)
 * and carry no ambition of their own — which made them the first mortals the swap
 * reached for on every seed. Commanding is an ongoing act, like a running
 * undertaking: never interrupted by a demotion.
 */
function commandsArmy(graph: WorldGraph, id: string): boolean {
  return graph.getIncomingEdges(id, 'commanded_by').length > 0;
}

/**
 * Holds a seat: a faction's seated leader (`leads`) or its commander (`member_of`
 * with `role: 'commander'` — the seat worldgen gives the mercenary commanders and
 * the garrison captains, THR-1437). The `commanded_by` edge above dies with the
 * host; the seat does not, and a seated mortal who has no ambition of their own
 * (a captain wants what the faction wants, by design) was otherwise the swap's
 * first pick on every seed — measured on the small map as the growth-paying
 * completions halving (19 → 9 over 150 ticks, seed 42) once the captains stepped back.
 */
const SEATED_MEMBER_ROLES: ReadonlySet<unknown> = new Set(['commander', 'leader']);

function holdsSeat(graph: WorldGraph, id: string): boolean {
  if (graph.getOutgoingEdges(id, 'leads').length > 0) return true;
  return graph.getOutgoingEdges(id, 'member_of').some(
    e => SEATED_MEMBER_ROLES.has((e.properties as Record<string, unknown> | undefined)?.role),
  );
}

/** Holds an active ambition whose template carries a `strategicProfile`. */
export function holdsStrategicAmbition(graph: WorldGraph, id: string): boolean {
  return graph.getOutgoingEdges(id, 'pursues').some(e => {
    if ((e.properties as Record<string, unknown> | undefined)?.status !== 'active') return false;
    const templateId = getAmbitionTemplateId(graph.getNode(e.target));
    return templateId !== undefined && findAmbitionTemplateById(templateId)?.strategicProfile !== undefined;
  });
}

/** Can this mortal generate a strategic candidate at all? A capability map with at least one positive reach. */
export function hasCapabilityPath(node: GraphNode | undefined): boolean {
  const caps = node?.properties.domainCapabilities as Record<string, unknown> | undefined;
  if (!caps || typeof caps !== 'object') return false;
  return Object.values(caps).some(v => typeof v === 'number' && v > 0);
}

function witnessAge(node: GraphNode, tick: number): number {
  const last = node.properties[LAST_WITNESSED_TICK_KEY];
  return typeof last === 'number' ? Math.max(0, tick - last) : Number.POSITIVE_INFINITY;
}

/**
 * Order two demotion candidates: least recently witnessed first. A mortal never
 * witnessed sorts before one witnessed long ago; two witnessed inside
 * `SPOTLIGHT_WITNESS_WINDOW_TICKS` tie on witness and fall to `importance`, then id.
 * A total order — the same graph in any iteration order yields the same first pick.
 */
export function compareDemotionCandidates(a: GraphNode, b: GraphNode, tick: number): number {
  const ageA = witnessAge(a, tick);
  const ageB = witnessAge(b, tick);
  const recentA = ageA <= SPOTLIGHT_WITNESS_WINDOW_TICKS;
  const recentB = ageB <= SPOTLIGHT_WITNESS_WINDOW_TICKS;
  if (recentA !== recentB) return recentA ? 1 : -1;
  if (!recentA && ageA !== ageB) return ageB - ageA; // older witness first (Infinity = never)
  const impA = (a.properties.importance as number | undefined) ?? 0;
  const impB = (b.properties.importance as number | undefined) ?? 0;
  if (impA !== impB) return impA - impB;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * The spotlight mortals that may step back, best candidate first. Pure — reads the
 * graph, writes nothing.
 */
export function demotionCandidates(
  graph: WorldGraph,
  tick: number,
  options: { readonly busyActorIds?: ReadonlySet<string>; readonly exclude?: ReadonlySet<string> } = {},
): GraphNode[] {
  const out: GraphNode[] = [];
  for (const node of graph.getNodesByType('actor')) {
    if (!isAutonomousDecisionActor(node)) continue;
    if (options.exclude?.has(node.id)) continue;
    if (typeof node.properties[SPOTLIGHT_PULLED_TICK_KEY] === 'number') continue;
    if (options.busyActorIds?.has(node.id)) continue;
    if (isAvatar(graph, node.id)) continue;
    if (isThreaded(graph, node.id)) continue;
    if (commandsArmy(graph, node.id)) continue;
    if (holdsSeat(graph, node.id)) continue;
    if (holdsStrategicAmbition(graph, node.id)) continue;
    out.push(node);
  }
  return out.sort((a, b) => compareDemotionCandidates(a, b, tick));
}

/** Pulled mortals still in the spotlight who displaced nobody — the overflow `budget` counts. */
export function countOverflowPulls(graph: WorldGraph): number {
  let n = 0;
  for (const node of graph.getNodesByType('actor')) {
    if (typeof node.properties[SPOTLIGHT_PULLED_TICK_KEY] !== 'number') continue;
    if (node.properties[SPOTLIGHT_PULL_DEMOTED_ID_KEY] !== null) continue;
    if (((node.properties.spotlightTier as SpotlightTier | undefined) ?? 'spotlight') !== 'spotlight') continue;
    n++;
  }
  return n;
}

/**
 * The net-additive pulls this world may hold at once: a share of its deciding
 * population (the attention budget the swap protects), less the overflow already
 * standing, floored and capped by `SPOTLIGHT_AMBITION_PULL_MAX`. A flat two crowded a
 * small world's checkpointed work; the share gives a small world one and a medium
 * world two.
 */
export function overflowAllowance(graph: WorldGraph): number {
  const deciding = graph.getNodesByType('actor').filter(isAutonomousDecisionActor).length;
  const base = Math.max(0, deciding - countOverflowPulls(graph));
  return Math.max(0, Math.min(SPOTLIGHT_AMBITION_PULL_MAX, Math.floor(base * SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE)));
}

// ─── Per-tick trace accumulator ────────────────────────────────────
//
// One aggregate `spotlight_pull` trace per tick, never per pull (THR-822's rule).
// Pulls happen inside whichever phase assigns the ambition, so the accumulator is
// module-scoped bookkeeping — not world state — flushed by `phaseAmbitionProgress`
// at the end of every tick and, as a safety net, by the first record of a later tick.

interface PendingTrace {
  tick: number;
  graph: WorldGraph;
  pulled: Array<SpotlightPullTrace['pulled'][number]>;
  refused: Array<SpotlightPullTrace['refused'][number]>;
}

let pending: PendingTrace | null = null;

function record(graph: WorldGraph, tick: number, fn: (p: PendingTrace) => void): void {
  if (pending && pending.tick !== tick) flushSpotlightPullTrace();
  if (!pending) pending = { tick, graph, pulled: [], refused: [] };
  fn(pending);
}

/** Emit this tick's aggregate trace, if any pull ran or was refused. */
export function flushSpotlightPullTrace(): void {
  if (!pending) return;
  const p = pending;
  pending = null;
  if (p.pulled.length === 0 && p.refused.length === 0) return;
  const autonomousAfter = p.graph.getNodesByType('actor').filter(isAutonomousDecisionActor).length;
  const trace: Omit<SpotlightPullTrace, 'id' | 'timestamp'> = {
    tick: p.tick,
    category: 'spotlight_pull',
    summary:
      `${p.pulled.length} pulled into the spotlight` +
      (p.pulled.some(x => x.demotedId !== null) ? ` (${p.pulled.filter(x => x.demotedId !== null).length} swapped)` : '') +
      `, ${p.refused.length} refused; ${autonomousAfter} deciding after`,
    pulled: p.pulled,
    refused: p.refused,
    autonomousAfter,
  };
  emitTrace(trace);
}

/** Discard any pending aggregate — tests only. */
export function resetSpotlightPullTrace(): void {
  pending = null;
}

// ─── The pull ──────────────────────────────────────────────────────

function refuse(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  tick: number,
  reason: SpotlightPullRefusal,
): SpotlightPullResult {
  graph.updateNode(actorId, {
    properties: { [SPOTLIGHT_PULL_REFUSED_REASON_KEY]: reason, [SPOTLIGHT_PULL_REFUSED_TICK_KEY]: tick },
  });
  record(graph, tick, p => p.refused.push({ agentId: actorId, templateId, reason }));
  return { pulled: false, reason };
}

/**
 * Pull an ambition holder into the spotlight if the ambition is strategic and the
 * holder sits below the tier. Called from `assignAmbitionToActor` after the
 * `pursues` edge is written; never from the decision loop, never per tick.
 */
export function pullHolderIntoSpotlight(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  tick: number,
  options: SpotlightPullOptions = {},
): SpotlightPullResult {
  const node = graph.getNode(actorId);
  if (!node || node.properties.actorType !== 'individual') return { pulled: false, reason: 'not_applicable' };

  const template = findAmbitionTemplateById(templateId);
  if (!template?.strategicProfile) return { pulled: false, reason: 'not_applicable' };

  const fromTier = (node.properties.spotlightTier as SpotlightTier | undefined) ?? 'spotlight';
  if (fromTier === 'spotlight') return { pulled: false, reason: 'not_applicable' };

  if (!SPOTLIGHT_AMBITION_PULL_ENABLED) return refuse(graph, actorId, templateId, tick, 'disabled');
  if (typeof node.properties[SPOTLIGHT_PULLED_TICK_KEY] === 'number') {
    return refuse(graph, actorId, templateId, tick, 'already_pulled');
  }

  const candidates = demotionCandidates(graph, tick, {
    busyActorIds: options.busyActorIds,
    exclude: new Set([actorId]),
  });
  const demotedId = candidates[0]?.id ?? null;
  if (demotedId === null && countOverflowPulls(graph) >= overflowAllowance(graph)) {
    return refuse(graph, actorId, templateId, tick, 'budget');
  }

  // The mark first, then the promotion: a throw between the two leaves a mortal
  // marked and un-promoted (visible in the ledger) rather than pullable twice.
  graph.updateNode(actorId, {
    properties: {
      [SPOTLIGHT_PULLED_TICK_KEY]: tick,
      [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: demotedId,
      [SPOTLIGHT_PULL_TEMPLATE_ID_KEY]: templateId,
    },
  });

  const rng = options.rng ?? deriveSpotlightPullRng(options.seed, tick, actorId);
  hydrateToTier(graph, actorId, 'spotlight', rng);

  if (!hasCapabilityPath(graph.getNode(actorId))) {
    // A pulled mortal with nothing to generate candidates from would sit in the loop
    // failing every reach floor silently — the lair-elite defect in another coat.
    // Revert the tier, demote nobody, and clear the mark so the refusal reads true.
    graph.updateNode(actorId, {
      properties: {
        spotlightTier: fromTier,
        [SPOTLIGHT_PULLED_TICK_KEY]: undefined,
        [SPOTLIGHT_PULL_DEMOTED_ID_KEY]: undefined,
        [SPOTLIGHT_PULL_TEMPLATE_ID_KEY]: undefined,
      },
    });
    return refuse(graph, actorId, templateId, tick, 'no_capability_path');
  }

  if (demotedId !== null) demoteToTier(graph, demotedId, 'notable');

  const name = graph.getNode(actorId)?.name ?? actorId;
  const ambitionName = template.displayName ?? templateId;
  const event: TickEvent = {
    id: `spotlight_pull_${actorId}_${tick}`,
    tick,
    type: 'narrative',
    message: `${name} sets their mind to ${ambitionName}.`,
    significance: SPOTLIGHT_PULL_EVENT_SIGNIFICANCE,
    actorId,
  };

  record(graph, tick, p => p.pulled.push({ agentId: actorId, templateId, fromTier, demotedId }));
  return { pulled: true, fromTier, demotedId, event };
}

// ─── Witness ───────────────────────────────────────────────────────

/**
 * Record that these mortals were witnessed this tick — called from the encounter
 * resolution site that mints the Event node, for the actor, an actor-typed target,
 * and the bound cast. Not at bind time: stamping every extra in a town at bind
 * would make them all "recently witnessed". Fail-soft on ids that are not actors.
 */
export function markWitnessed(graph: WorldGraph, tick: number, ids: Iterable<string>): number {
  let stamped = 0;
  for (const id of new Set(ids)) {
    const node = graph.getNode(id);
    if (!node || node.type !== 'actor') continue;
    graph.updateNode(id, { properties: { [LAST_WITNESSED_TICK_KEY]: tick } });
    stamped++;
  }
  return stamped;
}

// ─── The ledger ────────────────────────────────────────────────────

/** Everything the pull wrote on the graph — the census's and the debug bridge's read. */
export function readSpotlightLedger(graph: WorldGraph): SpotlightLedger {
  const pulled: Array<{ id: string; templateId: string; tick: number; demotedId: string | null }> = [];
  const refused: Array<{ id: string; reason: SpotlightPullRefusal; tick: number }> = [];
  for (const node of graph.getNodesByType('actor')) {
    const pulledTick = node.properties[SPOTLIGHT_PULLED_TICK_KEY];
    if (typeof pulledTick === 'number') {
      pulled.push({
        id: node.id,
        templateId: String(node.properties[SPOTLIGHT_PULL_TEMPLATE_ID_KEY] ?? ''),
        tick: pulledTick,
        demotedId: (node.properties[SPOTLIGHT_PULL_DEMOTED_ID_KEY] as string | null | undefined) ?? null,
      });
    }
    const reason = node.properties[SPOTLIGHT_PULL_REFUSED_REASON_KEY];
    if (typeof reason === 'string') {
      refused.push({
        id: node.id,
        reason: reason as SpotlightPullRefusal,
        tick: (node.properties[SPOTLIGHT_PULL_REFUSED_TICK_KEY] as number | undefined) ?? 0,
      });
    }
  }
  const byTickThenId = <T extends { tick: number; id: string }>(a: T, b: T): number =>
    a.tick - b.tick || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return {
    pulled: pulled.sort(byTickThenId),
    overflow: countOverflowPulls(graph),
    overflowAllowance: overflowAllowance(graph),
    refused: refused.sort(byTickThenId),
  };
}
