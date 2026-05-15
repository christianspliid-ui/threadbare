/**
 * Mentorship Terminal-Arc Resolution (THR-75)
 *
 * Decides which terminal arc a mentorship takes (Graduation / Surpassing /
 * Falling Out / Quiet Parting / Dissolution) and applies the consequences:
 * trait grants, edge phase changes, reputation tallies, terminal encounter seeds.
 *
 * Called from phaseMentorship when the backing initiative reaches a completed
 * or failed status. Single owner — the outcome-kind hook on the initiative
 * registration is purely a convenience marker.
 *
 * @see Docs/plans/2026-05-15-thr-75-mentor-apprentice-relationship-chains.md §4.4
 */

import type { WorldGraph } from './graph';
import type { GraphEdge, MentorsEdgeProperties } from '../types/graph';
import type { TickEvent } from '../types/gameState';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { ReachDomain } from '../types/traits';
import { MASTERY_TRAIT_BY_REACH } from '../data/mastery-trait-content';
import { emitTrace } from './traceBuffer';
import { computeTier, computeCapability } from './domainCapability';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld } from './simulationRuntime';
import {
  GRADUATION_BOND_THRESHOLD,
  FALLING_OUT_BOND_THRESHOLD,
  HOSTILE_THRESHOLD,
  GRADUATION_TRAIT_LEVEL,
  FALLING_OUT_TRANSFER_FRACTION,
  SURPASSING_TIER_DELTA,
} from '../data/mentorship-constants';
import type { MentorshipSeveredReason } from '../types/traces/mentorship-traces';

export type MentorshipArc =
  | 'graduation'
  | 'surpassing'
  | 'falling_out'
  | 'quiet_parting'
  | 'dissolution';

export interface MentorshipResolveResult {
  arc: MentorshipArc;
  newEvents: TickEvent[];
  newEncounterSeeds: PendingEncounterSeed[];
}

/**
 * Resolve the terminal arc of a completed or failed train-apprentice initiative.
 *
 * Mutates the graph in place. Fail-soft per side-effect — a thrown trait grant
 * does not block edge-phase advancement.
 *
 * @param initiativeStatus  'completed' (progress reached 1.0) or 'failed' (other condition)
 */
