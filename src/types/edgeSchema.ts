/**
 * Edge Schema Registry — runtime schema for graph edge types.
 *
 * Defines source/target node type constraints, directionality, cardinality,
 * required properties, and human-readable descriptions for every EdgeType.
 *
 * Used by:
 * - dev-mode validated addEdge (warns on constraint violations)
 * - validateAgentIntegrity (checks edge source/target types)
 * - documentation (single source of truth for edge semantics)
 */

import type { EdgeType, NodeType } from './graph';

// ─── Constants ────────────────────────────────────────────────────

/** Enable/disable dev-mode schema validation in addEdge */
export const GRAPH_SCHEMA_VALIDATION_ENABLED = true;

/** If true, throw on unknown edge types; if false, warn only */
export const GRAPH_SCHEMA_THROW_ON_UNKNOWN = false;

// ─── Types ────────────────────────────────────────────────────────

export interface EdgeSchema {
  type: EdgeType;
  /** Node type(s) allowed as edge source */
  sourceNodeType: NodeType | NodeType[];
  /** Node type(s) allowed as edge target */
  targetNodeType: NodeType | NodeType[];
  /** Directed = source→target has semantic meaning; bidirectional = both directions equivalent */
  direction: 'directed' | 'bidirectional';
  /** Cardinality constraint (documentation, not enforced at runtime) */
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** Properties that must be present on the edge */
  requiredProperties: string[];
  /** Human-readable description of the edge's purpose and direction */
  description: string;
}

// ─── Schema Registry ──────────────────────────────────────────────

