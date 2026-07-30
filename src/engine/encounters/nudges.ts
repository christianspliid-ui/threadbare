/**
 * Nudge Model — hand resolution, forecast contribution, and band riders.
 * THR-773 (WS0 engine substrate).
 *
 * A nudge shifts the odds; it never picks the outcome. Everything here is pure:
 * given a step, a hand of committed ids, and the acting agent's traits, the same
 * inputs produce the same modifiers and the same band mapping, every time.
 *
 * **Zero PRNG draws.** Riders remap an already-resolved `StepOutcome`; they take
 * nothing from any rng stream, so the same seed plus the same nudges yields the
 * same d100 and every downstream stream consumer is untouched.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
 */

import type { WorldGraph } from '../graph';
import type {
  ActionStep,
  NudgeRider,
  StepNudge,
  StepOutcome,
  TraitVariant,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { SphereName } from '../../types/index';
import type { ForecastModifier } from './outcomeForecast';
import {
  NUDGE_RIDER_PRIORITY,
  DIFFICULTY_WORD_BANDS,
  SPHERE_DISCOUNT,
  SPHERE_DISCOUNT_MIN_COST,
} from '../../data/nudge-constants';
import { resolveSettingVariant } from '../fragmentResolution';

/** Source prefix for a nudge's named forecast modifier. */
export const NUDGE_MODIFIER_SOURCE_PREFIX = 'nudge:';
/** Source prefix for a trait variant's named forecast modifier. */
export const TRAIT_MODIFIER_SOURCE_PREFIX = 'trait:';

/** Why a nudge card is not playable right now. */
export type NudgeBlockedCode =
  | 'essence_unavailable'
  | 'sphere_locked'
  | 'unlock_missing'
  | 'trait_missing';

export interface NudgeHandEntry {
  readonly nudge: StepNudge;
  /** Present only on a dimmed card — absent means playable. */
  readonly blocked?: NudgeBlockedCode;
}

export interface NudgeHand {
  readonly playable: readonly NudgeHandEntry[];
  readonly dimmed: readonly NudgeHandEntry[];
  /** Card ids withheld entirely (a trait-only card the agent cannot hold). */
  readonly hidden: readonly string[];
}

export interface NudgeHandContext {
  /** Essence available for the paying sphere (or the pooled total when ungated). */
  readonly availableEssence: (sphere: SphereName | undefined) => number;
  /** Spheres the ascendant can currently draw on. */
  readonly accessibleSpheres: readonly SphereName[];
  /** Template ids the ascendant has unlocked (THR-613 milestone grants). */
  readonly unlockedTemplateIds: ReadonlySet<string>;
  /** Trait ids the acting mortal holds. */
  readonly heldTraits: ReadonlySet<string>;
  /**
   * `SettingClass` of the location the encounter plays out in (THR-884). When set,
   * a card's `fictionBySetting` variant for that class replaces its `fiction` here,
   * at hand assembly — so every downstream reader (the stage adapter, the audit
   * detectors, the meeting model) keeps reading `nudge.fiction` and sees the
   * setting-correct line without threading a new parameter.
   *
   * Absent → cards read exactly as authored (NFP #6).
   */
  readonly settingClass?: string;
  /**
   * THR-885 — is the acting mortal in a group right now? Gates `requiresGroup`
   * cards (The Fellowship). Absent is treated as "not in a group", so a caller
   * that does not know cannot accidentally deal a group card outside one.
   */
  readonly inGroup?: boolean;
  /**
   * THR-885 — is the acting mortal owed at least one live favor? Gates
   * `requiresFavor` cards (The Favor, call variant). Absent ⇒ no favor.
   */
  readonly hasCallableFavor?: boolean;
  /**
   * THR-887 — library card ids this god's repertoire actually holds, from
   * `buildRepertoire`. This is where sphere gating becomes lock/unlock rather
   * than only a discount: an authored option whose `libraryCardId` is not in
   * this set is signed by a sphere the god does not hold, and is withheld.
   *
   * **Absent ⇒ every card passes** (NFP #6), which is what keeps every
   * pre-THR-887 caller — and every authored option with no `libraryCardId` —
   * behaving exactly as it does today.
   */
  readonly repertoireCardIds?: ReadonlySet<string>;
}

/**
 * THR-885 — The Signature. A card whose sphere the ascendant is aligned to costs
 * {@link SPHERE_DISCOUNT} less essence, floored at {@link SPHERE_DISCOUNT_MIN_COST}.
 *
 * Exported because the commit path must charge the same number the hand quoted:
 * `buildNudgeHand` uses it to decide affordability and `totalNudgeCost` uses it to
 * deduct, so a discounted card cannot be shown cheap and billed full.
 *
 * A card with no sphere is common-pool and never discounts.
 */
export function effectiveNudgeCost(
  nudge: Pick<StepNudge, 'sphere' | 'essenceCost'>,
  accessibleSpheres: readonly SphereName[] | undefined,
): number {
  const authored = Math.max(0, nudge.essenceCost);
  if (!nudge.sphere || !accessibleSpheres?.includes(nudge.sphere)) return authored;
  // Never discount an authored-free card up or down — free is a decision.
  if (authored <= 0) return authored;
  return Math.max(SPHERE_DISCOUNT_MIN_COST, authored - SPHERE_DISCOUNT);
}

// ─── Trait variants ──────────────────────────────────────────────────

/**
 * Trait variants that apply to the acting agent, in authored order.
 *
 * Fail-soft: a variant naming a trait the agent does not hold is simply absent
 * from the result — no warn, because not holding a trait is the ordinary case.
 */
export function resolveTraitVariants(
  template: Pick<UnifiedActionTemplate, 'traitVariants'>,
  heldTraits: ReadonlySet<string>,
): readonly TraitVariant[] {
  const variants = template.traitVariants;
  if (!variants || variants.length === 0) return [];
  return variants.filter((v) => heldTraits.has(v.traitId));
}

/**
 * Collect the trait ids an agent holds, via the same `has_trait` walk the
 * `requiredTraits` gate uses. Fail-soft: a missing agent yields an empty set.
 */
export function collectHeldTraitIds(graph: WorldGraph, agentId: string): Set<string> {
  const held = new Set<string>();
  if (!graph.getNode(agentId)) return held;
  for (const edge of graph.getOutgoingEdges(agentId, 'has_trait')) {
    held.add(edge.target);
  }
  return held;
}

// ─── Hand assembly ───────────────────────────────────────────────────

const warnedTemplates = new Set<string>();

function warnOnce(templateId: string, message: string): void {
  const key = `${templateId}:${message}`;
  if (warnedTemplates.has(key)) return;
  warnedTemplates.add(key);
  console.warn(`[nudges] ${templateId}: ${message}`);
}

/** Test seam — clears the one-warn-per-template memo. */
export function resetNudgeWarnings(): void {
  warnedTemplates.clear();
}

/**
 * THR-884 — swap in a card's per-setting-class fiction, if it authored one.
 *
 * Delegates to `resolveSettingVariant`, the same lookup chain `{frag:*}` uses, so a
 * card variant and a template opening cannot disagree about what "no entry for this
 * class" means. Returns the *original object* when nothing applies, which is what
 * keeps un-migrated cards byte-identical (NFP #6) and keeps `===` comparisons in
 * downstream code intact.
 */
function bindSettingFiction(
  nudge: StepNudge,
  settingClass: string | undefined,
  templateId: string,
): StepNudge {
  if (!settingClass || !nudge.fictionBySetting) return nudge;
  const fiction = resolveSettingVariant(
    nudge.fictionBySetting,
    nudge.fiction,
    { setting: settingClass },
    templateId,
    `nudge:${nudge.id}`,
  );
  return fiction === nudge.fiction ? nudge : { ...nudge, fiction };
}

/**
 * Partition a step's authored nudge hand into playable / dimmed / hidden.
 *
 * Trait-gated cards the agent cannot hold are *hidden* rather than dimmed —
 * a card the player can never afford to unlock is noise, not a goal. Every
 * other block reason dims, so the player can see the price of the option.
 *
 * Fail-soft: a step with no `nudges` returns three empty lists (the whole
 * feature is opt-in), and a `traitVariants.addNudgeIds` entry naming no
 * existing card is inert with a single warn.
 */
export function buildNudgeHand(
  step: Pick<ActionStep, 'nudges'>,
  template: Pick<UnifiedActionTemplate, 'id' | 'traitVariants'>,
  context: NudgeHandContext,
): NudgeHand {
  const nudges = step.nudges;
  if (!nudges || nudges.length === 0) {
    return { playable: [], dimmed: [], hidden: [] };
  }

  const byId = new Map(nudges.map((n) => [n.id, n]));
  const variants = resolveTraitVariants(template, context.heldTraits);
  const traitUnlockedIds = new Set<string>();
  for (const variant of variants) {
    for (const id of variant.addNudgeIds ?? []) {
      if (!byId.has(id)) {
        warnOnce(template.id, `traitVariant '${variant.traitId}' adds unknown nudge id '${id}'`);
        continue;
      }
      traitUnlockedIds.add(id);
    }
  }

  const playable: NudgeHandEntry[] = [];
  const dimmed: NudgeHandEntry[] = [];
  const hidden: string[] = [];

  for (const authored of nudges) {
    // THR-884 — bind the card's per-setting fiction once, before partitioning, so
    // playable and dimmed cards read identically. Identity is preserved when the
    // card authored no variants: no spread, no new object, no behavior change.
    const nudge = bindSettingFiction(authored, context.settingClass, template.id);
    // Trait-only card: held trait or a variant that unlocked it, else hidden.
    if (nudge.requiredTrait
      && !context.heldTraits.has(nudge.requiredTrait)
      && !traitUnlockedIds.has(nudge.id)) {
      hidden.push(nudge.id);
      continue;
    }

    // THR-885 — world-state gates. These *hide* rather than dim, for the same
    // reason `requiredTrait` does: the player cannot make themselves in a group,
    // or owed a favor, from inside the encounter, so showing the price is noise.
    if (nudge.requiresGroup && !context.inGroup) {
      hidden.push(nudge.id);
      continue;
    }

    if (nudge.requiresFavor && !context.hasCallableFavor) {
      hidden.push(nudge.id);
      continue;
    }

    if (nudge.requiredUnlock && !context.unlockedTemplateIds.has(nudge.requiredUnlock)) {
      dimmed.push({ nudge, blocked: 'unlock_missing' });
      continue;
    }

    if (nudge.sphere && !context.accessibleSpheres.includes(nudge.sphere)) {
      dimmed.push({ nudge, blocked: 'sphere_locked' });
      continue;
    }

    // THR-887 — the repertoire gate. Checked *after* the per-encounter sphere
    // check because they answer different questions: that one asks whether the
    // god can pay in this sphere right now, this one whether the god owns the
    // card at all. `sphere_locked` is the right code for both — the stage
    // withholds it and the designer view still lists it.
    if (
      context.repertoireCardIds
      && nudge.libraryCardId
      && !context.repertoireCardIds.has(nudge.libraryCardId)
    ) {
      dimmed.push({ nudge, blocked: 'sphere_locked' });
      continue;
    }

    // THR-885 — the discounted price is the price. Quoting the authored cost here
    // and charging the discounted one at commit (or the reverse) is the bug this
    // shared helper exists to make impossible.
    const cost = effectiveNudgeCost(nudge, context.accessibleSpheres);
    if (context.availableEssence(nudge.sphere) + 1e-9 < cost) {
      dimmed.push({ nudge, blocked: 'essence_unavailable' });
      continue;
    }

    playable.push({ nudge });
  }

  return { playable, dimmed, hidden };
}

// ─── Forecast contribution ───────────────────────────────────────────

/**
 * Named forecast modifiers contributed by the committed nudges and by any trait
 * variants that apply. The forecast pipeline already sums named modifiers
 * (`computeForecast`), so this only has to name them.
 *
 * Fail-soft: an `activeNudges` id with no matching authored card is skipped.
 */
export function collectNudgeModifiers(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
  variants: readonly TraitVariant[] = [],
): ForecastModifier[] {
  const modifiers: ForecastModifier[] = [];

  if (activeNudgeIds && activeNudgeIds.length > 0 && step.nudges) {
    const byId = new Map(step.nudges.map((n) => [n.id, n]));
    for (const id of activeNudgeIds) {
      const nudge = byId.get(id);
      if (!nudge) continue;
      modifiers.push({ source: `${NUDGE_MODIFIER_SOURCE_PREFIX}${id}`, delta: nudge.forecastDelta });
    }
  }

  for (const variant of variants) {
    if (variant.forecastDelta === undefined || variant.forecastDelta === 0) continue;
    modifiers.push({
      source: `${TRAIT_MODIFIER_SOURCE_PREFIX}${variant.traitId}`,
      delta: variant.forecastDelta,
    });
  }

  return modifiers;
}

/** Sum of a modifier list — the single additive term resolution consumes. */
export function sumModifiers(modifiers: readonly ForecastModifier[]): number {
  return modifiers.reduce((total, m) => total + m.delta, 0);
}

/** Total difficulty delta from applying trait variants (negative eases the step). */
export function sumVariantDifficultyDelta(variants: readonly TraitVariant[]): number {
  return variants.reduce((total, v) => total + (v.difficultyDelta ?? 0), 0);
}

// ─── Band riders ─────────────────────────────────────────────────────

/**
 * Rider remaps, defined over the **full six-value `StepOutcome` domain** so
 * every input is deterministic and no case falls through by accident.
 *
 * `floor_at_cost` floors `near_miss` alongside `failure`: a near miss is a
 * failure texture, and floors with it.
 */
const RIDER_MAPS: Readonly<Record<NudgeRider, Readonly<Record<StepOutcome, StepOutcome>>>> = {
  no_crit_fail: {
    critical_success: 'critical_success',
    success: 'success',
    success_at_cost: 'success_at_cost',
    near_miss: 'near_miss',
    failure: 'failure',
    critical_failure: 'failure',
  },
  floor_at_cost: {
    critical_success: 'critical_success',
    success: 'success',
    success_at_cost: 'success_at_cost',
    near_miss: 'success_at_cost',
    failure: 'success_at_cost',
    critical_failure: 'critical_failure',
  },
  /**
   * The Gambit (THR-885) — widen both ends. Every non-critical band steps one
   * further from the middle; the crits are already at the ends and pass through.
   *
   * `success_at_cost` widens *upward* to `success` (the cost is what falls away)
   * and `near_miss` widens *downward* to `failure`, which is the pairing that
   * keeps the map symmetric: the two middle bands move apart, not both up.
   */
  all_or_nothing: {
    critical_success: 'critical_success',
    success: 'critical_success',
    success_at_cost: 'success',
    near_miss: 'failure',
    failure: 'critical_failure',
    critical_failure: 'critical_failure',
  },
};

/**
 * The single rider that applies, given the committed hand. Strongest wins per
 * `NUDGE_RIDER_PRIORITY` — riders never stack.
 *
 * Fail-soft: an unrecognised rider value is ignored with one warn per template.
 */
export function selectActiveRider(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
  templateId: string,
): NudgeRider | undefined {
  if (!activeNudgeIds || activeNudgeIds.length === 0 || !step.nudges) return undefined;

  const byId = new Map(step.nudges.map((n) => [n.id, n]));
  const present = new Set<NudgeRider>();
  for (const id of activeNudgeIds) {
    const rider = byId.get(id)?.rider;
    if (!rider) continue;
    if (!(rider in RIDER_MAPS)) {
      warnOnce(templateId, `unknown nudge rider '${String(rider)}' — ignored`);
      continue;
    }
    present.add(rider);
  }

  return NUDGE_RIDER_PRIORITY.find((rider) => present.has(rider));
}

/**
 * Apply a rider to a resolved outcome. Pure band-mapping — **no rng draw**.
 * Returns the input unchanged when no rider is active.
 */
export function applyRider(outcome: StepOutcome, rider: NudgeRider | undefined): StepOutcome {
  if (!rider) return outcome;
  return RIDER_MAPS[rider][outcome] ?? outcome;
}

// ─── Prose + display ─────────────────────────────────────────────────

/**
 * Band prose contributed by the committed nudges for the resolved outcome, in
 * authored order. Appended to the step's prose by the caller.
 */
export function collectNudgeBandProse(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
  outcome: StepOutcome,
): string[] {
  if (!activeNudgeIds || activeNudgeIds.length === 0 || !step.nudges) return [];
  const byId = new Map(step.nudges.map((n) => [n.id, n]));
  const lines: string[] = [];
  for (const id of activeNudgeIds) {
    const line = byId.get(id)?.bandProse?.[outcome];
    if (line) lines.push(line);
  }
  return lines;
}

/** Step difficulty → display word. Words only, never the number. */
export function difficultyWord(difficulty: number): string {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(difficulty) ? difficulty : 0));
  for (const band of DIFFICULTY_WORD_BANDS) {
    if (clamped >= band.min) return band.word;
  }
  return DIFFICULTY_WORD_BANDS[DIFFICULTY_WORD_BANDS.length - 1].word;
}

/**
 * Total essence a committed hand costs — what the commit path must deduct.
 *
 * `accessibleSpheres` is optional so every pre-THR-885 caller keeps charging the
 * authored price unchanged (NFP #6). Pass it wherever the hand was *built* with
 * spheres, or the player is quoted a discount they never receive.
 */
export function totalNudgeCost(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
  accessibleSpheres?: readonly SphereName[],
): number {
  if (!activeNudgeIds || activeNudgeIds.length === 0 || !step.nudges) return 0;
  const byId = new Map(step.nudges.map((n) => [n.id, n]));
  return activeNudgeIds.reduce((total, id) => {
    const nudge = byId.get(id);
    if (!nudge) return total;
    return total + effectiveNudgeCost(nudge, accessibleSpheres);
  }, 0);
}
