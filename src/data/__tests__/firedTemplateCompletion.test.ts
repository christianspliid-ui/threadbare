/**
 * THR-1634 (E1 + E3) — the fired-template completion ratchet.
 *
 * Asserts clauses 1–3 of the plan's § What "complete" means for every id in
 * `FIRED_TEMPLATE_COMPLETION`, on the **shipped** template from
 * `getUnifiedTemplateById` (the lookup resolution uses) — never the authored
 * literal, because a field the converter drops type-checks and does nothing
 * (THR-838).
 */
import { describe, expect, it } from 'vitest';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { FIRED_TEMPLATE_COMPLETION } from '../content-eval/firedTemplateCompletion';
import { runnableStepSites, type UnifiedActionTemplate } from '../../types/unifiedAction';
import {
  authoredOutcomeBandsOnVariant,
  reachableLosingBandsOnPath,
} from '../../engine/debugOutcomePin';

const AFTERIMAGE_FIELDS = [
  'successAfterimage',
  'successAtCostAfterimage',
  'criticalSuccessAfterimage',
  'failureAfterimage',
  'criticalFailureAfterimage',
] as const;

function shipped(id: string): UnifiedActionTemplate {
  const template = getUnifiedTemplateById(id);
  if (!template) throw new Error(`${id} is not in the registry`);
  return template;
}

describe('THR-1634 E1 — a raw entry\'s deal reaches the shipped template', () => {
  it('carries barter_supplies\' declarations onto every shipped step', () => {
    const steps = runnableStepSites(shipped('encounter.barter_supplies').steps);
    expect(steps).toHaveLength(2);
    expect(steps[0].step.deal).toEqual({ count: 4, tags: ['social', 'labor'] });
    expect(steps[1].step.deal).toEqual({ count: 4, tags: ['social', 'presence'] });
  });

  it('leaves an entry that declares no deal without one', () => {
    // mend_equipment is a sibling entry in the same file with no `deal`.
    for (const site of runnableStepSites(shipped('encounter.mend_equipment').steps)) {
      expect(site.step.deal).toBeUndefined();
    }
  });
});

describe('THR-1634 E3 — every listed fired template is complete', () => {
  it('lists each id once, and every id resolves', () => {
    expect(new Set(FIRED_TEMPLATE_COMPLETION).size).toBe(FIRED_TEMPLATE_COMPLETION.length);
    for (const id of FIRED_TEMPLATE_COMPLETION) expect(getUnifiedTemplateById(id), id).toBeDefined();
  });

  describe.each(FIRED_TEMPLATE_COMPLETION.map((id) => [id]))('%s', (id) => {
    const template = shipped(id);
    const sites = runnableStepSites(template.steps);

    it('clause 1 — the full afterimage ladder on every runnable step', () => {
      const missing: string[] = [];
      for (const site of sites) {
        for (const field of AFTERIMAGE_FIELDS) {
          if (!site.step[field]?.trim()) missing.push(`${site.label}.${field}`);
        }
      }
      expect(missing).toEqual([]);
    });

    it('clause 2 — every runnable step offers the god a verb', () => {
      // A hand (authored nudges or a deal declaration), or an authored choice at
      // that position. The choice counts because the stage builds a hand *instead
      // of* the choice screen once a step declares one, so dealing onto a fork's
      // choice step would erase the fork (buildNudgePhaseModel, THR-775).
      const bare = sites
        .filter((site) => !(site.step.nudges?.length
          || site.step.deal
          || (template.authoredChoices?.[site.index]?.length ?? 0) > 0))
        .map((site) => site.label);
      expect(bare).toEqual([]);
    });

    it('clause 3 — every aftermath path authors each losing band it can reach', () => {
      const config = template.aftermathConfig;
      if (!config) return; // clause 4: no aftermath ⇒ no new one owed.
      const keys = [...Object.keys(config.variants ?? {}), 'fallback'];
      const owed: string[] = [];
      for (const key of keys) {
        const authored = authoredOutcomeBandsOnVariant(template, key);
        for (const band of reachableLosingBandsOnPath(template, key)) {
          if (!authored.includes(band)) owed.push(`${key}:${band}`);
        }
      }
      expect(owed).toEqual([]);
    });
  });
});
