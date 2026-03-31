/**
 * Agent Behavior Constants — Central Tuning File
 *
 * All tunable numbers for the agent decision pipeline, encounter resolution,
 * social fabric, and divine intervention systems. Edit this file to tune
 * game feel without touching logic.
 *
 * Organized by system. Each constant has:
 * - A descriptive name
 * - A JSDoc comment with purpose and valid range
 * - A default value that can be changed freely
 *
 * 56 constants extracted from 15 engine modules.
 */

// ═══════════════════════════════════════════════════════════════════
// SCORING — Value-per-tick encounter scoring (encounterScoring.ts)
// ═══════════════════════════════════════════════════════════════════

/** Offset added to step probability formula. Higher = agents attempt more encounters.
 * Formula: P = capability + modifiers - difficulty/100 + STEP_PROBABILITY_OFFSET
 * @range 0.3–0.8 (0.5 = conservative, 0.6 = moderate, 0.7 = aggressive) */
export const STEP_PROBABILITY_OFFSET = 0.7;

/** Floor for desire multiplier — prevents zero scores for neutral encounters.
 * @range 0.01–0.5 (lower = stronger axiological influence on decisions) */
export const MINIMUM_DESIRE = 0.05;

/** Weight for tier growth value in expected reward.
 * @range 0.0–1.0 (0 = ignore growth, 1 = growth dominates) */
export const GROWTH_REWARD_WEIGHT = 0.4;

/** Below this finalScore, the agent idles instead of acting.
 * @range 0.0001–0.1 (lower = agents attempt more marginal encounters) */
export const IDLE_SCORE_THRESHOLD = 0.0001;

/** Flat boost when an active ambition's reach matches the encounter's primary reach.
 * @range 0.0–0.5 (higher = ambitions more strongly steer encounter selection) */
export const AMBITION_REACH_BOOST = 0.5;

// ═══════════════════════════════════════════════════════════════════
// AWARENESS — Per-reach distance-limited visibility (encounterAwareness.ts)
// ═══════════════════════════════════════════════════════════════════

/** Minimum capability to perceive encounters at all (below this = 0 hops).
 * @range 0.01–0.2 */
export const AWARENESS_THRESHOLD = 0.05;

/** Base hops granted to any agent above the awareness threshold.
 * @range 1–3 */
export const BASE_AWARENESS_HOPS = 1;

/** Capability points needed per additional hop beyond base.
 * @range 0.05–0.3 (lower = awareness extends faster with capability) */
export const CAPABILITY_PER_HOP = 0.15;

/** Hard cap on awareness range for all reaches.
 * @range 3–10 */
export const MAX_AWARENESS_HOPS = 5;

/** Bonus awareness hops for agents on map edge hexes (fewer than 6 neighbors).
 * Compensates for the geometric disadvantage of seeing fewer adjacent hexes.
 * @range 0–2 */
export const EDGE_HEX_AWARENESS_BONUS = 1;

// ═══════════════════════════════════════════════════════════════════
// FACTION INTELLIGENCE — Rank-gated encounter visibility (factionAwareness.ts)
// ═══════════════════════════════════════════════════════════════════

/** Global toggle for faction network intelligence.
 * Set false to disable all faction awareness contributions. */
export const FACTION_NETWORK_AWARENESS = true;

/** Maximum entries visible per faction at rank 1.0.
 * Actual entries = floor(rank * this value).
 * @range 5–50 */
export const FACTION_NETWORK_MAX_ENTRIES = 20;

/** Minimum reach weight to count as a secondary reach for faction filtering.
 * @range 0.1–0.5 */
export const FACTION_SECONDARY_THRESHOLD = 0.3;

/** Minimum rank required to receive any faction intel.
 * @range 0.01–0.2 */
export const FACTION_MIN_RANK_FOR_INTEL = 0.05;

/** Default rank when edge properties lack a rank field.
 * @range 0.05–0.3 */
export const FACTION_DEFAULT_RANK = 0.1;

// ═══════════════════════════════════════════════════════════════════
// FILTER PIPELINE — 5-stage candidate reduction (encounterFilterPipeline.ts)
// ═══════════════════════════════════════════════════════════════════

