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
  PREMONITION_EXPIRY_TICKS,
  REACH_TO_SPHERE,
} from '../data/premonition-constants';
import {
  COMPULSION_VIGNETTE_TEMPLATES,
  COMPULSION_ENCOUNTER_HOOKS,
  getQuintessenceProseTier,
} from '../data/premonition-content';

// ─── Helper: seeded pick from array ─────────────────────────────

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
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

  // Take top N candidates
  const candidates = topCandidates.slice(0, COMPULSION_CANDIDATE_COUNT);

  // Build CompulsionCandidate entries
  const compulsionCandidates: CompulsionCandidate[] = candidates.map(c => {
    const template = getAnyEncounterById(c.entry.templateId);
    const encounterName = template?.name ?? c.entry.templateId;
    const reach = c.entry.reachPrimary;
    const sphere = c.entry.sphereAffinity ?? REACH_TO_SPHERE[reach] ?? 'force';
    const locationNode = graph.getNode(c.entry.locationId);
    const locationName = locationNode?.name ?? 'unknown';

    // Essence cost scales with threat
    const threatNorm = (c.entry.threatRating - 1) / 4; // 0..1
    const essenceCost = Math.round(
      COMPULSION_ESSENCE_COST_MIN + threatNorm * (COMPULSION_ESSENCE_COST_MAX - COMPULSION_ESSENCE_COST_MIN),
    );

    // Encounter hook prose
    const hooks = COMPULSION_ENCOUNTER_HOOKS[reach] ?? COMPULSION_ENCOUNTER_HOOKS.iron;
    const hook = resolvePronouns(seededPick(hooks, rng), agentName);

    return {
      templateId: c.entry.templateId,
      encounterName,
      encounterHook: hook,
      reach,
      sphere,
      threatRating: c.entry.threatRating,
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

  return {
    id: `compulsion_${agentId}_${state.tick}`,
    type: 'compulsion',
    agentId,
    agentName,
    tick: state.tick,
    eligibleUntilTick: state.tick + PREMONITION_EXPIRY_TICKS,
    vignetteProse,
    compulsionCandidates,
  };
}
