/**
 * Sublocation system — lazy graph node creation, scoring, and selection.
 *
 * Sublocations are location instances created under parent locations based on
 * location-type mappings. They are scored by axiological motivation alignment
 * and selected via weighted random.
 *
 * Design doc: Docs/plans/2026-03-10-sublocation-system-design.md
 * NFP priorities: Tunability, Inspectability, Determinism, Fail-soft, Narrative
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { SublocationProperties, SublocationPersistence, DivineOrigin } from '../types/sublocation';
import { mulberry32 } from '../lib/prng';

// ── Subtype → sublocation type mapping ──────────────────────────────────────
// Maps runtime locationSubtype values to the sublocation-type node IDs they contain.
// This is the primary lookup path — no taxonomy edges needed at runtime.
// NFP #1 (Tunability): Add new subtypes or sublocation assignments here.

/** Sublocation type definition for inline creation (when taxonomy nodes aren't in the graph). */
interface SublocationTypeDef {
  id: string;
  name: string;
  motivations: Array<{ left: string; right: string; weight: number }>;
}

/**
 * Maps locationSubtype → sublocation type definitions.
 * Subtypes not listed here get no sublocations (fail-soft).
 */
export const SUBTYPE_SUBLOCATION_MAP: Record<string, SublocationTypeDef[]> = {
  // Settlements: market, temple, barracks
  capital: [
    { id: 'sublocation-type.market-district', name: 'Market District', motivations: [{ left: 'greed', right: 'generosity', weight: 0.7 }, { left: 'cunning', right: 'honesty', weight: 0.5 }] },
    { id: 'sublocation-type.temple-quarter', name: 'Temple Quarter', motivations: [{ left: 'devotion', right: 'independence', weight: 0.8 }, { left: 'tradition', right: 'innovation', weight: 0.6 }] },
    { id: 'sublocation-type.barracks', name: 'Barracks', motivations: [{ left: 'duty', right: 'freedom', weight: 0.7 }, { left: 'order', right: 'chaos', weight: 0.6 }] },
    { id: 'sublocation-type.throne-room', name: 'Throne Room', motivations: [{ left: 'authority', right: 'rebellion', weight: 0.9 }, { left: 'tradition', right: 'innovation', weight: 0.5 }] },
  ],
  city: [
    { id: 'sublocation-type.market-district', name: 'Market District', motivations: [{ left: 'greed', right: 'generosity', weight: 0.7 }, { left: 'cunning', right: 'honesty', weight: 0.5 }] },
    { id: 'sublocation-type.temple-quarter', name: 'Temple Quarter', motivations: [{ left: 'devotion', right: 'independence', weight: 0.8 }, { left: 'tradition', right: 'innovation', weight: 0.6 }] },
    { id: 'sublocation-type.barracks', name: 'Barracks', motivations: [{ left: 'duty', right: 'freedom', weight: 0.7 }, { left: 'order', right: 'chaos', weight: 0.6 }] },
  ],
  town: [
    { id: 'sublocation-type.market-district', name: 'Market District', motivations: [{ left: 'greed', right: 'generosity', weight: 0.7 }, { left: 'cunning', right: 'honesty', weight: 0.5 }] },
    { id: 'sublocation-type.temple-quarter', name: 'Temple Quarter', motivations: [{ left: 'devotion', right: 'independence', weight: 0.8 }, { left: 'tradition', right: 'innovation', weight: 0.6 }] },
  ],
  hamlet: [
    { id: 'sublocation-type.garden', name: 'Garden', motivations: [{ left: 'devotion', right: 'independence', weight: 0.4 }, { left: 'tradition', right: 'innovation', weight: 0.3 }] },
  ],
  // Military
  castle: [
    { id: 'sublocation-type.throne-room', name: 'Throne Room', motivations: [{ left: 'authority', right: 'rebellion', weight: 0.9 }, { left: 'tradition', right: 'innovation', weight: 0.5 }] },
    { id: 'sublocation-type.barracks', name: 'Barracks', motivations: [{ left: 'duty', right: 'freedom', weight: 0.7 }, { left: 'order', right: 'chaos', weight: 0.6 }] },
    { id: 'sublocation-type.dungeon', name: 'Dungeon', motivations: [{ left: 'cruelty', right: 'mercy', weight: 0.8 }, { left: 'order', right: 'chaos', weight: 0.7 }] },
  ],
  fort: [
    { id: 'sublocation-type.barracks', name: 'Barracks', motivations: [{ left: 'duty', right: 'freedom', weight: 0.7 }, { left: 'order', right: 'chaos', weight: 0.6 }] },
    { id: 'sublocation-type.prison', name: 'Prison', motivations: [{ left: 'cruelty', right: 'mercy', weight: 0.6 }, { left: 'order', right: 'chaos', weight: 0.8 }] },
  ],
  tower: [
    { id: 'sublocation-type.library', name: 'Library', motivations: [{ left: 'knowledge', right: 'ignorance', weight: 0.9 }, { left: 'tradition', right: 'innovation', weight: 0.4 }] },
    { id: 'sublocation-type.archive', name: 'Archive', motivations: [{ left: 'knowledge', right: 'ignorance', weight: 0.7 }, { left: 'tradition', right: 'innovation', weight: 0.7 }] },
  ],
  // Religious
  temple: [
    { id: 'sublocation-type.temple-quarter', name: 'Temple Quarter', motivations: [{ left: 'devotion', right: 'independence', weight: 0.9 }, { left: 'tradition', right: 'innovation', weight: 0.7 }] },
    { id: 'sublocation-type.crypt', name: 'Crypt', motivations: [{ left: 'devotion', right: 'independence', weight: 0.5 }, { left: 'tradition', right: 'innovation', weight: 0.9 }] },
  ],
  shrine: [
    { id: 'sublocation-type.garden', name: 'Garden', motivations: [{ left: 'devotion', right: 'independence', weight: 0.6 }, { left: 'tradition', right: 'innovation', weight: 0.3 }] },
  ],
  // Ruins / exploration
  ruins: [
    { id: 'sublocation-type.dungeon', name: 'Dungeon', motivations: [{ left: 'cruelty', right: 'mercy', weight: 0.5 }, { left: 'knowledge', right: 'ignorance', weight: 0.6 }] },
    { id: 'sublocation-type.crypt', name: 'Crypt', motivations: [{ left: 'devotion', right: 'independence', weight: 0.4 }, { left: 'tradition', right: 'innovation', weight: 0.8 }] },
  ],
  ruined_tower: [
    { id: 'sublocation-type.library', name: 'Library', motivations: [{ left: 'knowledge', right: 'ignorance', weight: 0.7 }, { left: 'tradition', right: 'innovation', weight: 0.5 }] },
  ],
  ruined_city: [
    { id: 'sublocation-type.market-district', name: 'Market District', motivations: [{ left: 'greed', right: 'generosity', weight: 0.5 }, { left: 'cunning', right: 'honesty', weight: 0.4 }] },
    { id: 'sublocation-type.dungeon', name: 'Dungeon', motivations: [{ left: 'cruelty', right: 'mercy', weight: 0.5 }, { left: 'knowledge', right: 'ignorance', weight: 0.6 }] },
  ],
  // Commerce
  mining: [
    { id: 'sublocation-type.forge', name: 'Forge', motivations: [{ left: 'duty', right: 'freedom', weight: 0.6 }, { left: 'tradition', right: 'innovation', weight: 0.5 }] },
  ],
  farmland: [
    { id: 'sublocation-type.garden', name: 'Garden', motivations: [{ left: 'tradition', right: 'innovation', weight: 0.3 }, { left: 'devotion', right: 'independence', weight: 0.2 }] },
  ],
};

