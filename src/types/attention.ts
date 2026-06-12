/**
 * Attention tier model — type definitions.
 *
 * The three-tier attention model controls how the ascendant's presence
 * is distributed across ongoing encounters:
 *   background   — resolved silently; digest only, no player input
 *   shaping      — player may steer via thread tugs but doesn't block
 *   story_beat   — queued for full player engagement; pauses auto-resolve
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type { ReachDomain } from './traits';
import type { EncounterType } from './encounter';
import type { CourtPosition } from './influence';

// ─── Attention Tiers ─────────────────────────────────────────────────

/** Three processing tiers for encounters in the ascendant's attention model. */
export type AttentionTier = 'background' | 'shaping' | 'story_beat';

// ─── Digest ──────────────────────────────────────────────────────────

/**
 * Single entry in the ascendant's encounter digest.
 * Background-tier encounters produce a DigestEntry and nothing more.
 */
export interface DigestEntry {
  /** Agent who participated in the encounter. */
  agentId: string;
  agentName: string;
  /** Encounter that produced this entry. */
  encounterId: string;
  encounterName: string;
  encounterType: EncounterType;
  /** Primary reach domain exercised in the encounter. */
  reachPrimary: ReachDomain;
  /** Game tick when the encounter resolved. */
  tick: number;
  /** Whether the encounter resolved as a success. */
  success: boolean;
  /** Human-readable strings describing meaningful outcomes. */
  significantOutcomes: string[];
  /** Net capability score delta per reach domain (reach → delta). */
  capabilityChanges: Record<string, number>;
  /** Template IDs of attachments gained during the encounter. */
  attachmentsGained: string[];
  /** Template IDs of attachments lost during the encounter. */
  attachmentsLost: string[];
  /** Net quintessence gained or lost. */
  quintessenceDelta: number;
  /** True if this entry qualifies for digest highlight (unusual outcome). */
  isNotable: boolean;
  /** True if the curator actively chose to suppress this from the digest. */
  wasCuratedOut: boolean;
  /** True if the agent is in the 'dormant' court position. */
  isDormantAgent: boolean;
  /** Whether the source of this entry is an agent or a location encounter. */
  sourceType: 'agent' | 'location';
}

// ─── Thread Tugs ─────────────────────────────────────────────────────

/**
 * A shaping-tier signal — the ascendant can pull this thread to steer
 * an encounter's outcome without fully attending it.
 * Expires after expiresTick if not attended.
 */
export interface ThreadTug {
  /** Stable identifier for this tug. */
  id: string;
  /** Agent whose encounter generated the tug. */
  agentId: string;
  encounterId: string;
  /** Optional specific action within the encounter. */
  actionId?: string;
  /** Primary reach domain at stake in the encounter. */
  reachPrimary: ReachDomain;
  /** How dangerous the encounter outcome could be for the agent. */
  threatLevel: 'moderate' | 'hard' | 'deadly';
  /** Agent's court position at the time the tug was created. */
  courtPosition: CourtPosition;
  /** Tick when the tug was created. */
  createdTick: number;
  /** Tick after which this tug is discarded unattended. */
  expiresTick: number;
  /** True if the ascendant responded to this tug. */
  attended: boolean;
  /** Curator priority score used to select which tugs surface first. */
  curationScore: number;
}

// ─── Story Beats ──────────────────────────────────────────────────────

/** Reasons an encounter is elevated to story-beat tier. */
export type StoryBeatPriority =
  | 'doom_clock'
  | 'faction_war'
  | 'promoted'
  | 'template_intrinsic';

/**
 * An encounter queued for full ascendant attention.
 * Story beats block auto-resolve until the player engages.
 */
export interface QueuedStoryBeat {
  /** Encounter requiring full player engagement. */
  encounterId: string;
  /** Optional specific action within the encounter. */
  actionId?: string;
  /** Agent whose encounter triggered the story beat. */
  agentId: string;
  /** Why this encounter was elevated to story-beat tier. */
  priority: StoryBeatPriority;
  /** Tick when this beat entered the queue. */
  queuedTick: number;
  /** Hex coordinates of the encounter (for camera navigation). */
  hexCol: number;
  hexRow: number;
}

// ─── Ascendant Attention Pool ─────────────────────────────────────────

/**
 * Runtime attention pool state for the ascendant.
 * Attending encounters costs attention; it regenerates each tick.
 */
export interface AscendantAttentionState {
  /** Current available attention points. */
  attentionPool: number;
  /** Maximum attention the ascendant can hold. */
  attentionCapacity: number;
  /** Attention points recovered per tick. */
  attentionRegen: number;
}

// ─── Visual State ────────────────────────────────────────────────────

/** UI state reflecting how stretched the ascendant's attention is. */
export type AttentionVisualState = 'focused' | 'busy' | 'strained' | 'overwhelmed';

// ─── Story-so-far Digest ──────────────────────────────────────────────

/**
 * What is the dominant tension thread for an agent right now?
 * Used by the story-so-far digest to frame the opening tension line.
 */
export type TensionKind =
  | 'active_encounter'    // TODO(THR-455): requires GameState — not yet detected
  | 'open_wound'          // has_trait edges with category='condition'
  | 'faction_debt'        // owes_favor edges aged past TENSION_DEBT_AGE_TICKS
  | 'pending_obligation'  // TODO(THR-455): requires GameState — not yet detected
  | 'doom_pressure'       // TODO(THR-455): requires GameState — not yet detected
  | 'idle';               // fallback: no tension detected

// ─── Trace Types ──────────────────────────────────────────────────────
// All extend TraceBase so they can join the TraceEntry discriminated union.

import type { TraceBase } from './trace';

/** Trace emitted when an encounter changes attention tier. */
export interface EncounterPromotionTrace extends TraceBase {
  category: 'encounter_promotion';
  encounterId: string;
  fromTier: AttentionTier;
  toTier: AttentionTier;
  reason: StoryBeatPriority | string;
}

/** Trace emitted when the curator accepts or suppresses a digest entry. */
export interface CuratorDecisionTrace extends TraceBase {
  category: 'curator_decision';
  encounterId: string;
  decision: 'kept' | 'curated_out';
  curationScore: number;
  reason: string;
  // THR-16: curator metadata signals
  isChainStage: boolean;
  isFinalChainStage: boolean;
  factionThreadCount: number;
  matchesAmbition: boolean;
}

/** Trace emitted when the attention pool changes. */
export interface AttentionPoolTrace extends TraceBase {
  category: 'attention_pool';
  previous: number;
  current: number;
  capacity: number;
  delta: number;
  cause: string;
}

/** Trace emitted when a story beat enters or exits the queue. */
export interface StoryBeatQueueTrace extends TraceBase {
  category: 'story_beat_queue';
  encounterId: string;
  action: 'enqueued' | 'dequeued' | 'expired';
  priority: StoryBeatPriority;
  queueDepth: number;
}

/** Trace emitted when a ThreadStoryComposition is assembled for an agent (THR-455). */
export interface ThreadStoryComposedTrace extends TraceBase {
  category: 'thread_story_composed';
  agentId: string;
  tensionKind: TensionKind;
  beatCount: number;
  lookbackTicks: number;
  emptyState: boolean;
}
