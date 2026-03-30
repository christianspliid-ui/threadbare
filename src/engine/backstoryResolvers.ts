/**
 * Backstory Resolvers — graph-walking functions that produce BackstoryLayer fragments.
 *
 * Each resolver examines an agent node and walks connected graph edges to produce
 * tiered backstory content. Resolvers are fail-soft: missing nodes, properties,
 * or content keys return empty arrays.
 *
 * Strata:
 *   1 = Surface Story (Tier 1: Touched)
 *   2 = Personal History (Tier 2: Devoted)
 *   3 = Inner Life (Tier 3: Champion)
 *   4 = Unmasked Self (Tier 4: Aspect)
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */
import type { BackstoryLayer } from '../types/prose';
import { BACKSTORY_CONSTANTS } from '../types/prose';
import type { WorldGraph } from './graph';
import { mulberry32 } from '../lib/prng';
import {
  SURFACE_ORIGIN_PROSE,
  SURFACE_SPHERE_PROSE,
  BOND_HISTORY_PROSE,
  BOND_HISTORY_NEGATIVE_PROSE,
  TRAIT_ORIGIN_PROSE,
  TURNING_POINT_PROSE,
  CONTRADICTION_PROSE,
  DECISIVE_NATURE_PROSE,
  FEAR_PROSE,
  HIDDEN_MOTIVE_PROSE,
  STORY_ARC_PROSE,
  DIVINE_TRANSFORMATION_PROSE,
} from '../data/backstory-content';
import { FEAR_DESCRIPTIONS, VALUE_LABELS } from '../data/strand-content';
import type { ValuePair } from '../types/agent';

// ─── Shared utilities ─────────────────────────────────────────────────────────

/**
 * Pick a single template using seeded PRNG.
 */
function pickTemplate(templates: string[], seed: number): string | undefined {
  if (templates.length === 0) return undefined;
  const rng = mulberry32(seed);
  return templates[Math.floor(rng() * templates.length)];
}

/**
 * Replace all occurrences of {placeholder} with value.
 */
function replacePlaceholder(text: string, placeholder: string, value: string): string {
  return text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
}

/**
 * Replace multiple placeholders in a single pass.
 */
function replacePlaceholders(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = replacePlaceholder(result, key, value);
  }
  return result;
}

// ─── Stratum 1: Surface Story ─────────────────────────────────────────────────

/**
 * surfaceOriginResolver — public narrative by archetype.
 * Priority: 100 (core identity)
 * Category: 'origin'
 * Stratum: 1
 *
 * Agent node → narrativeArchetype property → belongs_to → culture node.name
 */
export function surfaceOriginResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const archetype = node.properties?.narrativeArchetype as string | undefined;
  if (!archetype) return [];

  const templates = SURFACE_ORIGIN_PROSE[archetype];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  // Walk belongs_to edge for culture name
  const cultureEdges = graph.getOutgoingEdges(nodeId, 'belongs_to');
  const cultureNode = cultureEdges.length > 0 ? graph.getNode(cultureEdges[0].target) : undefined;
  const cultureName = cultureNode?.name ?? 'their people';

  const text = replacePlaceholders(template, {
    name: node.name,
    culture: cultureName,
    archetype: archetype.replace(/_/g, ' '),
  });

  return [{
    text,
    priority: 100,
    category: 'origin',
    source: 'surfaceOriginResolver',
    stratum: 1,
  }];
}

/**
 * surfaceSphereResolver — observable sphere manifestation.
 * Priority: 80 (atmosphere)
 * Category: 'atmosphere'
 * Stratum: 1
 *
 * Agent node → primarySphere property.
 */
export function surfaceSphereResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const sphere = node.properties?.primarySphere as string | undefined;
  if (!sphere) return [];

  const templates = SURFACE_SPHERE_PROSE[sphere];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholders(template, {
    name: node.name,
    sphere,
  });

  return [{
    text,
    priority: 80,
    category: 'atmosphere',
    source: 'surfaceSphereResolver',
    stratum: 1,
  }];
}

// ─── Stratum 2: Personal History ─────────────────────────────────────────────

