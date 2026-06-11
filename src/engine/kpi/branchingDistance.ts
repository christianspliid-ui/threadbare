/**
 * Branching Distance Heuristic (THR-452 Phase A).
 *
 * Per-gate distance-to-eligibility estimates for branching encounter templates.
 * Used only during `kpi:branching-audit` CLI runs — not in the steady-state tick loop.
 *
 * ─── Fail-soft ─────────────────────────────────────────────────────
 * | Failure                           | Behavior                         |
 * |-----------------------------------|----------------------------------|
 * | Unknown gate type                 | Returns distance='unknown', lever='soften' |
 * | Template not found in registry    | Returns distance='unknown'       |
 * | computeCapability throws          | Skip agent, continue             |
 * | resolveLocationToHex returns null | Skip location, continue          |
 *
 * ─── PRNG ───────────────────────────────────────────────────────────
 * None — pure read-only analysis.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { EncounterCacheEntry } from '../encounterCache';
import { getAnyEncounterById } from '../../data/encounter-content';
import { computeCapability } from '../domainCapability';
import { getChainProgress, isChainStageUnlocked } from '../encounterChains';
import { resolveLocationToHex } from '../encounterAwareness';
import { hexDistance } from '../../lib/hexMath';
import { THREAT_CAPABILITY_BANDS } from '../../types/encounter';
import { BRANCHING_NEARLY_ELIGIBLE_SAMPLE_SIZE } from '../encounter/branchingConstants';

// ─── Types ────────────────────────────────────────────────────────

export type SuggestedLever = 'soften' | 'ladder' | 'bias' | 'accept-as-rare';

export interface AgentDistanceSample {
  agentId: string;
  agentName: string;
  distanceValue: number;
  detail: string;
}

export interface GateDistanceReport {
  gate: string;
  /** Estimated steps away from eligibility (0 = eligible, Infinity = unreachable). */
  distanceScore: number;
  detail: string;
  agentSamples: AgentDistanceSample[];
  suggestedLever: SuggestedLever;
}

// ─── Per-gate estimators ──────────────────────────────────────────

function estimatePrerequisitesDistance(
  entry: EncounterCacheEntry,
  graph: WorldGraph,
  sampleSize: number,
): GateDistanceReport {
  const template = getAnyEncounterById(entry.templateId);
  if (!template) {
    return {
      gate: 'prerequisites',
      distanceScore: Infinity,
      detail: 'Template not found in registry',
      agentSamples: [],
      suggestedLever: 'soften',
    };
  }

  const agents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  // Check chain stage: how many agents are blocked purely by chain lock?
  let chainBlockedCount = 0;
  let chainUnlockedCount = 0;
  for (const agent of agents) {
    const progress = getChainProgress(agent.properties as Record<string, unknown>);
    if (!isChainStageUnlocked(entry.templateId, progress)) {
      chainBlockedCount++;
    } else {
      chainUnlockedCount++;
    }
  }

  // Check requiredTraits: how many agents meet all trait requirements?
  let traitBlockedCount = 0;
  const traitGaps: Array<{ agentName: string; missingTrait: string; gap: number }> = [];

  if (template.requiredTraits && template.requiredTraits.length > 0) {
    for (const agent of agents) {
      const traitEdges = graph.getOutgoingEdges(agent.id, 'has_trait');
      const missing = template.requiredTraits.filter(req => {
        return !traitEdges.some(e => {
          if (e.target !== req.traitId) return false;
          if (req.minLevel != null) {
            const level = (e.properties as Record<string, unknown>)?.level;
            return typeof level === 'number' && level >= req.minLevel;
          }
          return true;
        });
      });
      if (missing.length > 0) {
        traitBlockedCount++;
        const name = String(agent.properties.name ?? agent.id);
        const missingSummary = missing.map(r => {
          const edge = traitEdges.find(e => e.target === r.traitId);
          const has = edge ? ((edge.properties as Record<string, unknown>)?.level as number ?? 0) : 0;
          const needs = r.minLevel ?? 1;
          return { agentName: name, missingTrait: r.traitId, gap: needs - has };
        });
        traitGaps.push(...missingSummary);
      }
    }
  }

  const totalAgents = agents.length;
  const chainBlockedFrac = totalAgents > 0 ? chainBlockedCount / totalAgents : 0;
  const traitBlockedFrac = totalAgents > 0 ? traitBlockedCount / totalAgents : 0;

  // Determine what's primarily blocking
  let primaryDetail: string;
  let suggestedLever: SuggestedLever;
  let distanceScore: number;
  const samples: AgentDistanceSample[] = [];

  if (chainBlockedFrac > 0.5 && chainBlockedFrac > traitBlockedFrac) {
    // Chain prereqs are the main blocker
    primaryDetail = `${(chainBlockedFrac * 100).toFixed(0)}% of agents blocked by chain stage lock — prior stage not completed`;
    suggestedLever = 'ladder';
    distanceScore = chainBlockedFrac * 3; // rough scale

    // Sample agents who are chain-blocked
    const chainBlocked = agents.filter(a => {
      const p = getChainProgress(a.properties as Record<string, unknown>);
      return !isChainStageUnlocked(entry.templateId, p);
    }).slice(0, sampleSize);
    for (const a of chainBlocked) {
      samples.push({
        agentId: a.id,
        agentName: String(a.properties.name ?? a.id),
        distanceValue: 1,
        detail: 'Chain stage locked (prior stage not yet completed)',
      });
    }
  } else if (traitBlockedFrac > 0.3) {
    // Trait prereqs are the main blocker
    const topMissing = traitGaps.sort((a, b) => b.gap - a.gap).slice(0, sampleSize);
    primaryDetail = `${(traitBlockedFrac * 100).toFixed(0)}% of agents lack required traits; worst gap: ${topMissing[0]?.missingTrait ?? 'unknown'}`;
    suggestedLever = 'soften';
    distanceScore = traitBlockedFrac * 2;
    for (const m of topMissing) {
      samples.push({
        agentId: '',
        agentName: m.agentName,
        distanceValue: m.gap,
        detail: `Missing ${m.missingTrait} (gap: +${m.gap})`,
      });
    }
  } else if (chainUnlockedCount === 0 && totalAgents > 0) {
    primaryDetail = 'No agents have completed the chain prerequisites for this template';
    suggestedLever = 'ladder';
    distanceScore = Infinity;
  } else {
    primaryDetail = `${(chainBlockedFrac * 100).toFixed(0)}% chain-blocked, ${(traitBlockedFrac * 100).toFixed(0)}% trait-blocked`;
    suggestedLever = 'soften';
    distanceScore = Math.max(chainBlockedFrac, traitBlockedFrac);
  }

  return {
    gate: 'prerequisites',
    distanceScore,
    detail: primaryDetail,
    agentSamples: samples,
    suggestedLever,
  };
}

