/**
 * World Model Type Definitions
 *
 * Defines the unified graph data model that consolidates all taxonomies
 * (foundation spheres, creation spheres, magic traditions, terrain biomes,
 * relationship types, and edges) into a single source-of-truth JSON file.
 */

import { TaxonomyNode, TaxonomyEdge } from "./taxonomy";

/**
 * Metadata about the world model file.
 */
export interface WorldModelMeta {
  /** Version of the world model schema */
  version: string;
  /** ISO timestamp of when the file was generated */
  generated: string;
  /** Total count of nodes in the model */
  nodeCount: number;
  /** Total count of edges in the model */
  edgeCount: number;
  /** List of all unique node categories present */
  categories: string[];
}

/**
 * The complete world model — a unified graph containing all cosmological data.
 * This is the consolidated version of all 6 separate taxonomy JSON files.
 */
export interface WorldModel {
  /** Metadata about this world model */
  meta: WorldModelMeta;
  /** All nodes (spheres, traditions, biomes, relationship types) */
  nodes: TaxonomyNode[];
  /** All edges (relationships between nodes) */
  edges: TaxonomyEdge[];
}
