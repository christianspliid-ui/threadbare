/**
 * HexMutation — a lightweight mutation applied to hex tile state.
 *
 * Hex tiles are NOT graph nodes (Decision 1 in design doc), so we can't
 * use GraphOps to mutate them. HexMutation is the minimal struct that
 * carries a delta to apply to a specific hex's mutable state fields.
 *
 * Produced by hexActionBridge when a player target_action resolves against
 * a hex. Applied to GameState.tiles by phaseHexState.
 */
export interface HexMutation {
  /** Hex column coordinate */
  readonly col: number;
  /** Hex row coordinate */
  readonly row: number;
  /** Which mutable field to modify */
  readonly field: 'divineInfluence' | 'corruption' | 'explorationAttraction';
  /** Amount to add to the current value (clamped to 0.0–1.0 after applying) */
  readonly delta: number;
  /** Template ID or system identifier for tracing */
  readonly source: string;
}
