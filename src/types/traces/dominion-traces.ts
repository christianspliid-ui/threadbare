/**
 * Dominion traces (THR-1748, plan doc
 * `Docs/plans/2026-10-11-thr-1748-dominion-core.md` § Tracing).
 *
 * Registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`, `TraceEntry`).
 */

import type { TraceBase } from '../trace';
import type { SphereName } from '../index';
import type { DominionBand } from '../../data/dominion-content';

export type DominionBandChangeCause = 'neglect' | 'rival' | 'doom' | 'claim' | 'seat' | 'carry' | 'cast' | 'other';

/** A place's band moved after pressure resolved this tick. */
export interface DominionBandChangeTrace extends TraceBase {
  category: 'dominion.band_change';
  placeId: string;
  from: DominionBand;
  to: DominionBand;
  cause: DominionBandChangeCause;
  match: number;
  power: number;
}

/** A tending writer pushed this tick (one per place, summed). */
export interface DominionTendTrace extends TraceBase {
  category: 'dominion.tend';
  placeId: string;
  by: Array<'claim' | 'seat' | 'carry' | 'anointed'>;
  pushed: Partial<Record<SphereName, number>>;
  capped: boolean;
}

/** Untended places relaxed toward their seeded scores this tick (one summary). */
export interface DominionNeglectTrace extends TraceBase {
  category: 'dominion.neglect';
  placeIds: string[];
  /** Places that lost a whole score point this tick. */
  dropped: string[];
}

/** A rival probe landed (or was absorbed, or throttled) on the god's turf. */
export interface DominionRaidTrace extends TraceBase {
  category: 'dominion.raid';
  rivalId: string;
  placeId: string | null;
  sphere: SphereName | null;
  magnitude: number;
  absorbed: boolean;
  throttled: boolean;
}

/** A mark crossed on a bought sphere: the god's score in it grows. */
export interface DominionAttunementTrace extends TraceBase {
  category: 'dominion.attunement';
  sphere: SphereName;
  mark: number;
  earned: number;
  power: number;
  capped: boolean;
}

/** The seat-floor clamp fired (expected never at the decided rates). */
export interface DominionSeatFloorTrace extends TraceBase {
  category: 'dominion.seat_floor';
  placeId: string;
  before: DominionBand;
  restoredSphere: SphereName;
}

/** A read, for one consumer (sampled: one per consumer per tick, tracing on only). */
export interface DominionReadTrace extends TraceBase {
  category: 'dominion.read';
  objectId: string;
  kind: string;
  readThrough: string;
  band: DominionBand;
  match: number;
  power: number;
  consumer: 'cost' | 'odds' | 'yield' | 'income' | 'debug';
  /** Yield trace only: every thread this tick, with its band. */
  lines?: Array<{ targetId: string; tier: number; band: DominionBand; yield: number }>;
}

/** The Dominion lens projection rebuilt (THR-1750 § Tracing). */
export interface DominionLensRebuiltTrace extends TraceBase {
  category: 'dominion.lens_rebuilt';
  /** 'error' = the build threw; the previous projection was kept. */
  reason: 'structure' | 'refresh' | 'band_change' | 'lens_opened' | 'error';
  /** Places read. */
  places: number;
  /** Land hexes per band. */
  byBand: Record<DominionBand, number>;
  frontierEdges: number;
  terrainFallbackHexes: number;
}
