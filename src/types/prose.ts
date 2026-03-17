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

// ─── Backstory System Types ───────────────────────────────────

/** Backstory stratum depth (1 = surface, 4 = divine arc) */
export type BackstoryStratum = 1 | 2 | 3 | 4;

/** A backstory prose fragment with stratum depth */
export interface BackstoryLayer extends ProseLayer {
  stratum: BackstoryStratum;
}

/** Aggregated result of backstory generation for an agent */
export interface BackstoryResult {
  layers: BackstoryLayer[];
  /** How many tiers the player has unlocked for this agent (0–4) */
  tiersUnlocked: number;
}

/** Tuneable constants for the backstory generation system */
export const BACKSTORY_CONSTANTS = {
  /** Axiological value threshold below which a pair is considered contradictory */
  CONTRADICTION_THRESHOLD: 0.15,
  /** Axiological value magnitude above which a value generates a shadow fear */
  FEAR_THRESHOLD: 0.3,
  /** Essence bracket boundary: low tier */
  ESSENCE_BRACKET_LOW: 20,
  /** Essence bracket boundary: medium tier */
  ESSENCE_BRACKET_MEDIUM: 50,
  /** Essence bracket boundary: high tier */
  ESSENCE_BRACKET_HIGH: 100,
  /** Duration (ms) before the "new" badge fades on a backstory section */
  NEW_BADGE_FADE_MS: 3000,
  /** Minimum knowledge tier required to display any backstory section */
  BACKSTORY_SECTION_MIN_KNOWLEDGE: 'recognised' as const,
} as const;
