/**
 * Divine Premonition types — Whisper and Compulsion system.
 *
 * Whisper: subconscious nudges during agent idle (dreams, omens, coincidences).
 * Compulsion: direct divine pressure at the moment of encounter selection.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import type { SphereName } from './index';
import type { ReachDomain } from './traits';
import type { EncounterType } from './encounter';

// ─── Nudge Categories ───────────────────────────────────────────

export type WhisperNudgeCategory =
  | 'reach_bias'
  | 'sphere_bias'
  | 'ambition_drift'
  | 'gather_strength'
  | 'gather_courage';

// ─── Whisper Nudge ──────────────────────────────────────────────

export interface WhisperNudge {
  category: WhisperNudgeCategory;
  /** Target reach for reach_bias nudges */
  targetReach?: ReachDomain;
  /** Target sphere for sphere_bias nudges */
  targetSphere?: SphereName;
  /** Essence cost to apply this nudge */
  essenceCost: number;
  /** Which essence pool to draw from */
  sphere: SphereName;
  /** Short prose label for the nudge option */
  prose: string;
  /** Secondary flavor text beneath the label */
  flavorText: string;
}

// ─── Compulsion Candidate ───────────────────────────────────────

export interface CompulsionCandidate {
  /** Encounter template ID */
  templateId: string;
  /** Human-readable encounter name */
  encounterName: string;
  /** Retcon prose: data-driven line explaining why the agent considers this */
  encounterHook: string;
  /** Encounter type (explore, duel, trade, etc.) */
  encounterType: EncounterType;
  /** Primary reach of the encounter */
  reach: ReachDomain;
  /** Dominant sphere affinity of the encounter */
  sphere: SphereName;
  /** Encounter threat rating label */
  threatRating: string;
  /** Hex distance from agent to encounter location */
  hexDistance: number;
  /** Score from the scoring pipeline */
  score: number;
  /** Essence cost to compel this choice */
  essenceCost: number;
  /** Location ID where the encounter lives */
  locationId: string;
  /** Location name for display */
  locationName: string;
}

// ─── Premonition Event ──────────────────────────────────────────

export interface PremonitionEvent {
  id: string;
  type: 'whisper' | 'compulsion';
  agentId: string;
  agentName: string;
  tick: number;
  /** Tick at which this event becomes visible to the player */
  showAfterTick: number;
  /** Tick after which this event is considered stale and should be discarded */
  eligibleUntilTick: number;
  /** Vignette prose for the modal header */
  vignetteProse: string;
  /** Whisper nudge options (for type === 'whisper') */
  whisperOptions?: WhisperNudge[];
  /** Compulsion encounter candidates (for type === 'compulsion') */
  compulsionCandidates?: CompulsionCandidate[];
}

// ─── Premonition Trace ──────────────────────────────────────────

export interface PremonitionTrace {
  category: 'divine_premonition';
  subtype: 'whisper' | 'compulsion';
  agentId: string;
  agentName: string;
  tick: number;
  /** IDs of the options presented */
  options: string[];
  /** What the player chose, or null if dismissed */
  playerChoice: string | null;
  essenceCost: number;
  sphereUsed: SphereName | null;
  /** ID of the resulting DivineInfluenceEntry, if any */
  influenceId: string | null;
  summary: string;
}
