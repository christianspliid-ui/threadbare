import { describe, it, expect } from 'vitest';
import {
  selectAmbitions,
  type AmbitionAgentSnapshot,
} from '../ambitionSelection';
import type { AmbitionTemplate } from '../../types/ambition';
import type { ReachDomain } from '../../types/traits';

// --- Fixtures ---

const ZERO_CAPABILITIES: Record<ReachDomain, number> = {
  iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0,
  eye: 0, stone: 0, star: 0, flesh: 0,
};

const tradeTemplate: AmbitionTemplate = {
  id: 'amb-trade-dominion',
  displayName: 'Establish Trade Route',
  category: 'dominion',
  reachFloors: { gold: 3, shadow: 1 },
  requiredTraits: [],
  blockingTraits: ['recluse'],
  sphereAffinities: ['matter'],
  bondModifiers: [{ bondType: 'merchant_partner', modifier: 0.5 }],
  boostingTraits: ['ambitious'],
  reachAffinity: { gold: 1.0 },
  milestones: [],
  completion: { requires: 1, of: 1 },
  abandonmentTriggers: [],
  abandonmentCooldown: 5,
  selectionProse: [],
  milestoneProse: {},
  completionProse: [],
  abandonmentProse: [],
};

const forgeTemplate: AmbitionTemplate = {
  id: 'amb-forge-mastery',
  displayName: 'Master the Forge',
  category: 'mastery',
  reachFloors: { iron: 4 },
  requiredTraits: ['smith'],
  blockingTraits: [],
  sphereAffinities: ['force'],
  bondModifiers: [{ bondType: 'apprentice', modifier: 0.4 }],
  boostingTraits: ['determined'],
  reachAffinity: { iron: 1.0 },
  milestones: [],
  completion: { requires: 1, of: 1 },
  abandonmentTriggers: [],
  abandonmentCooldown: 5,
  selectionProse: [],
  milestoneProse: {},
  completionProse: [],
  abandonmentProse: [],
};

const conquerTemplate: AmbitionTemplate = {
  id: 'amb-conquer-dominion',
  displayName: 'Conquer the Valley',
  category: 'dominion',
  reachFloors: { iron: 5, heart: 2 },
  requiredTraits: [],
  blockingTraits: ['pacifist'],
  sphereAffinities: ['force', 'matter'],
  bondModifiers: [{ bondType: 'vassal', modifier: 0.6 }],
  boostingTraits: ['ambitious', 'determined'],
  reachAffinity: { iron: 1.0, heart: 0.5 },
  milestones: [],
  completion: { requires: 1, of: 1 },
  abandonmentTriggers: [],
  abandonmentCooldown: 5,
  selectionProse: [],
  milestoneProse: {},
  completionProse: [],
  abandonmentProse: [],
};

const ALL_TEMPLATES = [tradeTemplate, forgeTemplate, conquerTemplate];

function makeAgent(overrides: Partial<AmbitionAgentSnapshot> = {}): AmbitionAgentSnapshot {
  return {
    domainCapabilities: { ...ZERO_CAPABILITIES },
    traits: [],
    culturalSpheres: [],
    bonds: [],
    ...overrides,
  };
}

// --- selectAmbitions ---

describe('selectAmbitions', () => {
  const qualifiedAgent = makeAgent({
    domainCapabilities: { ...ZERO_CAPABILITIES, iron: 6, gold: 5, shadow: 3, heart: 3 },
    traits: ['smith', 'ambitious', 'determined'],
    culturalSpheres: ['force', 'matter'],
    bonds: [{ bondType: 'vassal' }, { bondType: 'merchant_partner' }],
  });

  it('returns up to maxAmbitions results', () => {
    const result = selectAmbitions(ALL_TEMPLATES, qualifiedAgent, {
      seed: 42,
      threshold: 0,
      maxAmbitions: 2,
    });
    expect(result.length).toBeLessThanOrEqual(2);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty when no templates pass filters', () => {
    const weakAgent = makeAgent();
    const result = selectAmbitions(ALL_TEMPLATES, weakAgent, {
      seed: 42,
      threshold: 0,
      maxAmbitions: 3,
    });
    expect(result).toHaveLength(0);
  });

  it('primary ambition has highest score', () => {
    const result = selectAmbitions(ALL_TEMPLATES, qualifiedAgent, {
      seed: 42,
      threshold: 0,
      maxAmbitions: 3,
    });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it('deterministic with same seed', () => {
    const config = { seed: 999, threshold: 0, maxAmbitions: 3 };
    const run1 = selectAmbitions(ALL_TEMPLATES, qualifiedAgent, config);
    const run2 = selectAmbitions(ALL_TEMPLATES, qualifiedAgent, config);
    expect(run1).toEqual(run2);
  });

  it('filters by reach floors', () => {
    const weakAgent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 5, shadow: 2 },
      traits: [],
    });
    const result = selectAmbitions(ALL_TEMPLATES, weakAgent, {
      seed: 42,
      threshold: 0,
      maxAmbitions: 3,
    });
    // Only trade template should pass (gold:3, shadow:1)
    // forge needs iron:4 + 'smith' trait, conquer needs iron:5 + heart:2
    expect(result).toHaveLength(1);
    expect(result[0].templateId).toBe('amb-trade-dominion');
  });

  it('filters by blocking traits', () => {
    const recluseAgent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 5, shadow: 2 },
      traits: ['recluse'],
    });
    const result = selectAmbitions([tradeTemplate], recluseAgent, {
      seed: 42,
      threshold: 0,
      maxAmbitions: 3,
    });
    expect(result).toHaveLength(0);
  });
});
