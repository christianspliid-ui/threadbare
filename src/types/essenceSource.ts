/**
 * Essence Source type definitions (THR-611 — Divine Economy).
 *
 * An **essence source** is any existing graph node (location / sublocation /
 * artifact) that carries an `essenceSource` property bag. It is a generalization
 * of the existing "place of power" — NOT a new node type and NOT a new edge type
 * (load-bearing rule: relationships are edges, node-internal data is properties).
 *
 * The ascendant's relationship to a source is the existing `controls` edge; a
 * source's income is folded into `computeEssenceGeneration` / `computeEssenceIncome`
 * via the existing per-sphere `perTickIncome` channel pattern.
 *
 * Slice 1 (this file's first landing) ships the **substrate**: the property bag,
 * the tier derivation, the typed per-sphere income term, and forward-migration of
 * legacy `isPlaceOfPower` locations. The player-facing find/claim/build/defend
 * templates, discovery/consecration/defend encounters, and the portfolio / hex
 * signifier UI land in follow-on slices of THR-611.
 */

import type { SphereName } from './index';

/**
 * Taxonomy of essence source kinds. Each maps to a host node type and a
 * sphere-typing rule (see `Docs/plans/2026-07-05-divine-economy-essence-sources.md`).
 */
export type SourceKind =
  | 'placeOfPower' // ley-nexus / peak / deep — host: location
  | 'shrine' // consecrated site — host: location or sublocation
  | 'faithfulCommunity' // settlement with threaded residents — host: location
  | 'relic' // ruin-delve yield — host: artifact
  | 'rite'; // recurring observance — host: sublocation

/**
 * Public tier of a source — the ONLY read surface the player sees (prose-first,
 * plain register, THR-609). Derived from the private `sanctity` scalar plus the
 * `contestedBy` / `desecrated` state; never surfaced as a float.
 */
export type SourceTier = 'dormant' | 'flowering' | 'contested' | 'desecrated';

/**
 * The `essenceSource` property bag, stored on `node.properties.essenceSource` of
 * an existing host node. All data is internal to the node → properties (per the
 * load-bearing rule); the ascendant relationship stays a `controls` edge.
 */
export interface EssenceSource {
  /** Taxonomy row. */
  kind: SourceKind;
  /**
   * Which sphere this source's typed income feeds. `undefined` = untyped: income
   * falls back to alignment distribution (legacy place-of-power behavior). A
   * migrated legacy place of power is untyped until built/consecrated, which is
   * what keeps existing income identical (NFP #6, additive).
   */
  sphereAffinity?: SphereName;
  /** Private scalar 0..1 (the Flow Web "stock") that drives the derived tier. */
  sanctity: number;
  /** Derived public read: recomputed from `sanctity` + contested/desecrated state. */
  tier: SourceTier;
  /** Secrecy: undefined = not yet discovered (fog-consistent, hidden on the map). */
  discoveredBy?: string;
  /** Set when a rival drain scheme is active against this source (→ `contested`). */
  contestedBy?: string;
  /** Set true when a completed rival drain has desecrated the source (→ income redirects). */
  desecrated?: boolean;
  /** Tick this source bag was created / migrated (audit + fail-soft). */
  originTick?: number;
}

// ─── Trace interfaces (NFP #2) ───────────────────────────────────────────────

/**
 * Aggregate per-tick trace emitted by `phaseEssenceSources`. ONE trace per tick
 * (never one-per-source) — a per-source burst would flood the 2000-entry ring
 * buffer and evict unrelated traces (see the trace-buffer volume lesson).
 */
export interface EssenceSourcePhaseTrace {
  category: 'essence_source_phase';
  tick: number;
  /** Total sources known this tick (across all controlled hosts). */
  sourceCount: number;
  /** Sources migrated forward from legacy `isPlaceOfPower` this tick. */
  migratedThisTick: number;
  /** Sources whose derived tier changed this tick. */
  tierChanges: number;
  /** Sources currently contested. */
  contestedCount: number;
  /**
   * Sources the mortal economy pushed *upward* this tick — the land's matching
   * goods ran to surplus (essence bridge, THR-618).
   */
  econNurtured: number;
  /** Sources the mortal economy pulled *downward* this tick (matching goods scarce). */
  econWithered: number;
  summary: string;
}
