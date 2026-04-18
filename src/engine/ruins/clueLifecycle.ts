/**
 * Clue edge lifecycle — PR 2 of the Ruins Layer (THR-150).
 *
 * Implements:
 *   - selectClueRecipient   pure Narrative Gravity weighted-random selection (testable)
 *   - produceClueConsequence create a knows_clue_of edge from any source
 *   - consumeCluesOnConvergence prune clues when a delve is admitted
 *   - spawnClueFromEvent    aftermath hook callable from encounter templates
 *   - phaseClueDecay        tick phase — sweep and prune expired clue edges
 *
 * Fail-soft: all mutations are wrapped in try/catch so a bad clue edge never
 * crashes the tick loop.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { EncounterProgress } from '../../types/encounter';
import type { AttentionTier } from '../../types/attention';
import type { AgentNodeProperties } from '../../types/graph';
import type { ClueSource, CluePrecision, KnowsClueOfEdgeProperties } from '../../types/knowledge';
import { emitTrace } from '../traceBuffer';
import {
  CLUE_MAX_AGE_TICKS_VAGUE,
  CLUE_MAX_AGE_TICKS_NARROWED,
  CLUE_MAX_AGE_TICKS_LOCATED,
  CLUE_DECAY_CHECK_INTERVAL,
  CLUE_BIAS_TIER_STORY_BEAT,
  CLUE_BIAS_TIER_SHAPING,
  CLUE_BIAS_TIER_BACKGROUND,
  CLUE_BIAS_BONDED_AGENT,
  CLUE_BIAS_PORTFOLIO_PINNED,
  CLUE_BIAS_FACTION_LEADER,
  CLUE_BIAS_SPHERE_MATCH,
  CLUE_BIAS_CULTURE_BACKSTORY_TIE,
  RECEIVER_RECENT_CLUE_PENALTY,
  RECEIVER_RECENT_CLUE_WINDOW_TICKS,
  WEIGHTED_SELECTION_TOP_N,
  SAGA_MAGNITUDE_THRESHOLD,
  SAGA_CLUE_MIN_TIER,
} from './constants';

// Minimum faction reputation score on a member_of edge to qualify as "faction leader".
const FACTION_LEADER_MIN_REPUTATION = 0.75;

// ─── Tier utilities ──────────────────────────────────────────────────────────

const TIER_ORDER: Record<AttentionTier, number> = {
  background: 0,
  shaping: 1,
  story_beat: 2,
};

function tierMultiplier(tier: AttentionTier): number {
  switch (tier) {
    case 'story_beat': return CLUE_BIAS_TIER_STORY_BEAT;
    case 'shaping':    return CLUE_BIAS_TIER_SHAPING;
    case 'background': return CLUE_BIAS_TIER_BACKGROUND;
  }
}

function tierMeetsFloor(tier: AttentionTier, floor: AttentionTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER[floor];
}

// ─── Agent-level helpers ─────────────────────────────────────────────────────

/**
 * Derive an agent's effective attention tier from their active encounters.
 * Returns the highest effectiveTier from any active encounter, falling back
 * to 'background' when the agent has no active encounters.
 */
export function getAgentAttentionTier(
  agentId: string,
  encounterProgress: readonly EncounterProgress[],
): AttentionTier {
  let best: AttentionTier = 'background';
  for (const ep of encounterProgress) {
    if (ep.actorId !== agentId || ep.status !== 'active') continue;
    const tier = ep.effectiveTier;
    if (!tier || tier === 'invisible') continue;
    if (TIER_ORDER[tier as AttentionTier] > TIER_ORDER[best]) {
      best = tier as AttentionTier;
    }
  }
  return best;
}

/** Returns CLUE_BIAS_FACTION_LEADER for ascendants and high-reputation faction members, else 0. */
function getFactionLeaderBonus(agentId: string, graph: WorldGraph): number {
  const node = graph.getNode(agentId);
  if (!node) return 0;
  if ((node.properties as AgentNodeProperties).actorType === 'ascendant') {
    return CLUE_BIAS_FACTION_LEADER;
  }
  for (const edge of graph.getOutgoingEdges(agentId, 'member_of')) {
    const rep = (edge.properties as Record<string, unknown>).reputation as number | undefined;
    if (rep != null && rep >= FACTION_LEADER_MIN_REPUTATION) return CLUE_BIAS_FACTION_LEADER;
  }
  return 0;
}

