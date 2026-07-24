/**
 * Domain Capability Computation.
 *
 * Walks the actor's graph neighborhood (traits, artifacts, enchantments, resources)
 * to compute a raw score per Reach domain, applies the sigmoid curve,
 * and maps to the 10-tier narrative lexicon.
 */
import type { WorldGraph } from './graph';
import { deriveFactionProsperity } from './factionNetwork';
import { collectStatContributions } from './effects/effectQueries';
import { ECON_FACTION_POWER_WEIGHT } from '../data/economic-power-config';
import type { TraitDefinitionProperties, TraitAssignmentProperties, ReachDomain, DomainContributions } from '../types/traits';
import { REACH_DOMAINS, NARRATIVE_LEXICON } from '../types/traits';

/** Sigmoid parameters tuned per design doc */
const SIGMOID_MIDPOINT = 10;
const SIGMOID_K = 0.4;

/**
 * Standard sigmoid function: 1 / (1 + e^(-k*(x - midpoint)))
 */
function sigmoid(x: number, midpoint: number = SIGMOID_MIDPOINT, k: number = SIGMOID_K): number {
  return 1 / (1 + Math.exp(-k * (x - midpoint)));
}

interface Contributor {
  name: string;
  sourceId: string;
  contribution: number;
}

/**
 * Compute the raw score for a single domain by walking:
 * - domainCapabilities base value from node properties (innate aptitude)
 * - has_trait edges → trait domainContributions × level
 * - possesses/bonded_to edges → artifact domainContributions
 * - controls edges → resource domainContributions
 */
export function computeRawScore(
  graph: WorldGraph,
  nodeId: string,
  domain: ReachDomain,
): number {
  // Start with innate domain capability if present on the node
  const node = graph.getNode(nodeId);
  const caps = node?.properties.domainCapabilities as Record<string, number> | undefined;
  let total = caps?.[domain] ?? 0;

  // Faction economic power term (THR-617): a faction's GOLD capability grows
  // with the derived prosperity of its holdings — trade wealth is capability.
  if (domain === 'gold' && node?.properties.actorType === 'faction') {
    total += deriveFactionProsperity(graph, nodeId) * ECON_FACTION_POWER_WEIGHT;
  }

  // Walk trait edges
  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;
    const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;
    const assignment = edge.properties as unknown as TraitAssignmentProperties;
    const contributions = traitDef.domainContributions as DomainContributions | undefined;
    const base = contributions?.[domain] ?? 0;
    // Fail-soft (NFP #4): condition/clue trait edges (and any edge that forgets to set
    // `level`) leave `level` undefined; `base * undefined` is NaN, which poisons the
    // whole raw score and, through the sigmoid, makes every reach's capability NaN. A
    // missing level means "present, unscaled" → default to 1. No-op for real capability
    // traits (worldgen/culture/growth all set a numeric level).
    total += base * (assignment.level ?? 1);
  }

  // Walk artifact edges (possesses, bonded_to)
  for (const edgeType of ['possesses', 'bonded_to'] as const) {
    const edges = graph.getOutgoingEdges(nodeId, edgeType);
    for (const edge of edges) {
      const artifactNode = graph.getNode(edge.target);
      if (!artifactNode) continue;
      // Legacy node-prop read stays (NFP #6): modded/old artifacts and any entry
      // still carrying a real domainContributions bag keep working.
      const contributions = artifactNode.properties.domainContributions as DomainContributions | undefined;
      if (contributions) {
        total += contributions[domain] ?? 0;
      }
      // THR-718: the one stat substrate for item→tier influence — the finished
      // effects[] migration. Additive raw-score term feeding the same sigmoid.
      total += collectStatContributions(artifactNode)[domain] ?? 0;
    }
  }

  // Walk resource edges (controls)
  const controlEdges = graph.getOutgoingEdges(nodeId, 'controls');
  for (const edge of controlEdges) {
    const resourceNode = graph.getNode(edge.target);
    if (!resourceNode) continue;
    const contributions = resourceNode.properties.domainContributions as DomainContributions | undefined;
    if (contributions) {
      total += contributions[domain] ?? 0;
    }
  }

  // God-side reach practice (THR-613, plan §3.1): the ascendant accrues a
  // `reachPractice` bag as it acts in its two permanent reaches. Additive raw-score
  // term feeding the same sigmoid — one source of truth, no parallel XP number. Only
  // the ascendant carries this bag; undefined elsewhere → +0 (purely additive).
  const reachPractice = node?.properties.reachPractice as DomainContributions | undefined;
  total += reachPractice?.[domain] ?? 0;

  return total;
}

/**
 * Compute the capability (0-1) for a domain using sigmoid curve.
 */
export function computeCapability(
  graph: WorldGraph,
  nodeId: string,
  domain: ReachDomain,
): number {
  const raw = computeRawScore(graph, nodeId, domain);
  return sigmoid(raw);
}

/**
 * Map a capability (0-1) to a tier (1-10).
 */
export function computeTier(capability: number): number {
  return Math.min(10, Math.max(1, Math.ceil(capability * 10)));
}

/**
 * Get the narrative label for a domain and tier.
 */
export function getNarrativeLabel(domain: ReachDomain, tier: number): string {
  const labels = NARRATIVE_LEXICON[domain];
  const index = Math.min(labels.length - 1, Math.max(0, tier - 1));
  return labels[index];
}

/**
 * Compute a full profile across all 9 domains.
 */
export function computeFullProfile(
  graph: WorldGraph,
  nodeId: string,
): Record<ReachDomain, { rawScore: number; capability: number; tier: number; label: string }> {
  const result = {} as Record<ReachDomain, { rawScore: number; capability: number; tier: number; label: string }>;

  for (const domain of REACH_DOMAINS) {
    const rawScore = computeRawScore(graph, nodeId, domain);
    const capability = sigmoid(rawScore);
    const tier = computeTier(capability);
    const label = getNarrativeLabel(domain, tier);
    result[domain] = { rawScore, capability, tier, label };
  }

  return result;
}

/**
 * Get the top N contributing factors for a domain, sorted by contribution magnitude.
 */
export function getTopContributors(
  graph: WorldGraph,
  nodeId: string,
  domain: ReachDomain,
  n: number,
): Contributor[] {
  const contributors: Contributor[] = [];

  // Trait contributions
  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;
    const traitDef = traitNode.properties as unknown as TraitDefinitionProperties;
    const assignment = edge.properties as unknown as TraitAssignmentProperties;
    const contributions = traitDef.domainContributions as DomainContributions | undefined;
    const base = contributions?.[domain] ?? 0;
    const contribution = base * assignment.level;
    if (contribution > 0) {
      contributors.push({ name: traitNode.name, sourceId: traitNode.id, contribution });
    }
  }

  // Artifact contributions
  for (const edgeType of ['possesses', 'bonded_to'] as const) {
    const edges = graph.getOutgoingEdges(nodeId, edgeType);
    for (const edge of edges) {
      const artifactNode = graph.getNode(edge.target);
      if (!artifactNode) continue;
      const contributions = artifactNode.properties.domainContributions as DomainContributions | undefined;
      const contribution = contributions?.[domain] ?? 0;
      if (contribution > 0) {
        contributors.push({ name: artifactNode.name, sourceId: artifactNode.id, contribution });
      }
    }
  }

  // Sort descending by contribution, take top N
  contributors.sort((a, b) => b.contribution - a.contribution);
  return contributors.slice(0, n);
}
