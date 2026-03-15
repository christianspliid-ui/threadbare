import { describe, it, expect } from 'vitest';
import { resolveOnUseTriggers, type TriggerContext, type FiredTrigger } from '../attachmentTriggers';
import type { OnUseTrigger } from '../../types/attachments';

describe('resolveOnUseTriggers', () => {
  const defaultContext: TriggerContext = {
    actor: 'Kael',
    itemName: 'Grimoire of Stars',
    roll: 0.5,
  };

  describe('fires when condition matches and roll succeeds', () => {
    it('should fire trigger with critical_failure condition and probability 1.0', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: {
            type: 'add_condition',
            targetId: 'cond.cursed',
            tags: ['curse'],
          },
          narrativeTemplate: '{actor} feels the {item_name} pulse with dread.',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'critical_failure', defaultContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        fired: true,
        trigger: triggers[0],
        effect: triggers[0].effect,
        narrativeText: 'Kael feels the Grimoire of Stars pulse with dread.',
      });
    });

    it('should fire when roll is just below probability threshold (0.001 < 0.5)', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'success',
          probability: 0.5,
          effect: { type: 'remove_possession' },
          narrativeTemplate: 'The item breaks.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.001 };
      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result).toHaveLength(1);
    });
  });

  describe('does not fire when condition does not match', () => {
    it('should not fire when trigger condition is critical_failure but outcome is success', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: {
            type: 'add_condition',
            targetId: 'cond.broken',
          },
          narrativeTemplate: 'The sword breaks.',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'success', defaultContext);

      expect(result).toHaveLength(0);
    });

    it('should not fire when multiple conditions do not match', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: { type: 'remove_possession' },
          narrativeTemplate: 'Trigger 1',
        },
        {
          triggerCondition: 'critical_success',
          probability: 1.0,
          effect: { type: 'remove_possession' },
          narrativeTemplate: 'Trigger 2',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'failure', defaultContext);

      expect(result).toHaveLength(0);
    });
  });

  describe('does not fire when roll exceeds probability', () => {
    it('should not fire when roll 0.9 >= probability 0.25', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'success',
          probability: 0.25,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Unlikely event.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.9 };
      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result).toHaveLength(0);
    });

    it('should not fire when roll equals probability', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'failure',
          probability: 0.5,
          effect: { type: 'remove_possession' },
          narrativeTemplate: 'Edge case.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.5 };
      const result = resolveOnUseTriggers(triggers, 'failure', context);

      expect(result).toHaveLength(0);
    });

    it('should not fire when roll 0.99 >= probability 0.99', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_success',
          probability: 0.99,
          effect: { type: 'add_possession' },
          narrativeTemplate: 'Almost certain.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.99 };
      const result = resolveOnUseTriggers(triggers, 'critical_success', context);

      expect(result).toHaveLength(0);
    });
  });

  describe('fires when roll is under probability threshold', () => {
    it('should fire when roll 0.10 < probability 0.25', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_success',
          probability: 0.25,
          effect: {
            type: 'add_condition',
            targetId: 'cond.blessed',
            tags: ['blessing'],
          },
          narrativeTemplate: 'Divine favor flows.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.1 };
      const result = resolveOnUseTriggers(triggers, 'critical_success', context);

      expect(result).toHaveLength(1);
      expect(result[0].fired).toBe(true);
    });

    it('should fire when roll 0.01 < probability 0.99', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'failure',
          probability: 0.99,
          effect: { type: 'remove_possession' },
          narrativeTemplate: 'Destruction.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.01 };
      const result = resolveOnUseTriggers(triggers, 'failure', context);

      expect(result).toHaveLength(1);
    });
  });

  describe('any_use condition matches all outcomes', () => {
    it('should fire with any_use on critical_failure outcome', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Always fires.',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'critical_failure', defaultContext);

      expect(result).toHaveLength(1);
    });

    it('should fire with any_use on failure outcome', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Always fires.',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'failure', defaultContext);

      expect(result).toHaveLength(1);
    });

    it('should fire with any_use on success outcome', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Always fires.',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'success', defaultContext);

      expect(result).toHaveLength(1);
    });

    it('should fire with any_use on critical_success outcome', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Always fires.',
        },
      ];

      const result = resolveOnUseTriggers(triggers, 'critical_success', defaultContext);

      expect(result).toHaveLength(1);
    });

    it('should fire with any_use on all four outcomes in a single call', () => {
      const outcomes = ['critical_failure', 'failure', 'success', 'critical_success'];
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Universal trigger.',
        },
      ];

      const results = outcomes.map(outcome =>
        resolveOnUseTriggers(triggers, outcome, defaultContext)
      );

      results.forEach(result => {
        expect(result).toHaveLength(1);
        expect(result[0].fired).toBe(true);
      });
    });
  });

  describe('substitutes template variables correctly', () => {
    it('should replace {actor} with context actor', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: '{actor} draws power from the artifact.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Theron',
        itemName: 'Sword',
        roll: 0.0,
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('Theron draws power from the artifact.');
    });

    it('should replace {item_name} with context itemName', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'The {item_name} glows with ancient magic.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Kael',
        itemName: 'Ring of Binding',
        roll: 0.0,
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('The Ring of Binding glows with ancient magic.');
    });

    it('should replace {target} with context target', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: '{actor} strikes {target} with the {item_name}.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Kael',
        itemName: 'Sword of Dawn',
        roll: 0.0,
        target: 'the Shadow Beast',
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('Kael strikes the Shadow Beast with the Sword of Dawn.');
    });

    it('should replace {location} with context location', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'At {location}, {actor} invokes the {item_name}.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Kael',
        itemName: 'Grimoire of Stars',
        roll: 0.0,
        location: 'the Tower of Whispers',
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('At the Tower of Whispers, Kael invokes the Grimoire of Stars.');
    });

    it('should handle the exact template from spec', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: '{actor} feels the {item_name} pulse with light.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Kael',
        itemName: 'Grimoire of Stars',
        roll: 0.0,
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('Kael feels the Grimoire of Stars pulse with light.');
    });

    it('should replace missing target with empty string', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: '{actor} and {target} celebrate.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Kael',
        itemName: 'Item',
        roll: 0.0,
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('Kael and  celebrate.');
    });

    it('should replace missing location with empty string', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Near {location}, magic stirs.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Kael',
        itemName: 'Item',
        roll: 0.0,
      };

      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].narrativeText).toBe('Near , magic stirs.');
    });

    it('should handle multiple substitutions in one template', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: '{actor} used {item_name} on {target} at {location}.',
        },
      ];

      const context: TriggerContext = {
        actor: 'Alice',
        itemName: 'Spell Scroll',
        roll: 0.0,
        target: 'the Lich King',
        location: 'the Corrupted Throne Room',
      };

      const result = resolveOnUseTriggers(triggers, 'critical_success', context);

      expect(result[0].narrativeText).toBe(
        'Alice used Spell Scroll on the Lich King at the Corrupted Throne Room.'
      );
    });
  });

  describe('handles multiple triggers independently', () => {
    it('should fire only the trigger with sufficient probability', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'trigger1' },
          narrativeTemplate: 'Trigger 1 fires.',
        },
        {
          triggerCondition: 'critical_failure',
          probability: 0.0,
          effect: { type: 'add_condition', targetId: 'trigger2' },
          narrativeTemplate: 'Trigger 2 fires.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.5 };
      const result = resolveOnUseTriggers(triggers, 'critical_failure', context);

      expect(result).toHaveLength(1);
      expect(result[0].trigger.effect.targetId).toBe('trigger1');
    });

    it('should fire both triggers if both meet conditions and probability', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'success',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'trigger1' },
          narrativeTemplate: 'First trigger fires.',
        },
        {
          triggerCondition: 'success',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'trigger2' },
          narrativeTemplate: 'Second trigger fires.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.0 };
      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result).toHaveLength(2);
      expect(result[0].trigger.effect.targetId).toBe('trigger1');
      expect(result[1].trigger.effect.targetId).toBe('trigger2');
    });

    it('should preserve trigger order in results', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'failure',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'first' },
          narrativeTemplate: 'First.',
        },
        {
          triggerCondition: 'failure',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'second' },
          narrativeTemplate: 'Second.',
        },
        {
          triggerCondition: 'failure',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'third' },
          narrativeTemplate: 'Third.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.0 };
      const result = resolveOnUseTriggers(triggers, 'failure', context);

      expect(result).toHaveLength(3);
      expect(result[0].trigger.effect.targetId).toBe('first');
      expect(result[1].trigger.effect.targetId).toBe('second');
      expect(result[2].trigger.effect.targetId).toBe('third');
    });

    it('should handle mixed matching and non-matching conditions', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_success',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'match1' },
          narrativeTemplate: 'Match.',
        },
        {
          triggerCondition: 'failure',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'nomatch' },
          narrativeTemplate: 'No match.',
        },
        {
          triggerCondition: 'critical_success',
          probability: 1.0,
          effect: { type: 'add_condition', targetId: 'match2' },
          narrativeTemplate: 'Match.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.0 };
      const result = resolveOnUseTriggers(triggers, 'critical_success', context);

      expect(result).toHaveLength(2);
      expect(result[0].trigger.effect.targetId).toBe('match1');
      expect(result[1].trigger.effect.targetId).toBe('match2');
    });
  });

  describe('returns empty array for empty triggers list', () => {
    it('should return empty array when no triggers provided', () => {
      const result = resolveOnUseTriggers([], 'success', defaultContext);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array even with valid context and outcome', () => {
      const result = resolveOnUseTriggers([], 'critical_failure', {
        actor: 'TestActor',
        itemName: 'TestItem',
        roll: 0.5,
        target: 'Target',
        location: 'Location',
      });

      expect(result).toEqual([]);
    });
  });

  describe('effect structure is preserved', () => {
    it('should preserve complex effect structure', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: {
            type: 'add_condition',
            targetId: 'cond.cursed',
            modifiers: { curse_strength: 5, duration: 10 },
            ticksRemaining: 100,
            tags: ['curse', 'debuff'],
          },
          narrativeTemplate: 'Curse activates.',
        },
      ];

      const context: TriggerContext = { ...defaultContext, roll: 0.0 };
      const result = resolveOnUseTriggers(triggers, 'critical_failure', context);

      expect(result[0].effect).toEqual(triggers[0].effect);
      expect(result[0].effect.modifiers).toEqual({ curse_strength: 5, duration: 10 });
      expect(result[0].effect.ticksRemaining).toBe(100);
      expect(result[0].effect.tags).toEqual(['curse', 'debuff']);
    });

    it('should include trigger reference in FiredTrigger', () => {
      const originalTrigger: OnUseTrigger = {
        triggerCondition: 'success',
        probability: 1.0,
        effect: { type: 'remove_possession' },
        narrativeTemplate: 'Test.',
      };

      const triggers: OnUseTrigger[] = [originalTrigger];
      const context: TriggerContext = { ...defaultContext, roll: 0.0 };
      const result = resolveOnUseTriggers(triggers, 'success', context);

      expect(result[0].trigger).toBe(originalTrigger);
    });
  });

  describe('boundary conditions', () => {
    it('should handle probability exactly at 1.0 with any roll', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 1.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Always fires.',
        },
      ];

      for (const roll of [0.0, 0.25, 0.5, 0.75, 0.99]) {
        const context: TriggerContext = { ...defaultContext, roll };
        const result = resolveOnUseTriggers(triggers, 'success', context);
        expect(result).toHaveLength(1);
      }
    });

    it('should handle probability at 0.0 and never fire', () => {
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'any_use',
          probability: 0.0,
          effect: { type: 'add_condition' },
          narrativeTemplate: 'Never fires.',
        },
      ];

      for (const roll of [0.001, 0.5, 0.999, 1.0]) {
        const context: TriggerContext = { ...defaultContext, roll };
        const result = resolveOnUseTriggers(triggers, 'success', context);
        expect(result).toHaveLength(0);
      }
    });
  });
});
