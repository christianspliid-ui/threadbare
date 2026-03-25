import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getAgentsAtLocation,
  getAllActorsAtLocation,
  getAgentLocation,
  getAgentLocationId,
  getSublocationsAt,
  getLocationsInRegion,
  getFactionMembers,
  getAgentFaction,
  getAgentMemberships,
  getActorCultures,
  getCultureMembers,
  getAgentBonds,
  getIncomingBonds,
  getActorTraits,
  getAgentAmbitions,
  getAgentWorships,
  getWorshippers,
  getAvatarsOf,
  getAvatarAscendant,
  getAgentArtifacts,
  getAgentLegendaryArtifacts,
  getRoadsFrom,
  getRoadsTo,
  getAllRoads,
  getAdjacentLocationIds,
  getTradeRoutes,
  getAgentCurrentAction,
  getControlledBy,
  getControllers,
} from '../graphQueries';

// ─── Helpers ──────────────────────────────────────────────────────

function buildGraph(): WorldGraph {
  const g = new WorldGraph();

  // Locations
  g.addNode({ id: 'loc.1', type: 'location', name: 'Village', properties: {} });
  g.addNode({ id: 'loc.2', type: 'location', name: 'Forest', properties: {} });
  g.addNode({ id: 'loc.3', type: 'location', name: 'Cave', properties: {} }); // sublocation of loc.1
  g.addNode({ id: 'region.1', type: 'region', name: 'Heartlands', properties: {} });

  // Region → location containment
  g.addEdge({ id: 'e.region_loc1', source: 'region.1', target: 'loc.1', type: 'contains', properties: {} });
  g.addEdge({ id: 'e.region_loc2', source: 'region.1', target: 'loc.2', type: 'contains', properties: {} });

  // Sublocation containment
  g.addEdge({ id: 'e.loc1_loc3', source: 'loc.1', target: 'loc.3', type: 'contains', properties: {} });

  // Adjacency
  g.addEdge({ id: 'e.adj_1_2', source: 'loc.1', target: 'loc.2', type: 'adjacent', properties: {} });

  // Actors
  g.addNode({ id: 'agent.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  g.addNode({ id: 'agent.2', type: 'actor', name: 'Lyra', properties: { actorType: 'individual' } });
  g.addNode({ id: 'agent.3', type: 'actor', name: 'Vorn', properties: { actorType: 'individual' } });
  g.addNode({ id: 'faction.1', type: 'actor', name: 'Iron Guard', properties: { actorType: 'faction' } });
  g.addNode({ id: 'culture.1', type: 'actor', name: 'Nomadic Tribe', properties: { actorType: 'culture' } });
  g.addNode({ id: 'god.1', type: 'actor', name: 'Solaris', properties: { actorType: 'god' } });
  g.addNode({ id: 'ascendant.1', type: 'actor', name: 'The Flame', properties: { actorType: 'ascendant' } });

  // located_at
  g.addEdge({ id: 'e.a1_loc', source: 'agent.1', target: 'loc.1', type: 'located_at', properties: {} });
  g.addEdge({ id: 'e.a2_loc', source: 'agent.2', target: 'loc.1', type: 'located_at', properties: {} });
  g.addEdge({ id: 'e.a3_loc', source: 'agent.3', target: 'loc.2', type: 'located_at', properties: {} });

  // member_of
  g.addEdge({ id: 'e.a1_fac', source: 'agent.1', target: 'faction.1', type: 'member_of', properties: { role: 'captain', rank: 3, joinedTick: 10 } });
  g.addEdge({ id: 'e.a2_fac', source: 'agent.2', target: 'faction.1', type: 'member_of', properties: { role: 'recruit', rank: 1, joinedTick: 20 } });

  // belongs_to (culture)
  g.addEdge({ id: 'e.a1_cul', source: 'agent.1', target: 'culture.1', type: 'belongs_to', properties: { culturalStrength: 0.8 } });
  g.addEdge({ id: 'e.a3_cul', source: 'agent.3', target: 'culture.1', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

  // relates_to (bonds)
  g.addEdge({ id: 'e.bond_1_2', source: 'agent.1', target: 'agent.2', type: 'relates_to', properties: { sentiment: 0.7, trust: 0.5 } });
  g.addEdge({ id: 'e.bond_3_1', source: 'agent.3', target: 'agent.1', type: 'relates_to', properties: { sentiment: -0.3, trust: 0.2 } });

  // Traits
  g.addNode({ id: 'trait.1', type: 'trait', name: 'Brave', properties: { category: 'innate' } });
  g.addEdge({ id: 'e.a1_trait', source: 'agent.1', target: 'trait.1', type: 'has_trait', properties: { level: 2 } });

  // Ambitions
  g.addNode({ id: 'ambition.1', type: 'ambition', name: 'Become King', properties: {} });
  g.addEdge({ id: 'e.a1_amb', source: 'agent.1', target: 'ambition.1', type: 'pursues', properties: { priority: 1, status: 'active' } });

  // Worship
  g.addEdge({ id: 'e.a1_worship', source: 'agent.1', target: 'god.1', type: 'worships', properties: {} });
  g.addEdge({ id: 'e.a2_worship', source: 'agent.2', target: 'god.1', type: 'worships', properties: {} });

  // Avatar
  g.addEdge({ id: 'e.a3_avatar', source: 'agent.3', target: 'ascendant.1', type: 'avatar_of', properties: {} });

  // Artifacts
  g.addNode({ id: 'artifact.1', type: 'artifact', name: 'Iron Sword', properties: {} });
  g.addNode({ id: 'artifact.2', type: 'artifact_legendary', name: 'Flameblade', properties: {} });
  g.addEdge({ id: 'e.a1_poss', source: 'agent.1', target: 'artifact.1', type: 'possesses', properties: {} });
  g.addEdge({ id: 'e.a1_bond', source: 'agent.1', target: 'artifact.2', type: 'bonded_to', properties: {} });

  // Roads
  g.addEdge({ id: 'e.road_1_2', source: 'loc.1', target: 'loc.2', type: 'road', properties: { roadType: 'major' } });

  // Trade
  g.addEdge({ id: 'e.trade_f1_a3', source: 'faction.1', target: 'agent.3', type: 'trades_with', properties: { volume: 10 } });

  // Performing action
  g.addNode({ id: 'action.1', type: 'action_template', name: 'Patrol', properties: {} });
  g.addEdge({ id: 'e.a1_action', source: 'agent.1', target: 'action.1', type: 'performing', properties: {} });

  // Controls
  g.addNode({ id: 'resource.1', type: 'resource', name: 'Iron Mine', properties: {} });
  g.addEdge({ id: 'e.f1_ctrl', source: 'faction.1', target: 'resource.1', type: 'controls', properties: {} });

  return g;
}

// ─── Location queries ─────────────────────────────────────────────

describe('getAgentsAtLocation', () => {
  it('returns only individuals at a location', () => {
    const g = buildGraph();
    const agents = getAgentsAtLocation(g, 'loc.1');
    expect(agents.map(a => a.id).sort()).toEqual(['agent.1', 'agent.2']);
  });

  it('returns empty for location with no agents', () => {
    const g = buildGraph();
    const agents = getAgentsAtLocation(g, 'loc.3');
    expect(agents).toEqual([]);
  });

  it('returns empty for non-existent location', () => {
    const g = buildGraph();
    expect(getAgentsAtLocation(g, 'loc.999')).toEqual([]);
  });
});

describe('getAllActorsAtLocation', () => {
  it('returns all actor types at a location', () => {
    const g = buildGraph();
    // Add a faction at loc.1
    g.addEdge({ id: 'e.f1_loc', source: 'faction.1', target: 'loc.1', type: 'located_at', properties: {} });
    const actors = getAllActorsAtLocation(g, 'loc.1');
    expect(actors.map(a => a.id).sort()).toEqual(['agent.1', 'agent.2', 'faction.1']);
  });
});

describe('getAgentLocation', () => {
  it('returns location node', () => {
    const g = buildGraph();
    const loc = getAgentLocation(g, 'agent.1');
    expect(loc?.id).toBe('loc.1');
    expect(loc?.name).toBe('Village');
  });

  it('returns undefined for agent with no location', () => {
    const g = buildGraph();
    expect(getAgentLocation(g, 'faction.1')).toBeUndefined();
  });
});

describe('getAgentLocationId', () => {
  it('returns location ID', () => {
    const g = buildGraph();
    expect(getAgentLocationId(g, 'agent.1')).toBe('loc.1');
  });

  it('returns undefined for agent with no location', () => {
    const g = buildGraph();
    expect(getAgentLocationId(g, 'faction.1')).toBeUndefined();
  });
});

describe('getSublocationsAt', () => {
  it('returns sublocations of a parent location', () => {
    const g = buildGraph();
    const subs = getSublocationsAt(g, 'loc.1');
    expect(subs.map(s => s.id)).toEqual(['loc.3']);
  });

  it('returns empty for location without sublocations', () => {
    const g = buildGraph();
    expect(getSublocationsAt(g, 'loc.2')).toEqual([]);
  });
});

describe('getLocationsInRegion', () => {
  it('returns locations contained in a region', () => {
    const g = buildGraph();
    const locs = getLocationsInRegion(g, 'region.1');
    expect(locs.map(l => l.id).sort()).toEqual(['loc.1', 'loc.2']);
  });
});

// ─── Social queries ───────────────────────────────────────────────

describe('getFactionMembers', () => {
  it('returns all members of a faction', () => {
    const g = buildGraph();
    const members = getFactionMembers(g, 'faction.1');
    expect(members.map(m => m.id).sort()).toEqual(['agent.1', 'agent.2']);
  });
});

describe('getAgentFaction', () => {
  it('returns faction with rank and role', () => {
    const g = buildGraph();
    const result = getAgentFaction(g, 'agent.1');
    expect(result).toBeDefined();
    expect(result!.faction.id).toBe('faction.1');
    expect(result!.rank).toBe(3);
    expect(result!.role).toBe('captain');
  });

  it('returns undefined for non-member', () => {
    const g = buildGraph();
    expect(getAgentFaction(g, 'agent.3')).toBeUndefined();
  });
});

describe('getAgentMemberships', () => {
  it('returns all group memberships with edges', () => {
    const g = buildGraph();
    const memberships = getAgentMemberships(g, 'agent.1');
    expect(memberships).toHaveLength(1);
    expect(memberships[0].group.id).toBe('faction.1');
    expect(memberships[0].edge.properties.role).toBe('captain');
  });
});

describe('getActorCultures', () => {
  it('returns culture with strength', () => {
    const g = buildGraph();
    const cultures = getActorCultures(g, 'agent.1');
    expect(cultures).toHaveLength(1);
    expect(cultures[0].culture.id).toBe('culture.1');
    expect(cultures[0].strength).toBe(0.8);
  });

  it('returns empty for actor with no culture', () => {
    const g = buildGraph();
    expect(getActorCultures(g, 'agent.2')).toEqual([]);
  });
});

describe('getCultureMembers', () => {
  it('returns all actors belonging to a culture', () => {
    const g = buildGraph();
    const members = getCultureMembers(g, 'culture.1');
    expect(members.map(m => m.id).sort()).toEqual(['agent.1', 'agent.3']);
  });
});

describe('getAgentBonds', () => {
  it('returns outgoing bonds with sentiment and trust', () => {
    const g = buildGraph();
    const bonds = getAgentBonds(g, 'agent.1');
    expect(bonds).toHaveLength(1);
    expect(bonds[0].agent.id).toBe('agent.2');
    expect(bonds[0].sentiment).toBe(0.7);
    expect(bonds[0].trust).toBe(0.5);
  });
});

describe('getIncomingBonds', () => {
  it('returns incoming bonds', () => {
    const g = buildGraph();
    const bonds = getIncomingBonds(g, 'agent.1');
    expect(bonds).toHaveLength(1);
    expect(bonds[0].agent.id).toBe('agent.3');
    expect(bonds[0].sentiment).toBe(-0.3);
  });
});

// ─── Trait queries ────────────────────────────────────────────────

describe('getActorTraits', () => {
  it('returns traits with level', () => {
    const g = buildGraph();
    const traits = getActorTraits(g, 'agent.1');
    expect(traits).toHaveLength(1);
    expect(traits[0].trait.name).toBe('Brave');
    expect(traits[0].level).toBe(2);
  });

  it('returns empty for actor with no traits', () => {
    const g = buildGraph();
    expect(getActorTraits(g, 'agent.2')).toEqual([]);
  });
});

// ─── Ambition queries ─────────────────────────────────────────────

describe('getAgentAmbitions', () => {
  it('returns ambitions with priority and status', () => {
    const g = buildGraph();
    const ambitions = getAgentAmbitions(g, 'agent.1');
    expect(ambitions).toHaveLength(1);
    expect(ambitions[0].ambition.name).toBe('Become King');
    expect(ambitions[0].priority).toBe(1);
    expect(ambitions[0].status).toBe('active');
  });
});

// ─── Cosmology / Divine queries ───────────────────────────────────

describe('getAgentWorships', () => {
  it('returns the deity an agent worships', () => {
    const g = buildGraph();
    const deity = getAgentWorships(g, 'agent.1');
    expect(deity?.id).toBe('god.1');
  });

  it('returns undefined for non-worshipper', () => {
    const g = buildGraph();
    expect(getAgentWorships(g, 'agent.3')).toBeUndefined();
  });
});

describe('getWorshippers', () => {
  it('returns all worshippers of a deity', () => {
    const g = buildGraph();
    const w = getWorshippers(g, 'god.1');
    expect(w.map(n => n.id).sort()).toEqual(['agent.1', 'agent.2']);
  });
});

describe('getAvatarsOf', () => {
  it('returns avatars of an ascendant', () => {
    const g = buildGraph();
    const avatars = getAvatarsOf(g, 'ascendant.1');
    expect(avatars.map(a => a.id)).toEqual(['agent.3']);
  });

  it('returns empty for ascendant with no avatars', () => {
    const g = buildGraph();
    expect(getAvatarsOf(g, 'god.1')).toEqual([]);
  });
});

describe('getAvatarAscendant', () => {
  it('returns the ascendant for an avatar', () => {
    const g = buildGraph();
    const asc = getAvatarAscendant(g, 'agent.3');
    expect(asc?.id).toBe('ascendant.1');
  });

  it('returns undefined for non-avatar', () => {
    const g = buildGraph();
    expect(getAvatarAscendant(g, 'agent.1')).toBeUndefined();
  });
});

// ─── Possession queries ───────────────────────────────────────────

describe('getAgentArtifacts', () => {
  it('returns common artifacts', () => {
    const g = buildGraph();
    const arts = getAgentArtifacts(g, 'agent.1');
    expect(arts.map(a => a.id)).toEqual(['artifact.1']);
  });
});

describe('getAgentLegendaryArtifacts', () => {
  it('returns legendary artifacts', () => {
    const g = buildGraph();
    const arts = getAgentLegendaryArtifacts(g, 'agent.1');
    expect(arts.map(a => a.id)).toEqual(['artifact.2']);
  });
});

// ─── Infrastructure queries ───────────────────────────────────────

describe('getRoadsFrom / getRoadsTo / getAllRoads', () => {
  it('getRoadsFrom returns outgoing roads', () => {
    const g = buildGraph();
    expect(getRoadsFrom(g, 'loc.1')).toHaveLength(1);
    expect(getRoadsFrom(g, 'loc.2')).toHaveLength(0);
  });

  it('getRoadsTo returns incoming roads', () => {
    const g = buildGraph();
    expect(getRoadsTo(g, 'loc.2')).toHaveLength(1);
    expect(getRoadsTo(g, 'loc.1')).toHaveLength(0);
  });

  it('getAllRoads returns both directions', () => {
    const g = buildGraph();
    expect(getAllRoads(g, 'loc.1')).toHaveLength(1);
    expect(getAllRoads(g, 'loc.2')).toHaveLength(1);
  });
});

// ─── Adjacency queries ───────────────────────────────────────────

describe('getAdjacentLocationIds', () => {
  it('returns adjacent IDs bidirectionally', () => {
    const g = buildGraph();
    // loc.1 → loc.2 (outgoing)
    expect(getAdjacentLocationIds(g, 'loc.1')).toEqual(['loc.2']);
    // loc.2 ← loc.1 (incoming)
    expect(getAdjacentLocationIds(g, 'loc.2')).toEqual(['loc.1']);
  });

  it('deduplicates when both directions exist', () => {
    const g = buildGraph();
    g.addEdge({ id: 'e.adj_2_1', source: 'loc.2', target: 'loc.1', type: 'adjacent', properties: {} });
    const adj = getAdjacentLocationIds(g, 'loc.1');
    expect(adj).toEqual(['loc.2']); // not duplicated
  });
});

// ─── Economic queries ─────────────────────────────────────────────

describe('getTradeRoutes', () => {
  it('returns outgoing trade routes', () => {
    const g = buildGraph();
    const routes = getTradeRoutes(g, 'faction.1');
    expect(routes).toHaveLength(1);
    expect(routes[0].partner.id).toBe('agent.3');
  });

  it('returns incoming trade routes', () => {
    const g = buildGraph();
    const routes = getTradeRoutes(g, 'agent.3');
    expect(routes).toHaveLength(1);
    expect(routes[0].partner.id).toBe('faction.1');
  });
});

// ─── Action queries ───────────────────────────────────────────────

describe('getAgentCurrentAction', () => {
  it('returns the performing edge', () => {
    const g = buildGraph();
    const action = getAgentCurrentAction(g, 'agent.1');
    expect(action).toBeDefined();
    expect(action!.target).toBe('action.1');
  });

  it('returns undefined when not performing', () => {
    const g = buildGraph();
    expect(getAgentCurrentAction(g, 'agent.2')).toBeUndefined();
  });
});

// ─── Control queries ──────────────────────────────────────────────

describe('getControlledBy', () => {
  it('returns resources controlled by actor', () => {
    const g = buildGraph();
    const controlled = getControlledBy(g, 'faction.1');
    expect(controlled.map(c => c.id)).toEqual(['resource.1']);
  });
});

describe('getControllers', () => {
  it('returns actors that control a resource', () => {
    const g = buildGraph();
    const controllers = getControllers(g, 'resource.1');
    expect(controllers.map(c => c.id)).toEqual(['faction.1']);
  });

  it('returns empty for uncontrolled resource', () => {
    const g = buildGraph();
    g.addNode({ id: 'resource.2', type: 'resource', name: 'Empty Mine', properties: {} });
    expect(getControllers(g, 'resource.2')).toEqual([]);
  });
});

// ─── Null safety ──────────────────────────────────────────────────

describe('null safety', () => {
  it('handles non-existent node IDs gracefully', () => {
    const g = buildGraph();
    expect(getAgentLocation(g, 'nonexistent')).toBeUndefined();
    expect(getAgentLocationId(g, 'nonexistent')).toBeUndefined();
    expect(getAgentsAtLocation(g, 'nonexistent')).toEqual([]);
    expect(getAgentBonds(g, 'nonexistent')).toEqual([]);
    expect(getAgentWorships(g, 'nonexistent')).toBeUndefined();
    expect(getActorTraits(g, 'nonexistent')).toEqual([]);
    expect(getAgentAmbitions(g, 'nonexistent')).toEqual([]);
    expect(getAgentFaction(g, 'nonexistent')).toBeUndefined();
  });
});
