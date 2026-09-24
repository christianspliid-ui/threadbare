/**
 * War news traces (THR-1564, plan doc `Docs/plans/2026-09-24-thr-1564-war-news-from-state.md`
 * § Tracing).
 *
 * `war.reported` is emitted once per `reportWar` call, whether or not a line was
 * written. It is the debug layer's count of the war news — nothing player-facing
 * reads it. That is the lesson of THR-1564: the war lines used to be *built from*
 * traces, and traces are off unless the debug panel is open.
 */

import type { TraceBase } from '../trace';

/** One kind per war line (the plan's § Content table). */
export type WarNewsKind =
  | 'army_raised'
  | 'army_disbanded'
  | 'army_fraying'
  | 'battle_joined'
  | 'siege_laid'
  | 'battle_ended'
  | 'territory_changed'
  // Kept in the union with no production caller: the breach writer has none yet, and
  // wiring it is not THR-1564. The day a caller exists it reports through `reportWar`.
  | 'siege_breach';

export interface WarReportedTrace extends TraceBase {
  category: 'war.reported';
  kind: WarNewsKind;
  /** Whether any participant commander or faction carries a thread to the ascendant. */
  threaded: boolean;
  /** The TickEvent written; absent when nothing was written. */
  eventId?: string;
  skipped?: 'no_tick_events' | 'territory_line_instead' | 'error';
  error?: string;
}
