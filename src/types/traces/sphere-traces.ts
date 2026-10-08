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
