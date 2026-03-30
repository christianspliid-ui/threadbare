/**
 * Narrative Context Builder
 *
 * Harvest → Rank → Select → Build pipeline for assembling narrative context from the world graph.
 * Uses BFS to locate relevant entities, opposition tension scoring, and greedy selection.
 *
 * Design doc: Docs/plans/2026-03-07-narrative-context-builder-design.md
 * Parent pipeline: Docs/plans/2026-03-06-narrative-context-pipeline.md
 */

import type { WorldGraph } from './graph';
import type { NarrativeEvent, ContextObject, OpposingPair, NarrativeContext, ContextCategory, InsiderBeatSummary } from '../types/narrative';
import type { GraphNode } from '../types/graph';
import {
  HARVEST_LIMITS,
  SELECTION_LIMITS,
  CATEGORY_CAP,
  PROXIMITY_SCORES,
  INVOLVEMENT_SCORES,
  getFoundationOpposition,
  getCreationSphereTension,
  getArchetypeFriction,
} from '../data/opposition-content.ts';
import { emitTrace } from './traceBuffer';
import { computeCulturalTensionScore } from './culturalTension';
import { getActorCulturalStrength } from './culturalTraits';
import { getAvailableInsiderBeats } from './insiderBeatDetection';

// ─── Internal Types ─────────────────────────────────────────────────────

export interface HarvestedObject {
  nodeId: string;
  name: string;
  category: ContextCategory;
  proximity: number;
  node: GraphNode;
}

// ─── Harvest Function ───────────────────────────────────────────────────

/**
 * Harvest context from event's actors via BFS on the world graph.
 *
 * Returns objects within hop radius (HARVEST_LIMITS[tier]):
 * - Artifacts possessed by/bonded to event actor
 * - Characters/factions at adjacent locations (radius-limited)
 * - Factions via member_of (no distance limit)
 *
 * Excludes event actor and target.
 */
export function harvestContext(event: NarrativeEvent, graph: WorldGraph): HarvestedObject[] {
  if (!event.actorId) return [];

  const actor = graph.getNode(event.actorId);
  if (!actor) return [];

  // Find actor's location
  const locatedAtEdges = graph.getOutgoingEdges(event.actorId, 'located_at');
  if (locatedAtEdges.length === 0) return [];

  const actorLocationId = locatedAtEdges[0]!.target;
  const actorLocation = graph.getNode(actorLocationId);
  if (!actorLocation) return [];

  const harvested: HarvestedObject[] = [];
  const visited = new Set<string>();
  const tier = event.tier === 'routine' ? 'notable' : event.tier; // Routine skips pipeline, but default to notable for harvest
  const hopLimit = (HARVEST_LIMITS as Record<string, number>)[tier] ?? 1;

  // ─── 1. Artifacts possessed/bonded by event actor ─────────────────

  const possessesEdges = graph.getOutgoingEdges(event.actorId, 'possesses');
  for (const edge of possessesEdges) {
    const node = graph.getNode(edge.target);
    if (node && node.id !== event.actorId && node.id !== event.targetId) {
      harvested.push({
        nodeId: node.id,
        name: node.name,
        category: 'artifact',
        proximity: PROXIMITY_SCORES.same_location,
        node,
      });
      visited.add(node.id);
    }
  }

  const bondedToEdges = graph.getOutgoingEdges(event.actorId, 'bonded_to');
  for (const edge of bondedToEdges) {
    const node = graph.getNode(edge.target);
    if (node && node.id !== event.actorId && node.id !== event.targetId) {
      harvested.push({
        nodeId: node.id,
        name: node.name,
        category: 'artifact',
        proximity: PROXIMITY_SCORES.same_location,
        node,
      });
      visited.add(node.id);
    }
  }

  // ─── 2. Factions via member_of (no distance limit) ──────────────────

  const memberOfEdges = graph.getOutgoingEdges(event.actorId, 'member_of');
  for (const edge of memberOfEdges) {
    const node = graph.getNode(edge.target);
    if (node && node.id !== event.actorId && node.id !== event.targetId && !visited.has(node.id)) {
      harvested.push({
        nodeId: node.id,
        name: node.name,
        category: 'faction',
        proximity: PROXIMITY_SCORES.graph_connected,
        node,
      });
      visited.add(node.id);
    }
  }

  // ─── 3. BFS on adjacent locations for actors/locations ──────────────

  const locationsToVisit: Array<{ locId: string; hop: number }> = [{ locId: actorLocationId, hop: 0 }];
  const visitedLocs = new Set<string>([actorLocationId]);

  while (locationsToVisit.length > 0) {
    const { locId, hop } = locationsToVisit.shift()!;

    // Harvest actors at current location (only if not the event actor's location for initial hop)
    if (hop > 0) {
      const actorsAtLoc = graph.getIncomingEdges(locId, 'located_at');
      for (const locEdge of actorsAtLoc) {
        const actorId = locEdge.source;
        if (
          !visited.has(actorId) &&
          actorId !== event.actorId
        ) {
          const actorNode = graph.getNode(actorId);
          if (actorNode) {
            const actorType = actorNode.properties?.actorType as string | undefined;
            const category: ContextCategory = actorType === 'faction' ? 'faction' : 'character';

            harvested.push({
              nodeId: actorId,
              name: actorNode.name,
              category,
              proximity: PROXIMITY_SCORES.adjacent,
              node: actorNode,
            });
            visited.add(actorId);
          }
        }
      }
    }

    // Continue BFS if within hop limit
    if (hop < hopLimit) {
      const adjEdges = graph.getOutgoingEdges(locId, 'adjacent');
      for (const edge of adjEdges) {
        const adjLocId = edge.target;
        if (visitedLocs.has(adjLocId)) continue;

        visitedLocs.add(adjLocId);
        locationsToVisit.push({ locId: adjLocId, hop: hop + 1 });
      }
    }
  }

  return harvested;
}