/**
 * bondHistoryResolver — significant bond by basis type.
 * Priority: 100
 * Category: 'character'
 * Stratum: 2
 *
 * Agent → relates_to edges → picks strongest bond → reads basis + sentiment.
 * Uses BOND_HISTORY_PROSE for positive, BOND_HISTORY_NEGATIVE_PROSE for negative.
 */
export function bondHistoryResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const bondEdges = graph.getOutgoingEdges(nodeId, 'relates_to');
  if (bondEdges.length === 0) return [];

  // Pick strongest bond
  let strongest = bondEdges[0];
  for (const edge of bondEdges) {
    const s = (edge.properties?.strength as number) ?? 0;
    const c = (strongest.properties?.strength as number) ?? 0;
    if (s > c) strongest = edge;
  }

  const bondNode = graph.getNode(strongest.target);
  if (!bondNode) return [];

  const basis = (strongest.properties?.basis as string) ?? 'friendship';
  const sentiment = (strongest.properties?.sentiment as number) ?? 0;

  const table = sentiment < 0 ? BOND_HISTORY_NEGATIVE_PROSE : BOND_HISTORY_PROSE;
  const templates = table[basis];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholders(template, {
    name: node.name,
    bond: bondNode.name,
    basis,
  });

  return [{
    text,
    priority: 100,
    category: 'character',
    source: 'bondHistoryResolver',
    stratum: 2,
  }];
}

/**
 * traitOriginResolver — how the agent's defining trait was acquired.
 * Priority: 80
 * Category: 'history'
 * Stratum: 2
 *
 * Agent → has_trait edges → trait node → subcategory property.
 */
export function traitOriginResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  if (traitEdges.length === 0) return [];

  const traitNode = graph.getNode(traitEdges[0].target);
  if (!traitNode) return [];

  const category = (traitNode.properties?.subcategory as string) ?? 'innate';
  const templates = TRAIT_ORIGIN_PROSE[category];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholders(template, {
    name: node.name,
    trait: traitNode.name,
  });

  return [{
    text,
    priority: 80,
    category: 'history',
    source: 'traitOriginResolver',
    stratum: 2,
  }];
}

/**
 * turningPointResolver — moment when dominant value crystallized.
 * Priority: 60
 * Category: 'tension'
 * Stratum: 2
 *
 * Agent → axiologicalProfile → value pair with highest absolute magnitude.
 */
export function turningPointResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const profile = node.properties?.axiologicalProfile as Record<string, number> | undefined;
  if (!profile) return [];

  // Find pair with highest absolute value
  let topPair: string | undefined;
  let topAbs = 0;
  for (const [pair, value] of Object.entries(profile)) {
    const abs = Math.abs(value);
    if (abs > topAbs) {
      topAbs = abs;
      topPair = pair;
    }
  }
  if (!topPair) return [];

  const templates = TURNING_POINT_PROSE[topPair];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  // Determine dominant pole label
  const pairValue = profile[topPair] ?? 0;
  const labels = VALUE_LABELS[topPair as ValuePair];
  const dominantPoleLabel = labels
    ? (pairValue >= 0 ? labels[0] : labels[1])
    : topPair;

  const text = replacePlaceholders(template, {
    name: node.name,
    value: dominantPoleLabel,
  });

  return [{
    text,
    priority: 60,
    category: 'tension',
    source: 'turningPointResolver',
    stratum: 2,
  }];
}

// ─── Stratum 3: Inner Life ────────────────────────────────────────────────────

/**
 * contradictionResolver — internal contradiction or decisive nature.
 * Priority: 100
 * Category: 'tension'
 * Stratum: 3
 *
 * Agent → axiologicalProfile → find pair where |value| < CONTRADICTION_THRESHOLD.
 * Falls back to DECISIVE_NATURE_PROSE if no contradiction found.
 */
