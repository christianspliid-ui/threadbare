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
  | 'actor'              // individuals, groups, factions, cultures, gods
  | 'location'           // hexes, regions, sub-locations
  | 'trait'              // trait definitions (category: innate/mastery/scar/etc.)
  | 'artifact'           // common artifacts
  | 'artifact_legendary' // legendary artifacts (have own trait graph)
  | 'resource'           // steady or consumable resource nodes
  | 'action_template'    // CRUD action definitions
  | 'event'              // resolved action records
  | 'cosmology'          // sphere/foundation nodes (imported from taxonomy)
  | 'region'             // geographic region clusters (terrain gen Phase 2)
  | 'ambition'           // ambition template instances assigned to actors
  | 'encounter_template' // encounter template graph node (design plan §3.8, B5)
  | 'relationship';      // reified relationship between two actors (design plan §3.9, B5)

/** Actor subtypes stored in properties.actorType */
export type ActorType = 'god' | 'ascendant' | 'faction' | 'culture' | 'group' | 'individual';

/**
 * Typed properties for actor nodes (actorType: 'individual').
 * Properties bag is Record<string, unknown> at runtime; this interface documents known fields.
 */
export interface AgentNodeProperties {
  actorType: ActorType;
  /** True when the player has explicitly marked this agent as part of their protagonist portfolio. */
  isPortfolioPinned?: boolean;
}

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
  | 'hostile_to'       // inter-actor hostility relation (e.g. excommunicated/rival targets)
  | 'member_of'        // individual is member of group/faction
  | 'belongs_to'       // actor/location belongs to culture (culturalStrength, cultureLayer)
  | 'thread'           // ascendant → mortal divine thread (god reaches down)
  // Enchantment — RESERVED: not yet implemented
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
  | 'sphere_influence' // location/actor → sphere influence (weight/dominance tracking)
  // Ambition
  | 'pursues'          // actor → ambition (priority, status, milestones)
  // Infrastructure
  | 'road'             // location ↔ location road/trail (roadType, hexPath, totalCost, pathLength)
  // Encounter
  | 'encounter_at'     // encounter_template → location (encounter available at location)
  // Encounter template graph (THR-327, design plan §3.8)
  | 'gates_to'         // encounter_template → encounter_template: completing source unlocks target
  | 'spawns_from'      // encounter_template → location|actor: encounter is sourced from this node
  | 'enables'          // encounter_template → encounter_template: soft prereq (completion scores target higher)
  // Economic
  | 'trades_with'      // actor ↔ actor trade route (volume, goodsType, controlledBy, threatened)
  // Encounter History (TB-077)
  | 'participated_in'  // actor → event (encounter outcome participation)
  | 'occurred_at'      // event → location (encounter happened here)
  // Construction
  | 'constructed_by'   // location/sublocation → actor (who built/constructed this structure)
  // Military (TB-073)
  | 'commanded_by'     // army → commander agent (army leadership)
  | 'participates_in'  // army/agent → battle node (battle participation)
  // Spell System
  | 'knows_spell'      // actor → spell_template (learned spell)
  // Causation (THR-116)
  | 'caused_by'        // event → event/seed (this encounter was set up by that one)
  // Social leverage (THR-30)
  | 'knows_secret_of'  // discoverer → secret subject (KnowsSecretOfEdgeProperties)
  | 'owes_favor'       // debtor → creditor (OwesFavorEdgeProperties)
  // Ruins layer (THR-149, THR-150)
  | 'knows_clue_of'    // knower → target ruin (KnowsClueOfEdgeProperties in src/types/knowledge.ts)
  | 'knows_of'         // knower → location; familiarity edge created when a clue is consumed at convergence
  // Ruins layer — PoP holder (THR-153)
  | 'holds_place_of_power'; // actor | faction | ascendant → place_of_power location (HoldsPlaceOfPowerEdgeProperties)

/**
 * Typed properties for encounter_template nodes (design plan §3.8).
 * Properties bag is Record<string, unknown> at runtime; this interface documents known fields.
 * Callers must call touchWorld(runtime) after mutating these nodes.
 */
export interface EncounterTemplateNodeProperties {
  template_id: string;               // reference to EncounterContract id
  category: string;                  // EncounterCategory
  rarity_tier: 1 | 2 | 3 | 4;
  intrinsic_tier: 'background' | 'shaping' | 'story_beat';
}

/**
 * Typed properties for relationship nodes (design plan §3.9).
 * Symmetric between two actors; cast tile reads from this when present,
 * falls back to relates_to edge sentiment when absent.
 * Callers must call touchWorld(runtime) after mutating these nodes.
 */
export interface RelationshipNodeProperties {
  participants: [string, string];    // [ActorId, ActorId]
  arc: 'improving' | 'stable' | 'fraying' | 'severed';
  tension_axis: string;              // human-readable, e.g. "loyalty under strain"
  tension_drift: number;             // -1.0 to +1.0; positive toward repair, negative toward severance
  history: string[];                 // EventId[]
  last_invoked_tick: number;
}

/** Result type for graph mutations */
export interface GraphMutation {
  type: 'add_node' | 'remove_node' | 'update_node' | 'add_edge' | 'remove_edge' | 'update_edge';
  nodeId?: string;
  edgeId?: string;
  data?: Partial<GraphNode> | Partial<GraphEdge>;
}
