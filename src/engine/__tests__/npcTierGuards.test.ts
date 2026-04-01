/**
 * NPC Tier Guards — verifies spotlightTier filtering in getAgentsAtLocation.
 *
 * Tests:
 * 1. Returns all individuals by default (backward compat)
 * 2. Filters to spotlight only when spotlightTier='spotlight'
 * 3. Filters to ambient only when spotlightTier='ambient'
 * 4. Filters to notable only when spotlightTier='notable'
 * 5. Legacy nodes without spotlightTier default to 'spotlight'
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentsAtLocation } from '../graphQueries';

// ─── Test Graph Setup ─────────────────────────────────────────────

function buildTestGraph() {
  const graph = new WorldGraph();

  // Location node
  graph.addNode({
    id: 'loc.1',
    type: 'location',
    name: 'The Wayward Inn',
    properties: { locationType: 'settlement' },
  });

  // Spotlight agent (explicit)
  graph.addNode({
    id: 'agent.spotlight',
    type: 'actor',
    name: 'Serafina',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
    },
  });
  graph.addEdge({
    id: 'edge.spotlight_located',
    source: 'agent.spotlight',
    target: 'loc.1',
    type: 'located_at',
    properties: {},
  });

  // Ambient NPC
  graph.addNode({
    id: 'agent.ambient',
    type: 'actor',
    name: 'Innkeeper Bryn',
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
    },
  });
  graph.addEdge({
    id: 'edge.ambient_located',
    source: 'agent.ambient',
    target: 'loc.1',
    type: 'located_at',
    properties: {},
  });

  // Notable NPC
  graph.addNode({
    id: 'agent.notable',
    type: 'actor',
    name: 'Captain Vorn',
    properties: {
      actorType: 'individual',
      spotlightTier: 'notable',
    },
  });
  graph.addEdge({
    id: 'edge.notable_located',
    source: 'agent.notable',
    target: 'loc.1',
    type: 'located_at',
    properties: {},
  });

  // Legacy agent (no spotlightTier property at all — should default to 'spotlight')
  graph.addNode({
    id: 'agent.legacy',
    type: 'actor',
    name: 'Old Magister',
    properties: {
      actorType: 'individual',
      // No spotlightTier
    },
  });
  graph.addEdge({
    id: 'edge.legacy_located',
    source: 'agent.legacy',
    target: 'loc.1',
    type: 'located_at',
    properties: {},
  });

  // Non-individual actor (faction) — should never be returned by getAgentsAtLocation
  graph.addNode({
    id: 'faction.1',
    type: 'actor',
    name: 'The Merchant Guild',
    properties: {
      actorType: 'faction',
    },
  });
  graph.addEdge({
    id: 'edge.faction_located',
    source: 'faction.1',
    target: 'loc.1',
    type: 'located_at',
    properties: {},
  });

  return graph;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('getAgentsAtLocation — spotlightTier filtering', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = buildTestGraph();
  });

  it('returns all individuals (spotlight + ambient + notable + legacy) when no tier filter given', () => {
    const agents = getAgentsAtLocation(graph, 'loc.1');
    const ids = agents.map(a => a.id).sort();
    expect(ids).toContain('agent.spotlight');
    expect(ids).toContain('agent.ambient');
    expect(ids).toContain('agent.notable');
    expect(ids).toContain('agent.legacy');
    expect(ids).not.toContain('faction.1');
    expect(agents).toHaveLength(4);
  });

  it('returns only spotlight-tier agents when spotlightTier="spotlight"', () => {
    const agents = getAgentsAtLocation(graph, 'loc.1', 'spotlight');
    const ids = agents.map(a => a.id).sort();
    // spotlight + legacy (legacy defaults to spotlight)
    expect(ids).toContain('agent.spotlight');
    expect(ids).toContain('agent.legacy');
    expect(ids).not.toContain('agent.ambient');
    expect(ids).not.toContain('agent.notable');
    expect(agents).toHaveLength(2);
  });

  it('returns only ambient-tier agents when spotlightTier="ambient"', () => {
    const agents = getAgentsAtLocation(graph, 'loc.1', 'ambient');
    const ids = agents.map(a => a.id);
    expect(ids).toContain('agent.ambient');
    expect(ids).not.toContain('agent.spotlight');
    expect(ids).not.toContain('agent.notable');
    expect(ids).not.toContain('agent.legacy');
    expect(agents).toHaveLength(1);
  });

  it('returns only notable-tier agents when spotlightTier="notable"', () => {
    const agents = getAgentsAtLocation(graph, 'loc.1', 'notable');
    const ids = agents.map(a => a.id);
    expect(ids).toContain('agent.notable');
    expect(ids).not.toContain('agent.spotlight');
    expect(ids).not.toContain('agent.ambient');
    expect(ids).not.toContain('agent.legacy');
    expect(agents).toHaveLength(1);
  });

  it('legacy nodes without spotlightTier property are treated as spotlight', () => {
    // Verify the legacy node actually has no spotlightTier
    const legacyNode = graph.getNode('agent.legacy');
    expect(legacyNode?.properties.spotlightTier).toBeUndefined();

    // It should appear in spotlight filter results
    const spotlight = getAgentsAtLocation(graph, 'loc.1', 'spotlight');
    expect(spotlight.map(a => a.id)).toContain('agent.legacy');

    // It should NOT appear in ambient or notable filter results
    const ambient = getAgentsAtLocation(graph, 'loc.1', 'ambient');
    expect(ambient.map(a => a.id)).not.toContain('agent.legacy');

    const notable = getAgentsAtLocation(graph, 'loc.1', 'notable');
    expect(notable.map(a => a.id)).not.toContain('agent.legacy');
  });

  it('returns empty array for a location with no agents', () => {
    graph.addNode({ id: 'loc.empty', type: 'location', name: 'Empty Cave', properties: {} });
    expect(getAgentsAtLocation(graph, 'loc.empty')).toHaveLength(0);
    expect(getAgentsAtLocation(graph, 'loc.empty', 'spotlight')).toHaveLength(0);
  });
});
