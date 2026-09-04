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
  resolveAgentPronouns,
} from '../data/premonition-content';
import type { AmbitionProseCategory } from '../data/premonition-content';

// ─── Reach Domains (for iteration) ─────────────────────────────

const ALL_REACHES: ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];

// ─── Helper: seeded pick from array ─────────────────────────────

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Helper: pronoun resolution ─────────────────────────────────
// Shared with the compulsion path — see resolveAgentPronouns in premonition-content.ts.

function resolveNudgeProse(
  template: string,
  name: string,
  reachName?: string,
  sphereName?: string,
): string {
  let result = resolveAgentPronouns(template, name);
  if (reachName) result = result.replace(/\{reachName\}/g, reachName);
  if (sphereName) result = result.replace(/\{sphereName\}/g, sphereName);
  return result;
}

// ─── Gate Chain ─────────────────────────────────────────────────

/**
 * The gates a threaded agent must clear before a whisper is generated for them,
 * in evaluation order. `null` means every gate passed.
 *
 * Exported so a headless probe can attribute a zero whisper count to a named gate
 * without replicating the chain — the phase below evaluates the same function, so
 * probe and production can never drift apart (THR-1414).
 */
export type PremonitionGate =
  | 'not_an_actor'
  | 'already_pending'
  | 'tier_below_1'
  | 'not_idle'
  | 'whisper_unavailable'
  | 'dissolved'
  | 'no_nudge_candidates';

/**
 * Evaluate the whisper gate chain for one agent. Returns the first gate that
 * rejects, or `null` when the agent is eligible.
 *
 * @param agentsWithPending ids that already hold a queued premonition — one at a time.
 */
export function evaluatePremonitionGates(
  agent: GraphNode,
  state: GameState,
  agentsWithPending: ReadonlySet<string>,
): PremonitionGate | null {
  if (agent.type !== 'actor') return 'not_an_actor';
  if (agentsWithPending.has(agent.id)) return 'already_pending';

  const tier = getThreadTier(state.graph, state.ascendantId, agent.id);
  if (tier < 1) return 'tier_below_1';

  if (!isAgentIdle(agent, state)) return 'not_idle';

  const whisperAvailable = (agent.properties?.whisperAvailable as boolean | undefined) ?? true;
  if (!whisperAvailable) return 'whisper_unavailable';

  const quintessence = (agent.properties?.quintessence as number | undefined) ?? 1.0;
  if (quintessence <= 0) return 'dissolved';

  if (deriveNudgeCandidates(agent, state.graph, state).length === 0) return 'no_nudge_candidates';

  return null;
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

  const combined = `${resolveAgentPronouns(baseVignette, agent.name)} ${resolveAgentPronouns(ambitionFragment, agent.name)}`;
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
      // Gate chain — see evaluatePremonitionGates. Kept as one call so the
      // headless probe attributes rejections to the same gates production uses.
      if (evaluatePremonitionGates(agent, state, agentsWithPending) !== null) continue;

      const premonition = buildWhisperPremonition(agent, state, rng);
      if (!premonition) continue;
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

  // Merge with existing queue, discarding stale entries.
  //
  // Expiry is the ONLY staleness rule — matching `phaseAgentDecision`, which
  // merges the same queue on `eligibleUntilTick > tick` alone.
  //
  // THR-1414: this filter also pruned entries whose agent was no longer idle,
  // which made every whisper undeliverable by construction. A whisper is born
  // only while the agent is idle, becomes visible `PREMONITION_DISPLAY_DELAY_TICKS`
  // (10) later — and `phaseAgentDecision`, running immediately after this phase in
  // the same tick, is what takes an idle agent and commits them to an action. So
  // the entry was pruned at tick+1, nine ticks before the UI was allowed to show
  // it. Measured on a generated seeded world: 8 whispers pushed over 200 ticks,
  // 0 surviving to their display window. See premonitionGateChain.test.ts.
  //
  // Dropping the idle test costs nothing the design wanted: a whisper's effect is
  // a decaying scoring bias on the agent's *next* decisions, so it stays meaningful
  // after they pick up work, and `eligibleUntilTick` already bounds how long it lives.
  const existingQueue = (state.premonitionQueue ?? []).filter(
    p => p.eligibleUntilTick > state.tick,
  );

  // Only return premonitionQueue — do NOT return tickEvents here.
  // This phase doesn't emit tick events. Returning tickEvents: [] would
  // overwrite the accumulated events from prior phases when the orchestrator
  // spreads the result.
  return {
    premonitionQueue: [...existingQueue, ...newPremonitions],
  };
}

/**
 * Build the whisper a given agent would receive right now, without consulting the
 * gate chain and without touching state.
 *
 * Split out of the phase loop (THR-1414) so `window.__DEBUG.forcePremonition` can
 * stage a real whisper — same prose, same nudge derivation, same display window —
 * rather than a hand-built stand-in that could drift from what players see.
 *
 * Returns null when the agent has no eligible nudges to offer.
 */
export function buildWhisperPremonition(
  agent: GraphNode,
  state: GameState,
  rng: () => number,
): PremonitionEvent | null {
  const { graph } = state;
  const candidates = deriveNudgeCandidates(agent, graph, state);
  if (candidates.length === 0) return null;

  {
    {
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

      return premonition;
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
