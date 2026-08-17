/**
 * THR-1165 — a persistent consequence must name a cast member the scene casts.
 *
 * The defect this file pins was found in a shape that looked correct from every
 * static surface: the effects named `$cast:keeper` / `$cast:trader`, both keys
 * *were* present on the assembled template, and `check:chip-anchors` passed them.
 * They still wrote nothing. `withDefaultSupportBundle` had supplied the keys from
 * the setting-class default, where every spec is `delivery: 'pre-seeded'` —
 * bind-only, materializing nobody — so the binding existed only when a matching
 * NPC happened to stand at the location. Measured on seed 42, the caravan
 * encounter spawned with `supportBindings: []`.
 *
 * Two jobs, mirroring `chipBacking.test.ts`:
 *
 *   1. **Falsify the gate, both directions.** A gate never shown failing is not
 *      evidence. The fixtures below are built rather than described, and one of
 *      them carries a **non-`encounter.` id on purpose** — `check:encounter`
 *      scopes to the `encounter.` prefix (191 of 683 templates), so a rule that
 *      only ever ran there would report green over two thirds of its worklist.
 *      That is the THR-1164 population trap, and this ticket was found inside it.
 *   2. **Hold the whole catalog.** The corpus assertion at the bottom runs the
 *      rule over every live template, not a prefix.
 *
 * The rule is deliberately scoped to effect kinds that write a **durable fact onto
 * a person**. An `intelligence` record naming a cast member costs nothing when the
 * scene had no such person; a mark or a bond written onto the wrong person is a
 * false fact about a real someone, which is strictly worse than no write at all.
 */

import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';
import { castTargetViolations } from '../compositionContract';

/** A bind-only spec — the shape every setting-class default uses. */
const PRE_SEEDED_KEEPER = {
  kind: 'actor',
  key: 'keeper',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  reuseNpcRoles: ['hermit'],
  supportRole: 'wayside_keeper',
  spawnNpcRole: 'hermit',
  spawnName: 'Wayside Keeper',
};

/** A materializing spec — the shape a scene's own subject needs. */
const MATERIALIZING_KEEPER = {
  ...PRE_SEEDED_KEEPER,
  delivery: 'lazy-materialize-on-trigger',
  supportRole: 'bridge_toll_keeper',
};

interface FixtureOptions {
  readonly id?: string;
  readonly bundle?: readonly unknown[];
  readonly effects?: readonly unknown[];
}

/**
 * One ending, one reaction, one effect — the smallest thing the rule can read.
 *
 * Built, not copied from the live templates: those are now fixed, so a copy would
 * assert nothing, and a red-baseline fixture copy imports type errors besides.
 */
function fixture(options: FixtureOptions = {}): UnifiedActionTemplate {
  return {
    id: options.id ?? 'encounter.test.cast_target_fixture',
    name: 'Cast target fixture',
    supportBundle: options.bundle ?? [PRE_SEEDED_KEEPER],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The river keeps moving under the bridge.',
        changes: [],
        reactions: [
          {
            id: 'fixture.walk_on',
            label: 'Walk on',
            intent: 'The road goes on from either bank.',
            effects: options.effects ?? [
              {
                kind: 'hidden_mark',
                category: 'concealed_action',
                severity: 0.4,
                label: 'Takes a toll on planking she knows is failing',
                targetAgentId: '$cast:keeper',
                revealFamilies: ['investigation'],
              },
            ],
          },
        ],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

describe('THR-1165 — the gate goes red on the shipped shape', () => {
  it('flags a persistent consequence aimed at a bind-only default key', () => {
    const violations = castTargetViolations(fixture());
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("hidden_mark.targetAgentId names '$cast:keeper'");
    expect(violations[0]).toContain("bind-only 'pre-seeded' spec");
    // The message must name the role, because "which keeper?" is the whole point:
    // the author believes it is their scene's keeper and it is the ambient one.
    expect(violations[0]).toContain('wayside_keeper');
  });

  it('flags a sentinel naming a key the bundle does not declare at all', () => {
    const violations = castTargetViolations(fixture({ bundle: [] }));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('does not declare');
    expect(violations[0]).toContain('silently never lands');
  });

  it('catches the same defect on a template OUTSIDE the `encounter.` prefix', () => {
    // The population trap, pinned. `check:encounter` would never see this id, so
    // a rule that lived only inside the Composition Contract's own runner would
    // report green here. `check:cast-targets` sweeps the whole catalog instead.
    const violations = castTargetViolations(fixture({ id: 'hod.quest.temple_vigil' }));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("bind-only 'pre-seeded' spec");
  });

  it('goes green once the key names a materializing spec', () => {
    expect(castTargetViolations(fixture({ bundle: [MATERIALIZING_KEEPER] }))).toEqual([]);
  });
});

describe('THR-1165 — the rule is scoped to writes onto a person', () => {
  it('ignores a non-persistent effect aimed at the same bind-only key', () => {
    // `intelligence` files a note in the actor's own head. Its `targetAgentId` is
    // the *reader*, not a person being written onto, and a missing cast member
    // costs nothing. Widening the rule to every effect carrying a `$cast:` field
    // would fail this and teach authors to route around the gate.
    const violations = castTargetViolations(
      fixture({
        effects: [
          {
            kind: 'intelligence',
            category: 'trade_route',
            label: 'The caravan roads',
            detail: 'Which column runs which chalk road.',
            targetAgentId: '$cast:keeper',
            reliability: 0.85,
          },
        ],
      }),
    );
    expect(violations).toEqual([]);
  });

  it('ignores a literal node id, which is not a sentinel', () => {
    const violations = castTargetViolations(
      fixture({
        effects: [
          {
            kind: 'bond_change',
            withAgentId: 'npc_merrow',
            sentimentDelta: 0.1,
            trustDelta: 0.1,
          },
        ],
      }),
    );
    expect(violations).toEqual([]);
  });
});

describe('THR-1165 — the live corpus', () => {
  it('every template in the whole catalog names cast the scene casts', () => {
    const offenders = UNIFIED_ACTION_TEMPLATES.filter(
      template => castTargetViolations(template).length > 0,
    ).map(template => template.id);
    expect(offenders).toEqual([]);
  });

  it('covers the whole catalog, not the `encounter.` slice', () => {
    // Guards the assertion above against becoming vacuous by population: if the
    // catalog were ever filtered to the encounter prefix here, the corpus test
    // would still pass while checking a third of the templates.
    const encounterScoped = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.'));
    expect(UNIFIED_ACTION_TEMPLATES.length).toBeGreaterThan(encounterScoped.length * 2);
  });

  it('the three repaired templates cast their own subject', () => {
    const repaired = [
      { id: 'encounter.slice.unsafe_bridge', key: 'bridge_keeper' },
      { id: 'encounter.slice.riders_behind_caravan', key: 'caravan_master' },
      { id: 'encounter.slice.swindler_found', key: 'swindler' },
    ];
    for (const { id, key } of repaired) {
      const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
      expect(template, `${id} missing from the catalog`).toBeDefined();
      const spec = (template?.supportBundle ?? []).find(s => s.key === key);
      expect(spec, `${id} does not cast '${key}'`).toBeDefined();
      expect(spec?.delivery).toBe('lazy-materialize-on-trigger');
    }
  });
});
