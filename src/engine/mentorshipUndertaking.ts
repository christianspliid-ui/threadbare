/**
 * Mentorship as an undertaking (THR-1292 §3 — the review addendum's fold).
 *
 * `phaseMentorship` used to run as orchestrator phase 2.33, one tick behind
 * `phaseInitiativeProgress` (2.32), and read its state out of the backing
 * `initiative.train-apprentice` record. Both of those are retired, so the arc
 * now rides the undertaking checkpoint pass (2a.55) instead: the same `mentors`
 * edge, the same five terminal arcs, driven by checkpoint bands rather than by
 * a second phase inspecting a first phase's leftovers.
 *
 * ## What the fold preserves, deliberately
 *
 * The `mentors` edge is the durable relationship and keeps its whole vocabulary
 * (`offered → training → graduated/estranged`), its bond quality as the
 * terminal-arc discriminator, its mastery-trait grant, its four encounter seeds
 * with their **load-bearing seed labels**, and separation past
 * `MENTORSHIP_MAX_SEPARATION_HEXES` ending the arc as Dissolution. Pairing
 * eligibility is preserved too — but as **one** function, where it used to be
 * duplicated between `phaseMentorship.ts` and `initiativeCandidates.ts`.
 *
 * ## What it rewires, and why each was a defect
 *
 * - **Bond drift reads the band directly.** It used to piggyback on phase 2.32
 *   having pushed a checkpoint record with `tick === state.tick` into a shared
 *   array — a same-tick ordering contract between two phases, invisible in either
 *   file's signature. Now `driftBondFromCheckpoint` takes the effect.
 * - **The terminal arc fires on an explicit signal.** It used to infer completion
 *   from the backing initiative having *disappeared* (`phaseMentorship.ts:253-259`),
 *   which cannot distinguish "completed" from "cleaned up after a crash" and so
 *   resolved every vanished initiative as a graduation-eligible completion.
 * - **The deadlock dies with it.** `markInitiativeFailed` set `status = 'failed'`
 *   and trusted phase 2.32 to clean up; 2.32 only ever cleared `activeInitiative`
 *   on its *own* failure checks, so a mentorship-side failure left a permanently
 *   non-active initiative pinned to the agent, blocking every future one. It was
 *   unreachable only because the wealth floor meant nothing ever started. The fold
 *   must not reproduce it: failure here ends the undertaking through the same
 *   `status: 'failed'` the runtime already drains.
 *
 * NFP #3 (Determinism): the bootstrap's apprentice pick draws from the caller's
 * seeded stream. NFP #4 (Fail-soft): every entry point is try/caught per edge.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { GraphNode, GraphEdge, MentorsEdgeProperties } from '../types/graph';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { StrategicProjectRuntime, UndertakingCheckpointEffect } from '../types/strategicAction';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import { computeCapability, computeTier } from './domainCapability';
import { getAgentLocationId, getAgentsAtLocation } from './graphQueries';
import { resolveToParentLocation } from './sublocationShape';
import { hexDistance } from '../lib/hexMath';
import { emitTrace } from './traceBuffer';
import { isAgentGone } from './groups/groupQueries';
import { resolveMentorship } from './mentorshipOutcomes';
import {
  ENABLE_MENTORSHIP,
  MENTOR_MIN_TIER,
  APPRENTICE_MIN_TIER,
  APPRENTICE_MAX_TIER,
  MENTORSHIP_MAX_SEPARATION_HEXES,
  MILESTONE_THRESHOLDS,
  BOND_QUALITY_INITIAL,
  BOND_DRIFT_ON_SUCCESS,
  BOND_DRIFT_ON_FAILURE,
  SEVER_BOND_QUALITY_FLOOR,
} from '../data/mentorship-constants';

/**
 * The folded template id. Exported so the pairing gate, the fold and the tests all
 * name it once — a second spelling is how the old duplication started.
 */
export const MENTORSHIP_TEMPLATE_ID = 'strategic_train_apprentice';

