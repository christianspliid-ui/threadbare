import { describe, it, expect } from 'vitest';
import { isEncounterVisibleToAgent } from '../questVisibility';
import { WorldGraph } from '../graph';

describe('questVisibility', () => {
  function makeGraph(): WorldGraph {
    const g = new WorldGraph();
    // Agent with faction and culture
    g.addNode({ id: 'agent1', type: 'actor', name: 'Warrior', properties: {
      actorType: 'individual',
      narrativeArchetype: 'warlord',
    }});
    g.addNode({ id: 'faction_iron', type: 'faction', name: 'Iron Pact', properties: {} });
    g.addNode({ id: 'culture_sun', type: 'culture', name: 'Sun Children', properties: {} });
    g.addEdge({ id: 'e1', source: 'agent1', target: 'faction_iron', type: 'member_of', properties: {} });
    g.addEdge({ id: 'e2', source: 'agent1', target: 'culture_sun', type: 'belongs_to', properties: { culturalStrength: 0.8 } });
    return g;
  }

  it('returns true when visibleTo is undefined (all)', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', undefined)).toBe(true);
  });

  it('returns true when visibleTo includes "all"', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['all'])).toBe(true);
  });

  it('returns true when agent matches faction filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:faction_iron'])).toBe(true);
  });

  it('returns false when agent does not match faction filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:other_faction'])).toBe(false);
  });

  it('returns true when agent matches direct agent filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['agent:agent1'])).toBe(true);
  });

  it('returns true when agent matches archetype filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['archetype:warlord'])).toBe(true);
  });

  it('returns true when agent matches culture filter', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['culture:culture_sun'])).toBe(true);
  });

  it('returns true if any filter matches (OR logic)', () => {
    const g = makeGraph();
    expect(isEncounterVisibleToAgent(g, 'agent1', ['faction:other', 'agent:agent1'])).toBe(true);
  });
});