function estimateThreatDistance(
  entry: EncounterCacheEntry,
  graph: WorldGraph,
  sampleSize: number,
): GateDistanceReport {
  const band = THREAT_CAPABILITY_BANDS[entry.threatRating];
  const minCap = band ? band[0] : 0; // capability value (0-100 scale)

  const agents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  const samples: AgentDistanceSample[] = [];
  let closestGap = Infinity;

  // Sort agents by closest to meeting the minimum threshold
  const agentGaps: Array<{ agent: typeof agents[0]; cap: number; gap: number }> = [];
  for (const agent of agents) {
    try {
      const capRaw = computeCapability(graph, agent.id, entry.reachPrimary);
      const cap = capRaw * 100; // normalize to 0-100 scale (matches THREAT_CAPABILITY_BANDS)
      const gap = Math.max(0, minCap - cap);
      agentGaps.push({ agent, cap, gap });
    } catch {
      // fail-soft: skip agent
    }
  }

  agentGaps.sort((a, b) => a.gap - b.gap);
  const top = agentGaps.slice(0, sampleSize);
  closestGap = top[0]?.gap ?? Infinity;

  for (const { agent, cap, gap } of top) {
    samples.push({
      agentId: agent.id,
      agentName: String(agent.properties.name ?? agent.id),
      distanceValue: gap,
      detail: `${entry.reachPrimary} cap=${cap.toFixed(1)} (needs ${minCap}+ for ${entry.threatRating}; gap=${gap.toFixed(1)})`,
    });
  }

  const belowThresholdCount = agentGaps.filter(a => a.gap > 0).length;
  const detail = `${belowThresholdCount}/${agents.length} agents below ${entry.threatRating} threat floor (${minCap}); nearest gap: ${closestGap.toFixed(1)}`;

  return {
    gate: 'threat',
    distanceScore: closestGap,
    detail,
    agentSamples: samples,
    suggestedLever: closestGap > 20 ? 'soften' : 'bias',
  };
}