/** Hard cap on candidates forwarded to the scoring stage.
 * @range 20–100 (lower = faster scoring, higher = more options) */
export const MAX_SCORED_CANDIDATES = 40;

/** Minimum entries preserved per encounter type during cap stage.
 * @range 1–5 */
export const MIN_DIVERSITY_SLOTS = 1;

/** Whether the threat-tolerance stage is active.
 * Set false to disable threat filtering entirely. */
export const THREAT_FLOOR_FILTER = false;

// ═══════════════════════════════════════════════════════════════════
// RESOLUTION MODIFIERS — Contextual modifiers for encounter steps (resolutionModifiers.ts)
// ═══════════════════════════════════════════════════════════════════

/** Bonus when agent sphere matches encounter sphere.
 * @range 0.05–0.25 */
export const SPHERE_ALIGNMENT_BONUS = 0.10;

/** Penalty when agent sphere opposes encounter sphere.
 * @range -0.25 to -0.05 */
export const SPHERE_OPPOSITION_PENALTY = -0.10;

/** Max total equipment modifier across all items.
 * @range 0.05–0.30 */
export const EQUIPMENT_MODIFIER_CAP = 0.15;

/** Max modifier from a single equipment item.
 * @range 0.03–0.15 */
export const EQUIPMENT_PER_ITEM_CAP = 0.08;

/** Max total terrain modifier (absolute value, clamped both directions).
 * @range 0.05–0.20 */
export const TERRAIN_MODIFIER_CAP = 0.10;

/** Bonus for acting in friendly-controlled territory.
 * @range 0.02–0.10 */
export const FACTION_CONTROL_BONUS = 0.05;

/** Penalty for acting in hostile-controlled territory.
 * @range -0.10 to -0.02 */
export const HOSTILE_TERRITORY_PENALTY = -0.05;

/** Max total trait resolution bonus.
 * @range 0.05–0.20 */
export const TRAIT_BONUS_CAP = 0.10;

/** Max modifier from a single trait.
 * @range 0.02–0.10 */
export const TRAIT_PER_BONUS_CAP = 0.05;

/** Terrain resolution modifiers by terrain type.
 * Positive = terrain advantage, negative = terrain hindrance. */
export const TERRAIN_RESOLUTION_MODIFIERS: Record<string, number> = {
  mountains: 0.05,
  hills: 0.03,
  dense_forest: -0.03,
  swamp: -0.05,
  desert: -0.03,
  plains: 0.0,
  coast: 0.0,
  tundra: -0.03,
  volcanic: -0.05,
  ruins: 0.03,
};

// ═══════════════════════════════════════════════════════════════════
// CAPABILITY GROWTH — Encounter-driven progression (capabilityGrowth.ts)
// ═══════════════════════════════════════════════════════════════════

/** Base growth per successful encounter step completion.
 * @range 0.1–1.0 (higher = faster progression) */
export const BASE_ENCOUNTER_GROWTH = 0.5;

/** Multiplier when the step's outcome has tierPromotionEligible.
 * @range 1.5–3.0 */
export const PROMOTION_ELIGIBLE_MULTIPLIER = 2.0;

/** Rate at which high capability reduces growth (0–1).
 * @range 0.3–0.9 (higher = steeper diminishing returns at high cap) */
export const DIMINISHING_RETURNS_FACTOR = 0.7;

/** Fraction of base growth awarded on failure.
 * @range 0.0–0.5 (0 = no failure growth, 0.5 = half credit) */
export const FAILURE_GROWTH_FRACTION = 0.2;

/** Reserved: multiplier for critical success outcomes.
 * @range 1.0–3.0 */
export const CRITICAL_SUCCESS_MULTIPLIER = 1.5;

/** Reserved: growth on critical failure.
 * @range 0.0–0.5 */
export const CRITICAL_FAILURE_GROWTH = 0.0;

// ═══════════════════════════════════════════════════════════════════
// TIER PROMOTION — Narrative events at tier boundaries (tierPromotion.ts)
// ═══════════════════════════════════════════════════════════════════

/** Rank bump for factions whose primary reach matches the promoted domain.
 * @range 0.05–0.2 */
export const FACTION_RANK_PER_PROMOTION = 0.1;

