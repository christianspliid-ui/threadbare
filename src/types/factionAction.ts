/**
 * Faction Action Types — data shapes for the phaseFactionActions behavior loop.
 *
 * Factions evaluate their ambition and world state each FACTION_ACTION_INTERVAL
 * ticks and select one action to execute. Actions produce world changes through
 * encounter injection and direct graph mutations.
 *
 * Design doc: Docs/plans/2026-04-14-faction-agency-implementation.md
 * Quality gate: Docs/plans/2026-04-18-faction-agency-quality-gate.md
 * NFP: Tunability (constants), Determinism (seeded PRNG), Inspectability (traces),
 *       Fail-soft (all executors skip gracefully on missing data).
 */

import type { FactionAmbitionType } from './faction';

// ─── Action Types ────────────────────────────────────────────────────────────

export type FactionActionType =
  | 'commission_quest'
  | 'declare_rivalry'
  | 'propose_alliance'
  | 'excommunicate'
  | 'hold_conclave'
  | 'issue_bounty';

// ─── Action Template ─────────────────────────────────────────────────────────

export interface FactionActionTemplate {
  type: FactionActionType;
  name: string;
  treasuryCost: number;
  /** Min ticks that must pass since this action type was last used by this faction */
  cooldownTicks: number;
  /** Minimum faction membership to attempt */
  minMembers: number;
  /** Ambitions that increase selection weight for this action */
  ambitionAffinity: FactionAmbitionType[];
  prerequisite?: FactionActionPrerequisite;
}

export type FactionActionPrerequisite =
  | { type: 'has_rival' }
  | { type: 'has_ally' }
  | { type: 'member_count_above'; count: number }
  | { type: 'treasury_above'; amount: number }
  | { type: 'leader_exists' }
  | { type: 'no_active_conclave' };

// ─── Action Record (stored on faction node) ───────────────────────────────────

export interface FactionActionRecord {
  actionType: FactionActionType;
  executedTick: number;
  /** Target faction, agent, or location ID */
  targetId?: string;
  targetName?: string;
  outcome: 'success' | 'pending' | 'failed';
  details?: Record<string, unknown>;
}

/** Max records kept per faction before oldest is discarded */
export const FACTION_ACTION_HISTORY_MAX = 20;

// ─── Tunable Constants ────────────────────────────────────────────────────────

/** How often faction action evaluation runs (ticks) */
export const FACTION_ACTION_INTERVAL = 8;

/** Min ticks between consecutive actions by the same faction */
export const FACTION_ACTION_COOLDOWN = 5;

/** Min faction treasury before any action is attempted */
export const FACTION_MIN_TREASURY = 0;

/** Treasury cost to commission a quest */
export const COMMISSION_QUEST_COST = 5;

/** Ticks before an unclaimed faction quest expires */
export const COMMISSION_QUEST_EXPIRY = 30;

/** Minimum negative sentiment to declare rivalry */
export const RIVALRY_SENTIMENT_THRESHOLD = -0.3;

/** Minimum positive sentiment to propose alliance */
export const ALLIANCE_SENTIMENT_THRESHOLD = 0.3;

/** Reputation loss cascaded to ex-member's other faction memberships */
export const EXCOMMUNICATION_REPUTATION_SPLASH = 0.1;

/** Min ticks between conclaves (base cadence, per QG sign-off) */
export const CONCLAVE_BASE_FREQUENCY_TICKS = 180;

/** Max agents invited to a conclave */
export const CONCLAVE_MAX_PARTICIPANTS = 6;

/** Wealth reward for completing a bounty */
export const BOUNTY_REWARD = 10;

/** Treasury cost to issue a bounty (reward + overhead) */
export const BOUNTY_COST = 12;

/** Ticks before a bounty expires */
export const BOUNTY_EXPIRY = 40;

/** Reputation-based scoring bonus for faction quests */
export const FACTION_QUEST_LOYALTY_MULTIPLIER = 0.3;

