/**
 * Cosmological Taxonomy Type Definitions
 *
 * Defines the graph data model for the fantasy world's metaphysical structure.
 * Based on the 2026-03-03 Taxonomy and Terrain Redesign specification.
 */

/**
 * Represents a single node in the taxonomy graph.
 * Nodes can belong to different layers: foundation, creation, magic-tradition, terrain, relationship-type, etc.
 */
export interface TaxonomyNode {
  id: string;
  name: string;
  category: string;
  description: string;
  properties: Record<string, any>;
}

/**
 * Represents a directed edge (relationship) between two nodes.
 * Edge types are themselves nodes in the graph (self-describing system).
 */
export interface TaxonomyEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
  properties?: Record<string, any>;
}

/**
 * Represents the complete taxonomy graph.
 */
export interface TaxonomyGraph {
  nodes: TaxonomyNode[];
  edges: TaxonomyEdge[];
}

/**
 * Properties specific to relationship-type category nodes.
 */
export interface RelationshipTypeProperties {
  pattern: "symmetric" | "asymmetric";
  description: string;
  visualStyle?: {
    color: string;
    dashArray?: string | null;
    arrowHead?: boolean;
  };
}

/**
 * Visual style configuration for rendering edges.
 */
export interface EdgeVisualStyle {
  color: string;
  dashArray?: string | null;
  arrowHead?: boolean;
}

/**
 * Category constants for different node types.
 */
export const TAXONOMY_CATEGORIES = {
  FOUNDATION: "foundation",
  CREATION: "creation",
  MAGIC_TRADITION: "magic-tradition",
  TERRAIN: "terrain",
  RELATIONSHIP_TYPE: "relationship-type",
} as const;

/**
 * Predefined relationship type IDs.
 */
export const RELATIONSHIP_TYPES = {
  UNDERPINS: "rel.underpins",
  OPPOSES: "rel.opposes",
  EMERGES_FROM: "rel.emerges-from",
  GENERATES: "rel.generates",
  DRAWS_FROM: "rel.draws-from",
  BIOME_AFFINITY: "rel.biome-affinity",
  CONTAINS: "rel.contains",
  ADJACENT: "rel.adjacent",
  AMPLIFIES: "rel.amplifies",
  SUPPRESSES: "rel.suppresses",
  CORRUPTS: "rel.corrupts",
  TRANSFORMS_INTO: "rel.transforms-into",
  SEASONAL_CYCLE: "rel.seasonal-cycle",
} as const;

/**
 * Color scheme for rendering nodes by category.
 */
export const CATEGORY_COLORS = {
  [TAXONOMY_CATEGORIES.FOUNDATION]: "#6a0dad",       // deep purple
  [TAXONOMY_CATEGORIES.CREATION]: "#d4a017",          // gold
  [TAXONOMY_CATEGORIES.MAGIC_TRADITION]: "#2266aa",  // blue
  [TAXONOMY_CATEGORIES.TERRAIN]: "#4a8a3a",          // green
  [TAXONOMY_CATEGORIES.RELATIONSHIP_TYPE]: "#888888", // grey
} as const;