/**
 * Milestone encounter templates, one per `MILESTONE_THRESHOLDS` entry.
 * The seed labels below are load-bearing — content matches on them.
 */
const MILESTONE_TEMPLATE_IDS = [
  'mentorship.first-lesson',     // 0.25
  'mentorship.the-test',         // 0.50
  'mentorship.the-breakthrough', // 0.75
] as const;

// ─── Eligibility — the single copy (was duplicated in two modules) ───

export interface ApprenticePick {
  readonly apprenticeId: string;
  readonly domain: ReachDomain;
}

/**
 * Every (apprentice, domain) pair this mentor could legally take on, at this
 * moment, at their resolved parent location.
 *
 * This is the **one** implementation. `phaseMentorship.ts:361-400` and
 * `initiativeCandidates.ts:139-161` each carried a copy, and they had already
 * drifted: only one of them excluded non-`individual` actors, so the scorer would
 * happily propose a mentorship the runtime then refused to bootstrap.
 */
export function findEligibleApprentices(
  graph: WorldGraph,
  mentorId: string,
): ApprenticePick[] {
  const mentorLocId = getAgentLocationId(graph, mentorId);
  if (!mentorLocId) return [];
  // Resolve through the sublocation shape (THR-1183): two agents in different rooms
  // of the same settlement are colocated for teaching purposes.
  const parentLocId = resolveToParentLocation(graph, graph.getNode(mentorLocId))?.id ?? mentorLocId;

  const picks: ApprenticePick[] = [];
  const colocated = getAgentsAtLocation(graph, parentLocId).filter(a => a.id !== mentorId);

  for (const domain of REACH_DOMAINS) {
    if (computeTier(computeCapability(graph, mentorId, domain)) < MENTOR_MIN_TIER) continue;

    for (const cand of colocated) {
      if (cand.properties.actorType !== 'individual') continue;
      const apprTier = computeTier(computeCapability(graph, cand.id, domain));
      if (apprTier < APPRENTICE_MIN_TIER || apprTier > APPRENTICE_MAX_TIER) continue;
      if (hasActiveMentorship(graph, cand.id)) continue;
      picks.push({ apprenticeId: cand.id, domain });
    }
  }
  return picks;
}

/** Whether this agent is already someone's apprentice (one active mentorship each). */
export function hasActiveMentorship(graph: WorldGraph, apprenticeId: string): boolean {
  return graph.getIncomingEdges(apprenticeId, 'mentors').some(e => {
    const phase = e.properties.phase as string | undefined;
    return phase === 'offered' || phase === 'training';
  });
}

// ─── Bootstrap — mint the edge when the undertaking starts ───────────

/**
 * Create the `mentors` edge for a freshly started mentorship undertaking.
 *
 * Returns `null` when no eligible apprentice is present. The caller fails the
 * undertaking on `null` — the pairing gate in candidate generation makes that
 * rare, but a tick can move someone between proposal and start.
 */