/**
 * Check whether an agent's backstory ties them to a given culture.
 * Checks `originCultureId` node property and `backstoryStrata[].cultureId` array.
 */
function agentTiesToCulture(agentId: string, cultureId: string, graph: WorldGraph): boolean {
  if (!cultureId) return false;
  const node = graph.getNode(agentId);
  if (!node) return false;
  const props = node.properties as Record<string, unknown>;
  if (props.originCultureId === cultureId) return true;
  const strata = props.backstoryStrata as Array<{ cultureId?: string }> | undefined;
  return strata?.some(s => s.cultureId === cultureId) ?? false;
}

/** True when the agent received any non-consumed clue within RECEIVER_RECENT_CLUE_WINDOW_TICKS. */
function agentReceivedClueRecently(agentId: string, tick: number, graph: WorldGraph): boolean {
  for (const edge of graph.getOutgoingEdges(agentId, 'knows_clue_of')) {
    const props = edge.properties as KnowsClueOfEdgeProperties;
    if (!props.consumed && tick - props.discoveredTick < RECEIVER_RECENT_CLUE_WINDOW_TICKS) {
      return true;
    }
  }
  return false;
}

// ─── Candidate scoring ───────────────────────────────────────────────────────

export interface CandidateScoreBreakdown {
  knowerId: string;
  baseTierMultiplier: number;
  bondedBonus: number;
  portfolioBonus: number;
  factionRankBonus: number;
  sphereAlignmentMatchBonus: number;
  cultureBackstoryTieBonus: number;
  recentCluePenalty: number;
  finalScore: number;
}

interface ScoredCandidate {
  agentId: string;
  tier: AttentionTier;
  score: number;
  breakdown: CandidateScoreBreakdown;
}

function scoreCandidate(
  agentId: string,
  ruinMagnitude: number,
  ruinSphereAlignment: string,
  ruinOriginCultureId: string,
  ascendantId: string,
  tick: number,
  graph: WorldGraph,
  encounterProgress: readonly EncounterProgress[],
): ScoredCandidate {
  const tier = getAgentAttentionTier(agentId, encounterProgress);
  const baseTierMultiplier = tierMultiplier(tier);

  const isThreaded = graph.getOutgoingEdges(ascendantId, 'thread').some(e => e.target === agentId);
  const bondedBonus = isThreaded ? CLUE_BIAS_BONDED_AGENT : 0;

  const node = graph.getNode(agentId);
  const isPortfolioPinned =
    (node?.properties as AgentNodeProperties | undefined)?.isPortfolioPinned ?? false;
  const portfolioBonus = isPortfolioPinned ? CLUE_BIAS_PORTFOLIO_PINNED : 0;

  const factionRankBonus = getFactionLeaderBonus(agentId, graph);

  const agentSphere =
    (node?.properties as Record<string, unknown> | undefined)?.primarySphere as string | undefined;
  const sphereAlignmentMatchBonus =
    agentSphere && agentSphere === ruinSphereAlignment ? CLUE_BIAS_SPHERE_MATCH : 0;

  const cultureBackstoryTieBonus = agentTiesToCulture(agentId, ruinOriginCultureId, graph)
    ? CLUE_BIAS_CULTURE_BACKSTORY_TIE
    : 0;

  const recentCluePenalty = agentReceivedClueRecently(agentId, tick, graph)
    ? RECEIVER_RECENT_CLUE_PENALTY
    : 1.0;

  const finalScore =
    baseTierMultiplier *
    (1 + bondedBonus) *
    (1 + portfolioBonus) *
    (1 + factionRankBonus) *
    (1 + sphereAlignmentMatchBonus) *
    (1 + cultureBackstoryTieBonus) *
    recentCluePenalty;

  return {
    agentId,
    tier,
    score: finalScore,
    breakdown: {
      knowerId: agentId,
      baseTierMultiplier,
      bondedBonus,
      portfolioBonus,
      factionRankBonus,
      sphereAlignmentMatchBonus,
      cultureBackstoryTieBonus,
      recentCluePenalty,
      finalScore,
    },
  };
}

