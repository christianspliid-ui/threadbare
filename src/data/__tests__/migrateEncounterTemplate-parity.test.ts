/**
 * Migration parity tests (THR-90 task 2; updated for THR-103).
 *
 * Originally exercised migrateEncounterTemplate() against representative legacy
 * templates. As Phase 4 migrations land (THR-89 thieves guild, THR-100 social,
 * THR-101 tavern, THR-103 monster), more templates become pre-migrated unified
 * templates that no longer round-trip through migrateEncounterTemplate.
 *
 * After THR-103 the file's combat representative is itself unified, so the
 * "legacy → unified" parity check is replaced with an "unified shape valid"
 * check matching the social/TG patterns. The encounterTypeToCrud invariant is
 * still verified directly with literal encounter-type strings.
 */
import { describe, it, expect } from 'vitest';
import { encounterTypeToCrud } from '../unified-action-templates';
import {
  THIEVES_GUILD_ENCOUNTER_TEMPLATES,
  THIEVES_GUILD_SOCIAL_TEMPLATES,
  TG_JOIN_TEMPLATE,
  TG_PROMOTION_TEMPLATE,
} from '../thieves-guild-encounter-content';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../social-encounter-content';
import { MONSTER_ENCOUNTER_TEMPLATES } from '../monster-encounter-content';
import { assertNoDuplicateIds, assertValidUnifiedTemplate } from '../../testing/contentInvariants';

// ─── Pick representative templates ────────────────────────────────────────

// TG templates are pre-migrated UnifiedActionTemplate (THR-89) — accessed directly
const guildTemplate = THIEVES_GUILD_ENCOUNTER_TEMPLATES.find(t => t.id === 'tg.quest.pocket_run')!;
const socialTemplate = SOCIAL_ENCOUNTER_TEMPLATES.find(t => t.id === 'social.forge_alliance')!;
const combatTemplate = MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === 'monster.hunt.minor')!;

describe('migrateEncounterTemplate parity (THR-90; updated for THR-103)', () => {
  it('all three source templates are found in their arrays', () => {
    expect(guildTemplate, 'tg.quest.pocket_run').toBeDefined();
    expect(socialTemplate, 'social.forge_alliance').toBeDefined();
    expect(combatTemplate, 'monster.hunt.minor').toBeDefined();
  });

  // ─── Guild: pre-migrated shape (THR-89) ───────────────────────────────

  it('tg.quest.pocket_run is a valid pre-migrated UnifiedActionTemplate', () => {
    // TG templates were hand-authored in unified format (THR-89) — no migration needed.
    expect(guildTemplate.id).toBe('tg.quest.pocket_run');
    expect(guildTemplate.crudType).toBe('read');
    expect(guildTemplate.reach).toBeDefined();
    expect(guildTemplate.steps.length).toBeGreaterThan(0);
    // All steps have duration as {min,max} (already unified)
    for (const step of guildTemplate.steps) {
      expect(step.duration).toMatchObject({ min: expect.any(Number), max: expect.any(Number) });
      expect(step.difficulty).toBeGreaterThanOrEqual(0);
      expect(step.difficulty).toBeLessThanOrEqual(1);
    }
    // aftermathConfig present
    expect(guildTemplate.aftermathConfig).toBeDefined();
    expect(guildTemplate.aftermathConfig.fallback).toBeDefined();
  });

  // ─── Social templates: pre-migrated shape (THR-100 Phase 3) ─────────────

  it('social.forge_alliance is a valid pre-migrated UnifiedActionTemplate', () => {
    // Social templates were hand-authored in unified format (THR-100 Phase 3) — no migration needed.
    expect(socialTemplate.id).toBe('social.forge_alliance');
    expect(socialTemplate.crudType).toBe('update');
    expect(socialTemplate.reach).toBeDefined();
    expect(socialTemplate.steps.length).toBeGreaterThanOrEqual(2);
    for (const step of socialTemplate.steps) {
      expect(step.duration).toMatchObject({ min: expect.any(Number), max: expect.any(Number) });
      expect(step.difficulty).toBeGreaterThanOrEqual(0);
      expect(step.difficulty).toBeLessThanOrEqual(1);
    }
    expect(socialTemplate.aftermathConfig).toBeDefined();
    expect(socialTemplate.aftermathConfig.fallback).toBeDefined();
  });

  // ─── Combat: pre-migrated shape (THR-103) ──────────────────────────────

  it('monster.hunt.minor is a valid pre-migrated UnifiedActionTemplate', () => {
    // Monster templates were migrated to unified format (THR-103) — no longer
    // round-trip through migrateEncounterTemplate.
    expect(combatTemplate.id).toBe('monster.hunt.minor');
    expect(combatTemplate.crudType).toBe('delete'); // duel → delete
    expect(combatTemplate.reach).toBe('iron');
    expect(combatTemplate.steps.length).toBeGreaterThanOrEqual(2);
    for (const step of combatTemplate.steps) {
      expect(step.duration).toMatchObject({ min: expect.any(Number), max: expect.any(Number) });
      expect(step.difficulty).toBeGreaterThanOrEqual(0);
      expect(step.difficulty).toBeLessThanOrEqual(1);
    }
    expect(combatTemplate.aftermathConfig).toBeDefined();
    expect(combatTemplate.aftermathConfig?.fallback).toBeDefined();
  });

  // ─── Cross-template invariants ─────────────────────────────────────────

  it('encounterTypeToCrud preserves the legacy encounter-type → CRUD mapping', () => {
    // The adapter is still used by the few remaining legacy template files
    // (army, borderland) until those migrations land.
    expect(encounterTypeToCrud('duel')).toBe('delete');
    expect(encounterTypeToCrud('explore')).toBe('read');
    expect(encounterTypeToCrud('hire')).toBe('create');
    expect(encounterTypeToCrud('lead')).toBe('update');
  });

  it('all three pre-migrated representatives compile as UnifiedActionTemplate (structural check)', () => {
    expect(guildTemplate.id).toBeTruthy();
    expect(socialTemplate.id).toBeTruthy();
    expect(combatTemplate.id).toBeTruthy();
    expect(guildTemplate.crudType).toBeTruthy();
    expect(socialTemplate.crudType).toBeTruthy();
    expect(combatTemplate.crudType).toBeTruthy();
  });
});