/** Rank bump for factions whose secondary reach matches the promoted domain.
 * @range 0.02–0.1 */
export const FACTION_RANK_SECONDARY_FRACTION = 0.05;

// ═══════════════════════════════════════════════════════════════════
// IDLE BEHAVIOR — Personality-driven idle actions (idleBehavior.ts)
// ═══════════════════════════════════════════════════════════════════

/** Minimum ambition magnitude to trigger drift behavior.
 * Agent drifts when loyalty_ambition < -AMBITION_DRIFT_THRESHOLD.
 * @range 0.1–0.5 */
export const AMBITION_DRIFT_THRESHOLD = 0.2;

/** Number of hops an idle agent moves per tick when drifting.
 * @range 1–3 */
export const IDLE_DRIFT_SPEED = 1;

/** Probability a loyal/neutral agent picks a trivial local encounter.
 * @range 0.3–1.0 (1.0 = always picks trivial if available) */
export const IDLE_TRIVIAL_PREFERENCE = 0.5;

/** Maximum hops to consider when searching for idle drift targets.
 * @range 3–10 */
export const IDLE_MAX_AWARENESS_HOPS = 5;

/** Consecutive idle ticks (no_candidates_after_filter) before agent is forced to travel
 * to the nearest content-bearing location. Safety net for content deserts.
 * @range 5–20 */
export const IDLE_FORCED_TRAVEL_THRESHOLD = 10;

// ═══════════════════════════════════════════════════════════════════
// TRUST — Edge-level trust tracking (trustMechanics.ts)
// ═══════════════════════════════════════════════════════════════════

/** Trust gain from a cooperative interaction.
 * @range 0.01–0.1 */
export const TRUST_COOPERATE_DELTA = 0.03;

/** Trust loss from a defective interaction (asymmetric — betrayal hurts more).
 * @range -0.2 to -0.03 */
export const TRUST_DEFECT_DELTA = -0.08;

/** Trust decay toward 0 per tick.
 * @range 0.001–0.01 (lower = memories linger longer) */
export const TRUST_DECAY_PER_TICK = 0.002;

// ═══════════════════════════════════════════════════════════════════
// REPUTATION — Graph-walked reputation perception (reputationWalk.ts)
// ═══════════════════════════════════════════════════════════════════

/** Maximum hops for indirect reputation walks.
 * @range 2–6 (higher = more distant gossip travels) */
export const REPUTATION_MAX_HOPS = 4;

/** Default reputation when no path exists between agents.
 * @range -0.5 to 0.5 (0 = neutral strangers) */
export const UNKNOWN_REPUTATION = 0.0;

/** Multiplier for Shadow capability distortion by intermediaries.
 * @range 0.05–0.3 (higher = more manipulation by shadow-capable agents) */
export const SHADOW_DISTORTION_FACTOR = 0.15;

/** Multiplier for Heart capability trust resistance by the perceiver.
 * @range 0.1–0.5 (higher = heart-capable agents resist distortion more) */
export const HEART_TRUST_FACTOR = 0.3;

/** Trust bonus per intermediary sharing a faction with the source.
 * @range 0.05–0.2 */
export const FACTION_RANK_TRUST_BONUS = 0.1;

// ═══════════════════════════════════════════════════════════════════
// SOCIAL ENCOUNTERS — Social encounter generation (socialEncounterGeneration.ts)
// ═══════════════════════════════════════════════════════════════════

/** Trust above this triggers cooperative bond boost.
 * @range 0.3–0.8 */
export const STRONG_BOND_THRESHOLD = 0.6;

/** Trust below this triggers hostile bond boost.
 * @range -0.6 to -0.1 */
export const HOSTILE_BOND_THRESHOLD = -0.3;

/** Score boost applied to cooperative social encounters with strong bonds.
 * @range 0.1–0.6 */
export const COOPERATIVE_BOND_BOOST = 0.4;

/** Score boost applied to destructive social encounters with hostile bonds.
 * @range 0.1–0.5 */
export const RIVAL_BOND_BOOST = 0.3;

/** Score penalty for encounters with unknown agents.
 * @range -0.3 to 0.0 */
export const STRANGER_MODIFIER = -0.1;

/** Eye capability threshold above which the agent gets a curiosity bonus.
 * @range 0.1–0.5 */
