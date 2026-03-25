// --- Fog of War Types ---

export type HexVisibilityState = 'unexplored' | 'remembered' | 'visible';

/** Snapshot of what was last seen when a hex transitions from visible → remembered. */
export interface StaleSnapshot {
  terrain: string;
  locationNames: string[];
  agentNames: string[];
  lastSeenTick: number;
}

/** Per-hex visibility entry. */
export interface HexVisibility {
  state: HexVisibilityState;
  snapshot?: StaleSnapshot;
}

/** The full visibility map keyed by "col,row" strings. */
export type VisibilityMap = Map<string, HexVisibility>;

/** A source of line-of-sight. */
export interface LOSSource {
  hexCol: number;
  hexRow: number;
  range: number;
}

// --- Tunable Constants ---

export const AVATAR_SIGHT_RANGE = 0;
export const AGENT_SIGHT_RANGE = 1;
export const SCRY_SIGHT_RANGE = 0;
export const SCRY_ESSENCE_PER_TICK = 2;
export const MOVE_ESSENCE_COST = 0; // free for prototype

/** Helper to make a visibility map key. Re-exports hexKey for backward compatibility. */
export { hexKey as visKey } from '../lib/hexKey';
