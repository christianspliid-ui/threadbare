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
import {
  ALL_BAND_OUTCOMES,
  FACTOR_LINES_MAX,
  FACTOR_LINES_MIN,
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

/** Plain `ActionStep`s only — branching variants are out of scope for linear templates. */
export function nudgeBearingSteps(template: UnifiedActionTemplate): NudgeBearingStep[] {
  return (template.steps ?? []).filter(isNudgeBearing);
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
  const steps = nudgeBearingSteps(template);

  if (steps.length === 0) {
    return [`${template.id}: no nudge-bearing step — nothing to check`];
  }

  for (const [index, step] of steps.entries()) {
    const where = `${template.id} step ${index} (${step.reach})`;
    const hand = step.nudges;

    // ─── Hand shape ───────────────────────────────────────────────
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

    // ─── Band coverage ────────────────────────────────────────────
    const covered = new Set<StepOutcome>();
    for (const nudge of hand) {
      for (const band of Object.keys(nudge.bandProse ?? {}) as StepOutcome[]) covered.add(band);
    }
    for (const band of ALL_BAND_OUTCOMES) {
      if (!covered.has(band)) violations.push(`${where}: never pays off the ${band} band`);
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

    const factorLines = step.factorLines ?? [];
    if (factorLines.length < FACTOR_LINES_MIN || factorLines.length > FACTOR_LINES_MAX) {
      violations.push(
        `${where}: ${factorLines.length} factor lines, outside ${FACTOR_LINES_MIN}–${FACTOR_LINES_MAX}`,
      );
    }
    // Author both signs: a step whose lines all cut one way is an assertion,
    // not a weighing.
    if (factorLines.length > 0) {
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