// ── Task 2: ensureSublocations ──────────────────────────────────────────────

/**
 * Ensures a location has sublocation instances.
 *
 * Two-path resolution:
 * Path A (primary): Use locationSubtype property → SUBTYPE_SUBLOCATION_MAP lookup
 * Path B (legacy):  Use located_at edge → location-type node → contains edges
 *
 * Creates sublocation instance nodes and `contains` edges from parent location.
 *
 * Idempotent: second call returns same nodes (checks for existing instances).
 * Fail-soft: missing data returns empty array, never throws.
 *
 * @param graph WorldGraph instance
 * @param locationId ID of the location to ensure sublocations for
 * @param seed Seeded PRNG seed for deterministic instance ID generation
 * @returns Array of sublocation instance nodes (empty if none created)
 */
export function ensureSublocations(
  graph: WorldGraph,
  locationId: string,
  seed: number
): GraphNode[] {
  // Step 1: Verify location exists
  const location = graph.getNode(locationId);
  if (!location || location.type !== 'location') {
    return []; // fail-soft
  }

  // Step 2: Check if sublocations already exist (via contains edges — fast path)
  const existingContainsEdges = graph.getOutgoingEdges(locationId, 'contains');
  const existingSublocations: GraphNode[] = [];
  for (const edge of existingContainsEdges) {
    const child = graph.getNode(edge.target);
    if (child && child.type === 'location') {
      const props = child.properties as Partial<SublocationProperties>;
      if (props.parentLocationId === locationId && props.sublocationTypeId) {
        existingSublocations.push(child);
      }
    }
  }

  if (existingSublocations.length > 0) {
    return existingSublocations; // idempotent: already created
  }

  // Step 3: Resolve sublocation type definitions
  // Path A (primary): locationSubtype → SUBTYPE_SUBLOCATION_MAP
  const locProps = (location.properties ?? {}) as Record<string, unknown>;
  const locationSubtype = typeof locProps.locationSubtype === 'string' ? locProps.locationSubtype : '';
  let sublocationTypeDefs: SublocationTypeDef[] = SUBTYPE_SUBLOCATION_MAP[locationSubtype] ?? [];

  // Path B (legacy fallback): located_at → location-type → contains edges
  if (sublocationTypeDefs.length === 0) {
    const locationTypeEdges = graph.getOutgoingEdges(locationId, 'located_at');
    if (locationTypeEdges.length > 0) {
      const locationTypeId = locationTypeEdges[0]?.target;
      if (locationTypeId) {
        const sublocationTypeEdges = graph.getOutgoingEdges(locationTypeId, 'contains');
        for (const edge of sublocationTypeEdges) {
          const node = graph.getNode(edge.target);
          if (node) {
            const nodeProps = (node.properties ?? {}) as Record<string, unknown>;
            const motivations = Array.isArray(nodeProps.motivations)
              ? nodeProps.motivations as Array<{ left: string; right: string; weight: number }>
              : [];
            sublocationTypeDefs.push({ id: node.id, name: node.name, motivations });
          }
        }
      }
    }
  }

  if (sublocationTypeDefs.length === 0) {
    return []; // No sublocation types for this location
  }

  // Step 4: Create instance nodes + contains edges
  const rng = mulberry32(seed);
  const created: GraphNode[] = [];
  let edgeCounter = 0;

  for (const def of sublocationTypeDefs) {
    // Generate a unique instance ID using seeded PRNG
    const instanceSuffix = Math.floor(rng() * 1000000).toString(36);
    const instanceId = `${def.id}-instance-${instanceSuffix}`;

    // Check if instance already exists (defensive check)
    if (graph.getNode(instanceId)) {
      continue;
    }

    // Create sublocation instance node
    const persistence: SublocationPersistence = { type: 'permanent' };
    const properties: SublocationProperties = {
      sublocationTypeId: def.id,
      parentLocationId: locationId,
      persistence,
    };

    const instanceNode: GraphNode = {
      id: instanceId,
      type: 'location',
      name: `${def.name} (${location.name})`,
      properties,
    };

    try {
      graph.addNode(instanceNode);

      // Add contains edge from parent location → sublocation instance
      // This makes getSubLocations() (viewLevel.ts) find the sublocation via graph edges
      const edgeId = `edge-subloc-${locationId}-${def.id}-${edgeCounter++}`;
      graph.addEdge({
        id: edgeId,
        source: locationId,
        target: instanceId,
        type: 'contains',
        properties: {},
      });

      created.push(instanceNode);
    } catch (err) {
      // fail-soft: if node/edge creation fails, continue
      continue;
    }
  }

  return created;
}