export const STRANGER_CURIOSITY_THRESHOLD = 0.3;

/** Curiosity bonus for perceptive agents encountering strangers.
 * @range 0.05–0.3 */
export const STRANGER_CURIOSITY_BONUS = 0.15;

/** Maximum social encounter templates generated per target agent.
 * @range 1–5 */
export const MAX_SOCIAL_CANDIDATES_PER_AGENT = 3;

/** Maximum adjacency hops for "visible" agents in social encounter scanning.
 * @range 1–4 */
export const VISIBLE_AGENT_MAX_HOPS = 2;

/** Trust gain on successful cooperative encounter completion.
 * @range 0.01–0.2 */
export const SOCIAL_COOPERATE_TRUST_BONUS = 0.05;

/** Trust loss on successful destructive encounter completion.
 * @range -0.2–-0.01 */
export const SOCIAL_DESTRUCTIVE_TRUST_PENALTY = -0.10;

/** Default duration in ticks for agreement edges.
 * @range 10–100 */
export const AGREEMENT_DEFAULT_TICKS = 30;

/** Minimum trust required to create an agreement edge.
 * @range -1.0–0.0 */
export const AGREEMENT_MIN_TRUST = -0.5;

// ═══════════════════════════════════════════════════════════════════
// FAMILIARITY DISCOUNT — Repetition penalty on encounter scoring (encounterScoring.ts)
// ═══════════════════════════════════════════════════════════════════

/** Score reduction per repetition of the same encounter template.
 * @range 0.05–0.25 */
export const FAMILIARITY_DECAY_PER_ATTEMPT = 0.20;

/** Maximum total familiarity discount (0.7 = repeated encounters score at 30% of base).
 * @range 0.5–0.9 */
export const FAMILIARITY_MAX_PENALTY = 0.7;

// ═══════════════════════════════════════════════════════════════════
// EXPLORATION BONUS — Novelty reward for unvisited locations (encounterScoring.ts)
// ═══════════════════════════════════════════════════════════════════

/** Flat additive score bonus for encounters at unvisited locations.
 * @range 0.1–0.6 */
export const EXPLORATION_NOVELTY_BONUS = 0.4;

/** Ticks after first visit before exploration bonus fully decays (gradual, not cliff).
 * @range 20–100 */
export const EXPLORATION_BONUS_DECAY_TICKS = 50;

// ═══════════════════════════════════════════════════════════════════
// TRAVEL COST — Movement penalty dampening (encounterScoring.ts)
// ═══════════════════════════════════════════════════════════════════

/** Weight applied to hop distance when computing travel cost.
 * Lower = agents more willing to travel to distant encounters.
 * At 0.12, a 3-hop journey adds 0.36 to total cost — competitive with local encounters.
 * @range 0.05–0.5 (was 0.5, reduced to enable cross-location movement) */
export const TRAVEL_COST_WEIGHT = 0.12;

/** Maximum travel cost discount from personality wanderlust.
 * An agent with maximum curiosity (tradition_progress at -1.0) gets this fraction off travel cost.
 * @range 0.2–0.6 */
export const WANDERLUST_MAX_DISCOUNT = 0.4;

/** Axiological pair used to derive wanderlust tendency.
 * Negative values (progress pole) = more curious/explorative.
 * Positive values (tradition pole) = more conservative/stay-put.
 * Read from agent.axiologicalProfile.tradition_progress */
export const WANDERLUST_PAIR: 'tradition_progress' = 'tradition_progress';

// ═══════════════════════════════════════════════════════════════════
// PERSONALITY — Axiological amplification (encounterScoring.ts)
// ═══════════════════════════════════════════════════════════════════

/** Exponent applied to desireMultiplier. >1.0 amplifies differences between liked/disliked encounters.
 * @range 1.0–2.0 */
export const PERSONALITY_SCORE_EXPONENT = 1.5;

// ═══════════════════════════════════════════════════════════════════
// ENCOUNTER RETIREMENT — Template exhaustion + outgrowth (phaseAgentDecision.ts, encounterFilterPipeline.ts)
// ═══════════════════════════════════════════════════════════════════

/** After this many completions of the same template, it is permanently retired for that agent.
 * @range 3–10 */
