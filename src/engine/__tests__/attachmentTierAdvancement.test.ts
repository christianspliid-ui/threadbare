import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  advanceAttachmentTier,
  canAdvanceTier,
  type TierAdvancementResult,
} from '../attachmentTierAdvancement';
import {
  TIER_MODIFIER_SCALE_FACTOR,
  MAX_ATTACHMENT_TIER,
} from '../../data/attachment-tier-content';
import { ATTACHMENT_TIER_NAMES } from '../../types/attachments';

// ─── Test Helpers ────────────────────────────────────────────────

function makeGraphWithArtifact(
  artifactId: string,
  tier: number,
  ownerId?: string,
  modifiers?: Record<string, number>,
): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: artifactId,
    type: 'artifact',
    name: 'Test Sword',
    properties: {
      tier,
      subcategory: 'arms',
      tags: ['#weapon', '#iron'],
      mechanicalSummary: '+Iron',
      lossCondition: 'breakable',
    },
  });

  if (ownerId) {
    graph.addNode({
      id: ownerId,
      type: 'actor',
      name: 'Test Agent',
      properties: { actorType: 'individual' },
    });

    graph.addEdge({
      id: `edge_possesses_${artifactId}`,
      source: ownerId,
      target: artifactId,
      type: 'possesses',
      properties: {
        modifiers: modifiers ?? { iron: 0.10 },
        grants: ['melee_attack'],
        tags: ['#weapon'],
      },
    });
  }

  return graph;
}

// ─── advanceAttachmentTier ───────────────────────────────────────