// ── Task 3: Scoring and Selection ───────────────────────────────────────────

/**
 * Motivation pair with directional weighting.
 * Example: { left: 'devotion', right: 'independence', weight: 0.8 }
 */
interface MotivationPair {
  left: string;
  right: string;
  weight: number;
}

/**
 * Scored sublocation result.
 */
interface ScoredSublocation {
  sublocationId: string;
  score: number;
  motivations: MotivationPair[];
}

/**
 * Scores sublocations by axiological motivation alignment.
 *
 * For each sublocation:
 * 1. Load its type node
 * 2. Read its motivations (MotivationPair[])
 * 3. Dot-product against agent's axiological profile
 * 4. Return all with scores (never filters)
 *
 * Fail-soft: missing data = 0 score contribution, never throws.
 *
 * @param graph WorldGraph instance
 * @param sublocations Array of sublocation nodes to score
 * @param agentId ID of the agent with axiological profile
 * @returns Array of scored sublocations
 */
export function scoreSublocations(
  graph: WorldGraph,
  sublocations: GraphNode[],
  agentId: string
): ScoredSublocation[] {
  const agentNode = graph.getNode(agentId);
  const agentProfile: AxiologicalProfile = {
    ambition_contentment: 0,
    courage_prudence: 0,
    cruelty_compassion: 0,
    cunning_honesty: 0,
    devotion_independence: 0,
    loyalty_treachery: 0,
    tradition_innovation: 0,
    dominance_humility: 0,
    wrath_patience: 0,
    greed_generosity: 0,
  };

  if (agentNode && agentNode.properties.axiologicalProfile) {
    Object.assign(agentProfile, agentNode.properties.axiologicalProfile as AxiologicalProfile);
  }

  const scored: ScoredSublocation[] = [];

  for (const sublocation of sublocations) {
    const props = sublocation.properties as Partial<SublocationProperties>;
    const sublocationTypeId = props.sublocationTypeId;

    if (!sublocationTypeId) {
      // fail-soft: skip malformed sublocation
      scored.push({
        sublocationId: sublocation.id,
        score: 0,
        motivations: [],
      });
      continue;
    }

    const sublocationTypeNode = graph.getNode(sublocationTypeId);
    const motivations: MotivationPair[] = [];

    if (!sublocationTypeNode) {
      // fail-soft: type node missing
      scored.push({
        sublocationId: sublocation.id,
        score: 0,
        motivations: [],
      });
      continue;
    }

    // Extract motivations from type node
    const rawMotivations = sublocationTypeNode.properties.motivations;
    if (!Array.isArray(rawMotivations)) {
      scored.push({
        sublocationId: sublocation.id,
        score: 0,
        motivations: [],
      });
      continue;
    }

    for (const raw of rawMotivations) {
      if (typeof raw === 'object' && raw !== null && 'left' in raw && 'right' in raw && 'weight' in raw) {
        motivations.push(raw as MotivationPair);
      }
    }

    // Dot-product motivations against agent profile
    let dotProduct = 0;
    let weightSum = 0;

    for (const pair of motivations) {
      const { left, right, weight } = pair;

      // Map motivation pair names to ValuePair
      // Assume left pole is positive, right pole is negative on the ValuePair scale
      const valuePair = findValuePairForMotivation(left, right);

      if (!valuePair || !agentProfile.hasOwnProperty(valuePair)) {
        continue; // fail-soft: unknown value pair
      }

      const agentValue = agentProfile[valuePair as ValuePair];
      const contribution = agentValue * weight;

      dotProduct += contribution;
      weightSum += Math.abs(weight);
    }

    // Normalize: if no weights, score is 0
    const score = weightSum > 0 ? dotProduct / weightSum : 0;

    scored.push({
      sublocationId: sublocation.id,
      score: Math.max(0, score), // ensure non-negative
      motivations,
    });
  }

  return scored;
}

