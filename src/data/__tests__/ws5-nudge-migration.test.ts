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
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { auditTemplate } from '../content-eval/nudgeAuditDetectors';
import { checkNudgeHand, nudgeBearingSteps } from '../content-eval/nudgeHandChecklist';
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