function estimateAwarenessDistance(
  entry: EncounterCacheEntry,
  graph: WorldGraph,
): GateDistanceReport {
  const agents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  const locNode = graph.getNode(entry.locationId);
  const locHex = locNode ? resolveLocationToHex(graph, entry.locationId) : null;

  if (!locHex) {
    return {
      gate: 'awareness',
      distanceScore: Infinity,
      detail: 'Cannot resolve location hex — location may not exist in this run',
      agentSamples: [],
      suggestedLever: 'soften',
    };
  }

  let minDist = Infinity;
  const samples: AgentDistanceSample[] = [];
  const distList: Array<{ agent: typeof agents[0]; dist: number }> = [];

  for (const agent of agents) {
    const locEdges = graph.getOutgoingEdges(agent.id, 'located_at');
    if (locEdges.length === 0) continue;
    const agentHex = resolveLocationToHex(graph, locEdges[0].target);
    if (!agentHex) continue;
    const dist = hexDistance(agentHex, locHex);
    distList.push({ agent, dist });
  }

  distList.sort((a, b) => a.dist - b.dist);
  minDist = distList[0]?.dist ?? Infinity;

  for (const { agent, dist } of distList.slice(0, BRANCHING_NEARLY_ELIGIBLE_SAMPLE_SIZE)) {
    samples.push({
      agentId: agent.id,
      agentName: String(agent.properties.name ?? agent.id),
      distanceValue: dist,
      detail: `${dist} hex(es) from encounter location`,
    });
  }

  const subtypeNote = entry.sublocationTypeId ? ` (requires sublocation ${entry.sublocationTypeId})` : '';
  const detail = `Nearest agent is ${minDist === Infinity ? '∞' : minDist} hex(es) from ${entry.locationId}${subtypeNote}`;

  return {
    gate: 'awareness',
    distanceScore: minDist,
    detail,
    agentSamples: samples,
    // awareness = physical proximity issue — ladder (more encounters in accessible spots)
    suggestedLever: 'ladder',
  };
}

function estimateCapDistance(): GateDistanceReport {
  return {
    gate: 'cap',
    distanceScore: 0,
    detail: 'Template reached scoring but was beaten by higher-scoring candidates (performance cap filter)',
    agentSamples: [],
    suggestedLever: 'bias', // curator bias helps compete
  };
}

function estimateVisibilityDistance(
  entry: EncounterCacheEntry,
  graph: WorldGraph,
  sampleSize: number,
): GateDistanceReport {
  const template = getAnyEncounterById(entry.templateId);
  const agents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  // Check sublocation requirement: count agents in matching sublocations
  const requiredSublocationTypes = (template as Record<string, unknown>)?.locationSubtypes as string[] | undefined;
  if (requiredSublocationTypes && requiredSublocationTypes.length > 0) {
    let inMatchingLoc = 0;
    for (const agent of agents) {
      const locEdge = graph.getOutgoingEdges(agent.id, 'located_at')[0];
      if (!locEdge) continue;
      const loc = graph.getNode(locEdge.target);
      const sub = loc?.properties?.locationSubtype as string | undefined;
      if (sub && requiredSublocationTypes.includes(sub)) inMatchingLoc++;
    }
    const frac = agents.length > 0 ? inMatchingLoc / agents.length : 0;
    if (frac < 0.1) {
      return {
        gate: 'visibility',
        distanceScore: 1 - frac,
        detail: `Only ${(frac * 100).toFixed(0)}% of agents are in required location subtypes: [${requiredSublocationTypes.join(', ')}]`,
        agentSamples: [],
        suggestedLever: 'ladder',
      };
    }
  }

  const samples: AgentDistanceSample[] = agents.slice(0, sampleSize).map(a => ({
    agentId: a.id,
    agentName: String(a.properties.name ?? a.id),
    distanceValue: 0,
    detail: 'Visibility analysis: sublocation/reputation gating',
  }));

  return {
    gate: 'visibility',
    distanceScore: 1,
    detail: 'Template is visibility-gated (sublocation, reputation, or outgrowth filter)',
    agentSamples: samples,
    suggestedLever: 'soften',
  };
}

// ─── Main export ──────────────────────────────────────────────────

/**
 * Estimate distance-to-eligibility for the primary blocking gate on a branching template.
 *
 * Only used during `kpi:branching-audit` runs — not in the tick loop.
 * Fail-soft: unknown gate → returns `distance='unknown'`, lever='soften'.
 */
export function computeGateDistance(
  gate: string,
  entry: EncounterCacheEntry,
  _state: GameState,
  graph: WorldGraph,
  sampleSize: number = BRANCHING_NEARLY_ELIGIBLE_SAMPLE_SIZE,
): GateDistanceReport {
  switch (gate) {
    case 'prerequisites':
      return estimatePrerequisitesDistance(entry, graph, sampleSize);
    case 'threat':
      return estimateThreatDistance(entry, graph, sampleSize);
    case 'awareness':
      return estimateAwarenessDistance(entry, graph);
    case 'cap':
      return estimateCapDistance();
    case 'visibility':
      return estimateVisibilityDistance(entry, graph, sampleSize);
    default:
      return {
        gate,
        distanceScore: Infinity,
        detail: `Unknown gate type '${gate}' — no heuristic available`,
        agentSamples: [],
        suggestedLever: 'soften',
      };
  }
}
