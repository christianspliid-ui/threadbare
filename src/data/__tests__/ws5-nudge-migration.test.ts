/**
 * WS5 migration gate — THR-838 (Batch 1).
 *
 * Every template this workstream migrates is registered in `WS5_MIGRATED` below
 * and held to two things at once: the WS3 audit's detectors must read clean, and
 * the WS1 hand checklist must pass. Both run over the **shipped**
 * `UNIFIED_ACTION_TEMPLATES` entry, not over the raw authored literal, so the
 * converter in `encounter-content.ts` is inside the assertion — which is the
 * whole reason this file exists. The nudge fields were declared on `ActionStep`
 * from WS0 and silently dropped by that converter until THR-838; a test reading
 * the raw entry would have passed throughout.
 *
 * The registry is explicit, not derived from "templates that happen to carry a
 * hand". A derived population would shrink to nothing the moment a migration
 * regressed and still report PASS — the vacuous-probe failure this project has
 * hit before. Adding a batch means adding its ids here in the same commit.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import type { ActionStep, UnifiedActionTemplate } from '../../types/unifiedAction';
import { auditTemplate } from '../content-eval/nudgeAuditDetectors';
import { checkNudgeHand, nudgeBearingSteps } from '../content-eval/nudgeHandChecklist';
import {
  NUDGE_OFF_REACH_MAX_DIFFICULTY,
  OPEN_DRAW_ATTENTION_TIER,
} from '../content-eval/nudgeAuthoringConstants';
import { CORE_TRAIT_DEFINITIONS } from '../core-trait-content';

/**
 * Templates migrated to the nudge model, by batch.
 *
 * Batch 1 is `Docs/audits/2026-07-26-nudge-migration-audit.md` § "encounter.*
 * (core exploration)" REWRITE — 48 ids, listed in
 * `Docs/audits/ws5-batch-1-ids.txt`. This registry holds the ones actually
 * migrated so far, and grows toward that list. It is deliberately NOT the
 * batch-1 id file: that file is the work remaining, this is the work done.
 */
export const WS5_MIGRATED: readonly string[] = [
  // Batch 1 — the camp cluster (THR-838, 2026-07-28)
  'encounter.rest_and_reflect',
  'encounter.scout_the_perimeter',
  'encounter.tend_to_wounds',
  // Batch 1 — camp maintenance, the same night from the other side (THR-838, 2026-07-28)
  'encounter.ward_the_camp',
  'encounter.sharpen_blades',
];

const byId = new Map<string, UnifiedActionTemplate>(
  UNIFIED_ACTION_TEMPLATES.map(t => [t.id, t]),
);

describe('WS5 nudge migration — registered templates', () => {
  it('every registered id resolves to a shipped template', () => {
    // Guards the population. A registry of ids that no longer resolve would make
    // every check below iterate an empty list and report green.
    const missing = WS5_MIGRATED.filter(id => !byId.has(id));
    expect(missing, `WS5_MIGRATED names ids absent from UNIFIED_ACTION_TEMPLATES`).toEqual([]);
    expect(WS5_MIGRATED.length).toBeGreaterThan(0);
  });

  describe.each(WS5_MIGRATED)('%s', id => {
    const template = (): UnifiedActionTemplate => {
      const found = byId.get(id);
      if (!found) throw new Error(`${id} not in UNIFIED_ACTION_TEMPLATES`);
      return found;
    };

    it('carries an authored hand through the converter', () => {
      // The converter assertion. `encounter-content.ts` builds its ActionSteps
      // field by field; before THR-838 it had no `nudges` line, so an authored
      // hand vanished between the literal and the shipped template.
      expect(nudgeBearingSteps(template()).length).toBeGreaterThan(0);
    });

    it('reads clean on the WS3 audit detectors', () => {
      const scores = auditTemplate(template());
      expect(scores.failures, `${id} trips the migration-audit detectors`).toEqual([]);
    });

    it('satisfies the WS1 hand checklist', () => {
      expect(checkNudgeHand(template()), `${id} violates the WS1 checklist`).toEqual([]);
    });

    it('hooks only live trait refs', () => {
      // Checklist step 5's hard constraint. Checked against the seeded Core
      // definitions rather than a hand-copied id list, so retiring a trait
      // breaks this test instead of silently producing a gate that never opens.
      const liveTraitIds = new Set(CORE_TRAIT_DEFINITIONS.map(n => n.id));
      const t = template();

      for (const variant of t.traitVariants ?? []) {
        expect(liveTraitIds, `${id}: traitVariant names a dead trait ref`).toContain(
          variant.traitId,
        );
      }

      for (const step of nudgeBearingSteps(t)) {
        for (const nudge of step.nudges) {
          if (nudge.requiredTrait !== undefined) {
            expect(liveTraitIds, `${id}: ${nudge.id} gates on a dead trait ref`).toContain(
              nudge.requiredTrait,
            );
          }
        }
      }
    });

    it('every trait-only card is reachable by the variant that unlocks it', () => {
      // A trait-gated card nobody can be handed is noise, not a goal. Reachable
      // means: some traitVariant either names it in `addNudgeIds`, or gates on
      // the same trait the card requires.
      const t = template();
      const variants = t.traitVariants ?? [];
      const unlocked = new Set(variants.flatMap(v => v.addNudgeIds ?? []));
      const gatedTraits = new Set(variants.map(v => v.traitId));

      for (const step of nudgeBearingSteps(t)) {
        for (const nudge of step.nudges) {
          if (nudge.requiredTrait === undefined) continue;
          expect(
            unlocked.has(nudge.id) || gatedTraits.has(nudge.requiredTrait),
            `${id}: ${nudge.id} is trait-gated but no traitVariant reaches it`,
          ).toBe(true);
        }
      }
    });
  });
});

