import { describe, it, expect } from 'vitest';
import { buildMotiveReceipt, intelTierFromReliability } from '../motiveReceipt';
import { RECEIPT_TOP_CONTRIBUTIONS, RECEIPT_MIN_WEIGHT } from '../constants';
import type { ScoredCandidate } from '../../encounterScoring';
import type { EncounterCacheEntry } from '../../encounterCache';

// ─── Minimal fixtures ────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'encounter.test',
    locationId: 'loc.test',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'gold',
    reachSecondary: 'iron',
    threatRating: 'moderate',
    encounterType: 'social',
    motivations: [],
    requiresPresence: false,
    remotePenalty: 0,
    questPriority: 0,
    isQuestEncounter: false,
    totalTickCost: 1,
    successRewardEstimate: 1,
    stepCount: 1,
    stepDifficulties: [0.5],
    stepReaches: ['gold'],
    ...overrides,
  } as EncounterCacheEntry;
}

/** A candidate with every contribution term zeroed; override the ones a test exercises. */
function makeCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    entry: makeEntry(),
    completionProb: 0.5,
    expectedReward: 1,
    expectedUtility: 1,
    pushBenefit: 0,
    resistBenefit: 0,
    travelCost: 0,
    totalCost: 1,
    valuePerTick: 1,
    axiologicalScore: 0,
    personalityBias: 0,
    ambitionBoost: 0,
    desireMultiplier: 1,
    familiarityPenalty: 0,
    explorationBonus: 0,
    chainBonus: 0,
    resonance: 0,
    globalResonance: 0,
    ruinsBonus: 0,
    attractionBonus: 0,
    hunchBonus: 0,
    rarityMultiplier: 1,
    roleAffinityMultiplier: 1,
    markRevealBonus: 0,
    intelBonus: 0,
    identityBiasBonus: 0,
    noveltyMultiplier: 1,
    surfaceKey: 'k',
    finalScore: 1,
    action: 'start_local',
    ...overrides,
  } as ScoredCandidate;
}

describe('intelTierFromReliability', () => {
  it('maps null/absent to unknown', () => {
    expect(intelTierFromReliability(null)).toBe('unknown');
    expect(intelTierFromReliability(undefined)).toBe('unknown');
    expect(intelTierFromReliability(Number.NaN)).toBe('unknown');
  });

  it('maps reliability bands to tiers (reliability × 100 vs INTEL_TIER_* thresholds)', () => {
    expect(intelTierFromReliability(0.05)).toBe('unknown'); // 5 < 10
    expect(intelTierFromReliability(0.2)).toBe('rumor');     // 20 < 30
    expect(intelTierFromReliability(0.5)).toBe('briefed');   // 50 < 70
    expect(intelTierFromReliability(0.9)).toBe('expert');    // 90 >= 70
  });

  it('clamps out-of-range reliability', () => {
    expect(intelTierFromReliability(-1)).toBe('unknown');
    expect(intelTierFromReliability(5)).toBe('expert');
  });
});

describe('buildMotiveReceipt', () => {
  it('normalizes positive contributions to shares that sum to 1, ranked descending', () => {
    const receipt = buildMotiveReceipt(
      makeCandidate({ ambitionBoost: 3, personalityBias: 1 }),
      null,
      null,
      42,
    );
    const sum = receipt.contributions.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(receipt.contributions[0].kind).toBe('ambition');
    expect(receipt.contributions[0].weight).toBeGreaterThan(receipt.contributions[1].weight);
    expect(receipt.contributions[0].weight).toBeCloseTo(0.75, 5);
  });

  it('caps contributions at RECEIPT_TOP_CONTRIBUTIONS', () => {
    const receipt = buildMotiveReceipt(
      makeCandidate({
        ambitionBoost: 5,
        personalityBias: 4,
        hunchBonus: 3,
        chainBonus: 2,
        explorationBonus: 1,
      }),
      null,
      null,
      1,
    );
    expect(receipt.contributions.length).toBeLessThanOrEqual(RECEIPT_TOP_CONTRIBUTIONS);
  });

  it('drops contributions below RECEIPT_MIN_WEIGHT', () => {
    // One dominant term + a sliver well below the 0.10 floor.
    const receipt = buildMotiveReceipt(
      makeCandidate({ ambitionBoost: 100, hunchBonus: 1 }),
      null,
      null,
      1,
    );
    // hunch share = 1/101 ≈ 0.0099 < RECEIPT_MIN_WEIGHT → dropped.
    expect(receipt.contributions.every(c => c.weight >= RECEIPT_MIN_WEIGHT)).toBe(true);
    expect(receipt.contributions.map(c => c.kind)).not.toContain('hunch');
  });

  it('fail-soft: no positive contributions → single personality weight 1', () => {
    const receipt = buildMotiveReceipt(
      makeCandidate({ personalityBias: -5, ambitionBoost: 0 }),
      null,
      null,
      1,
    );
    expect(receipt.contributions).toEqual([{ kind: 'personality', weight: 1 }]);
  });

  it('fail-soft: all contributions below floor → keep the single strongest', () => {
    // Ten equal tiny terms → each share 0.1 which equals the floor, so keep them;
    // instead use many terms so each share < floor. 11 equal terms → 1/11 ≈ 0.091 < 0.10.
    const receipt = buildMotiveReceipt(
      makeCandidate({
        ambitionBoost: 1,
        personalityBias: 1,
        intelBonus: 1,
        markRevealBonus: 1,
        resonance: 1,
        globalResonance: 1,
        hunchBonus: 1,
        identityBiasBonus: 1,
        chainBonus: 1,
        explorationBonus: 1,
        rarityMultiplier: 2, // delta 1
      }),
      null,
      null,
      1,
    );
    // 11 terms each 1/11 ≈ 0.0909 < 0.10 floor → fail-soft keeps exactly one.
    expect(receipt.contributions.length).toBe(1);
  });

  it('converts rarityMultiplier > 1 to a delta contribution; == 1 contributes nothing', () => {
    const withRarity = buildMotiveReceipt(
      makeCandidate({ ambitionBoost: 1, rarityMultiplier: 3 }),
      null,
      null,
      1,
    );
    expect(withRarity.contributions.map(c => c.kind)).toContain('rarity');

    const noRarity = buildMotiveReceipt(
      makeCandidate({ ambitionBoost: 1, rarityMultiplier: 1 }),
      null,
      null,
      1,
    );
    expect(noRarity.contributions.map(c => c.kind)).not.toContain('rarity');
  });

  it('carries templateId, locationId, dominantReach, expectation, decidedAtTick', () => {
    const receipt = buildMotiveReceipt(
      makeCandidate({
        entry: makeEntry({ templateId: 'e.alliance', locationId: 'l.keep', reachPrimary: 'heart' }),
        completionProb: 0.05,
        ambitionBoost: 1,
      }),
      null,
      null,
      99,
    );
    expect(receipt.templateId).toBe('e.alliance');
    expect(receipt.locationId).toBe('l.keep');
    expect(receipt.dominantReach).toBe('heart');
    expect(receipt.expectation).toBe('doomed'); // completionProb 0.05 → lowest forecast tier
    expect(receipt.decidedAtTick).toBe(99);
  });

  it('records intel provenance recordId when a matched record is supplied', () => {
    const receipt = buildMotiveReceipt(
      makeCandidate({ intelBonus: 4 }),
      0.9,
      'intel.rec.123',
      1,
    );
    expect(receipt.intelTier).toBe('expert');
    const intel = receipt.contributions.find(c => c.kind === 'intel');
    expect(intel?.provenance?.detail).toBe('intel.rec.123');
  });
});