// ─── Helper Functions for Ranking ───────────────────────────────────────

function getFoundationAlignment(nodeId: string, graph: WorldGraph): string | undefined {
  const alignedEdges = graph.getOutgoingEdges(nodeId, 'aligned_with');
  for (const edge of alignedEdges) {
    const node = graph.getNode(edge.target);
    if (node?.type === 'cosmology' && node.properties?.sphereType === 'foundation') {
      return node.properties?.sphereName as string | undefined;
    }
  }
  return undefined;
}

function getCreationSphereAlignment(nodeId: string, graph: WorldGraph): string | undefined {
  const alignedEdges = graph.getOutgoingEdges(nodeId, 'aligned_with');
  for (const edge of alignedEdges) {
    const node = graph.getNode(edge.target);
    if (node?.type === 'cosmology' && node.properties?.sphereType === 'creation') {
      return node.properties?.sphereName as string | undefined;
    }
  }
  return undefined;
}

function scoreInvolvement(
  obj: HarvestedObject,
  event: NarrativeEvent,
  graph: WorldGraph
): number {
  // Direct participant (target match)
  if (obj.nodeId === event.targetId) {
    return INVOLVEMENT_SCORES.direct_participant;
  }

  // Owner/creator (possesses or bonded_to edge from event actor to object)
  if (event.actorId) {
    const possesses = graph.getOutgoingEdges(event.actorId, 'possesses');
    const bonded = graph.getOutgoingEdges(event.actorId, 'bonded_to');
    if (possesses.some(e => e.target === obj.nodeId) || bonded.some(e => e.target === obj.nodeId)) {
      return INVOLVEMENT_SCORES.owner_creator;
    }
  }

  // Causal (member_of, relates_to)
  if (event.actorId) {
    const memberOf = graph.getOutgoingEdges(event.actorId, 'member_of');
    const relatesTo = graph.getOutgoingEdges(event.actorId, 'relates_to');
    if (memberOf.some(e => e.target === obj.nodeId) || relatesTo.some(e => e.target === obj.nodeId)) {
      return INVOLVEMENT_SCORES.causal;
    }
  }

  // Default: atmospheric
  return INVOLVEMENT_SCORES.atmospheric;
}

