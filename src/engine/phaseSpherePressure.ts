/**
 * Phase: Sphere Pressure Resolution
 *
 * Each tick, resolves all sphere pressures accumulated by upstream phases
 * (actions, control effects, encounters, doom, rivals) against every affected entity.
 *
 * Resolution algorithm:
 *   1. Net pressures by sphere (sum all events per sphere)
 *   2. Cancel opposition pairs (the larger cancels the smaller; remainder stays)
 *   3. For each remaining sphere:
 *      - Destructive (opposing pressure): compare against threshold. Excess erodes score.
 *      - Constructive (same-direction): accumulate progress toward next level.
 *   4. Emit SpherePressureTrace for every sphere resolution.
 *
 * Agent Presence Buffer:
 *   Agents located at the same location node temporarily boost its effective defense
 *   threshold by their sphere scores * AGENT_PRESENCE_RATIO.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { SphereAffinity, SpherePressureEvent, PressureSource } from '../types/sphereAffinity';
import {
  createDefaultSphereAffinity,
  MAX_SPHERE_SCORE,
  triangleCost,
  AGENT_PRESENCE_RATIO,
} from '../types/sphereAffinity';
import { SPHERE_ALLIES, SPHERE_OPPOSITES } from './cosmology';
import type { GameState } from '../types/gameState';
import { getNodeSphereAffinity } from './sphereAffinity';
import type { QuintessenceEvent } from '../types/quintessence';
import { QUINTESSENCE_OVERCHANNEL_EROSION } from '../types/quintessence';

/**
 * Type guard: returns true only if the value is a well-formed SphereAffinity
 * with both `scores` and `progress` Records.
 *
 * Guards against legacy data where sphereAffinity is stored as a bare SphereName
 * string (e.g., legacy artifact nodes created before Plan 01 seeding).
 */
function isValidSphereAffinity(value: unknown): value is SphereAffinity {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.scores === 'object' && v.scores !== null &&
    typeof v.progress === 'object' && v.progress !== null
  );
}

// ─── Trace Interface ─────────────────────────────────────────────────

export interface SpherePressureTrace {
  category: 'sphere_pressure';
  tick: number;
  entityId: string;
  sphere: SphereName;
  outcome: 'absorbed' | 'eroded' | 'progress' | 'level_up';
  incomingPressure: number;
  threshold: number;
  previousScore: number;
  newScore: number;
  progressFilled: number;
  progressRequired: number;
  source: PressureSource;
}

// ─── Step 1: Net pressures by sphere ────────────────────────────────

/**
 * Sum all pressure event magnitudes per sphere.
 * Returns a record with all 8 spheres initialized to 0.
 */
export function netPressuresBySphere(
  pressures: SpherePressureEvent[]
): Record<SphereName, number> {
  const net = {} as Record<SphereName, number>;
  for (const sphere of SPHERE_NAMES) {
    net[sphere] = 0;
  }
  for (const p of pressures) {
    net[p.sphere] += p.magnitude;
  }
  return net;
}

// ─── Step 2: Cancel opposition pairs ────────────────────────────────

/**
 * For each opposition pair (Force/Energy, Life/Entropy, Mind/Time, Spirit/Matter),
 * compare absolute net pressures. The larger cancels the smaller; remainder stays
 * in the dominant sphere's entry. Both original entries become the net result.
 *
 * Example: life=3, entropy=2 → life=1, entropy=0 (life dominates by 1)
 */
