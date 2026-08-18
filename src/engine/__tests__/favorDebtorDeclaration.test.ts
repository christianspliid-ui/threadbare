/**
 * `favor_creation` must name its debtor (THR-1175).
 *
 * The third liveness shape in `nudgeGrantLiveness`, and the one that needed a
 * director probe to see. Its two siblings catch an id that names nothing and a
 * query that selects nothing; this catches a write whose consumers all *exist*
 * and none of which can ever fire for the operand it will actually receive.
 *
 * Shipped state before this gate: the applier's debtor was `action.targetId`
 * unconditionally. That is a person only when the encounter happens to target
 * one, and The Grateful Kin targets a location — so the beat minted "Sacred Grove
 * owes them a favour", an edge no `owes_favor` consumer reads, whose only
 * remaining lifecycle event was silent deletion at expiry.
 *
 * The gate is written as a **falsification pair**, because a validator that only
 * ever sees clean content is indistinguishable from one that returns an empty
 * array: the red arm reconstructs the exact pre-fix shape and asserts it is
 * caught, the green arm asserts the declared shape passes, and the corpus arm
 * asserts what actually ships is clean. Remove the predicate and the first two
 * both fail.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { SLICE_TEMPLATE_IDS } from '../../data/encounters/vertical-slice';
import { validateFavorDebtors, formatUndeclaredFavorDebtors } from '../nudgeGrantLiveness';
import type { UnifiedActionTemplate, EncounterAftermathReactionEffect } from '../../types/unifiedAction';

// ─── Fixtures ─────────────────────────────────────────────────────

/**
 * A minimal template carrying one aftermath reaction effect.
 *
 * Deliberately hand-built rather than cloned from the shipped Grateful Kin: the
 * red arm has to keep asserting the pre-fix shape is caught *after* the shipped
 * encounter stops having it, and a fixture that reads live content would go
 * vacuously green the moment the content was fixed (the empty-population trap
 * this file's siblings were written against).
 */
function templateWithEffect(
  id: string,
  effect: EncounterAftermathReactionEffect,
): UnifiedActionTemplate {
  return {
    id,
    name: 'Fixture',
    reach: 'heart',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    steps: [],
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'fixture',
        changes: [],
        reactions: [{ id: 'fixture.reaction', label: 'Fixture', intent: 'Fixture', effects: [effect] }],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

const BARE_FAVOUR: EncounterAftermathReactionEffect = {
  kind: 'favor_creation',
  magnitudeRange: [0.4, 0.7],
  context: 'The fen-road kindness.',
};

const DECLARED_FAVOUR: EncounterAftermathReactionEffect = {
  kind: 'favor_creation',
  magnitudeRange: [0.4, 0.7],
  context: 'The fen-road kindness.',
  debtorAgentId: '$cast:innkeeper',
};

describe('THR-1175 — favor_creation must declare who owes', () => {
  it('RED: the pre-fix shape — a bare favor_creation — is caught', () => {
    const report = validateFavorDebtors([templateWithEffect('fixture.bare', BARE_FAVOUR)]);

    expect(report.checked).toBe(1);
    expect(report.undeclared).toHaveLength(1);
    expect(report.undeclared[0]).toMatchObject({
      templateId: 'fixture.bare',
      site: 'aftermath.fallback.fixture.reaction',
    });
  });

  it('GREEN: naming the debtor with a cast sentinel passes', () => {
    const report = validateFavorDebtors([templateWithEffect('fixture.declared', DECLARED_FAVOUR)]);

    expect(report.checked).toBe(1);
    expect(report.undeclared).toHaveLength(0);
  });

  it('a whitespace-only debtor is not a declaration', () => {
    // The failure mode a `!== undefined` check would let through: the field is
    // present, the author named nobody, and the runtime falls straight back to
    // `action.targetId` — the exact behaviour the gate exists to stop.
    const report = validateFavorDebtors([
      templateWithEffect('fixture.blank', { ...BARE_FAVOUR, debtorAgentId: '   ' }),
    ]);

    expect(report.undeclared).toHaveLength(1);
  });

  it('a place opening rather than a person owing is never this gate\'s business', () => {
    // The other authored route, and the one The Grateful Kin now takes. It writes
    // a location condition instead of a favour, so there is no favor_creation to
    // check — `checked` is 0, not "0 problems out of 1".
    const report = validateFavorDebtors([
      templateWithEffect('fixture.place', {
        kind: 'apply_condition',
        conditionTraitId: 'trait.condition.location.standing_welcome',
        targetLocationId: '$target',
        durationTicks: 120,
      }),
    ]);

    expect(report.checked).toBe(0);
    expect(report.undeclared).toHaveLength(0);
  });

  it('the failure message tells an author both ways out', () => {
    const report = validateFavorDebtors([templateWithEffect('fixture.bare', BARE_FAVOUR)]);
    const message = formatUndeclaredFavorDebtors(report.undeclared);

    expect(message).toContain('fixture.bare');
    expect(message).toContain('debtorAgentId');
    expect(message).toContain('apply_condition');
  });

  it('reports cleanly when there is nothing to report', () => {
    expect(formatUndeclaredFavorDebtors([])).toBe('favor_creation debtors: all declared');
  });

  // ─── The shipped corpus ─────────────────────────────────────────

  it('the shipped corpus declares every favour debtor it authors', () => {
    const report = validateFavorDebtors(UNIFIED_ACTION_TEMPLATES);

    expect(formatUndeclaredFavorDebtors(report.undeclared))
      .toBe('favor_creation debtors: all declared');
  });

  it('The Grateful Kin no longer mints a favour owed by a town', () => {
    // The specific regression, pinned by id. The encounter targets a location, so
    // any `favor_creation` it authors is a debt the place cannot repay — whether
    // or not the debtor field is filled in. Asserting *absence* rather than
    // "declared" is deliberate: this scene's honest shape is a location
    // condition, and a future edit that re-adds a favour here with a plausible
    // sentinel would pass the general gate while re-opening the exact defect.
    const kin = UNIFIED_ACTION_TEMPLATES.find(t => t.id === SLICE_TEMPLATE_IDS.gratefulKin);
    if (!kin) throw new Error('The Grateful Kin is not in the shipped corpus');

    const report = validateFavorDebtors([kin]);
    expect(report.checked).toBe(0);

    // Belt and braces: the whole serialized template, so a favour authored at any
    // site the walker might not reach is still caught.
    expect(JSON.stringify(kin)).not.toContain('favor_creation');
  });
});
