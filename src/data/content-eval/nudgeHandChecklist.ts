/**
 * The WS1 hand checklist as a pure function. THR-838 (WS5 Batch 1).
 *
 * `nudgeModel.test.ts` § *WS1 golden exemplar* encoded these rules as a dozen
 * `it(...)` blocks reading `NUDGE_GOLDEN_EXEMPLAR` directly. That made the
 * exemplar the only thing the checklist could ever be run against — which was
 * correct while the exemplar was the only nudge-bearing template in the repo,
 * and stops being correct the moment WS5 migrates real content. A rule that can
 * only be checked against the reference implementation does not gate the
 * content it was written for.
 *
 * So the rules live here, over an arbitrary template, and both consumers use it:
 * the exemplar test (unchanged in meaning) and the per-batch migration test.
 *
 * Warn-level by design — these are *authoring* guardrails, not runtime clamps
 * (see `nudgeAuthoringConstants.ts` § "What these are NOT"). The renderer draws
 * whatever `NudgeHand.playable` contains. What this function produces is a list
 * of violations for a human or a test to act on.
 *
 * Authoring-time only: nothing under `src/components/**`, `src/engine/**`
 * (outside tests), or the tick loop may import it.
 */

import type {
  ActionStep,
  StepNudge,
  StepOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { runnableStepSites } from '../../types/unifiedAction';
import {
  ALL_BAND_OUTCOMES,
  FACTOR_LINES_MAX,
  FAILURE_BAND_OUTCOMES,
  HAND_COMMON_OPTIONS_MIN,
  HAND_SPHERE_COVERAGE_MIN,
  NUDGE_BIG_DELTA,
  NUDGE_HAND_MAX,
  NUDGE_HAND_MAX_TOTAL_DELTA,
  NUDGE_HAND_MIN,
  NUDGE_NAME_MAX_WORDS,
  NUDGE_OFF_REACH_MAX_DIFFICULTY,
  NUDGE_WORD_BUDGETS,
  OPEN_DRAW_ATTENTION_TIER,
  REACH_PURPOSE_MAX_WORDS,
} from './nudgeAuthoringConstants';

/** A step carrying an authored hand. A step without `nudges` is opt-out, not a violation. */
type NudgeBearingStep = ActionStep & { nudges: readonly StepNudge[] };

function isNudgeBearing(step: unknown): step is NudgeBearingStep {
  const s = step as ActionStep;
  return Array.isArray(s?.nudges) && s.nudges.length > 0;
}

/**
 * THR-1247 — validation for a step whose hand is *composed* rather than wholly
 * authored: 0–2 encounter specials plus a fill declared by `deal`.
 *
 * ─── What can and cannot be checked statically ──────────────────────
 * The dealt half is a function of the *god's repertoire*, which does not exist
 * at authoring time — a darkness god and an order god get different fills from
 * the identical declaration, by design. So the rules below check the half the
 * author controls and the *shape* of what they asked for, and deliberately do
 * not attempt to predict a hand:
 *
 * - the declaration is coherent (a positive count that leaves the composed hand
 *   inside the hand window);
 * - the specials are genuinely special — 0–2 of them, not a full authored hand
 *   with a fill bolted on;
 * - every authored special still obeys every per-card rule (failure-band
 *   fragment, no digits in the effect line, name budget, and the rest), because
 *   those are the author's to satisfy whatever the dealer adds;
 * - band coverage is **not** required of the specials alone. That rule exists so
 *   a hand pays off at every band, and on a composed step the dealt cards carry
 *   most of that load through `BAND_FRAGMENTS` — holding two specials to it
 *   would force authors to write six bands per card for a hand of six, which is
 *   the exact cost this design removes.
 *
 * The plan's kill criterion applies here: if a declared deal turns out not to be
 * statically checkable at all, the declaration schema is under-specified and the
 * design re-opens rather than the gate weakening.
 */
export const DEAL_MAX_AUTHORED_SPECIALS = 2;

/** A step that composes its hand: a `deal` declaration, with or without specials. */
type DealBearingStep = ActionStep & { deal: NonNullable<ActionStep['deal']> };

function isDealBearing(step: unknown): step is DealBearingStep {
  return (step as ActionStep)?.deal !== undefined;
}

/** A runnable step carrying a hand or a fill, with the label naming where it sits. */
interface BearingSite<T extends ActionStep> {
  readonly step: T;
  /** `step 2`, or `step 2 variant 'positive'` — a *position*, never a filtered index. */
  readonly label: string;
}

/**
 * Every runnable step declaring a fill — branch arms included (THR-1273).
 *
 * A branch node declares no `deal` of its own, so filtering `template.steps`
 * directly dropped the arms where a fork's composed hand actually lives.
 */
export function dealBearingSites(
  template: UnifiedActionTemplate,
): BearingSite<DealBearingStep>[] {
  const out: BearingSite<DealBearingStep>[] = [];
  for (const { step, label } of runnableStepSites(template.steps)) {
    if (isDealBearing(step)) out.push({ step, label });
  }
  return out;
}

/** Plain-step view of {@link dealBearingSites}, for callers that need no label. */
export function dealBearingSteps(template: UnifiedActionTemplate): DealBearingStep[] {
  return dealBearingSites(template).map(site => site.step);
}

/**
 * Composed-hand rules for every step of `template` that declares a `deal`.
 *
 * Returns `[]` for a template with no declaration — which is every shipped
 * template, so this adds nothing to the corpus's current verdict.
 */
export function checkComposedHand(template: UnifiedActionTemplate): string[] {
  const violations: string[] = [];

  // Sites, not `indexOf` (THR-1273): a branch arm is not an element of
  // `template.steps`, so the old lookup returned -1 and every composed-hand
  // violation on a fork would have read `step -1`.
  for (const { step, label } of dealBearingSites(template)) {
    const where = `${template.id} ${label} (${step.reach})`;
    const specials = step.nudges ?? [];
    const { count, tags, exclude } = step.deal;

    if (!Number.isFinite(count) || count <= 0) {
      violations.push(`${where}: deal.count is ${String(count)} — declare a positive fill or drop the declaration`);
    }
    if (specials.length + count > NUDGE_HAND_MAX) {
      violations.push(
        `${where}: ${specials.length} specials + fill of ${count} = ${specials.length + count}, over NUDGE_HAND_MAX ${NUDGE_HAND_MAX}`,
      );
    }
    if (specials.length + count < NUDGE_HAND_MIN) {
      violations.push(
        `${where}: ${specials.length} specials + fill of ${count} = ${specials.length + count}, under NUDGE_HAND_MIN ${NUDGE_HAND_MIN}`,
      );
    }
    if (specials.length > DEAL_MAX_AUTHORED_SPECIALS) {
      violations.push(
        `${where}: ${specials.length} authored specials, over DEAL_MAX_AUTHORED_SPECIALS ${DEAL_MAX_AUTHORED_SPECIALS}`
        + ' — a composed hand authors only what this encounter alone could offer',
      );
    }
    // A duplicate tag is not a scoring bug (the dealer counts matches, so a
    // repeat would silently double a card's weight) but it is always a typo.
    const seen = new Set<string>();
    for (const tag of tags ?? []) {
      if (seen.has(tag)) violations.push(`${where}: deal.tags repeats '${tag}'`);
      seen.add(tag);
    }
    if (exclude && exclude.length > 0 && specials.length === 0 && count > 0) {
      // Advisory in substance, a violation in form: a step that excludes types
      // and authors nothing is describing a hand by subtraction, which is the
      // shape the plan warns reads as "this step wants an authored hand".
      if (exclude.length > DEAL_MAX_AUTHORED_SPECIALS) {
        violations.push(
          `${where}: excludes ${exclude.length} types with no authored special`
          + ' — author the hand instead of describing it by subtraction',
        );
      }
    }
  }

  return violations;
}

/** Plain `ActionStep`s only — branching variants are out of scope for linear templates. */
/**
 * Every runnable step carrying an authored hand — branch arms included (THR-1273).
 *
 * A branch node has no `nudges`, so filtering `template.steps` directly meant a
 * fork's arms — each of which authors its own hand — were never handed to a
 * single WS1 rule, and a fork whose only hands sat on its arms reported the
 * `no-hand` violation as if it had none at all.
 */
export function nudgeBearingSites(
  template: UnifiedActionTemplate,
): BearingSite<NudgeBearingStep>[] {
  const out: BearingSite<NudgeBearingStep>[] = [];
  for (const { step, label } of runnableStepSites(template.steps)) {
    if (isNudgeBearing(step)) out.push({ step, label });
  }
  return out;
}

/** Plain-step view of {@link nudgeBearingSites}, for callers that need no label. */
export function nudgeBearingSteps(template: UnifiedActionTemplate): NudgeBearingStep[] {
  return nudgeBearingSites(template).map(site => site.step);
}

function words(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

/**
 * Run every WS1 hand rule over one template.
 *
 * Returns a violation list, most-structural first. Empty ⇒ the template
 * satisfies the checklist. A template with no nudge-bearing step returns the
 * single `no-hand` violation rather than passing vacuously — a checklist that
 * reports PASS over an empty population is the failure mode this project has
 * hit repeatedly.
 */
export function checkNudgeHand(template: UnifiedActionTemplate): string[] {
  const violations: string[] = [];
  // Sites, not bare steps: once branch arms are walked (THR-1273) a filtered
  // index no longer names a position — two arms of one fork would both report as
  // consecutive "step N"s that exist nowhere in the authored file.
  const steps = nudgeBearingSites(template);

  if (steps.length === 0) {
    // THR-1247 — a step may compose its hand entirely from the Repertoire, with
    // no authored special at all. That is a legal shape, not an empty template,
    // so it is handed to `checkComposedHand` rather than reported as no-hand.
    if (dealBearingSteps(template).length > 0) return [];
    return [`${template.id}: no nudge-bearing step — nothing to check`];
  }

  for (const { step, label } of steps) {
    const where = `${template.id} ${label} (${step.reach})`;
    const hand = step.nudges;
    // THR-1247 — on a composed step the authored cards are *specials*, not the
    // hand. The whole-hand rules below (size, delta budget, sphere spread,
    // common-option floor, band coverage) are about the hand the player is
    // dealt, and most of that hand does not exist until the deal runs — so they
    // are owned by `checkComposedHand` here, and the per-card rules further
    // down still apply to every special.
    const composed = step.deal !== undefined;

    // ─── Hand shape ───────────────────────────────────────────────
    // Skipped wholesale on a composed step — see `composed` above.
    if (!composed) {
      if (hand.length < NUDGE_HAND_MIN || hand.length > NUDGE_HAND_MAX) {
        violations.push(
          `${where}: hand of ${hand.length}, outside ${NUDGE_HAND_MIN}–${NUDGE_HAND_MAX}`,
        );
      }

      const totalDelta = hand.reduce((sum, n) => sum + n.forecastDelta, 0);
      if (totalDelta > NUDGE_HAND_MAX_TOTAL_DELTA + 1e-9) {
        violations.push(
          `${where}: hand sums to ${totalDelta.toFixed(2)}, over NUDGE_HAND_MAX_TOTAL_DELTA ${NUDGE_HAND_MAX_TOTAL_DELTA}`,
        );
      }

      const spheres = new Set(hand.map(n => n.sphere).filter(Boolean));
      if (spheres.size < HAND_SPHERE_COVERAGE_MIN) {
        violations.push(
          `${where}: spans ${spheres.size} spheres, under HAND_SPHERE_COVERAGE_MIN ${HAND_SPHERE_COVERAGE_MIN}`,
        );
      }

      const common = hand.filter(n => n.sphere === undefined);
      if (common.length < HAND_COMMON_OPTIONS_MIN) {
        violations.push(
          `${where}: ${common.length} common (sphere-less) options, under HAND_COMMON_OPTIONS_MIN ${HAND_COMMON_OPTIONS_MIN}`,
        );
      }

      // ─── Band coverage ──────────────────────────────────────────
      const covered = new Set<StepOutcome>();
      for (const nudge of hand) {
        for (const band of Object.keys(nudge.bandProse ?? {}) as StepOutcome[]) covered.add(band);
      }
      for (const band of ALL_BAND_OUTCOMES) {
        if (!covered.has(band)) violations.push(`${where}: never pays off the ${band} band`);
      }
    }

    for (const nudge of hand) {
      const bands = Object.keys(nudge.bandProse ?? {}) as StepOutcome[];
      if (!bands.some(b => FAILURE_BAND_OUTCOMES.includes(b))) {
        violations.push(
          `${where}: ${nudge.id} has no failure-band fragment — the god's hand must be traceable in failure`,
        );
      }
      if (nudge.forecastDelta >= NUDGE_BIG_DELTA) {
        if (!nudge.bandProse?.failure) {
          violations.push(`${where}: ${nudge.id} (big delta) lacks a failure fragment`);
        }
        if (!nudge.bandProse?.critical_failure) {
          violations.push(`${where}: ${nudge.id} (big delta) lacks a critical_failure fragment`);
        }
      }
      if (nudge.essenceCost < 0) {
        violations.push(`${where}: ${nudge.id} has a negative essence cost`);
      }
      if (nudge.requiredTrait !== undefined && nudge.essenceCost !== 0) {
        violations.push(
          `${where}: ${nudge.id} is trait-gated but costs ${nudge.essenceCost} — the price was paid by being that person`,
        );
      }
      if (words(nudge.name) > NUDGE_NAME_MAX_WORDS) {
        violations.push(
          `${where}: ${nudge.id} name is ${words(nudge.name)} words, over NUDGE_NAME_MAX_WORDS ${NUDGE_NAME_MAX_WORDS}`,
        );
      }
      // Ruling 1: the numbers exist behind the words and stay there.
      if (/\d/u.test(nudge.effectLine)) {
        violations.push(`${where}: ${nudge.id} effectLine carries a digit — words only`);
      }
    }

    // ─── Test panel (THR-820) ─────────────────────────────────────
    if (step.purposeLine === undefined || step.purposeLine.trim() === '') {
      violations.push(`${where}: no purposeLine`);
    } else if (words(step.purposeLine) > REACH_PURPOSE_MAX_WORDS) {
      violations.push(
        `${where}: purposeLine is ${words(step.purposeLine)} words, over REACH_PURPOSE_MAX_WORDS ${REACH_PURPOSE_MAX_WORDS}`,
      );
    }

    // The variance rule (Christian, 2026-07-30): factor lines report state
    // that could have been otherwise — agent, hex, global modifiers, earlier
    // steps — all of which the panel derives. New content authors NO static
    // factorLines; a line true on every run is priced into `difficulty` and
    // belongs in the prose. The floor this block used to enforce
    // (FACTOR_LINES_MIN) is retired for authoring; the cap and the both-signs
    // rule still bind the un-migrated templates that carry authored lines.
    const factorLines = step.factorLines ?? [];
    if (factorLines.length > FACTOR_LINES_MAX) {
      violations.push(
        `${where}: ${factorLines.length} factor lines, over FACTOR_LINES_MAX ${FACTOR_LINES_MAX}`,
      );
    }
    if (factorLines.length >= 2) {
      const polarities = new Set(factorLines.map(l => l.polarity));
      if (polarities.size < 2) {
        violations.push(
          `${where}: factor lines all cut '${[...polarities][0]}' — a weighing needs both signs`,
        );
      }
    }

    // ─── Carryover lines (THR-892) ────────────────────────────────
    // The one authored factor surface besides trait lines that survives the
    // variance rule, because it is keyed on a band the run actually rolled.
    //
    // Budgets, not requirements: a step may author none (the first step of an
    // encounter has no predecessor, so a carryover map there is dead by
    // construction). What is checked is that a declared line is *usable* —
    // within the word budget, and not so large it swamps the hand.
    const carryoverEntries = Object.entries(step.carryoverFactorLines ?? {}) as
      ReadonlyArray<[StepOutcome, { text: string; forecastDelta?: number }]>;
    // Position in the *template's* step list, not in the nudge-bearing subset —
    // a template whose step 0 authors no hand would otherwise make its step 1
    // look like the head of the encounter.
    const templateStepIndex = (template.steps ?? []).indexOf(step);
    if (templateStepIndex === 0 && carryoverEntries.length > 0) {
      violations.push(
        `${where}: authors carryoverFactorLines on the first step, which has no prior outcome to key off`,
      );
    }
    for (const [outcome, line] of carryoverEntries) {
      if (!line?.text || line.text.trim() === '') {
        violations.push(`${where}: carryover line for '${outcome}' has no text`);
        continue;
      }
      if (words(line.text) > NUDGE_WORD_BUDGETS.factorLine) {
        violations.push(
          `${where}: carryover line for '${outcome}' is ${words(line.text)} words, over ${NUDGE_WORD_BUDGETS.factorLine}`,
        );
      }
      const delta = Math.abs(line.forecastDelta ?? 0);
      if (delta > NUDGE_BIG_DELTA) {
        violations.push(
          `${where}: carryover line for '${outcome}' moves ${delta}, over NUDGE_BIG_DELTA ${NUDGE_BIG_DELTA}`,
        );
      }
    }

    // ─── Afterimages ──────────────────────────────────────────────
    // Five, not six: `near_miss` has no afterimage field and is paid off
    // through band fragments (checked above).
    const afterimages: ReadonlyArray<[string, string | undefined]> = [
      ['narrativeTemplate', step.narrativeTemplate],
      ['successAfterimage', step.successAfterimage],
      ['failureAfterimage', step.failureAfterimage],
      ['successAtCostAfterimage', step.successAtCostAfterimage],
      ['criticalSuccessAfterimage', step.criticalSuccessAfterimage],
      ['criticalFailureAfterimage', step.criticalFailureAfterimage],
    ];
    for (const [field, value] of afterimages) {
      if (value === undefined || value.trim() === '') {
        violations.push(`${where}: no ${field}`);
      }
    }

    // ─── Reachability (THR-821) ───────────────────────────────────
    // The rule that decides whether the hand *does anything*. A step the drawing
    // actor has no capability in floors at PROBABILITY_FLOOR and stays floored
    // through the whole hand: the player spends essence and the forecast word
    // does not move. A step that wants to be steeper has to be authored for
    // actors who plausibly hold the reach.
    //
    // The population is the open-draw templates. `background` is the attention
    // tier for ambient content any mortal draws by being where it is — nobody
    // selected for reach, so *every* step is off-reach for most of the roster
    // and the ceiling binds across the board. A template above that tier has an
    // author-chosen audience this function cannot see, so it defers.
    //
    // This predicate replaces one that could not fire (THR-838): it compared
    // `step.reach` against a set built from `template.steps`, which always
    // contains the step being iterated, so `offReach` was unconditionally false
    // and the rule passed vacuously over every template ever checked.
    if (template.intrinsicTier === OPEN_DRAW_ATTENTION_TIER
      && step.difficulty > NUDGE_OFF_REACH_MAX_DIFFICULTY) {
      violations.push(
        `${where}: open-draw step at difficulty ${step.difficulty}, over NUDGE_OFF_REACH_MAX_DIFFICULTY ${NUDGE_OFF_REACH_MAX_DIFFICULTY}`,
      );
    }
  }

  return violations;
}
