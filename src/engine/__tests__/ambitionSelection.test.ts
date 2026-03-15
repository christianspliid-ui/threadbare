import { describe, it, expect } from 'vitest';
import {
  passesEligibility,
  scoreDesirability,
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

// Helper: seeded PRNG matching the module's implementation
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- passesEligibility (Filter 1: "Can I?") ---

describe('passesEligibility', () => {
  it('passes when agent meets all reach floors', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 5, shadow: 2 },
    });
    expect(passesEligibility(tradeTemplate, agent)).toBe(true);
  });

  it('rejects when agent fails a reach floor', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 2, shadow: 2 },
    });
    expect(passesEligibility(tradeTemplate, agent)).toBe(false);
  });

  it('rejects when agent lacks a required trait', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, iron: 5 },
      traits: [],
    });
    expect(passesEligibility(forgeTemplate, agent)).toBe(false);
  });

  it('passes when agent has all required traits', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, iron: 5 },
      traits: ['smith'],
    });
    expect(passesEligibility(forgeTemplate, agent)).toBe(true);
  });

  it('rejects when agent has a blocking trait', () => {
    const agent = makeAgent({
      domainCapabilities: { ...ZERO_CAPABILITIES, gold: 5, shadow: 2 },
      traits: ['recluse'],
    });
    expect(passesEligibility(tradeTemplate, agent)).toBe(false);
  });

  it('rejects all when nothing qualifies', () => {
    const agent = makeAgent();
    const passing = ALL_TEMPLATES.filter(t => passesEligibility(t, agent));
    expect(passing).toHaveLength(0);
  });
});

// --- scoreDesirability (Filter 2: "Should I?") ---

describe('scoreDesirability', () => {
  it('higher score when sphere affinities match', () => {
    const agent = makeAgent({ culturalSpheres: ['matter'] });
    const rng = mulberry32(42);
    const tradeScore = scoreDesirability(tradeTemplate, agent, rng);
    const forgeScore = scoreDesirability(forgeTemplate, agent, mulberry32(42));
    expect(tradeScore).toBeGreaterThan(forgeScore);
  });

  it('positive score for matching bonds', () => {
    const agent = makeAgent({
      bonds: [{ bondType: 'merchant_partner' }, { bondType: 'merchant_partner' }],
    });
    const rng = mulberry32(42);
    const score = scoreDesirability(tradeTemplate, agent, rng);
    // 2 bonds * 0.5 modifier = 1.0 + reach affinity overlap + jitter
    expect(score).toBeGreaterThan(0.9);
  });

  it('positive score for matching boosting traits', () => {
    const agent = makeAgent({ traits: ['ambitious'] });
    const rng = mulberry32(42);
    const score = scoreDesirability(tradeTemplate, agent, rng);
    // 0.15 for trait + jitter
    expect(score).toBeGreaterThan(0.1);
  });

  it('accumulates all three signals', () => {
    const agent = makeAgent({
      culturalSpheres: ['force', 'matter'],
      bonds: [{ bondType: 'vassal' }],
      traits: ['ambitious', 'determined'],
    });
    const rng = mulberry32(42);
    const score = scoreDesirability(conquerTemplate, agent, rng);
    // 2 spheres * 0.2 + 1 bond * 0.6 + 2 traits * 0.15 + reach affinity + jitter
    expect(score).toBeGreaterThan(1.0);
  });
});

// --- selectAmbitions (full pipeline) ---

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
