import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { filterAscendantHand } from '../handFilter';

function makeTemplate(
  id: string,
  overrides: Partial<UnifiedActionTemplate> = {},
): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 1,
    intrinsicTier: 'background',
    name: id,
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.2,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 1,
    actorAffinities: ['ascendant'],
    targetCategories: ['actor'],
    motivations: ['mercy_ruthlessness'],
    narrativeTemplates: {
      initiation: 'init',
      success: 'success',
      failure: 'fail',
    },
    ...overrides,
  };
}

function baseContext() {
  return {
    sceneTargetCategories: ['actor'] as const,
    essencePool: { force: 3, spirit: 3 },
    accessibleSpheres: ['force', 'spirit'] as const,
    targetBondTier: 2,
    placeContext: { placeSphere: 'spirit' as const },
  };
}

describe('filterAscendantHand', () => {
  it('hides cards that fail target match', () => {
    const deck = [makeTemplate('t.actor', { targetCategories: ['actor'] })];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      sceneTargetCategories: ['location'],
    });

    expect(result.playable).toHaveLength(0);
    expect(result.dimmed).toHaveLength(0);
    expect(result.hidden).toHaveLength(1);
    expect(result.hidden[0].hiddenReason.code).toBe('target_mismatch');
  });

  it('dims cards when essence cost is unavailable', () => {
    const deck = [makeTemplate('t.costly', { essenceCost: 4, sphereAffinity: 'force' })];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      essencePool: { force: 2 },
    });

    expect(result.playable).toHaveLength(0);
    expect(result.dimmed).toHaveLength(1);
    expect(result.dimmed[0].prereq.code).toBe('cost_unavailable');
  });

  it('dims cards when sphere prereq is missing', () => {
    const deck = [makeTemplate('t.sphere', { sphereAffinity: 'entropy' })];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      essencePool: { entropy: 9 },
    });

    expect(result.playable).toHaveLength(0);
    expect(result.dimmed).toHaveLength(1);
    expect(result.dimmed[0].prereq.code).toBe('sphere_prereq_missing');
  });

  it('dims cards when bond tier is below requirement', () => {
    const deck = [makeTemplate('t.bond', {
      requiredNodeProperties: { minBondTier: 3 },
    })];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      targetBondTier: 1,
    });

    expect(result.playable).toHaveLength(0);
    expect(result.dimmed).toHaveLength(1);
    expect(result.dimmed[0].prereq.code).toBe('bond_tier_too_low');
  });

  it('dims place-targeted consecration cards when place sphere is not aligned', () => {
    const deck = [makeTemplate('loc.consecrate', {
      sphereAffinity: 'spirit',
      targetCategories: ['location'],
    })];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      sceneTargetCategories: ['location'],
      placeContext: { placeSphere: 'force' },
    });

    expect(result.playable).toHaveLength(0);
    expect(result.dimmed).toHaveLength(1);
    expect(result.dimmed[0].prereq.code).toBe('place_gated');
  });

  it('lets author-pinned eligible templates bypass target mismatch', () => {
    const deck = [makeTemplate('t.pinned', { targetCategories: ['artifact'] })];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      sceneTargetCategories: ['actor'],
      authorPinnedEligibleTemplateIds: ['t.pinned'],
    });

    expect(result.playable).toHaveLength(1);
    expect(result.playable[0].template.id).toBe('t.pinned');
    expect(result.hidden).toHaveLength(0);
  });

  it('tags rare pulses from playable cards', () => {
    const deck = [
      makeTemplate('t.rare'),
      makeTemplate('t.normal'),
    ];
    const result = filterAscendantHand(deck, {
      ...baseContext(),
      authorPinnedRarePulseTemplateIds: ['t.rare'],
    });

    expect(result.playable.map((entry) => entry.template.id)).toEqual(['t.rare', 't.normal']);
    expect(result.rarePulses).toEqual(['t.rare']);
  });
});

