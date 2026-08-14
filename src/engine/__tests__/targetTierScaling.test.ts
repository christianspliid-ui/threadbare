/**
 * THR-1073 — the per-tier advancement ramp reaches the player.
 *
 * Before this change `artifact.enchant` / `artifact.empower` declared a single
 * static step, so advancing Mundane→Storied and Mythic→Legendary both cost
 * `TIER_ADVANCEMENT_ESSENCE_COST[1]` (4) at `TIER_ADVANCEMENT_DIFFICULTY[1]`
 * (0.20). The authored `[2]` / `[3]` entries had no consumer.
 *
 * These assertions are falsifiable against that build: the "same artifact,
 * two tiers, two prices" test the ticket asks for fails on it, because the two
 * prices were equal.
 */

import { describe, it, expect } from 'vitest';
import {
  TIER_ADVANCEMENT_ESSENCE_COST,
  TIER_ADVANCEMENT_DIFFICULTY,
  ENCHANT_TEMPLATE_ID,
  EMPOWER_TEMPLATE_ID,
  MAX_ATTACHMENT_TIER,
} from '../../data/attachment-tier-content';
import {
  sourceTierOf,
  tierScaledEssenceCost,
  tierScaledDifficulty,
} from '../targetTierScaling';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { WorldGraph } from '../graph';
import { preparePlayerCast } from '../playerCastDispatch';
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

/** An artifact node's property bag at a given tier — the shape the seams read. */
const artifactAtTier = (tier: number): Readonly<Record<string, unknown>> => ({ tier });

describe('THR-1073 — target-tier scaling', () => {
  describe('sourceTierOf', () => {
    it('reads the authored tier', () => {
      expect(sourceTierOf(artifactAtTier(1))).toBe(1);
      expect(sourceTierOf(artifactAtTier(2))).toBe(2);
      expect(sourceTierOf(artifactAtTier(3))).toBe(3);
    });

    it('defaults an untiered artifact to tier 1, matching advanceAttachmentTier', () => {
      expect(sourceTierOf(undefined)).toBe(1);
      expect(sourceTierOf({})).toBe(1);
      expect(sourceTierOf({ tier: 'storied' })).toBe(1);
      expect(sourceTierOf({ tier: Number.NaN })).toBe(1);
    });

    it('clamps a max-tier artifact into the ramp rather than returning undefined', () => {
      // Legendary cannot advance at all (advanceAttachmentTier refuses it), so this
      // price is never charged — the clamp only keeps the card off NaN.
      expect(sourceTierOf(artifactAtTier(MAX_ATTACHMENT_TIER))).toBe(3);
      expect(sourceTierOf(artifactAtTier(99))).toBe(3);
      expect(sourceTierOf(artifactAtTier(0))).toBe(1);
    });
  });

  describe.each([ENCHANT_TEMPLATE_ID, EMPOWER_TEMPLATE_ID])('%s', (templateId) => {
    const template = templateById(templateId);
    const step = firstStepOf(template);

    it('opts into target-derived pricing on both markers', () => {
      // Both are required: the price and the roll must ramp together, or the
      // dearest advancement would still be the easiest.
      expect(template.essenceCostContext).toBe('target_tier_scaled');
      expect(step.difficultyContext).toBe('target_tier_scaled');
    });

    it('charges the authored price for the tier being advanced FROM', () => {
      expect(tierScaledEssenceCost(template, artifactAtTier(1))).toBe(TIER_ADVANCEMENT_ESSENCE_COST[1]);
      expect(tierScaledEssenceCost(template, artifactAtTier(2))).toBe(TIER_ADVANCEMENT_ESSENCE_COST[2]);
      expect(tierScaledEssenceCost(template, artifactAtTier(3))).toBe(TIER_ADVANCEMENT_ESSENCE_COST[3]);
    });

    it('rolls against the authored difficulty for that tier', () => {
      expect(tierScaledDifficulty(step, artifactAtTier(1))).toBe(TIER_ADVANCEMENT_DIFFICULTY[1]);
      expect(tierScaledDifficulty(step, artifactAtTier(2))).toBe(TIER_ADVANCEMENT_DIFFICULTY[2]);
      expect(tierScaledDifficulty(step, artifactAtTier(3))).toBe(TIER_ADVANCEMENT_DIFFICULTY[3]);
    });

    it('advancing the SAME artifact twice charges different amounts (the ticket Done-when)', () => {
      // The falsifiable one. On the pre-THR-1073 build both reads returned the
      // template's static tier-1 entries and these expectations failed.
      const blade = { tier: 1 } as Record<string, unknown>;

      const firstCost = tierScaledEssenceCost(template, blade);
      const firstDifficulty = tierScaledDifficulty(step, blade);

      blade.tier = 2; // the advancement landed; the artifact is Storied now

      const secondCost = tierScaledEssenceCost(template, blade);
      const secondDifficulty = tierScaledDifficulty(step, blade);

      expect(secondCost).toBeGreaterThan(firstCost);
      expect(secondDifficulty).toBeGreaterThan(firstDifficulty);
    });
  });

  describe('the charge seam (preparePlayerCast) — what the pool actually pays', () => {
    // The tests above prove the helper. These prove the *wiring*: the ticket's
    // Done-when is about what a cast charges, not what a pure function returns.
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

    const costOfCastAgainstTier = (tier: number): number => {
      const template = templateById(ENCHANT_TEMPLATE_ID);
      return preparePlayerCast({
        graph: graphWithArtifactAtTier(tier),
        ascendantId: ASCENDANT_ID,
        template,
        templateId: template.id,
        targetId: ARTIFACT_ID,
        tick: 12,
        seed: 42,
        sphere: null,
      }).essenceCost;
    };

    it('charges the tier the artifact is advancing FROM', () => {
      expect(costOfCastAgainstTier(1)).toBe(TIER_ADVANCEMENT_ESSENCE_COST[1]);
      expect(costOfCastAgainstTier(2)).toBe(TIER_ADVANCEMENT_ESSENCE_COST[2]);
      expect(costOfCastAgainstTier(3)).toBe(TIER_ADVANCEMENT_ESSENCE_COST[3]);
    });

    it('charges more for a later advancement than an earlier one', () => {
      // Falsifiable against the pre-THR-1073 build, where both were 4.
      expect(costOfCastAgainstTier(3)).toBeGreaterThan(costOfCastAgainstTier(1));
    });
  });

  describe('every other template is untouched', () => {
    it('returns the authored essenceCost when the marker is absent', () => {
      const unmarked = UNIFIED_ACTION_TEMPLATES.filter(t => t.essenceCostContext === undefined);
      // Guard against a vacuous pass: the catalog must actually hold unmarked
      // templates, or this asserts nothing.
      expect(unmarked.length).toBeGreaterThan(0);

      for (const template of unmarked) {
        // A tier-3 target must not change the price of a template that never
        // opted in — the scaling is opt-in, not ambient.
        expect(tierScaledEssenceCost(template, artifactAtTier(3))).toBe(template.essenceCost ?? 0);
      }
    });

    it('returns the authored difficulty when the step marker is absent', () => {
      const unmarkedSteps = UNIFIED_ACTION_TEMPLATES
        .flatMap(t => t.steps)
        .filter((s): s is ActionStep => !isActionStepBranch(s) && s.difficultyContext !== 'target_tier_scaled');
      expect(unmarkedSteps.length).toBeGreaterThan(0);

      for (const step of unmarkedSteps) {
        expect(tierScaledDifficulty(step, artifactAtTier(3))).toBe(step.difficulty);
      }
    });
  });
});
