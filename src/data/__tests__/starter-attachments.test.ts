/**
 * Tests for starter-attachments content package.
 *
 * Validates:
 * - All possession subcategories represented
 * - Required fields on all possessions
 * - Tier 2+ have flavor text
 * - On-use triggers exist
 * - All conditions present with required fields
 * - Wound, disease, and blessing categories covered
 */

import { describe, it, expect } from 'vitest';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../starter-attachments';
import type { PossessionNodeProperties } from '../../types/attachments';
import type { TraitDefinitionProperties } from '../../types/traits';

describe('starter-attachments', () => {
  // ───────────────────────────────────────────────────────────────────
  // STARTER_POSSESSIONS Tests
  // ───────────────────────────────────────────────────────────────────

  describe('STARTER_POSSESSIONS', () => {
    it('is an array with at least 6 items', () => {
      expect(Array.isArray(STARTER_POSSESSIONS)).toBe(true);
      expect(STARTER_POSSESSIONS.length).toBeGreaterThanOrEqual(6);
    });

    it('contains at least 4 different possession subcategories', () => {
      const subcategories = new Set<string>();
      for (const item of STARTER_POSSESSIONS) {
        const props = item.properties as PossessionNodeProperties;
        subcategories.add(props.subcategory);
      }
      expect(subcategories.size).toBeGreaterThanOrEqual(4);
    });

    it('includes "arms" subcategory', () => {
      const hasArms = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).subcategory === 'arms'
      );
      expect(hasArms).toBe(true);
    });

    it('includes "mounts_beasts" subcategory', () => {
      const hasBeasts = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).subcategory === 'mounts_beasts'
      );
      expect(hasBeasts).toBe(true);
    });

    it('includes "vestments" subcategory', () => {
      const hasVestments = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).subcategory === 'vestments'
      );
      expect(hasVestments).toBe(true);
    });

    it('includes "provisions" subcategory', () => {
      const hasProvisions = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).subcategory === 'provisions'
      );
      expect(hasProvisions).toBe(true);
    });

    // ─── Required Fields ───────────────────────────────────────────────

    it('every possession has type "artifact"', () => {
      for (const possession of STARTER_POSSESSIONS) {
        expect(possession.type).toBe('artifact');
      }
    });

    it('every possession has a truthy id', () => {
      for (const possession of STARTER_POSSESSIONS) {
        expect(possession.id).toBeTruthy();
      }
    });

    it('every possession has a truthy name', () => {
      for (const possession of STARTER_POSSESSIONS) {
        expect(possession.name).toBeTruthy();
      }
    });

    it('every possession has a valid subcategory', () => {
      const validSubcategories = [
        'arms',
        'mounts_beasts',
        'vestments',
        'tomes_scrolls',
        'relics_talismans',
        'tools_instruments',
        'provisions',
      ];
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        expect(validSubcategories).toContain(props.subcategory);
      }
    });

    it('every possession has a tier between 1 and 4', () => {
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        expect([1, 2, 3, 4]).toContain(props.tier);
      }
    });

    it('every possession has a non-empty tags array', () => {
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        expect(Array.isArray(props.tags)).toBe(true);
        expect(props.tags.length).toBeGreaterThan(0);
      }
    });

    it('every possession has a mechanicalSummary', () => {
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        expect(props.mechanicalSummary).toBeTruthy();
        expect(typeof props.mechanicalSummary).toBe('string');
      }
    });

    it('every possession has a valid lossCondition', () => {
      const validLossConditions = [
        'consumable',
        'breakable',
        'stealable',
        'cursed',
        'permanent',
      ];
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        expect(validLossConditions).toContain(props.lossCondition);
      }
    });

    // ─── Tier 2+ Flavor Text ───────────────────────────────────────────

    it('all tier 2+ possessions have flavorText', () => {
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        if (props.tier >= 2) {
          expect(props.flavorText).toBeTruthy();
          expect(typeof props.flavorText).toBe('string');
        }
      }
    });

    // ─── On-Use Triggers ───────────────────────────────────────────────

    it('at least one possession has onUseTriggers', () => {
      const withTriggers = STARTER_POSSESSIONS.some(
        (p) =>
          (p.properties as PossessionNodeProperties).onUseTriggers &&
          (p.properties as PossessionNodeProperties).onUseTriggers!.length > 0
      );
      expect(withTriggers).toBe(true);
    });

    it('all onUseTriggers have required fields', () => {
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        if (props.onUseTriggers) {
          for (const trigger of props.onUseTriggers) {
            expect(trigger.triggerCondition).toBeTruthy();
            expect(typeof trigger.probability).toBe('number');
            expect(trigger.probability).toBeGreaterThanOrEqual(0);
            expect(trigger.probability).toBeLessThanOrEqual(1);
            expect(trigger.effect).toBeTruthy();
            expect(trigger.narrativeTemplate).toBeTruthy();
          }
        }
      }
    });

    // ─── Specific Item Validation ───────────────────────────────────────

    it('includes Iron Blade', () => {
      const ironBlade = STARTER_POSSESSIONS.find((p) => p.id === 'starter_iron_blade');
      expect(ironBlade).toBeDefined();
      expect(ironBlade!.name).toBe('Iron Blade');
    });

    it('includes Ashenmane Fang', () => {
      const ashenmaneFang = STARTER_POSSESSIONS.find((p) => p.id === 'starter_ashenmane_fang');
      expect(ashenmaneFang).toBeDefined();
      expect(ashenmaneFang!.name).toBe("Ashenmane's Fang");
    });

    it('includes The Whispering Eye (tier 3, cursed)', () => {
      const whisperingEye = STARTER_POSSESSIONS.find(
        (p) => p.id === 'starter_whispering_eye'
      );
      expect(whisperingEye).toBeDefined();
      const props = whisperingEye!.properties as PossessionNodeProperties;
      expect(props.tier).toBe(3);
      expect(props.lossCondition).toBe('cursed');
    });

    it('includes Burned Codex with first_use trigger', () => {
      const burnedCodex = STARTER_POSSESSIONS.find(
        (p) => p.id === 'starter_burned_codex'
      );
      expect(burnedCodex).toBeDefined();
      const props = burnedCodex!.properties as PossessionNodeProperties;
      const hasTrigger =
        props.onUseTriggers &&
        props.onUseTriggers.some((t) => t.triggerCondition === 'first_use');
      expect(hasTrigger).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // STARTER_CONDITIONS Tests
  // ───────────────────────────────────────────────────────────────────

  describe('STARTER_CONDITIONS', () => {
    it('is an array with at least 3 items', () => {
      expect(Array.isArray(STARTER_CONDITIONS)).toBe(true);
      expect(STARTER_CONDITIONS.length).toBeGreaterThanOrEqual(3);
    });

    it('every condition has type "trait"', () => {
      for (const condition of STARTER_CONDITIONS) {
        expect(condition.type).toBe('trait');
      }
    });

    it('every condition has a truthy id', () => {
      for (const condition of STARTER_CONDITIONS) {
        expect(condition.id).toBeTruthy();
      }
    });

    it('every condition has a truthy name', () => {
      for (const condition of STARTER_CONDITIONS) {
        expect(condition.name).toBeTruthy();
      }
    });

    it('every condition has subcategory "condition"', () => {
      for (const condition of STARTER_CONDITIONS) {
        const props = condition.properties as TraitDefinitionProperties;
        expect(props.subcategory).toBe('condition');
      }
    });

    it('every condition has a tier between 1 and 4', () => {
      for (const condition of STARTER_CONDITIONS) {
        const props = condition.properties as TraitDefinitionProperties;
        expect([1, 2, 3, 4]).toContain(props.tier);
      }
    });

    it('every condition has a non-empty tags array', () => {
      for (const condition of STARTER_CONDITIONS) {
        const props = condition.properties as TraitDefinitionProperties;
        expect(Array.isArray(props.tags)).toBe(true);
        expect(props.tags.length).toBeGreaterThan(0);
      }
    });

    it('every condition has a description', () => {
      for (const condition of STARTER_CONDITIONS) {
        const props = condition.properties as TraitDefinitionProperties;
        expect(props.description).toBeTruthy();
        expect(typeof props.description).toBe('string');
      }
    });

    // ─── Wound, Disease, Blessing Coverage ────────────────────────────

    it('includes at least one #wound condition', () => {
      const hasWound = STARTER_CONDITIONS.some((c) => {
        const props = c.properties as TraitDefinitionProperties;
        return props.tags.includes('#wound');
      });
      expect(hasWound).toBe(true);
    });

    it('includes at least one #disease condition', () => {
      const hasDisease = STARTER_CONDITIONS.some((c) => {
        const props = c.properties as TraitDefinitionProperties;
        return props.tags.includes('#disease');
      });
      expect(hasDisease).toBe(true);
    });

    it('includes at least one #blessing condition', () => {
      const hasBlessing = STARTER_CONDITIONS.some((c) => {
        const props = c.properties as TraitDefinitionProperties;
        return props.tags.includes('#blessing');
      });
      expect(hasBlessing).toBe(true);
    });

    // ─── Specific Item Validation ───────────────────────────────────────

    it('includes Bruised Ribs (wound)', () => {
      const bruisedRibs = STARTER_CONDITIONS.find(
        (c) => c.id === 'starter_bruised_ribs'
      );
      expect(bruisedRibs).toBeDefined();
      expect(bruisedRibs!.name).toBe('Bruised Ribs');
      const props = bruisedRibs!.properties as TraitDefinitionProperties;
      expect(props.tags).toContain('#wound');
    });

    it('includes Plague-Touched (disease)', () => {
      const plagueTouched = STARTER_CONDITIONS.find(
        (c) => c.id === 'starter_plague_touched'
      );
      expect(plagueTouched).toBeDefined();
      expect(plagueTouched!.name).toBe('Plague-Touched');
      const props = plagueTouched!.properties as TraitDefinitionProperties;
      expect(props.tags).toContain('#disease');
    });

    it('includes Sun-Touched (blessing)', () => {
      const sunTouched = STARTER_CONDITIONS.find((c) => c.id === 'starter_sun_touched');
      expect(sunTouched).toBeDefined();
      expect(sunTouched!.name).toBe('Sun-Touched');
      const props = sunTouched!.properties as TraitDefinitionProperties;
      expect(props.tags).toContain('#blessing');
    });

    it('includes Revelation (magical/knowledge)', () => {
      const revelation = STARTER_CONDITIONS.find((c) => c.id === 'starter_revelation');
      expect(revelation).toBeDefined();
      expect(revelation!.name).toBe('Revelation');
      const props = revelation!.properties as TraitDefinitionProperties;
      expect(props.tags).toContain('#knowledge');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  // Integration Tests
  // ───────────────────────────────────────────────────────────────────

  describe('Integration', () => {
    it('all items have unique IDs across both arrays', () => {
      const allIds = [
        ...STARTER_POSSESSIONS.map((p) => p.id),
        ...STARTER_CONDITIONS.map((c) => c.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('all items have unique names within their category', () => {
      const possessionNames = STARTER_POSSESSIONS.map((p) => p.name);
      const uniquePossessionNames = new Set(possessionNames);
      expect(uniquePossessionNames.size).toBe(possessionNames.length);

      const conditionNames = STARTER_CONDITIONS.map((c) => c.name);
      const uniqueConditionNames = new Set(conditionNames);
      expect(uniqueConditionNames.size).toBe(conditionNames.length);
    });

    it('exercises breakable loss condition', () => {
      const breakable = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).lossCondition === 'breakable'
      );
      expect(breakable).toBe(true);
    });

    it('exercises cursed loss condition', () => {
      const cursed = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).lossCondition === 'cursed'
      );
      expect(cursed).toBe(true);
    });

    it('exercises consumable loss condition', () => {
      const consumable = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).lossCondition === 'consumable'
      );
      expect(consumable).toBe(true);
    });

    it('exercises stealable loss condition', () => {
      const stealable = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).lossCondition === 'stealable'
      );
      expect(stealable).toBe(true);
    });

    it('exercises permanent loss condition', () => {
      const permanent = STARTER_POSSESSIONS.some(
        (p) => (p.properties as PossessionNodeProperties).lossCondition === 'permanent'
      );
      expect(permanent).toBe(true);
    });

    it('exercises all trigger conditions', () => {
      const triggerConditions = new Set<string>();
      for (const possession of STARTER_POSSESSIONS) {
        const props = possession.properties as PossessionNodeProperties;
        if (props.onUseTriggers) {
          for (const trigger of props.onUseTriggers) {
            triggerConditions.add(trigger.triggerCondition);
          }
        }
      }
      expect(triggerConditions.has('critical_failure')).toBe(true);
      expect(triggerConditions.has('first_use')).toBe(true);
      expect(triggerConditions.has('any_use')).toBe(true);
    });
  });
});