// ─── selectClueRecipient ─────────────────────────────────────────────────────

export interface SelectClueRecipientParams {
  candidatePool: string[];
  ruinMagnitude: number;
  ruinSphereAlignment: string;
  ruinOriginCultureId: string;
  ascendantId: string;
  tick: number;
  graph: WorldGraph;
  encounterProgress: readonly EncounterProgress[];
  /** Seeded RNG — must be deterministic given same seed. */
  rng: () => number;
}

export interface SelectClueRecipientResult {
  selectedAgentId: string | null;
  scores: CandidateScoreBreakdown[];
  suppressedReason?: 'no_candidates_meet_tier_floor' | 'empty_pool';
}

/**
 * Pure function: selects a clue recipient from candidatePool via Narrative Gravity.
 * Returns null if the pool is empty or no candidate meets the magnitude-tier floor.
 * Deterministic given the same RNG seed — reproducible for test/replay.
 */
export function selectClueRecipient(params: SelectClueRecipientParams): SelectClueRecipientResult {
  const {
    candidatePool, ruinMagnitude, ruinSphereAlignment, ruinOriginCultureId,
    ascendantId, tick, graph, encounterProgress, rng,
  } = params;

  if (candidatePool.length === 0) {
    return { selectedAgentId: null, scores: [], suppressedReason: 'empty_pool' };
  }

  const scored: ScoredCandidate[] = candidatePool.map(id =>
    scoreCandidate(id, ruinMagnitude, ruinSphereAlignment, ruinOriginCultureId,
      ascendantId, tick, graph, encounterProgress)
  );

  // Saga tier floor: hard filter when magnitude >= threshold
  let eligible = scored;
  if (ruinMagnitude >= SAGA_MAGNITUDE_THRESHOLD) {
    eligible = scored.filter(c => tierMeetsFloor(c.tier, SAGA_CLUE_MIN_TIER));
    if (eligible.length === 0) {
      return {
        selectedAgentId: null,
        scores: scored.map(s => s.breakdown),
        suppressedReason: 'no_candidates_meet_tier_floor',
      };
    }
  }

  // Top-N by score for weighted-random selection
  const topN = eligible
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, WEIGHTED_SELECTION_TOP_N);

  const total = topN.reduce((sum, c) => sum + c.score, 0);
  let roll = rng() * total;
  let selected = topN[topN.length - 1]; // safe fallback
  for (const candidate of topN) {
    roll -= candidate.score;
    if (roll <= 0) {
      selected = candidate;
      break;
    }
  }

  return {
    selectedAgentId: selected.agentId,
    scores: topN.map(c => c.breakdown),
  };
}

// ─── produceClueConsequence ──────────────────────────────────────────────────

export interface ProduceClueConsequenceParams {
  /** Agents eligible to receive this clue. */
  candidatePool: string[];
  targetRuinId: string;
  ruinMagnitude: number;
  ruinSphereAlignment: string;
  ruinOriginCultureId: string;
  source: ClueSource;
  precision: CluePrecision;
  detail?: string;
  composedByGodId?: string;
  ascendantId: string;
  tick: number;
  graph: WorldGraph;
  encounterProgress: readonly EncounterProgress[];
  rng: () => number;
}

/**
 * Core consequence function. Runs Narrative Gravity to pick a recipient,
 * creates a knows_clue_of edge, and emits the appropriate traces.
 *
 * Returns the selected agent ID, or null if the clue was suppressed.
 */
