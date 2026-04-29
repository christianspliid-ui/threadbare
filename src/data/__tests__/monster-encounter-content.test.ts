/**
 * Monster Encounter Content Tests — UnifiedActionTemplate (THR-103).
 *
 * Tests for monster encounter templates after Phase 4 migration. Verifies
 * unified shape, lookup behavior, encounter pool registration via the unified
 * registry, and Adventuring Guild quest wiring.
 */

import { describe, it, expect } from 'vitest';
import {
  MONSTER_ENCOUNTER_TEMPLATES,
  getMonsterEncounterById,
} from '../monster-encounter-content';
import { getAnyEncounterById } from '../encounter-content';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { ADVENTURING_GUILD_DEFINITION } from '../faction-definitions';
import { assertNoDuplicateIds, assertValidUnifiedTemplate } from '../../testing/contentInvariants';

describe('monster-encounter-content (THR-103 migration)', () => {
  describe('MONSTER_ENCOUNTER_TEMPLATES', () => {
    it('has the five expected templates', () => {
      const ids = MONSTER_ENCOUNTER_TEMPLATES.map(t => t.id).sort();
      expect(ids).toEqual([
        'monster.encounter.ambush',
        'monster.encounter.horde_raid',
        'monster.encounter.lair_defense',
        'monster.hunt.minor',
        'monster.hunt.named_elite',
      ]);
    });

    it('every template passes structural unified-template invariants', () => {
      MONSTER_ENCOUNTER_TEMPLATES.forEach(assertValidUnifiedTemplate);
      assertNoDuplicateIds(MONSTER_ENCOUNTER_TEMPLATES);
    });

    it('every template has duration {min,max} and difficulty 0..1 on every step', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        for (const step of t.steps) {
          expect(step.duration, `${t.id} step duration`).toMatchObject({
            min: expect.any(Number),
            max: expect.any(Number),
          });
          expect(step.difficulty, `${t.id} step difficulty`).toBeGreaterThanOrEqual(0);
          expect(step.difficulty, `${t.id} step difficulty`).toBeLessThanOrEqual(1);
        }
      }
    });

    it('every template final step has failBehavior fail_action', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        const lastStep = t.steps[t.steps.length - 1];
        expect(lastStep.failBehavior, `${t.id} final step failBehavior`).toBe('fail_action');
      }
    });

    it('every template has aftermathConfig with a fallback', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        expect(t.aftermathConfig, `${t.id} aftermathConfig`).toBeDefined();
        expect(t.aftermathConfig?.fallback, `${t.id} aftermathConfig.fallback`).toBeDefined();
      }
    });

    it('every template authors at least one aftermath reaction with a typed effect', () => {
      // Hard requirement: contextual aftermath, not just generic reward pools.
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        const reactions = t.aftermathConfig?.fallback.reactions ?? [];
        expect(reactions.length, `${t.id} should author at least one aftermath reaction`).toBeGreaterThan(0);
        const hasTypedEffect = reactions.some(r =>
          r.effects.some(e =>
            e.kind === 'hidden_mark'
            || e.kind === 'encounter_seed'
            || e.kind === 'intelligence'
            || e.kind === 'reputation_tally'
            || e.kind === 'emit_omen',
          ),
        );
        expect(hasTypedEffect, `${t.id} should author at least one hidden_mark / encounter_seed / intelligence / reputation_tally / emit_omen`).toBe(true);
      }
    });

    it('every step has narrativeTemplate prose at least 40 chars (no placeholder stubs)', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        for (const step of t.steps) {
          expect(step.narrativeTemplate?.length ?? 0, `${t.id} step narrativeTemplate`).toBeGreaterThan(40);
        }
      }
    });

    it('every step has authored success and failure afterimages', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        for (const step of t.steps) {
          expect(step.successAfterimage?.length ?? 0, `${t.id} step successAfterimage`).toBeGreaterThan(20);
          expect(step.failureAfterimage?.length ?? 0, `${t.id} step failureAfterimage`).toBeGreaterThan(20);
        }
      }
    });

    it('every narrative field uses {name} enrichment placeholder', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        for (const step of t.steps) {
          const fields = [step.narrativeTemplate, step.successAfterimage, step.failureAfterimage].filter(
            (s): s is string => typeof s === 'string',
          );
          for (const field of fields) {
            expect(field, `${t.id} field should reference {name}`).toMatch(/\{name\}/);
          }
        }
      }
    });

    it('lair_defense and horde_raid (world-mutating events) author update_node GraphOps on the climactic step', () => {
      const lairDefense = MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === 'monster.encounter.lair_defense')!;
      const hordeRaid = MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === 'monster.encounter.horde_raid')!;

      const lairFinalStep = lairDefense.steps[lairDefense.steps.length - 1];
      expect(lairFinalStep.onSuccess.length, 'lair_defense climactic onSuccess should mutate the world').toBeGreaterThan(0);
      expect(lairFinalStep.onSuccess[0].op).toBe('update_node');

      const hordeFinalStep = hordeRaid.steps[hordeRaid.steps.length - 1];
      expect(hordeFinalStep.onSuccess.length, 'horde_raid climactic onSuccess should mutate prosperity').toBeGreaterThan(0);
      expect(hordeFinalStep.onFailure.length, 'horde_raid climactic onFailure should mutate prosperity').toBeGreaterThan(0);
    });
  });

  describe('getMonsterEncounterById', () => {
    it('returns the minor hunt template for monster.hunt.minor', () => {
      const template = getMonsterEncounterById('monster.hunt.minor');
      expect(template).toBeDefined();
      expect(template?.id).toBe('monster.hunt.minor');
    });

    it('returns undefined for unknown id', () => {
      expect(getMonsterEncounterById('nonexistent.template')).toBeUndefined();
    });

    it('template monster.hunt.minor has locationSubtypes containing lair', () => {
      const template = getMonsterEncounterById('monster.hunt.minor');
      expect(template?.locationSubtypes).toContain('lair');
    });

    it('template monster.encounter.ambush has locationSubtypes containing wilderness', () => {
      const template = getMonsterEncounterById('monster.encounter.ambush');
      expect(template?.locationSubtypes).toContain('wilderness');
    });
  });

  describe('Unified pool registration', () => {
    it('getUnifiedTemplateById resolves all five monster templates', () => {
      for (const t of MONSTER_ENCOUNTER_TEMPLATES) {
        const resolved = getUnifiedTemplateById(t.id);
        expect(resolved, `${t.id} should be in unified pool`).toBeDefined();
        expect(resolved?.id).toBe(t.id);
      }
    });

    it('getAnyEncounterById fallback chain still resolves monster templates', () => {
      // Backward-compat path: encounter resolution that goes through legacy
      // getAnyEncounterById should still find migrated monster templates.
      for (const id of ['monster.hunt.minor', 'monster.hunt.named_elite', 'monster.encounter.ambush']) {
        const template = getAnyEncounterById(id);
        expect(template, `${id} via getAnyEncounterById`).toBeDefined();
        expect(template?.id).toBe(id);
      }
    });
  });

  describe('Adventuring Guild quest wiring', () => {
    it('Adventuring Guild questTemplateIds contains monster.hunt.minor', () => {
      expect(ADVENTURING_GUILD_DEFINITION.questTemplateIds).toContain('monster.hunt.minor');
    });

    it('Adventuring Guild questTemplateIds contains monster.hunt.named_elite', () => {
      expect(ADVENTURING_GUILD_DEFINITION.questTemplateIds).toContain('monster.hunt.named_elite');
    });
  });
});
