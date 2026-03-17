import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  buildActorTargetContext,
  buildLocationTargetContext,
  buildSublocationTargetContext,
  buildHexTargetContext,
  buildArtifactTargetContext,
  buildLegendaryArtifactTargetContext,
} from '../targetContextBuilders';

describe('buildActorTargetContext', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'actor.alice',
      type: 'actor',
      name: 'Alice',
      properties: { actorType: 'individual', sphereAffinity: 'mind' },
    });
    graph.addNode({ id: 'trait.brave', type: 'trait', name: 'Brave', properties: {} });
    graph.addEdge({
      id: 'e1',
      source: 'actor.alice',
      target: 'trait.brave',
      type: 'has_trait',
      properties: {},
    });
  });

  it('returns null when node not found', () => {
    expect(buildActorTargetContext('nonexistent', graph)).toBeNull();
  });

  it('builds correct context with traits', () => {
    const ctx = buildActorTargetContext('actor.alice', graph, 2);
    expect(ctx).not.toBeNull();
    expect(ctx!.nodeId).toBe('actor.alice');
    expect(ctx!.nodeType).toBe('actor');
    expect(ctx!.displayName).toBe('Alice');
    expect(ctx!.subtype).toBe('individual');
    expect(ctx!.sphereAffinity).toBe('mind');
    expect(ctx!.influenceTier).toBe(2);
    expect(ctx!.traitIds).toContain('trait.brave');
  });

  it('handles missing actorType gracefully', () => {
    graph.addNode({ id: 'actor.bob', type: 'actor', name: 'Bob', properties: {} });
    const ctx = buildActorTargetContext('actor.bob', graph);
    expect(ctx!.subtype).toBeNull();
  });
});

describe('buildLocationTargetContext', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'loc.keep',
      type: 'location',
      name: 'Iron Keep',
      properties: { locationSubtype: 'keep', sphereAffinity: 'force' },
    });
    graph.addNode({ id: 'trait.ancient', type: 'trait', name: 'Ancient', properties: {} });
    graph.addEdge({
      id: 'e2',
      source: 'loc.keep',
      target: 'trait.ancient',
      type: 'has_trait',
      properties: {},
    });
  });

  it('returns null when node not found', () => {
    expect(buildLocationTargetContext('nonexistent', graph)).toBeNull();
  });

  it('builds correct context with subtype from locationSubtype', () => {
    const ctx = buildLocationTargetContext('loc.keep', graph);
    expect(ctx!.nodeType).toBe('location');
    expect(ctx!.displayName).toBe('Iron Keep');
    expect(ctx!.subtype).toBe('keep');
    expect(ctx!.displayLabel).toBe('keep');
    expect(ctx!.sphereAffinity).toBe('force');
    expect(ctx!.traitIds).toContain('trait.ancient');
  });

  it('falls back to locationType when locationSubtype is absent', () => {
    graph.addNode({
      id: 'loc.wild',
      type: 'location',
      name: 'Wild Region',
      properties: { locationType: 'wilderness' },
    });
    const ctx = buildLocationTargetContext('loc.wild', graph);
    expect(ctx!.subtype).toBe('wilderness');
  });

  it('returns null subtype when neither property present', () => {
    graph.addNode({ id: 'loc.empty', type: 'location', name: 'Empty', properties: {} });
    const ctx = buildLocationTargetContext('loc.empty', graph);
    expect(ctx!.subtype).toBeNull();
  });
});

describe('buildSublocationTargetContext', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'sub.shrine',
      type: 'location',
      name: 'Ancient Shrine',
      properties: { sublocationCategory: 'shrine' },
    });
  });

  it('returns null when node not found', () => {
    expect(buildSublocationTargetContext('nonexistent', graph)).toBeNull();
  });

  it('uses sublocationCategory as subtype', () => {
    const ctx = buildSublocationTargetContext('sub.shrine', graph);
    expect(ctx!.subtype).toBe('shrine');
    expect(ctx!.displayLabel).toBe('shrine');
  });
});

describe('buildHexTargetContext', () => {
  it('builds correct hex context', () => {
    const ctx = buildHexTargetContext({ col: 3, row: 5, terrain: 'forest' });
    expect(ctx.nodeType).toBe('location');
    expect(ctx.subtype).toBe('forest');
    expect(ctx.displayLabel).toBe('forest');
    expect(ctx.position).toEqual({ col: 3, row: 5 });
    expect(ctx.traitIds).toHaveLength(0);
  });

  it('uses provided nodeId if given', () => {
    const ctx = buildHexTargetContext({ col: 0, row: 0, terrain: 'plains', nodeId: 'hex_custom' });
    expect(ctx.nodeId).toBe('hex_custom');
  });

  it('generates nodeId from coords if not provided', () => {
    const ctx = buildHexTargetContext({ col: 2, row: 4, terrain: 'desert' });
    expect(ctx.nodeId).toBe('hex_2_4');
  });
});

describe('buildArtifactTargetContext', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'artifact.sword',
      type: 'artifact',
      name: 'Iron Sword',
      properties: { tier: 2, subcategory: 'weapon', sphereAffinity: 'force' },
    });
  });

  it('returns null when node not found', () => {
    expect(buildArtifactTargetContext('nonexistent', graph)).toBeNull();
  });

  it('builds correct artifact context', () => {
    const ctx = buildArtifactTargetContext('artifact.sword', graph);
    expect(ctx!.nodeType).toBe('artifact');
    expect(ctx!.subtype).toBe('weapon');
    expect(ctx!.displayLabel).toBe('Tier 2');
    expect(ctx!.sphereAffinity).toBe('force');
  });
});

describe('buildLegendaryArtifactTargetContext', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'artifact_legendary.crown',
      type: 'artifact_legendary',
      name: 'Crown of Eternity',
      properties: { subcategory: 'regalia' },
    });
  });

  it('builds correct legendary artifact context', () => {
    const ctx = buildLegendaryArtifactTargetContext('artifact_legendary.crown', graph);
    expect(ctx!.nodeType).toBe('artifact_legendary');
    expect(ctx!.displayLabel).toBe('Legendary');
    expect(ctx!.subtype).toBe('regalia');
  });
});
