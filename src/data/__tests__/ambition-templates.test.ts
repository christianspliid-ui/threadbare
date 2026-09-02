import { describe, it, expect } from 'vitest';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
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

  it('never use target_agent_eliminated (no code binds a per-instance target)', () => {
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

/**
 * THR-812 — the `$`-ref guard covers every pool that can reach the evaluator.
 *
 * `findAmbitionTemplateById` resolves across all three pools, and `ambitionTick` uses
 * it to look up the template it hands to `evaluateAmbitionProgress`. So *any* pool's
 * milestones reach `evaluateGraphCondition` — the pre-existing guard above only ever
 * covered `EVENT_MINTED_AMBITION_TEMPLATES`, which is how the reactive pool shipped two
 * `target_agent_eliminated` milestones against `$betrayer` / `$killer`.
 *
 * The invariant pinned here is the *unbindable ref*, not the condition type. Nothing in
 * the repo resolves a `$`-prefixed `targetRef`; the condition itself is sound once given
 * a real node id, so banning the type outright would delete a working capability instead
 * of the defect. If per-instance target binding is ever built, this test is what tells
 * you to relax it deliberately rather than by accident.
 */
describe('no ambition pool authors an unbindable $-ref target (THR-812)', () => {
  const POOLS = {
    AMBITION_TEMPLATES,
    GRIEVANCE_AMBITION_TEMPLATES,
    EVENT_MINTED_AMBITION_TEMPLATES,
  } as const;

  // Every pool is non-empty, so a rename that empties one fails loudly here instead of
  // vacuously passing the per-pool loops below.
  it.each(Object.entries(POOLS))('%s is non-empty', (_name, pool) => {
    expect(pool.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(POOLS))('%s authors no $-prefixed targetRef', (_name, pool) => {
    for (const t of pool) {
      const conditions = [
        ...t.milestones.map((m) => m.condition),
        ...t.abandonmentTriggers.map((a) => a.condition),
      ];
      for (const c of conditions) {
        if (c.type !== 'target_agent_eliminated') continue;
        expect(
          c.targetRef.startsWith('$'),
          `${t.id} authors an unbindable targetRef "${c.targetRef}" — no code resolves $-refs`,
        ).toBe(false);
      }
    }
  });

  it('the two repointed vengeance milestones no longer carry a target condition', () => {
    // Named explicitly: a guard over "no $-ref" would also pass if someone deleted the
    // milestones outright. These two must still exist and still gate on something.
    const seekRevenge = findAmbitionTemplateById('ambition_seek_revenge');
    const avengeFallen = findAmbitionTemplateById('ambition_avenge_fallen');
    expect(seekRevenge).toBeDefined();
    expect(avengeFallen).toBeDefined();

    const revengeTarget = seekRevenge!.milestones.find((m) => m.id === 'revenge_target');
    const avengeStrike = avengeFallen!.milestones.find((m) => m.id === 'avenge_strike');
    expect(revengeTarget?.condition.type).toBe('agent_reach_above');
    expect(avengeStrike?.condition.type).toBe('agent_reach_above');

    // `avenge_fallen` is requires-2-of-2, so this milestone is half the completion bar —
    // the reason its auto-complete mattered more than the other one's.
    expect(avengeFallen!.completion).toEqual({ requires: 2, of: 2 });
  });
});

describe('findAmbitionTemplateById', () => {
  it('resolves across standard, minted, and reactive pools', () => {
    expect(findAmbitionTemplateById(AMBITION_TEMPLATES[0].id)?.id).toBe(AMBITION_TEMPLATES[0].id);
    expect(findAmbitionTemplateById(EVENT_MINTED_AMBITION_TEMPLATES[0].id)?.id).toBe(
      EVENT_MINTED_AMBITION_TEMPLATES[0].id,
    );
    expect(findAmbitionTemplateById(GRIEVANCE_AMBITION_TEMPLATES[0].id)?.id).toBe(
      GRIEVANCE_AMBITION_TEMPLATES[0].id,
    );
    expect(findAmbitionTemplateById('nonexistent_id')).toBeUndefined();
  });
});

describe('GRIEVANCE_AMBITION_TEMPLATES', () => {
  it('has at least 3 templates', () => {
    expect(GRIEVANCE_AMBITION_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('has unique IDs', () => {
    const ids = GRIEVANCE_AMBITION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * THR-1298 — the reactive pool's retirement, pinned.
   *
   * `triggerEvent` named a dispatch vocabulary nothing ever dispatched, and
   * `skipFilters` let a drive bypass the personality funnel that is supposed to decide
   * it. Both died with the pool. This asserts across *every* pool, not just this one,
   * because the failure mode is a template reintroducing the field somewhere else and
   * a pool-local sweep never looking there.
   */
  it('no pool reintroduces the retired reactive fields', () => {
    const allTemplates = [
      ...AMBITION_TEMPLATES,
      ...GRIEVANCE_AMBITION_TEMPLATES,
      ...EVENT_MINTED_AMBITION_TEMPLATES,
    ];
    // Guard against the vacuous arm: an empty sweep would pass this trivially.
    expect(allTemplates.length).toBeGreaterThan(15);
    for (const t of allTemplates) {
      expect('triggerEvent' in t).toBe(false);
      expect('skipFilters' in t).toBe(false);
    }
  });

  /**
   * THR-1298 — the conversion's payload: seven strategic templates that were reachable
   * only through the unreachable reactive pool's `strategicProfile`s.
   *
   * Because nothing ever assigned a reactive ambition, every one of these was dead
   * content — authored, registered, and impossible to fire. Carrying the profiles over
   * verbatim is what makes them reachable, so this pins the actual reason the
   * conversion was worth doing rather than merely that the rename happened.
   */
  it('carries over the strategic profiles that make seven verbs reachable', () => {
    const reachable = new Set(
      GRIEVANCE_AMBITION_TEMPLATES.flatMap((t) => t.strategicProfile?.templateIds ?? []),
    );
    for (const id of [
      'strategic_expose_mark',
      'strategic_suborn_warband',
      'strategic_sever_network',
      'strategic_destroy_masterwork',
      'strategic_expose_cache',
      'strategic_burn_the_charts',
      'strategic_cultivate_informant',
    ]) {
      expect(reachable.has(id)).toBe(true);
    }
  });
});

/**
 * THR-841 — no authored ambition may gate on a region *literal*.
 *
 * `agent_in_region` / `agent_not_in_region` compare against a region id, and region ids
 * are minted per world in `worldSeed.ts` as `region_0…region_N` with names generated
 * from historical-culture ownership. So a literal written into a template names nothing
 * that will ever exist, in any world, and the condition is false forever.
 *
 * Two shipped templates did exactly that and neither was reported by anything: unlike
 * trait refs, region literals have no `validateTraitRefs` equivalent, so a new dead one
 * could be authored tomorrow and nothing would notice. This sweep is that missing
 * reporter. Authors wanting "is the agent home" use the origin-region pair, which needs
 * no id known in advance.
 */
describe('THR-841 — region conditions are not authorable as literals', () => {
  const ALL_POOLS = [
    ['AMBITION_TEMPLATES', AMBITION_TEMPLATES],
    ['GRIEVANCE_AMBITION_TEMPLATES', GRIEVANCE_AMBITION_TEMPLATES],
    ['EVENT_MINTED_AMBITION_TEMPLATES', EVENT_MINTED_AMBITION_TEMPLATES],
  ] as const;

  /** Every condition authored anywhere in a template, with a readable site label. */
  function allAuthoredConditions(): Array<{ site: string; type: string; region?: string }> {
    const out: Array<{ site: string; type: string; region?: string }> = [];
    for (const [poolName, pool] of ALL_POOLS) {
      for (const template of pool) {
        for (const milestone of template.milestones) {
          const c = milestone.condition as { type: string; region?: string };
          out.push({ site: `${poolName}/${template.id}/milestone:${milestone.id}`, type: c.type, region: c.region });
        }
        for (let i = 0; i < template.abandonmentTriggers.length; i++) {
          const c = template.abandonmentTriggers[i].condition as { type: string; region?: string };
          out.push({ site: `${poolName}/${template.id}/abandonment[${i}]`, type: c.type, region: c.region });
        }
      }
    }
    return out;
  }

  it('no template authors agent_in_region or agent_not_in_region', () => {
    const offenders = allAuthoredConditions()
      .filter((c) => c.type === 'agent_in_region' || c.type === 'agent_not_in_region')
      .map((c) => `${c.site} → ${c.type}: '${c.region}'`);

    // Named rather than counted, so a failure says which template to fix (THR-688 rule A).
    expect(offenders).toEqual([]);
  });

  it('the sweep can actually see authored conditions (guards against a vacuous pass)', () => {
    // Without this, a refactor that renamed `milestones` would empty the sweep and the
    // assertion above would pass by inspecting nothing.
    const all = allAuthoredConditions();
    expect(all.length).toBeGreaterThan(20);
    expect(all.some((c) => c.type === 'agent_in_origin_region')).toBe(true);
    expect(all.some((c) => c.type === 'agent_not_in_origin_region')).toBe(true);
  });

  it('ambition_escape_cursed_land is completable again — both its milestones can fire', () => {
    // It is `requires: 2, of: 2`, so the dead `agent_not_in_region: 'cursed'` milestone
    // made the whole ambition unachievable for every agent in every world.
    const template = findAmbitionTemplateById('ambition_escape_cursed_land');
    expect(template).toBeDefined();
    expect(template!.completion).toEqual({ requires: 2, of: 2 });

    const conditionTypes = template!.milestones.map((m) => m.condition.type);
    expect(conditionTypes).toContain('agent_not_in_origin_region');
    expect(conditionTypes).not.toContain('agent_not_in_region');
  });

  it('ambition_reclaim_homeland\'s return beat reads residence, not a place name', () => {
    const template = findAmbitionTemplateById('ambition_reclaim_homeland');
    const returnMilestone = template!.milestones.find((m) => m.id === 'reclaim_return');
    expect(returnMilestone).toBeDefined();
    expect(returnMilestone!.condition).toEqual({ type: 'agent_in_origin_region' });
  });
});
