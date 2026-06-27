import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateArchetypes,
  createAscendant,
  getAscendantDomainAffinities,
} from '../ascendant';
import type { AscendantArchetype, AscendantCreationConfig, AscendantProperties } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

describe('Ascendant Archetype Generation', () => {
  it('generates the requested number of archetypes', () => {
    const archetypes = generateArchetypes(4, 42);
    expect(archetypes).toHaveLength(4);
  });

  it('each archetype has valid sphere alignment', () => {
    const archetypes = generateArchetypes(4, 42);
    for (const a of archetypes) {
      expect(SPHERE_NAMES).toContain(a.sphereAlignment.primary);
      expect(SPHERE_NAMES).toContain(a.sphereAlignment.secondary);
      expect(a.sphereAlignment.primary).not.toBe(a.sphereAlignment.secondary);
    }
  });

  it('each archetype has a personality seed with all 9 value pairs', () => {
    const archetypes = generateArchetypes(4, 42);
    for (const a of archetypes) {
      const keys = Object.keys(a.personalitySeed);
      expect(keys).toHaveLength(9);
      for (const val of Object.values(a.personalitySeed)) {
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('deterministic with same seed', () => {
    const a1 = generateArchetypes(4, 42);
    const a2 = generateArchetypes(4, 42);
    expect(a1).toEqual(a2);
  });

  it('different with different seed', () => {
    const a1 = generateArchetypes(4, 42);
    const a2 = generateArchetypes(4, 99);
    expect(a1).not.toEqual(a2);
  });
});

describe('Ascendant Creation', () => {
  let graph: WorldGraph;
  let archetype: AscendantArchetype;

  beforeEach(() => {
    graph = new WorldGraph();

    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });

    archetype = generateArchetypes(1, 42)[0];
  });

  it('creates ascendant and avatar nodes in the graph', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard with a gnarled staff',
      },
    };

    const result = createAscendant(graph, config);

    const ascNode = graph.getNode(result.ascendantId);
    expect(ascNode).toBeDefined();
    expect(ascNode!.type).toBe('actor');
    expect((ascNode!.properties as AscendantProperties).actorType).toBe('ascendant');

    const avatarNode = graph.getNode(result.avatarId);
    expect(avatarNode).toBeDefined();
    expect(avatarNode!.type).toBe('actor');
    expect(avatarNode!.properties.actorType).toBe('individual');
  });

  it('wires avatar_of edge between avatar and ascendant', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);

    const avatarEdges = graph.getOutgoingEdges(result.avatarId, 'avatar_of');
    expect(avatarEdges).toHaveLength(1);
    expect(avatarEdges[0].target).toBe(result.ascendantId);
  });

  it('places avatar at starting location', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);

    const locEdges = graph.getOutgoingEdges(result.avatarId, 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe('loc.start');
  });

  it('ascendant has empty essence pool and correct sphere alignment', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);
    const ascNode = graph.getNode(result.ascendantId)!;
    const props = ascNode.properties as AscendantProperties;

    expect(props.sphereAlignment).toEqual(archetype.sphereAlignment);
    expect(props.essencePool).toBeDefined();

    for (const sphere of SPHERE_NAMES) {
      expect(props.essencePool[sphere]).toBe(50);
    }
  });

  it('ascendant has empty intervention history', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);
    const ascNode = graph.getNode(result.ascendantId)!;
    const props = ascNode.properties as AscendantProperties;

    expect(props.interventionHistory).toEqual({});
  });

  it('persists the archetype reach affinities on the node (THR-503)', () => {
    const config: AscendantCreationConfig = {
      archetype,
      avatar: {
        name: 'The Wandering Sage',
        startLocationId: 'loc.start',
        formDescription: 'An old wizard',
      },
    };

    const result = createAscendant(graph, config);

    // Assert through the public reader (avoids a raw properties cast).
    expect(getAscendantDomainAffinities(graph, result.ascendantId)).toEqual(
      archetype.startingDomainAffinities,
    );
  });

  it('getAscendantDomainAffinities returns undefined for a missing node (fail-soft)', () => {
    expect(getAscendantDomainAffinities(graph, 'asc.does-not-exist')).toBeUndefined();
  });
});