describe('advanceAttachmentTier', () => {
  it('advances tier 1 → 2 (Mundane → Storied)', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', { iron: 0.10 });

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    expect(result.oldTier).toBe(1);
    expect(result.newTier).toBe(2);
    expect(result.oldTierName).toBe('Mundane');
    expect(result.newTierName).toBe('Storied');

    // Verify node was updated
    const node = graph.getNode('sword1');
    expect(node?.properties.tier).toBe(2);
  });

  it('advances tier 2 → 3 (Storied → Mythic)', () => {
    const graph = makeGraphWithArtifact('sword1', 2, 'agent1', { iron: 0.10 });

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    expect(result.oldTier).toBe(2);
    expect(result.newTier).toBe(3);
    expect(result.newTierName).toBe('Mythic');
  });

  it('advances tier 3 → 4 (Mythic → Legendary)', () => {
    const graph = makeGraphWithArtifact('sword1', 3, 'agent1', { iron: 0.10 });

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    expect(result.oldTier).toBe(3);
    expect(result.newTier).toBe(4);
    expect(result.newTierName).toBe('Legendary');
  });

  it('refuses to advance beyond tier 4 (max)', () => {
    const graph = makeGraphWithArtifact('sword1', 4, 'agent1');

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(false);
    expect(result.reason).toBe('already_max_tier');
    expect(result.oldTier).toBe(4);
    expect(result.newTier).toBeUndefined();

    // Node unchanged
    const node = graph.getNode('sword1');
    expect(node?.properties.tier).toBe(4);
  });

  it('returns artifact_not_found for missing node (fail-soft)', () => {
    const graph = new WorldGraph();

    const result = advanceAttachmentTier(graph, 'nonexistent');

    expect(result.advanced).toBe(false);
    expect(result.reason).toBe('artifact_not_found');
  });

  it('defaults to tier 1 when tier property is missing', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'no_tier',
      type: 'artifact',
      name: 'Unmarked Blade',
      properties: { subcategory: 'arms' },
    });

    const result = advanceAttachmentTier(graph, 'no_tier');

    expect(result.advanced).toBe(true);
    expect(result.oldTier).toBe(1);
    expect(result.newTier).toBe(2);
  });

  // ─── Modifier Scaling ──────────────────────────────────────

  it('scales modifiers on possesses edge by TIER_MODIFIER_SCALE_FACTOR', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', {
      iron: 0.10,
      movement_range: 1,
    });

    advanceAttachmentTier(graph, 'sword1');

    const edge = graph.getEdge('edge_possesses_sword1');
    const mods = edge?.properties.modifiers as Record<string, number>;

    expect(mods.iron).toBeCloseTo(0.10 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(mods.movement_range).toBeCloseTo(1 * TIER_MODIFIER_SCALE_FACTOR, 3);
  });

  it('scales modifiers on bonded_to edge', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'relic1',
      type: 'artifact_legendary',
      name: 'Bonded Relic',
      properties: { tier: 2 },
    });
    graph.addNode({
      id: 'agent1',
      type: 'actor',
      name: 'Hero',
      properties: {},
    });
    graph.addEdge({
      id: 'edge_bonded',
      source: 'agent1',
      target: 'relic1',
      type: 'bonded_to',
      properties: { modifiers: { star: 0.20 } },
    });

    advanceAttachmentTier(graph, 'relic1');

    const edge = graph.getEdge('edge_bonded');
    const mods = edge?.properties.modifiers as Record<string, number>;
    expect(mods.star).toBeCloseTo(0.20 * TIER_MODIFIER_SCALE_FACTOR, 3);
  });

  it('skips modifier scaling when no possesses/bonded_to edge exists', () => {
    const graph = makeGraphWithArtifact('sword1', 1); // no owner

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    expect(result.scaledModifiers).toEqual([]);
  });

  it('skips non-numeric modifier values gracefully', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'art1',
      type: 'artifact',
      name: 'Mixed Mods',
      properties: { tier: 1 },
    });
    graph.addNode({
      id: 'owner1',
      type: 'actor',
      name: 'Owner',
      properties: {},
    });
    graph.addEdge({
      id: 'edge_possesses_art1',
      source: 'owner1',
      target: 'art1',
      type: 'possesses',
      properties: {
        modifiers: { iron: 0.10, label: 'sharp' as unknown as number },
      },
    });

    const result = advanceAttachmentTier(graph, 'art1');

    expect(result.advanced).toBe(true);
    const edge = graph.getEdge('edge_possesses_art1');
    const mods = edge?.properties.modifiers as Record<string, unknown>;
    expect(mods.iron).toBeCloseTo(0.10 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(mods.label).toBe('sharp'); // preserved, not scaled
  });

  it('reports scaled modifier keys in result', () => {
    const graph = makeGraphWithArtifact('sword1', 2, 'agent1', {
      iron: 0.10,
      gold: 0.05,
    });

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.scaledModifiers).toContain('iron');
    expect(result.scaledModifiers).toContain('gold');
  });

  it('scales modifiers on each tier advancement independently', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', { iron: 0.10 });

    // First advancement: 1→2
    advanceAttachmentTier(graph, 'sword1');
    let edge = graph.getEdge('edge_possesses_sword1');
    const tier2Value = (edge?.properties.modifiers as Record<string, number>).iron;
    expect(tier2Value).toBeCloseTo(0.10 * TIER_MODIFIER_SCALE_FACTOR, 3);

    // Second advancement: 2→3
    advanceAttachmentTier(graph, 'sword1');
    edge = graph.getEdge('edge_possesses_sword1');
    const tier3Value = (edge?.properties.modifiers as Record<string, number>).iron;
    expect(tier3Value).toBeCloseTo(0.10 * TIER_MODIFIER_SCALE_FACTOR ** 2, 2);

    // Third advancement: 3→4
    advanceAttachmentTier(graph, 'sword1');
    edge = graph.getEdge('edge_possesses_sword1');
    const tier4Value = (edge?.properties.modifiers as Record<string, number>).iron;
    expect(tier4Value).toBeCloseTo(0.10 * TIER_MODIFIER_SCALE_FACTOR ** 3, 2);
  });

  // ─── Tier Name Mapping ─────────────────────────────────────

  it('maps all four tier names correctly', () => {
    for (const [tier, name] of Object.entries(ATTACHMENT_TIER_NAMES)) {
      const graph = makeGraphWithArtifact('art', Number(tier));
      const result = advanceAttachmentTier(graph, 'art');
      if (Number(tier) < MAX_ATTACHMENT_TIER) {
        expect(result.oldTierName).toBe(name);
      }
    }
  });
});

// ─── canAdvanceTier ──────────────────────────────────────────────

describe('canAdvanceTier', () => {
  it('returns true for tier 1 artifact', () => {
    const graph = makeGraphWithArtifact('art1', 1);
    expect(canAdvanceTier(graph, 'art1')).toBe(true);
  });

  it('returns true for tier 2 artifact', () => {
    const graph = makeGraphWithArtifact('art1', 2);
    expect(canAdvanceTier(graph, 'art1')).toBe(true);
  });

  it('returns true for tier 3 artifact', () => {
    const graph = makeGraphWithArtifact('art1', 3);
    expect(canAdvanceTier(graph, 'art1')).toBe(true);
  });

  it('returns false for tier 4 artifact (max)', () => {
    const graph = makeGraphWithArtifact('art1', 4);
    expect(canAdvanceTier(graph, 'art1')).toBe(false);
  });

  it('returns false for nonexistent node', () => {
    const graph = new WorldGraph();
    expect(canAdvanceTier(graph, 'nonexistent')).toBe(false);
  });

  it('defaults missing tier to 1 (advanceable)', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'no_tier',
      type: 'artifact',
      name: 'Unmarked',
      properties: {},
    });
    expect(canAdvanceTier(graph, 'no_tier')).toBe(true);
  });
});
