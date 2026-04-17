/**
 * locationActivity.ts — Types for the Intent & Activity Visibility system (THR-22).
 *
 * These are UI-derived types — they are computed from graph state and never stored
 * in GameState or persisted. They express what the UI surfaces to the player.
 */

// ── Core enum types ────────────────────────────────────────────────────────────

/**
 * Aggregate activity level for a location, driving hex pulse visuals and murmur tone.
 * Ordered from quietest to most volatile.
 */
export type LocationPulse = 'quiet' | 'stirring' | 'busy' | 'tense' | 'volatile';

/**
 * Dominant activity category at a location, mapped from agent action reaches.
 * Used for murmur template selection and hex pulse coloring.
 */
export type ActivityCategory =
  | 'commerce'      // Gold reach — trade, barter, economic
  | 'conflict'      // Iron reach — combat, dueling, confrontation
  | 'diplomacy'     // Heart reach — social negotiation, bonding
  | 'intrigue'      // Shadow reach — information, secrets, manipulation
  | 'devotion'      // Star / Veil reach — religious, spiritual
  | 'craft'         // Stone reach — construction, crafting, building
  | 'exploration'   // Eye reach — discovery, scouting, observation
  | 'gathering'     // Multiple agents converging on this location
  | 'dispersal'     // Agents leaving this location
  | 'idle';         // No active actions

// ── Agent-level thread ────────────────────────────────────────────────────────

/**
 * What a single agent is doing at a location — familiarity-gated prose.
 *
 * Familiarity gating:
 *   stranger (<0.2): "A traveler, heading somewhere with purpose."
 *   recognised (0.2-0.4): Name + vague action ("Kael heads toward the market")
 *   known (0.4-0.7): Name + activity category + step ("Kael is negotiating a deal — 2nd day")
 *   intimate/transparent (≥0.7): Full detail including step outcome + temperature
 */
export interface AgentActivityThread {
  agentId: string;
  agentName: string;
  /** Prose-form activity description, gated by familiarity */
  visibleActivity: string;
  /** Activity category for hex-level aggregation */
  category: ActivityCategory;
  /** Movement intent at this location */
  movementPhase: 'arriving' | 'present' | 'departing' | null;
  /** Emotional temperature from recent step outcomes */
  temperature: 'cool' | 'warm' | 'heated';
  /** Familiarity score 0-1 — for debug inspection */
  familiarityScore: number;
}

// ── Location-level summary ────────────────────────────────────────────────────

/**
 * Full activity summary for a single location — the input to the three visibility surfaces:
 * hex pulse indicators, location murmur tooltips, and agent thread lists.
 */
export interface LocationActivitySummary {
  locationId: string;
  locationName: string;
  /** Aggregate activity level driving hex pulse */
  pulse: LocationPulse;
  /** 1-3 narrative murmur lines describing current activity */
  murmurs: string[];
  /** Familiarity-gated agent activity threads */
  agentThreads: AgentActivityThread[];
  /** Number of active encounters at this location (count only — names require familiarity) */
  encounterPressure: number;
  /** Dominant activity category this tick */
  dominantActivity: ActivityCategory | null;
  /** Hex coordinates — for pulse aggregation across locations on same hex */
  hexCol: number;
  hexRow: number;
}

// ── Hex-level pulse (aggregated from all locations on a hex) ──────────────────

/**
 * Aggregated hex pulse — max of all location pulses on the same hex.
 * Drives the hex particle visual in HexMapV2.
 */
export interface HexPulseSummary {
  hexCol: number;
  hexRow: number;
  pulse: LocationPulse;
  dominantActivity: ActivityCategory | null;
}
