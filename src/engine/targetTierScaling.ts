/**
 * Target-tier scaling (THR-1073) — the consumer for the authored per-tier ramp.
 *
 * `attachment-tier-content.ts` authors a ramp indexed by the *source* tier an
 * artifact is advancing FROM:
 *
 *   TIER_ADVANCEMENT_ESSENCE_COST = { 1: 4,    2: 8,    3: 14 }
 *   TIER_ADVANCEMENT_DIFFICULTY   = { 1: 0.20, 2: 0.35, 3: 0.50 }
 *   TIER_ADVANCEMENT_DURATION     = { 1: 2–3,  2: 3–4,  3: 4–6 }   (THR-1100)
 *
 * Until this module, only the tier-1 entries had a consumer. A
 * `UnifiedActionTemplate` step is static — it cannot read the *target's* current
 * tier at offer or resolve time — so `artifact.enchant` and `artifact.empower`
 * baked `[1]` into the template and every advancement, Mundane→Storied through
 * Mythic→Legendary, cost 4 essence at difficulty 0.20 (THR-996 deferred the fix
 * here rather than hard-coding a ramp inside the graph op).
 *
 * ## Why a declarative marker rather than a function field
 *
 * THR-1073 offered `difficultyFrom: (target) => …` as the general shape. A
 * function cannot be used here: templates are serialized to
 * `public/action-catalog.generated.json` by `generate-action-catalog`, where a
 * function field silently becomes `undefined` — the catalog and the running game
 * would then disagree about the price, which is exactly the class of drift the
 * generated catalog exists to prevent. It would also put behaviour in a data
 * file, against the determinism contract (NFP #3).
 *
 * So this follows the precedent already in the codebase: `step.difficultyContext`
 * (`'intel_sensitive'`) is a declarative enum the resolver reads to make a step's
 * difficulty depend on world state. `'target_tier_scaled'` joins it, and
 * `essenceCostContext` mirrors it one level up — the two markers sit at different
 * levels because the two numbers do: `difficulty` and `duration` are per-step,
 * `essenceCost` is per-template. THR-1100 added the duration reader under the
 * per-step marker rather than minting a third one; see {@link tierScaledDuration}.
 *
 * ## NFP #1 — no tuning number lives here
 *
 * Every number returned is read from `attachment-tier-content.ts`. The clamp
 * bounds are derived from that table's own keys, not written as literals, so
 * re-authoring the ramp (adding a tier, changing a price) needs no edit in this
 * file.
 */

import {
  TIER_ADVANCEMENT_ESSENCE_COST,
  TIER_ADVANCEMENT_DIFFICULTY,
  TIER_ADVANCEMENT_DURATION,
} from '../data/attachment-tier-content';
import type { ActionStep, UnifiedActionTemplate } from '../types/unifiedAction';

/** Source tiers the authored ramp covers — derived from the table, never literal. */
export type SourceTier = keyof typeof TIER_ADVANCEMENT_ESSENCE_COST;

const AUTHORED_SOURCE_TIERS: readonly SourceTier[] = Object.keys(TIER_ADVANCEMENT_ESSENCE_COST)
  .map(Number)
  .sort((a, b) => a - b) as readonly SourceTier[];

const MIN_SOURCE_TIER = AUTHORED_SOURCE_TIERS[0];
const MAX_SOURCE_TIER = AUTHORED_SOURCE_TIERS[AUTHORED_SOURCE_TIERS.length - 1];

/**
 * The tier an artifact would advance FROM, clamped into the authored ramp.
 *
 * Fail-soft in three directions, because this runs on the offer path where a
 * throw would take the drawer down (NFP #4):
 *
 * - missing / non-numeric `tier` → the ramp's first entry, matching
 *   `advanceAttachmentTier`, which defaults an untiered artifact to tier 1;
 * - a tier above the ramp (Legendary, 4) → the last authored entry. Such an
 *   artifact cannot advance at all — `advanceAttachmentTier` refuses it with
 *   `already_max_tier` — so this price is never actually charged; clamping only
 *   guarantees the card shows the dearest authored price rather than `NaN`;
 * - a tier below the ramp → the first entry.
 */
