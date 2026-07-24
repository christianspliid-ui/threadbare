/**
 * Company query contract tests — THR-74.
 *
 * These lock the two decisions most likely to be broken by a well-meaning future
 * change: companies are distinguishable from armies (both are `actorType: 'group'`),
 * and a company's position is *derived* from its leader rather than stored.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  isCompanyNode,
  getAllGroups,
  getActiveGroups,
  getGroupMembers,
  getGroupOf,
  isGrouped,
  getGroupLeader,
  getGroupPosition,
  getGroupCohesion,
  getCohesionState,
  isGroupBlessed,
  isGroupEligibleAgent,
} from '../groupQueries';
import { getAgentFaction, getAgentMemberships } from '../../graphQueries';
import {
  GROUP_COHESION_START_BASE,
  GROUP_COHESION_BOUND_THRESHOLD,
  GROUP_FRAY_THRESHOLD,
  GROUP_DISSOLUTION_THRESHOLD,
} from '../../../data/group-constants';

function buildGraph(): WorldGraph {
  const g = new WorldGraph();

  g.addNode({ id: 'loc.1', type: 'location', name: 'Ashford', properties: { locationType: 'settlement' } });
  g.addNode({ id: 'loc.2', type: 'location', name: 'The Crooked Tap', properties: { locationType: 'sublocation', sublocationType: 'tavern', parentLocationId: 'loc.1' } });

  g.addNode({ id: 'agent.1', type: 'actor', name: 'Kael', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
  g.addNode({ id: 'agent.2', type: 'actor', name: 'Lyra', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
  g.addNode({ id: 'agent.3', type: 'actor', name: 'Vorn', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
  g.addNode({ id: 'faction.1', type: 'actor', name: 'Iron Guard', properties: { actorType: 'faction' } });

  // An army — same actorType as a company, discriminated by `armyState`.
  g.addNode({
    id: 'army.1',
    type: 'actor',
    name: 'Iron Guard — Host',
    properties: { actorType: 'group', armyState: { size: 'host', cohesion: 5 } },
  });
  g.addEdge({ id: 'e.army_fac', source: 'army.1', target: 'faction.1', type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });

  // A company.
  g.addNode({
    id: 'group.1',
    type: 'actor',
    name: 'The Quiet Wardens',
    properties: {
      actorType: 'group',
      groupType: 'party',
      cohesion: 0.6,
      groupStatus: 'active',
      formedAtTick: 4,
      formationContext: { cause: 'systemic', locationId: 'loc.2' },
    },
  });
  g.addEdge({ id: 'e.cmd', source: 'group.1', target: 'agent.1', type: 'commanded_by', properties: {} });
  g.addEdge({ id: 'e.m1', source: 'agent.1', target: 'group.1', type: 'member_of', properties: { role: 'leader', rank: 0, joinedTick: 4 } });
  g.addEdge({ id: 'e.m2', source: 'agent.2', target: 'group.1', type: 'member_of', properties: { role: 'member', rank: 0, joinedTick: 4 } });
  // A former member — edge persists as history.
  g.addEdge({ id: 'e.m3', source: 'agent.3', target: 'group.1', type: 'member_of', properties: { role: 'member', rank: 0, joinedTick: 4, leftAtTick: 9 } });

  // Agent.1 also belongs to a faction — the collision the sweep guards against.
  g.addEdge({ id: 'e.a1_fac', source: 'agent.1', target: 'faction.1', type: 'member_of', properties: { role: 'captain', rank: 3, joinedTick: 1, factionDefId: 'iron_guard' } });

  g.addEdge({ id: 'e.a1_loc', source: 'agent.1', target: 'loc.2', type: 'located_at', properties: {} });
  g.addEdge({ id: 'e.a2_loc', source: 'agent.2', target: 'loc.2', type: 'located_at', properties: {} });

  return g;
}

describe('isCompanyNode — armies and companies share actorType', () => {
  it('accepts a company', () => {
    expect(isCompanyNode(buildGraph().getNode('group.1'))).toBe(true);
  });

  it('rejects an army even though it is actorType "group"', () => {
    const g = buildGraph();
    expect(g.getNode('army.1')!.properties.actorType).toBe('group');
    expect(isCompanyNode(g.getNode('army.1'))).toBe(false);
  });

  it('rejects factions, individuals, and missing nodes', () => {
    const g = buildGraph();
    expect(isCompanyNode(g.getNode('faction.1'))).toBe(false);
    expect(isCompanyNode(g.getNode('agent.1'))).toBe(false);
    expect(isCompanyNode(undefined)).toBe(false);
  });

  it('getAllGroups never returns armies', () => {
    const ids = getAllGroups(buildGraph()).map(n => n.id);
    expect(ids).toEqual(['group.1']);
  });
});

describe('membership', () => {
  it('excludes members whose edge carries leftAtTick', () => {
    const members = getGroupMembers(buildGraph(), 'group.1').map(m => m.id);
    expect(members).toEqual(['agent.1', 'agent.2']);
  });

  it('getGroupOf finds the company among an agent\'s other memberships', () => {
    const g = buildGraph();
    expect(getGroupOf(g, 'agent.1')?.id).toBe('group.1');
    expect(isGrouped(g, 'agent.1')).toBe(true);
  });

  it('a departed member is no longer grouped', () => {
    expect(isGrouped(buildGraph(), 'agent.3')).toBe(false);
  });

  it('a disbanded company does not count as current membership', () => {
    const g = buildGraph();
    g.updateNode('group.1', { properties: { ...g.getNode('group.1')!.properties, groupStatus: 'disbanded' } });
    expect(getGroupOf(g, 'agent.1')).toBeUndefined();
    expect(getActiveGroups(g)).toHaveLength(0);
    expect(getAllGroups(g)).toHaveLength(1); // node persists as history
  });
});

describe('faction lookups are not confused by company membership (THR-74 sweep)', () => {
  it('getAgentFaction returns the faction, not the company', () => {
    const result = getAgentFaction(buildGraph(), 'agent.1');
    expect(result?.faction.id).toBe('faction.1');
  });

  it('getAgentMemberships omits the company', () => {
    const groups = getAgentMemberships(buildGraph(), 'agent.1').map(m => m.group.id);
    expect(groups).toEqual(['faction.1']);
  });

  it('an agent whose only membership is a company reads as faction-less', () => {
    expect(getAgentFaction(buildGraph(), 'agent.2')).toBeUndefined();
  });
});

describe('position is derived from the leader, never stored', () => {
  it('the company node carries no located_at edge', () => {
    expect(buildGraph().getOutgoingEdges('group.1', 'located_at')).toHaveLength(0);
  });

  it('resolves to the leader position', () => {
    expect(getGroupPosition(buildGraph(), 'group.1')).toBe('loc.2');
  });

  it('falls back to a member when the leader has no position', () => {
    const g = buildGraph();
    g.removeEdge('e.a1_loc');
    expect(getGroupPosition(g, 'group.1')).toBe('loc.2'); // agent.2 still there
  });

  it('returns undefined when nobody has a position', () => {
    const g = buildGraph();
    g.removeEdge('e.a1_loc');
    g.removeEdge('e.a2_loc');
    expect(getGroupPosition(g, 'group.1')).toBeUndefined();
  });

  it('finds the leader via commanded_by', () => {
    expect(getGroupLeader(buildGraph(), 'group.1')?.id).toBe('agent.1');
  });
});

describe('cohesion', () => {
  it('reads the stored value', () => {
    expect(getGroupCohesion(buildGraph().getNode('group.1'))).toBe(0.6);
  });

  it('falls back to the base rather than propagating NaN', () => {
    const g = buildGraph();
    g.updateNode('group.1', { properties: { ...g.getNode('group.1')!.properties, cohesion: NaN } });
    expect(getGroupCohesion(g.getNode('group.1'))).toBe(GROUP_COHESION_START_BASE);
    g.updateNode('group.1', { properties: { ...g.getNode('group.1')!.properties, cohesion: undefined } });
    expect(getGroupCohesion(g.getNode('group.1'))).toBe(GROUP_COHESION_START_BASE);
  });

  it('maps onto the prose ladder at each threshold', () => {
    expect(getCohesionState(GROUP_COHESION_BOUND_THRESHOLD)).toBe('bound');
    expect(getCohesionState(1)).toBe('bound');
    expect(getCohesionState(GROUP_FRAY_THRESHOLD)).toBe('holding');
    expect(getCohesionState(GROUP_FRAY_THRESHOLD - 0.01)).toBe('frayed');
    expect(getCohesionState(GROUP_DISSOLUTION_THRESHOLD)).toBe('frayed');
    expect(getCohesionState(GROUP_DISSOLUTION_THRESHOLD - 0.01)).toBe('breaking');
    expect(getCohesionState(0)).toBe('breaking');
  });

  it('blessing is a window, not a flag', () => {
    const g = buildGraph();
    g.updateNode('group.1', { properties: { ...g.getNode('group.1')!.properties, blessedUntilTick: 20 } });
    const node = g.getNode('group.1');
    expect(isGroupBlessed(node, 19)).toBe(true);
    expect(isGroupBlessed(node, 20)).toBe(false);
    expect(isGroupBlessed(buildGraph().getNode('group.1'), 5)).toBe(false);
  });
});

describe('formation eligibility', () => {
  it('excludes agents already in a company', () => {
    const g = buildGraph();
    expect(isGroupEligibleAgent(g, g.getNode('agent.1')!)).toBe(false);
  });

  it('admits an unattached spotlight individual', () => {
    const g = buildGraph();
    expect(isGroupEligibleAgent(g, g.getNode('agent.3')!)).toBe(true);
  });

  it('excludes non-spotlight tiers, factions, and the dead', () => {
    const g = buildGraph();
    expect(isGroupEligibleAgent(g, g.getNode('faction.1')!)).toBe(false);

    g.updateNode('agent.3', { properties: { ...g.getNode('agent.3')!.properties, spotlightTier: 'ambient' } });
    expect(isGroupEligibleAgent(g, g.getNode('agent.3')!)).toBe(false);

    g.updateNode('agent.3', { properties: { ...g.getNode('agent.3')!.properties, spotlightTier: 'spotlight', deceased: true } });
    expect(isGroupEligibleAgent(g, g.getNode('agent.3')!)).toBe(false);
  });
});