export const MAX_COMPLETIONS_PER_TEMPLATE = 5;

/** How much higher than template average difficulty (on 0–100 scale) the agent's capability
 * must be before the encounter is outgrown and filtered out.
 * Agent capability is 0–1 scaled to 0–100 for comparison.
 * Example: at threshold 35, an agent with cap=0.55 (55) outgrows diff=20 encounters (55-20=35).
 * @range 25–50 (lower = more aggressive retirement) */
export const OUTGROWTH_CAP_THRESHOLD = 55;

/** Whether outgrowth filtering is active. Toggle for tuning.
 * @range boolean */
export const OUTGROWTH_FILTER_ENABLED = true;

// ═══════════════════════════════════════════════════════════════════
// COOLDOWN SCALING — Dynamic cooldowns based on pool size (phaseAgentDecision.ts)
// ═══════════════════════════════════════════════════════════════════

/** Template pool size at which full cooldown applies. Below this, cooldowns scale down.
 * @range 8–30 */
export const COOLDOWN_FULL_POOL_SIZE = 15;

/** Minimum cooldown ticks regardless of pool size.
 * @range 1–4 */
export const COOLDOWN_MINIMUM = 2;

// ═══════════════════════════════════════════════════════════════════
// WORLD POPULATION — Agent count by map size (worldSeed.ts)
// ═══════════════════════════════════════════════════════════════════

/** Agent count range per map size. Actual count is randomized within range via seeded PRNG.
 * Tuning tip: more agents = more social encounters, more co-location, less idle time.
 * Rule of thumb: 1 agent per 20–40 habitable hexes keeps encounter density healthy. */
export const AGENT_COUNT_BY_MAP_SIZE: Record<string, { min: number; max: number }> = {
  small:  { min: 6, max: 10 },   // 20×15 = 300 hexes → ~1 per 30-50 hexes
  medium: { min: 10, max: 16 },  // 32×24 = 768 hexes → ~1 per 48-77 hexes
  large:  { min: 16, max: 24 },  // 48×36 = 1728 hexes → ~1 per 72-108 hexes
  epic:   { min: 24, max: 36 },  // 64×48 = 3072 hexes → ~1 per 85-128 hexes
};

/** Fallback agent count when map size is unknown.
 * @range { min: 8–12, max: 12–20 } */
export const AGENT_COUNT_FALLBACK = { min: 8, max: 12 };

// ═══════════════════════════════════════════════════════════════════
// BORN-LATER SPAWN — Prefer content-rich locations (agentLifecycle.ts)
// ═══════════════════════════════════════════════════════════════════

/** Whether born-later agents prefer spawning at locations with encounter content.
 * @range boolean */
export const BORN_LATER_PREFER_CONTENT_LOCATIONS = true;

/** Minimum encounter templates at a location for it to qualify as a content-rich spawn.
 * @range 1–10 */
export const BORN_LATER_MIN_TEMPLATES = 3;

// ═══════════════════════════════════════════════════════════════════
// DIFFICULTY ESCALATION — Tick-based tier scaling (encounterCache.ts)
// ═══════════════════════════════════════════════════════════════════

/** Ticks before difficulty shifts from early to mid.
 * @range 20–80 */
export const EARLY_GAME_THRESHOLD = 40;

/** Ticks before difficulty shifts from mid to late.
 * @range 60–200 */
export const MID_GAME_THRESHOLD = 120;

/** Multipliers applied to step difficulties per game tier.
 * early = easier encounters, late = harder. */
export const DIFFICULTY_TIER_MULTIPLIERS: Record<string, number> = {
  early: 1.0,
  mid: 1.0,
  late: 1.3,
};

// ═══════════════════════════════════════════════════════════════════
// ENCOUNTER CHAINS — Sequential narrative encounters (encounterChains.ts)
// ═══════════════════════════════════════════════════════════════════

/** One-time capability boost on completing an entire chain.
 * @range 0.02–0.10 */
export const CHAIN_COMPLETION_CAPABILITY_BONUS = 0.05;

/** Flat scoring bonus for the next stage in an active chain.
 * @range 0.05–0.30 */
export const CHAIN_STAGE_SCORE_BONUS = 0.15;