export function cancelOppositions(
  net: Record<SphereName, number>
): Record<SphereName, number> {
  const result = { ...net };

  // Process each sphere once; SPHERE_OPPOSITES is symmetric so we use a visited set
  const visited = new Set<SphereName>();

  for (const sphere of SPHERE_NAMES) {
    if (visited.has(sphere)) continue;
    const opp = SPHERE_OPPOSITES[sphere];
    if (!opp) continue;
    visited.add(sphere);
    visited.add(opp);

    const a = result[sphere]; // net pressure for sphere
    const b = result[opp];    // net pressure for opposite

    // Both are positive (constructive). Cancel using absolute magnitudes.
    // The sphere with higher pressure "wins"; remainder stays in that sphere.
    // If pressures are equal, both become 0.
    const absA = Math.abs(a);
    const absB = Math.abs(b);

    if (absA > absB) {
      // sphere dominates
      result[sphere] = absA - absB;
      result[opp] = 0;
    } else if (absB > absA) {
      // opposite dominates
      result[opp] = absB - absA;
      result[sphere] = 0;
    } else {
      // equal — both cancel
      result[sphere] = 0;
      result[opp] = 0;
    }
  }

  return result;
}

// ─── Step 3 Helper: Destructive determination ────────────────────────

/**
 * A pressure in `pressureSphere` is destructive to `targetSphere` if
 * pressureSphere is the opposite of targetSphere.
 *
 * After cancelOppositions(), the net record's spheres represent the
 * "surviving" pressure in each sphere direction. A non-zero entry in
 * sphere S means S-sphere constructive pressure — UNLESS S is the
 * opposite of a sphere the entity holds, in which case it's destructive
 * to that entity sphere.
 *
 * We determine destructive vs constructive at the entity level:
 * For each sphere with non-zero net pressure after cancellation:
 *   - If the entity has a non-zero score in that sphere → constructive
 *   - If the entity has a non-zero score in the OPPOSITE of that sphere → destructive
 *   - If both are zero → constructive (building new sphere from scratch)
 */
function classifyPressureForEntity(
  pressureSphere: SphereName,
  entity: SphereAffinity
): { isDestructive: boolean; targetSphere: SphereName } {
  const oppositeSphere = SPHERE_OPPOSITES[pressureSphere];

  // If entity holds score in the opposite sphere → this pressure is destructive to that sphere
  if (oppositeSphere && entity.scores[oppositeSphere] > 0) {
    return { isDestructive: true, targetSphere: oppositeSphere };
  }

  // Otherwise it's constructive to the same sphere
  return { isDestructive: false, targetSphere: pressureSphere };
}

// ─── Agent Presence Buffer ───────────────────────────────────────────

/**
 * Effective defense threshold for a location/hex entity in a given sphere,
 * including allied defense and agent presence buffer.
 *
 * formula: hexScore[sphere] + floor(hexScore[ally]/2) + sum(agentScores[sphere] * AGENT_PRESENCE_RATIO)
 */
export function effectiveHexThreshold(
  hexAffinity: SphereAffinity,
  sphere: SphereName,
  presentAgents: SphereAffinity[]
): number {
  const base = hexAffinity.scores[sphere];
  const ally = SPHERE_ALLIES[sphere];
  const allyDefense = ally ? Math.floor(hexAffinity.scores[ally] / 2) : 0;
  const agentBuffer = presentAgents.reduce(
    (sum, a) => sum + Math.floor(a.scores[sphere] * AGENT_PRESENCE_RATIO),
    0
  );
  return base + allyDefense + agentBuffer;
}

// ─── Core Resolution Function ────────────────────────────────────────

/**
 * Resolve all sphere pressures against an entity's SphereAffinity.
 *
 * Steps:
 * 1. Net pressures by sphere
 * 2. Cancel oppositions
 * 3. For each surviving pressure:
 *    - Destructive: compute threshold (score + allied defense + agent buffer), compare, erode if exceeded
 *    - Constructive: accumulate progress, level up if progress >= triangleCost(next level)
 * 4. Emit SpherePressureTrace for each non-zero sphere resolved
 *
 * @param entity - Current SphereAffinity for the entity
 * @param pressures - All pressure events targeting this entity this tick
 * @param presentAgentAffinities - SphereAffinity of agents present at this entity's location
 * @returns Updated SphereAffinity and emitted traces
 */
