/**
 * Backstory Generator — public API for tiered backstory generation.
 *
 * Runs all backstory resolvers, filters by influence tier, groups by stratum,
 * and composes each stratum's layers into a flowing narrative.
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */
import type { WorldGraph } from './graph';
import type { BackstoryResult, BackstoryStratumBlock, BackstoryStratum } from '../types/prose';
import type { InfluenceTier } from '../types/influence';
import {
  surfaceOriginResolver,
  surfaceSphereResolver,
  bondHistoryResolver,
  traitOriginResolver,
  turningPointResolver,
  contradictionResolver,
  fearResolver,
  hiddenMotiveResolver,
  storyArcResolver,
  divineTransformationResolver,
} from './backstoryResolvers';

// ─── Stratum Metadata ─────────────────────────────────────────────────────────

const STRATUM_META: Record<BackstoryStratum, { title: string; subtitle: string }> = {
  1: { title: 'What They Say', subtitle: 'The story as others tell it' },
  2: { title: 'What They Lived', subtitle: 'The history that shaped them' },
  3: { title: 'What They Hide', subtitle: 'The truth beneath the surface' },
  4: { title: 'What They Are', subtitle: 'The unmasked self' },
};

// ─── Resolver Registry ────────────────────────────────────────────────────────

const ALL_BACKSTORY_RESOLVERS = [
  surfaceOriginResolver,
  surfaceSphereResolver,
  bondHistoryResolver,
  traitOriginResolver,
  turningPointResolver,
  contradictionResolver,
  fearResolver,
  hiddenMotiveResolver,
  storyArcResolver,
  divineTransformationResolver,
];

// ─── Empty result ─────────────────────────────────────────────────────────────

const EMPTY_RESULT: BackstoryResult = { text: '', strata: [], maxStratum: 0 };

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate tiered backstory for an agent, filtered by influence tier.
 *
 * @param agentId - The agent's node ID
 * @param graph - The world graph
 * @param seed - World seed for deterministic PRNG
 * @param influenceTier - Current influence tier (0-4)
 * @param readBackstoryTier - Highest stratum the player has already read (for isNew)
 */
export function generateTieredBackstory(
  agentId: string,
  graph: WorldGraph,
  seed: number,
  influenceTier: InfluenceTier,
  readBackstoryTier: 0 | 1 | 2 | 3 | 4 = 0,
): BackstoryResult {
  if (influenceTier === 0) return EMPTY_RESULT;

  const node = graph.getNode(agentId);
  if (!node) return EMPTY_RESULT;

  // Derive per-agent seed (same pattern as proseGenerator.ts)
  let idHash = 0;
  for (let i = 0; i < agentId.length; i++) {
    idHash = ((idHash << 5) - idHash + agentId.charCodeAt(i)) | 0;
  }
  const entitySeed = seed + Math.abs(idHash);

  // Run all resolvers, collect BackstoryLayers
  const allLayers = ALL_BACKSTORY_RESOLVERS.flatMap(resolver =>
    resolver(agentId, graph, entitySeed)
  );

  // Filter to strata the player has unlocked
  const unlockedLayers = allLayers.filter(layer => layer.stratum <= influenceTier);

  if (unlockedLayers.length === 0) return EMPTY_RESULT;

  // Group by stratum
  const byStratum = new Map<BackstoryStratum, typeof unlockedLayers>();
  for (const layer of unlockedLayers) {
    const existing = byStratum.get(layer.stratum) ?? [];
    existing.push(layer);
    byStratum.set(layer.stratum, existing);
  }

  // Compose each stratum into a BackstoryStratumBlock
  const strata: BackstoryStratumBlock[] = [];
  const stratumNumbers = ([1, 2, 3, 4] as BackstoryStratum[]).filter(s => byStratum.has(s));

  for (const stratumNum of stratumNumbers) {
    const layers = byStratum.get(stratumNum)!;
    // Sort by priority descending, join with double newline
    const sorted = [...layers].sort((a, b) => b.priority - a.priority);
    const text = sorted.map(l => l.text).join('\n\n');

    const meta = STRATUM_META[stratumNum];
    strata.push({
      tier: stratumNum,
      title: meta.title,
      subtitle: meta.subtitle,
      text,
      isNew: stratumNum > readBackstoryTier,
    });
  }

  const maxStratum = strata.length > 0 ? strata[strata.length - 1].tier : 0;

  // Full text: strata joined with section breaks
  const text = strata.map(s => s.text).join('\n\n---\n\n');

  return { text, strata, maxStratum };
}
