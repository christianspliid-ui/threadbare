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

// ─── Echoes stand in the new world (THR-1843, slice 2) ───

/** One live echo placed in the new world at creation. */
export interface EchoSeededTrace extends TraceBase {
  category: 'echo.seeded';
  echoId: string;
  kind: 'monument' | 'legacy' | 'relic';
  hostId: string;
  relation?: 'kin' | 'opposed' | 'unrelated';
  targetBand?: string | null;
  band?: string;
  imprint?: number;
  capped?: boolean;
}

/** A live echo that could not be placed; no node is minted to force it. */
export interface EchoSeedSkippedTrace extends TraceBase {
  category: 'echo.seed_skipped';
  echoId: string;
  reason: 'over_cap' | 'no_host' | 'no_heir' | 'no_site' | 'faded' | 'no_origin' | 'error';
}

// ─── The end of the age (THR-1381, plan `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md` § Tracing) ───

/** The age-end check started the Twilight. */
export interface AgeEndedTrace extends TraceBase {
  category: 'age.ended';
  by: 'mandate' | 'doom';
  archetype?: string;
}

/** The ceremony's contents, once per Twilight. */
export interface TwilightBeatsBuiltTrace extends TraceBase {
  category: 'twilight.beats_built';
  ending: 'mandate' | 'doom';
  firstFate: 'aspect' | 'lived' | 'died' | 'none';
  memoryTypes: string[];
  fallbacks?: string[];
}

/** The ceremony could not show; the age went straight to the harvest. */
export interface TwilightFallbackTrace extends TraceBase {
  category: 'twilight.fallback';
  cause: 'beats_threw' | 'mount_failed';
}

/** One per memory written into the account at run end. */
export interface ResonanceMemoryCapturedTrace extends TraceBase {
  category: 'resonance.memory_captured';
  memoryId: string;
  memoryType: string;
  significance: number;
  reason: string;
}

/** A memory left the World-Soul: dropped for a stronger one, or faded out. */
export interface ResonanceMemoryEvictedTrace extends TraceBase {
  category: 'resonance.memory_evicted';
  memoryId: string;
  cause: 'full' | 'faded';
}