export function resolveSpherePressure(
  entity: SphereAffinity,
  pressures: SpherePressureEvent[],
  presentAgentAffinities: SphereAffinity[] = []
): { updated: SphereAffinity; traces: SpherePressureTrace[] } {
  if (pressures.length === 0) {
    return { updated: entity, traces: [] };
  }

  // Step 1: Net pressures
  const net = netPressuresBySphere(pressures);

  // Step 2: Cancel oppositions
  const afterCancellation = cancelOppositions(net);

  // Step 3: Resolve each sphere
  const traces: SpherePressureTrace[] = [];
  const updatedScores = { ...entity.scores };
  const updatedProgress = { ...entity.progress };

  // Determine source from first pressure (used for trace; best available attribution)
  const primarySource: PressureSource = pressures[0]?.source ?? 'environmental';

  for (const sphere of SPHERE_NAMES) {
    const pressure = afterCancellation[sphere];
    if (pressure === 0) continue;

    const { isDestructive, targetSphere } = classifyPressureForEntity(sphere, entity);

    if (isDestructive) {
      // ── Destructive: pressure in `sphere` opposes `targetSphere` ──
      const currentScore = updatedScores[targetSphere];
      const ally = SPHERE_ALLIES[targetSphere];
      const allyDefense = ally ? Math.floor(updatedScores[ally] / 2) : 0;
      // For hex entities, agent buffers are already handled via presentAgentAffinities
      const agentBuffer = presentAgentAffinities.reduce(
        (sum, a) => sum + Math.floor(a.scores[targetSphere] * AGENT_PRESENCE_RATIO),
        0
      );
      const threshold = currentScore + allyDefense + agentBuffer;
      const absPressure = Math.abs(pressure);

      if (absPressure > threshold) {
        // Erosion
        const erosion = absPressure - threshold;
        const newScore = Math.max(0, currentScore - erosion);
        updatedScores[targetSphere] = newScore;
        updatedProgress[targetSphere] = 0; // reset progress on erosion

        traces.push({
          category: 'sphere_pressure',
          tick: 0, // filled in by phaseSpherePressure
          entityId: '',  // filled in by phaseSpherePressure
          sphere: targetSphere,
          outcome: 'eroded',
          incomingPressure: absPressure,
          threshold,
          previousScore: currentScore,
          newScore,
          progressFilled: 0,
          progressRequired: triangleCost(newScore + 1),
          source: primarySource,
        });
      } else {
        // Absorbed
        traces.push({
          category: 'sphere_pressure',
          tick: 0,
          entityId: '',
          sphere: targetSphere,
          outcome: 'absorbed',
          incomingPressure: absPressure,
          threshold,
          previousScore: currentScore,
          newScore: currentScore,
          progressFilled: updatedProgress[targetSphere],
          progressRequired: triangleCost(currentScore + 1),
          source: primarySource,
        });
      }
    } else {
      // ── Constructive: pressure builds `targetSphere` (= sphere itself) ──
      const currentScore = updatedScores[targetSphere];

      if (currentScore >= MAX_SPHERE_SCORE) {
        // Already capped — no further advancement
        continue;
      }

      const nextCost = triangleCost(currentScore + 1);
      const newProgress = updatedProgress[targetSphere] + pressure;
      updatedProgress[targetSphere] = newProgress;

      if (newProgress >= nextCost) {
        // Level up
        updatedScores[targetSphere] = currentScore + 1;
        updatedProgress[targetSphere] = newProgress - nextCost;

        traces.push({
          category: 'sphere_pressure',
          tick: 0,
          entityId: '',
          sphere: targetSphere,
          outcome: 'level_up',
          incomingPressure: pressure,
          threshold: 0,
          previousScore: currentScore,
          newScore: currentScore + 1,
          progressFilled: newProgress - nextCost,
          progressRequired: triangleCost(currentScore + 2),
          source: primarySource,
        });
      } else {
        // Progress only
        traces.push({
          category: 'sphere_pressure',
          tick: 0,
          entityId: '',
          sphere: targetSphere,
          outcome: 'progress',
          incomingPressure: pressure,
          threshold: 0,
          previousScore: currentScore,
          newScore: currentScore,
          progressFilled: newProgress,
          progressRequired: nextCost,
          source: primarySource,
        });
      }
    }
  }

  return {
    updated: {
      scores: updatedScores,
      progress: updatedProgress,
    },
    traces,
  };
}

