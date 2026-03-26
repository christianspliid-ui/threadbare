/**
 * View Level Manager — query layer over the WorldGraph.
 *
 * Not a separate data structure — pure functions that filter and group
 * nodes by their containment hierarchy (World → Region → Location → Sub-location).
 */
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';

/**
 * Get all region nodes (location nodes with locationType === 'region').
 */
export function getRegions(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('location').filter(
    (node) => node.properties.locationType === 'region'
  );
}

/**
 * Get all locations within a region (follow 'contains' edges from region).
 */
export function getLocationsInRegion(graph: WorldGraph, regionId: string): GraphNode[] {
  const edges = graph.getOutgoingEdges(regionId, 'contains');
  const locations: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.target);
    if (node && node.type === 'location') {
      locations.push(node);
    }
  }
  return locations;
}

/**
 * Get all sub-locations within a location (follow 'contains' edges).
 */
export function getSubLocations(graph: WorldGraph, locationId: string): GraphNode[] {
  const edges = graph.getOutgoingEdges(locationId, 'contains');
  const subLocations: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.target);
    if (node && node.type === 'location') {
      subLocations.push(node);
    }
  }
  return subLocations;
}

/**
 * Get visible (non-hidden) sub-locations within a location.
 * Hidden sublocations (properties.hidden === true) are filtered out.
 * Used by UI to prevent displaying undiscovered sites.
 */
export function getVisibleSubLocations(graph: WorldGraph, locationId: string): GraphNode[] {
  return getSubLocations(graph, locationId).filter(
    node => node.properties.hidden !== true
  );
}

/**
 * Get all actors at a specific location (find 'located_at' edges targeting this location).
 */
export function getActorsAtLocation(graph: WorldGraph, locationId: string): GraphNode[] {
  const edges = graph.getIncomingEdges(locationId, 'located_at');
  const actors: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.source);
    if (node && node.type === 'actor') {
      actors.push(node);
    }
  }
  return actors;
}

/** Structured view data returned by getViewAtLevel */
export interface ViewData {
  id: string;
  name: string;
  locationType: string;
  locations: GraphNode[];
  actors: GraphNode[];
}

/**
 * Get a structured view at a specific hierarchy level.
 */
export function getViewAtLevel(
  graph: WorldGraph,
  level: 'world' | 'region' | 'location',
  id: string,
): ViewData {
  const node = graph.getNode(id);
  if (!node) throw new Error(`Node not found: ${id}`);

  let locations: GraphNode[] = [];
  let actors: GraphNode[] = [];

  switch (level) {
    case 'world':
      locations = getRegions(graph);
      break;
    case 'region':
      locations = getLocationsInRegion(graph, id);
      // Aggregate actors from all locations in region
      for (const loc of locations) {
        actors.push(...getActorsAtLocation(graph, loc.id));
      }
      break;
    case 'location':
      locations = getSubLocations(graph, id);
      actors = getActorsAtLocation(graph, id);
      break;
  }

  return {
    id: node.id,
    name: node.name,
    locationType: (node.properties.locationType as string) ?? level,
    locations,
    actors,
  };
}
