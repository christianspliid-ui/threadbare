/**
 * Target-tier scaling (THR-1073) — the consumer for the authored per-tier ramp.
 *
 * `attachment-tier-content.ts` authors a ramp indexed by the *source* tier an
 * artifact is advancing FROM:
 *
 *   TIER_ADVANCEMENT_ESSENCE_COST = { 1: 4,    2: 8,    3: 14 }
 *   TIER_ADVANCEMENT_DIFFICULTY   = { 1: 0.20, 2: 0.35, 3: 0.50 }
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
 * levels because the two numbers do: `difficulty` is per-step, `essenceCost` is
 * per-template.
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

// ─── Not scaled here: duration ──────────────────────────────────
//
// `TIER_ADVANCEMENT_DURATION[2..3]` is still unconsumed, so a Mythic→Legendary
// rite takes the same 2–3 ticks a Mundane one does. It is deliberately out of
// scope for THR-1073, whose Done-when names cost and difficulty only.
//
// The reason it is not a one-line addition: duration is drawn in
// `createUnifiedAction` (`unifiedActionLifecycle.ts`), which receives the
// template and a target *id* but no graph, and the same is true of the
// next-step draw. Scaling it means threading target state through a constructor
// with call sites across the engine — a wider change than this ticket, and one
// that wants its own pass. Tracked as THR-1100.