/**
 * Maps motivation pair names to ValuePair.
 * Simple heuristic: match left/right against known ValuePair definitions.
 *
 * @param left Left pole name
 * @param right Right pole name
 * @returns ValuePair if match found, undefined otherwise
 */
function findValuePairForMotivation(left: string, right: string): ValuePair | undefined {
  const pairs: Record<string, ValuePair> = {
    // Normalize to lowercase for matching
    ambition_contentment: 'ambition_contentment',
    courage_prudence: 'courage_prudence',
    cruelty_compassion: 'cruelty_compassion',
    cunning_honesty: 'cunning_honesty',
    devotion_independence: 'devotion_independence',
    loyalty_treachery: 'loyalty_treachery',
    tradition_innovation: 'tradition_innovation',
    dominance_humility: 'dominance_humility',
    wrath_patience: 'wrath_patience',
    greed_generosity: 'greed_generosity',
  };

  const key = `${left.toLowerCase()}_${right.toLowerCase()}`;
  return pairs[key];
}

/**
 * Selects a sublocation via weighted random using seeded PRNG.
 *
 * 1. Score all sublocations
 * 2. Compute cumulative weights (scores must be positive)
 * 3. Sample random in [0, sum) with seeded PRNG
 * 4. Return selected node
 *
 * Deterministic: same seed + same inputs = same selection.
 * Fail-soft: empty list returns undefined.
 *
 * @param graph WorldGraph instance
 * @param sublocations Array of sublocation nodes to select from
 * @param agentId ID of the agent selecting
 * @param seed Seeded PRNG seed
 * @returns Selected sublocation node, or undefined if list is empty
 */
