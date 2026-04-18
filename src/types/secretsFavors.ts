/**
 * Secrets & Favors — Graph edge property types (THR-30).
 *
 * Secrets and favors are persistent social resources modeled as graph edges.
 * Both feed into the Deep Social Scenes leverage mechanic (THR-28).
 *
 * - `knows_secret_of` edge: discoverer → secret subject
 * - `owes_favor` edge: debtor → creditor
 */

// ─── Secret Types ──────────────────────────────────────────────────────────

export type SecretType =
  | 'hidden_allegiance'       // Secret faction membership or loyalty
  | 'past_crime'              // Theft, murder, betrayal
  | 'forbidden_relationship'  // Secret romance, alliance with enemy
  | 'hidden_weakness'         // Fear, vulnerability, addiction
  | 'secret_ambition'         // Concealed goal that conflicts with public persona
  | 'financial_secret'        // Hidden wealth, debt, embezzlement
  | 'divine_mark'             // Knowledge of divine intervention (player actions)
  | 'betrayal_planned';       // Knowledge of upcoming betrayal

export type SecretSource =
  | 'confession'           // Target confided willingly
  | 'observation'          // Discoverer noticed something (Eye encounter)
  | 'spy_debrief'          // From spy network
  | 'tavern_gossip'        // Overheard at tavern sublocation
  | 'encounter_outcome'    // Discovered during encounter resolution
  | 'divine_revelation';   // Player revealed via divine action

// ─── Secret Edge Properties ────────────────────────────────────────────────

/** Properties stored on the `knows_secret_of` graph edge (discoverer → subject). */
export interface KnowsSecretOfEdgeProperties {
  secretType: SecretType;
  /** 0.0 (trivial gossip) → 1.0 (life-ruining knowledge) */
  magnitude: number;
  discoveredTick: number;
  source: SecretSource;
  /** Once revealed, loses leverage value but stays known */
  revealed: boolean;
  revealedTick?: number;
  /** Agent this secret was revealed to (if revealed in an encounter) */
  revealedTo?: string;
  /** Human-readable detail generated at discovery time */
  detail?: string;
}

// ─── Favor Edge Properties ─────────────────────────────────────────────────

/** Properties stored on the `owes_favor` graph edge (debtor → creditor). */
export interface OwesFavorEdgeProperties {
  /** 0.0 (small kindness) → 1.0 (life debt) */
  magnitude: number;
  /** Context string describing the original favor: "pulled from burning chapel" */
  context: string;
  grantedTick: number;
  /** Marked true when the favor is called in and accepted */
  redeemed: boolean;
  redeemedTick?: number;
  /** Marked true when the debtor refused to honor the favor */
  broken: boolean;
  brokenTick?: number;
  /**
   * Marked true when the creditor attempted to call in the favor but gracefully
   * withdrew when refused — preserves the relationship without the full penalty.
   */
  acknowledgedInsufficient?: boolean;
}

// ─── Prose Magnitude Descriptors ──────────────────────────────────────────

/** Prose label for secret magnitude bands. */
export function secretMagnitudeProse(magnitude: number): string {
  if (magnitude < 0.3) return 'whispered gossip';
  if (magnitude < 0.6) return 'damaging knowledge';
  return 'devastating secret';
}

/** Prose label for favor magnitude bands. */
export function favorMagnitudeProse(magnitude: number): string {
  if (magnitude < 0.3) return 'small kindness';
  if (magnitude < 0.6) return 'meaningful aid';
  return 'life debt';
}

/** Prose label for SecretType. */
export function secretTypeProse(type: SecretType): string {
  switch (type) {
    case 'hidden_allegiance':     return 'hidden allegiance';
    case 'past_crime':            return 'past crime';
    case 'forbidden_relationship': return 'forbidden relationship';
    case 'hidden_weakness':       return 'hidden weakness';
    case 'secret_ambition':       return 'secret ambition';
    case 'financial_secret':      return 'financial secret';
    case 'divine_mark':           return 'divine mark';
    case 'betrayal_planned':      return 'planned betrayal';
  }
}

// ─── Constants ─────────────────────────────────────────────────────────────

/** How much secret magnitude translates to initial social leverage. */
export const SECRET_LEVERAGE_MULTIPLIER = 0.30;

/** How much favor magnitude translates to initial social leverage. */
export const FAVOR_LEVERAGE_MULTIPLIER = 0.25;

/** Leverage gained from revealing a secret mid-encounter. */
export const SECRET_REVELATION_LEVERAGE_BONUS = 0.25;

/** Leverage gained from calling in a favor mid-encounter. */
export const FAVOR_REDEMPTION_LEVERAGE_BONUS = 0.20;

/** Trust damage when a secret is revealed by its holder. */
export const SECRET_REVELATION_TRUST_PENALTY = -0.20;

/** Extra trust penalty when the revealed secret came from a confession (betrayal). */
export const SECRET_CONFESSION_BETRAYAL_PENALTY = -0.40;

/** Trust damage when a favor is broken. */
export const FAVOR_BREAKING_TRUST_PENALTY = -0.30;

/** Sentiment shift on the relates_to edge when a favor is broken. */
export const FAVOR_BREAKING_SENTIMENT_PENALTY = -0.40;

/** Secrets below this magnitude can decay. */
export const SECRET_DECAY_THRESHOLD = 0.20;

/** Maximum age (ticks) before minor secrets fade. */
export const SECRET_MAX_AGE_TICKS = 100;

/** Ticks before an unpaid favor causes tension drift on relates_to. */
export const FAVOR_TENSION_THRESHOLD_TICKS = 30;

/** Sentiment drift per check from an unpaid favor. */
export const FAVOR_TENSION_SENTIMENT_DELTA = -0.02;

/** Maximum age (ticks) before a favor expires (forgiven). */
export const FAVOR_MAX_AGE_TICKS = 80;

/** Ticks between secret/favor decay and tension checks. */
export const SECRET_FAVOR_CHECK_INTERVAL = 10;

/** Essence cost for Reveal Secret divine action. */
export const REVEAL_SECRET_ESSENCE_COST = 10;

/** Essence cost for Call in Favor divine action. */
export const CALL_IN_FAVOR_ESSENCE_COST = 8;

/** Essence cost for Plant Secret divine action. */
export const PLANT_SECRET_ESSENCE_COST = 14;

/** Max secrets one agent can hold about any single subject. */
export const MAX_SECRETS_PER_AGENT = 10;

/** Max favors any single debtor can owe. */
export const MAX_FAVORS_PER_AGENT = 8;

/**
 * Favor cost must exceed debt magnitude by this threshold for the debtor
 * to be eligible to refuse redemption.
 */
export const FAVOR_BREAKING_THRESHOLD = 0.30;