/** Maximum concurrent chain progressions per agent.
 * @range 1–5 */
export const MAX_ACTIVE_CHAINS = 2;

// ═══════════════════════════════════════════════════════════════════
// ENCOUNTER CACHE — Pre-computed scoring data (encounterCache.ts)
// ═══════════════════════════════════════════════════════════════════

/** When dirty-entry count exceeds this, a full rebuild is cheaper than patching.
 * @range 20–100 */
export const CACHE_REBUILD_THRESHOLD = 50;

/** Weight of reputation deltas in reward estimate.
 * @range 0.5–2.0 */
export const REPUTATION_REWARD_WEIGHT = 1.0;

/** Weight of loot availability in reward estimate.
 * @range 0.1–1.0 */
export const LOOT_REWARD_WEIGHT = 0.5;

/** Base weight for domain exercise opportunity.
 * @range 0.1–0.5 */
export const DOMAIN_EXERCISE_WEIGHT = 0.3;

// ═══════════════════════════════════════════════════════════════════
// VIGNETTES — Significance-gated notifications (vignetteNotification.ts)
// ═══════════════════════════════════════════════════════════════════

/** Max Tier 1 notifications per tick.
 * @range 1–5 */
export const VIGNETTE_MAX_PER_TICK = 3;

/** Default minimum threat for Tier 1 vignette classification. */
export const VIGNETTE_THREAT_THRESHOLD = 'hard' as const;

/** Minimum questPriority for Tier 1 vignette classification.
 * @range 1.0–3.0 */
export const VIGNETTE_QUEST_PRIORITY_THRESHOLD = 2.0;

// ═══════════════════════════════════════════════════════════════════
// DIVINE ATTENTION — Focus/attunement/scrying state (divineAttention.ts)
// ═══════════════════════════════════════════════════════════════════

/** Essence cost reduction when attuned.
 * @range 0.1–0.5 */
export const ATTUNE_COST_DISCOUNT = 0.3;

/** How long Scry grants awareness (in ticks).
 * @range 5–20 */
export const SCRY_DURATION_TICKS = 10;

/** How long Divine Focus lasts (in ticks).
 * @range 1–5 */
export const FOCUS_DURATION_TICKS = 3;

/** Bond efficiency bonus during Focus.
 * @range 0.2–0.6 */
export const FOCUS_EFFICIENCY_BOOST = 0.4;

// ═══════════════════════════════════════════════════════════════════
// INTERVENTION COST — Triangular cost curve (interventionCost.ts)
// ═══════════════════════════════════════════════════════════════════

/** Hard cap on probability bonus from divine intervention.
 * @range 0.10–0.30 */
export const INTERVENTION_MAX_BONUS = 0.20;

/** Cost multiplier for opposing spheres.
 * @range 2.0–5.0 */
export const OPPOSING_SPHERE_COST_MULTIPLIER = 3.0;

/** Cost multiplier for unrelated spheres.
 * @range 1.2–2.0 */
export const NEUTRAL_SPHERE_COST_MULTIPLIER = 1.5;

/** Bond efficiency by influence tier (0=unbonded through 4=exalted).
 * @range values 0.1–1.0 per tier */
export const BOND_EFFICIENCY: Record<number, number> = {
  0: 0.2,   // unbonded
  1: 0.4,   // touched
  2: 0.6,   // drawn
  3: 0.8,   // devoted
  4: 0.95,  // exalted
};

// ═══════════════════════════════════════════════════════════════════
// RUINS EXPLORATION — Gated scoring for ruin-seeking behavior
// ═══════════════════════════════════════════════════════════════════

/** Location subtypes that qualify as ruin-type for scoring bonuses. */
export const RUIN_LOCATION_SUBTYPES: ReadonlySet<string> = new Set([
  'ruins', 'ruined_tower', 'ruined_city', 'ruined_village',
  'unexplored_poi', 'ancient_vault',
]);

/** Trait tag that activates ruins scoring bonus on agents.
 * Granted by Adventurers Guild membership, archetypes, or divine action. */
export const RUINS_SEEKER_TRAIT_TAG = 'ruin_seeker';

/** Base scoring bonus for encounters at ruin-type locations (requires ruin_seeker trait).
 * @range 0.10–0.50 */
