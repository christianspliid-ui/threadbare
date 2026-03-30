import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { applyInterventionEffects, getDivineInfluences } from '../interventionEffects';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import { getCurrentStrength, DECAY_CONSTANTS } from '../decayCurve';
import type { GameState } from '../../types/gameState';
import type { AscendantArchetype } from '../../types/influence';
import type { CosmologyProfile } from '../../types';

const testArchetype: AscendantArchetype = {
  title: 'The Architect',
  sphereAlignment: {
    force: 0.1,
    matter: 0.3,
    energy: 0.2,
    life: 0.1,
    mind: 0.1,
    spirit: 0.1,
    time: 0.1,
    entropy: 0.0,
  },
};

const testCosmology: CosmologyProfile = {
  foundation: {
    chaos: 0.4,
    order: 0.6,
    light: 0.5,
    darkness: 0.5,
  },
};

describe('intervention effects — full integration', () => {
  let state: GameState;

  beforeEach(() => {
    const { state: initialState } = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );
    state = initialState;
    enableTracing();
    clearTraces();
  });

  it('dream intervention → divine influence stored → decays to zero', () => {
    // 1. Find an individual actor
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];
    expect(target).toBeDefined();

    // 2. Apply dream intervention
    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: target.id,
      sphere: 'mind',
      tick: state.tick,
      seed: state.seed,
    });
    expect(result.success).toBe(true);
    expect(result.consequenceMessage.length).toBeGreaterThan(10);
    expect(result.effectsSummary.length).toBeGreaterThan(0);

    // 3. Verify influence stored immediately
    let influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1);
    const influence = influences[0];
    const maxDuration = influence.maxDuration;
    expect(maxDuration).toBeGreaterThan(0);

    // 4. Run until near expiry — strength should decay
    const startStrength = getCurrentStrength(influence, state.tick);
    expect(startStrength).toBeCloseTo(influence.initialStrength);

    // Advance many ticks
    for (let i = 0; i < maxDuration - 1; i++) {
      state = runTick(state);
    }
    influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1); // Still active, just decayed

    // 5. One more tick should remove it completely
    state = runTick(state);
    influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(0);
  });

  it('coincidence boosts sphere influence at actor location', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];
    const locId = target.properties?.locationId as string;
    expect(locId).toBeDefined();

    const locNode = state.graph.getNode(locId);
    expect(locNode).toBeDefined();

    const before = (locNode?.properties?.sphereInfluence as any)?.spirit ?? 0;

    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'coincidence',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: state.seed,
    });
    expect(result.success).toBe(true);

    // Re-fetch location node to verify update
    const locNodeAfter = state.graph.getNode(locId);
    const after = (locNodeAfter?.properties?.sphereInfluence as any)?.spirit ?? 0;
    expect(after).toBeGreaterThan(before);
  });

  it('intervention emits intervention_effect trace', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];

    clearTraces();

    applyInterventionEffects({
      graph: state.graph,
      interventionType: 'persuade',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: state.seed,
    });

    const traces = getTraces();
    const interventionTraces = traces.filter(t => t.category === 'intervention_effect');
    expect(interventionTraces.length).toBeGreaterThan(0);
    expect(interventionTraces[0].interventionType).toBe('persuade');
  });

  it('all 8 intervention types produce valid results', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);

    const types = [
      'dream',
      'persuade',
      'deceive',
      'intimidate',
      'inspire_intervention',
      'coincidence',
      'omen',
      'afflict_bless',
    ];

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const target = actors[i % actors.length];
      const result = applyInterventionEffects({
        graph: state.graph,
        interventionType: type as any,
        targetAgentId: target.id,
        sphere: 'mind',
        tick: state.tick,
        seed: state.seed + i,
      });
      expect(result.success).toBe(true);
      expect(result.consequenceMessage.length).toBeGreaterThan(10);
      expect(result.effectsSummary.length).toBeGreaterThan(0);
    }
  });

  it('multiple interventions on same actor accumulate in influence list', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];

    // Apply two different interventions
    const result1 = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: target.id,
      sphere: 'mind',
      tick: state.tick,
      seed: 100,
    });
    expect(result1.success).toBe(true);

    const result2 = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'persuade',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: 200,
    });
    expect(result2.success).toBe(true);

    // Verify both stored
    const influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(2);
    expect(influences.map(i => i.interventionType).sort()).toEqual(['dream', 'persuade']);
  });

  it('intervention with nonexistent target returns failure', () => {
    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: 'nonexistent-actor-id',
      sphere: 'mind',
      tick: state.tick,
      seed: 42,
    });
    expect(result.success).toBe(false);
    expect(result.consequenceMessage).toBeDefined();
  });

  it('inspiration intervention creates personality boost and trait', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];

    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'inspire_intervention',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: 42,
    });
    expect(result.success).toBe(true);
    expect(result.effectsSummary.some(e => e.includes('personality boost'))).toBe(true);
    expect(result.effectsSummary.some(e => e.includes('inspired trait'))).toBe(true);

    const influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1);
    expect(influences[0].personalityBoost).toBeDefined();
    expect(influences[0].personalityBoost).toBeGreaterThan(0);
    expect(influences[0].traitId).toBeDefined();
  });

  it('intimidate intervention applies strategy override', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];

    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'intimidate',
      targetAgentId: target.id,
      sphere: 'iron',
      tick: state.tick,
      seed: 42,
    });
    expect(result.success).toBe(true);
    expect(result.effectsSummary.some(e => e.includes('strategy override'))).toBe(true);

    const influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1);
    expect(influences[0].strategyOverride).toBeDefined();
    expect(influences[0].strategyOverride).toBe('grudger');
  });

  it('afflict_bless creates condition trait', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];

    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'afflict_bless',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: 42,
    });
    expect(result.success).toBe(true);
    expect(result.effectsSummary.some(e => e.includes('Blessed') || e.includes('Afflicted'))).toBe(true);

    const influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1);
    expect(influences[0].traitId).toBeDefined();
  });

  it('deceive intervention applies deceived condition and value drift', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    const target = actors[0];

    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'deceive',
      targetAgentId: target.id,
      sphere: 'veil',
      tick: state.tick,
      seed: 42,
    });
    expect(result.success).toBe(true);
    expect(result.effectsSummary.some(e => e.includes('Deceived'))).toBe(true);

    const influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1);
    expect(influences[0].traitId).toBeDefined();
    expect(influences[0].valueDrifts).toBeDefined();
    expect(Object.keys(influences[0].valueDrifts ?? {}).length).toBeGreaterThan(0);
  });
});
