import { describe, it, expect } from 'vitest';
import {
  filterByCapability,
  scoreByContext,
  selectAmbitions,
  SPHERE_MATCH_BONUS,
  TRAIT_BOOST_BONUS,
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

// --- filterByCapability ---

describe('filterByCapability', () => {
  it('passes when agent meets all reach floors', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 5, shadow: 2 },
    });
    const result = filterByCapability([tradeTemplate], agent);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('amb-trade-dominion');
  });

  it('rejects when agent fails a reach floor', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 2, shadow: 2 },
    });
    const result = filterByCapability([tradeTemplate], agent);
    expect(result).toHaveLength(0);
  });

  it('rejects when agent lacks a required trait', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, iron: 5 },
      traits: [],
    });
    const result = filterByCapability([forgeTemplate], agent);
    expect(result).toHaveLength(0);
  });

  it('passes when agent has all required traits', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, iron: 5 },
      traits: ['smith'],
    });
    const result = filterByCapability([forgeTemplate], agent);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('amb-forge-mastery');
  });

  it('rejects when agent has a blocking trait', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 5, shadow: 2 },
      traits: ['recluse'],
    });
    const result = filterByCapability([tradeTemplate], agent);
    expect(result).toHaveLength(0);
  });

  it('returns empty when nothing qualifies', () => {
    const agent = makeAgent();
    const result = filterByCapability(ALL_TEMPLATES, agent);
    expect(result).toHaveLength(0);
  });
});

// --- scoreByContext ---

describe('scoreByContext', () => {
  it('higher score when sphere affinities match', () => {
    const agent = makeAgent({ culturalSpheres: ['matter'] });
    const [trade] = scoreByContext([tradeTemplate], agent);
    const [forge] = scoreByContext([forgeTemplate], agent);
    expect(trade.score).toBeGreaterThan(forge.score);
    expect(trade.score).toBeCloseTo(SPHERE_MATCH_BONUS);
    expect(forge.score).toBe(0);
  });

  it('higher score when bonds match', () => {
    const agent = makeAgent({
      bonds: [{ bondType: 'merchant_partner' }, { bondType: 'merchant_partner' }],
    });
    const [trade] = scoreByContext([tradeTemplate], agent);
    expect(trade.score).toBeCloseTo(1.0);
  });

  it('higher score when boosting traits match', () => {
    const agent = makeAgent({ traits: ['ambitious'] });
    const [trade] = scoreByContext([tradeTemplate], agent);
    expect(trade.score).toBeCloseTo(TRAIT_BOOST_BONUS);
  });

  it('accumulates all three signals', () => {
    const agent = makeAgent({
      culturalSpheres: ['force', 'matter'],
      bonds: [{ bondType: 'vassal' }],
      traits: ['ambitious', 'determined'],
    });
    const [conquer] = scoreByContext([conquerTemplate], agent);
    const expected = 2 * SPHERE_MATCH_BONUS + 0.6 + 2 * TRAIT_BOOST_BONUS;
    expect(conquer.score).toBeCloseTo(expected);
  });
});

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
});