export const RUINS_TRAIT_BONUS = 0.25;

/** Additional scoring bonus per ruin_seeker trait level.
 * @range 0.05–0.20 */
export const RUINS_TRAIT_BONUS_PER_LEVEL = 0.10;

/** Weight for explorationAttraction hex field set by hex.mark_ground.
 * Applies regardless of trait — direct divine override.
 * @range 0.10–0.50 */
export const EXPLORATION_ATTRACTION_WEIGHT = 0.35;

/** Score boost for Find encounters when agent has divineHunch (from hex.whisper_intuition).
 * Applies regardless of trait — direct divine override.
 * @range 0.10–0.50 */
export const DIVINE_HUNCH_FIND_BONUS = 0.40;

/** Exploration attraction strength written to hex by hex.mark_ground.
 * @range 0.2–1.0 */
export const MARK_GROUND_ATTRACTION_STRENGTH = 0.50;

/** Divine hunch strength written to thread edge by hex.whisper_intuition.
 * @range 0.5–2.0 */
export const WHISPER_INTUITION_HUNCH_STRENGTH = 1.0;

/** Duration in ticks for divine hunch from hex.whisper_intuition.
 * @range 5–30 */
export const WHISPER_INTUITION_DURATION_TICKS = 15;

// ═══════════════════════════════════════════════════════════════════
// REPUTATION TRAITS — Reach-polarity reputation accumulation (phaseReputationTraits.ts)
// ═══════════════════════════════════════════════════════════════════

/** Encounter completions needed for Level 1 ("Whispered") reputation.
 * @range 2–5 */
export const REPUTATION_LEVEL_1_THRESHOLD = 3;

/** Encounter completions needed for Level 2 ("Known") reputation.
 * @range 5–12 */
export const REPUTATION_LEVEL_2_THRESHOLD = 8;

/** Encounter completions needed for Level 3 ("Legendary") reputation.
 * @range 10–25 */
export const REPUTATION_LEVEL_3_THRESHOLD = 15;

/** Tally decay per tick. Active agents outpace this; idle agents lose reputation over time.
 * @range 0.005–0.05 */
export const REPUTATION_TALLY_DECAY_PER_TICK = 0.02;

/** Minimum max tier across all reaches for "Noted" power renown (Level 1).
 * @range 3–5 */
export const REPUTATION_POWER_TIER_NOTED = 4;

/** Minimum max tier for "Renowned" power renown (Level 2).
 * @range 5–7 */
export const REPUTATION_POWER_TIER_RENOWNED = 6;

/** Minimum max tier for "Legendary" power renown (Level 3).
 * @range 7–9 */
export const REPUTATION_POWER_TIER_LEGENDARY = 8;

/** Hex range for Level 1 reputation scope ("Whispered" — local only).
 * @range 0–1 */
export const REPUTATION_SCOPE_LOCAL = 0;

/** Hex range for Level 2 reputation scope ("Known" — regional).
 * @range 2–5 */
export const REPUTATION_SCOPE_REGIONAL = 3;

/** Hex range for Level 3 reputation scope ("Legendary" — world-wide).
 * 99 = effectively unlimited.
 * @range 50–99 */
export const REPUTATION_SCOPE_WORLD = 99;

/** Weight applied to reputation scoring bonus in encounter scoring.
 * @range 0.05–0.3 */
export const REPUTATION_SCORING_WEIGHT = 0.1;

/** Encounter types that heuristically contribute positive reputation polarity. */
export const REPUTATION_POSITIVE_ENCOUNTER_TYPES: ReadonlySet<string> = new Set([
  'assist', 'build', 'create', 'lead',
]);

/** Encounter types that heuristically contribute negative reputation polarity. */
export const REPUTATION_NEGATIVE_ENCOUNTER_TYPES: ReadonlySet<string> = new Set([
  'steal', 'duel',
]);

/** Essence reward per elder magic hidden site discovery.
 * @range 1.0–10.0 */
export const ELDER_SITE_ESSENCE_REWARD = 5.0;

/** Essence reward per non-elder hidden site discovery.
 * @range 0.5–3.0 */
export const HIDDEN_SITE_ESSENCE_REWARD = 2.0;
