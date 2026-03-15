import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyInterventionEffects,
  getDivineInfluences,
  buildValueOverlay,
} from '../interventionEffects';
import type { DivineInfluenceEntry } from '../../types/dream';
import type { AxiologicalProfile } from '../../types/agent';
import { DECAY_CONSTANTS } from '../decayCurve';

describe('applyInterventionEffects', () => {
  let graph: WorldGraph;
  let actorId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    actorId = 'actor.test';
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          ambition_contentment: 0.5,
          courage_prudence: 0.3,
          cruelty_compassion: -0.4,
          cunning_honesty: 0.1,
          devotion_independence: 0.2,
          loyalty_treachery: 0.6,
          tradition_innovation: -0.1,
          dominance_humility: 0.0,
          wrath_patience: -0.2,
          greed_generosity: 0.3,
        },
        cooperationStrategy: 'tit-for-tat',
        reputationScore: 0.5,
        locationId: 'loc.village',
        divineInfluences: [],
      },
    });
    graph.addNode({
      id: 'loc.village',
      type: 'location',
      name: 'Ashenvale',
      properties: { sphereInfluence: { mind: 0.1, spirit: 0.1 }, hexCol: 3, hexRow: 4 },
    });
  });

  it('dream: adds value drift influence to actor', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, actorId);
    expect(influences.length).toBe(1);
    expect(influences[0].interventionType).toBe('dream');
    expect(influences[0].maxDuration).toBe(DECAY_CONSTANTS.dream.maxDuration);
    expect(influences[0].valueDrifts).toBeDefined();
  });

  it('persuade: adds longer value drift', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'persuade',
      targetAgentId: actorId,
      sphere: 'spirit',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].maxDuration).toBe(DECAY_CONSTANTS.persuade.maxDuration);
  });

  it('intimidate: shifts courage toward prudence and may override strategy', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'intimidate',
      targetAgentId: actorId,
      sphere: 'force',
      tick: 10,
      seed: 42,
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].valueDrifts?.courage_prudence).toBeLessThan(0);
    expect(influences[0].strategyOverride).toBe('grudger');
  });

  it('inspire_intervention: adds personality boost and trait', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'inspire_intervention',
      targetAgentId: actorId,
      sphere: 'life',
      tick: 10,
      seed: 42,
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].personalityBoost).toBeGreaterThan(0);
    expect(influences[0].traitId).toBeDefined();
  });

  it('coincidence: boosts sphere influence at location', () => {
    const before = (graph.getNode('loc.village')?.properties?.sphereInfluence as any)?.mind ?? 0;
    applyInterventionEffects({
      graph,
      interventionType: 'coincidence',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    const after = (graph.getNode('loc.village')?.properties?.sphereInfluence as any)?.mind ?? 0;
    expect(after).toBeGreaterThan(before);
  });

  it('afflict_bless: adds condition trait influence', () => {
    applyInterventionEffects({
      graph,
      interventionType: 'afflict_bless',
      targetAgentId: actorId,
      sphere: 'life',
      tick: 10,
      seed: 42,
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].traitId).toBeDefined();
    expect(influences[0].maxDuration).toBe(DECAY_CONSTANTS.afflict_bless.maxDuration);
  });

  it('returns consequence message', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.consequenceMessage).toContain('Kael');
    expect(result.consequenceMessage.length).toBeGreaterThan(10);
  });

  it('returns failure for unknown actor', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: 'nonexistent',
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(false);
  });

  it('deceive: adds value drift and trait', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'deceive',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].maxDuration).toBe(DECAY_CONSTANTS.deceive.maxDuration);
    expect(influences[0].valueDrifts).toBeDefined();
    expect(influences[0].traitId).toBeDefined();
  });

  it('omen: applies to all agents at location (defaults to target agent)', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'omen',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].interventionType).toBe('omen');
    expect(influences[0].maxDuration).toBe(DECAY_CONSTANTS.omen.maxDuration);
  });
});

