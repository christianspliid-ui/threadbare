/**
 * Phase Mentorship — Mentor/Apprentice Lifecycle (THR-75)
 *
 * Couples the `initiative.train-apprentice` initiative to the persistent
 * `mentors` graph edge. Runs in orchestrator Phase 2.33, after
 * phaseInitiativeProgress (2.32) and before phaseMovement (2.35).
 *
 * Responsibilities per tick:
 *   1. Bootstrap — create the mentors edge on first sighting of an un-edged
 *      train-apprentice initiative; pick (apprentice, domain) deterministically.
 *   2. Progress sync — advance edge.progress from the backing initiative.
 *   3. Milestone seeds — at threshold crossings, increment lessonsCompleted,
 *      seed milestone encounters by templateId (fail-soft until Phase 2 authors them).
 *   4. Bond drift — apply BOND_DRIFT_ON_* from the latest checkpoint result.
 *   5. Separation check — fail the initiative when mentor↔apprentice hex distance
 *      exceeds MENTORSHIP_MAX_SEPARATION_HEXES.
 *   6. Divine sever — when severedByDivineWill flag is set, force the terminal arc
 *      immediately (resolves as Falling Out via the floored bondQuality).
 *   7. Terminal arc — when the initiative reaches completed/failed status, call
 *      resolveMentorship() and clear initiativeId from the edge atomically.
 *   8. Orphan handling — if the mentor node is gone, set edge → estranged.
 *
 * NFP #3 (Determinism): RNG is `mulberry32(state.seed + state.tick * 59)`.
 * NFP #4 (Fail-soft): Per-edge try/catch — one broken edge does not crash the phase.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §4.3
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { GraphNode, GraphEdge, MentorsEdgeProperties } from '../types/graph';
import type { InitiativeProgress } from '../types/initiative';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import { computeCapability, computeTier } from './domainCapability';
import { getAgentLocationId, getAgentsAtLocation } from './graphQueries';
import { emitTrace } from './traceBuffer';
import { hexDistance } from '../lib/hexMath';
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
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld } from './simulationRuntime';

const MILESTONE_TEMPLATE_IDS = [
  'mentorship.first-lesson',     // 0.25 — Phase 2
  'mentorship.the-test',         // 0.50 — Phase 2
  'mentorship.the-breakthrough', // 0.75 — Phase 2
] as const;

export function phaseMentorship(
  state: GameState,
  rng: () => number,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  if (!ENABLE_MENTORSHIP) {
    return {};
  }

  const graph = state.graph;
  const newEvents: TickEvent[] = [];
  const newEncounterSeeds: PendingEncounterSeed[] = [];

  // ── 1. Bootstrap pass: actors with train-apprentice initiative, no edge yet ──
  const allActors = graph.getNodesByType('actor');
  for (const actorNode of allActors) {
    try {
      const props = actorNode.properties as Record<string, unknown>;
      const progress = props.activeInitiative as InitiativeProgress | undefined;
      if (!progress || progress.status !== 'active') continue;
      if (progress.templateId !== 'initiative.train-apprentice') continue;

      // Does this mentor already have an active mentors edge for this initiative?
      const existingActive = graph.getOutgoingEdges(actorNode.id, 'mentors')
        .find(e => (e.properties.initiativeId as string | undefined) === progress.initiativeId);
      if (existingActive) continue;

      // Pick (apprentice, domain) at colocated time.
      const pick = pickApprenticeAndDomain(graph, actorNode.id, rng);
      if (!pick) {
        // No eligible apprentice present at start time — soft-fail the initiative.
        // (The candidate generator should have ruled this out, but a tick may have
        // moved someone in the interim.)
        markInitiativeFailed(actorNode, 'no_eligible_apprentice');
        continue;
      }

      const edgeId = `mentors_${actorNode.id}_${pick.apprenticeId}_${state.tick}`;
      const seedSentiment = readExistingSentiment(graph, actorNode.id, pick.apprenticeId);
      const edgeProps: MentorsEdgeProperties = {
        domain: pick.domain,
        progress: 0,
        phase: 'offered',
        startedTick: state.tick,
        lessonsCompleted: 0,
        bondQuality: seedSentiment ?? BOND_QUALITY_INITIAL,
        initiativeId: progress.initiativeId,
      };
      graph.addEdge({
        id: edgeId,
        source: actorNode.id,
        target: pick.apprenticeId,
        type: 'mentors',
        properties: edgeProps as unknown as Record<string, unknown>,
      });
      if (runtime) touchWorld(runtime);

      // Seed the offer encounter targeting the apprentice
      newEncounterSeeds.push(buildSystemSeed('mentorship.the-offer', pick.apprenticeId, state.tick, 'mentorship_offer'));

      const apprenticeNode = graph.getNode(pick.apprenticeId);
      emitTrace({
        category: 'mentorship_offered',
        tick: state.tick,
        agentId: pick.apprenticeId,
        mentorId: actorNode.id,
        apprenticeId: pick.apprenticeId,
        domain: pick.domain,
        initiativeId: progress.initiativeId,
        summary: `${actorNode.name} offers to teach ${apprenticeNode?.name ?? 'an apprentice'} in ${pick.domain}`,
      });

      newEvents.push({
        id: `mentorship_offer_${edgeId}`,
        tick: state.tick,
        type: 'agent_action',
        message: `${actorNode.name} offers to take ${apprenticeNode?.name ?? 'an apprentice'} on as an apprentice in ${pick.domain}.`,
        significance: 0.5,
        actorId: actorNode.id,
      });
    } catch {
      // fail-soft: one bad actor doesn't crash the phase
    }
  }

  // ── 1.5. Apply Sever the Bond divine action ──────────────────────
  // The divine action sets `pendingMentorshipSever: true` on the agent (the apprentice
  // or mentor). We translate that into `severedByDivineWill` on their active mentors edge.
  for (const actor of allActors) {
    const props = actor.properties as Record<string, unknown>;
    if (props.pendingMentorshipSever !== true) continue;
    // The flag may be on either the mentor or the apprentice side.
    const out = graph.getOutgoingEdges(actor.id, 'mentors')
      .find(e => {
        const phase = e.properties.phase as string | undefined;
        return phase === 'offered' || phase === 'training';
      });
    const incoming = graph.getIncomingEdges(actor.id, 'mentors')
      .find(e => {
        const phase = e.properties.phase as string | undefined;
        return phase === 'offered' || phase === 'training';
      });
    const target = out ?? incoming;
    if (target) {
      target.properties.severedByDivineWill = true;
      if (runtime) touchWorld(runtime);
    }
    props.pendingMentorshipSever = undefined;
  }

  // ── 2-7. Lifecycle pass over all active mentors edges ──────────────
  // Collect edges first (mutations during iteration are unsafe).
  const allMentorEdges: GraphEdge[] = [];
  for (const actor of allActors) {
    const outs = graph.getOutgoingEdges(actor.id, 'mentors');
    allMentorEdges.push(...outs);
  }

  for (const edge of allMentorEdges) {
    try {
      const props = edge.properties as Partial<MentorsEdgeProperties>;
      const phase = props.phase ?? 'offered';

      // Skip terminal phases (graduated/estranged are historical, not active).
      if (phase === 'graduated' || phase === 'estranged') continue;

      const mentorId = edge.source;
      const apprenticeId = edge.target;
      const mentorNode = graph.getNode(mentorId);
      const apprenticeNode = graph.getNode(apprenticeId);

      // ── Orphan handling: mentor or apprentice gone ────────────────
      if (!mentorNode) {
        edge.properties.phase = 'estranged';
        edge.properties.initiativeId = undefined;
        if (runtime) touchWorld(runtime);
        emitTrace({
          category: 'mentorship_severed',
          tick: state.tick,
          agentId: apprenticeId,
          mentorId,
          apprenticeId,
          reason: 'mentor_lost',
          bondQuality: props.bondQuality ?? 0,
          summary: `${apprenticeNode?.name ?? 'apprentice'} loses their mentor`,
        });
        newEvents.push({
          id: `mentorship_orphan_${edge.id}_${state.tick}`,
          tick: state.tick,
          type: 'agent_action',
          // TODO(THR-76): orphaned-apprentice arc hook — THR-76 (Death/Succession) consumes this edge state.
          message: `${apprenticeNode?.name ?? 'An apprentice'} is left without a teacher.`,
          significance: 0.65,
          actorId: apprenticeId,
        });
        continue;
      }
      if (!apprenticeNode) {
        edge.properties.phase = 'estranged';
        edge.properties.initiativeId = undefined;
        if (runtime) touchWorld(runtime);
        continue;
      }

      // ── Divine sever flag: force Falling Out ──────────────────────
      const severedByDivineWill = props.severedByDivineWill === true;
      if (severedByDivineWill) {
        edge.properties.bondQuality = SEVER_BOND_QUALITY_FLOOR;
        edge.properties.severedByDivineWill = undefined;
        const r = resolveMentorship(graph, edge, 'completed', state.tick, runtime);
        newEvents.push(...r.newEvents);
        newEncounterSeeds.push(...r.newEncounterSeeds);
        // Trace already emitted by resolveMentorship; tag the reason as divine
        emitTrace({
          category: 'mentorship_severed',
          tick: state.tick,
          agentId: apprenticeId,
          mentorId,
          apprenticeId,
          reason: 'divine_sever',
          bondQuality: SEVER_BOND_QUALITY_FLOOR,
          summary: `${apprenticeNode.name}'s bond with ${mentorNode.name} severed by divine will`,
        });
        continue;
      }

      // ── Find the backing initiative ───────────────────────────────
      const initiativeId = props.initiativeId;
      const mentorProps = mentorNode.properties as Record<string, unknown>;
      const initiative = mentorProps.activeInitiative as InitiativeProgress | undefined;

      // If we expected an initiative but it's gone or doesn't match, run the
      // terminal arc as a completion or failure based on what we know.
      if (initiativeId && (!initiative || initiative.initiativeId !== initiativeId)) {
        // The initiative ended last tick — phaseInitiativeProgress cleared it. Run terminal arc.
        const r = resolveMentorship(graph, edge, 'completed', state.tick, runtime);
        newEvents.push(...r.newEvents);
        newEncounterSeeds.push(...r.newEncounterSeeds);
        continue;
      }

      if (!initiative) continue;

      // ── Separation check ──────────────────────────────────────────
      const separationFailed = checkSeparation(graph, mentorId, apprenticeId);
      if (separationFailed) {
        markInitiativeFailed(mentorNode, 'apprentice_separation');
        const r = resolveMentorship(graph, edge, 'failed', state.tick, runtime);
        newEvents.push(...r.newEvents);
        newEncounterSeeds.push(...r.newEncounterSeeds);
        continue;
      }

      // ── Progress sync ─────────────────────────────────────────────
      const span = Math.max(1, initiative.targetCompletionTick - initiative.startedTick);
      const elapsed = Math.max(0, state.tick - initiative.startedTick);
      const newProgress = Math.min(1, elapsed / span);
      const oldProgress = props.progress ?? 0;
      edge.properties.progress = newProgress;

      // Flip offered → training on first non-zero progress
      if (phase === 'offered' && newProgress > 0) {
        edge.properties.phase = 'training';
        emitTrace({
          category: 'mentorship_started',
          tick: state.tick,
          agentId: apprenticeId,
          mentorId,
          apprenticeId,
          domain: (props.domain as ReachDomain) ?? 'heart',
          summary: `${apprenticeNode.name} begins training under ${mentorNode.name}`,
        });
      }

      // ── Bond drift from latest checkpoint (if any new) ────────────
      const oldLessons = props.lessonsCompleted ?? 0;
      const recentCheckpoint = initiative.checkpoints[initiative.checkpoints.length - 1];
      if (recentCheckpoint && recentCheckpoint.tick === state.tick) {
        const currentBond = props.bondQuality ?? 0;
        const drift = recentCheckpoint.passed ? BOND_DRIFT_ON_SUCCESS : -BOND_DRIFT_ON_FAILURE;
        edge.properties.bondQuality = clamp(currentBond + drift, -1, 1);
      }

      // ── Milestone seeds ───────────────────────────────────────────
      for (let i = 0; i < MILESTONE_THRESHOLDS.length; i++) {
        const threshold = MILESTONE_THRESHOLDS[i];
        if (oldProgress < threshold && newProgress >= threshold && oldLessons <= i) {
          edge.properties.lessonsCompleted = i + 1;
          newEncounterSeeds.push(buildSystemSeed(
            MILESTONE_TEMPLATE_IDS[i],
            apprenticeId,
            state.tick,
            `mentorship_lesson_${i + 1}`,
          ));
          emitTrace({
            category: 'mentorship_lesson',
            tick: state.tick,
            agentId: apprenticeId,
            mentorId,
            apprenticeId,
            lessonNumber: i + 1,
            progress: newProgress,
            bondQuality: (edge.properties.bondQuality as number) ?? 0,
            summary: `${apprenticeNode.name} reaches lesson ${i + 1} under ${mentorNode.name}`,
          });
        }
      }

      // ── Terminal completion check ─────────────────────────────────
      // Initiative has reached completion this tick (phaseInitiativeProgress runs first;
      // by the time we see activeInitiative removed, we run the terminal arc on the next tick
      // via the missing-initiative branch above). However, when progress reaches 1.0 and the
      // initiative is still active (target tick not yet hit), we don't preempt — we wait for
      // phaseInitiativeProgress to mark it complete.

      if (runtime) touchWorld(runtime);
    } catch {
      // fail-soft per-edge
    }
  }

  const result: Partial<GameState> = {
    tickEvents: [...state.tickEvents, ...newEvents],
  };
  if (newEncounterSeeds.length > 0) {
    result.pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? []), ...newEncounterSeeds];
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface ApprenticePick {
  apprenticeId: string;
  domain: ReachDomain;
}

function pickApprenticeAndDomain(
  graph: GameState['graph'],
  mentorId: string,
  rng: () => number,
): ApprenticePick | null {
  const mentorLocId = getAgentLocationId(graph, mentorId);
  if (!mentorLocId) return null;
  const mentorLocNode = graph.getNode(mentorLocId);
  const parentLocId = (mentorLocNode?.properties.parentLocationId as string | undefined) ?? mentorLocId;

  const candidates: ApprenticePick[] = [];
  const colocated = getAgentsAtLocation(graph, parentLocId).filter(a => a.id !== mentorId);

  for (const domain of REACH_DOMAINS) {
    const mentorTier = computeTier(computeCapability(graph, mentorId, domain));
    if (mentorTier < MENTOR_MIN_TIER) continue;

    for (const cand of colocated) {
      if (cand.properties.actorType !== 'individual') continue;
      const apprTier = computeTier(computeCapability(graph, cand.id, domain));
      if (apprTier < APPRENTICE_MIN_TIER || apprTier > APPRENTICE_MAX_TIER) continue;

      // Skip if apprentice already has an active mentors edge
      const incoming = graph.getIncomingEdges(cand.id, 'mentors');
      const hasActive = incoming.some((e: GraphEdge) => {
        const phase = e.properties.phase as string | undefined;
        return phase === 'offered' || phase === 'training';
      });
      if (hasActive) continue;

      candidates.push({ apprenticeId: cand.id, domain });
    }
  }

  if (candidates.length === 0) return null;
  // Deterministic pick weighted toward positive existing sentiment.
  // Simple uniform pick is fine for v1 — sentiment-weighted refinement can come later.
  const idx = Math.floor(rng() * candidates.length);
  return candidates[Math.min(idx, candidates.length - 1)];
}

function checkSeparation(
  graph: GameState['graph'],
  mentorId: string,
  apprenticeId: string,
): boolean {
  const mentorLocId = getAgentLocationId(graph, mentorId);
  const apprLocId = getAgentLocationId(graph, apprenticeId);
  if (!mentorLocId || !apprLocId) return false; // can't measure — let it ride
  const mentorLoc = graph.getNode(mentorLocId);
  const apprLoc = graph.getNode(apprLocId);
  if (!mentorLoc || !apprLoc) return false;

  // Resolve to hex coords on the parent location if at a sublocation.
  const mentorHex = resolveHexCoord(graph, mentorLoc);
  const apprHex = resolveHexCoord(graph, apprLoc);
  if (!mentorHex || !apprHex) return false;

  return hexDistance(mentorHex, apprHex) > MENTORSHIP_MAX_SEPARATION_HEXES;
}

function resolveHexCoord(
  graph: GameState['graph'],
  locationNode: GraphNode,
): { col: number; row: number } | null {
  let node: GraphNode | null = locationNode;
  // Walk up parentLocationId chain until we find one with hex coords.
  for (let i = 0; i < 4; i++) {
    if (!node) return null;
    const col = node.properties.hexCol as number | undefined;
    const row = node.properties.hexRow as number | undefined;
    if (typeof col === 'number' && typeof row === 'number') {
      return { col, row };
    }
    const parentId = node.properties.parentLocationId as string | undefined;
    if (!parentId) return null;
    node = graph.getNode(parentId) ?? null;
  }
  return null;
}

function readExistingSentiment(
  graph: GameState['graph'],
  mentorId: string,
  apprenticeId: string,
): number | null {
  const edge = graph.getOutgoingEdges(mentorId, 'relates_to')
    .find(e => e.target === apprenticeId);
  if (!edge) return null;
  const s = edge.properties.sentiment as number | undefined;
  return typeof s === 'number' ? clamp(s, -1, 1) : null;
}

function markInitiativeFailed(actorNode: GraphNode, reason: string): void {
  const props = actorNode.properties as Record<string, unknown>;
  const initiative = props.activeInitiative as InitiativeProgress | undefined;
  if (initiative) {
    // Setting the status hands cleanup to phaseInitiativeProgress; alternatively we
    // could clear it directly. For determinism, just set status — the next phase pass
    // handles the rest.
    (initiative as { status: InitiativeProgress['status'] }).status = 'failed';
    (initiative as Record<string, unknown>).failureReason = reason;
  }
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
