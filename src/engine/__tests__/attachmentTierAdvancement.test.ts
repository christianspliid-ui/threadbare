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
import { ITEM_STAT_BAND_LEGENDARY } from '../../data/item-stat-bands';
import { ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import type { AttachmentEffect } from '../../types/effects';

// ─── Test Helpers ────────────────────────────────────────────────

/** Read back the `stat_contribution` bag on an artifact node. */
function contributionsOf(graph: WorldGraph, artifactId: string): Record<string, number> {
  const effects = graph.getNode(artifactId)?.properties.effects as AttachmentEffect[] | undefined;
  const entry = effects?.find((e) => e?.type === 'stat_contribution');
  return (entry && 'contributions' in entry
    ? entry.contributions
    : {}) as Record<string, number>;
}

function makeGraphWithArtifact(
  artifactId: string,
  tier: number,
  ownerId?: string,
  modifiers?: Record<string, number>,
  effects?: AttachmentEffect[],
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
      ...(effects ? { effects } : {}),
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

  // ─── Stat-contribution scaling (THR-723 — the live substrate) ──

  it('scales stat_contribution effects on the artifact node', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', undefined, [
      { type: 'stat_contribution', contributions: { iron: 0.4, stone: 0.2 } },
    ]);

    const result = advanceAttachmentTier(graph, 'sword1');

    const contributions = contributionsOf(graph, 'sword1');
    expect(contributions.iron).toBeCloseTo(0.4 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(contributions.stone).toBeCloseTo(0.2 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(result.scaledContributions).toEqual(expect.arrayContaining(['iron', 'stone']));
  });

  it('scales stat_contribution on a bonded_to artifact', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'relic1',
      type: 'artifact_legendary',
      name: 'Bonded Relic',
      properties: {
        tier: 2,
        effects: [{ type: 'stat_contribution', contributions: { star: 0.2 } }],
      },
    });
    graph.addNode({ id: 'agent1', type: 'actor', name: 'Hero', properties: {} });
    graph.addEdge({
      id: 'edge_bonded',
      source: 'agent1',
      target: 'relic1',
      type: 'bonded_to',
      properties: { modifiers: {} },
    });

    advanceAttachmentTier(graph, 'relic1');

    expect(contributionsOf(graph, 'relic1').star)
      .toBeCloseTo(0.2 * TIER_MODIFIER_SCALE_FACTOR, 3);
  });

  it('compounds across tiers but never exceeds the legendary power band', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', undefined, [
      { type: 'stat_contribution', contributions: { iron: 1.0 } },
    ]);

    advanceAttachmentTier(graph, 'sword1'); // 1→2
    expect(contributionsOf(graph, 'sword1').iron).toBeCloseTo(1.5, 3);

    advanceAttachmentTier(graph, 'sword1'); // 2→3 — 2.25 raw, clamped
    expect(contributionsOf(graph, 'sword1').iron).toBe(ITEM_STAT_BAND_LEGENDARY);

    advanceAttachmentTier(graph, 'sword1'); // 3→4 — still pinned at the ceiling
    expect(contributionsOf(graph, 'sword1').iron).toBe(ITEM_STAT_BAND_LEGENDARY);
  });

  it('advances tier without effects, reporting no scaled contributions', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1');

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    expect(result.scaledContributions).toEqual([]);
    expect(graph.getNode('sword1')?.properties.effects).toBeUndefined();
  });

  it('preserves a non-numeric contribution value instead of throwing', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', undefined, [
      {
        type: 'stat_contribution',
        contributions: { iron: 0.4, star: 'lots' as unknown as number },
      },
    ]);

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    const contributions = contributionsOf(graph, 'sword1');
    expect(contributions.iron).toBeCloseTo(0.4 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(contributions.star).toBe('lots');
    expect(result.scaledContributions).not.toContain('star');
  });

  it('leaves non-stat_contribution effects untouched', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', undefined, [
      { type: 'passive', reach: 'iron', value: 0.12 } as AttachmentEffect,
      { type: 'stat_contribution', contributions: { iron: 0.4 } },
    ]);

    advanceAttachmentTier(graph, 'sword1');

    const effects = graph.getNode('sword1')?.properties.effects as AttachmentEffect[];
    expect(effects[0]).toEqual({ type: 'passive', reach: 'iron', value: 0.12 });
  });

  // ─── Edge-modifier scaling (the surviving live seam) ───────────

  it('scales non-Reach attribute modifiers on the possesses edge', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', {
      los_range: 1,
      movement_range: 2,
    });

    const result = advanceAttachmentTier(graph, 'sword1');

    const mods = graph.getEdge('edge_possesses_sword1')
      ?.properties.modifiers as Record<string, number>;
    expect(mods.los_range).toBeCloseTo(1 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(mods.movement_range).toBeCloseTo(2 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(result.scaledModifiers).toEqual(
      expect.arrayContaining(['los_range', 'movement_range']),
    );
  });

  // THR-723: `modifiers.ts` has one production reader (visibility.ts) and it only
  // ever asks for `los_range`, so a scaled `{iron: …}` strengthened nothing. This
  // test fails against the pre-fix build, which scaled every numeric key.
  it('leaves Reach-domain modifier keys unscaled — that path is dead', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', {
      iron: 0.10,
      star: 0.20,
      los_range: 1,
    });

    const result = advanceAttachmentTier(graph, 'sword1');

    const mods = graph.getEdge('edge_possesses_sword1')
      ?.properties.modifiers as Record<string, number>;
    expect(mods.iron).toBe(0.10);
    expect(mods.star).toBe(0.20);
    expect(mods.los_range).toBeCloseTo(1 * TIER_MODIFIER_SCALE_FACTOR, 3);

    expect(result.scaledModifiers).not.toContain('iron');
    expect(result.scaledModifiers).not.toContain('star');
    expect(result.scaledModifiers).toContain('los_range');
  });

  it('skips modifier scaling when no possesses/bonded_to edge exists', () => {
    const graph = makeGraphWithArtifact('sword1', 1); // no owner

    const result = advanceAttachmentTier(graph, 'sword1');

    expect(result.advanced).toBe(true);
    expect(result.scaledModifiers).toEqual([]);
  });

  it('skips non-numeric modifier values gracefully', () => {
    const graph = makeGraphWithArtifact('art1', 1, 'owner1', {
      los_range: 1,
      label: 'sharp' as unknown as number,
    });

    const result = advanceAttachmentTier(graph, 'art1');

    expect(result.advanced).toBe(true);
    const mods = graph.getEdge('edge_possesses_art1')
      ?.properties.modifiers as Record<string, unknown>;
    expect(mods.los_range).toBeCloseTo(1 * TIER_MODIFIER_SCALE_FACTOR, 3);
    expect(mods.label).toBe('sharp'); // preserved, not scaled
  });

  it('scales the live seam on each tier advancement independently', () => {
    const graph = makeGraphWithArtifact('sword1', 1, 'agent1', { los_range: 1 });
    const read = () =>
      (graph.getEdge('edge_possesses_sword1')?.properties.modifiers as Record<string, number>)
        .los_range;

    advanceAttachmentTier(graph, 'sword1'); // 1→2
    expect(read()).toBeCloseTo(TIER_MODIFIER_SCALE_FACTOR, 3);

    advanceAttachmentTier(graph, 'sword1'); // 2→3
    expect(read()).toBeCloseTo(TIER_MODIFIER_SCALE_FACTOR ** 2, 2);

    advanceAttachmentTier(graph, 'sword1'); // 3→4
    expect(read()).toBeCloseTo(TIER_MODIFIER_SCALE_FACTOR ** 3, 2);
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
