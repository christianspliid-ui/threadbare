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