export function resolveMentorship(
  graph: WorldGraph,
  edge: GraphEdge,
  initiativeStatus: 'completed' | 'failed',
  tick: number,
  runtime?: SimulationRuntime,
): MentorshipResolveResult {
  const newEvents: TickEvent[] = [];
  const newEncounterSeeds: PendingEncounterSeed[] = [];

  const mentorId = edge.source;
  const apprenticeId = edge.target;
  const props = edge.properties as Partial<MentorsEdgeProperties>;
  const domain = (props.domain as ReachDomain) ?? 'heart';
  const bondQuality = clamp(props.bondQuality ?? 0, -1, 1);
  const progress = clamp(props.progress ?? 0, 0, 1);

  const mentorNode = graph.getNode(mentorId);
  const apprenticeNode = graph.getNode(apprenticeId);

  // ── Decision table ──────────────────────────────────────────────
  let arc: MentorshipArc;

  if (initiativeStatus === 'failed') {
    arc = 'dissolution';
  } else if (progress >= 1.0 && bondQuality >= GRADUATION_BOND_THRESHOLD) {
    const apprTier = apprenticeNode
      ? computeTier(computeCapability(graph, apprenticeId, domain))
      : 0;
    const mentorTier = mentorNode
      ? computeTier(computeCapability(graph, mentorId, domain))
      : 0;
    arc = apprTier >= mentorTier + SURPASSING_TIER_DELTA ? 'surpassing' : 'graduation';
  } else if (bondQuality < FALLING_OUT_BOND_THRESHOLD) {
    arc = 'falling_out';
  } else {
    arc = 'quiet_parting';
  }

  const mentorName = mentorNode?.name ?? 'the mentor';
  const apprenticeName = apprenticeNode?.name ?? 'the apprentice';

  // ── Apply per-arc consequences ──────────────────────────────────
  switch (arc) {
    case 'graduation': {
      try {
        grantMasteryTrait(graph, apprenticeId, domain, GRADUATION_TRAIT_LEVEL, tick);
      } catch {
        // fail-soft
      }
      try {
        strengthenRelatesTo(graph, mentorId, apprenticeId, 'mentorship', 0.3);
      } catch { /* fail-soft */ }

      edge.properties.phase = 'graduated';
      edge.properties.initiativeId = undefined;
      newEncounterSeeds.push(buildSystemSeed('mentorship.graduation', apprenticeId, tick, 'mentorship_graduation'));

      const traitId = MASTERY_TRAIT_BY_REACH[domain] ?? null;
      emitTrace({
        category: 'mentorship_graduated',
        tick,
        agentId: apprenticeId,
        mentorId,
        apprenticeId,
        domain,
        traitId,
        bondQuality,
        summary: `${apprenticeName} graduates under ${mentorName} in ${domain}`,
      });

      newEvents.push({
        id: `mentorship_grad_${apprenticeId}_${tick}`,
        tick,
        type: 'agent_action',
        message: `${apprenticeName} completes their apprenticeship under ${mentorName}.`,
        significance: 0.75,
        actorId: apprenticeId,
      });
      break;
    }

    case 'surpassing': {
      try {
        grantMasteryTrait(graph, apprenticeId, domain, GRADUATION_TRAIT_LEVEL, tick);
      } catch { /* fail-soft */ }
      try {
        addRelatesTo(graph, mentorId, apprenticeId, 'surpassed', 0.1, tick);
      } catch { /* fail-soft */ }

      edge.properties.phase = 'graduated';
      edge.properties.initiativeId = undefined;
      // Surpassing branch is selected by seedLabel — encounter aftermathConfig reads
      // the label and routes to the bittersweet sub-voice.
      newEncounterSeeds.push(buildSystemSeed('mentorship.graduation', apprenticeId, tick, 'mentorship_surpassing'));

      const apprTier = apprenticeNode
        ? computeTier(computeCapability(graph, apprenticeId, domain))
        : 0;
      const mentorTier = mentorNode
        ? computeTier(computeCapability(graph, mentorId, domain))
        : 0;

      emitTrace({
        category: 'mentorship_surpassed',
        tick,
        agentId: apprenticeId,
        mentorId,
        apprenticeId,
        domain,
        apprenticeTier: apprTier,
        mentorTier,
        summary: `${apprenticeName} surpasses ${mentorName} in ${domain}`,
      });

      newEvents.push({
        id: `mentorship_surpass_${apprenticeId}_${tick}`,
        tick,
        type: 'agent_action',
        message: `${apprenticeName} has exceeded their teacher ${mentorName}.`,
        significance: 0.85,
        actorId: apprenticeId,
      });
      break;
    }

    case 'falling_out': {
      // Partial transfer — the apprentice learned *something* before it broke.
      try {
        const partialLevel = Math.max(1, Math.round(GRADUATION_TRAIT_LEVEL * FALLING_OUT_TRANSFER_FRACTION));
        grantMasteryTrait(graph, apprenticeId, domain, partialLevel, tick);
      } catch { /* fail-soft */ }

      if (bondQuality <= HOSTILE_THRESHOLD) {
        try {
          addHostileTo(graph, mentorId, apprenticeId, 'mentorship_break', tick);
          addHostileTo(graph, apprenticeId, mentorId, 'mentorship_break', tick);
        } catch { /* fail-soft */ }
      } else {
        try {
          addRelatesTo(graph, mentorId, apprenticeId, 'estranged', -0.5, tick);
        } catch { /* fail-soft */ }
      }

      edge.properties.phase = 'estranged';
      edge.properties.initiativeId = undefined;
      newEncounterSeeds.push(buildSystemSeed('mentorship.the-falling-out', apprenticeId, tick, 'mentorship_falling_out'));

      emitTraceSevered('falling_out', tick, mentorId, apprenticeId, bondQuality,
        `${apprenticeName} breaks with ${mentorName}`);

      newEvents.push({
        id: `mentorship_fallout_${apprenticeId}_${tick}`,
        tick,
        type: 'agent_action',
        message: `${apprenticeName}'s apprenticeship with ${mentorName} has ended badly.`,
        significance: 0.7,
        actorId: apprenticeId,
      });
      break;
    }

    case 'quiet_parting': {
      try {
        const partialLevel = Math.max(1, Math.round(GRADUATION_TRAIT_LEVEL * FALLING_OUT_TRANSFER_FRACTION));
        grantMasteryTrait(graph, apprenticeId, domain, partialLevel, tick);
      } catch { /* fail-soft */ }

      edge.properties.phase = 'estranged';
      edge.properties.initiativeId = undefined;

      emitTraceSevered('incomplete', tick, mentorId, apprenticeId, bondQuality,
        `${apprenticeName} parts quietly from ${mentorName}`);

      newEvents.push({
        id: `mentorship_part_${apprenticeId}_${tick}`,
        tick,
        type: 'agent_action',
        message: `${apprenticeName}'s apprenticeship under ${mentorName} winds down without ceremony.`,
        significance: 0.4,
        actorId: apprenticeId,
      });
      break;
    }

    case 'dissolution': {
      edge.properties.phase = 'estranged';
      edge.properties.initiativeId = undefined;

      emitTraceSevered('failed', tick, mentorId, apprenticeId, bondQuality,
        `${apprenticeName}'s training under ${mentorName} dissolves`);

      newEvents.push({
        id: `mentorship_dissolve_${apprenticeId}_${tick}`,
        tick,
        type: 'agent_action',
        message: `${apprenticeName}'s training with ${mentorName} ends prematurely.`,
        significance: 0.35,
        actorId: apprenticeId,
      });
      break;
    }
  }

  if (runtime) touchWorld(runtime);

  return { arc, newEvents, newEncounterSeeds };
}