export function selectSublocation(
  graph: WorldGraph,
  sublocations: GraphNode[],
  agentId: string,
  seed: number
): GraphNode | undefined {
  if (sublocations.length === 0) {
    return undefined; // fail-soft
  }

  if (sublocations.length === 1) {
    return sublocations[0]; // optimization
  }

  // Score all sublocations
  const scored = scoreSublocations(graph, sublocations, agentId);

  // Compute cumulative weights (use scores + small epsilon to avoid zero weights)
  const weights: number[] = [];
  let totalWeight = 0;

  for (const s of scored) {
    // Ensure all weights are positive (shift if needed)
    const weight = Math.max(0.1, s.score + 1); // shift by 1 so minimum is 0.1
    weights.push(weight);
    totalWeight += weight;
  }

  // Seeded random selection
  const rng = mulberry32(seed);
  const randomSample = rng() * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (randomSample <= cumulative) {
      return sublocations[i];
    }
  }

  // Fallback (should never reach here due to cumulative >= totalWeight)
  return sublocations[sublocations.length - 1];
}

// ── Task 5: checkDissolutions ───────────────────────────────────────────

/**
 * Event emitted when a sublocation dissolves.
 */
export interface DissolutionEvent {
  sublocationId: string;
  sublocationName: string;
  parentLocationId: string;
  displacedAgentIds: string[];
  reason: string;
}

/**
 * Checks all temporal/conditional sublocations and dissolves those whose triggers have fired.
 *
 * For each sublocation instance:
 * 1. permanent → skip
 * 2. temporal with dissolvesOn: 'encounter_completed' → dissolve if NO active encounters reference this sublocation
 * 3. temporal with dissolvesOn: 'visited' → dissolve if ANY agent has visited (has located_at edge)
 * 4. temporal with dissolvesOn: { type: 'tick_expiry', expiresAtTick } → dissolve if tick >= expiresAtTick
 * 5. conditional → not implemented yet (return false for now, add TODO)
 *
 * On dissolution:
 * - Find agents at this sublocation (via incoming located_at edges)
 * - Move their located_at edges to the parent location
 * - Remove the sublocation node from the graph
 * - Return a DissolutionEvent for each dissolved sublocation
 *
 * Fail-soft: missing data gracefully skipped, never throws.
 *
 * @param graph WorldGraph instance
 * @param tick Current simulation tick
 * @param encounterProgress Array of active encounter progress states
 * @returns Array of dissolution events (empty if no sublocations dissolved)
 */