/** Percentage of quest rewards that go to faction treasury */
export const FACTION_TREASURY_TRIBUTE_RATE = 0.1;

/** Essence cost for Divine Edict */
export const DIVINE_EDICT_ESSENCE_COST = 18;

/** Essence cost for Anoint Champion */
export const ANOINT_CHAMPION_ESSENCE_COST = 14;

/** Ticks the champion blessing lasts */
export const ANOINT_CHAMPION_DURATION = 15;

/** Sentiment pushed to when rivalry is declared */
export const RIVALRY_SENTIMENT_VALUE = -0.8;

/** Sentiment pushed to when alliance is proposed */
export const ALLIANCE_SENTIMENT_VALUE = 0.8;

// ─── Trace Types ─────────────────────────────────────────────────────────────

export interface FactionActionTrace {
  tick: number;
  category: 'faction_action';
  actionType: FactionActionType;
  factionId: string;
  factionName: string;
  ambitionType: FactionAmbitionType | 'none';
  treasuryCost: number;
  treasuryAfter: number;
  targetId?: string;
  targetName?: string;
  outcome: 'executed' | 'failed_prerequisite' | 'failed_treasury' | 'skipped_cooldown' | 'skipped_no_eligible';
  summary: string;
}

export interface FactionConclaveTrace extends FactionActionTrace {
  participants: string[];
  ticksRemaining: number;
}

// ─── THR-400: Governance Verb Traces ──────────────────────────────────────────
//
// These four traces describe DIVINE actions cast BY the player ON a faction.
// They are independent of FactionActionTrace (which describes faction-driven
// autonomous actions). Each carries its own `category` discriminant so chronicle
// + DebugPanel consumers can switch on it directly.

/** Stir Dissent — player cast that raises a faction's dissentLevel. */
export interface FactionStirDissentTrace {
  tick: number;
  category: 'faction_stir_dissent';
  factionId: string;
  factionName: string;
  previousDissentLevel: number;
  newDissentLevel: number;
  /** Set when the cast crossed the threshold and seeded an encounter on a member. */
  seededEncounterId?: string;
  targetMortalId?: string;
  targetMortalName?: string;
  summary: string;
}

/** Whisper to the Leader — player cast that tilts the faction leader's next decision. */
export interface FactionWhisperLeaderTrace {
  tick: number;
  category: 'faction_whisper_leader';
  factionId: string;
  factionName: string;
  leaderId: string;
  leaderName: string;
  preferredPole: 'protector' | 'conqueror' | 'sworn' | 'renegade';
  /** True when this whisper landed on a leader already under another whisper. */
  conflictedWithOtherWhisper: boolean;
  seededFollowupEncounterId?: string;
  summary: string;
}

/** Recover Doctrine — player cast that surfaces a forgotten faction teaching. */
export interface FactionRecoverDoctrineTrace {
  tick: number;
  category: 'faction_recover_doctrine';
  factionId: string;
  factionName: string;
  doctrineId: string;
  targetMortalId: string;
  targetMortalName: string;
  realignmentApplied: boolean;
  seededEncounterId: string;
  summary: string;
}

/** Surface a Doubter — player cast that names the faction's most misaligned member. */
export interface FactionSurfaceDoubterTrace {
  tick: number;
  category: 'faction_surface_doubter';
  factionId: string;
  factionName: string;
  doubterId: string;
  doubterName: string;
  /** 0..1; how far the doubter sits from the faction's reputation alignment. */
  axisDistance: number;
  /** True when this cast initiated a fresh ascendant→doubter thread (low tier). */
  bondInitiated: boolean;
  intelligenceGrantId?: string;
  seededEncounterId: string;
  summary: string;
}

/** Union of all THR-400 governance-verb traces, for chronicle and DebugPanel consumers. */
export type FactionGovernanceTrace =
  | FactionStirDissentTrace
  | FactionWhisperLeaderTrace
  | FactionRecoverDoctrineTrace
  | FactionSurfaceDoubterTrace;

