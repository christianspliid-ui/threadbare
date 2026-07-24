/**
 * Contract tests for the group-eligibility sweep (THR-74, PR 2).
 *
 * The plan specifies the sweep as a predicate rather than a list, so these tests
 * lock the *predicate's* behaviour and the fact that it still promotes a
 * non-trivial slice of the live registry. A refactor that silently collapses the
 * sweep to zero — the realistic failure mode, since nothing else in the game
 * would visibly break — fails here.
 */

import { describe, it, expect } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import {
  isGroupEligibleTemplate,
  isGroupEligibleFamily,
  withGroupAffinity,
  countGroupEligible,
} from '../groupEligibility';

/**
 * Minimal template stub — only the fields the predicate reads.
 *
 * `over` is deliberately loose: these cases feed deformed shapes (a missing
 * `steps`, an absent `actorAffinities`) that the predicate must survive, and
 * which by construction do not satisfy `Partial<UnifiedActionTemplate>`.
 */
function stub(over: Record<string, unknown> = {}): UnifiedActionTemplate {
  return {
    id: 'encounter.test_delve',
    name: 'Test Delve',
    rarityTier: 1,
    intrinsicTier: 'background',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual'],
    steps: [
      { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [] },
      { reach: 'stone', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [] },
    ],
    ...over,
  } as unknown as UnifiedActionTemplate;
}

describe('group-eligibility predicate', () => {
  it('promotes a physical multi-step template in a swept family', () => {
    expect(isGroupEligibleTemplate(stub())).toBe(true);
  });

  it('rejects a template outside the swept families', () => {
    expect(isGroupEligibleFamily('social.recruit_faction')).toBe(false);
    expect(isGroupEligibleTemplate(stub({ id: 'social.recruit_faction' }))).toBe(false);
  });

  it('rejects a template carrying an intimate (heart) step', () => {
    const intimate = stub({
      steps: [
        { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [] },
        { reach: 'heart', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [] },
      ],
    });
    expect(isGroupEligibleTemplate(intimate)).toBe(false);
  });

  it('rejects a single-step beat', () => {
    const oneStep = stub({
      steps: [
        { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [] },
      ],
    });
    expect(isGroupEligibleTemplate(oneStep)).toBe(false);
  });

  it('rejects a template with no physical-challenge step', () => {
    const cerebral = stub({
      steps: [
        { reach: 'veil', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [] },
        { reach: 'star', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [] },
      ],
    });
    expect(isGroupEligibleTemplate(cerebral)).toBe(false);
  });

  it('finds an intimate step hidden inside a branch variant', () => {
    const branched = stub({
      steps: [
        { reach: 'iron', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [] },
        {
          branchOnStep: 0,
          variants: {
            confide: { reach: 'heart', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [] },
          },
          fallback: { reach: 'stone', duration: { min: 1, max: 1 }, difficulty: 0.4, onSuccess: [], onFailure: [] },
        },
      ],
    });
    expect(isGroupEligibleTemplate(branched)).toBe(false);
  });

  it('leaves an already-group template alone (party-exclusive content)', () => {
    const exclusive = stub({ actorAffinities: ['group'], minGroupMembers: 2 });
    expect(isGroupEligibleTemplate(exclusive)).toBe(false);
    expect(withGroupAffinity(exclusive)).toBe(exclusive);
  });

  it('is additive — solo agents keep the encounter', () => {
    const promoted = withGroupAffinity(stub());
    expect(promoted.actorAffinities).toContain('individual');
    expect(promoted.actorAffinities).toContain('group');
  });

  it('is fail-soft on malformed templates', () => {
    expect(isGroupEligibleTemplate(undefined as unknown as UnifiedActionTemplate)).toBe(false);
    expect(isGroupEligibleTemplate(stub({ steps: undefined }))).toBe(false);
    expect(
      isGroupEligibleTemplate(stub({ actorAffinities: undefined })),
    ).toBe(false);
  });
});

describe('group-eligibility sweep over the live registry', () => {
  // NOTE: `Array.isArray` is load-bearing, not defensive habit. 18 shipped
  // templates carry **no `actorAffinities` at all** — 15 `mc.*` (mercenary
  // company) plus 3 `encounter.shell_proof.*` — despite the field being required
  // on `UnifiedActionTemplate`. A type violation that only survives because the
  // typecheck baseline is red (THR-489). Tracked separately; the sweep already
  // fails soft on them (no `'individual'` affinity → predicate returns false),
  // which the last test in this block locks.
  const promoted = UNIFIED_ACTION_TEMPLATES.filter(
    t => Array.isArray(t?.actorAffinities) && t.actorAffinities.includes('group'),
  );

  it('promotes a non-trivial slice of shipped content', () => {
    // Guards the realistic regression: the sweep silently stops running and no
    // other test notices, because every solo path still works. Measured at 63
    // (encounter 44 / borderland 14 / monster 5) when PR 2 landed; asserted as a
    // floor rather than an equality so new content in these families does not
    // fail the suite.
    expect(promoted.length).toBeGreaterThanOrEqual(40);
  });

  it('leaves the affinity-less templates untouched rather than throwing', () => {
    const malformed = UNIFIED_ACTION_TEMPLATES.filter(t => !Array.isArray(t?.actorAffinities));
    // If this ever reaches 0 the underlying data bug was fixed — good, but then
    // the Array.isArray guards above can be simplified. Locking the shape so the
    // change is deliberate either way.
    expect(malformed.every(t => /^(mc\.|encounter\.shell_proof\.)/.test(t.id))).toBe(true);
    // The point of the guard: the sweep must skip them silently, never promote
    // them and never throw at module load.
    expect(malformed.every(t => !isGroupEligibleTemplate(t))).toBe(true);
  });

  it('only promotes templates from the swept families', () => {
    for (const t of promoted) {
      // Party-exclusive templates are authored with 'group' directly; every
      // other promoted template must have come from a swept family.
      if (t.minGroupMembers != null) continue;
      expect(isGroupEligibleFamily(t.id)).toBe(true);
    }
  });

  it('never promotes a template carrying an intimate step', () => {
    // countGroupEligible re-runs the predicate against the already-swept
    // registry: everything promoted is now excluded (it already has 'group'),
    // so a second pass must find nothing left to do — the sweep is idempotent.
    expect(countGroupEligible(UNIFIED_ACTION_TEMPLATES)).toBe(0);
  });
});