export function bootstrapMentorship(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  tick: number,
  rng: () => number,
): { edge: GraphEdge; pick: ApprenticePick; events: TickEvent[]; seeds: PendingEncounterSeed[] } | null {
  const picks = findEligibleApprentices(graph, project.actorId);
  if (picks.length === 0) return null;

  const pick = picks[Math.min(Math.floor(rng() * picks.length), picks.length - 1)];
  const mentorNode = graph.getNode(project.actorId);
  const apprenticeNode = graph.getNode(pick.apprenticeId);

  const edgeProps: MentorsEdgeProperties = {
    domain: pick.domain,
    progress: 0,
    phase: 'offered',
    startedTick: tick,
    lessonsCompleted: 0,
    bondQuality: readExistingSentiment(graph, project.actorId, pick.apprenticeId) ?? BOND_QUALITY_INITIAL,
    undertakingId: project.projectId,
  };

  const edgeId = `mentors_${project.actorId}_${pick.apprenticeId}_${tick}`;
  graph.addEdge({
    id: edgeId,
    source: project.actorId,
    target: pick.apprenticeId,
    type: 'mentors',
    properties: edgeProps as unknown as Record<string, unknown>,
  });

  emitTrace({
    category: 'mentorship_offered',
    tick,
    agentId: pick.apprenticeId,
    mentorId: project.actorId,
    apprenticeId: pick.apprenticeId,
    domain: pick.domain,
    undertakingId: project.projectId,
    summary: `${mentorNode?.name ?? 'A mentor'} offers to teach ${apprenticeNode?.name ?? 'an apprentice'} in ${pick.domain}`,
  });

  const edge = graph.getEdge(edgeId);
  if (!edge) return null;

  return {
    edge,
    pick,
    events: [{
      id: `mentorship_offer_${edgeId}`,
      tick,
      type: 'agent_action',
      message: `${mentorNode?.name ?? 'A mentor'} offers to take ${apprenticeNode?.name ?? 'an apprentice'} on as an apprentice in ${pick.domain}.`,
      significance: 0.5,
      actorId: project.actorId,
    }],
    seeds: [buildSystemSeed('mentorship.the-offer', pick.apprenticeId, tick, 'mentorship_offer')],
  };
}

// ─── Per-checkpoint advancement ─────────────────────────────────────

export interface MentorshipCheckpointResult {
  readonly events: TickEvent[];
  readonly seeds: PendingEncounterSeed[];
  /**
   * Set when the mentorship itself demands the undertaking end — separation, a
   * divine sever, or a lost participant. The runtime fails the project on it,
   * which is what makes the terminal arc an *explicit* signal.
   */
  readonly forceFailReason?: 'apprentice_separation' | 'divine_sever' | 'participant_lost';
}

/**
 * Advance the mentorship arc for one resolved checkpoint.
 *
 * `effect` is the checkpoint's band effect, which is the whole input the old
 * same-tick array read was reaching for. `progress`/`progressRequired` come from
 * the undertaking record, so the edge's own `progress` stays a projection of the
 * undertaking rather than a second source of truth.
 */