describe('buildValueOverlay', () => {
  it('returns modified profile copy with drift applied', () => {
    const baseProfile: AxiologicalProfile = {
      ambition_contentment: 0.5,
      courage_prudence: 0.3,
      cruelty_compassion: -0.4,
      cunning_honesty: 0.1,
      devotion_independence: 0.2,
      loyalty_treachery: 0.6,
      tradition_innovation: -0.1,
      dominance_humility: 0.0,
      wrath_patience: -0.2,
      greed_generosity: 0.3,
    };
    const influences: DivineInfluenceEntry[] = [
      {
        id: 'di_1',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: 1,
        ...DECAY_CONSTANTS.dream,
        valueDrifts: { courage_prudence: 0.12 },
      },
    ];
    const overlay = buildValueOverlay(baseProfile, influences);
    // dream initialStrength=0.5; 0.3 + 0.12*0.5 = 0.36
    expect(overlay.courage_prudence).toBeCloseTo(0.36);
    expect(overlay.ambition_contentment).toBe(0.5);
  });

  it('clamps values to [-1, 1]', () => {
    const baseProfile: AxiologicalProfile = {
      ambition_contentment: 0.95,
      courage_prudence: 0.3,
      cruelty_compassion: -0.4,
      cunning_honesty: 0.1,
      devotion_independence: 0.2,
      loyalty_treachery: 0.6,
      tradition_innovation: -0.1,
      dominance_humility: 0.0,
      wrath_patience: -0.2,
      greed_generosity: 0.3,
    };
    const influences: DivineInfluenceEntry[] = [
      {
        id: 'di_1',
        interventionType: 'persuade',
        sphere: 'spirit',
        tickApplied: 1,
        ...DECAY_CONSTANTS.persuade,
        valueDrifts: { ambition_contentment: 0.2 },
      },
    ];
    const overlay = buildValueOverlay(baseProfile, influences);
    expect(overlay.ambition_contentment).toBe(1.0);
  });

  it('stacks multiple influences', () => {
    const baseProfile: AxiologicalProfile = {
      ambition_contentment: 0.0,
      courage_prudence: 0.0,
      cruelty_compassion: 0.0,
      cunning_honesty: 0.0,
      devotion_independence: 0.0,
      loyalty_treachery: 0.0,
      tradition_innovation: 0.0,
      dominance_humility: 0.0,
      wrath_patience: 0.0,
      greed_generosity: 0.0,
    };
    const influences: DivineInfluenceEntry[] = [
      {
        id: 'd1',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: 1,
        ...DECAY_CONSTANTS.dream,
        valueDrifts: { courage_prudence: 0.1 },
      },
      {
        id: 'd2',
        interventionType: 'persuade',
        sphere: 'spirit',
        tickApplied: 2,
        ...DECAY_CONSTANTS.persuade,
        valueDrifts: { courage_prudence: 0.15 },
      },
    ];
    const overlay = buildValueOverlay(baseProfile, influences);
    // dream initialStrength=0.5: 0.1*0.5=0.05; persuade initialStrength=0.7: 0.15*0.7=0.105; total=0.155
    expect(overlay.courage_prudence).toBeCloseTo(0.155);
  });

  it('does not mutate original profile', () => {
    const baseProfile: AxiologicalProfile = {
      ambition_contentment: 0.5,
      courage_prudence: 0.3,
      cruelty_compassion: -0.4,
      cunning_honesty: 0.1,
      devotion_independence: 0.2,
      loyalty_treachery: 0.6,
      tradition_innovation: -0.1,
      dominance_humility: 0.0,
      wrath_patience: -0.2,
      greed_generosity: 0.3,
    };
    const originalCourage = baseProfile.courage_prudence;
    const influences: DivineInfluenceEntry[] = [
      {
        id: 'di_1',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: 1,
        ...DECAY_CONSTANTS.dream,
        valueDrifts: { courage_prudence: 0.5 },
      },
    ];
    buildValueOverlay(baseProfile, influences);
    expect(baseProfile.courage_prudence).toBe(originalCourage);
  });
});

describe('getDivineInfluences', () => {
  let graph: WorldGraph;
  let actorId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    actorId = 'actor.test';
  });

  it('returns empty array for actor with no influences', () => {
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        divineInfluences: [],
      },
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences).toEqual([]);
  });

  it('returns influences array from actor properties', () => {
    const testInfluence: DivineInfluenceEntry = {
      id: 'di_1',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: 1,
      ...DECAY_CONSTANTS.dream,
      valueDrifts: { courage_prudence: 0.1 },
    };
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        divineInfluences: [testInfluence],
      },
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences.length).toBe(1);
    expect(influences[0].id).toBe('di_1');
  });
});