export const EDGE_SCHEMA: Record<EdgeType, EdgeSchema> = {
  // ── Structural ──────────────────────────────────────────────
  contains: {
    type: 'contains',
    sourceNodeType: ['region', 'location'],
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: [],
    description: 'Spatial containment. Region→locations, location→sub-locations. NOT for actors — use located_at.',
  },
  adjacent: {
    type: 'adjacent',
    sourceNodeType: ['location', 'region'],
    targetNodeType: ['location', 'region'],
    direction: 'bidirectional',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Hex/region adjacency for pathfinding and spatial queries.',
  },

  // ── Trait ───────────────────────────────────────────────────
  has_trait: {
    type: 'has_trait',
    sourceNodeType: ['actor', 'location'],
    targetNodeType: 'trait',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor or location has a trait. Edge properties: level, tick, decay, etc.',
  },

  // ── Possession ─────────────────────────────────────────────
  possesses: {
    type: 'possesses',
    sourceNodeType: 'actor',
    targetNodeType: 'artifact',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor possesses a common artifact.',
  },
  bonded_to: {
    type: 'bonded_to',
    sourceNodeType: 'actor',
    targetNodeType: 'artifact_legendary',
    direction: 'directed',
    cardinality: 'one-to-one',
    requiredProperties: [],
    description: 'Actor is bonded to a legendary artifact (exclusive bond).',
  },
  controls: {
    type: 'controls',
    sourceNodeType: 'actor',
    targetNodeType: ['resource', 'location'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Faction/actor controls a resource or location (jurisdiction).',
  },

  // ── Social ─────────────────────────────────────────────────
  relates_to: {
    type: 'relates_to',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Inter-actor relationship bond. Edge properties: sentiment, trust, strength, basis.',
  },
  member_of: {
    type: 'member_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['role', 'rank', 'joinedTick'],
    description: 'Individual/group is member of faction/group. Source = member, target = faction.',
  },
  belongs_to: {
    type: 'belongs_to',
    sourceNodeType: ['actor', 'location'],
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor/location belongs to a culture. Edge properties: culturalStrength, cultureLayer.',
  },
  thread: {
    type: 'thread',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: [],
    description: 'Divine thread from ascendant to any invested node. Source = ascendant, target = mortal agent, location, faction, army, or artifact. The god reaches down and invests divine attention.',
  },

  // ── Enchantment (RESERVED — not yet implemented) ───────────
  enchanted: {
    type: 'enchanted',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Caster → target enchantment. Not yet implemented.',
  },
  warded: {
    type: 'warded',
    sourceNodeType: 'location',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Ritual site → location ward. Not yet implemented.',
  },
  cursed: {
    type: 'cursed',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Source → target curse. Not yet implemented.',
  },
  blessed: {
    type: 'blessed',
    sourceNodeType: 'actor',
    targetNodeType: ['actor', 'location', 'artifact', 'artifact_legendary'],
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'RESERVED: Source → target blessing. Not yet implemented.',
  },

  // ── Location ───────────────────────────────────────────────
  located_at: {
    type: 'located_at',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor is physically at this location. Source = actor, target = location.',
  },
  avatar_of: {
    type: 'avatar_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: [],
    description: 'Avatar → ascendant link. Source = avatar, target = ascendant.',
  },

  // ── Action ─────────────────────────────────────────────────
  performing: {
    type: 'performing',
    sourceNodeType: 'actor',
    targetNodeType: 'action_template',
    direction: 'directed',
    cardinality: 'one-to-one',
    requiredProperties: [],
    description: 'Actor is currently performing this action.',
  },

  // ── Cosmology ──────────────────────────────────────────────
  aligned_with: {
    type: 'aligned_with',
    sourceNodeType: ['actor', 'location'],
    targetNodeType: 'cosmology',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor or location is aligned with a cosmological sphere.',
  },
  sphere_influence: {
    type: 'sphere_influence',
    sourceNodeType: ['actor', 'location'],
    targetNodeType: 'cosmology',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Sphere influence tracking on location/actor (weight/dominance).',
  },

  // ── Ambition ───────────────────────────────────────────────
  pursues: {
    type: 'pursues',
    sourceNodeType: 'actor',
    targetNodeType: 'ambition',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor is pursuing this ambition. Edge properties: priority, status, milestones.',
  },

  // ── Infrastructure ─────────────────────────────────────────
  road: {
    type: 'road',
    sourceNodeType: 'location',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Road/trail between locations. Edge properties: roadType, hexPath, totalCost, pathLength.',
  },

  // ── Encounter ──────────────────────────────────────────────
  encounter_at: {
    type: 'encounter_at',
    sourceNodeType: 'action_template',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Encounter template is available at this location.',
  },

  // ── Encounter History (TB-077) ─────────────────────────────
  participated_in: {
    type: 'participated_in',
    sourceNodeType: 'actor',
    targetNodeType: 'event',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['role', 'outcome', 'tick'],
    description: 'Actor participated in an encounter outcome event. Properties: role (primary/target), outcome, tick.',
  },
  occurred_at: {
    type: 'occurred_at',
    sourceNodeType: 'event',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: ['tick'],
    description: 'Encounter event occurred at this location. Properties: tick, sublocationId (optional).',
  },

  // ── Economic ───────────────────────────────────────────────
  trades_with: {
    type: 'trades_with',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'bidirectional',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Trade route between actors. Edge properties: volume, goodsType, controlledBy, threatened.',
  },
  // ── Construction ──────────────────────────────────────────
  constructed_by: {
    type: 'constructed_by',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Actor (faction/individual) constructed a structure at this location. Edge properties: structureType.',
  },

  // ── Military (TB-073) ──
  commanded_by: {
    type: 'commanded_by',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-one',
    requiredProperties: [],
    description: 'Army is commanded by this agent. Commander is physically committed to the army.',
  },
  participates_in: {
    type: 'participates_in',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: [],
    description: 'Army or agent participates in a battle node.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────

/** Check if a node type matches a schema's allowed types */
export function matchesNodeType(
  actualType: string,
  allowedTypes: NodeType | NodeType[],
): boolean {
  if (Array.isArray(allowedTypes)) {
    return allowedTypes.includes(actualType as NodeType);
  }
  return actualType === allowedTypes;
}
