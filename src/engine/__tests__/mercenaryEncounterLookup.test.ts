/**
 * Gap-fill tests: Mercenary encounter template lookup accessibility.
 *
 * Validates that mc.* templates are reachable via both:
 *   - getMercenaryEncounterById (direct lookup)
 *   - getAnyEncounterById (aggregated lookup used by the engine)
 *
 * Requirement: Plan 12-01 must_haves — "Mercenary company encounter templates
 * registered (mc.join, mc.promotion, 4+ quest, 3+ social)"
 */

import { describe, it, expect } from 'vitest';
import { getMercenaryEncounterById } from '../../data/mercenary-encounter-content';
import { getAnyEncounterById } from '../../data/encounter-content';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

describe('getMercenaryEncounterById — direct template access', () => {
  it('returns mc.join template by ID', () => {
    const template = getMercenaryEncounterById('mc.join');
    expect(template).toBeDefined();
    expect(template!.id).toBe('mc.join');
  });

  it('returns mc.promotion template by ID', () => {
    const template = getMercenaryEncounterById('mc.promotion');
    expect(template).toBeDefined();
    expect(template!.id).toBe('mc.promotion');
  });

  it('returns mc.quest.patrol template by ID', () => {
    const template = getMercenaryEncounterById('mc.quest.patrol');
    expect(template).toBeDefined();
    expect(template!.id).toBe('mc.quest.patrol');
  });

  it('returns mc.quest.guard_caravan template by ID', () => {
    const template = getMercenaryEncounterById('mc.quest.guard_caravan');
    expect(template).toBeDefined();
  });

  it('returns mc.quest.collect_bounty template by ID', () => {
    const template = getMercenaryEncounterById('mc.quest.collect_bounty');
    expect(template).toBeDefined();
  });

  it('returns mc.quest.siege_work template by ID', () => {
    const template = getMercenaryEncounterById('mc.quest.siege_work');
    expect(template).toBeDefined();
  });

  it('returns mc.social.sparring_ring template by ID', () => {
    const template = getMercenaryEncounterById('mc.social.sparring_ring');
    expect(template).toBeDefined();
  });

  it('returns mc.social.war_stories template by ID', () => {
    const template = getMercenaryEncounterById('mc.social.war_stories');
    expect(template).toBeDefined();
  });

  it('returns mc.social.contract_negotiation template by ID', () => {
    const template = getMercenaryEncounterById('mc.social.contract_negotiation');
    expect(template).toBeDefined();
  });

  it('returns undefined for unknown ID', () => {
    expect(getMercenaryEncounterById('mc.nonexistent')).toBeUndefined();
  });
});

describe('getAnyEncounterById — engine aggregated lookup includes mc.* templates', () => {
  it('mc.join is accessible via getAnyEncounterById', () => {
    const template = getAnyEncounterById('mc.join');
    expect(template).toBeDefined();
    expect(template!.id).toBe('mc.join');
  });

  it('mc.quest.patrol is accessible via getAnyEncounterById', () => {
    const template = getAnyEncounterById('mc.quest.patrol');
    expect(template).toBeDefined();
    expect(template!.id).toBe('mc.quest.patrol');
  });

  it('mc.promotion is accessible via getAnyEncounterById', () => {
    const template = getAnyEncounterById('mc.promotion');
    expect(template).toBeDefined();
    expect(template!.id).toBe('mc.promotion');
  });

  it('mc.social.war_stories is accessible via getAnyEncounterById', () => {
    const template = getAnyEncounterById('mc.social.war_stories');
    expect(template).toBeDefined();
  });

  it('mc.social.contract_negotiation is accessible via getAnyEncounterById', () => {
    const template = getAnyEncounterById('mc.social.contract_negotiation');
    expect(template).toBeDefined();
  });

  it('mc.elite.war_council is accessible via getAnyEncounterById', () => {
    const template = getAnyEncounterById('mc.elite.war_council');
    expect(template).toBeDefined();
  });
});

describe('mc.* template shape validation', () => {
  it('mc.join has steps, step reach=iron, and aftermathConfig', () => {
    const t = getMercenaryEncounterById('mc.join') as UnifiedActionTemplate;
    expect(t).toBeDefined();
    expect(t.steps.length).toBeGreaterThan(0);
    const firstStep = t.steps[0] as { reach?: string };
    expect(firstStep.reach).toBe('iron');
    expect(t.aftermathConfig).toBeDefined();
  });

  it('mc.quest.patrol has at least 2 steps', () => {
    const t = getMercenaryEncounterById('mc.quest.patrol')!;
    expect(t.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('mc.promotion has positive difficulty', () => {
    const t = getMercenaryEncounterById('mc.promotion')!;
    expect(t.steps[0].difficulty).toBeGreaterThan(0);
  });
});