export function produceClueConsequence(params: ProduceClueConsequenceParams): string | null {
  const {
    candidatePool, targetRuinId, ruinMagnitude, ruinSphereAlignment, ruinOriginCultureId,
    source, precision, detail, composedByGodId, ascendantId, tick, graph, encounterProgress, rng,
  } = params;

  const selection = selectClueRecipient({
    candidatePool, ruinMagnitude, ruinSphereAlignment, ruinOriginCultureId,
    ascendantId, tick, graph, encounterProgress, rng,
  });

  if (!selection.selectedAgentId) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick,
      targetRuinId,
      ruinMagnitude,
      requiredMinTier: SAGA_CLUE_MIN_TIER,
      candidatePoolSize: candidatePool.length,
      candidatesByTier: {
        background: selection.scores.filter(s => s.baseTierMultiplier === CLUE_BIAS_TIER_BACKGROUND).length,
        shaping:    selection.scores.filter(s => s.baseTierMultiplier === CLUE_BIAS_TIER_SHAPING).length,
        story_beat: selection.scores.filter(s => s.baseTierMultiplier === CLUE_BIAS_TIER_STORY_BEAT).length,
      },
      summary: `Clue suppressed — no candidate meets tier floor for ${targetRuinId} (mag ${ruinMagnitude.toFixed(2)})`,
    });
    return null;
  }

  emitTrace({
    category: 'ruins.clue_receiver_selected',
    tick,
    selectedKnowerId: selection.selectedAgentId,
    targetRuinId,
    candidatePoolSize: candidatePool.length,
    scoreBreakdown: selection.scores,
    weightedRandomSeed: String(tick),
    summary: `Clue routed to ${selection.selectedAgentId} for ${targetRuinId} (${selection.scores.length} candidates)`,
  });

  const edgeId = `clue_${selection.selectedAgentId}_${targetRuinId}_${tick}`;
  const edgeProps: KnowsClueOfEdgeProperties = {
    magnitude: ruinMagnitude,
    precision,
    source,
    discoveredTick: tick,
    consumed: false,
    detail,
    composedByGodId,
  };

  graph.addEdge({
    id: edgeId,
    source: selection.selectedAgentId,
    target: targetRuinId,
    type: 'knows_clue_of',
    properties: edgeProps as unknown as Record<string, unknown>,
  });

  emitTrace({
    category: 'ruins.clue_discovered',
    tick,
    knowerId: selection.selectedAgentId,
    targetRuinId,
    source,
    precision,
    magnitude: ruinMagnitude,
    composedByGodId,
    summary: `Clue discovered: ${selection.selectedAgentId} → ${targetRuinId} via ${source} (${precision})`,
  });

  return selection.selectedAgentId;
}

// ─── spawnClueFromEvent (aftermath hook) ────────────────────────────────────

export interface SpawnClueFromEventParams {
  /** Agent who experienced the encounter. */
  actorId: string;
  /** Ruin this clue points at. */
  targetRuinId: string;
  source: ClueSource;
  precision?: CluePrecision;
  /** Candidate pool. Defaults to [actorId] if omitted. */
  candidatePool?: string[];
  state: GameState;
  rng: () => number;
}

/**
 * Encounter aftermath hook. Callable from encounter templates to produce a
 * knows_clue_of edge when the actor's outcome warrants it.
 *
 * Returns the selected recipient agent ID, or null if suppressed.
 */
export function spawnClueFromEvent(params: SpawnClueFromEventParams): string | null {
  const { actorId, targetRuinId, source, state, rng } = params;
  const precision = params.precision ?? 'vague';
  const candidatePool = params.candidatePool ?? [actorId];

  const ruinNode = state.graph.getNode(targetRuinId);
  if (!ruinNode) return null;

  const ruinProps = ruinNode.properties as Record<string, unknown>;
  const ruinMagnitude     = (ruinProps.ruinMagnitude  as number | undefined) ?? 0.5;
  const ruinSphereAlignment  = (ruinProps.sphereAlignment   as string | undefined) ?? '';
  const ruinOriginCultureId  = (ruinProps.originCultureId   as string | undefined) ?? '';

  return produceClueConsequence({
    candidatePool,
    targetRuinId,
    ruinMagnitude,
    ruinSphereAlignment,
    ruinOriginCultureId,
    source,
    precision,
    ascendantId: state.ascendantId,
    tick: state.tick,
    graph: state.graph,
    encounterProgress: state.encounterProgress,
    rng,
  });
}

// ─── consumeCluesOnConvergence ───────────────────────────────────────────────

/**
 * Called when an agent begins a delve at a ruin.
 * Prunes all live knows_clue_of edges pointing at the ruin and replaces
 * them with knows_of familiarity edges on the same knowers.
 */
