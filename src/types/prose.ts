/**
 * Prose Generator Framework — type definitions.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */
import type { WorldGraph } from '../engine/graph';

/** A single prose fragment produced by a resolver */
export interface ProseLayer {
  text: string;
  priority: number;
  category: ProseCategory;
  source: string;  // resolver name for debug tracing
}

/** Grouping categories for prose layers (max 2 per category in composed output) */
export type ProseCategory = 'origin' | 'atmosphere' | 'character' | 'tension' | 'history';

export const PROSE_CATEGORIES: ProseCategory[] = ['origin', 'atmosphere', 'character', 'tension', 'history'];

/** Output mode */
export type ProseMode = 'summary' | 'full';

/** Resolver function signature */
export type ProseResolver = (
  nodeId: string,
  graph: WorldGraph,
  seed: number,
) => ProseLayer[];

/** Registry entry: node type → list of resolvers */
export type ResolverRegistry = Record<string, ProseResolver[]>;

// ─── Tunable Constants ────────────────────────────────────────
export const MAX_LAYERS_PER_CATEGORY = 2;
export const SUMMARY_MAX_CHARS = 200;
export const FULL_MAX_PARAGRAPHS = 6;
export const CULTURE_FLAVOR_CHANCE = 0.4;
