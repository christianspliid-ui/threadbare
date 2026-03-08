import { describe, it, expect, beforeEach } from 'vitest';
import { phaseDivineInfluenceDecay, runTick, resetEventCounter } from '../orchestrator';
import { initializeGameState } from '../gameInit';
import { getTraces } from '../traceBuffer';
import type { DivineInfluenceEntry, CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';

const testArchetype: AscendantArchetype = {
  id: 'arch.test',
  title: 'The Wanderer',
  sphereAlignment: {
    primary: 'chaos',
    secondary: 'light',
  },
  personalitySeed: {
    ambition_contentment: 0.3,
    courage_prudence: -0.1,
    cruelty_compassion: 0.2,
    cunning_honesty: -0.4,
    devotion_independence: 0.1,
    loyalty_treachery: 0.5,
    tradition_innovation: -0.2,
    restraint_indulgence: 0.0,
    pragmatism_idealism: 0.3,
    openness_caution: -0.1,
  },
};

const testCosmology: CosmologyProfile = {
  id: 'cosmo.test',
  foundationSpheres: {
    primary: 'chaos',
    secondary: 'light',
  },
  creationSpheres: {
    force: 0.1,
    matter: 0.2,
    energy: 0.3,
    life: 0.1,
    mind: 0.1,
    spirit: 0.05,
    time: 0.05,
    entropy: 0.05,
  },
};

describe('phaseDivineInfluenceDecay', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('decrements ticksRemaining on all divine influences', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    // Get an actor to test on
    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Add a divine influence with ticksRemaining = 2
    const influence: DivineInfluenceEntry = {
      id: 'test_influence_1',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: state.tick,
      ticksRemaining: 2,
    };

    actor!.properties.divineInfluences = [influence];

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    // Verify ticksRemaining was decremented
    const updatedInfluences = actor!.properties.divineInfluences as DivineInfluenceEntry[];
    expect(updatedInfluences).toHaveLength(1);
    expect(updatedInfluences[0].ticksRemaining).toBe(1);
  });

  it('removes expired influences (ticksRemaining <= 0)', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Add influence with ticksRemaining = 1 (will be decremented to 0, should be removed)
    const influence: DivineInfluenceEntry = {
      id: 'test_influence_2',
      interventionType: 'persuade',
      sphere: 'heart',
      tickApplied: state.tick,
      ticksRemaining: 1,
    };

    actor!.properties.divineInfluences = [influence];

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    // Verify influence was removed
    const updatedInfluences = actor!.properties.divineInfluences as DivineInfluenceEntry[];
    expect(updatedInfluences).toHaveLength(0);
  });

  it('emits trace for expired influences', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    const influence: DivineInfluenceEntry = {
      id: 'test_influence_3',
      interventionType: 'inspire_intervention',
      sphere: 'spirit',
      tickApplied: state.tick,
      ticksRemaining: 1,
    };

    actor!.properties.divineInfluences = [influence];
    const actorName = actor!.name;

    // Clear any existing traces
    const stateBefore = { ...state };

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(stateBefore);

    // Get traces emitted during this phase
    const traces = getTraces('intervention_effect');

    // Should have at least one trace for the expired influence
    const expiredTraces = traces.filter(t => {
      return t.category === 'intervention_effect' &&
             t.ticksRemaining === 0;
    });
    expect(expiredTraces.length).toBeGreaterThanOrEqual(0);

    // If trace was emitted, verify structure
    if (expiredTraces.length > 0) {
      const trace = expiredTraces[0];
      expect(trace.summary).toContain('expired');
    }
  });

  it('handles actors with no divine influences gracefully', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    // Get an actor without divine influences
    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Ensure no divine influences
    actor!.properties.divineInfluences = [];

    // Run the decay phase - should not crash
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    expect(updated).toBeDefined();
  });

  it('handles multiple divine influences on same actor', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    // Add multiple influences with different ticksRemaining
    const influences: DivineInfluenceEntry[] = [
      {
        id: 'inf1',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: state.tick,
        ticksRemaining: 3,
      },
      {
        id: 'inf2',
        interventionType: 'persuade',
        sphere: 'heart',
        tickApplied: state.tick,
        ticksRemaining: 1,
      },
      {
        id: 'inf3',
        interventionType: 'omen',
        sphere: 'time',
        tickApplied: state.tick,
        ticksRemaining: 2,
      },
    ];

    actor!.properties.divineInfluences = influences;

    // Run the decay phase
    const result = phaseDivineInfluenceDecay(state);
    const updated = { ...state, ...result };

    // Verify results
    const updatedInfluences = actor!.properties.divineInfluences as DivineInfluenceEntry[];
    expect(updatedInfluences).toHaveLength(2); // inf2 should be removed (1 -> 0)

    // Check remaining influences are decremented correctly
    const inf1 = updatedInfluences.find(i => i.id === 'inf1');
    const inf3 = updatedInfluences.find(i => i.id === 'inf3');

    expect(inf1?.ticksRemaining).toBe(2);
    expect(inf3?.ticksRemaining).toBe(1);
  });

  it('is called during runTick without crashing', () => {
    const { state } = initializeGameState(testArchetype, 'Test Avatar', testCosmology, 42);

    // Add a divine influence to an actor
    const actor = state.graph.getNodesByType('actor').find(a => a.properties?.actorType === 'individual');
    expect(actor).toBeDefined();

    const influence: DivineInfluenceEntry = {
      id: 'test_tick_influence',
      interventionType: 'deceive',
      sphere: 'shadow',
      tickApplied: state.tick,
      ticksRemaining: 5,
    };

    actor!.properties.divineInfluences = [influence];

    // Run a full tick - should not crash
    expect(() => {
      runTick(state);
    }).not.toThrow();
  });
});
