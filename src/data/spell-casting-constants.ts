/**
 * Spell-casting constants — the power runtime's tunables (THR-1571, S1).
 *
 * Every number the cast resolver, the strain price, the dispel fix and seeded
 * knowing read lives here (NFP #1). The step-cast constants (S2) and the innate
 * powers (S3) join this file with their slices.
 *
 * Plan doc: Docs/plans/2026-09-29-thr-1571-power-runtime.md § Constants table
 */

import type { StepOutcome } from '../types/unifiedAction';
import type { AttachmentEffect, BacklashEffect } from '../types/effects';
import { CASTER_NPC_ROLES } from './strategic-action-constants';

/**
 * Bands on which a cast's effects apply. `near_miss`, `failure` and
 * `critical_failure` fizzle: the price is paid, nothing lands. The step's (or the
 * undertaking's) own band decides — there is never a second die (lane decision 1).
 */
export const CAST_LANDED_BANDS: readonly StepOutcome[] = ['critical_success', 'success', 'success_at_cost'];

/**
 * When each price layer's backlash may fire, read against the band (§ Resolution
 * logic). `overcost` had no branch before this runtime; it is read as `failure`.
 */
export const BACKLASH_ELIGIBLE_BANDS_BY_TRIGGER: Readonly<Record<BacklashEffect['trigger'], readonly StepOutcome[]>> = {
  // strain — bites when the working slips
  failure: ['near_miss', 'failure', 'critical_failure'],
  // transgression — bites only on disaster
  critical_failure: ['critical_failure'],
  // gamble — can bite on a good day, never on a triumph
  always: ['success_at_cost', 'success', 'near_miss', 'failure', 'critical_failure'],
  // no branch existed; treated as a strain spell's `failure`
  overcost: ['near_miss', 'failure', 'critical_failure'],
};

/** The reach-share loss one strain condition carries (lane decision 4). */
export const STRAIN_PENALTY_SHARE = 0.03;

/** Strain duration per `STRAIN_PENALTY_SHARE` of drain — two days. */
export const STRAIN_TICKS_PER_UNIT = 24;

/** How long a dispelled possession is silenced (lane decision 7 — never deleted). */
export const DISPEL_ITEM_SUPPRESS_TICKS = 24;

/** Spells a caster starts the world knowing and wielding (lane decision 5). */
export const SEEDED_SPELLS_PER_CASTER = 1;

/** A caster whose tradition shelf is empty still starts with the lowest-tier spell. */
export const SEEDED_FALLBACK_TO_CANTRIP = true;

/**
 * Which caster roles are seeded — the over-magicked kill-criterion lever. Default:
 * every caster role. Casters by mastery trait or by Veil are always eligible.
 * **Not** a tier filter: at tick 0, 103 of 104 casters on seed 42 are `ambient`.
 */
export const SEEDED_CASTER_ROLES: readonly string[] = CASTER_NPC_ROLES;

/** The fraction of eligible casters seeded, by a sorted pick on actor id (kill-criterion lever). */
export const SEEDED_SPELL_COVERAGE = 1.0;

/**
 * The stateless primitives a carried (fate-woven) spell may hold (lane decision 6).
 *
 * A spell's definition node is shared by every bearer. Its runtime state is keyed per
 * bearer (the bearing edge — `attachmentStateKey`), so a trigger's cooldown or a seal
 * lands on one mortal only; but the stateful *families* (stacking, decay, charges,
 * durations that destroy on expiry) were built around one attachment owning one node,
 * and their expiry paths can act on the node itself. So a carried spell holds only the
 * primitives below, and a charged `action_trigger` (`maxFires`) is refused as well —
 * see `isCarriedEffectStateless`.
 */
export const CARRIED_EFFECT_ALLOWED_TYPES: readonly AttachmentEffect['type'][] = [
  'passive', 'conditional', 'test_shaper', 'social_modifier', 'aura', 'reveal', 'action_trigger',
  // THR-1572 — four more primitives the generator's cores and prices need, each verified
  // stateless at build: the readers (`effectQueries.getBehaviorWeights`,
  // `getRangeModifiers`) are pure walks over node effects, and `effectTick.tickEffects`
  // writes `axiological_drift` and a `per_tick` `resource_manipulate` straight onto the
  // bearer's own node with no runtime state. A shared node therefore acts per bearer.
  'behavior_weight', 'range_modifier', 'axiological_drift', 'resource_manipulate',
];