export function checkDissolutions(
  graph: WorldGraph,
  tick: number,
  encounterProgress: Array<{ encounterId: string; actorId: string; status: 'active' | 'abandoned' | 'completed' }> = []
): DissolutionEvent[] {
  const events: DissolutionEvent[] = [];

  // Find all sublocation instance nodes
  const allLocations = graph.getNodesByType('location');
  const sublocations = allLocations.filter(node => {
    const props = node.properties as Partial<SublocationProperties>;
    return props.sublocationTypeId !== undefined;
  });

  for (const sublocation of sublocations) {
    const props = sublocation.properties as SublocationProperties;
    const { persistence, parentLocationId } = props;

    // Skip permanent sublocations
    if (persistence.type === 'permanent') {
      continue;
    }

    let shouldDissolve = false;
    let reason = '';

    if (persistence.type === 'temporal') {
      const { dissolvesOn } = persistence;

      if (dissolvesOn === 'encounter_completed') {
        // Check if there are any active encounters at this sublocation
        const activeEncounters = encounterProgress.filter(ep => ep.status === 'active');
        if (activeEncounters.length === 0) {
          shouldDissolve = true;
          reason = 'encounter_completed: no active encounters';
        }
      } else if (dissolvesOn === 'visited') {
        // Check if any agent has visited (has located_at edge pointing to this sublocation)
        const incomingLocations = graph.getIncomingEdges(sublocation.id, 'located_at');
        if (incomingLocations.length > 0) {
          shouldDissolve = true;
          reason = 'visited: agent(s) have visited';
        }
      } else if (typeof dissolvesOn === 'object' && dissolvesOn.type === 'tick_expiry') {
        // Check if tick >= expiresAtTick
        if (tick >= dissolvesOn.expiresAtTick) {
          shouldDissolve = true;
          reason = `tick_expiry: current tick ${tick} >= expiresAtTick ${dissolvesOn.expiresAtTick}`;
        }
      }
    } else if (persistence.type === 'conditional') {
      // Evaluate predicate — dissolve when predicate returns FALSE
      const predicateHolds = evaluateConditionalPredicate(
        persistence.predicate,
        parentLocationId ?? sublocation.id,
        graph
      );
      if (!predicateHolds) {
        shouldDissolve = true;
        reason = `conditional predicate false: ${persistence.predicate}`;
      }
    }

    if (shouldDissolve && parentLocationId) {
      // Find agents at this sublocation
      const locatedAtEdges = graph.getIncomingEdges(sublocation.id, 'located_at');
      const displacedAgentIds: string[] = [];

      // Move agents to parent location
      for (const edge of locatedAtEdges) {
        const agentId = edge.source;
        displacedAgentIds.push(agentId);

        // Remove the old edge
        graph.removeEdge(edge.id);

        // Create new edge from agent to parent location
        const newEdgeId = `located_at-${agentId}-to-${parentLocationId}-${tick}`;
        graph.addEdge({
          id: newEdgeId,
          source: agentId,
          target: parentLocationId,
          type: 'located_at',
          properties: {},
        });
      }

      // Remove the sublocation node
      graph.removeNode(sublocation.id);

      // Emit dissolution event
      events.push({
        sublocationId: sublocation.id,
        sublocationName: sublocation.name,
        parentLocationId,
        displacedAgentIds,
        reason,
      });
    }
  }

  return events;
}

// ── Task 6: createDivineSublocation ─────────────────────────────────────

/**
 * Creates a divine sublocation at a location.
 *
 * 1. Verify location exists (fail-soft: return undefined if not)
 * 2. Create a sublocation node with:
 *    - id: `${locationId}.divine.${sublocationTypeId.replace('sublocation-type.', '')}.${tick}`
 *    - type: 'location'
 *    - properties including SublocationProperties with divineOrigin set
 * 3. Add contains edge from location to new sublocation
 * 4. Return the created node
 *
 * Fail-soft: invalid params return undefined, never throw.
 *
 * @param graph WorldGraph instance
 * @param params Configuration object
 * @returns Created sublocation node, or undefined if location doesn't exist
 */
export function createDivineSublocation(
  graph: WorldGraph,
  params: {
    locationId: string;
    sublocationTypeId: string;
    godId: string;
    purpose: string;
    tick: number;
    persistence: SublocationPersistence;
    name?: string;
  }
): GraphNode | undefined {
  const { locationId, sublocationTypeId, godId, purpose, tick, persistence, name } = params;

  // Step 1: Verify location exists
  const location = graph.getNode(locationId);
  if (!location || location.type !== 'location') {
    return undefined; // fail-soft
  }

  // Step 2: Create sublocation node
  const typeNamePart = sublocationTypeId.replace('sublocation-type.', '');
  const sublocationId = `${locationId}.divine.${typeNamePart}.${tick}`;

  // Check if already exists
  if (graph.getNode(sublocationId)) {
    return undefined; // fail-soft: already exists
  }

  const divineOrigin: DivineOrigin = {
    creatorGodId: godId,
    purpose,
    createdAtTick: tick,
  };

  const properties: SublocationProperties = {
    sublocationTypeId,
    parentLocationId: locationId,
    persistence,
    divineOrigin,
  };

  const sublocationNode: GraphNode = {
    id: sublocationId,
    type: 'location',
    name: name || `Divine ${sublocationTypeId}`,
    properties,
  };

  try {
    graph.addNode(sublocationNode);

    // Step 3: Add contains edge from location to new sublocation
    const containsEdgeId = `contains-${locationId}-to-${sublocationId}`;
    graph.addEdge({
      id: containsEdgeId,
      source: locationId,
      target: sublocationId,
      type: 'contains',
      properties: {},
    });

    return sublocationNode;
  } catch (err) {
    // fail-soft: if node creation fails, return undefined
    return undefined;
  }
}

// ── Task 7: Conditional Predicate Evaluator ───────────────────────────────

