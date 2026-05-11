import { describe, it, expect } from 'vitest';
import { classifyTrayTier } from '../ascendantTray';

const CTX = { ascendantId: 'asc-1', targetNodeId: 'asc-1' };

describe('classifyTrayTier', () => {
  it('divine.dream (ascendant affinity, no targetCategories) → core', () => {
    // Regression: was misclassified as self because actorAffinities === ['ascendant']
    expect(
      classifyTrayTier(
        {
          rarityTier: 1,
          intrinsicTier: 'background',
          actorAffinities: ['ascendant'],
          // targetCategories absent — does not constrain to actor-only
        },
        CTX,
      ),
    ).toBe('core');
  });

  it('hex.smite (ascendant affinity, targetCategories: [hex]) → core', () => {
    // Regression: was misclassified as self because actorAffinities === ['ascendant']
    expect(
      classifyTrayTier(
        {
          rarityTier: 2,
          intrinsicTier: 'shaping',
          actorAffinities: ['ascendant'],
          targetCategories: ['hex'],
        },
        CTX,
      ),
    ).toBe('core');
  });

  it('explicit trayTier: core overrides actor-affinity inference', () => {
    expect(
      classifyTrayTier(
        {
          rarityTier: 1,
          intrinsicTier: 'background',
          actorAffinities: ['ascendant'],
          targetCategories: ['actor'],
          trayTier: 'core',
        },
        CTX,
      ),
    ).toBe('core');
  });

  it('self-only fixture (targetCategories: [actor], no subtypes) → self', () => {
    // Synthetic test.self.action — represents future Meditate/Withdraw templates (THR-399)
    expect(
      classifyTrayTier(
        {
          rarityTier: 1,
          intrinsicTier: 'background',
          actorAffinities: ['ascendant'],
          targetCategories: ['actor'],
          // no targetSubtypes — explicit actor-only, no narrowing = self
        },
        CTX,
      ),
    ).toBe('self');
  });

  it('rare override wins even when explicit trayTier is set', () => {
    expect(
      classifyTrayTier(
        {
          rarityTier: 3,
          intrinsicTier: 'background',
          actorAffinities: ['ascendant'],
          trayTier: 'core',
        },
        CTX,
      ),
    ).toBe('rare');
  });

  it('story_beat intrinsicTier → rare regardless of targetCategories', () => {
    expect(
      classifyTrayTier(
        {
          rarityTier: 1,
          intrinsicTier: 'story_beat',
          actorAffinities: ['ascendant'],
          targetCategories: ['actor'],
        },
        CTX,
      ),
    ).toBe('rare');
  });

  it('targetCategories: [actor] with targetSubtypes → core (not self)', () => {
    expect(
      classifyTrayTier(
        {
          rarityTier: 1,
          intrinsicTier: 'background',
          actorAffinities: ['ascendant'],
          targetCategories: ['actor'],
          targetSubtypes: ['merchant'],
        },
        CTX,
      ),
    ).toBe('core');
  });
});
