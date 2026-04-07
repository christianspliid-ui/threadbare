/**
 * Phase: Divine Premonition (Whisper) — subconscious nudges during agent idle.
 *
 * Runs before phaseAgentDecision. Checks threaded agents for Whisper eligibility,
 * derives contextually relevant nudge options, and emits PremonitionEvent entries
 * onto GameState.premonitionQueue for UI consumption.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * See src/data/premonition-constants.ts for all tunable values.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                      | Fallback                          |
 * |-----------------------------------|-----------------------------------|
 * | No threaded agents                | Skip phase entirely               |
 * | Agent not idle                    | Skip that agent                   |
 * | No eligible nudges derived        | No Whisper for that idle period   |
 * | Agent at dissolution (Q=0)        | No premonition — thread severed   |
 * | Missing ambition node             | Use 'generic' ambition imagery    |
 * | Missing axiological profile       | Use zero profile, derive from     |
 * |                                   | available encounters only         |
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import type { GameState } from '../types/gameState';
import type { PremonitionEvent, WhisperNudge, WhisperNudgeCategory } from '../types/premonition';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types';
import type { AxiologicalProfile } from '../types/agent';
import type { WorldGraph, GraphNode } from './graph';
import { getThreadedAgents, getAgentAmbitions } from './graphQueries';
import {
  WHISPER_ESSENCE_COST_BASE,
  WHISPER_ESSENCE_COST_AMBITION_DRIFT,
  WHISPER_NUDGE_COUNT_MIN,
  WHISPER_NUDGE_COUNT_MAX,
  PREMONITION_DISPLAY_DELAY_TICKS,
  PREMONITION_EXPIRY_TICKS,
  GATHER_STRENGTH_QUINTESSENCE_THRESHOLD,
  COURAGE_NUDGE_THRESHOLD,
  AMBITION_STALENESS_TICKS,
  REACH_TO_SPHERE,
} from '../data/premonition-constants';
import {
  WHISPER_VIGNETTE_TEMPLATES,
  WHISPER_NUDGE_TEMPLATES,
  AMBITION_DREAM_IMAGERY,
  getQuintessenceProseTier,
} from '../data/premonition-content';
import type { AmbitionProseCategory } from '../data/premonition-content';

// ─── Reach Domains (for iteration) ─────────────────────────────

const ALL_REACHES: ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];

// ─── Helper: seeded pick from array ─────────────────────────────

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Helper: pronoun resolution ─────────────────────────────────

function resolvePronouns(
  template: string,
  name: string,
): string {
  // Simple neutral pronoun resolution — can be expanded per-agent later
  return template
    .replace(/\{name\}/g, name)
    .replace(/\{possessive\}/g, 'their')
    .replace(/\{pronoun\}/g, 'they')
    .replace(/\{Pronoun\}/g, 'They');
}

function resolveNudgeProse(
  template: string,
  name: string,
  reachName?: string,
  sphereName?: string,
): string {
  let result = resolvePronouns(template, name);
  if (reachName) result = result.replace(/\{reachName\}/g, reachName);
  if (sphereName) result = result.replace(/\{sphereName\}/g, sphereName);
  return result;
}

// ─── Agent Idle Check ───────────────────────────────────────────

function isAgentIdle(agent: GraphNode, state: GameState): boolean {
  // Not in an active unified action
  if (state.unifiedActions.some(a => a.actorId === agent.id && !a.resolved)) return false;

  // Not in an active encounter
  if (state.encounterProgress.some(ep => ep.actorId === agent.id && ep.status === 'active')) return false;

  // Not currently moving
  const movementState = agent.properties?.movementState as { movementQueue?: unknown[] } | undefined;
  if (movementState?.movementQueue && (movementState.movementQueue as unknown[]).length > 0) return false;

  return true;
}

// ─── Court Position Helper ──────────────────────────────────────

function getCourtPosition(graph: WorldGraph, ascendantId: string, agentId: string): string | null {
  const edges = graph.getOutgoingEdges(ascendantId, 'thread');
  const threadEdge = edges.find(e => e.target === agentId);
  if (!threadEdge) return null;
  return (threadEdge.properties?.courtPosition as string) ?? null;
}

function getThreadTier(graph: WorldGraph, ascendantId: string, agentId: string): number {
  const edges = graph.getOutgoingEdges(ascendantId, 'thread');
  const threadEdge = edges.find(e => e.target === agentId);
  if (!threadEdge) return 0;
  return (threadEdge.properties?.tier as number) ?? 0;
}

// ─── Nudge Derivation ───────────────────────────────────────────

interface NudgeCandidate {
  category: WhisperNudgeCategory;
  relevance: number;
  targetReach?: ReachDomain;
  targetSphere?: SphereName;
}

function deriveNudgeCandidates(
  agent: GraphNode,
  graph: WorldGraph,
  state: GameState,
): NudgeCandidate[] {
  const candidates: NudgeCandidate[] = [];
  const profile = (agent.properties?.axiologicalProfile as AxiologicalProfile | undefined);
  const quintessence = (agent.properties?.quintessence as number | undefined) ?? 1.0;
  const capabilities = (agent.properties?.domainCapabilities as Record<string, number> | undefined) ?? {};

  // 1. Gather strength — low quintessence
  if (quintessence < GATHER_STRENGTH_QUINTESSENCE_THRESHOLD) {
    const relevance = 1.0 - quintessence; // Lower Q = higher relevance
    candidates.push({ category: 'gather_strength', relevance });
  }

  // 2. Gather courage — cautious agent with room to grow
  const courage = profile?.courage_prudence ?? 0;
  if (courage < COURAGE_NUDGE_THRESHOLD) {
    candidates.push({ category: 'gather_courage', relevance: 0.5 + (COURAGE_NUDGE_THRESHOLD - courage) });
  }

  // 3. Ambition drift — stale ambition
  const ambitions = getAgentAmbitions(graph, agent.id);
  const activeAmbition = ambitions.find(a => a.status === 'active');
  if (activeAmbition) {
    const assignedTick = (activeAmbition.edge.properties?.assignedTick as number) ?? 0;
    const milestones = (activeAmbition.edge.properties?.completedMilestones as string[]) ?? [];
    const ticksHeld = state.tick - assignedTick;
    if (ticksHeld > AMBITION_STALENESS_TICKS && milestones.length < 2) {
      candidates.push({ category: 'ambition_drift', relevance: 0.6 + (ticksHeld / 200) });
    }
  } else {
    // No ambition at all — ambition drift could surface
    candidates.push({ category: 'ambition_drift', relevance: 0.4 });
  }

  // 4. Reach biases — pick reaches where the agent has some capability but isn't saturated
  for (const reach of ALL_REACHES) {
    const cap = capabilities[reach] ?? 0;
    if (cap > 0.1 && cap < 0.8) {
      // Mid-range capability = good growth opportunity
      const relevance = 0.3 + (0.5 - Math.abs(cap - 0.4));
      candidates.push({
        category: 'reach_bias',
        relevance,
        targetReach: reach,
        targetSphere: REACH_TO_SPHERE[reach],
      });
    }
  }

  // 5. Sphere biases — pick 1-2 spheres aligned with ambition or personality
  const ambitionReach = activeAmbition?.ambition?.properties?.reachAffinity
    ? Object.keys(activeAmbition.ambition.properties.reachAffinity as Record<string, number>)[0] as ReachDomain | undefined
    : undefined;
  if (ambitionReach) {
    const sphere = REACH_TO_SPHERE[ambitionReach];
    if (sphere) {
      candidates.push({
        category: 'sphere_bias',
        relevance: 0.55,
        targetSphere: sphere,
      });
    }
  }

  return candidates;
}

// ─── Vignette Generation ────────────────────────────────────────

function generateWhisperVignette(
  agent: GraphNode,
  graph: WorldGraph,
  state: GameState,
  rng: () => number,
): string {
  const quintessence = (agent.properties?.quintessence as number | undefined) ?? 1.0;
  const tier = getQuintessenceProseTier(quintessence);
  const baseVignette = seededPick(WHISPER_VIGNETTE_TEMPLATES[tier], rng);

  // Try to weave in ambition imagery
  const ambitions = getAgentAmbitions(graph, agent.id);
  const activeAmbition = ambitions.find(a => a.status === 'active');
  const ambitionCategory: AmbitionProseCategory =
    (activeAmbition?.ambition?.properties?.category as AmbitionProseCategory) ?? 'generic';
  const imagery = AMBITION_DREAM_IMAGERY[ambitionCategory] ?? AMBITION_DREAM_IMAGERY.generic;
  const ambitionFragment = seededPick(imagery, rng);

  const combined = `${resolvePronouns(baseVignette, agent.name)} ${resolvePronouns(ambitionFragment, agent.name)}`;
  return combined;
}

// ─── Main Phase Function ────────────────────────────────────────

export function phaseDivinePremonition(
  state: GameState,
  rng: () => number,
): Partial<GameState> {
  const newPremonitions: PremonitionEvent[] = [];

  const { graph, ascendantId } = state;
  const threadedNodes = getThreadedAgents(graph, ascendantId);
  // Filter to actor nodes only — factions, locations, etc. are threaded but not premonition targets
  const threadedAgents = threadedNodes.filter(n => n.type === 'actor');

  if (threadedAgents.length === 0) return {};

  // Track agents that already have a pending premonition — one at a time
  const pendingQueue = state.premonitionQueue ?? [];
  const agentsWithPending = new Set(pendingQueue.map(p => p.agentId));

  for (const agent of threadedAgents) {
    try {
      // Gate: no pending premonition for this agent already
      if (agentsWithPending.has(agent.id)) continue;

      // Gate: tier 1+
      const tier = getThreadTier(graph, ascendantId, agent.id);
      if (tier < 1) continue;

      // Gate: agent must be idle
      if (!isAgentIdle(agent, state)) continue;

      // Gate: whisperAvailable flag (set true on idle, false on non-generic encounter commit)
      const whisperAvailable = (agent.properties?.whisperAvailable as boolean | undefined) ?? true;
      if (!whisperAvailable) continue;

      // Gate: not dissolved
      const quintessence = (agent.properties?.quintessence as number | undefined) ?? 1.0;
      if (quintessence <= 0) continue;

      // Derive contextual nudge candidates
      const candidates = deriveNudgeCandidates(agent, graph, state);
      if (candidates.length === 0) continue;

      // Sort by relevance, pick top 2-3
      candidates.sort((a, b) => b.relevance - a.relevance);
      const count = Math.min(
        Math.max(WHISPER_NUDGE_COUNT_MIN, Math.min(candidates.length, WHISPER_NUDGE_COUNT_MAX)),
        candidates.length,
      );
      const selected = candidates.slice(0, count);

      // Build WhisperNudge options
      const options: WhisperNudge[] = selected.map(c => {
        const templates = WHISPER_NUDGE_TEMPLATES[c.category];
        const label = resolveNudgeProse(
          seededPick(templates.labels, rng),
          agent.name,
          c.targetReach ? capitalize(c.targetReach) : undefined,
          c.targetSphere ? capitalize(c.targetSphere) : undefined,
        );
        const flavor = resolveNudgeProse(
          seededPick(templates.flavors, rng),
          agent.name,
          c.targetReach ? capitalize(c.targetReach) : undefined,
          c.targetSphere ? capitalize(c.targetSphere) : undefined,
        );
        const sphere: SphereName = c.targetSphere ?? REACH_TO_SPHERE[c.targetReach ?? 'iron'] ?? 'force';
        const cost = c.category === 'ambition_drift' ? WHISPER_ESSENCE_COST_AMBITION_DRIFT : WHISPER_ESSENCE_COST_BASE;

        return {
          category: c.category,
          targetReach: c.targetReach,
          targetSphere: c.targetSphere,
          essenceCost: cost,
          sphere,
          prose: label,
          flavorText: flavor,
        };
      });

      // Generate vignette
      const vignette = generateWhisperVignette(agent, graph, state, rng);

      // Emit premonition event
      const showAfterTick = state.tick + PREMONITION_DISPLAY_DELAY_TICKS;
      const premonition: PremonitionEvent = {
        id: `whisper_${agent.id}_${state.tick}`,
        type: 'whisper',
        agentId: agent.id,
        agentName: agent.name,
        tick: state.tick,
        showAfterTick,
        eligibleUntilTick: showAfterTick + PREMONITION_EXPIRY_TICKS,
        vignetteProse: vignette,
        whisperOptions: options,
      };
      newPremonitions.push(premonition);

      // Mark whisper as consumed for this idle period
      graph.updateNode(agent.id, {
        properties: { ...agent.properties, whisperAvailable: false },
      });

    } catch {
      // Fail-soft: skip this agent, never crash the tick loop
      continue;
    }
  }

  // Merge with existing queue (discard stale + no-longer-idle entries)
  const existingQueue = (state.premonitionQueue ?? []).filter(p => {
    if (p.eligibleUntilTick <= state.tick) return false;
    // Prune whispers/compulsions for agents that are no longer idle
    const agentNode = graph.getNode(p.agentId);
    if (agentNode && !isAgentIdle(agentNode, state)) return false;
    return true;
  });

  // Only return premonitionQueue — do NOT return tickEvents here.
  // This phase doesn't emit tick events. Returning tickEvents: [] would
  // overwrite the accumulated events from prior phases when the orchestrator
  // spreads the result.
  return {
    premonitionQueue: [...existingQueue, ...newPremonitions],
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