// ─── Bulk shape assertions: all 15 TG templates (THR-89, Codex finding) ──────

describe('TG pre-migrated shape invariants (all 15 templates)', () => {
  const ALL_TG = [
    ...THIEVES_GUILD_ENCOUNTER_TEMPLATES,
    ...THIEVES_GUILD_SOCIAL_TEMPLATES,
    TG_JOIN_TEMPLATE,
    TG_PROMOTION_TEMPLATE,
  ];

  it('covers all 15 TG templates', () => {
    expect(ALL_TG.length).toBeGreaterThanOrEqual(15);
  });

  it('ALL_TG passes structural invariants', () => {
    ALL_TG.forEach(assertValidUnifiedTemplate);
    assertNoDuplicateIds(ALL_TG);
  });

  it('every template has duration {min,max} on all steps', () => {
    for (const t of ALL_TG) {
      for (const step of t.steps) {
        expect(step.duration, `${t.id} step duration`).toMatchObject({
          min: expect.any(Number),
          max: expect.any(Number),
        });
      }
    }
  });

  it('every template has difficulty 0-1 on all steps', () => {
    for (const t of ALL_TG) {
      for (const step of t.steps) {
        expect(step.difficulty, `${t.id} step difficulty`).toBeGreaterThanOrEqual(0);
        expect(step.difficulty, `${t.id} step difficulty`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('every template final step has failBehavior fail_action', () => {
    for (const t of ALL_TG) {
      const lastStep = t.steps[t.steps.length - 1];
      expect(lastStep.failBehavior, `${t.id} final step failBehavior`).toBe('fail_action');
    }
  });

  it('every template has aftermathConfig with a fallback', () => {
    for (const t of ALL_TG) {
      expect(t.aftermathConfig, `${t.id} aftermathConfig`).toBeDefined();
      expect(t.aftermathConfig.fallback, `${t.id} aftermathConfig.fallback`).toBeDefined();
    }
  });

  it('no template has rarityTier 4', () => {
    for (const t of ALL_TG) {
      expect(t.rarityTier, `${t.id} rarityTier`).toBeLessThanOrEqual(3);
    }
  });
});