export function sourceTierOf(properties: Readonly<Record<string, unknown>> | undefined): SourceTier {
  const raw = properties?.tier;
  if (typeof raw !== 'number' || Number.isNaN(raw)) return MIN_SOURCE_TIER;
  const floored = Math.floor(raw);
  if (floored <= MIN_SOURCE_TIER) return MIN_SOURCE_TIER;
  if (floored >= MAX_SOURCE_TIER) return MAX_SOURCE_TIER;
  return floored as SourceTier;
}

/** True when this template prices itself from the target's attachment tier. */
export function isTierScaledCost(template: Pick<UnifiedActionTemplate, 'essenceCostContext'>): boolean {
  return template.essenceCostContext === 'target_tier_scaled';
}

/** True when this step rolls against a difficulty derived from the target's tier. */
export function isTierScaledDifficulty(step: Pick<ActionStep, 'difficultyContext'>): boolean {
  return step.difficultyContext === 'target_tier_scaled';
}

/**
 * Essence price of `template` against a target with `targetProperties`.
 *
 * Returns the template's authored `essenceCost` unchanged unless the template
 * opts in via `essenceCostContext: 'target_tier_scaled'`, so every other action
 * in the catalog is untouched by this path.
 */
export function tierScaledEssenceCost(
  template: Pick<UnifiedActionTemplate, 'essenceCost' | 'essenceCostContext'>,
  targetProperties: Readonly<Record<string, unknown>> | undefined,
): number {
  if (!isTierScaledCost(template)) return template.essenceCost ?? 0;
  return TIER_ADVANCEMENT_ESSENCE_COST[sourceTierOf(targetProperties)];
}

/**
 * Step difficulty of `step` against a target with `targetProperties`.
 *
 * Returns the step's authored `difficulty` unchanged unless the step opts in via
 * `difficultyContext: 'target_tier_scaled'`.
 */
export function tierScaledDifficulty(
  step: Pick<ActionStep, 'difficulty' | 'difficultyContext'>,
  targetProperties: Readonly<Record<string, unknown>> | undefined,
): number {
  if (!isTierScaledDifficulty(step)) return step.difficulty;
  return TIER_ADVANCEMENT_DIFFICULTY[sourceTierOf(targetProperties)];
}

/**
 * Duration range of `step` against a target with `targetProperties` (THR-1100).
 *
 * Returns the step's authored `duration` unchanged unless the step opts in via
 * `difficultyContext: 'target_tier_scaled'` — the *same* marker that scales the
 * difficulty roll, not a third one. That is deliberate: `ActionStep.difficultyContext`
 * has documented itself as covering "difficulty *and* duration" since THR-1073,
 * because both numbers are per-step and both are indexed by the same source tier.
 * Only the duration half was never implemented, so this closes a doc/behaviour
 * drift rather than widening the vocabulary a template author has to learn.
 *
 * THR-1073 deferred this because the draw happens in `createUnifiedAction`, which
 * took a target *id* and no graph. The fix was to give it the target's properties
 * — the same `graph.getNode(targetId)?.properties` the cost and difficulty seams
 * already read — rather than to thread a whole `WorldGraph` through a constructor.
 *
 * Fail-soft (NFP #4): an absent `targetProperties` clamps to the ramp's first
 * entry via {@link sourceTierOf}, so a caller with no graph in reach draws the
 * tier-1 range — exactly today's behaviour, never a throw or a `NaN` duration.
 */
export function tierScaledDuration(
  step: Pick<ActionStep, 'duration' | 'difficultyContext'>,
  targetProperties: Readonly<Record<string, unknown>> | undefined,
): { readonly min: number; readonly max: number } {
  if (!isTierScaledDifficulty(step)) return step.duration;
  return TIER_ADVANCEMENT_DURATION[sourceTierOf(targetProperties)];
}