/**
 * True when a carried effect is one of the allowed primitives and holds no per-bearer state.
 *
 * Two shapes of an allowed type are still refused:
 * - a charged `action_trigger` (`maxFires`) — one counter for the whole world;
 * - an `action_trigger` whose payload is `self_remove` (THR-1572): that payload deletes the
 *   attachment node and every edge into it (`actionTriggerPayloads.ts`), so on a shared spell
 *   one bearer's bad roll would strip the spell from every bearer in the world;
 * - a `resource_manipulate` that is not a `per_tick` drain or restore of the bearer's own
 *   quintessence or essence — `one_shot` keeps a fired-once state, and a `fight_clock` tick
 *   belongs to a monster's own body, not a carried working.
 */
export function isCarriedEffectStateless(effect: AttachmentEffect): boolean {
  if (!CARRIED_EFFECT_ALLOWED_TYPES.includes(effect.type)) return false;
  if (effect.type === 'action_trigger') return effect.maxFires === undefined && effect.payload.kind !== 'self_remove';
  if (effect.type === 'resource_manipulate') {
    return effect.mode === 'per_tick' && effect.target === 'self' && effect.resource !== 'fight_clock';
  }
  return true;
}

// ─── The step cast (S2, THR-1670) ─────────────────────────────────

/**
 * Below this pre-card probability a neutral mortal reaches for their spell.
 * Deliberately **below** the 50–65% window mortals choose challenges at (THR-1581),
 * so a caster casts only when a step is worse than they would have chosen: a hard
 * step the god imposed, a scene that turned, a fight going badly.
 */
export const CAST_THRESHOLD_BASE = 0.45;

/** A courageous mortal (+1) casts up to 0.55; a prudent one (−1) saves it until 0.35. */
export const CAST_THRESHOLD_COURAGE_SHIFT = 0.10;

/** The clamp. The maximum sits at the window's floor, so no caster casts inside the band they would choose. */
export const CAST_THRESHOLD_MIN = 0.30;
export const CAST_THRESHOLD_MAX = 0.55;

/** The named odds line a step cast adds, by spell tier. */
export const CAST_STEP_BONUS_BY_TIER: Readonly<Record<number, number>> = { 1: 0.04, 2: 0.07, 3: 0.10, 4: 0.13 };

/** The cast bonus for a tier outside the table (fail-soft: the nearest authored tier's). */
export function castStepBonusForTier(tier: number): number {
  const exact = CAST_STEP_BONUS_BY_TIER[tier];
  if (exact !== undefined) return exact;
  return tier < 1 ? CAST_STEP_BONUS_BY_TIER[1] : CAST_STEP_BONUS_BY_TIER[4];
}

/** The mortal's cast threshold for a courage_prudence lean in [-1, 1] (NaN reads as neutral). */
export function castThresholdFor(courage: number): number {
  const lean = Number.isFinite(courage) ? courage : 0;
  const raw = CAST_THRESHOLD_BASE + CAST_THRESHOLD_COURAGE_SHIFT * lean;
  return Math.max(CAST_THRESHOLD_MIN, Math.min(CAST_THRESHOLD_MAX, raw));
}

/**
 * Max tick-cost rise vs the pre-change baseline on `npm run measure:tick-cost`. A
 * closeout gate, not a runtime read. The plan's reserve kill switch
 * (`POWER_UPKEEP_MIN_SPOTLIGHT_TIER`, carried effects walked only for notable bearers)
 * is deliberately not built: S1 measured inside this budget, and a switch nothing
 * reads would be a dead constant. Build it if a later slice goes over.
 */
export const POWER_UPKEEP_TICK_COST_BUDGET_PCT = 5;

// ─── The per-cast channel and the target filter (THR-1683) ─────────

/**
 * How long a landed spell's modifier-only effects (aura, conditional, …) hold on the
 * caster as a cast condition, by spell tier, when no `duration` effect names its own
 * ticks. Before THR-1683 these effects were traced and wrote nothing, so a landed
 * Hollow Crown changed only the one step's odds.
 */
export const CAST_CHANNEL_DEFAULT_TICKS_BY_TIER: Readonly<Record<number, number>> = { 1: 4, 2: 6, 3: 8, 4: 12 };

/** The channel duration for a tier outside the table (fail-soft: the nearest authored tier's). */
export function castChannelTicksForTier(tier: number): number {
  const exact = CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[tier];
  if (exact !== undefined) return exact;
  return tier < 1 ? CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[1] : CAST_CHANNEL_DEFAULT_TICKS_BY_TIER[4];
}

/**
 * Whether an `enemy`-filtered spell may be aimed at a stranger (neither ally nor
 * someone the caster holds a motive against). True: requiring a motive would starve
 * casts in a scene, where the mortal across the table is usually a stranger. The
 * filter's job is to keep a curse off a friend, not to demand a grudge.
 */
export const CAST_ENEMY_FILTER_ADMITS_STRANGERS = true;
