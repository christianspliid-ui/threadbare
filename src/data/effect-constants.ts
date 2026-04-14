/**
 * Generic Effect System — tunable constants.
 *
 * Every magic number for the effect system is a named constant here.
 * Changing game feel = changing a number, not rewriting logic.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

// ─── Content Guards ───────────────────────────────────────────────

/** Max effects allowed per attachment template. Prevents combinatorial explosion. */
export const MAX_EFFECTS_PER_ATTACHMENT = 6;

/** Max activatable ability slots per attachment. */
export const MAX_ACTIVATED_ABILITIES_PER_ATTACHMENT = 3;

/** Spell slot limits by tier. Higher tiers = fewer slots. */
export const MAX_SPELLS_KNOWN_PER_TIER: Record<number, number> = {
  1: 5,
  2: 3,
  3: 2,
  4: 1,
};

// ─── Aura & Scope Limits ──────────────────────────────────────────

/** Max hex radius for aura effects. Performance bounded. */
export const AURA_MAX_RADIUS = 2;

/** Max hexes a region-scoped effect can cover. Performance guard. */
export const SCOPE_REGION_MAX_HEXES = 50;

// ─── Cooldown & Timing ────────────────────────────────────────────

/** Floor for cooldown values — prevents zero-cooldown spam. */
export const COOLDOWN_MINIMUM_TICKS = 5;

/** Minimum backlash chance even for trivial spells. */
export const BACKLASH_PROBABILITY_FLOOR = 0.05;

// ─── Stacking ─────────────────────────────────────────────────────

/** Hard cap on stacks regardless of per-effect maxStacks. */
export const STACKING_GLOBAL_CAP = 10;

// ─── Decay ────────────────────────────────────────────────────────

/** How often decay/escalate recalculates (every N ticks). */
export const DECAY_MIN_TICK_INTERVAL = 1;

// ─── Cascade ──────────────────────────────────────────────────────

/** Max depth of nested cascade chains. Prevents infinite loops. */
export const CASCADE_MAX_DEPTH = 3;

/** Max total effects in a single cascade chain. */
export const CASCADE_MAX_EFFECTS = 8;

// ─── Compel ───────────────────────────────────────────────────────

/** Hard cap on compel duration. Prevents indefinite mind control. */
export const COMPEL_MAX_TICKS = 20;

// ─── Spell Cost Caps ──────────────────────────────────────────────

/** Max reach drain from a single spell cast. */
export const SPELL_COST_REACH_DRAIN_CAP = 0.20;

/** Max doom increase from a single spell cast. */
export const DOOM_COST_CAP_PER_CAST = 30;

// ─── Predicate Evaluation ─────────────────────────────────────────

/** Max conditional predicates evaluated per effect. */
export const CONDITIONAL_EVALUATION_CAP = 3;

// ─── Rule Override Limits ─────────────────────────────────────────

/** Max simultaneous rule overrides on one hex. */
export const RULE_OVERRIDE_MAX_PER_HEX = 5;

// ─── Effect Modifier Caps ─────────────────────────────────────────

/**
 * Max total modifier from all effects on a single agent for a single reach.
 * Prevents unbounded stacking from many small effects.
 * @range 0.0–1.0
 */
export const EFFECT_MODIFIER_CAP = 0.30;

/**
 * Max modifier contribution from a single effect.
 * @range 0.0–0.20
 */
export const EFFECT_PER_ITEM_CAP = 0.15;

// ─── Health Thresholds (for conditional predicates) ───────────────

/**
 * Doom/stress threshold above which 'health_low' predicate is true.
 * Expressed as fraction of max doom (0.0–1.0).
 * @range 0.0–1.0
 */
export const HEALTH_LOW_THRESHOLD = 0.70;

/**
 * Doom/stress threshold below which 'health_high' predicate is true.
 * Expressed as fraction of max doom (0.0–1.0).
 * @range 0.0–1.0
 */
export const HEALTH_HIGH_THRESHOLD = 0.30;

// ─── Content Primitives (TB-104 Phase 1B) ────────────────────────

/** Max absolute essence change from a single resource_delta effect. */
export const RESOURCE_DELTA_ESSENCE_CAP = 50;

/** Max absolute quintessence change from a single resource_delta effect. */
export const RESOURCE_DELTA_QUINTESSENCE_CAP = 30;

/** Max absolute doom change from a single resource_delta effect. */
export const RESOURCE_DELTA_DOOM_CAP = 20;

/** Max action_trigger effects per attachment template. */
export const ACTION_TRIGGER_MAX_PER_ATTACHMENT = 2;

/** Default ticks between action_trigger fires when cooldownTicks not specified. */
export const ACTION_TRIGGER_DEFAULT_COOLDOWN = 6;

// ─── Content Primitive: choice_set (TB-128) ──────────────────────

/** Auto-resolve timeout for player choices (ms before auto-picking highest-weight option). */
export const CHOICE_SET_DEFAULT_TIMEOUT_MS = 30_000;

/** Max visible options presented to the player (UX cap; excess options are hidden). */
export const CHOICE_SET_MAX_OPTIONS = 6;

/** Ticks the executor waits before AI auto-resolves (0 = immediate). */
export const CHOICE_SET_AI_RESOLVE_DELAY_TICKS = 0;
