// ─── Cooperation Strategy Types ──────────────────────────────────

/** Game-theoretic cooperation strategies for agents in social interactions */
export type CooperationStrategy =
  | 'tit-for-tat'
  | 'grudger'
  | 'pavlov'
  | 'always-cooperate'
  | 'always-defect';

export const COOPERATION_STRATEGIES: CooperationStrategy[] = [
  'tit-for-tat',
  'grudger',
  'pavlov',
  'always-cooperate',
  'always-defect',
];

// ─── Social Orientation (on action templates) ────────────────────

/** The cooperative/defective bias of an action template or candidate */
export type SocialOrientation = 'cooperative' | 'defective' | 'neutral';

// ─── Interaction History ─────────────────────────────────────────

/** A single interaction record between two actors */
export interface InteractionRecord {
  tick: number;
  actorMove: 'cooperate' | 'defect';
  targetMove: 'cooperate' | 'defect';
  context: string; // action template ID
  stakes: 'low' | 'high';
}

// ─── Dilemma Events ──────────────────────────────────────────────

/** Outcome of a prisoner's dilemma interaction */
export type DilemmaOutcome =
  | 'mutual_trust'
  | 'betrayed'
  | 'exploitation'
  | 'mutual_distrust';

/** A significant social dilemma event that shapes reputation */
export interface DilemmaEvent {
  tick: number;
  actorId: string;
  targetId: string;
  actorMove: 'cooperate' | 'defect';
  targetMove: 'cooperate' | 'defect';
  outcome: DilemmaOutcome;
  stakes: number; // 0.0-1.0 scale
  context: string; // action template ID
}

// ─── Edge Property Interfaces ───────────────────────────────────

/**
 * Typed properties for 'relates_to' edges (inter-actor relationships).
 * Stored on GraphEdge.properties for edges of type 'relates_to'.
 */
export interface RelatesToEdgeProperties {
  /** Relationship polarity: -1 (hatred) to 1 (devotion) */
  sentiment: number;
  /** Bond intensity: 0 (stranger) to 1 (lifelong) */
  strength: number;
  /** Relationship basis category */
  basis: string;
  /** History of cooperation/defection moves */
  interactionLog?: InteractionRecord[];
  /**
   * Trust score: -1 (deep distrust) to 1 (absolute trust).
   * Evolves via cooperative (+0.03) / defective (-0.08) interactions.
   * Decays toward 0 per tick. Used by reputation walks and social scoring.
   */
  trust: number;
}

/**
 * Typed properties for 'member_of' edges (actor → faction/group membership).
 * Stored on GraphEdge.properties for edges of type 'member_of'.
 */
export interface MemberOfEdgeProperties {
  /** Membership role (e.g., 'member', 'adept', 'leader') */
  role: string;
  /**
   * Rank within the faction: 0 (recruit) to 1 (leader).
   * Used for faction intelligence gating and social scoring.
   */
  rank: number;
  /**
   * Tick when this membership was established.
   * Used for seniority calculations.
   */
  joinedTick: number;
}

// ─── Trust Constants ────────────────────────────────────────────

/** Trust gain per cooperative interaction */
export const TRUST_COOPERATE_DELTA = 0.03;

/** Trust loss per defective interaction */
export const TRUST_DEFECT_DELTA = -0.08;

/** Trust decay toward 0 per tick (absolute, applied to |trust|) */
export const TRUST_DECAY_PER_TICK = 0.002;

/** Default trust for new relationships */
export const DEFAULT_TRUST = 0;

/** Default rank for backfilled member_of edges */
export const DEFAULT_MEMBER_RANK = 0.3;

// ─── Tunable Constants ───────────────────────────────────────────

/** Bonus to disposition when agent cooperates (paradoxical: rewards agents for being nice) */
export const DISPOSITION_COOPERATE_BONUS = 0.3;

/** Bonus to disposition when agent defects (paradoxical: rewards exploitation success) */
export const DISPOSITION_DEFECT_BONUS = 0.3;

/** Reputation decays per tick (accounts for agents forgetting/moving on) */
export const REPUTATION_DECAY_PER_TICK = 0.005;

/** Maximum interaction records to keep in agent's social memory */
export const INTERACTION_LOG_CAP = 10;

/** Stakes threshold above which a dilemma triggers narrative event */
export const DILEMMA_STAKES_THRESHOLD = 0.3;

/** Base stakes floor — every dilemma candidate gets this minimum to enable non-gold/non-iron spheres */
export const STAKES_BASE = 0.15;

/** Reputation boost when agent cooperates */
export const REPUTATION_UPDATE_COOPERATE = 0.05;

/** Reputation penalty when agent defects */
export const REPUTATION_UPDATE_DEFECT = -0.08;

/** Default reputation for new acquaintances */
export const DEFAULT_REPUTATION = 0.5;

// ─── Stakes Computation Weights ──────────────────────────────────

/** Weight: interaction involves Gold domain (trade, wealth) */
export const STAKES_DOMAIN_GOLD = 0.3;

/** Weight: interaction involves Iron domain (warfare, conflict) */
export const STAKES_DOMAIN_IRON = 0.4;

/** Weight: extreme sentiment values (hatred or devotion) */
export const STAKES_EXTREME_SENTIMENT = 0.2;

/** Weight: one actor is faction leader (leadership role multiplier) */
export const STAKES_FACTION_LEADER = 0.3;

/** Weight: territory or strategic control is at stake */
export const STAKES_TERRITORY_CONTROL = 0.3;

// ─── Dilemma Outcome Effects ────────────────────────────────────

/** Sentiment boost for mutual trust outcome */
export const DILEMMA_MUTUAL_TRUST_SENTIMENT = 0.15;

/** Bond strength boost for mutual trust outcome */
export const DILEMMA_MUTUAL_TRUST_STRENGTH = 0.1;

/** Sentiment penalty for betrayal outcome */
export const DILEMMA_BETRAYAL_SENTIMENT = -0.4;

/** Sentiment penalty for mutual distrust outcome */
export const DILEMMA_MUTUAL_DISTRUST_SENTIMENT = -0.1;
