import type { CosmologyProfile, SphereName } from './index';
import type { AxiologicalProfile } from './agent';

/** Behavioral archetype for rival gods */
export type RivalBehavior =
  | 'aggressive'     // directly opposes player, attacks agents/places of power
  | 'subtle'         // undermines through deception, rarely detected
  | 'territorial'    // claims regions and defends them fiercely
  | 'expansionist';  // spreads influence widely, competes for worshippers

/** Full rival god definition (generated at run start) */
export interface RivalDefinition {
  id: string;
  name: string;
  sphereAlignment: CosmologyProfile;
  behavior: RivalBehavior;
  /** 0.0-1.0 how opposed this rival is to the player's goals */
  oppositionStrength: number;
  description: string;
  /** Generated axiological profile for decision-making */
  axiologicalProfile?: AxiologicalProfile;
  /** Primary and secondary sphere */
  primarySphere?: SphereName;
  secondarySphere?: SphereName;
}

/**
 * UI-facing summary of one active rival scheme (THR-66). Denormalized onto
 * RivalState each tick so RivalPanel can render scheme cards without needing
 * the activeCompositions ledger. The canonical record is the ActiveComposition.
 */
export interface RivalSchemeSummary {
  /** The backing ActiveComposition id. */
  compositionId: string;
  /** Scheme family id (`corruptive` | `territorial`). */
  family: string;
  /** Human-readable family label for the card title. */
  label: string;
  /** Kebab-case id of the most recently activated phase, or 'pending' before phase 1. */
  phase: string;
  /** 1-based index of the current phase (0 = not yet started). */
  phaseIndex: number;
  /** Total phases in the scheme (always 4). */
  totalPhases: number;
  /** Escalation tier the scheme launched at. */
  escalationTier: number;
  /** Lifecycle status mirrored from the ActiveComposition. */
  status: 'active' | 'completed' | 'failed';
  /** True when the player has a live counter surface against this scheme. */
  contested: boolean;
}

/** Runtime state tracking for a rival god */
export interface RivalState {
  rivalId: string;
  active: boolean;
  interventionCount: number;
  agentsControlled: number;
  regionsInfluenced: string[];
  /** 0.0-1.0 how hostile this rival is toward the player currently */
  hostilityToPlayer: number;
  /** Ticks since last major action */
  ticksSinceAction?: number;
  /** Per-agent awareness 0.0-1.0 — how much attention this rival is paying to each agent */
  agentAwareness?: Partial<Record<string, number>>;
  // ── Scheme activation (THR-66) — additive/optional ──
  /** Composition ids of schemes this rival currently runs (active only). */
  activeSchemeIds?: string[];
  /** Tick this rival last launched a scheme (for launch cooldown). */
  lastSchemeLaunchTick?: number;
  /** UI-facing scheme summaries (active + recently terminal), maintained by phaseRivalActions. */
  schemes?: RivalSchemeSummary[];
  // ── Source contestation (THR-621) — additive/optional ──
  /**
   * Cumulative essence this rival has drained out of the player's essence sources
   * (THR-621). Rivals are not graph nodes and hold no essence pool, so the
   * redirected income accrues here — the ledger that makes "income redirects to
   * the rival" an inspectable number rather than a claim in prose (NFP #2).
   */
  drainedEssence?: number;
  /**
   * Host node ids of the player's essence sources this rival currently contests
   * or has desecrated. Denormalized each tick from the source bags so the UI can
   * name the drain without re-walking the portfolio; the source bag's
   * `contestedBy` remains canonical.
   */
  drainedSourceIds?: string[];
}

/** Rival archetype generation templates */
export type RivalArchetype = RivalBehavior;

// Name fragments for procedural rival naming (moved to data/rival-content.ts)
export { RIVAL_NAME_PREFIXES, RIVAL_NAME_SUFFIXES } from '../data/rival-content';

/** A rival god's chosen action for a tick */
export interface RivalAction {
  type: 'recruit' | 'intervene' | 'expand' | 'attack' | 'wait';
  target?: string;
}