// ─── Orchestrator Phase ──────────────────────────────────────────────

/**
 * Orchestrator phase: consume all accumulated sphere pressure events and resolve them.
 *
 * - Groups pressures by targetEntityId
 * - For each entity: looks up node, resolves pressures, writes updated sphereAffinity
 * - For location nodes: finds agents present via located_at edges and includes their
 *   sphere affinities in the defense threshold computation
 * - Clears pendingSpherePressures after processing
 * - Fails soft: unknown entity IDs and nodes without sphereAffinity are skipped
 *
 * Returns: Partial<GameState> with updated graph + empty pendingSpherePressures.
 * Returns {} (empty object) if no pressures to process.
 */
export function phaseSpherePressure(state: GameState): Partial<GameState> {
  const pressures = state.pendingSpherePressures ?? [];
  if (pressures.length === 0) {
    return {};
  }

  // Group pressures by target entity
  const byEntity = new Map<string, SpherePressureEvent[]>();
  for (const p of pressures) {
    if (!byEntity.has(p.targetEntityId)) {
      byEntity.set(p.targetEntityId, []);
    }
    byEntity.get(p.targetEntityId)!.push(p);
  }

  const graph = state.graph;

  // Build a map of location → present agents (located_at edges) for agent presence buffer
  // We do this lazily per entity rather than building a full map upfront
  function getAgentAffinitiesAtLocation(locationId: string): SphereAffinity[] {
    const agentAffinities: SphereAffinity[] = [];
    const actors = graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual' || a.properties?.actorType === 'ascendant');
    for (const actor of actors) {
      const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
      const isAtLocation = locEdges.some(e => e.target === locationId);
      if (isAtLocation) {
        const aff = getNodeSphereAffinity(actor);
        if (isValidSphereAffinity(aff)) agentAffinities.push(aff);
      }
    }
    return agentAffinities;
  }

  // Process each entity
  let updatedGraph = graph;
  const allTraces: SpherePressureTrace[] = [];
  const quintessenceEvents: QuintessenceEvent[] = [];

  for (const [entityId, entityPressures] of byEntity) {
    const node = updatedGraph.getNode(entityId);
    if (!node) continue; // fail-soft: unknown entity

    let entityAffinity = getNodeSphereAffinity(node);
    if (!isValidSphereAffinity(entityAffinity)) {
      // Fail-soft: initialize blank affinity rather than crashing
      // Handles both missing sphereAffinity and legacy bare-string sphere values
      entityAffinity = createDefaultSphereAffinity();
    }

    // Collect agent presence buffer for location nodes
    const isLocation = node.type === 'location';
    const presentAgents = isLocation ? getAgentAffinitiesAtLocation(entityId) : [];

    const { updated, traces } = resolveSpherePressure(
      entityAffinity,
      entityPressures,
      presentAgents
    );

    // Fill in tick and entityId on traces
    const tickedTraces = traces.map(t => ({ ...t, tick: state.tick, entityId }));
    allTraces.push(...tickedTraces);

    // Write updated affinity back to graph
    updatedGraph.updateNode(entityId, {
      properties: { sphereAffinity: updated },
    });

    // Emit QuintessenceEvent for overchannel pressure — each overchannel event erodes the caster's quintessence
    const overchannel = entityPressures.find(p => p.source === 'overchannel');
    if (overchannel) {
      quintessenceEvents.push({
        targetNodeId: entityId,
        delta: -QUINTESSENCE_OVERCHANNEL_EROSION,
        source: 'overchannel',
        tick: state.tick,
      });
    }
  }

  return {
    graph: updatedGraph,
    pendingSpherePressures: [],
    ...(quintessenceEvents.length > 0
      ? { pendingQuintessenceEvents: [...(state.pendingQuintessenceEvents ?? []), ...quintessenceEvents] }
      : {}),
  };
}
