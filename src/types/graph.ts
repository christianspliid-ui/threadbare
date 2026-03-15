/**
 * World Graph type definitions.
 *
 * The world graph is the central data structure. All entities are nodes,
 * all relationships are typed directed edges with properties.
 */

/** Every node in the world graph has these fields */
export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  properties: Record<string, unknown>;
}

/** Typed node categories */
export type NodeType =
  | 'actor'           // individuals, groups, factions, cultures, gods
  | 'location'        // hexes, regions, sub-locations
  | 'trait'           // trait definitions (category: innate/mastery/scar/etc.)
  | 'artifact'        // common artifacts
  | 'artifact_legendary' // legendary artifacts (have own trait graph)
  | 'resource'        // steady or consumable resource nodes
  | 'action_template' // CRUD action definitions
  | 'event'           // resolved action records
  | 'cosmology'       // sphere/foundation nodes (imported from taxonomy)
  | 'region';         // geographic region clusters (terrain gen Phase 2)

/** Actor subtypes stored in properties.actorType */
export type ActorType = 'god' | 'ascendant' | 'faction' | 'culture' | 'group' | 'individual';

/** Every edge in the world graph */
export interface GraphEdge {
  id: string;
  source: string;     // source node ID
  target: string;     // target node ID
  type: EdgeType;
  properties: Record<string, unknown>;
}

/** Typed edge categories */
export type EdgeType =
  // Structural
  | 'contains'        // region contains location, location contains sub-location
  | 'adjacent'        // hex adjacency, region adjacency
  // Trait
  | 'has_trait'        // actor/location has trait (with level, tick, decay, etc.)
  // Possession
  | 'possesses'        // actor possesses common artifact
  | 'bonded_to'        // actor bonded to legendary artifact
  | 'controls'         // faction/actor controls resource
  // Social
  | 'relates_to'       // inter-actor relationship (sentiment, strength, basis)
  | 'member_of'        // individual is member of group/faction
  | 'belongs_to'       // actor/location belongs to culture (culturalStrength, cultureLayer)
  | 'worships'         // actor worships god/ascendant
  // Enchantment
  | 'enchanted'        // caster → target enchantment
  | 'warded'           // ritual site → location ward
  | 'cursed'           // source → target curse
  | 'blessed'          // source → target blessing
  // Location
  | 'located_at'       // actor is at location
  | 'avatar_of'        // avatar ↔ ascendant link
  // Action
  | 'performing'       // actor → action_template (in-progress action)
  // Cosmology
  | 'aligned_with'     // actor/location → sphere alignment
  | 'sphere_influence';// location/actor → sphere influence (weight/dominance tracking)

/** Result type for graph mutations */
export interface GraphMutation {
  type: 'add_node' | 'remove_node' | 'update_node' | 'add_edge' | 'remove_edge' | 'update_edge';
  nodeId?: string;
  edgeId?: string;
  data?: Partial<GraphNode> | Partial<GraphEdge>;
}
