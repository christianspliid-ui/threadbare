/**
 * Compulsion generation — creates Compulsion premonition events from the agent
 * decision pipeline's scored candidates.
 *
 * Called from phaseAgentDecision between scoring and commitment for agents
 * with court position 'the_first' or 'retinue'.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import type { GameState } from '../types/gameState';
import type { PremonitionEvent, CompulsionCandidate } from '../types/premonition';
import type { ScoredCandidate } from './encounterScoring';
import type { WorldGraph } from './graph';
import { getAnyEncounterById } from '../data/encounter-content';
import {
  COMPULSION_CANDIDATE_COUNT,
  COMPULSION_ESSENCE_COST_MIN,
  COMPULSION_ESSENCE_COST_MAX,
  PREMONITION_DISPLAY_DELAY_TICKS,
  PREMONITION_EXPIRY_TICKS,
  REACH_TO_SPHERE,
} from '../data/premonition-constants';
import {
  COMPULSION_VIGNETTE_TEMPLATES,
  getQuintessenceProseTier,
  composeRetconLine,
} from '../data/premonition-content';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';

// ─── Helper: seeded pick from array ─────────────────────────────

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Map textual threat rating to 0..1 for cost scaling. */
function threatToNorm(rating: string): number {
  switch (rating) {
    case 'trivial': return 0;
    case 'easy':    return 0.25;
    case 'moderate': return 0.5;
    case 'hard':    return 0.75;
    case 'deadly':  return 1;
    default:        return 0.25;
  }
}

function resolvePronouns(template: string, name: string): string {
  return template
    .replace(/\{name\}/g, name)
    .replace(/\{possessive\}/g, 'their')
    .replace(/\{pronoun\}/g, 'they')
    .replace(/\{Pronoun\}/g, 'They');
}

// ─── Compulsion Eligibility ─────────────────────────────────────

export function isCompulsionEligible(
  graph: WorldGraph,
  ascendantId: string | null,
  agentId: string,
): boolean {
  if (!ascendantId) return false;
  // Only actors qualify for compulsion — not factions, locations, etc.
  const agentNode = graph.getNode(agentId);
  if (!agentNode || agentNode.type !== 'actor') return false;
  const edges = graph.getOutgoingEdges(ascendantId, 'thread');
  const threadEdge = edges.find(e => e.target === agentId);
  if (!threadEdge) return false;

  const courtPosition = (threadEdge.properties?.courtPosition as string) ?? null;
  return courtPosition === 'the_first' || courtPosition === 'retinue';
}

// ─── Build Compulsion Event ─────────────────────────────────────

export function buildCompulsionEvent(
  state: GameState,
  agentId: string,
  agentName: string,
  topCandidates: ScoredCandidate[],
  rng: () => number,
): PremonitionEvent | null {
  if (topCandidates.length === 0) return null;

  const { graph } = state;
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const quintessence = (agentNode.properties?.quintessence as number | undefined) ?? 1.0;
  if (quintessence <= 0) return null;

  // Take top N candidates, dedup by templateId (keep highest-scored)
  const seen = new Set<string>();
  const deduped = topCandidates.filter(c => {
    if (seen.has(c.entry.templateId)) return false;
    seen.add(c.entry.templateId);
    return true;
  });
  const candidates = deduped.slice(0, COMPULSION_CANDIDATE_COUNT);

  // Resolve agent hex once for distance computation
  const agentLocationId = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target ?? null;
  const agentHex = agentLocationId ? resolveLocationToHex(graph, agentLocationId) : null;

  // Build CompulsionCandidate entries
  const compulsionCandidates: CompulsionCandidate[] = candidates.map(c => {
    const template = getAnyEncounterById(c.entry.templateId);
    const encounterName = template?.name ?? c.entry.templateId;
    const reach = c.entry.reachPrimary;
    const sphere = c.entry.sphereAffinity ?? REACH_TO_SPHERE[reach] ?? 'force';
    const locationNode = graph.getNode(c.entry.locationId);
    const locationName = locationNode?.name ?? 'unknown';

    // Hex distance: same algorithm as encounterScoring.ts
    const entryHex = resolveLocationToHex(graph, c.entry.locationId);
    const dist = (agentHex && entryHex) ? hexDistance(agentHex, entryHex) : 0;

    // Essence cost scales with threat
    const threatNorm = threatToNorm(c.entry.threatRating);
    const essenceCost = Math.round(
      COMPULSION_ESSENCE_COST_MIN + threatNorm * (COMPULSION_ESSENCE_COST_MAX - COMPULSION_ESSENCE_COST_MIN),
    );

    // Retcon prose: composable data-driven hook
    const hook = composeRetconLine(rng, {
      encounterType: c.entry.encounterType,
      reach,
      threatRating: c.entry.threatRating,
      hexDistance: dist,
      requiresPresence: c.entry.requiresPresence,
      locationName,
      agentName,
    });

    return {
      templateId: c.entry.templateId,
      encounterName,
      encounterHook: hook,
      encounterType: c.entry.encounterType,
      reach,
      sphere,
      threatRating: c.entry.threatRating,
      hexDistance: dist,
      score: c.finalScore,
      essenceCost,
      locationId: c.entry.locationId,
      locationName,
    };
  });

  // Generate vignette
  const proseTier = getQuintessenceProseTier(quintessence);
  const vignetteTemplate = seededPick(COMPULSION_VIGNETTE_TEMPLATES[proseTier], rng);
  const vignetteProse = resolvePronouns(vignetteTemplate, agentName);

  const showAfterTick = state.tick + PREMONITION_DISPLAY_DELAY_TICKS;
  return {
    id: `compulsion_${agentId}_${state.tick}`,
    type: 'compulsion',
    agentId,
    agentName,
    tick: state.tick,
    showAfterTick,
    eligibleUntilTick: showAfterTick + PREMONITION_EXPIRY_TICKS,
    vignetteProse,
    compulsionCandidates,
  };
}
