/**
 * Account traces (THR-1813 slice 1, plan doc
 * `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § Tracing).
 *
 * Registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`, `TraceEntry`).
 */

import type { TraceBase } from '../trace';
import type { SphereName } from '../index';
import type { AccountSource } from '../account';

/** The record a world was created from. */
export interface AccountLoadedTrace extends TraceBase {
  category: 'account.loaded';
  source: AccountSource;
  cycleCount: number;
  liveEchoes: number;
  awakeHungers: number;
  sealedCards: number;
}

/** The run-end write. */
export interface AccountSavedTrace extends TraceBase {
  category: 'account.saved';
  cycleCount: number;
  ok: boolean;
  error?: string;
}

/** A stored record that could not be read; it is kept, and the run starts empty. */
export interface AccountUnreadableTrace extends TraceBase {
  category: 'account.unreadable';
  reason: 'parse' | 'version' | 'shape';
}

/** One per divine echo slot at harvest. */
export interface HarvestDivineEchoPickedTrace extends TraceBase {
  category: 'harvest.divine_echo_picked';
  slot: number;
  kind: 'monument' | 'legacy' | 'relic' | 'none';
  nodeId?: string;
  reason: string;
}

/** A world built from an account. */
export interface AccountWorldShapedTrace extends TraceBase {
  category: 'account.world_shaped';
  seed: number;
  tilt: Partial<Record<SphereName, number>>;
  echoesLoaded: number;
}
