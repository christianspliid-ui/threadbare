import { describe, it, expect } from 'vitest';
import {
  POSSESSION_SUBCATEGORIES,
  ATTACHMENT_TIER_NAMES,
  ATTACHMENT_TIER_COLORS,
  type PossessionNodeProperties,
  type OnUseTrigger,
  type AgreementProperties,
  type RewardPoolRecipe,
  type ResolvedRewardRecipe,
} from '../attachments';

describe('Attachment Types', () => {
  describe('POSSESSION_SUBCATEGORIES', () => {
    it('should have exactly 7 entries', () => {
      expect(POSSESSION_SUBCATEGORIES).toHaveLength(7);
    });

    it('should contain "arms"', () => {
      expect(POSSESSION_SUBCATEGORIES).toContain('arms');
    });

    it('should contain "provisions"', () => {
      expect(POSSESSION_SUBCATEGORIES).toContain('provisions');
    });

    it('should contain all expected subcategories', () => {
      expect(POSSESSION_SUBCATEGORIES).toEqual([
        'arms',
        'mounts_beasts',
        'vestments',
        'tomes_scrolls',
        'relics_talismans',
        'tools_instruments',
        'provisions',
      ]);
    });
  });

  describe('ATTACHMENT_TIER_NAMES', () => {
    it('should have exactly 4 entries', () => {
      expect(Object.keys(ATTACHMENT_TIER_NAMES)).toHaveLength(4);
    });

    it('should map tier 1 to "Mundane"', () => {
      expect(ATTACHMENT_TIER_NAMES[1]).toBe('Mundane');
    });

    it('should map tier 4 to "Legendary"', () => {
      expect(ATTACHMENT_TIER_NAMES[4]).toBe('Legendary');
    });

    it('should have all tiers defined', () => {
      expect(ATTACHMENT_TIER_NAMES[1]).toBeDefined();
      expect(ATTACHMENT_TIER_NAMES[2]).toBeDefined();
      expect(ATTACHMENT_TIER_NAMES[3]).toBeDefined();
      expect(ATTACHMENT_TIER_NAMES[4]).toBeDefined();
    });
  });

  describe('ATTACHMENT_TIER_COLORS', () => {
    it('should have exactly 4 entries', () => {
      expect(Object.keys(ATTACHMENT_TIER_COLORS)).toHaveLength(4);
    });

    it('should have all tiers defined with hex colors', () => {
      expect(ATTACHMENT_TIER_COLORS[1]).toBeDefined();
      expect(ATTACHMENT_TIER_COLORS[2]).toBeDefined();
      expect(ATTACHMENT_TIER_COLORS[3]).toBeDefined();
      expect(ATTACHMENT_TIER_COLORS[4]).toBeDefined();
    });

    it('should have valid hex color codes', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      expect(ATTACHMENT_TIER_COLORS[1]).toMatch(hexRegex);
      expect(ATTACHMENT_TIER_COLORS[2]).toMatch(hexRegex);
      expect(ATTACHMENT_TIER_COLORS[3]).toMatch(hexRegex);
      expect(ATTACHMENT_TIER_COLORS[4]).toMatch(hexRegex);
    });
  });

  describe('PossessionNodeProperties', () => {
    it('should create a valid object', () => {
      const possession: PossessionNodeProperties = {
        subcategory: 'arms',
        tier: 3,
        tags: ['iron', 'blessed'],
        mechanicalSummary: '+Iron, grants cavalry_charge, +movement',
        lossCondition: 'breakable',
        flavorText: 'A legendary blade forged in ancient times.',
        image: 'sword.png',
        source: 'Vendor of Memories',
        sphereAffinity: 'War',
        onUseTriggers: [],
      };

      expect(possession.subcategory).toBe('arms');
      expect(possession.tier).toBe(3);
      expect(possession.tags).toContain('iron');
      expect(possession.lossCondition).toBe('breakable');
    });

    it('should allow optional fields', () => {
      const possession: PossessionNodeProperties = {
        subcategory: 'provisions',
        tier: 1,
        tags: [],
        mechanicalSummary: '+Food for survival',
        lossCondition: 'consumable',
      };

      expect(possession.flavorText).toBeUndefined();
      expect(possession.image).toBeUndefined();
      expect(possession.onUseTriggers).toBeUndefined();
    });

    it('should allow onUseTriggers array', () => {
      const possession: PossessionNodeProperties = {
        subcategory: 'relics_talismans',
        tier: 4,
        tags: ['cursed'],
        mechanicalSummary: 'Dark power, transforms bearer',
        lossCondition: 'cursed',
        onUseTriggers: [
          {
            triggerCondition: 'critical_failure',
            probability: 0.5,
            effect: {
              type: 'add_condition',
              targetId: 'bearer',
              ticksRemaining: 10,
            },
            narrativeTemplate: '{actor} feels the curse take hold.',
          },
        ],
      };

      expect(possession.onUseTriggers).toHaveLength(1);
      expect(possession.onUseTriggers[0].triggerCondition).toBe('critical_failure');
    });
  });

  describe('OnUseTrigger', () => {
    it('should create a valid trigger', () => {
      const trigger: OnUseTrigger = {
        triggerCondition: 'success',
        probability: 0.75,
        effect: {
          type: 'add_possession',
          tags: ['reward'],
        },
        narrativeTemplate: '{actor} successfully used {item_name}.',
      };

      expect(trigger.triggerCondition).toBe('success');
      expect(trigger.probability).toBe(0.75);
      expect(trigger.effect.type).toBe('add_possession');
    });

    it('should support all trigger conditions', () => {
      const conditions = ['critical_failure', 'failure', 'success', 'critical_success', 'any_use', 'first_use'] as const;

      conditions.forEach((condition) => {
        const trigger: OnUseTrigger = {
          triggerCondition: condition,
          probability: 1.0,
          effect: { type: 'remove_condition' },
          narrativeTemplate: 'Test narrative',
        };
        expect(trigger.triggerCondition).toBe(condition);
      });
    });

    it('should support all effect types', () => {
      const effectTypes = [
        'add_condition',
        'remove_condition',
        'remove_possession',
        'spawn_actor',
        'add_possession',
        'modify_relationship',
      ] as const;

      effectTypes.forEach((effectType) => {
        const trigger: OnUseTrigger = {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: effectType },
          narrativeTemplate: 'Test narrative',
        };
        expect(trigger.effect.type).toBe(effectType);
      });
    });

    it('should allow optional tags', () => {
      const trigger: OnUseTrigger = {
        triggerCondition: 'success',
        probability: 0.5,
        effect: {
          type: 'add_condition',
          tags: ['fire', 'beneficial'],
        },
        narrativeTemplate: 'Fire spreads.',
      };

      expect(trigger.tags).toBeUndefined();
      expect(trigger.effect.tags).toContain('fire');
    });
  });

  describe('AgreementProperties', () => {
    it('should create a valid agreement', () => {
      const agreement: AgreementProperties = {
        type: 'pact',
        tier: 2,
        tags: ['binding'],
        terms: 'Serve for one lunar cycle',
        fulfillmentCondition: 'Complete three tasks',
        ticksRemaining: 100,
        modifiers: { 'loyalty': 0.2, 'strength': 0.1 },
      };

      expect(agreement.type).toBe('pact');
      expect(agreement.tier).toBe(2);
      expect(agreement.terms).toBe('Serve for one lunar cycle');
      expect(agreement.modifiers?.loyalty).toBe(0.2);
    });

    it('should support all agreement types', () => {
      const types = ['pact', 'debt', 'favour', 'oath', 'treaty', 'bargain'] as const;

      types.forEach((type) => {
        const agreement: AgreementProperties = {
          type,
          tier: 1,
          tags: [],
          terms: 'Test terms',
          fulfillmentCondition: 'Test condition',
          ticksRemaining: null,
        };
        expect(agreement.type).toBe(type);
      });
    });

    it('should allow null ticksRemaining', () => {
      const agreement: AgreementProperties = {
        type: 'oath',
        tier: 4,
        tags: ['eternal'],
        terms: 'Forever bound',
        fulfillmentCondition: 'Never',
        ticksRemaining: null,
      };

      expect(agreement.ticksRemaining).toBeNull();
    });

    it('should allow optional modifiers', () => {
      const agreement: AgreementProperties = {
        type: 'favour',
        tier: 1,
        tags: [],
        terms: 'A small favor',
        fulfillmentCondition: 'Help once',
        ticksRemaining: 50,
      };

      expect(agreement.modifiers).toBeUndefined();
    });
  });

  describe('RewardPoolRecipe (template-level)', () => {
    it('should create a valid template recipe with only category weights', () => {
      const recipe: RewardPoolRecipe = {
        categoryWeights: {
          possession: 0.5,
          blessing: 0.3,
          condition: 0.2,
        },
        tagFilters: ['combat', 'beneficial'],
        sphereTint: 'War',
      };

      expect(recipe.categoryWeights.possession).toBe(0.5);
      expect(recipe.tagFilters).toContain('combat');
    });

    it('should support partial category weights', () => {
      const recipe: RewardPoolRecipe = {
        categoryWeights: {
          possession: 0.8,
        },
      };

      expect(recipe.categoryWeights.possession).toBe(0.8);
      expect(recipe.categoryWeights.blessing).toBeUndefined();
    });

    it('should allow optional tagFilters and sphereTint', () => {
      const recipe: RewardPoolRecipe = {
        categoryWeights: {
          agreement: 1.0,
        },
      };

      expect(recipe.tagFilters).toBeUndefined();
      expect(recipe.sphereTint).toBeUndefined();
    });
  });

  describe('ResolvedRewardRecipe (runtime)', () => {
    it('should extend RewardPoolRecipe with tierCurve and badOutcomeChance', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: {
          possession: 0.5,
          blessing: 0.3,
        },
        tierCurve: {
          1: 0.4,
          2: 0.35,
          3: 0.2,
          4: 0.05,
        },
        badOutcomeChance: 0.1,
      };

      expect(recipe.categoryWeights.possession).toBe(0.5);
      expect(recipe.tierCurve[1]).toBe(0.4);
      expect(recipe.badOutcomeChance).toBe(0.1);
    });

    it('should require tierCurve for all tiers', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: {},
        tierCurve: {
          1: 0.25,
          2: 0.25,
          3: 0.25,
          4: 0.25,
        },
        badOutcomeChance: 0.05,
      };

      expect(recipe.tierCurve[1]).toBeDefined();
      expect(recipe.tierCurve[2]).toBeDefined();
      expect(recipe.tierCurve[3]).toBeDefined();
      expect(recipe.tierCurve[4]).toBeDefined();
    });
  });
});
