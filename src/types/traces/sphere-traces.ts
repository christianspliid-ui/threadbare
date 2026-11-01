/**
 * Sphere-score traces (THR-1768, plan doc
 * `Docs/plans/2026-10-06-thr-1768-sphere-score-seeding.md` § Tracing).
 *
 * Registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`, `TraceEntry`).
 * `sphere_pressure` was built by `phaseSpherePressure` since 2026-03 and dropped on the
 * floor; it is now emitted. `sphere_seeded` names the route of every seed the backfill
 * sweep writes.
 */

import type { TraceBase } from '../trace';
import type { SphereName } from '../index';
import type { PressureSource } from '../sphereAffinity';

/** One sphere resolved on one entity by `phaseSpherePressure`. */
export interface SpherePressureResolvedTrace extends TraceBase {
  category: 'sphere_pressure';
  entityId: string;
  sphere: SphereName;
  outcome: 'absorbed' | 'eroded' | 'progress' | 'level_up';
  incomingPressure: number;
  threshold: number;
  previousScore: number;
  newScore: number;
  progressFilled: number;
  progressRequired: number;
  /** The first writer netted into the entity this tick (kept for older readers). */
  source: PressureSource;
  /** Every writer netted into this sphere this tick, in event order (THR-1768). */
  sources: PressureSource[];
  /** Their `sourceId`s, same order as `sources`. */
  sourceIds: string[];
}

/** Which node kind a seed landed on. */
export type SphereSeedKind = 'ascendant' | 'individual' | 'culture' | 'faction' | 'place' | 'sublocation' | 'other';

/** Where the seed's scores came from. */
export type SphereSeedRoute = 'alignment' | 'culture' | 'terrain' | 'parent' | 'declared' | 'none';

/**
 * A sphere bag written by the backfill sweep — one per node mid-run, one summary at
 * world init (`entityId: null`, `counts` keyed `kind:route`).
 */
export interface SphereSeededTrace extends TraceBase {
  category: 'sphere_seeded';
  entityId: string | null;
  kind: SphereSeedKind | 'summary';
  route: SphereSeedRoute | 'summary';
  /** Non-zero entries only; absent on the summary. */
  scores?: Partial<Record<SphereName, number>>;
  /** Init summary only: `kind:route` → node count. */
  counts?: Record<string, number>;
}

/**
 * A push aimed at a hex id (`hex_COL_ROW`) rewritten onto a place, or dropped because no
 * place stands within `HEX_PRESSURE_FALLBACK_RADIUS` (THR-2087).
 */
export interface HexPressureTrace extends TraceBase {
  category: 'sphere_pressure.hex_resolved' | 'sphere_pressure.hex_unanchored';
  hexId: string;
  sphere: SphereName;
  source: PressureSource;
  sourceId: string;
  /** The place id the push landed on (resolved only). */
  resolvedTo?: string;
  /** 0 on the hex, else 1..radius (resolved only). */
  distance?: number;
}

/**
 * The god's push at a town re-aimed onto the town's Place holding least of that sphere
 * (THR-2094). One per re-aimed push; a town with no Places emits nothing.
 */
export interface TownPressureTrace extends TraceBase {
  category: 'sphere_pressure.town_resolved';
  /** Where the card was aimed. */
  townId: string;
  /** The Place the push landed in. */
  sublocationId: string;
  sphere: SphereName;
  sourceId: string;
  /** That Place's score in the sphere before the push. */
  sublocationScore: number;
}

/** Why a bought sphere vector was rejected (THR-1749). */
export type SpherePointsInvalidReason = 'foundation_sphere' | 'over_cap' | 'not_whole' | 'wrong_total' | 'both_poles';

/**
 * Emitted once by `createAscendant` when the archetype's `spherePoints` are missing or
 * fail validation and the hunger preset is written instead (THR-1749).
 */
export interface SpherePointsFallbackTrace extends TraceBase {
  category: 'sphere_points.fallback';
  ascendantId: string;
  reason: 'missing' | SpherePointsInvalidReason;
  /** The pair the preset came from. */
  fallbackFrom: { primary: SphereName; secondary: SphereName };
  written: Partial<Record<SphereName, number>>;
}