export function contradictionResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const profile = node.properties?.axiologicalProfile as Record<string, number> | undefined;
  if (!profile) return [];

  const threshold = BACKSTORY_CONSTANTS.CONTRADICTION_THRESHOLD;

  // Find pairs near zero (genuine internal conflict)
  const contradictedPairs = Object.entries(profile)
    .filter(([, value]) => Math.abs(value) < threshold)
    .map(([pair]) => pair);

  if (contradictedPairs.length > 0) {
    // Pick the pair closest to zero
    const chosen = contradictedPairs.reduce((closest, pair) => {
      return Math.abs(profile[pair] ?? 0) < Math.abs(profile[closest] ?? 0) ? pair : closest;
    });

    const templates = CONTRADICTION_PROSE[chosen];
    if (!templates) return [];

    const template = pickTemplate(templates, seed);
    if (!template) return [];

    const labels = VALUE_LABELS[chosen as ValuePair];
    const leftPole = labels ? labels[0] : chosen;
    const rightPole = labels ? labels[1] : chosen;

    const text = replacePlaceholders(template, {
      name: node.name,
      left_pole: leftPole,
      right_pole: rightPole,
    });

    return [{
      text,
      priority: 100,
      category: 'tension',
      source: 'contradictionResolver',
      stratum: 3,
    }];
  }

  // Fallback: decisive nature
  const template = pickTemplate(DECISIVE_NATURE_PROSE, seed);
  if (!template) return [];

  const text = replacePlaceholder(template, 'name', node.name);

  return [{
    text,
    priority: 100,
    category: 'tension',
    source: 'contradictionResolver',
    stratum: 3,
  }];
}

/**
 * fearResolver — shadow fear derived from strongest axiological value.
 * Priority: 80
 * Category: 'character'
 * Stratum: 3
 *
 * Agent → axiologicalProfile → strongest value pair → FEAR_DESCRIPTIONS → FEAR_PROSE.
 */
export function fearResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const profile = node.properties?.axiologicalProfile as Record<string, number> | undefined;
  if (!profile) return [];

  // Find strongest value (highest absolute)
  let topPair: string | undefined;
  let topAbs = 0;
  for (const [pair, value] of Object.entries(profile)) {
    const abs = Math.abs(value);
    if (abs > topAbs) {
      topAbs = abs;
      topPair = pair;
    }
  }
  if (!topPair) return [];

  const pairValue = profile[topPair] ?? 0;
  const pole = pairValue >= 0 ? 'positive' : 'negative';
  const fearKey = `${topPair}_${pole}`;

  const templates = FEAR_PROSE[fearKey];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  // Derive fear description from FEAR_DESCRIPTIONS
  const fearDescriptions = FEAR_DESCRIPTIONS[topPair as ValuePair];
  const fearText = fearDescriptions
    ? (pole === 'positive' ? fearDescriptions[0] : fearDescriptions[1]).toLowerCase().replace(/^fears /, '')
    : 'the unknown';

  // Derive value label
  const labels = VALUE_LABELS[topPair as ValuePair];
  const valueLabel = labels
    ? (pairValue >= 0 ? labels[0] : labels[1])
    : topPair;

  const text = replacePlaceholders(template, {
    name: node.name,
    fear: fearText,
    value: valueLabel,
  });

  return [{
    text,
    priority: 80,
    category: 'character',
    source: 'fearResolver',
    stratum: 3,
  }];
}

// ─── Cooperation strategy descriptions ───────────────────────────────────────

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'tit-for-tat': 'cooperating with those who cooperate and withdrawing from those who do not',
  'grudger': 'cooperating until a single betrayal makes them permanently withhold',
  'pavlov': 'repeating what worked before and changing what did not',
  'always-cooperate': 'extending goodwill to everyone regardless of what they have done',
  'always-defect': 'taking what can be taken before others do the same',
};

/**
 * hiddenMotiveResolver — behavioral pattern from cooperation strategy.
 * Priority: 60
 * Category: 'history'
 * Stratum: 3
 *
 * Agent → cooperationStrategy property.
 */
