/**
 * The receipt's `undertaking` kind (THR-1432): a want minted by an undertaking outcome
 * — a harm done to this mortal, or their own work collapsing — reads as its own
 * contribution, carrying the outcome node and the deed in words.
 */

import { describe, it, expect } from 'vitest';
import { buildMotiveReceipt, resolveMintedAmbitionOrigin, resolveMintedAmbitionProvenance } from '../motiveReceipt';
import { WorldGraph } from '../../graph';
import type { ScoredCandidate } from '../../encounterScoring';
import type { EncounterCacheEntry } from '../../encounterCache';

function makeEntry(): EncounterCacheEntry {
  return {
    templateId: 'encounter.test', locationId: 'loc.test', sublocationId: null, sublocationTypeId: null,
    reachPrimary: 'iron', reachSecondary: 'gold', threatRating: 'moderate', encounterType: 'social',
    motivations: [], requiresPresence: false, remotePenalty: 0, questPriority: 0, isQuestEncounter: false,
    totalTickCost: 1, successRewardEstimate: 1, stepCount: 1, stepDifficulties: [0.5], stepReaches: ['iron'],
  } as unknown as EncounterCacheEntry;
}

function makeCandidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    entry: makeEntry(), completionProb: 0.5, expectedReward: 1, expectedUtility: 1, pushBenefit: 0, resistBenefit: 0,
    travelCost: 0, totalCost: 1, valuePerTick: 1, axiologicalScore: 0, personalityBias: 0, ambitionBoost: 0,
    desireMultiplier: 1, familiarityPenalty: 0, explorationBonus: 0, chainBonus: 0, resonance: 0, globalResonance: 0,
    ruinsBonus: 0, attractionBonus: 0, hunchBonus: 0, rarityMultiplier: 1, roleAffinityMultiplier: 1, markRevealBonus: 0,
    divineOverlayBonus: 0, bondBonus: 0, reputationBonus: 0, hexDistanceToEntry: Infinity, intelBonus: 0,
    identityBiasBonus: 0, noveltyMultiplier: 1, surfaceKey: 'k', finalScore: 1, action: 'start_local',
    ...overrides,
  } as ScoredCandidate;
}

const DEED = 'the razing of Dunmar — Hesk\'s work';

describe('buildMotiveReceipt — the undertaking kind (THR-1432)', () => {
  it('a want minted by an undertaking outcome reads as `undertaking`, carrying the node and the deed', () => {
    const receipt = buildMotiveReceipt(makeCandidate({ ambitionBoost: 3, personalityBias: 1 }), null, null, 42, {
      label: DEED, eventId: 'evt_und_proj_raze_10',
    });
    expect(receipt.contributions[0]).toEqual({
      kind: 'undertaking', weight: 0.75, provenance: { nodeId: 'evt_und_proj_raze_10', detail: DEED },
    });
    expect(receipt.contributions.some(c => c.kind === 'ambition')).toBe(false);
  });

  it('a want minted by an encounter event stays `ambition`', () => {
    const receipt = buildMotiveReceipt(makeCandidate({ ambitionBoost: 3 }), null, null, 42, {
      label: 'the bloodshed at Thornhaven', eventId: 'evt_enc_12',
    });
    expect(receipt.contributions[0].kind).toBe('ambition');
    expect(receipt.contributions[0].provenance).toEqual({ detail: 'the bloodshed at Thornhaven' });
  });

  it('the label-only form (THR-726 callers) is unchanged', () => {
    const receipt = buildMotiveReceipt(makeCandidate({ ambitionBoost: 3 }), null, null, 42, 'the bloodshed at Thornhaven');
    expect(receipt.contributions[0]).toEqual({ kind: 'ambition', weight: 1, provenance: { detail: 'the bloodshed at Thornhaven' } });
  });
});

describe('resolveMintedAmbitionOrigin', () => {
  function world(eventId: string): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'ind_maerin', type: 'actor', name: 'Maerin', properties: { actorType: 'individual' } });
    g.addNode({ id: 'amb_revenge', type: 'ambition', name: 'Seek revenge', properties: { reachAffinity: { iron: 1 } } });
    g.addEdge({
      id: 'pursues_ind_maerin_amb_revenge', source: 'ind_maerin', target: 'amb_revenge', type: 'pursues',
      properties: { priority: 'primary', status: 'active', assignedTick: 11, completedMilestones: [], mintedByEventId: eventId, mintedByLabel: DEED },
    });
    return g;
  }

  it('keeps the event node beside the label, and the label-only helper still reads the label', () => {
    const g = world('evt_und_proj_raze_10');
    expect(resolveMintedAmbitionOrigin(g, 'ind_maerin', 'iron')).toEqual({ label: DEED, eventId: 'evt_und_proj_raze_10' });
    expect(resolveMintedAmbitionProvenance(g, 'ind_maerin', 'iron')).toBe(DEED);
  });

  it('returns nothing for a mortal with no minted want', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'ind_hesk', type: 'actor', name: 'Hesk', properties: { actorType: 'individual' } });
    expect(resolveMintedAmbitionOrigin(g, 'ind_hesk', 'iron')).toBeUndefined();
  });
});
