import { describe, it, expect } from 'vitest';
import { NPC_ACTION_TEMPLATES } from '../npc-action-templates';

describe('NPC_ACTION_TEMPLATES', () => {
  it('has at least 15 templates', () => {
    expect(NPC_ACTION_TEMPLATES.length).toBeGreaterThanOrEqual(15);
  });

  it('all templates have unique IDs', () => {
    const ids = NPC_ACTION_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all template IDs start with npc_', () => {
    for (const template of NPC_ACTION_TEMPLATES) {
      expect(template.id).toMatch(/^npc_/);
    }
  });

  it('all templates target actor category', () => {
    for (const template of NPC_ACTION_TEMPLATES) {
      expect(template.targetCategories).toContain('actor');
    }
  });

  it('all non-role-gated templates require npcRole via requiredNodeProperties', () => {
    // Role-gated templates have a specific string npcRole value
    // Non-role-gated templates should have npcRole: undefined (sentinel "has any npcRole")
    for (const template of NPC_ACTION_TEMPLATES) {
      expect(template.requiredNodeProperties).toBeDefined();
      expect('npcRole' in (template.requiredNodeProperties ?? {})).toBe(true);
    }
  });

  it('role-gated templates specify an exact npcRole string', () => {
    const roleGated = [
      'npc_trade_goods',
      'npc_commission_craft',
      'npc_seek_healing',
      'npc_request_shelter',
      'npc_hire_guide',
    ];

    for (const id of roleGated) {
      const template = NPC_ACTION_TEMPLATES.find(t => t.id === id);
      expect(template, `Template ${id} not found`).toBeDefined();
      const roleVal = template!.requiredNodeProperties?.['npcRole'];
      expect(typeof roleVal).toBe('string');
      expect((roleVal as string).length).toBeGreaterThan(0);
    }
  });

  it('non-role-gated templates have npcRole: undefined as sentinel', () => {
    const nonRoleGated = [
      'npc_ask_information',
      'npc_eavesdrop',
      'npc_read_intentions',
      'npc_befriend',
      'npc_intimidate',
      'npc_bribe',
      'npc_recruit',
      'npc_charm',
      'npc_bless',
      'npc_curse',
      'npc_promote_to_agent',
    ];

    for (const id of nonRoleGated) {
      const template = NPC_ACTION_TEMPLATES.find(t => t.id === id);
      expect(template, `Template ${id} not found`).toBeDefined();
      expect(template!.requiredNodeProperties?.['npcRole']).toBeUndefined();
    }
  });

  it('all templates have narrative templates with initiation, success, failure', () => {
    for (const template of NPC_ACTION_TEMPLATES) {
      expect(template.narrativeTemplates.initiation).toBeTruthy();
      expect(template.narrativeTemplates.success).toBeTruthy();
      expect(template.narrativeTemplates.failure).toBeTruthy();
    }
  });

  it('all templates have valid steps', () => {
    for (const template of NPC_ACTION_TEMPLATES) {
      expect(template.steps.length).toBeGreaterThan(0);
      for (const step of template.steps) {
        expect(step.difficulty).toBeGreaterThanOrEqual(0);
        expect(step.difficulty).toBeLessThanOrEqual(1);
      }
    }
  });

  it('all templates have motivations array', () => {
    for (const template of NPC_ACTION_TEMPLATES) {
      expect(Array.isArray(template.motivations)).toBe(true);
    }
  });
});