/**
 * Falsification of the reachability guard itself (THR-838).
 *
 * The guard this pins previously compared `step.reach` against a set built from
 * `template.steps` — which always contains the step being iterated, so the
 * off-reach condition was unconditionally false and the rule passed vacuously
 * over every template ever checked. Every green run above was, for that one
 * rule, a probe matching nothing.
 *
 * Repairing a vacuous check by swapping its predicate earns exactly one thing:
 * an obligation to show the new predicate can fail. These two cases do that —
 * the guard fires on an open-draw step above the ceiling, and stays quiet on
 * the identical step at a tier whose audience the checklist cannot see.
 */
describe('WS5 nudge migration — reachability guard is live', () => {
  const stepAtDifficulty = (difficulty: number): ActionStep => ({
    reach: 'iron',
    duration: { min: 1, max: 1 },
    difficulty,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
    narrativeTemplate: 'n',
    successAfterimage: 's',
    failureAfterimage: 'f',
    successAtCostAfterimage: 'sac',
    criticalSuccessAfterimage: 'cs',
    criticalFailureAfterimage: 'cf',
    purposeLine: 'do the thing',
    factorLines: [
      { text: 'for', polarity: 'for' },
      { text: 'against', polarity: 'against' },
    ],
    nudges: [
      { id: 'a', name: 'a', essenceCost: 1, forecastDelta: 0.05, fiction: 'a', effectLine: 'a', bandProse: { success: 's', near_miss: 'n' } },
      { id: 'b', name: 'b', sphere: 'life', essenceCost: 1, forecastDelta: 0.05, fiction: 'b', effectLine: 'b', bandProse: { failure: 'f' } },
      { id: 'c', name: 'c', sphere: 'time', essenceCost: 1, forecastDelta: 0.05, fiction: 'c', effectLine: 'c', bandProse: { critical_success: 'cs', failure: 'f' } },
      { id: 'd', name: 'd', sphere: 'mind', essenceCost: 1, forecastDelta: 0.05, fiction: 'd', effectLine: 'd', bandProse: { critical_failure: 'cf' } },
      { id: 'e', name: 'e', sphere: 'order', essenceCost: 1, forecastDelta: 0.05, fiction: 'e', effectLine: 'e', bandProse: { success_at_cost: 'sac', failure: 'f' } },
    ],
  } as unknown as ActionStep);

  const templateAt = (
    intrinsicTier: string,
    difficulty: number,
  ): UnifiedActionTemplate => ({
    id: 'probe.reachability',
    reach: 'iron',
    intrinsicTier,
    steps: [stepAtDifficulty(difficulty)],
  } as unknown as UnifiedActionTemplate);

  const OVER = NUDGE_OFF_REACH_MAX_DIFFICULTY + 0.1;
  const UNDER = NUDGE_OFF_REACH_MAX_DIFFICULTY - 0.1;

  it('fires on an open-draw step above the ceiling', () => {
    const violations = checkNudgeHand(templateAt(OPEN_DRAW_ATTENTION_TIER, OVER));
    expect(violations.some(v => v.includes('NUDGE_OFF_REACH_MAX_DIFFICULTY'))).toBe(true);
  });

  it('stays quiet on the same step below the ceiling', () => {
    const violations = checkNudgeHand(templateAt(OPEN_DRAW_ATTENTION_TIER, UNDER));
    expect(violations.some(v => v.includes('NUDGE_OFF_REACH_MAX_DIFFICULTY'))).toBe(false);
  });

  it('defers above the open-draw tier, where the audience is author-chosen', () => {
    const violations = checkNudgeHand(templateAt('notable', OVER));
    expect(violations.some(v => v.includes('NUDGE_OFF_REACH_MAX_DIFFICULTY'))).toBe(false);
  });
});
