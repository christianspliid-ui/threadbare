/**
 * AgentKnowledge — per-agent multi-facet knowledge model.
 *
 * Replaces the single-scalar familiarity gating with a per-facet knowledge model
 * where individual data points about agents are revealed through specific narrative
 * interactions. Each facet is independently gated by how the player learned about it.
 *
 * Backward compatible: missing agentKnowledge returns empty defaults.
 * Existing familiarityMap is untouched.
 */

// ─── Bond Revelation Source ───────────────────────────────────────

/** How a bond between two agents was discovered */
export type BondRevelationSource = 'witnessed' | 'gossip' | 'divine' | 'faction';

// ─── AgentKnowledge Interface ─────────────────────────────────────

/**
 * Multi-facet knowledge record for a single observed agent.
 * All facets are additive — once revealed, they stay revealed (no decay).
 * The interactionDepth scalar tracks cumulative exposure for threshold checks.
 */
export interface AgentKnowledge {
  /** Axiological pair IDs (e.g., 'mercy_ruthlessness') revealed through value-driven interactions */
  revealedValues: Set<string>;

  /** ReachDomain values (e.g., 'iron', 'gold') revealed through capability observation */
  revealedDomains: Set<string>;

  /** Map of observed agent's bond targets (agentId → how the bond was discovered) */
  revealedBonds: Map<string, BondRevelationSource>;

  /** Ambition node IDs revealed through witnessing the agent pursue them */
  revealedAmbitions: Set<string>;

  /** Event IDs the player knows this agent was involved in */
  knownEvents: Set<string>;

  /** Whether the agent's cooperative/adversarial disposition toward the player is known */
  dispositionRevealed: boolean;

  /** Cumulative interaction depth score — sum of weighted exposure events */
  interactionDepth: number;

  /** Possession node IDs seen by the player (weapons, relics, provisions, etc.) */
  revealedPossessions: Set<string>;

  /** Power trait node IDs observed being used (supernatural or combat abilities) */
  revealedPowers: Set<string>;

  /** Condition trait node IDs known (wounds, diseases, blessings, curses) */
  revealedConditions: Set<string>;

  /** Agreement edge IDs the player has witnessed (oaths, contracts, faction pledges) */
  revealedAgreements: Set<string>;

  /** Whether this agent is known to be a threat to the ascendant's goals */
  threatRevealed: boolean;

  /** Number of ticks the player's avatar was co-located with this agent */
  coLocationTicks: number;
}

// ─── Depth Accumulation Constants (NFP #1: Tunability) ───────────

/** Interaction depth gained when observing an agent in a dilemma */
export const DEPTH_DILEMMA = 2.0;

/** Interaction depth gained when observing an agent complete an encounter step */
export const DEPTH_ENCOUNTER_OBSERVED = 1.0;

/** Interaction depth gained when a divine action targets or involves this agent */
export const DEPTH_DIVINE_ACTION = 1.0;

/** Interaction depth gained from a social encounter between agents */
export const DEPTH_SOCIAL_ENCOUNTER = 1.0;

/** Interaction depth gained per tick the agent is co-located with the avatar */
export const DEPTH_COLOCATION_PER_TICK = 0.05;

/** Interaction depth gained per tick the agent shares a faction with the avatar */
export const DEPTH_FACTION_PER_TICK = 0.0125;

// ─── Revelation Threshold Constants ──────────────────────────────

/** Minimum interactionDepth to unlock "who they are observed with" overview notes */
export const OVERVIEW_OBSERVATION_THRESHOLD = 3;

/** Minimum interactionDepth to unlock overheard gossip overview notes */
export const OVERVIEW_GOSSIP_THRESHOLD = 2;

/** Minimum interactionDepth for a character quote to appear */
export const OVERVIEW_QUOTE_PER_INTERACTION = 1;

/** Interaction count before backstory fragment unlocks */
export const OVERVIEW_BACKSTORY_INTERACTIONS = 5;

/** Interactions needed to reveal primary ambition */
export const AMBITION_PRIMARY_INTERACTIONS = 2;

/** Interactions needed to reveal secondary ambition */
export const AMBITION_SECONDARY_INTERACTIONS = 4;

/** Ticks since last activity before an activity note becomes stale */
export const STALE_ACTIVITY_TICKS = 15;

/** Interactions needed to reveal threat status */
export const THREAT_REVEAL_INTERACTIONS = 6;

/** Dilemma observation count before disposition is revealed */
export const DISPOSITION_DILEMMA_THRESHOLD = 3;

/** Maximum number of chronicle events tracked per agent before oldest are evicted */
export const CHRONICLE_MAX_ENTRIES = 30;

/** Ticks of co-location before a possession is revealed through activity */
export const POSSESSION_ACTIVITY_TICKS = 2;

/** Ticks of co-location before provisions are revealed */
export const POSSESSION_PROVISIONS_TICKS = 5;

// ─── Factory ──────────────────────────────────────────────────────

/**
 * Create a fresh, empty AgentKnowledge record.
 * All sets/maps are empty, numbers are 0, booleans are false.
 */
export function createEmptyAgentKnowledge(): AgentKnowledge {
  return {
    revealedValues: new Set(),
    revealedDomains: new Set(),
    revealedBonds: new Map(),
    revealedAmbitions: new Set(),
    knownEvents: new Set(),
    dispositionRevealed: false,
    interactionDepth: 0,
    revealedPossessions: new Set(),
    revealedPowers: new Set(),
    revealedConditions: new Set(),
    revealedAgreements: new Set(),
    threatRevealed: false,
    coLocationTicks: 0,
  };
}