function scoreOppositionTension(
  obj: HarvestedObject,
  event: NarrativeEvent,
  graph: WorldGraph
): number {
  let tension = 0;

  if (!event.actorId) return tension;

  const actor = graph.getNode(event.actorId);
  if (!actor) return tension;

  // ─── Foundation sphere opposition ───────────────────────────────────

  const actorFoundation = getFoundationAlignment(event.actorId, graph);
  const objFoundation = getFoundationAlignment(obj.nodeId, graph);

  if (actorFoundation && objFoundation) {
    tension += getFoundationOpposition(actorFoundation, objFoundation);
  }

  // ─── Creation sphere tension ────────────────────────────────────────

  if (event.sphere) {
    const objCreationSphere = getCreationSphereAlignment(obj.nodeId, graph);
    if (objCreationSphere) {
      tension += getCreationSphereTension(event.sphere, objCreationSphere as any);
    }
  }

  // ─── Archetype friction ────────────────────────────────────────────

  const actorArchetype = actor.properties?.narrativeArchetype as string | undefined;
  const objArchetype = obj.node.properties?.narrativeArchetype as string | undefined;

  if (actorArchetype && objArchetype) {
    tension += getArchetypeFriction(actorArchetype, objArchetype);
  }

  return tension;
}

function generateBriefDescription(node: GraphNode): string {
  return `${node.name} (${node.type})`;
}

// ─── Rank Function ──────────────────────────────────────────────────────

/**
 * Rank harvested objects by relevance score.
 * Score = proximity + involvement + oppositionTension
 *
 * Returns array sorted in descending order by score.
 */
export function rankObjects(
  harvested: HarvestedObject[],
  event: NarrativeEvent,
  graph: WorldGraph
): ContextObject[] {
  const ranked: ContextObject[] = harvested.map(obj => {
    const proximity = obj.proximity;
    const involvement = scoreInvolvement(obj, event, graph);
    const oppTension = scoreOppositionTension(obj, event, graph);
    const relevanceScore = proximity + involvement + oppTension;

    const tensionType = oppTension > 0 ? 'sphere_opposition' : undefined;

    return {
      nodeId: obj.nodeId,
      name: obj.name,
      category: obj.category,
      relevanceScore,
      tensionType,
      briefDescription: generateBriefDescription(obj.node),
    };
  });

  // Sort by score (descending)
  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return ranked;
}

// ─── Select Function ────────────────────────────────────────────────────

/**
 * Select context objects greedily, respecting tier limits and category caps.
 *
 * Tier limits:
 *   Notable: 2-3 objects
 *   Chronicle: 4-5 objects
 *
 * Category cap: max 2 from any single category
 *
 * Preference: ensure at least 1 character/faction if available
 */
