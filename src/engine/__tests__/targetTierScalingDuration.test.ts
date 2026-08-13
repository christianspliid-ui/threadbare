/**
 * THR-1100 — the tier-advancement *duration* ramp reaches the player.
 *
 * THR-1073 made the authored cost and difficulty ramps reachable and left
 * duration behind, because the draw happens in `createUnifiedAction`, which took
 * a target *id* and had nothing to resolve it against. So
 * `TIER_ADVANCEMENT_DURATION[2..3]` sat unconsumed and a Mythic→Legendary rite
 * took the same 2–3 ticks a Mundane→Storied one did.
 *
 * Every assertion here is falsifiable against that build: on it, a cast against
 * a tier-3 artifact drew from `{min:2,max:3}` like every other, so the
 * "different tiers, different durations" tests fail rather than pass vacuously.
 *
 * The ranges are deliberately non-overlapping in the authored table
 * (2–3 / 3–4 / 4–6), which lets the wiring tests assert bounds rather than a
 * single RNG draw — a bound holds under any seed, so these do not silently
 * become seed-pinned snapshots the next time the RNG stride moves.
 */

import { describe, it, expect } from 'vitest';
import {
  TIER_ADVANCEMENT_DURATION,
  ENCHANT_TEMPLATE_ID,
  EMPOWER_TEMPLATE_ID,
} from '../../data/attachment-tier-content';
import { tierScaledDuration } from '../targetTierScaling';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { WorldGraph } from '../graph';
import { preparePlayerCast } from '../playerCastDispatch';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ActionStep, UnifiedActionTemplate } from '../../types/unifiedAction';

const templateById = (id: string): UnifiedActionTemplate => {
  const found = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
  if (!found) throw new Error(`template ${id} not found`);
  return found;
};

const firstStepOf = (template: UnifiedActionTemplate): ActionStep => {
  const step = template.steps[0];
  if (!step || isActionStepBranch(step)) throw new Error(`${template.id} has no plain first step`);
  return step;
};

/** An artifact node's property bag at a given tier — the shape the seam reads. */
const artifactAtTier = (tier: number): Readonly<Record<string, unknown>> => ({ tier });

describe('THR-1100 — target-tier scaling of step duration', () => {
  describe.each([ENCHANT_TEMPLATE_ID, EMPOWER_TEMPLATE_ID])('%s', (templateId) => {
    const template = templateById(templateId);
    const step = firstStepOf(template);

    it('draws the authored range for the tier being advanced FROM', () => {
      expect(tierScaledDuration(step, artifactAtTier(1))).toEqual(TIER_ADVANCEMENT_DURATION[1]);
      expect(tierScaledDuration(step, artifactAtTier(2))).toEqual(TIER_ADVANCEMENT_DURATION[2]);
      expect(tierScaledDuration(step, artifactAtTier(3))).toEqual(TIER_ADVANCEMENT_DURATION[3]);
    });

    it('takes longer at a later tier than an earlier one', () => {
      // The authored intent, asserted as a relation rather than as literals, so
      // re-tuning the table in attachment-tier-content.ts cannot silently
      // invert the ramp without failing here (NFP #1 — the numbers stay data).
      const early = tierScaledDuration(step, artifactAtTier(1));
      const late = tierScaledDuration(step, artifactAtTier(3));
      expect(late.min).toBeGreaterThan(early.min);
      expect(late.max).toBeGreaterThan(early.max);
    });

    it('is fail-soft on a target with no tier, drawing the ramp floor', () => {
      // NFP #4: the offer path must never see a NaN duration or a throw.
      expect(tierScaledDuration(step, undefined)).toEqual(TIER_ADVANCEMENT_DURATION[1]);
      expect(tierScaledDuration(step, {})).toEqual(TIER_ADVANCEMENT_DURATION[1]);
    });
  });

  describe('the draw seam (preparePlayerCast → createUnifiedAction)', () => {
    // The tests above prove the helper. These prove the *wiring* — the ticket's
    // Done-when is about the duration an action actually carries, which is where
    // THR-1073 stopped short.
    const ARTIFACT_ID = 'artifact-test-blade';
    const ASCENDANT_ID = 'ascendant-test';

    const graphWithArtifactAtTier = (tier: number): WorldGraph => {
      const graph = new WorldGraph();
      graph.addNode({
        id: ASCENDANT_ID, type: 'ascendant', name: 'The Witness', properties: {},
      } as never);
      graph.addNode({
        id: ARTIFACT_ID, type: 'artifact', name: 'The Grey Blade', properties: { tier },
      } as never);
      return graph;
    };

    const stepDurationOfCastAgainstTier = (tier: number, templateId: string): number => {
      resetUnifiedActionCounter();
      const template = templateById(templateId);
      return preparePlayerCast({
        graph: graphWithArtifactAtTier(tier),
        ascendantId: ASCENDANT_ID,
        template,
        templateId: template.id,
        targetId: ARTIFACT_ID,
        tick: 12,
        seed: 42,
        sphere: null,
      }).action.stepDuration;
    };

    it.each([ENCHANT_TEMPLATE_ID, EMPOWER_TEMPLATE_ID])(
      '%s lands inside the authored band for the target\'s tier',
      (templateId) => {
        for (const tier of [1, 2, 3] as const) {
          const drawn = stepDurationOfCastAgainstTier(tier, templateId);
          const band = TIER_ADVANCEMENT_DURATION[tier];
          expect(drawn, `tier ${tier} drew ${drawn}, outside ${band.min}–${band.max}`)
            .toBeGreaterThanOrEqual(band.min);
          expect(drawn).toBeLessThanOrEqual(band.max);
        }
      },
    );

    it('the SAME artifact advanced at two tiers takes measurably longer (the ticket Done-when)', () => {
      // The falsifiable one, under a pinned seed. Pre-THR-1100 both draws came
      // from {min:2,max:3} and this failed: the tier-3 rite was never slower.
      const mundane = stepDurationOfCastAgainstTier(1, ENCHANT_TEMPLATE_ID);
      const mythic = stepDurationOfCastAgainstTier(3, ENCHANT_TEMPLATE_ID);
      expect(mythic).toBeGreaterThan(mundane);
      // And specifically: the tier-3 draw must be outside the tier-1 band
      // entirely, which is the part a wider band alone could not explain.
      expect(mythic).toBeGreaterThan(TIER_ADVANCEMENT_DURATION[1].max);
    });
  });

  describe('every other template is untouched', () => {
    it('returns the authored duration when the step marker is absent', () => {
      const unmarkedSteps = UNIFIED_ACTION_TEMPLATES
        .flatMap(t => t.steps)
        .filter((s): s is ActionStep => !isActionStepBranch(s) && s.difficultyContext !== 'target_tier_scaled');
      // Guard against a vacuous pass: the catalog must actually hold unmarked
      // steps, or this loop asserts nothing.
      expect(unmarkedSteps.length).toBeGreaterThan(0);

      for (const step of unmarkedSteps) {
        // A tier-3 target must not stretch a step that never opted in — the
        // scaling is opt-in, not ambient.
        expect(tierScaledDuration(step, artifactAtTier(3))).toBe(step.duration);
      }
    });
  });
});