export function consumeCluesOnConvergence(
  ruinId: string,
  graph: WorldGraph,
  tick: number,
  delveId: string,
): void {
  const clueEdges = graph.getAllEdges().filter(
    e => e.type === 'knows_clue_of' && e.target === ruinId
  );

  for (const edge of clueEdges) {
    const props = edge.properties as KnowsClueOfEdgeProperties;
    if (props.consumed) continue;

    const knowerId = edge.source;
    try {
      graph.removeEdge(edge.id);
    } catch {
      continue; // already removed
    }

    // Replace with familiarity edge
    try {
      graph.addEdge({
        id: `knows_of_${knowerId}_${ruinId}_${tick}`,
        source: knowerId,
        target: ruinId,
        type: 'knows_of',
        properties: { fromClue: true, convergedTick: tick },
      });
    } catch {
      // non-fatal if familiarity edge can't be added
    }

    emitTrace({
      category: 'ruins.clue_consumed',
      tick,
      knowerId,
      targetRuinId: ruinId,
      delveId,
      sourceAtDiscovery: props.source,
      ticksHeld: tick - props.discoveredTick,
      summary: `Clue consumed: ${knowerId} → ${ruinId} after ${tick - props.discoveredTick}t (${props.source})`,
    });
  }
}

// ─── phaseClueDecay ──────────────────────────────────────────────────────────

const CLUE_MAX_AGE: Record<CluePrecision, number> = {
  vague:    CLUE_MAX_AGE_TICKS_VAGUE,
  narrowed: CLUE_MAX_AGE_TICKS_NARROWED,
  located:  CLUE_MAX_AGE_TICKS_LOCATED,
};

/**
 * Phase 6.654: Clue Decay — sweep knows_clue_of edges and prune expired ones.
 * Runs every CLUE_DECAY_CHECK_INTERVAL ticks (not every tick).
 * Mutates graph edges in place (standard pattern).
 */
export function phaseClueDecay(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  if (tick % CLUE_DECAY_CHECK_INTERVAL !== 0) return {};

  try {
    const clueEdges = graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
    for (const edge of clueEdges) {
      const props = edge.properties as KnowsClueOfEdgeProperties;

      // Consumed clues should have been pruned at convergence; clean up stragglers
      if (props.consumed) {
        try { graph.removeEdge(edge.id); } catch { /* already gone */ }
        continue;
      }

      const age = tick - props.discoveredTick;
      const maxAge = CLUE_MAX_AGE[props.precision] ?? CLUE_MAX_AGE_TICKS_VAGUE;

      if (age > maxAge) {
        const knowerId    = edge.source;
        const targetRuinId = edge.target;
        try { graph.removeEdge(edge.id); } catch { /* already gone */ }

        emitTrace({
          category: 'ruins.clue_decayed',
          tick,
          knowerId,
          targetRuinId,
          precisionAtDecay: props.precision,
          reason: 'ttl_expired',
          summary: `Clue decayed: ${knowerId}'s ${props.precision} clue about ${targetRuinId} (age ${age}t > max ${maxAge}t)`,
        });
      }
    }
  } catch {
    // fail-soft: clue decay failure is non-fatal to the tick loop
  }

  return {};
}

// ─── findAnyRuinId (dynamic resolution helper) ──────────────────────────────

/**
 * Scan the graph for any location node with a ruinMagnitude property.
 * Used by the aftermath handler to resolve '$nearest_ruin' in spawn_clue effects.
 * Returns the first ruin found, or null if none exist yet (ruins worldgen pending).
 * The rng parameter allows caller to shuffle before picking, ensuring variety.
 */
export function findAnyRuinId(graph: WorldGraph, rng?: () => number): string | null {
  const ruinNodes = graph.getNodesByType('location').filter(
    n => typeof (n.properties.ruinMagnitude) === 'number'
  );
  if (ruinNodes.length === 0) return null;
  if (!rng) return ruinNodes[0].id;
  // Weighted-random pick (uniform among ruins — magnitude weighting is handled by selectClueRecipient)
  const idx = Math.floor(rng() * ruinNodes.length);
  return ruinNodes[Math.min(idx, ruinNodes.length - 1)].id;
}