// ─── THR-430 Schism traces ─────────────────────────────────────────────────
// Schism is a deferred-resolution divine action: the player plants a crisis
// on a faction, then a resolution tick later the faction either reforms
// (reputation hit + expulsion) or splits into two factions. These traces let
// the chronicle and DebugPanel surface both the plant beat and the resolution.

/** Schism Planted — divine action set the pending-resolution marker on a faction. */
export interface SchismPlantedTrace {
  tick: number;
  category: 'schism_planted';
  factionId: string;
  factionName: string;
  actorAgentId: string;
  resolutionTick: number;
  baselineCohesion: number;
  summary: string;
}

/** Schism Resolved — the resolution phase decided reform-or-split. */
export interface SchismResolvedTrace {
  tick: number;
  category: 'schism_resolved';
  factionId: string;
  factionName: string;
  outcome: 'split' | 'reform' | 'noop';
  splitPressure: number;
  inputs: { cohesionDrop: number; spread: number; dissent: number };
  /** Set on outcome='split'. */
  splinterFactionId?: string;
  /** Set on outcome='split'. */
  splinterMemberCount?: number;
  /** Set on outcome='reform'. */
  expelledMemberIds?: string[];
  failReason?: string;
  summary: string;
}

/** Faction Reformed — sister trace to faction_splintered; fires on the reform branch. */
export interface FactionReformedTrace {
  tick: number;
  category: 'faction_reformed';
  factionId: string;
  factionName: string;
  reputationBefore: number;
  reputationAfter: number;
  expelledCount: number;
  expelledIds: string[];
  summary: string;
}

// ─── THR-432 Faction Succession trace ──────────────────────────────────────
// One trace covers every outcome of phaseFactionSuccession. Each tick, the phase
// runs across every faction and emits a trace per faction whose leader snapshot
// changed (or first-observed). The chronicle only picks up
// `outcome: 'anointed_inherited'` (succession the player caused); the others are
// debug-only.

/** Faction Succession — outcome of one pass of phaseFactionSuccession on a faction. */
export interface FactionSuccessionTrace {
  tick: number;
  category: 'faction_succession';
  factionId: string;
  factionName: string;
  outcome:
    | 'anointed_inherited'      // a will_succeed successor took the leads edge
    | 'natural_succession'      // leader exited, no successor resolved — fell back to derivation
    | 'successor_self_seated'   // an anointed successor reached the seat unaided; their edge was cleared
    | 'snapshot_bootstrapped'   // first observation of this faction
    | 'peaceful_overtake';      // leader changed by score, no exit — snapshot re-pointed
  exitedLeaderId: string | null;
  exitedLeaderName: string | null;
  newLeaderId: string | null;
  newLeaderName: string | null;
  /** How many will_succeed candidates were filtered through resolution. 0 on
   *  outcomes that don't consult the will_succeed list. */
  willSucceedCandidatesConsidered: number;
  /** Set when outcome === 'anointed_inherited'. */
  seededEncounterId?: string;
  /** Set when outcome === 'anointed_inherited'. */
  conferredVia?: 'anointment' | 'natural';
  summary: string;
}

/** Anoint Successor — divine action cast that creates the will_succeed edge. */
export interface FactionAnointSuccessorTrace {
  tick: number;
  category: 'faction_anoint_successor';
  factionId: string;
  factionName: string;
  successorId: string;
  successorName: string;
  /** True when the target agent had multiple `member_of` memberships and the
   *  highest-reputation one was chosen. Rare in normal play. */
  multiFactionResolved: boolean;
  /** True when this cast was a re-anointment — the successor already had a
   *  will_succeed edge for this faction; the new edge supersedes via recency. */
  reAnointment: boolean;
  /** Tick stamped on the new will_succeed edge (= state.tick). */
  anointedTick: number;
  summary: string;
}
