import { describe, it, expect } from 'vitest';
import {
  AMBITION_TEMPLATES,
  REACTIVE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  MINT_TEMPLATE_COUNT,
  findAmbitionTemplateById,
} from '../ambition-templates';
import { REACH_DOMAINS } from '../../types/traits';
import { checkAbandonment } from '../../engine/ambitionLifecycle';

/**
 * THR-808 — the dynasty founder's death actually abandons the dynasty.
 *
 * This asserts the *wiring*, not the evaluator: the shipped template, the real
 * `checkAbandonment`, and the engine's real death flag, end to end. The unit coverage
 * for `agent_deceased` lives in `engine/__tests__/graphConditions.test.ts`; what could
 * still rot here is the template edit — someone reverting the condition to the dead
 * `agent_lacks_trait: 'living'` ref would leave every evaluator test green.
 */
describe('THR-808 — ambition_found_dynasty abandons on the founder\'s death', () => {
  const template = findAmbitionTemplateById('ambition_found_dynasty');

  function graphWith(properties: Record<string, unknown>) {
    return {
      getNode: (id: string) => (id === 'founder' ? { id, properties } : undefined),
      getOutgoingEdges: () => [],
      getIncomingEdges: () => [],
    };
  }

  it('the template still exists and still declares an abandonment trigger', () => {
    expect(template).toBeDefined();
    expect(template!.abandonmentTriggers.length).toBeGreaterThanOrEqual(1);
  });

  it('abandons once the founder is deceased', () => {
    expect(checkAbandonment(template!, graphWith({ deceased: true }), 'founder')).toBe(true);
  });

  it('does not abandon while the founder lives', () => {
    expect(checkAbandonment(template!, graphWith({}), 'founder')).toBe(false);
  });

  it('has no abandonment trigger left that gates on a trait named `living`', () => {
    // The specific dead ref this ticket removed. Named explicitly so a revert fails
    // loudly rather than silently restoring an ambition that can never be abandoned.
    for (const trigger of template!.abandonmentTriggers) {
      const gatesOnLiving =
        (trigger.condition.type === 'agent_has_trait'
          || trigger.condition.type === 'agent_lacks_trait')
        && trigger.condition.trait === 'living';
      expect(gatesOnLiving).toBe(false);
    }
  });
});

describe('AMBITION_TEMPLATES', () => {
  it('has at least 8 templates', () => {
    expect(AMBITION_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it('has unique IDs', () => {
    const ids = AMBITION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template has at least one reach floor', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(Object.keys(t.reachFloors).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every reach floor references a valid reach domain', () => {
    for (const t of AMBITION_TEMPLATES) {
      for (const reach of Object.keys(t.reachFloors)) {
        expect(REACH_DOMAINS).toContain(reach);
      }
    }
  });

  it('every reach affinity references a valid reach domain', () => {
    for (const t of AMBITION_TEMPLATES) {
      for (const reach of Object.keys(t.reachAffinity)) {
        expect(REACH_DOMAINS).toContain(reach);
      }
    }
  });

  it('every template has at least 2 milestones', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(t.milestones.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('completion requires <= total milestones', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(t.completion.requires).toBeLessThanOrEqual(t.completion.of);
      expect(t.completion.of).toBe(t.milestones.length);
    }
  });

  it('has selection and completion prose', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(t.selectionProse.length).toBeGreaterThanOrEqual(1);
      expect(t.completionProse.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers at least 5 different categories', () => {
    const categories = new Set(AMBITION_TEMPLATES.map((t) => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});

describe('EVENT_MINTED_AMBITION_TEMPLATES', () => {
  it('authors MINT_TEMPLATE_COUNT templates (>= 6 in v1)', () => {
    expect(EVENT_MINTED_AMBITION_TEMPLATES.length).toBe(MINT_TEMPLATE_COUNT);
    expect(EVENT_MINTED_AMBITION_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it('has unique IDs distinct from the standard pool', () => {
    const ids = EVENT_MINTED_AMBITION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const standardIds = new Set(AMBITION_TEMPLATES.map((t) => t.id));
    for (const id of ids) expect(standardIds.has(id)).toBe(false);
  });

  it('are standard templates, not reactive (no triggerEvent / skipFilters)', () => {
    for (const t of EVENT_MINTED_AMBITION_TEMPLATES) {
      expect('triggerEvent' in t).toBe(false);
      expect('skipFilters' in t).toBe(false);
    }
  });

  it('never use target_agent_eliminated (auto-completes against unbindable $-refs)', () => {
    for (const t of EVENT_MINTED_AMBITION_TEMPLATES) {
      for (const m of t.milestones) {
        expect(m.condition.type).not.toBe('target_agent_eliminated');
      }
      for (const a of t.abandonmentTriggers) {
        expect(a.condition.type).not.toBe('target_agent_eliminated');
      }
    }
  });

  it('meet the same structural bar as standard templates', () => {
    for (const t of EVENT_MINTED_AMBITION_TEMPLATES) {
      expect(Object.keys(t.reachFloors).length).toBeGreaterThanOrEqual(1);
      expect(t.milestones.length).toBeGreaterThanOrEqual(2);
      expect(t.completion.of).toBe(t.milestones.length);
      expect(t.completion.requires).toBeLessThanOrEqual(t.completion.of);
      expect(t.selectionProse.length).toBeGreaterThanOrEqual(1);
      expect(t.completionProse.length).toBeGreaterThanOrEqual(1);
      for (const reach of Object.keys(t.reachAffinity)) expect(REACH_DOMAINS).toContain(reach);
      for (const reach of Object.keys(t.reachFloors)) expect(REACH_DOMAINS).toContain(reach);
    }
  });
});

describe('findAmbitionTemplateById', () => {
  it('resolves across standard, minted, and reactive pools', () => {
    expect(findAmbitionTemplateById(AMBITION_TEMPLATES[0].id)?.id).toBe(AMBITION_TEMPLATES[0].id);
    expect(findAmbitionTemplateById(EVENT_MINTED_AMBITION_TEMPLATES[0].id)?.id).toBe(
      EVENT_MINTED_AMBITION_TEMPLATES[0].id,
    );
    expect(findAmbitionTemplateById(REACTIVE_AMBITION_TEMPLATES[0].id)?.id).toBe(
      REACTIVE_AMBITION_TEMPLATES[0].id,
    );
    expect(findAmbitionTemplateById('nonexistent_id')).toBeUndefined();
  });
});

describe('REACTIVE_AMBITION_TEMPLATES', () => {
  it('has at least 3 templates', () => {
    expect(REACTIVE_AMBITION_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('each has a triggerEvent', () => {
    for (const t of REACTIVE_AMBITION_TEMPLATES) {
      expect(t.triggerEvent).toBeDefined();
    }
  });

  it('has unique IDs', () => {
    const ids = REACTIVE_AMBITION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
