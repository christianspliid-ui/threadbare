/**
 * Monster Faction Seeding — creates a faction actor node from a legendary lair.
 *
 * Called by phaseLairEscalation when a lair upgrades from major to legendary.
 * Looks up the FactionDefinition for the lair's dominantSphere and instantiates
 * a full faction actor node with sphere affinity and initial ambition.
 *
 * Plan: m2.5-02
 * NFP #1 Tunability: faction templates are data-driven via MONSTER_FACTION_DEFINITIONS
 * NFP #2 Inspectability: emits 'monster_faction_created' trace on creation
 * NFP #3 Determinism: no PRNG; faction is deterministically derived from lair sphere
 * NFP #4 Fail-soft: missing definition → logs warning and returns undefined
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { getMonsterFactionBySphere } from '../data/monster-faction-definitions';
import { emitTrace } from './traceBuffer';

// ─── Adjective pool for generated faction names ───────────────────────────────

const FACTION_ADJ_POOL = [
  'Cursed', 'Ancient', 'Dread', 'Blighted', 'Savage', 'Feral',
  'Wrathful', 'Hungering', 'Shadowed', 'Forsaken',
];

/**
 * Seed a monster faction actor node from a lair node and its dominant sphere.
 *
 * Mutates `state.graph` directly (same pattern as armySpawning.ts).
 *
 * @param state     - Current game state (graph mutated in place)
 * @param lairNode  - The legendary lair location node
 * @param sphere    - The lair's dominant sphere (used to find faction definition)
 * @returns         - The new faction node ID, or undefined if definition not found (fail-soft)
 */
export function seedMonsterFaction(
  state: GameState,
  lairNode: GraphNode,
  sphere: SphereName,
): string | undefined {
  const { graph, tick, seed } = state;

  const def = getMonsterFactionBySphere(sphere);
  if (!def) {
    // Fail-soft: unknown sphere → skip faction creation
    console.warn(`[monsterFactionSeed] No faction definition for sphere: ${sphere}`);
    return undefined;
  }

  const lairId = lairNode.id;

  // Derive a deterministic adjective from the lair seed + tick
  const adjIdx = (seed + tick + lairId.length) % FACTION_ADJ_POOL.length;
  const adj = FACTION_ADJ_POOL[adjIdx];

  // Instantiate name from template
  const name = def.nameTemplate.replace('{adj}', adj);

  // Create faction ID — unique per lair (lairs can only become legendary once)
  const factionId = `monster_faction_${lairId}_${tick}`;

  // Build initial sphere affinity — primary sphere gets a small boost
  const scores = {} as Record<SphereName, number>;
  const progress = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    scores[s] = s === sphere ? 2 : 0;
    progress[s] = 0;
  }

  // Create faction actor node
  graph.addNode({
    id: factionId,
    type: 'actor',
    name,
    properties: {
      actorType: 'faction',
      factionType: 'monster',
      isMonsterFaction: true,
      definitionId: def.id,
      dominantSphere: sphere,
      lairId,
      sphereAffinity: { scores, progress },
      prosperity: 0.5,
      reputation: 0,
      spawnedAtTick: tick,
    },
  });

  // Create controls edge: faction → lair
  const edgeId = `edge_controls_${factionId}`;
  graph.addEdge({
    id: edgeId,
    type: 'controls',
    source: factionId,
    target: lairId,
    properties: { establishedTick: tick },
  });

  // Update lair with monsterFactionId
  graph.updateNode(lairId, {
    properties: {
      ...lairNode.properties,
      monsterFactionId: factionId,
    },
  });

  // Emit trace (cast required: TraceEntry union is not yet extended for 'lair' category)
  emitTrace({
    category: 'faction_ambition',
    summary: `Monster faction '${name}' created from legendary lair ${lairId} (sphere: ${sphere})`,
    agentId: factionId,
    tick,
  } as Parameters<typeof emitTrace>[0]);

  return factionId;
}
