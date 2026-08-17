/**
 * The replay body behind the re-read control — THR-1152.
 *
 * THR-1136 §2 gave the aftermath a step replay; THR-1152 gave that replay a
 * control the player can actually find. Making it findable raises the stakes on
 * what is behind it: an empty replay body reached by an invisible dot was a
 * curiosity, and the same body reached by a labeled invitation is a broken
 * promise.
 *
 * `StepReplayView` renders `entry.replayNarrative || entry.afterimage`, and the
 * adapter (`buildUnifiedEncounterStageModel`) fills those from, in order:
 *
 *   replayNarrative ← StepProseRecord.narrativeProse ← step.narrativeTemplate
 *   afterimage      ← afterimageForOutcome(step, outcome)
 *                   ← bare 'Succeeded' / 'Failed'   (NFP #4 last resort)
 *
 * So the body is never literally empty — the bare-status fallback guarantees a
 * string. Asserting non-emptiness at the component would therefore pass on a
 * template that authored nothing at all, which is the vacuous shape. These
 * assertions go at the source instead and ask the question that can fail: does
 * every slice step author the prose the replay is supposed to show, so the
 * player who opens it reads the scene rather than the word "Succeeded"?
 *
 * The ticket named "the five slice encounters"; the slice ships eight. The
 * sweep pins the registry constant rather than a count, so a ninth is covered
 * the day it lands (THR-688 rule A — predicates, not snapshots).
 */
import { describe, expect, it } from 'vitest';
import { SLICE_TEMPLATE_IDS } from '../encounters/vertical-slice';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ActionStep, ActionStepOrBranch, UnifiedActionTemplate } from '../../types/unifiedAction';

/**
 * Every concrete step a template can resolve, branch variants included, each
 * tagged with where it sits. `ActionStep` carries no id — steps are positional,
 * and a branch's routes are named only by their variant key — so the failure
 * message has to build the address itself or it cannot say which step is bare.
 */
function concreteSteps(steps: readonly ActionStepOrBranch[]): { where: string; step: ActionStep }[] {
  return steps.flatMap((step, i) =>
    isActionStepBranch(step)
      ? Object.entries(step.variants).map(([key, variant]) => ({
          where: `step ${i + 1} · route "${key}"`,
          step: variant,
        }))
      : [{ where: `step ${i + 1}`, step }],
  );
}

const SLICE_IDS = Object.values(SLICE_TEMPLATE_IDS);

describe('slice encounters — the step replay has something to show (THR-1152)', () => {
  it('resolves every slice id to a shipped template with steps', () => {
    // The guard against a vacuous sweep: if this drifts to zero, or an id stops
    // resolving, the per-step assertions below would pass over an empty set and
    // report clean while proving nothing.
    expect(SLICE_IDS.length).toBeGreaterThanOrEqual(8);

    for (const id of SLICE_IDS) {
      const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === id);
      expect(template, `${id} is not in the shipped registry`).toBeDefined();
      expect(concreteSteps(template!.steps).length, `${id} has no steps`).toBeGreaterThan(0);
    }
  });

  it.each(SLICE_IDS)('%s authors the narrative every step replays', (id) => {
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === id) as UnifiedActionTemplate;
    for (const { where, step } of concreteSteps(template.steps)) {
      const prose = step.narrativeTemplate?.trim() ?? '';
      expect(
        prose.length,
        `${id} ${where} has no narrativeTemplate — its replay would open on the bare status fallback`,
      ).toBeGreaterThan(0);
    }
  });

  it.each(SLICE_IDS)('%s authors an afterimage on both sides of every step', (id) => {
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === id) as UnifiedActionTemplate;
    for (const { where, step } of concreteSteps(template.steps)) {
      // The second line of defence: when no frozen prose record exists (old
      // saves, legacy path, cap overflow) the replay falls back to the
      // afterimage, and only then to 'Succeeded' / 'Failed'.
      expect(
        step.successAfterimage?.trim(),
        `${id} ${where} would replay a success as the bare word "Succeeded"`,
      ).toBeTruthy();
      expect(
        step.failureAfterimage?.trim(),
        `${id} ${where} would replay a failure as the bare word "Failed"`,
      ).toBeTruthy();
    }
  });
});