export function advanceMentorshipCheckpoint(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  effect: UndertakingCheckpointEffect,
  tick: number,
): MentorshipCheckpointResult {
  const events: TickEvent[] = [];
  const seeds: PendingEncounterSeed[] = [];

  const edge = findMentorshipEdge(graph, project);
  if (!edge) return { events, seeds };

  const props = edge.properties as Partial<MentorsEdgeProperties>;
  const phase = props.phase ?? 'offered';
  if (phase === 'graduated' || phase === 'estranged') return { events, seeds };

  const mentorNode = graph.getNode(edge.source);
  const apprenticeNode = graph.getNode(edge.target);

  // ── Lost participant ────────────────────────────────────────────
  //
  // Asked through `isAgentGone`, not through node-absence. The retired phase tested
  // `!graph.getNode(id)` — but removing a node takes its edges with it, so by the
  // time a participant is truly absent this edge no longer exists to be inspected,
  // and the branch could not fire. `deceased` is the flag the engine actually sets
  // (THR-479 keeps mythic echoes in the graph forever), and `isAgentGone` still
  // treats a missing node as gone, so this covers both.
  if (isAgentGone(mentorNode) || isAgentGone(apprenticeNode)) {
    edge.properties.phase = 'estranged';
    edge.properties.undertakingId = undefined;
    emitTrace({
      category: 'mentorship_severed',
      tick,
      agentId: edge.target,
      mentorId: edge.source,
      apprenticeId: edge.target,
      reason: 'mentor_lost',
      bondQuality: props.bondQuality ?? 0,
      summary: `${apprenticeNode?.name ?? 'An apprentice'} loses their mentor`,
    });
    if (!mentorNode && apprenticeNode) {
      events.push({
        id: `mentorship_orphan_${edge.id}_${tick}`,
        tick,
        type: 'agent_action',
        // TODO(THR-76): orphaned-apprentice arc hook — THR-76 consumes this edge state.
        message: `${apprenticeNode.name} is left without a teacher.`,
        significance: 0.65,
        actorId: edge.target,
      });
    }
    return { events, seeds, forceFailReason: 'participant_lost' };
  }

  // ── Divine sever — force the Falling Out arc ────────────────────
  if (props.severedByDivineWill === true) {
    edge.properties.bondQuality = SEVER_BOND_QUALITY_FLOOR;
    edge.properties.severedByDivineWill = undefined;
    emitTrace({
      category: 'mentorship_severed',
      tick,
      agentId: edge.target,
      mentorId: edge.source,
      apprenticeId: edge.target,
      reason: 'divine_sever',
      bondQuality: SEVER_BOND_QUALITY_FLOOR,
      summary: `${apprenticeNode.name}'s bond with ${mentorNode.name} severed by divine will`,
    });
    return { events, seeds, forceFailReason: 'divine_sever' };
  }

  // ── Separation ──────────────────────────────────────────────────
  if (isSeparated(graph, edge.source, edge.target)) {
    return { events, seeds, forceFailReason: 'apprentice_separation' };
  }

  // ── Progress projection ─────────────────────────────────────────
  const oldProgress = props.progress ?? 0;
  const newProgress = Math.min(1, project.progress / Math.max(1, project.progressRequired));
  edge.properties.progress = newProgress;

  if (phase === 'offered' && newProgress > 0) {
    edge.properties.phase = 'training';
    emitTrace({
      category: 'mentorship_started',
      tick,
      agentId: edge.target,
      mentorId: edge.source,
      apprenticeId: edge.target,
      domain: (props.domain as ReachDomain) ?? 'heart',
      summary: `${apprenticeNode.name} begins training under ${mentorNode.name}`,
    });
  }

  // ── Bond drift, straight off the band ───────────────────────────
  edge.properties.bondQuality = driftBondFromCheckpoint(props.bondQuality ?? 0, effect);

  // ── Milestone seeds ─────────────────────────────────────────────
  const oldLessons = props.lessonsCompleted ?? 0;
  for (let i = 0; i < MILESTONE_THRESHOLDS.length; i++) {
    const threshold = MILESTONE_THRESHOLDS[i];
    if (oldProgress >= threshold || newProgress < threshold || oldLessons > i) continue;
    edge.properties.lessonsCompleted = i + 1;
    seeds.push(buildSystemSeed(
      MILESTONE_TEMPLATE_IDS[i],
      edge.target,
      tick,
      `mentorship_lesson_${i + 1}`,
    ));
    emitTrace({
      category: 'mentorship_lesson',
      tick,
      agentId: edge.target,
      mentorId: edge.source,
      apprenticeId: edge.target,
      lessonNumber: i + 1,
      progress: newProgress,
      bondQuality: (edge.properties.bondQuality as number) ?? 0,
      summary: `${apprenticeNode.name} reaches lesson ${i + 1} under ${mentorNode.name}`,
    });
  }

  return { events, seeds };
}

/**
 * Bond drift for one checkpoint band.
 *
 * Exported so the contract test can assert it is total over
 * `UndertakingCheckpointEffect` rather than re-typing the mapping and agreeing
 * with itself. `advance_at_cost` still drifts *upward* — the apprentice learned
 * the thing; what it cost was paid elsewhere.
 */
export function driftBondFromCheckpoint(
  bondQuality: number,
  effect: UndertakingCheckpointEffect,
): number {
  const drift = effect === 'halt' ? -BOND_DRIFT_ON_FAILURE : BOND_DRIFT_ON_SUCCESS;
  return clamp(bondQuality + drift, -1, 1);
}

// ─── Terminal arc — on an explicit signal, never on absence ──────────

/**
 * Run the terminal arc for an undertaking that has ended.
 *
 * `status` is the undertaking's own verdict. There is no inference here, which is
 * the whole point of the rewire: the retired phase resolved a *vanished*
 * initiative as a completion, so a crash-cleared record graduated an apprentice.
 */