export function selectObjects(ranked: ContextObject[], tier: 'notable' | 'chronicle'): ContextObject[] {
  if (ranked.length === 0) return [];

  const limits = SELECTION_LIMITS[tier];
  const selected: ContextObject[] = [];
  const categoryCounts = new Map<string, number>();

  // Greedy selection with cap enforcement
  for (const obj of ranked) {
    if (selected.length >= limits.max) break;

    const catCount = (categoryCounts.get(obj.category) ?? 0) + 1;
    if (catCount > CATEGORY_CAP) continue;

    selected.push(obj);
    categoryCounts.set(obj.category, catCount);
  }

  // Ensure at least 1 character/faction if we have fewer than min and have suitable candidates
  if (selected.length < limits.min) {
    const hasCharacterOrFaction = selected.some(
      obj => obj.category === 'character' || obj.category === 'faction'
    );

    if (!hasCharacterOrFaction) {
      // Try to swap lowest-score object with a character/faction from ranked
      const charFaction = ranked.find(
        obj => (obj.category === 'character' || obj.category === 'faction') && !selected.includes(obj)
      );

      if (charFaction && selected.length > 0) {
        selected.pop(); // Remove lowest
        selected.push(charFaction);
        selected.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
    }
  }

  return selected;
}

// ─── Build Function ─────────────────────────────────────────────────────

/**
 * Orchestrate full context building: harvest → rank → select → opposition summary.
 *
 * Routine events return empty context (skip pipeline).
 * Notable/Chronicle events return full context with opposition tension.
 */
export function buildNarrativeContext(
  event: NarrativeEvent,
  graph: WorldGraph,
  archetype?: string
): NarrativeContext {
  // Skip pipeline for routine events
  if (event.tier === 'routine') {
    return {
      event,
      archetype,
      contextObjects: [],
      historicalFragments: [],
      oppositionSummary: {
        tensionScore: 0,
        opposingPairs: [],
      },
      culturalStrength: 0,
      availableInsiderBeats: [],
    };
  }

  // Harvest → Rank → Select pipeline
  const harvested = harvestContext(event, graph);
  const ranked = rankObjects(harvested, event, graph);
  const selected = selectObjects(ranked, event.tier === 'chronicle' ? 'chronicle' : 'notable');

  // ─── Build Opposition Summary ───────────────────────────────────────

  const opposingPairs: OpposingPair[] = [];
  let totalTension = 0;

  for (const obj of selected) {
    if (obj.tensionType && event.actorId) {
      // Opposition tension is the tension component of the relevance score
      // We estimate it as the portion due to opposition scoring
      const oppTension = scoreOppositionTension(
        {
          nodeId: obj.nodeId,
          name: obj.name,
          category: obj.category,
          proximity: 0,
          node: graph.getNode(obj.nodeId)!,
        },
        event,
        graph
      );

      opposingPairs.push({
        sourceId: event.actorId,
        targetId: obj.nodeId,
        tensionType: obj.tensionType,
        score: oppTension,
      });
      totalTension += oppTension;
    }
  }

  const dominantTension = opposingPairs.length > 0
    ? opposingPairs.reduce((prev, curr) => (curr.score > prev.score ? curr : prev)).tensionType
    : undefined;

  // ─── Extract Historical Fragments ──────────────────────────────────

  const historicalFragments: string[] = selected
    .filter(obj => obj.category === 'event')
    .map(obj => obj.briefDescription);

  // ─── Cultural Context ──────────────────────────────────────────────

  const culturalStrength = event.actorId
    ? getActorCulturalStrength(graph, event.actorId)
    : 0;

  const { tensions: culturalTensions } = event.actorId
    ? computeCulturalTensionScore(graph, event.actorId)
    : { tensions: [] };

  // Pick the highest-severity cultural tension (if any)
  const topCulturalTension = culturalTensions.length > 0
    ? culturalTensions.reduce((prev, curr) => curr.severity > prev.severity ? curr : prev)
    : undefined;

  // ─── Insider Beats ────────────────────────────────────────────

  const availableInsiderBeats: InsiderBeatSummary[] = event.actorId
    ? getAvailableInsiderBeats(graph, event.actorId).map(beat => ({
        beatId: beat.id,
        name: beat.name,
        minStrength: beat.minStrength,
      }))
    : [];

  const context: NarrativeContext = {
    event,
    archetype,
    contextObjects: selected,
    historicalFragments,
    oppositionSummary: {
      dominantTension,
      tensionScore: totalTension,
      opposingPairs,
    },
    culturalStrength,
    culturalTension: topCulturalTension,
    availableInsiderBeats,
  };

  // ─── Trace instrumentation ──────────────────────────────────────────

  emitTrace({
    tick: event.tick ?? 0,
    category: 'context_harvest',
    agentId: event.actorId,
    summary: `Context: ${harvested.length} harvested → ${selected.length} selected, tension ${totalTension.toFixed(2)}`,
    harvestedCount: harvested.length,
    rankedTop: ranked.slice(0, 5).map(o => ({ nodeId: o.nodeId, name: o.name, score: o.relevanceScore })),
    selectedIds: selected.map(o => o.nodeId),
    oppositionTension: totalTension,
  });

  return context;
}
