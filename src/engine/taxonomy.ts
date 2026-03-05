/**
 * Taxonomy Engine
 *
 * Provides utilities for loading and querying the cosmological taxonomy graph.
 * The taxonomy is loaded from the consolidated world-model.json file
 * and provides query functions for navigating the graph structure.
 */

import worldModel from "../data/world-model.json";

import {
  TaxonomyNode,
  TaxonomyEdge,
  TaxonomyGraph,
} from "../types/taxonomy";

/**
 * Load the complete taxonomy graph from the consolidated world-model.json file.
 * This unified file contains all nodes (relationship types, foundation spheres,
 * creation spheres, magic traditions, and terrain biomes) and all edges.
 */
export async function loadTaxonomy(): Promise<TaxonomyGraph> {
  return {
    nodes: worldModel.nodes as TaxonomyNode[],
    edges: worldModel.edges as TaxonomyEdge[],
  };
}

/**
 * Get all nodes that belong to a specific category.
 *
 * @param graph The taxonomy graph
 * @param category The category to filter by (e.g., "foundation-sphere", "magic-tradition")
 * @returns Array of nodes in that category
 */
export function getNodesByCategory(
  graph: TaxonomyGraph,
  category: string
): TaxonomyNode[] {
  return graph.nodes.filter((node) => node.category === category);
}

/**
 * Get a single node by its ID.
 *
 * @param graph The taxonomy graph
 * @param id The node ID to look up
 * @returns The node, or undefined if not found
 */
export function getNodeById(
  graph: TaxonomyGraph,
  id: string
): TaxonomyNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}

/**
 * Get all edges where a specific node is either source or target.
 *
 * @param graph The taxonomy graph
 * @param nodeId The node ID to query
 * @returns Array of edges connected to this node
 */
export function getEdgesForNode(
  graph: TaxonomyGraph,
  nodeId: string
): TaxonomyEdge[] {
  return graph.edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId
  );
}

/**
 * Get all nodes that are directly connected to a specific node.
 * Includes both nodes that the given node points to and nodes that point to it.
 *
 * @param graph The taxonomy graph
 * @param nodeId The node ID to query
 * @returns Array of connected nodes (excluding the given node itself)
 */
export function getConnectedNodes(
  graph: TaxonomyGraph,
  nodeId: string
): TaxonomyNode[] {
  const edges = getEdgesForNode(graph, nodeId);
  const connectedIds = new Set<string>();

  for (const edge of edges) {
    if (edge.source === nodeId) {
      connectedIds.add(edge.target);
    } else if (edge.target === nodeId) {
      connectedIds.add(edge.source);
    }
  }

  return graph.nodes.filter((node) => connectedIds.has(node.id));
}

/**
 * Get all edges of a specific relationship type.
 *
 * @param graph The taxonomy graph
 * @param type The relationship type ID (e.g., "rel.underpins")
 * @returns Array of edges of that type
 */
export function getEdgesByType(
  graph: TaxonomyGraph,
  type: string
): TaxonomyEdge[] {
  return graph.edges.filter((edge) => edge.type === type);
}

/**
 * Get the relationship type node for a given relationship type ID.
 * Relationship types are themselves nodes in the graph with category "relationship-type".
 *
 * @param graph The taxonomy graph
 * @param typeId The relationship type ID (e.g., "rel.underpins")
 * @returns The relationship type node, or undefined if not found
 */
export function getRelationshipType(
  graph: TaxonomyGraph,
  typeId: string
): TaxonomyNode | undefined {
  return graph.nodes.find(
    (node) => node.id === typeId && node.category === "relationship-type"
  );
}

/**
 * Get all outgoing edges (edges where the node is the source).
 *
 * @param graph The taxonomy graph
 * @param nodeId The node ID to query
 * @returns Array of outgoing edges
 */
export function getOutgoingEdges(
  graph: TaxonomyGraph,
  nodeId: string
): TaxonomyEdge[] {
  return graph.edges.filter((edge) => edge.source === nodeId);
}

/**
 * Get all incoming edges (edges where the node is the target).
 *
 * @param graph The taxonomy graph
 * @param nodeId The node ID to query
 * @returns Array of incoming edges
 */
export function getIncomingEdges(
  graph: TaxonomyGraph,
  nodeId: string
): TaxonomyEdge[] {
  return graph.edges.filter((edge) => edge.target === nodeId);
}

/**
 * Get all nodes that the given node points to (outgoing connections).
 *
 * @param graph The taxonomy graph
 * @param nodeId The node ID to query
 * @returns Array of target nodes
 */
export function getTargetNodes(
  graph: TaxonomyGraph,
  nodeId: string
): TaxonomyNode[] {
  const outgoing = getOutgoingEdges(graph, nodeId);
  const targetIds = outgoing.map((e) => e.target);
  return graph.nodes.filter((node) => targetIds.includes(node.id));
}

/**
 * Get all nodes that point to the given node (incoming connections).
 *
 * @param graph The taxonomy graph
 * @param nodeId The node ID to query
 * @returns Array of source nodes
 */
export function getSourceNodes(
  graph: TaxonomyGraph,
  nodeId: string
): TaxonomyNode[] {
  const incoming = getIncomingEdges(graph, nodeId);
  const sourceIds = incoming.map((e) => e.source);
  return graph.nodes.filter((node) => sourceIds.includes(node.id));
}

/**
 * Search for nodes by name or description.
 * Performs case-insensitive substring matching.
 *
 * @param graph The taxonomy graph
 * @param query The search query
 * @returns Array of matching nodes
 */
export function searchNodes(
  graph: TaxonomyGraph,
  query: string
): TaxonomyNode[] {
  const lowerQuery = query.toLowerCase();
  return graph.nodes.filter(
    (node) =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get nodes by category AND search term.
 * Useful for filtering within a specific category.
 *
 * @param graph The taxonomy graph
 * @param category The category to filter by
 * @param query The search query
 * @returns Array of matching nodes in that category
 */
export function searchNodesByCategory(
  graph: TaxonomyGraph,
  category: string,
  query: string
): TaxonomyNode[] {
  const categoryNodes = getNodesByCategory(graph, category);
  const lowerQuery = query.toLowerCase();
  return categoryNodes.filter(
    (node) =>
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery)
  );
}
