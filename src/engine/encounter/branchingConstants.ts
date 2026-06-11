/**
 * Branching Encounter Reachability — tunable constants (THR-452).
 *
 * Phase A (diagnostic):
 *   BRANCHING_AUDIT_SEEDS, BRANCHING_AUDIT_TICKS
 *   BRANCHING_GATE_MIN_FLOOR, BRANCHING_NEARLY_ELIGIBLE_SAMPLE_SIZE
 *
 * Phase B (curator bias):
 *   BRANCHING_CURATOR_NUDGE_RADIUS, BRANCHING_CURATOR_BIAS_WEIGHT,
 *   BRANCHING_CURATOR_COOLDOWN, BRANCHING_TARGET_FIRE_PER_30T
 */

/** Seeds used for the Phase A diagnostic audit run (3 diverse seeds). */
export const BRANCHING_AUDIT_SEEDS: readonly number[] = [42, 99, 7];

/** Ticks per seed for Phase A audit — 60% longer than KPI baseline; branching matures slower. */
export const BRANCHING_AUDIT_TICKS = 180;

/** Soften lever floor: gate values must remain ≥ 1. Never zero a prerequisite. */
export const BRANCHING_GATE_MIN_FLOOR = 1;

/** Distance-to-eligibility radius. A template is "nearly eligible" when all prereqs are satisfied
 *  except one that is within this many steps of satisfaction (e.g. 1 capability/reputation tier). */
export const BRANCHING_CURATOR_NUDGE_RADIUS = 1;

/** Multiplicative score boost applied by the curator to nearly-eligible branching templates
 *  for threaded agents. Tuned from Phase A evidence; first-guess 1.75× (75% lift). */
export const BRANCHING_CURATOR_BIAS_WEIGHT = 1.75;

/** Ticks before the curator re-boosts the same (agent, template) pair after a selection.
 *  Prevents the curator from fixating on one template for a threaded agent. */
export const BRANCHING_CURATOR_COOLDOWN = 40;

/** Minimum branching fires per 30 ticks per threaded agent — target for Phase B success.
 *  Matches KPI_BRANCHING_FIRE_MIN_PER_30T from kpiConstants.ts. */
export const BRANCHING_TARGET_FIRE_PER_30T = 1;

/** How many agents to sample when computing distance-to-eligibility in Phase A audit. */
export const BRANCHING_NEARLY_ELIGIBLE_SAMPLE_SIZE = 5;

/** When true, branching quest encounters are exempt from the outgrowth filter.
 *  Rationale: branching quests should remain accessible regardless of agent capability
 *  because they mature narrative threads, not just test skill. */
export const BRANCHING_QUEST_SKIP_OUTGROWTH = true;

/** Minimum branching encounters to preserve in the per-agent performance cap stage.
 *  Ensures at least one branching template survives to scoring even when candidates > MAX_SCORED_CANDIDATES. */
export const BRANCHING_CAP_RESERVE = 1;