export function resolveMentorshipUndertaking(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
  status: 'completed' | 'failed',
  tick: number,
): { events: TickEvent[]; seeds: PendingEncounterSeed[] } {
  const edge = findMentorshipEdge(graph, project);
  if (!edge) return { events: [], seeds: [] };

  const phase = (edge.properties.phase as string | undefined) ?? 'offered';
  if (phase === 'graduated' || phase === 'estranged') return { events: [], seeds: [] };

  const result = resolveMentorship(graph, edge, status, tick);
  return { events: result.newEvents, seeds: result.newEncounterSeeds };
}

// ─── Divine sever plumbing (rehomed from phase 2.33) ─────────────────

/**
 * Translate `pendingMentorshipSever`, set by the Sever the Bond divine action,
 * onto the agent's active `mentors` edge. The flag may sit on either side of the
 * relationship, which is why both directions are read.
 */
export function applyPendingMentorshipSevers(graph: WorldGraph): void {
  for (const actor of graph.getNodesByType('actor')) {
    const props = actor.properties as Record<string, unknown>;
    if (props.pendingMentorshipSever !== true) continue;
    const active = (e: GraphEdge) => {
      const phase = e.properties.phase as string | undefined;
      return phase === 'offered' || phase === 'training';
    };
    const target = graph.getOutgoingEdges(actor.id, 'mentors').find(active)
      ?? graph.getIncomingEdges(actor.id, 'mentors').find(active);
    if (target) target.properties.severedByDivineWill = true;
    props.pendingMentorshipSever = undefined;
  }
}

/** Whether the mentorship system is live at all. */
export function isMentorshipEnabled(): boolean {
  return ENABLE_MENTORSHIP;
}

// ─── Helpers ────────────────────────────────────────────────────────

function findMentorshipEdge(
  graph: WorldGraph,
  project: StrategicProjectRuntime,
): GraphEdge | undefined {
  return graph.getOutgoingEdges(project.actorId, 'mentors')
    .find(e => (e.properties.undertakingId as string | undefined) === project.projectId);
}

function isSeparated(graph: WorldGraph, mentorId: string, apprenticeId: string): boolean {
  const mentorHex = resolveAgentHex(graph, mentorId);
  const apprHex = resolveAgentHex(graph, apprenticeId);
  // Unmeasurable separation lets the arc ride, matching the retired phase.
  if (!mentorHex || !apprHex) return false;
  return hexDistance(mentorHex, apprHex) > MENTORSHIP_MAX_SEPARATION_HEXES;
}

function resolveAgentHex(
  graph: WorldGraph,
  agentId: string,
): { col: number; row: number } | null {
  const locId = getAgentLocationId(graph, agentId);
  if (!locId) return null;
  let node: GraphNode | null = graph.getNode(locId) ?? null;
  for (let i = 0; i < 4 && node; i++) {
    const col = node.properties.hexCol as number | undefined;
    const row = node.properties.hexRow as number | undefined;
    if (typeof col === 'number' && typeof row === 'number') return { col, row };
    const parentId = node.properties.parentLocationId as string | undefined;
    node = parentId ? graph.getNode(parentId) ?? null : null;
  }
  return null;
}

function readExistingSentiment(
  graph: WorldGraph,
  mentorId: string,
  apprenticeId: string,
): number | null {
  const edge = graph.getOutgoingEdges(mentorId, 'relates_to').find(e => e.target === apprenticeId);
  const s = edge?.properties.sentiment as number | undefined;
  return typeof s === 'number' ? clamp(s, -1, 1) : null;
}

function buildSystemSeed(
  templateId: string,
  targetAgentId: string,
  tick: number,
  seedLabel: string,
): PendingEncounterSeed {
  return {
    seedId: `seed_${seedLabel}_${targetAgentId}_${tick}`,
    sourceEncounterId: 'system.mentorship',
    sourceReactionId: 'system.mentorship',
    templateId,
    targetAgentId,
    eligibleAfterTick: tick,
    priority: 0.5,
    seedLabel,
    plantedTick: tick,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Re-exported so callers reading `GameState` need only this module. */
export type { GameState };