/**
 * Evaluate a conditional sublocation predicate against a location node.
 *
 * Predicate DSL (single clause, or clauses joined by '||' for OR):
 *   "prosperity >= N"        — location.properties.prosperity >= N
 *   "prosperity < N"         — location.properties.prosperity < N
 *   "has_resource:TYPE"      — location has resource TYPE with quantity > 0
 *   "is_coastal"             — location.properties.coastal === true
 *   "guild_wealth >= N"      — any guild actor at location has wealth >= N
 *   "trade_route_present"    — any actor at location has an outgoing trades_with edge
 *
 * Fail-soft: unknown predicate or missing property → returns false, no error.
 *
 * @param predicate Predicate string (supports '||' for OR)
 * @param locationId ID of the location to evaluate against
 * @param graph WorldGraph instance
 * @returns true if predicate holds, false otherwise
 */
export function evaluateConditionalPredicate(
  predicate: string,
  locationId: string,
  graph: WorldGraph
): boolean {
  // Support OR: any clause being true is enough
  const clauses = predicate.split('||').map(p => p.trim());
  return clauses.some(clause => evaluateSingleClause(clause, locationId, graph));
}

function evaluateSingleClause(clause: string, locationId: string, graph: WorldGraph): boolean {
  const loc = graph.getNode(locationId);
  if (!loc) return false; // fail-soft: missing location

  // "prosperity >= N"
  if (clause.startsWith('prosperity >= ')) {
    const threshold = parseFloat(clause.slice('prosperity >= '.length));
    if (isNaN(threshold)) return false;
    const prosperity = typeof loc.properties.prosperity === 'number' ? loc.properties.prosperity : 0;
    return prosperity >= threshold;
  }

  // "prosperity < N"
  if (clause.startsWith('prosperity < ')) {
    const threshold = parseFloat(clause.slice('prosperity < '.length));
    if (isNaN(threshold)) return false;
    const prosperity = typeof loc.properties.prosperity === 'number' ? loc.properties.prosperity : 0;
    return prosperity < threshold;
  }

  // "has_resource:TYPE"
  if (clause.startsWith('has_resource:')) {
    const resourceType = clause.slice('has_resource:'.length).trim();
    const resources = loc.properties.resources as Record<string, { quantity: number }> | undefined;
    if (!resources) return false;
    const res = resources[resourceType];
    return res !== undefined && typeof res.quantity === 'number' && res.quantity > 0;
  }

  // "is_coastal"
  if (clause === 'is_coastal') {
    return loc.properties.coastal === true;
  }

  // "guild_wealth >= N"
  if (clause.startsWith('guild_wealth >= ')) {
    const threshold = parseFloat(clause.slice('guild_wealth >= '.length));
    if (isNaN(threshold)) return false;
    return checkGuildWealthAtLocation(locationId, graph, threshold);
  }

  // "trade_route_present"
  if (clause === 'trade_route_present') {
    return checkTradeRoutePresentAtLocation(locationId, graph);
  }

  // Unknown predicate → fail-soft: return false
  return false;
}

/**
 * Returns true if any actor at the given location belongs to a guild and has wealth >= threshold.
 * Actors are found via incoming located_at edges. Guild actors have a `guildType` property.
 */
function checkGuildWealthAtLocation(locationId: string, graph: WorldGraph, threshold: number): boolean {
  const locatedEdges = graph.getIncomingEdges(locationId, 'located_at');
  for (const edge of locatedEdges) {
    const actor = graph.getNode(edge.source);
    if (!actor) continue;
    if (typeof actor.properties.guildType !== 'string') continue;
    const wealth = typeof actor.properties.wealth === 'number' ? actor.properties.wealth : 0;
    if (wealth >= threshold) return true;
  }
  return false;
}

/**
 * Returns true if any actor at the given location has at least one trades_with edge.
 */
function checkTradeRoutePresentAtLocation(locationId: string, graph: WorldGraph): boolean {
  const locatedEdges = graph.getIncomingEdges(locationId, 'located_at');
  for (const edge of locatedEdges) {
    const actorId = edge.source;
    const tradeEdges = graph.getOutgoingEdges(actorId, 'trades_with');
    if (tradeEdges.length > 0) return true;
    // Also check incoming trades_with (trade routes can be in either direction)
    const incomingTradeEdges = graph.getIncomingEdges(actorId, 'trades_with');
    if (incomingTradeEdges.length > 0) return true;
  }
  return false;
}