// ─── Helpers ─────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Build a system-emitted encounter seed for mentorship terminal arcs.
 * Mentorship seeds have no upstream encounter source — they are fired by
 * the engine when an apprenticeship resolves. The `system.mentorship` sentinel
 * fills the required-but-not-meaningful `sourceEncounterId` / `sourceReactionId`.
 */
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

function grantMasteryTrait(
  graph: WorldGraph,
  apprenticeId: string,
  domain: ReachDomain,
  level: number,
  tick: number,
): void {
  const traitId = MASTERY_TRAIT_BY_REACH[domain];
  if (!traitId) return; // gold has no Mastery trait in v1 — fail-soft skip
  const traitNode = graph.getNode(traitId);
  if (!traitNode) return; // ensureTraitNodes hasn't run; fail-soft skip

  // If apprentice already has this trait, raise the level instead of duplicating.
  const existing = graph.getOutgoingEdges(apprenticeId, 'has_trait')
    .find(e => e.target === traitId);
  if (existing) {
    const currentLevel = (existing.properties.level as number | undefined) ?? 1;
    existing.properties.level = Math.max(currentLevel, level);
    existing.properties.source = 'mentorship';
    return;
  }

  const eid = `e_${apprenticeId}_${traitId}_${tick}`;
  graph.addEdge({
    id: eid,
    source: apprenticeId,
    target: traitId,
    type: 'has_trait',
    properties: {
      level,
      source: 'mentorship',
      appliedAt: tick,
      visibility: 'public',
    },
  });
}

function addRelatesTo(
  graph: WorldGraph,
  from: string,
  to: string,
  basis: string,
  sentiment: number,
  tick: number,
): void {
  // Avoid duplicating an existing relates_to edge between the same pair.
  const existing = graph.getOutgoingEdges(from, 'relates_to').find(e => e.target === to);
  if (existing) {
    existing.properties.basis = basis;
    const prev = (existing.properties.sentiment as number | undefined) ?? 0;
    existing.properties.sentiment = clamp(prev + sentiment, -1, 1);
    return;
  }
  const eid = `relates_${from}_${to}_${tick}`;
  graph.addEdge({
    id: eid,
    source: from,
    target: to,
    type: 'relates_to',
    properties: { basis, sentiment, strength: 0.5, trust: 0, createdAt: tick },
  });
}

function strengthenRelatesTo(
  graph: WorldGraph,
  from: string,
  to: string,
  basis: string,
  delta: number,
): void {
  const existing = graph.getOutgoingEdges(from, 'relates_to').find(e => e.target === to);
  if (!existing) {
    addRelatesTo(graph, from, to, basis, delta, 0);
    return;
  }
  const prev = (existing.properties.sentiment as number | undefined) ?? 0;
  existing.properties.sentiment = clamp(prev + delta, -1, 1);
  existing.properties.basis = basis;
}

function addHostileTo(
  graph: WorldGraph,
  from: string,
  to: string,
  basis: string,
  tick: number,
): void {
  const existing = graph.getOutgoingEdges(from, 'hostile_to').find(e => e.target === to);
  if (existing) return;
  const eid = `hostile_${from}_${to}_${tick}`;
  graph.addEdge({
    id: eid,
    source: from,
    target: to,
    type: 'hostile_to',
    properties: { basis, createdAt: tick },
  });
}

function emitTraceSevered(
  reason: MentorshipSeveredReason,
  tick: number,
  mentorId: string,
  apprenticeId: string,
  bondQuality: number,
  summary: string,
): void {
  emitTrace({
    category: 'mentorship_severed',
    tick,
    agentId: apprenticeId,
    mentorId,
    apprenticeId,
    reason,
    bondQuality,
    summary,
  });
}
