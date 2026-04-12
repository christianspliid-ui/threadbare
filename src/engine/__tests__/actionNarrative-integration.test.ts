import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../gameInit';
import { generateAgendas } from '../agendaGenerator';
import { applyInterventionEffects, getDivineInfluences, buildValueOverlay } from '../interventionEffects';
import { getCurrentStrength, DECAY_CONSTANTS } from '../decayCurve';
import { applyAscendantFeedback } from '../ascendantFeedback';
import type { GameState } from '../../types/gameState';
import type { AscendantArchetype } from '../../types/influence';
import type { CosmologyProfile } from '../../types';

const testArchetype: AscendantArchetype = {
  title: 'The Architect',
  sphereAlignment: { primary: 'matter', secondary: 'energy' },
};

const testCosmology: CosmologyProfile = {
  foundation: {
    chaos: 0.4,
    order: 0.6,
    light: 0.5,
    darkness: 0.5,
  },
};

describe('Action Narrative System — full flow', () => {
  let state: GameState;
  let ascendantId: string;
  let actorId: string;

  beforeEach(() => {
    const result = initializeGameState(
      testArchetype,
      'Test Avatar',
      testCosmology,
      42,
    );
    state = result.state;
    ascendantId = state.ascendantId;

    // Get an individual actor to use as target
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);
    actorId = actors[0].id;
  });

  it('agenda → effects → decay → overlay → feedback', () => {
    const actorNode = state.graph.getNode(actorId);
    expect(actorNode).toBeDefined();

    const profile = actorNode!.properties!.axiologicalProfile;
    expect(profile).toBeDefined();

    // Step 1: Generate agendas
    const agendas = generateAgendas({
      interventionType: 'persuade',
      targetArchetypeId: actorNode!.properties!.narrativeArchetype as string,
      targetProfile: profile,
      playerPrimarySphere: 'force',
      seed: 42,
    });
    expect(agendas.length).toBeGreaterThanOrEqual(2);

    // Step 2: Player picks first agenda
    const chosenAgenda = agendas[0];
    expect(chosenAgenda.id).toBeDefined();
    expect(chosenAgenda.valuePair).toBeDefined();

    // Step 3: Apply effects
    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'persuade',
      targetAgentId: actorId,
      sphere: 'force',
      tick: state.tick,
      seed: 42,
      agenda: chosenAgenda,
    });
    expect(result.success).toBe(true);
    expect(result.consequenceMessage.length).toBeGreaterThan(10);
    expect(result.effectsSummary.length).toBeGreaterThan(0);

    // Step 4: Verify divine influence stored with decay params
    const influences = getDivineInfluences(state.graph, actorId);
    expect(influences.length).toBe(1);

    const influence = influences[0];
    expect(influence.initialStrength).toBe(DECAY_CONSTANTS.persuade.initialStrength);
    expect(influence.agendaId).toBe(chosenAgenda.id);
    expect(influence.interventionType).toBe('persuade');

    // Step 5: Verify decay over time
    const strength0 = getCurrentStrength(influence, state.tick);
    const strength10 = getCurrentStrength(influence, state.tick + 10);
    const strength35 = getCurrentStrength(influence, state.tick + 35);

    expect(strength10).toBeLessThan(strength0);
    expect(strength35).toBe(0); // expired (maxDuration=30, tick 0+35>30)

    // Step 6: Verify overlay uses decay
    const currentProfile = state.graph.getNode(actorId)!.properties!.axiologicalProfile;
    const overlay0 = buildValueOverlay(currentProfile, influences, state.tick);
    const overlay15 = buildValueOverlay(currentProfile, influences, state.tick + 15);

    // At tick 0, full influence; at tick 15, partially decayed
    const valuePair = chosenAgenda.valuePair;
    const drift0 = Math.abs(overlay0[valuePair] - currentProfile[valuePair]);
    const drift15 = Math.abs(overlay15[valuePair] - currentProfile[valuePair]);

    // Drift should be less at a later tick due to decay
    expect(drift15).toBeLessThan(drift0);

    // Step 7: Ascendant feedback
    applyAscendantFeedback(state.graph, ascendantId, 'persuade', 'force', state.tick);
    const godNode = state.graph.getNode(ascendantId);
    const history = godNode!.properties!.interventionHistory as Record<string, number>;
    expect(history['persuade']).toBe(1);
  });

  it('expired influences are filtered from overlay', () => {
    const actorNode = state.graph.getNode(actorId);
    const profile = actorNode!.properties!.axiologicalProfile;

    // Apply dream intervention (maxDuration = 20)
    const dreamResult = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: state.tick,
      seed: 42,
    });
    expect(dreamResult.success).toBe(true);

    let influences = getDivineInfluences(state.graph, actorId);
    expect(influences.length).toBe(1);

    // At tick+25, influence should be expired (maxDuration=20)
    const overlay = buildValueOverlay(profile, influences, state.tick + 25);

    // Since influence is expired, overlay should be same as profile
    expect(overlay).toEqual(profile);
  });

  it('multiple agendas can be tested sequentially', () => {
    const actorNode = state.graph.getNode(actorId);
    const profile = actorNode!.properties!.axiologicalProfile;

    // Generate multiple agendas
    const agendas = generateAgendas({
      interventionType: 'dream',
      targetArchetypeId: actorNode!.properties!.narrativeArchetype as string,
      targetProfile: profile,
      playerPrimarySphere: 'mind',
      seed: 42,
    });
    expect(agendas.length).toBeGreaterThanOrEqual(2);

    // Apply first agenda
    const result1 = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: state.tick,
      seed: 42,
      agenda: agendas[0],
    });
    expect(result1.success).toBe(true);

    // Apply second agenda (should stack)
    const result2 = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'spirit',
      tick: state.tick + 5,
      seed: 100,
      agenda: agendas[1],
    });
    expect(result2.success).toBe(true);

    // Both influences should be present
    const influences = getDivineInfluences(state.graph, actorId);
    expect(influences.length).toBe(2);

    // Verify different agendas
    expect(influences[0].agendaId).toBe(agendas[0].id);
    expect(influences[1].agendaId).toBe(agendas[1].id);

    // Overlay should apply both influence drifts with appropriate decay
    const currentProfile = state.graph.getNode(actorId)!.properties!.axiologicalProfile;
    const overlay = buildValueOverlay(currentProfile, influences, state.tick + 5);

    // Values should be shifted from base
    expect(overlay).not.toEqual(currentProfile);
  });

  it('decay parameters vary by intervention type', () => {
    const interventionTypes = ['dream', 'persuade', 'deceive'] as const;

    for (const type of interventionTypes) {
      const result = applyInterventionEffects({
        graph: state.graph,
        interventionType: type,
        targetAgentId: actorId,
        sphere: 'mind',
        tick: state.tick,
        seed: 42,
      });
      expect(result.success).toBe(true);

      const influences = getDivineInfluences(state.graph, actorId);
      const influence = influences[influences.length - 1];

      const expected = DECAY_CONSTANTS[type];
      expect(influence.initialStrength).toBe(expected.initialStrength);
      expect(influence.maxDuration).toBe(expected.maxDuration);
      expect(influence.decayRate).toBe(expected.decayRate);
    }
  });
});