export function hiddenMotiveResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const strategy = node.properties?.cooperationStrategy as string | undefined;
  if (!strategy) return [];

  const templates = HIDDEN_MOTIVE_PROSE[strategy];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const strategyDescription = STRATEGY_DESCRIPTIONS[strategy] ?? strategy;

  const text = replacePlaceholders(template, {
    name: node.name,
    strategy_description: strategyDescription,
  });

  return [{
    text,
    priority: 60,
    category: 'history',
    source: 'hiddenMotiveResolver',
    stratum: 3,
  }];
}

// ─── Stratum 4: Unmasked Self ─────────────────────────────────────────────────

// Arc phase labels keyed by approximate progress (0-1)
const ARC_PHASES: Array<{ threshold: number; label: string }> = [
  { threshold: 0.33, label: 'beginning' },
  { threshold: 0.66, label: 'middle' },
  { threshold: 1.0, label: 'climax' },
];

function getArcPhase(ticksAtCurrentTier: number): string {
  // Normalize: 0-30 = beginning, 31-60 = middle, 61+ = climax
  if (ticksAtCurrentTier < 30) return ARC_PHASES[0].label;
  if (ticksAtCurrentTier < 60) return ARC_PHASES[1].label;
  return ARC_PHASES[2].label;
}

/**
 * storyArcResolver — current story arc phase by narrative archetype.
 * Priority: 100
 * Category: 'tension'
 * Stratum: 4
 *
 * Agent → narrativeArchetype + thread edge ticksAtCurrentTier (arc phase proxy).
 */
export function storyArcResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const archetype = node.properties?.narrativeArchetype as string | undefined;
  if (!archetype) return [];

  const templates = STORY_ARC_PROSE[archetype];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  // Get arc phase from thread edge if available
  const threadEdges = graph.getIncomingEdges(nodeId, 'thread');
  const ticksAtCurrentTier = threadEdges.length > 0
    ? ((threadEdges[0].properties?.ticksAtCurrentTier as number) ?? 0)
    : 0;

  const arcPhase = getArcPhase(ticksAtCurrentTier);

  const text = replacePlaceholders(template, {
    name: node.name,
    arc_phase: arcPhase,
  });

  return [{
    text,
    priority: 100,
    category: 'tension',
    source: 'storyArcResolver',
    stratum: 4,
  }];
}

/**
 * Get essence bracket label from totalEssenceSpent.
 */
function getEssenceBracket(totalEssenceSpent: number): string {
  if (totalEssenceSpent < BACKSTORY_CONSTANTS.ESSENCE_BRACKET_LOW) return 'low';
  if (totalEssenceSpent < BACKSTORY_CONSTANTS.ESSENCE_BRACKET_MEDIUM) return 'medium';
  if (totalEssenceSpent < BACKSTORY_CONSTANTS.ESSENCE_BRACKET_HIGH) return 'high';
  return 'massive';
}

/**
 * divineTransformationResolver — how divine investment has changed the agent.
 * Priority: 80
 * Category: 'character'
 * Stratum: 4
 *
 * Agent → thread edge → totalEssenceSpent + ascendant primarySphere.
 */
export function divineTransformationResolver(
  nodeId: string,
  graph: WorldGraph,
  seed: number,
): BackstoryLayer[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const threadEdges = graph.getIncomingEdges(nodeId, 'thread');
  if (threadEdges.length === 0) return [];

  const threadEdge = threadEdges[0];
  const totalEssenceSpent = (threadEdge.properties?.totalEssenceSpent as number) ?? 0;

  // Get ascendant's primary sphere
  const ascendantNode = graph.getNode(threadEdge.source);
  const sphereAlignment = ascendantNode?.properties?.sphereAlignment as
    | { primary?: string }
    | undefined;
  const ascendantSphere = sphereAlignment?.primary ?? 'the divine';

  const bracket = getEssenceBracket(totalEssenceSpent);
  const templates = DIVINE_TRANSFORMATION_PROSE[bracket];
  if (!templates) return [];

  const template = pickTemplate(templates, seed);
  if (!template) return [];

  const text = replacePlaceholders(template, {
    name: node.name,
    ascendant_sphere: ascendantSphere,
  });

  return [{
    text,
    priority: 80,
    category: 'character',
    source: 'divineTransformationResolver',
    stratum: 4,
  }];
}
